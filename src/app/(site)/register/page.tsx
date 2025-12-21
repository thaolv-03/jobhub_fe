'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Container } from "@/components/layout/container";

const registerSchema = z.object({
    email: z.string().email({ message: "Email khA'ng h ¯œp l ¯Ø." }),
    password: z.string().min(8, { message: "M §-t kh §cu ph §œi cA3 A-t nh §t 8 kA« t ¯ñ, ch ¯ca ch ¯_ hoa, ch ¯_ th’ø ¯?ng, s ¯` vAÿ kA« t ¯ñ Ž` §úc bi ¯Øt." })
      .regex(/[A-Z]/, 'M §-t kh §cu ph §œi ch ¯ca A-t nh §t m ¯Tt ch ¯_ hoa.')
      .regex(/[a-z]/, 'M §-t kh §cu ph §œi ch ¯ca A-t nh §t m ¯Tt ch ¯_ th’ø ¯?ng.')
      .regex(/[0-9]/, 'M §-t kh §cu ph §œi ch ¯ca A-t nh §t m ¯Tt s ¯`.')
      .regex(/[\W_]/, 'M §-t kh §cu ph §œi ch ¯ca A-t nh §t m ¯Tt kA« t ¯ñ Ž` §úc bi ¯Øt.'),
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
                title: "Ž?ŽŸng kA« thAÿnh cA'ng!",
                description: "MAœ OTP Ž`Aœ Ž`’ø ¯œc g ¯-i Ž` §¨n email c ¯²a b §-n. Vui lA½ng ki ¯Ÿm tra vA½ xA­c th ¯ñc.",
            });
            router.push(`/verify-registration?email=${encodeURIComponent(values.email)}`);
        } catch (error) {
             const apiError = error as ApiError;
             if (apiError.status === 'RESOURCE_ALREADY_EXISTS') {
                form.setError('email', {
                    type: 'server',
                    message: 'Email nA½y Ž`Aœ t ¯"n t §­i trong h ¯Ø th ¯`ng.',
                });
             } else {
                toast({
                    variant: "destructive",
                    title: "Ž?ŽŸng kA« th §t b §­i",
                    description: apiError.message,
                });
             }
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <main className="flex-1 py-12">
      <Container className="flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">T §­o tAÿi kho §œn</CardTitle>
            <CardDescription>
              Ž?i ¯?n thA'ng tin Ž` ¯Ÿ b §_t Ž` §²u tAªm ki §¨m c’­ h ¯Ti m ¯>i.
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
                                <FormLabel>M §-t kh §cu</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} disabled={isLoading}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Ž?ŽŸng kA«
                    </Button>
                    <div className="mt-4 text-center text-sm">
                        Ž?Aœ cA3 tAÿi kho §œn?{" "}
                        <Link href="/login" className="underline">
                            Ž?ŽŸng nh §-p
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
