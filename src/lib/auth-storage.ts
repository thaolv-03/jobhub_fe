export const ACCESS_TOKEN_KEY = "jobhub_access_token";
export const ACCOUNT_KEY = "jobhub_account";
export const REFRESH_TOKEN_COOKIE_KEY = "jobhub_refresh_token";

let authFailed = false;

export function setAuthFailed(next: boolean) {
  authFailed = next;
}

export function getAuthFailed() {
  return authFailed;
}

export function setCookie(name: string, value: string, days: number = 7) {
  if (typeof window === "undefined") return;
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

export function getCookie(name: string): string | null {
  if (typeof window === "undefined") return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i += 1) {
    let c = ca[i];
    while (c.charAt(0) == " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function eraseCookie(name: string) {
  if (typeof window === "undefined") return;
  document.cookie = name + "=; Max-Age=-99999999; path=/; SameSite=Lax;";
}

export function saveAuthData(data: { accessToken: string; refreshToken: string; account: unknown }): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(data.account));
    setCookie(REFRESH_TOKEN_COOKIE_KEY, data.refreshToken);
    localStorage.removeItem("jobhub_consulting_submitted");
  }
  authFailed = false;
}

export function saveTokens(data: { accessToken: string; refreshToken: string }): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    setCookie(REFRESH_TOKEN_COOKIE_KEY, data.refreshToken);
  }
  authFailed = false;
}

export function getAccessToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
}

export function getRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    return getCookie(REFRESH_TOKEN_COOKIE_KEY);
  }
  return null;
}

export function getAccount<T = unknown>(): T | null {
  if (typeof window !== "undefined") {
    const accountJson = localStorage.getItem(ACCOUNT_KEY);
    return accountJson ? (JSON.parse(accountJson) as T) : null;
  }
  return null;
}

export function updateAccount<T = unknown>(updater: (account: T | null) => T | null): void {
  if (typeof window === "undefined") return;
  const current = getAccount<T>();
  const next = updater(current);
  if (next) {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(next));
  } else {
    localStorage.removeItem(ACCOUNT_KEY);
  }
}

export function clearAuthData(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(ACCOUNT_KEY);
    eraseCookie(REFRESH_TOKEN_COOKIE_KEY);
    localStorage.removeItem("jobhub_consulting_submitted");
  }
}
