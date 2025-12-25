
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ApiError } from '@/lib/api-client';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

type CompanySuggestion = {
  companyId: number;
  companyName: string;
};

const upgradeSchema = z.object({
  companyId: z.number().optional(),
  companyName: z.string().min(1, { message: 'Tên công ty không được để trống.' }),
  location: z.string().optional(),
  website: z.string().url({ message: 'URL website không hợp lệ.' }).optional().or(z.literal('')),
  position: z.string().min(1, { message: 'Vị trí của bạn không được để trống.' }),
  phone: z.string().regex(/^[0-9]{10,11}$/, { message: 'Số điện thoại không hợp lệ.' }),
}).superRefine((values, ctx) => {
  if (!values.companyId && (!values.location || values.location.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['location'],
      message: 'Location is required when creating a new company.',
    });
  }
});

type UpgradeFormValues = z.infer<typeof upgradeSchema>;

export default function UpgradeRecruiterPage() {
  const { upgradeToRecruiter } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const form = useForm<UpgradeFormValues>({
    resolver: zodResolver(upgradeSchema),
    defaultValues: {
      companyId: undefined,
      companyName: '',
      location: '',
      website: '',
      position: '',
      phone: '',
    },
  });

  const companyName = form.watch('companyName');

  useEffect(() => {
    const trimmed = (companyName || '').trim();
    const selectedId = form.getValues('companyId');
    if (selectedId) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsFetchingSuggestions(false);
      return;
    }
    if (trimmed.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsFetchingSuggestions(false);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        setIsFetchingSuggestions(true);
        setShowSuggestions(true);
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const response = await fetchWithAuth<CompanySuggestion[]>(
          `${baseUrl}/api/companies/suggestions?q=${encodeURIComponent(trimmed)}`,
          { method: 'GET', parseAs: 'raw' }
        );
        const nextSuggestions = response || [];
        setSuggestions(nextSuggestions);
        setShowSuggestions(nextSuggestions.length > 0);
      } catch (error) {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsFetchingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [companyName, form]);

  useEffect(() => {
    const currentId = form.getValues('companyId');
    if (currentId && selectedCompanyName && companyName !== selectedCompanyName) {
      form.setValue('companyId', undefined);
      setSelectedCompanyName(null);
    }
  }, [companyName, form, selectedCompanyName]);

  const handleUpgradeSubmit = async (values: UpgradeFormValues) => {
    if (isSubmittingRef.current || isLoading) {
      return;
    }
    isSubmittingRef.current = true;
    setIsLoading(true);
    try {
      try {
        const companySource = values.companyId ? 'existing' : 'new';
        localStorage.setItem('jobhub_upgrade_company_source', companySource);
        localStorage.removeItem('jobhub_consulting_submitted');
      } catch (storageError) {
        console.error('Failed to store company source', storageError);
      }
      await upgradeToRecruiter(values);
      toast({
        title: 'Yêu cầu đã được gửi!',
        description: 'Yêu cầu nâng cấp tài khoản của bạn đang chờ phê duyệt.',
      });
      router.push('/recruiter/dashboard/consulting-need');
      router.refresh(); // Force reload to update layout logic
    } catch (error) {
      const e = error as ApiError;
      toast({
        variant: 'destructive',
        title: 'Gửi yêu cầu thất bại',
        description: e.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.',
      });
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-113px)] flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-8">
        <div className="w-full max-w-2xl">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-primary">Nâng cấp tài khoản Nhà tuyển dụng</CardTitle>
                    <CardDescription>
                        Cung cấp thông tin công ty để bắt đầu tìm kiếm ứng viên tài năng trên JobHub.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleUpgradeSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                                <FormItem className="relative">
                                <FormLabel>Tên công ty</FormLabel>
                                <FormControl>
                                    <Input
                                      placeholder="Ví dụ: Công ty Cổ phần JobHub"
                                      {...field}
                                      disabled={isLoading}
                                      onBlur={() => setShowSuggestions(false)}
                                    />
                                </FormControl>
                                {showSuggestions && (
                                  <div className="absolute z-20 mt-2 w-full rounded-md border bg-background shadow-lg">
                                    {isFetchingSuggestions && (
                                      <div className="px-3 py-2 text-xs text-muted-foreground">
                                        Loading suggestions...
                                      </div>
                                    )}
                                    {!isFetchingSuggestions && suggestions.length === 0 && (
                                      <div className="px-3 py-2 text-xs text-muted-foreground">
                                        No suggestions found.
                                      </div>
                                    )}
                                    {!isFetchingSuggestions && suggestions.length > 0 && (
                                      <ul className="max-h-56 overflow-auto py-1">
                                        {suggestions.map((item) => (
                                          <li key={item.companyId}>
                                            <button
                                              type="button"
                                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                              onMouseDown={(event) => event.preventDefault()}
                                              onClick={() => {
                                                form.setValue('companyName', item.companyName, {
                                                  shouldValidate: true,
                                                  shouldDirty: true,
                                                });
                                                form.setValue('companyId', item.companyId, {
                                                  shouldValidate: true,
                                                  shouldDirty: true,
                                                });
                                                setSelectedCompanyName(item.companyName);
                                                setShowSuggestions(false);
                                              }}
                                            >
                                              {item.companyName}
                                            </button>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                )}
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Địa chỉ công ty</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ví dụ: Hà Nội, Việt Nam" {...field} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Website</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://congtycuaban.com" {...field} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                           <FormField
                                control={form.control}
                                name="position"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Chức vụ của bạn</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ví dụ: Trưởng phòng Nhân sự" {...field} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Số điện thoại công ty</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Số điện thoại để ứng viên liên hệ" {...field} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={isLoading || form.formState.isSubmitting}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Gửi yêu cầu nâng cấp
                        </Button>
                    </form>
                    </Form>
                </CardContent>
                <CardFooter className="text-center text-xs text-muted-foreground">
                    Bằng việc tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư của JobHub.
                </CardFooter>
            </Card>
        </div>
    </main>
  );
}

