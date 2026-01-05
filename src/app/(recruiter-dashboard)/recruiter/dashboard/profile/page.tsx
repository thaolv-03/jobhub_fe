"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ApiError, apiRequest } from "@/lib/api-client";
import { fetchRecruiterProfile, uploadRecruiterAvatar, type RecruiterProfile } from "@/lib/recruiter-profile";
import { updateAccount } from "@/lib/auth-storage";
import { useAuth } from "@/hooks/use-auth";
import { Upload } from "lucide-react";

type CompanyResponse = {
  companyId: number;
  companyName: string;
  location?: string | null;
  website?: string | null;
  avatarUrl?: string | null;
};

const profileSchema = z.object({
  companyName: z.string().min(1, { message: "Vui lòng nhập tên công ty." }),
  position: z.string().optional(),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const MAX_AVATAR_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png"];

export default function RecruiterProfilePage() {
  const { toast } = useToast();
  const { reload } = useAuth();
  const [profile, setProfile] = React.useState<RecruiterProfile | null>(null);
  const [company, setCompany] = React.useState<CompanyResponse | null>(null);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState<string | null>(null);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      companyName: "",
      position: "",
      phone: "",
    },
  });

  const fetchCompany = React.useCallback(async (companyId?: number | null) => {
    if (!companyId) return null;
    const response = await apiRequest<CompanyResponse>(`/api/companies/${companyId}`, {
      method: "GET",
    });
    return response.data ?? null;
  }, []);

  const loadProfile = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const recruiterProfile = await fetchRecruiterProfile();
      setProfile(recruiterProfile);
      setAvatarUrl(recruiterProfile?.avatarUrl ?? null);
      const companyData = await fetchCompany(recruiterProfile?.companyId ?? null);
      setCompany(companyData);
      form.reset({
        companyName: companyData?.companyName ?? recruiterProfile?.companyName ?? "",
        position: recruiterProfile?.position ?? "",
        phone: recruiterProfile?.phone ?? "",
      });
    } catch (error) {
      toast({
        title: "Không thể tải hồ sơ",
        description: "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchCompany, form, toast]);

  React.useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const validateAvatarFile = (file: File): string | null => {
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      return "Chỉ hỗ trợ ảnh JPG hoặc PNG.";
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      return "Dung lượng ảnh tối đa 10MB.";
    }
    return null;
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const errorMessage = validateAvatarFile(file);
    if (errorMessage) {
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
      event.target.value = "";
      setAvatarFile(null);
      setAvatarPreviewUrl(null);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarPreviewUrl(previewUrl);
  };

  React.useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ảnh để tải lên.",
        variant: "destructive",
      });
      return;
    }
    const errorMessage = validateAvatarFile(avatarFile);
    if (errorMessage) {
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }
    try {
      setIsAvatarUploading(true);
      const updated = await uploadRecruiterAvatar(avatarFile);
      setAvatarUrl(updated.avatarUrl ?? null);
      updateAccount((current) => {
        if (!current || typeof current !== "object") return current;
        return { ...(current as any), avatarUrl: updated.avatarUrl ?? null };
      });
      reload();
      await loadProfile();
      setAvatarFile(null);
      setAvatarPreviewUrl(null);
      toast({ title: "Thành công", description: "Ảnh đại diện đã được cập nhật." });
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      const description =
        apiError?.status === "IMAGE_SIZE_EXCEEDED"
          ? "Dung lượng ảnh vượt qua giới hạn hệ thống."
          : apiError?.message ?? "Vui lòng thử lại sau.";
      toast({
        title: "Cập nhật thất bại",
        description,
        variant: "destructive",
      });
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleProfileSubmit = async (_values: ProfileFormValues) => {
    toast({
      title: "Không thể lưu",
      description: "Backend chưa có API cập nhật vị trí và số điện thoại.",
      variant: "destructive",
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="grid items-stretch gap-6 md:grid-cols-[400px,1fr]">
        <Card className="h-full flex flex-col border-border/60 dark:border-slate-800 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="dark:text-slate-100">Ảnh đại diện nhà tuyển dụng</CardTitle>
            <CardDescription className="dark:text-slate-300">Cập nhật ảnh đại diện nhà tuyển dụng.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div className="flex flex-1 items-center justify-center">
              <Avatar className="h-36 w-36">
                <AvatarImage
                  src={avatarPreviewUrl ?? avatarUrl ?? ""}
                  alt="Recruiter avatar"
                  className="object-cover"
                />
                <AvatarFallback>RH</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex flex-col gap-2 pb-2">
              <Button asChild variant="outline" className="w-full dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
                <Label htmlFor="recruiter-avatar-upload" className="w-full cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Chọn ảnh
                  <input
                    id="recruiter-avatar-upload"
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png"
                    onChange={handleAvatarChange}
                  />
                </Label>
              </Button>
              <Button type="button" onClick={handleAvatarUpload} disabled={isAvatarUploading || !avatarFile} className="w-full">
                {isAvatarUploading ? "Đang tải..." : "Lưu ảnh"}
              </Button>
              <p className="text-xs text-muted-foreground text-center dark:text-slate-400">Tối đa 10MB. JPG, PNG.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full border-border/60 dark:border-slate-800 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="dark:text-slate-100">Thông tin nhà tuyển dụng</CardTitle>
            <CardDescription className="dark:text-slate-300">Quản lý thông tin hồ sơ nhà tuyển dụng.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center gap-4 rounded-lg border border-border/60 p-4 dark:border-slate-800">
              <Avatar className="h-16 w-16">
                <AvatarImage src={company?.avatarUrl ?? ""} alt="Company avatar" className="object-cover" />
                <AvatarFallback>CO</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Avatar công ty</p>
                <p className="text-xs text-muted-foreground dark:text-slate-400">Chỉ hiển thị, không thể chỉnh sửa.</p>
              </div>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-900 dark:text-slate-200">Tên công ty</FormLabel>
                      <FormControl>
                        <Input {...field} disabled readOnly className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-900 dark:text-slate-200">Vị trí</FormLabel>
                        <FormControl>
                        <Input {...field} disabled={isLoading} className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70" />
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
                        <FormLabel className="text-slate-900 dark:text-slate-200">Số điện thoại</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={isSaving || isLoading}>
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
