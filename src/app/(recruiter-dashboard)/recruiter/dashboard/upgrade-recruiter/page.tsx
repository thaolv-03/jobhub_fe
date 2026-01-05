'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api-client';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const MAX_LOGO_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type CompanySuggestion = {
  companyId: number;
  companyName: string;
};

const TEXT = {
  title: "\u0110\u0103ng k\u00fd t\u00e0i kho\u1ea3n Nh\u00e0 tuy\u1ec3n d\u1ee5ng",
  subtitle: "Cung c\u1ea5p th\u00f4ng tin c\u00f4ng ty \u0111\u1ec3 b\u1eaft \u0111\u1ea7u t\u00ecm ki\u1ebfm \u1ee9ng vi\u00ean t\u00e0i n\u0103ng tr\u00ean JobHub.",
  companyNameLabel: "T\u00ean c\u00f4ng ty",
  companyNamePlaceholder: "V\u00ed d\u1ee5: C\u00f4ng ty C\u1ed5 ph\u1ea7n JobHub",
  locationLabel: "\u0110\u1ecba ch\u1ec9 c\u00f4ng ty",
  locationPlaceholder: "V\u00ed d\u1ee5: H\u00e0 N\u1ed9i, Vi\u1ec7t Nam",
  websiteLabel: "Website",
  websitePlaceholder: "https://congtycuaban.com",
  introductionLabel: "Gi\u1edbi thi\u1ec7u v\u1ec1 c\u00f4ng ty",
  introductionPlaceholder: "M\u00f4 t\u1ea3 ng\u1eafn v\u1ec1 c\u00f4ng ty, l\u0129nh v\u1ef1c ho\u1ea1t \u0111\u1ed9ng, quy m\u00f4...",
  positionLabel: "Ch\u1ee9c v\u1ee5 c\u1ee7a b\u1ea1n",
  positionPlaceholder: "V\u00ed d\u1ee5: Tr\u01b0\u1edfng ph\u00f2ng Nh\u00e2n s\u1ef1",
  phoneLabel: "S\u1ed1 \u0111i\u1ec7n tho\u1ea1i c\u00f4ng ty",
  phonePlaceholder: "S\u1ed1 \u0111i\u1ec7n tho\u1ea1i \u0111\u1ec3 \u1ee9ng vi\u00ean li\u00ean h\u1ec7",
  submitLabel: "G\u1eedi y\u00eau c\u1ea7u \u0111\u0103ng k\u00fd",
  footer: "B\u1eb1ng vi\u1ec7c ti\u1ebfp t\u1ee5c, b\u1ea1n \u0111\u1ed3ng \u00fd v\u1edbi \u0110i\u1ec1u kho\u1ea3n d\u1ecbch v\u1ee5 v\u00e0 Ch\u00ednh s\u00e1ch quy\u1ec1n ri\u00eang t\u01b0 c\u1ee7a JobHub.",
  suggestionLoading: "\u0110ang t\u1ea3i g\u1ee3i \u00fd...",
  suggestionEmpty: "Kh\u00f4ng t\u00ecm th\u1ea5y g\u1ee3i \u00fd.",
  toastSuccessTitle: "Y\u00eau c\u1ea7u \u0111\u00e3 \u0111\u01b0\u1ee3c g\u1eedi!",
  toastSuccessDescription: "Y\u00eau c\u1ea7u \u0111\u0103ng k\u00fd t\u00e0i kho\u1ea3n c\u1ee7a b\u1ea1n \u0111ang ch\u1edd ph\u00ea duy\u1ec7t.",
  toastErrorTitle: "G\u1eedi y\u00eau c\u1ea7u th\u1ea5t b\u1ea1i",
  toastErrorFallback: "\u0110\u00e3 c\u00f3 l\u1ed7i x\u1ea3y ra. Vui l\u00f2ng th\u1eed l\u1ea1i.",
  logoLabel: "\u1ea2nh c\u00f4ng ty",
  logoHint: "H\u1ed7 tr\u1ee3 JPG, PNG, WEBP. T\u1ed1i \u0111a 10MB.",
  logoEmpty: "Logo",
  logoTypeError: "Ch\u1ec9 h\u1ed7 tr\u1ee3 JPG, PNG, WEBP.",
  logoSizeError: "Dung l\u01b0\u1ee3ng \u1ea3nh t\u1ed1i \u0111a 10MB.",
  logoUploadError: "T\u1ea3i \u1ea3nh c\u00f4ng ty th\u1ea5t b\u1ea1i.",
  validationCompanyName: "T\u00ean c\u00f4ng ty kh\u00f4ng \u0111\u01b0\u1ee3c \u0111\u1ec3 tr\u1ed1ng.",
  validationWebsite: "URL website kh\u00f4ng h\u1ee3p l\u1ec7.",
  validationIntroduction: "Gi\u1edbi thi\u1ec7u c\u00f4ng ty kh\u00f4ng v\u01b0\u1ee3t qu\u00e1 1000 k\u00fd t\u1ef1.",
  validationPosition: "V\u1ecb tr\u00ed c\u1ee7a b\u1ea1n kh\u00f4ng \u0111\u01b0\u1ee3c \u0111\u1ec3 tr\u1ed1ng.",
  validationPhone: "S\u1ed1 \u0111i\u1ec7n tho\u1ea1i kh\u00f4ng h\u1ee3p l\u1ec7.",
  validationLocationRequired: "\u0110\u1ecba ch\u1ec9 c\u00f4ng ty l\u00e0 b\u1eaft bu\u1ed9c khi \u0111\u0103ng k\u00fd c\u00f4ng ty m\u1edbi.",
};

