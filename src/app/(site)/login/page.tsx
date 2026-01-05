'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Script from "next/script";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Account } from "@/lib/auth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Container } from "@/components/layout/container";

// No Zod schema, validation is handled by the backend.
type LoginFormValues = {
  email: string;
  password: string;
};

type GoogleCredentialResponse = {
  credential?: string;
  select_by?: string;
};

type GoogleAccounts = {
  id: {
    initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
    renderButton: (parent: HTMLElement, options: { theme?: string; size?: string; width?: string; text?: string }) => void;
  };
};

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

export default function LoginPage() {
  const { toast } = useToast();
  const { login, googleLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const getRedirectPath = (account: Account): string => {
    const roles = account.roles?.map((r) => r.roleName) ?? [];
    if (roles.includes("ADMIN")) return "/admin/dashboard";
    if (roles.includes("RECRUITER")) return "/recruiter/dashboard";
    if (roles.includes("JOB_SEEKER")) return "/job-seeker/dashboard";
    return "/";
  };

  const resolveRedirectPath = (account: Account, nextUrl: string | null): string => {
    const roles = account.roles?.map((r) => r.roleName) ?? [];
    const isSafeInternal =
      typeof nextUrl === "string" && nextUrl.startsWith("/") && !nextUrl.startsWith("//");

    if (isSafeInternal) {
      if (nextUrl.startsWith("/admin")) {
        return roles.includes("ADMIN") ? nextUrl : getRedirectPath(account);
      }
      if (nextUrl.startsWith("/recruiter")) {
        const canAccess = roles.includes("RECRUITER") || roles.includes("RECRUITER_PENDING");
        return canAccess ? nextUrl : getRedirectPath(account);
      }
      if (nextUrl.startsWith("/job-seeker")) {
        return roles.includes("JOB_SEEKER") ? nextUrl : getRedirectPath(account);
      }
      return nextUrl;
    }

    return getRedirectPath(account);
  };

  const handleLoginSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const normalized = {
        email: values.email.trim().toLowerCase(),
        password: values.password,
      };
      const account = await login(normalized);
      toast({
        title: "Đăng nhập thành công!",
        description: "Chào mừng bạn đã trở lại.",
      });
      const nextUrl = searchParams.get("next");
      const redirectPath = resolveRedirectPath(account, nextUrl);
      router.push(redirectPath);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại.";
      toast({
        variant: "destructive",
        title: "Đăng nhập thất bại",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = async (response: GoogleCredentialResponse) => {
    if (!response.credential) {
      toast({
        variant: "destructive",
        title: "Đăng nhập thất bại",
        description: "Không nhận được token từ Google.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const account = await googleLogin({ idToken: response.credential });
      toast({
        title: "Đăng nhập thành công!",
        description: "Chào mừng bạn đã trở lại.",
      });
      const nextUrl = searchParams.get("next");
      const redirectPath = resolveRedirectPath(account, nextUrl);
      router.push(redirectPath);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại.";
      toast({
        variant: "destructive",
        title: "Đăng nhập thất bại",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.google?.accounts?.id) {
      setIsGoogleLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isGoogleLoaded || !googleClientId || !googleButtonRef.current) {
      return;
    }
    const googleAccounts = window.google?.accounts;
    if (!googleAccounts?.id) {
      return;
    }
    googleAccounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential,
    });
    googleButtonRef.current.innerHTML = "";
    googleAccounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      width: "100%",
      text: "continue_with",
    });
  }, [googleClientId, isGoogleLoaded]);

  return (
    <main className="flex-1 py-12">
      <Script src="https://accounts.google.com/gsi/client" onLoad={() => setIsGoogleLoaded(true)} />
      <Container className="flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Đăng nhập tài khoản</CardTitle>
            <CardDescription>Chào mừng trở lại! Vui lòng nhập thông tin của bạn.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleLoginSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="username@gmail.com" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <FormLabel>Mật khẩu</FormLabel>
                        <Link href="/reset-password" className="ml-auto inline-block text-sm underline">
                          Quên mật khẩu?
                        </Link>
                      </div>
                      <FormControl>
                        <Input type="password" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Đăng nhập
                </Button>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  <span>Hoặc</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                {googleClientId ? (
                  <div className="space-y-2">
                    <div ref={googleButtonRef} className={isLoading ? "pointer-events-none opacity-70" : ""} />
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                    Chưa cấu hình Google Client ID. Hãy thêm NEXT_PUBLIC_GOOGLE_CLIENT_ID vào .env.local.
                  </div>
                )}
                <div className="mt-4 text-center text-sm">
                  Chưa có tài khoản?{" "}
                  <Link href="/register" className="underline">
                    Đăng ký
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
