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
  companyName: z.string().min(1, { message: "Vui lòng nhập tên công ty." }),
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
      title: "Khong the luu",
      description: "Backend chua co API cap nhat vi tri va so dien thoai.",
      variant: "destructive",
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="grid items-start gap-6 lg:grid-cols-[320px,1fr]">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Ảnh đại diện nhà tuyển dụng</CardTitle>
            <CardDescription>Cập nhật ảnh đại diện nhà tuyển dụng.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={avatarPreviewUrl ?? avatarUrl ?? ""}
                  alt="Recruiter avatar"
                  className="object-cover"
                />
                <AvatarFallback>RH</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full">
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
              <p className="text-xs text-muted-foreground text-center">Tối đa 10MB. JPG, PNG.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Thông tin nhà tuyển dụng</CardTitle>
            <CardDescription>Quản lý thông tin hồ sơ nhà tuyển dụng.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center gap-4 rounded-lg border p-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={company?.avatarUrl ?? ""} alt="Company avatar" className="object-cover" />
                <AvatarFallback>CO</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium">Avatar cong ty</p>
                <p className="text-xs text-muted-foreground">Chi hien thi, khong the chinh sua.</p>
              </div>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên công ty</FormLabel>
                      <FormControl>
                        <Input {...field} disabled readOnly />
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
                        <FormLabel>Vị trí</FormLabel>
                        <FormControl>
                        <Input {...field} disabled={isLoading} />
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
                        <FormLabel>Số điện thoại</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
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
