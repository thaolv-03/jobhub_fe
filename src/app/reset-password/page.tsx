
'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/layout/navbar';
import { forgotPassword, verifyOtp, resetPassword as apiResetPassword } from '@/lib/auth';
import { ApiError } from '@/lib/api-client';

const emailSchema = z.object({
  email: z.string().email({ message: 'Email không hợp lệ.' }),
});

const otpSchema = z.object({
  otp: z.string().length(5, { message: 'OTP phải có 5 ký tự.' }),
});

const passwordSchema = z.object({
  newPassword: z.string().min(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự, chứa chữ hoa, chữ thường, số và ký tự đặc biệt.' })
      .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất một chữ hoa.')
      .regex(/[a-z]/, 'Mật khẩu phải chứa ít nhất một chữ thường.')
      .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất một số.')
      .regex(/[\W_]/, 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt.'),
});

type Step = 'email' | 'otp' | 'password';

function ResetPasswordFlow() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email');

  useEffect(() => {
    if (emailFromQuery) {
        setEmail(emailFromQuery);
        // Logic to determine step based on query params could be added here
        // For now, we manually progress, but a direct link could set the step.
    }
  }, [emailFromQuery]);


  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: emailFromQuery || '' },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: '' },
  });

  const handleEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    setIsLoading(true);
    try {
      await forgotPassword(values.email);
      setEmail(values.email);
      setStep('otp');
      toast({ title: 'Thành công', description: 'Mã OTP đã được gửi đến email của bạn.' });
    } catch (error) {
      const e = error as ApiError;
      toast({ variant: 'destructive', title: 'Thất bại', description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (values: z.infer<typeof otpSchema>) => {
    setIsLoading(true);
    try {
      await verifyOtp({ email, otp: values.otp });
      setStep('password');
      toast({ title: 'Thành công', description: 'Mã OTP đã được xác thực.' });
    } catch (error) {
      const e = error as ApiError;
      if (e.status === 'INVALID_OTP') {
        otpForm.setError('otp', { type: 'server', message: 'Mã OTP không chính xác.' });
      } else {
        toast({ variant: 'destructive', title: 'Thất bại', description: e.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    setIsLoading(true);
    try {
      await apiResetPassword({ email, newPassword: values.newPassword });
      toast({ title: 'Thành công', description: 'Mật khẩu của bạn đã được đặt lại. Vui lòng đăng nhập.' });
      router.push('/login');
    } catch (error) {
      const e = error as ApiError;
       if (e.status === 'OTP_NOT_VERIFIED') {
        toast({ variant: 'destructive', title: 'Lỗi', description: "OTP chưa được xác thực. Vui lòng thử lại từ đầu." });
        setStep('email');
      } else {
        toast({ variant: 'destructive', title: 'Thất bại', description: e.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      {step === 'email' && (
        <>
          <CardHeader>
            <CardTitle>Quên mật khẩu</CardTitle>
            <CardDescription>Nhập email của bạn để nhận mã xác thực.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                <FormField
                  control={emailForm.control}
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Gửi mã
                </Button>
              </form>
            </Form>
          </CardContent>
        </>
      )}

      {step === 'otp' && (
        <>
          <CardHeader>
            <CardTitle>Xác thực OTP</CardTitle>
            <CardDescription>Nhập mã OTP gồm 5 chữ số đã được gửi đến {email}.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
                <FormField
                  control={otpForm.control}
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
        </>
      )}

      {step === 'password' && (
        <>
          <CardHeader>
            <CardTitle>Đặt lại mật khẩu</CardTitle>
            <CardDescription>Nhập mật khẩu mới cho tài khoản của bạn.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu mới</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Đặt lại mật khẩu
                </Button>
              </form>
            </Form>
          </CardContent>
        </>
      )}
    </Card>
  );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 flex items-center justify-center py-12 px-4">
                <Suspense fallback={<div>Loading...</div>}>
                    <ResetPasswordFlow />
                </Suspense>
            </main>
        </div>
    );
}
