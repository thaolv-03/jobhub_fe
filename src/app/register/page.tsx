
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/layout/navbar";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { register } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { useState } from "react";
import { Loader2 } from "lucide-react";


const registerSchema = z.object({
    email: z.string().email({ message: "Email không hợp lệ." }),
    password: z.string().min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự, chứa chữ hoa, chữ thường, số và ký tự đặc biệt." })
      .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất một chữ hoa.')
      .regex(/[a-z]/, 'Mật khẩu phải chứa ít nhất một chữ thường.')
      .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất một số.')
      .regex(/[\W_]/, 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt.'),
});


export default function RegisterPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const handleRegisterSubmit = async (values: z.infer<typeof registerSchema>) => {
        setIsLoading(true);
        try {
            await register(values);
            toast({
                title: "Đăng ký thành công!",
                description: "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra và xác thực.",
            });
            router.push(`/verify-registration?email=${encodeURIComponent(values.email)}`);
        } catch (error) {
             const apiError = error as ApiError;
             if (apiError.status === 'RESOURCE_ALREADY_EXISTS') {
                form.setError('email', {
                    type: 'server',
                    message: 'Email này đã tồn tại trong hệ thống.',
                });
             } else {
                toast({
                    variant: "destructive",
                    title: "Đăng ký thất bại",
                    description: apiError.message,
                });
             }
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
            <CardTitle className="text-2xl">Tạo tài khoản</CardTitle>
            <CardDescription>
              Điền thông tin để bắt đầu tìm kiếm cơ hội mới.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleRegisterSubmit)} className="space-y-4">
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
                                <FormLabel>Mật khẩu</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} disabled={isLoading}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Đăng ký
                    </Button>
                    <div className="mt-4 text-center text-sm">
                        Đã có tài khoản?{" "}
                        <Link href="/login" className="underline">
                            Đăng nhập
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