const upgradeSchema = z
  .object({
    companyId: z.number().optional(),
    companyName: z.string().min(1, { message: TEXT.validationCompanyName }),
    location: z.string().optional(),
    website: z.string().url({ message: TEXT.validationWebsite }).optional().or(z.literal('')),
    introduction: z.string().max(1000, { message: TEXT.validationIntroduction }).optional(),
    position: z.string().min(1, { message: TEXT.validationPosition }),
    phone: z.string().regex(/^[0-9]{10,11}$/, { message: TEXT.validationPhone }),
  })
  .superRefine((values, ctx) => {
    if (!values.companyId && (!values.location || values.location.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['location'],
        message: TEXT.validationLocationRequired,
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
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const form = useForm<UpgradeFormValues>({
    resolver: zodResolver(upgradeSchema),
    defaultValues: {
      companyId: undefined,
      companyName: '',
      location: '',
      website: '',
      introduction: '',
      position: '',
      phone: '',
    },
  });

  const companyName = form.watch('companyName');

  useEffect(() => {
    return () => {
      if (companyLogoPreview) {
        URL.revokeObjectURL(companyLogoPreview);
      }
    };
  }, [companyLogoPreview]);

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

  const padImageToSquare = (file: File) =>
    new Promise<File>((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        const size = Math.max(img.width, img.height);
        const dx = Math.floor((size - img.width) / 2);
        const dy = Math.floor((size - img.height) / 2);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, dx, dy, img.width, img.height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              resolve(file);
              return;
            }
            const nextFile = new File([blob], file.name, {
              type: blob.type || file.type,
              lastModified: file.lastModified,
            });
            resolve(nextFile);
          },
          file.type || 'image/png',
          0.92
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      img.src = objectUrl;
    });

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: TEXT.logoTypeError,
      });
      input.value = '';
      return;
    }
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      toast({
        variant: 'destructive',
        title: TEXT.logoSizeError,
      });
      input.value = '';
      return;
    }

    const paddedFile = await padImageToSquare(file);
    if (paddedFile.size > MAX_LOGO_SIZE_BYTES) {
      toast({
        variant: 'destructive',
        title: TEXT.logoSizeError,
      });
      input.value = '';
      return;
    }

    if (companyLogoPreview) {
      URL.revokeObjectURL(companyLogoPreview);
    }
    const previewUrl = URL.createObjectURL(paddedFile);
    setCompanyLogoFile(paddedFile);
    setCompanyLogoPreview(previewUrl);
  };

  const uploadCompanyAvatar = async (companyId: number, file: File) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const formData = new FormData();
    formData.append('avatar', file);

    await fetchWithAuth(`${baseUrl}/api/companies/${companyId}/avatar`, {
      method: 'PATCH',
      body: formData,
      parseAs: 'api',
    });
  };

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
      const upgradeResponse = await upgradeToRecruiter(values);
      const resolvedCompanyId = upgradeResponse?.companyId ?? values.companyId;
      if (companyLogoFile && resolvedCompanyId) {
        try {
          await uploadCompanyAvatar(resolvedCompanyId, companyLogoFile);
        } catch (error) {
          const apiError = error as ApiError;
          toast({
            variant: 'destructive',
            title: TEXT.logoUploadError,
            description: apiError?.message,
          });
        }
      }
      toast({
        title: TEXT.toastSuccessTitle,
        description: TEXT.toastSuccessDescription,
      });
      router.push('/recruiter/dashboard/consulting-need');
      router.refresh();
    } catch (error) {
      const e = error as ApiError;
      toast({
        variant: 'destructive',
        title: TEXT.toastErrorTitle,
        description: e.message || TEXT.toastErrorFallback,
      });
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-113px)] flex-col items-center justify-center gap-4 bg-slate-50 p-4 md:gap-8 md:p-8 dark:bg-slate-950">
      <div className="w-full max-w-2xl">
        <Card className="border-border/60 bg-background/90 shadow-sm backdrop-blur dark:bg-slate-950/70">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary dark:text-emerald-300">{TEXT.title}</CardTitle>
            <CardDescription className="dark:text-slate-300">{TEXT.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpgradeSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <FormLabel className="text-foreground dark:text-slate-200">{TEXT.logoLabel}</FormLabel>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="h-20 w-20 overflow-hidden rounded-lg border border-border/60 bg-muted dark:bg-slate-900">
                      {companyLogoPreview ? (
                        <img src={companyLogoPreview} alt="Company logo preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground dark:text-slate-400">
                          {TEXT.logoEmpty}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleLogoChange}
                        className="bg-white text-slate-800 file:text-slate-700 file:bg-slate-100 file:border-slate-200 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70 dark:file:text-slate-100 dark:file:bg-slate-800/70 dark:file:border-slate-700"
                      />
                      <p className="text-xs text-muted-foreground dark:text-slate-400">{TEXT.logoHint}</p>
                    </div>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel className="text-foreground dark:text-slate-200">{TEXT.companyNameLabel}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={TEXT.companyNamePlaceholder}
                          {...field}
                          disabled={isLoading}
                          onBlur={() => setShowSuggestions(false)}
                          className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                        />
                      </FormControl>
                      {showSuggestions && (
                        <div className="absolute z-20 mt-2 w-full rounded-md border border-border/60 bg-background shadow-lg dark:border-slate-800 dark:bg-slate-950">
                          {isFetchingSuggestions && (
                            <div className="px-3 py-2 text-xs text-muted-foreground">{TEXT.suggestionLoading}</div>
                          )}
                          {!isFetchingSuggestions && suggestions.length === 0 && (
                            <div className="px-3 py-2 text-xs text-muted-foreground">{TEXT.suggestionEmpty}</div>
                          )}
                          {!isFetchingSuggestions && suggestions.length > 0 && (
                            <ul className="max-h-56 overflow-auto py-1">
                              {suggestions.map((item) => (
                                <li key={item.companyId}>
                                  <button
                                    type="button"
                                    className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-muted dark:text-slate-100 dark:hover:bg-slate-900"
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
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground dark:text-slate-200">{TEXT.locationLabel}</FormLabel>
                      <FormControl>
                          <Input
                            placeholder={TEXT.locationPlaceholder}
                            {...field}
                            disabled={isLoading}
                            className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                          />
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
                      <FormLabel className="text-foreground dark:text-slate-200">{TEXT.websiteLabel}</FormLabel>
                      <FormControl>
                          <Input
                            placeholder={TEXT.websitePlaceholder}
                            {...field}
                            disabled={isLoading}
                            className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                          />
                      </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="introduction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground dark:text-slate-200">{TEXT.introductionLabel}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={TEXT.introductionPlaceholder}
                          {...field}
                          disabled={isLoading}
                          className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground dark:text-slate-200">{TEXT.positionLabel}</FormLabel>
                      <FormControl>
                          <Input
                            placeholder={TEXT.positionPlaceholder}
                            {...field}
                            disabled={isLoading}
                            className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                          />
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
                      <FormLabel className="text-foreground dark:text-slate-200">{TEXT.phoneLabel}</FormLabel>
                      <FormControl>
                          <Input
                            placeholder={TEXT.phonePlaceholder}
                            {...field}
                            disabled={isLoading}
                            className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                          />
                      </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading || form.formState.isSubmitting}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {TEXT.submitLabel}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="text-center text-xs text-muted-foreground dark:text-slate-400">
            {TEXT.footer}
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
