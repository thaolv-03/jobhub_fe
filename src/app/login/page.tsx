
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/layout/navbar";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Account } from "@/lib/auth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


// No Zod schema, validation is handled by the backend.
type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
    const { toast } = useToast();
    const { login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<LoginFormValues>({
        defaultValues: {
            email: "",
            password: "",
        },
    });
    
    const getRedirectPath = (account: Account): string => {
        const roles = account.roles.map(r => r.roleName);
        if (roles.includes('ADMIN')) return '/employer/dashboard'; // Assuming Admin uses employer dash for now
        if (roles.includes('RECRUITER')) return '/employer/dashboard';
        if (roles.includes('JOB_SEEKER')) return '/candidate/dashboard';
        return '/';
    }

    const handleLoginSubmit = async (values: LoginFormValues) => {
        setIsLoading(true);
        try {
            const account = await login(values);
            toast({
              title: "Đăng nhập thành công!",
              description: "Chào mừng bạn đã trở lại.",
            });
            const nextUrl = searchParams.get('next');
            const redirectPath = nextUrl || getRedirectPath(account);
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Đăng nhập tài khoản</CardTitle>
            <CardDescription>
              Chào mừng trở lại! Vui lòng nhập thông tin của bạn.
            </CardDescription>
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
                                <Input placeholder="email@example.com" {...field} disabled={isLoading} />
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
                                    <Input type="password" {...field} disabled={isLoading}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Đăng nhập
                    </Button>
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
      </main>
    </div>
  );
}
