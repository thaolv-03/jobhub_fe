'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, X } from "lucide-react";
import React from "react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { fetchCandidateProfile, uploadCandidateCv } from "@/lib/candidate-profile";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-types";

const profileSchema = z.object({
  name: z.string().min(1, { message: "Họ và tên không được để trống." }),
  email: z.string().email({ message: "Email không hợp lệ." }),
  dob: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
  skills: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const recommendedJobs = [
  { id: 4, title: "Product Manager", company: "MoMo", location: "TP. Hồ Chí Minh", salary: "Cạnh tranh", logoId: "company-logo-momo" },
  { id: 5, title: "Kỹ sư DevOps", company: "Tiki", location: "Hà Nội", salary: "Trên $2000", logoId: "company-logo-tiki" },
];

export default function CandidateDashboardPage() {
  const { toast } = useToast();
  const { account, roles } = useAuth();
  const [avatar, setAvatar] = React.useState("https://i.pravatar.cc/150?u=a042581f4e29026704d");
  const [uploadedCvs, setUploadedCvs] = React.useState<string[]>([]);
  const [cvUrl, setCvUrl] = React.useState<string | null>(null);
  const [isCvUploading, setIsCvUploading] = React.useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: account?.email ?? "",
      dob: "",
      phone: "",
      address: "",
      bio: "",
      skills: "",
    },
  });

  React.useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!roles.includes("JOB_SEEKER")) return;

      try {
        const profile = await fetchCandidateProfile();
        if (!mounted) return;
        form.reset({
          name: profile?.fullName ?? "",
          email: account?.email ?? "",
          dob: profile?.dob ?? "",
          phone: profile?.phone ?? "",
          address: profile?.address ?? "",
          bio: profile?.bio ?? "",
          skills: "",
        });
        setCvUrl(profile?.cvUrl ?? null);
        setUploadedCvs(profile?.cvUrl ? ["CV đã tải lên"] : []);
      } catch (error) {
        if (!mounted) return;
        toast({
          title: "Không thể tải hồ sơ",
          description: "Vui lòng thử lại sau.",
          variant: "destructive",
        });
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [account?.email, form, roles, toast]);

  const skillsArray = form
    .watch("skills")
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) || [];

  const handleProfileSubmit = (values: ProfileFormValues) => {
    console.log("Updating profile with:", values);
    toast({
      title: "Cập nhật thành công!",
      description: "Thông tin cá nhân của bạn đã được lưu.",
    });
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
      toast({ title: "Thành công", description: "Ảnh đại diện đã được thay đổi." });
    };
    reader.readAsDataURL(file);
  };

  const handleCvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!roles.includes("JOB_SEEKER")) {
      toast({
        title: "Chưa có hồ sơ",
        description: "Vui lòng tạo hồ sơ người tìm việc trước khi tải CV.",
        variant: "destructive",
      });
      return;
    }

    if (file.type !== "application/pdf") {
      toast({ title: "Lỗi", description: "Vui lòng chỉ tải lên file PDF.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Lỗi", description: "Kích thước file không được vượt quá 5MB.", variant: "destructive" });
      return;
    }
    if (uploadedCvs.includes(file.name)) {
      toast({ title: "Lỗi", description: "Tên file đã tồn tại. Vui lòng đổi tên và thử lại.", variant: "destructive" });
      return;
    }

    try {
      setIsCvUploading(true);
      const updated = await uploadCandidateCv(file);
      setCvUrl(updated.cvUrl ?? null);
      setUploadedCvs([file.name]);
      toast({ title: "Thành công", description: `Đã tải lên CV: ${file.name}` });
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      toast({
        title: "Tải CV thất bại",
        description: apiError?.message ?? "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsCvUploading(false);
    }
  };

  const removeCv = (cvName: string) => {
    setUploadedCvs(uploadedCvs.filter((cv) => cv !== cvName));
    toast({ title: "Đã xóa CV.", description: `${cvName} đã được xóa.`, variant: "destructive" });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="grid gap-4 md:grid-cols-3 md:gap-8">
        <div className="md:col-span-2 grid auto-rows-max items-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>Cập nhật thông tin và ảnh đại diện của bạn.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={avatar} alt="Avatar" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <Button asChild variant="outline">
                      <Label htmlFor="avatar-upload">
                        <Upload className="mr-2 h-4 w-4" />
                        Thay đổi ảnh
                        <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                      </Label>
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Họ và tên</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dob"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ngày sinh</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
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
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Địa chỉ</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Giới thiệu bản thân</FormLabel>
                        <FormControl>
                          <Textarea className="min-h-24" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kỹ năng</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Nhập các kỹ năng, cách nhau bằng dấu phẩy..."
                            className="min-h-24"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {skillsArray.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-base">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Lưu thay đổi</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quản lý CV</CardTitle>
              <CardDescription>Tải lên và quản lý các CV của bạn để sẵn sàng ứng tuyển.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="flex items-center justify-center w-full">
                <Label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Nhấn để tải lên</span> hoặc kéo thả
                    </p>
                    <p className="text-xs text-muted-foreground">PDF (Tối đa 5MB)</p>
                  </div>
                  <Input id="dropzone-file" type="file" className="hidden" accept=".pdf" onChange={handleCvUpload} disabled={isCvUploading} />
                </Label>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium text-lg">CV đã tải lên</h3>
                {uploadedCvs.length > 0 ? (
                  <ul className="space-y-3">
                    {uploadedCvs.map((cv) => (
                      <li key={cv} className="flex items-center justify-between rounded-lg border bg-background p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <FileText className="h-6 w-6 text-primary" />
                          <p className="text-sm font-medium truncate pr-2">{cv}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {cvUrl ? (
                            <Button asChild variant="outline" size="sm">
                              <a href={cvUrl} target="_blank" rel="noreferrer">
                                Xem CV
                              </a>
                            </Button>
                          ) : null}
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeCv(cv)}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">Xóa CV</span>
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <p className="text-sm text-muted-foreground">Chưa có CV nào được tải lên.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Gợi ý cho bạn</CardTitle>
              <CardDescription>Các công việc phù hợp với kỹ năng của bạn.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {recommendedJobs.map((job) => {
                const logo = PlaceHolderImages.find((p) => p.id === job.logoId);
                return (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-start gap-4 group">
                    {logo && (
                      <Image
                        src={logo.imageUrl}
                        alt={`${job.company} logo`}
                        width={48}
                        height={48}
                        className="rounded-lg"
                        data-ai-hint={logo.imageHint}
                      />
                    )}
                    <div className="grid gap-1">
                      <p className="text-sm font-medium leading-none group-hover:text-primary">{job.title}</p>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto opacity-0 group-hover:opacity-100">
                      Xem
                    </Button>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
