
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/layout/navbar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { verifyRegistration } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const verifySchema = z.object({
    email: z.string().email(),
    otp: z.string().min(5, { message: "OTP phải có 5 ký tự." }).max(5, { message: "OTP phải có 5 ký tự."}),
});

function VerifyRegistrationForm() {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const emailFromQuery = searchParams.get('email');
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof verifySchema>>({
        resolver: zodResolver(verifySchema),
        defaultValues: {
            email: emailFromQuery || "",
            otp: "",
        },
    });
    
    useEffect(() => {
        if (emailFromQuery) {
            form.setValue('email', emailFromQuery);
        }
    }, [emailFromQuery, form]);

    const handleVerifySubmit = async (values: z.infer<typeof verifySchema>) => {
        setIsLoading(true);
        try {
            await verifyRegistration(values);
            toast({
                title: "Xác thực thành công!",
                description: "Tài khoản của bạn đã được đăng ký. Vui lòng đăng nhập.",
            });
            router.push('/login');
        } catch (error) {
            const apiError = error as ApiError;
            if(apiError.status === "INVALID_OTP") {
                form.setError("otp", { type: "server", message: "Mã OTP không hợp lệ hoặc đã hết hạn." });
            } else {
                toast({
                    variant: "destructive",
                    title: "Xác thực thất bại",
                    description: apiError.message,
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Xác thực tài khoản</CardTitle>
            <CardDescription>
              Chúng tôi đã gửi một mã OTP đến email của bạn. Vui lòng nhập mã vào bên dưới.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleVerifySubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input {...field} disabled />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="otp"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mã OTP</FormLabel>
                                <FormControl>
                                    <Input placeholder="12345" {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Xác thực
                    </Button>
                </form>
            </Form>
          </CardContent>
        </Card>
    );
}

export default function VerifyRegistrationPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Suspense fallback={<div>Đang tải...</div>}>
            <VerifyRegistrationForm />
        </Suspense>
      </main>
    </div>
  );
}
