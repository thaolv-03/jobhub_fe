
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Account, getAccount, getAccessToken, clearAuthData, login as apiLogin, LoginRequest, logout as apiLogout, RoleName, upgradeToRecruiter as apiUpgradeToRecruiter, UpgradeRecruiterRequest } from '@/lib/auth';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  account: Account | null;
  accessToken: string | null;
  roles: RoleName[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<Account>;
  logout: () => Promise<void>;
  reload: () => void;
  upgradeToRecruiter: (payload: UpgradeRecruiterRequest) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuthState = useCallback(() => {
    setIsLoading(true);
    try {
        const storedAccount = getAccount();
        const token = getAccessToken();
        if (storedAccount && token) {
            setAccount(storedAccount);
            setAccessToken(token);
        } else {
            setAccount(null);
            setAccessToken(null);
        }
    } catch (error) {
        console.error("Failed to parse auth data from storage", error);
        clearAuthData();
        setAccount(null);
        setAccessToken(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAuthState();
    
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'jobhub_account' || event.key === 'jobhub_access_token') {
            checkAuthState();
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuthState]);

  const handleLogin = async (credentials: LoginRequest): Promise<Account> => {
    const account = await apiLogin(credentials);
    checkAuthState(); // Reload state from storage to ensure it's fresh
    return account;
  };

  const handleLogout = async () => {
    try {
        await apiLogout();
    } catch (error) {
        console.error("API logout failed, clearing client-side data anyway.", error);
    } finally {
        clearAuthData();
        setAccount(null);
        setAccessToken(null);
        // Redirect to a public page after logout
        if(pathname.startsWith('/job-seeker') || pathname.startsWith('/recruiter')) {
            router.push('/');
        }
    }
  };

  const handleUpgrade = async (payload: UpgradeRecruiterRequest) => {
    await apiUpgradeToRecruiter(payload);
    checkAuthState(); // Reload state to get new roles
  };
  
  const roles = account?.roles.map(r => r.roleName) || [];

  return (
    <AuthContext.Provider
      value={{
        account,
        accessToken,
        roles,
        isAuthenticated: !!account && !!accessToken,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        reload: checkAuthState,
        upgradeToRecruiter: handleUpgrade,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

