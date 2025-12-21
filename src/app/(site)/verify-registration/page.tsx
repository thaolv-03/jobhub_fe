'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Container } from "@/components/layout/container";

const verifySchema = z.object({
    email: z.string().email(),
    otp: z.string().min(6, { message: "OTP ph §œi cA3 6 kA« t ¯ñ." }).max(6, { message: "OTP ph §œi cA3 6 kA« t ¯ñ."}),
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
                title: "XA­c th ¯ñc thAÿnh cA'ng!",
                description: "TAÿi kho §œn c ¯²a b §-n Ž`Aœ Ž`’ø ¯œc Ž`ŽŸng kA«. Vui lA½ng Ž`ŽŸng nh §-p.",
            });
            router.push('/login');
        } catch (error) {
            const apiError = error as ApiError;
            if(apiError.status === "INVALID_OTP") {
                form.setError("otp", { type: "server", message: "MAœ OTP khA'ng h ¯œp l ¯Ø ho §úc Ž`Aœ h §¨t h §­n." });
            } else {
                toast({
                    variant: "destructive",
                    title: "XA­c th ¯ñc th §t b §­i",
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
            <CardTitle className="text-2xl">XA­c th ¯ñc tAÿi kho §œn</CardTitle>
            <CardDescription>
              ChA§ng tA'i Ž`Aœ g ¯-i m ¯Tt mAœ OTP Ž` §¨n email c ¯²a b §-n. Vui lA½ng nh §-p mAœ vAÿo bA¦n d’ø ¯>i.
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
                                <FormLabel>MAœ OTP</FormLabel>
                                <FormControl>
                                    <Input placeholder="123456" {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        XA­c th ¯ñc
                    </Button>
                </form>
            </Form>
          </CardContent>
        </Card>
    );
}

export default function VerifyRegistrationPage() {
  return (
    <main className="flex-1 py-12">
      <Container className="flex items-center justify-center">
        <Suspense fallback={<div>Ž?ang t §œi...</div>}>
            <VerifyRegistrationForm />
        </Suspense>
      </Container>
    </main>
  );
}
