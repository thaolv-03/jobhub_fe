"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, X, Loader2 } from "lucide-react";
import React from "react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  fetchJobSeekerProfile,
  parseJobSeekerCv,
  fetchLatestCvOnline,
  saveCvOnline,
  updateJobSeekerProfile,
  uploadJobSeekerAvatar,
  uploadJobSeekerCv,
} from "@/lib/job-seeker-profile";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-types";
import { recommendJobs, searchJobs, type Job } from "@/lib/jobs";
import { updateAccount } from "@/lib/auth-storage";
import { createJobSeekerSkill, deleteJobSeekerSkill, listJobSeekerSkills, type JobSeekerSkill } from "@/lib/job-seeker-skills";

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

const MAX_AVATAR_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png"];

const fallbackRecommendedJobs = [
  { id: 4, title: "Product Manager", company: "MoMo", location: "TP. Hồ Chí Minh", salary: "Cạnh tranh", logoId: "company-logo-momo" },
  { id: 5, title: "Kỹ sư DevOps", company: "Tiki", location: "Hà Nội", salary: "Trên $2000", logoId: "company-logo-tiki" },
];

const CV_ONLINE_FIELDS = [
  { id: "name", label: "Name", key: "NAME" },
  { id: "emailAddress", label: "Email address", key: "EMAIL ADDRESS" },
  { id: "contact", label: "Contact", key: "CONTACT" },
  { id: "location", label: "Location", key: "LOCATION" },
  { id: "linkedinLink", label: "LinkedIn link", key: "LINKEDIN LINK" },
  { id: "designation", label: "Designation", key: "DESIGNATION" },
  { id: "workedAs", label: "Worked as", key: "WORKED AS", multi: true },
  { id: "companiesWorkedAt", label: "Companies worked at", key: "COMPANIES WORKED AT", multi: true },
  { id: "yearsOfExperience", label: "Years of experience", key: "YEARS OF EXPERIENCE" },
  { id: "skills", label: "Skills", key: "SKILLS", multi: true },
  { id: "awards", label: "Awards", key: "AWARDS", multi: true },
  { id: "certification", label: "Certification", key: "CERTIFICATION", multi: true },
  { id: "language", label: "Language", key: "LANGUAGE", multi: true },
  { id: "degree", label: "Degree", key: "DEGREE" },
  { id: "collegeName", label: "College name", key: "COLLEGE NAME" },
  { id: "university", label: "University", key: "UNIVERSITY" },
  { id: "yearOfGraduation", label: "Year of graduation", key: "YEAR OF GRADUATION" },
] as const;

type CvOnlineFormValues = {
  [K in typeof CV_ONLINE_FIELDS[number]["id"]]: string;
};


const normalizeParsedValue = (value: unknown) => {
  if (value == null) return "";
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean).join("\n");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return String(value).trim();
};

const getParsedValue = (parsedData: Record<string, unknown> | null | undefined, key: string) => {
  if (!parsedData) return "";
  const match = Object.keys(parsedData).find((item) => item.toLowerCase() === key.toLowerCase());
  if (!match) return "";
  return normalizeParsedValue(parsedData[match]);
};

const buildCvOnlineDefaults = (parsedData?: Record<string, unknown> | null) => {
  return CV_ONLINE_FIELDS.reduce((acc, field) => {
    acc[field.id] = getParsedValue(parsedData, field.key);
    return acc;
  }, {} as CvOnlineFormValues);
};

const parseListValue = (value: string) => {
  return value
    .split(/\r?\n|,/g)
    .map((item) => item.trim())
    .filter(Boolean);
};

const buildParsedDataFromValues = (values: CvOnlineFormValues) => {
  return CV_ONLINE_FIELDS.reduce((acc, field) => {
    const raw = values[field.id]?.trim() ?? "";
    if (field.multi) {
      acc[field.key] = raw ? parseListValue(raw) : [];
    } else {
      acc[field.key] = raw;
    }
    return acc;
  }, {} as Record<string, unknown>);
};

export default function JobSeekerDashboardPage() {
  const { toast } = useToast();
  const { account, reload } = useAuth();
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState<string | null>(null);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = React.useState(false);
  const [uploadedCvs, setUploadedCvs] = React.useState<string[]>([]);
  const [cvUrl, setCvUrl] = React.useState<string | null>(null);
  const [isCvUploading, setIsCvUploading] = React.useState(false);
  const [isProfileSaving, setIsProfileSaving] = React.useState(false);
  const [skillOptions, setSkillOptions] = React.useState<string[]>([]);
  const [skills, setSkills] = React.useState<JobSeekerSkill[]>([]);
  const [initialSkills, setInitialSkills] = React.useState<JobSeekerSkill[]>([]);
  const [selectedSkill, setSelectedSkill] = React.useState("");
  const [customSkill, setCustomSkill] = React.useState("");
  const [recommendedJobs, setRecommendedJobs] = React.useState<Job[]>([]);
  const [isRecommendedLoading, setIsRecommendedLoading] = React.useState(false);
  const [cvOnlineFileName, setCvOnlineFileName] = React.useState<string | null>(null);
  const [cvOnlineMeta, setCvOnlineMeta] = React.useState<{ fileKey: string; rawText: string; parsedData: Record<string, unknown> } | null>(null);
  const [isCvParsing, setIsCvParsing] = React.useState(false);
  const [isCvOnlineSaving, setIsCvOnlineSaving] = React.useState(false);
  const [isCvOnlineLoading, setIsCvOnlineLoading] = React.useState(false);
  const [isCvOnlineOpen, setIsCvOnlineOpen] = React.useState(false);

  const cvOnlineForm = useForm<CvOnlineFormValues>({
    defaultValues: buildCvOnlineDefaults(null),
  });


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

  const loadProfile = React.useCallback(async () => {
    try {
      const profile = await fetchJobSeekerProfile();
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
      setUploadedCvs(profile?.cvUrl ? ["CV đã tải lên"] : []);
      setAvatarUrl(profile?.avatarUrl ?? null);
      updateAccount((current) => {
        if (!current || typeof current !== "object") return current;
        return { ...(current as any), avatarUrl: profile?.avatarUrl ?? null };
      });
      reload();
    } catch (error) {
      toast({
        title: "Không tải được hồ sơ",
        description: "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  }, [account?.email, form, reload, toast]);

  React.useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  React.useEffect(() => {
    let mounted = true;
    const loadSkills = async () => {
      try {
        const list = await listJobSeekerSkills();
        if (!mounted) return;
        setSkills(list);
        setInitialSkills(list);
      } catch (error) {
        if (!mounted) return;
        setSkills([]);
      }
    };
    void loadSkills();
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    const loadSkillOptions = async () => {
      try {
        const data = await searchJobs({
          pagination: { page: 0, pageSize: 100 },
          sortedBy: [{ field: "createAt", sort: "DESC" }],
        });
        const tagSet = new Set<string>();
        data.items.forEach((job) => {
          (job.tags ?? []).forEach((tag) => {
            if (tag) tagSet.add(tag);
          });
        });
        if (!mounted) return;
        setSkillOptions(Array.from(tagSet).sort());
      } catch (error) {
        if (!mounted) return;
        setSkillOptions([]);
      }
    };
    void loadSkillOptions();
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    const loadRecommendations = async () => {
      try {
        setIsRecommendedLoading(true);
        const data = await recommendJobs({
          pagination: { page: 0, pageSize: 4 },
          sortedBy: [{ field: "createAt", sort: "DESC" }],
        });
        if (!mounted) return;
        setRecommendedJobs(data.items);
      } catch {
        if (!mounted) return;
        setRecommendedJobs([]);
      } finally {
        if (mounted) setIsRecommendedLoading(false);
      }
    };
    void loadRecommendations();
    return () => {
      mounted = false;
    };
  }, []);

  const normalizeSkill = (value: string) => value.trim().toLowerCase();

  const addSkillByName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = skills.some((skill) => normalizeSkill(skill.skillName) === normalizeSkill(trimmed));
    if (exists) {
      setSelectedSkill("");
      setCustomSkill("");
      return;
    }
    setSkills((prev) => [...prev, { skillName: trimmed, proficiencyLevel: null }]);
    setSelectedSkill("");
    setCustomSkill("");
  };

  const removeSkill = (skill: JobSeekerSkill) => {
    setSkills((prev) => prev.filter((item) => item.skillName !== skill.skillName));
  };

    const handleProfileSubmit = async (values: ProfileFormValues) => {
    try {
      setIsProfileSaving(true);
      await updateJobSeekerProfile({
        fullName: values.name?.trim() || null,
        dob: values.dob || null,
        phone: values.phone?.trim() || null,
        address: values.address?.trim() || null,
        bio: values.bio?.trim() || null,
      });

      const currentNames = skills.map((skill) => normalizeSkill(skill.skillName));
      let nextSkills = skills;
      const initialNames = initialSkills.map((skill) => normalizeSkill(skill.skillName));

      const toAdd = skills.filter((skill) => !initialNames.includes(normalizeSkill(skill.skillName)));
      const toRemove = initialSkills.filter((skill) => !currentNames.includes(normalizeSkill(skill.skillName)));

      if (toAdd.length > 0) {
        const created = await Promise.all(
          toAdd.map((skill) => createJobSeekerSkill({ skillName: skill.skillName }))
        );
        const merged = skills.map((skill) => {
          const match = created.find((item) => normalizeSkill(item.skillName) === normalizeSkill(skill.skillName));
          return match ? { ...skill, skillId: match.skillId } : skill;
        });
        setSkills(merged);
        nextSkills = merged;
      }

      if (toRemove.length > 0) {
        await Promise.all(
          toRemove
            .filter((skill) => skill.skillId)
            .map((skill) => deleteJobSeekerSkill(skill.skillId as number))
        );
      }

      setInitialSkills(nextSkills);
      toast({
        title: "Cập nhật thành công!",
        description: "Thông tin cá nhân và kỹ năng đã được lưu.",
      });
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      toast({
        title: "Cập nhật thất bại",
        description: apiError?.message ?? "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsProfileSaving(false);
    }
  };

  const validateAvatarFile = (file: File): string | null => {
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      return "Chỉ hỗ trợ định dạng JPEG và PNG.";
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
        title: "L?i",
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
        title: "L?i",
        description: "Vui l?ng ch?n anh d? t?i l?n.",
        variant: "destructive",
      });
      return;
    }
    const errorMessage = validateAvatarFile(avatarFile);
    if (errorMessage) {
      toast({
        title: "L?i",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }
    try {
      setIsAvatarUploading(true);
      await uploadJobSeekerAvatar(avatarFile);
      await loadProfile();
      setAvatarFile(null);
      setAvatarPreviewUrl(null);
      toast({ title: "Thành công", description: "Ảnh đại diện đã được cập nhật." });
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      const description =
        apiError?.status === "IMAGE_SIZE_EXCEEDED"
          ? "Dung lượng ảnh vượt quá giới hạn cho phép."
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

  const handleCvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({ title: "Lỗi", description: "Vui lòng chỉ tải lên file PDF.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Lỗi", description: "Kích thước file không được vượt quá 10MB.", variant: "destructive" });
      return;
    }
    if (uploadedCvs.includes(file.name)) {
      toast({ title: "Lỗi", description: "Tên file đã tồn tại. Vui lòng đổi tên và thử lại.", variant: "destructive" });
      return;
    }

    try {
      setIsCvUploading(true);
      const updated = await uploadJobSeekerCv(file);
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

  const handleCvParseUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Loi", description: "Chi ho tro PDF, DOC, DOCX, PNG, JPG.", variant: "destructive" });
      event.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Loi", description: "Kich thuoc file vuot qua 10MB.", variant: "destructive" });
      event.target.value = "";
      return;
    }

    try {
      setIsCvParsing(true);
      const response = await parseJobSeekerCv(file);
      const parsedData = response.parsedData && typeof response.parsedData === "object" ? response.parsedData : {};
      setCvOnlineMeta({ fileKey: response.fileKey, rawText: response.rawText, parsedData });
      setCvOnlineFileName(file.name);
      cvOnlineForm.reset(buildCvOnlineDefaults(parsedData));
      toast({ title: "Thanh cong", description: "Da phan tich CV. Vui long kiem tra va chinh sua." });
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      toast({
        title: "Phan tich CV that bai",
        description: apiError?.message ?? "Vui long thu lai sau.",
        variant: "destructive",
      });
    } finally {
      setIsCvParsing(false);
      event.target.value = "";
    }
  };

  const handleCvOnlineSave = async (values: CvOnlineFormValues) => {
    if (!cvOnlineMeta?.fileKey || !cvOnlineMeta?.rawText) {
      toast({ title: "Chua co CV", description: "Vui long tai CV de phan tich truoc.", variant: "destructive" });
      return;
    }

    try {
      setIsCvOnlineSaving(true);
      const parsedData = buildParsedDataFromValues(values);
      await saveCvOnline({
        fileKey: cvOnlineMeta.fileKey,
        rawText: cvOnlineMeta.rawText,
        parsedData,
      });
      setCvOnlineMeta((current) => (current ? { ...current, parsedData } : current));
      toast({ title: "Da luu CV online", description: "Thong tin CV online da duoc luu." });
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      toast({
        title: "Luu CV online that bai",
        description: apiError?.message ?? "Vui long thu lai sau.",
        variant: "destructive",
      });
    } finally {
      setIsCvOnlineSaving(false);
    }
  };
  const loadLatestCvOnline = async () => {
    if (isCvOnlineLoading) return;
    try {
      setIsCvOnlineLoading(true);
      const latest = await fetchLatestCvOnline();
      if (!latest) return;
      const parsedData = (latest.parsedData && typeof latest.parsedData === "object") ? latest.parsedData : {};
      setCvOnlineMeta({
        fileKey: latest.fileUrl ?? "",
        rawText: latest.extractedText ?? "",
        parsedData: parsedData as Record<string, unknown>,
      });
      setCvOnlineFileName(latest.fileUrl ?? "CV Online");
      cvOnlineForm.reset(buildCvOnlineDefaults(parsedData as Record<string, unknown>));
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      toast({
        title: "Khong tai duoc CV Online",
        description: apiError?.message ?? "Vui long thu lai sau.",
        variant: "destructive",
      });
    } finally {
      setIsCvOnlineLoading(false);
    }
  };

  const handleCvOnlineDialogChange = (open: boolean) => {
    setIsCvOnlineOpen(open);
    if (open) {
      void loadLatestCvOnline();
      return;
    }
    cvOnlineForm.reset(cvOnlineMeta ? buildCvOnlineDefaults(cvOnlineMeta.parsedData) : buildCvOnlineDefaults(null));
  };

  const recommendedItems: { id: number; title: string; company: string; logoUrl?: string | null; logoId?: string }[] = recommendedJobs.length > 0
    ? recommendedJobs.map((job) => ({
        id: job.jobId,
        title: job.title,
        company: job.companyName ?? "Unknown",
        logoUrl: job.companyAvatarUrl ?? null,
      }))
    : fallbackRecommendedJobs.map((job) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        logoUrl: null as string | null,
        logoId: job.logoId,
      }));




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
                      <AvatarImage src={avatarPreviewUrl ?? avatarUrl ?? ""} alt="Avatar" className="object-cover" /> 
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button asChild variant="outline">
                        <Label htmlFor="avatar-upload">
                          <Upload className="mr-2 h-4 w-4" />
                          Thay đổi ảnh
                          <input
                            id="avatar-upload"
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png"
                            onChange={handleAvatarChange}
                          />
                        </Label>
                      </Button>
                      <Button type="button" onClick={handleAvatarUpload} disabled={isAvatarUploading || !avatarFile}>
                        {isAvatarUploading ? "Đang tải..." : "Lưu ảnh"}
                      </Button>
                    </div>
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
                        <div className="grid gap-3">
                          <Select
                            value={selectedSkill}
                            onValueChange={(value) => {
                              setSelectedSkill(value);
                              addSkillByName(value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn kỹ năng có sẵn" />
                            </SelectTrigger>
                            <SelectContent>
                              {skillOptions.length === 0 ? (
                                <SelectItem value="__empty" disabled>
                                  Chưa có kỹ năng nào
                                </SelectItem>
                              ) : (
                                skillOptions
                                  .filter(
                                    (option) =>
                                      !skills.some(
                                        (skill) => normalizeSkill(skill.skillName) === normalizeSkill(option)
                                      )
                                  )
                                  .map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))
                              )}
                            </SelectContent>
                          </Select>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                              placeholder="Thêm kỹ năng mới..."
                              value={customSkill}
                              onChange={(event) => setCustomSkill(event.target.value)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              
                              onClick={() => addSkillByName(customSkill)}
                            >
                              Thêm
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {skills.map((skill) => (
                              <Badge key={skill.skillId ?? skill.skillName} variant="secondary" className="gap-1 pr-1">
                                {skill.skillName}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => void removeSkill(skill)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                            {skills.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Chưa có kỹ năng.</p>
                            ) : null}
                          </div>
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
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Quản lý CV</CardTitle>
                <CardDescription>Tải lên và quản lý các CV của bạn để sẵn sàng ứng tuyển.</CardDescription>
              </div>
              <Dialog open={isCvOnlineOpen} onOpenChange={handleCvOnlineDialogChange}>
                <DialogTrigger asChild>
                  <Button variant="outline">CV Online (AI)</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[860px] max-h-[80vh] overflow-y-auto p-0">
                  <div className="sticky top-0 z-10 border-b bg-white px-6 py-3 pr-12 relative">
                    <DialogHeader className="items-center text-center">
                      <DialogTitle className="text-xl">CV Online (AI)</DialogTitle>
                      <DialogDescription className="text-center">Upload CV de phan tich va chinh sua truoc khi luu.</DialogDescription>
                    </DialogHeader>
                    <DialogClose className="absolute right-4 top-3 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </DialogClose>
                  </div>
                  <div className="grid gap-6 px-6 pb-6">
                    <div className="rounded-lg border bg-slate-50/60 p-4">
                      <Label htmlFor="cv-online-file" className="text-sm font-semibold">Upload CV de phan tich</Label>
                      <Input
                        id="cv-online-file"
                        type="file"
                        accept=".pdf,.doc,.docx,image/png,image/jpeg"
                        onChange={handleCvParseUpload}
                        disabled={isCvParsing}
                        className="mt-2"
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>PDF, DOC, DOCX, PNG, JPG (toi da 10MB).</span>
                        {isCvParsing ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Dang phan tich CV...
                          </span>
                        ) : null}
                        {isCvOnlineLoading ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Dang tai CV Online...
                          </span>
                        ) : null}
                      </div>
                      {cvOnlineFileName ? (
                        <div className="mt-3 rounded-md bg-white px-3 py-2 text-sm text-muted-foreground">
                          File: {cvOnlineFileName}
                        </div>
                      ) : null}
                    </div>
                    {!cvOnlineMeta ? (
                      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        Upload CV để tạo CV Online.
                      </div>
                    ) : null}
                    <Form {...cvOnlineForm}>
                      <form onSubmit={cvOnlineForm.handleSubmit(handleCvOnlineSave)} className="grid gap-4">
                        <div className="rounded-xl border bg-white shadow-sm">
                          <div className="grid gap-6 p-6 md:grid-cols-[260px_1fr]">
                            <div className="space-y-6 border-b bg-emerald-50/60 px-4 py-6 md:border-b-0 md:border-r md:pb-6 md:pr-6">
                              <div className="space-y-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Personal info</p>
                                <FormField
                                  control={cvOnlineForm.control}
                                  name="name"
                                  render={({ field: inputField }) => (
                                    <FormItem>
                                      <FormLabel>Name</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Full name"
                                          disabled={!cvOnlineMeta}
                                          {...inputField}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={cvOnlineForm.control}
                                  name="designation"
                                  render={({ field: inputField }) => (
                                    <FormItem>
                                      <FormLabel>Designation</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Role / title"
                                          disabled={!cvOnlineMeta}
                                          {...inputField}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={cvOnlineForm.control}
                                  name="emailAddress"
                                  render={({ field: inputField }) => (
                                    <FormItem>
                                      <FormLabel>Email address</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="email@domain.com"
                                          disabled={!cvOnlineMeta}
                                          {...inputField}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={cvOnlineForm.control}
                                  name="contact"
                                  render={({ field: inputField }) => (
                                    <FormItem>
                                      <FormLabel>Contact</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Phone number"
                                          disabled={!cvOnlineMeta}
                                          {...inputField}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={cvOnlineForm.control}
                                  name="location"
                                  render={({ field: inputField }) => (
                                    <FormItem>
                                      <FormLabel>Location</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="City, Country"
                                          disabled={!cvOnlineMeta}
                                          {...inputField}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={cvOnlineForm.control}
                                  name="linkedinLink"
                                  render={({ field: inputField }) => (
                                    <FormItem>
                                      <FormLabel>LinkedIn link</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="https://linkedin.com/in/..."
                                          disabled={!cvOnlineMeta}
                                          {...inputField}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="space-y-4">
                                <div className="h-px w-full bg-emerald-200" />
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills</p>
                                <FormField
                                  control={cvOnlineForm.control}
                                  name="skills"
                                  render={({ field: inputField }) => (
                                    <FormItem>
                                      <FormLabel>Skills</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          rows={4}
                                          placeholder="One skill per line"
                                          disabled={!cvOnlineMeta}
                                          {...inputField}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={cvOnlineForm.control}
                                  name="language"
                                  render={({ field: inputField }) => (
                                    <FormItem>
                                      <FormLabel>Language</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          rows={3}
                                          placeholder="One language per line"
                                          disabled={!cvOnlineMeta}
                                          {...inputField}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>

                            <div className="space-y-6 rounded-lg bg-white p-4">
                              <div className="space-y-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Experience</p>
                                <FormField
                                  control={cvOnlineForm.control}
                                  name="yearsOfExperience"
                                  render={({ field: inputField }) => (
                                    <FormItem>
                                      <FormLabel>Years of experience</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="e.g. 3 years"
                                          disabled={!cvOnlineMeta}
                                          {...inputField}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={cvOnlineForm.control}
                                  name="workedAs"
                                  render={({ field: inputField }) => (
                                    <FormItem>
                                      <FormLabel>Worked as</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          rows={4}
                                          placeholder="One role per line"
                                          disabled={!cvOnlineMeta}
                                          {...inputField}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={cvOnlineForm.control}
                                  name="companiesWorkedAt"
                                  render={({ field: inputField }) => (
                                    <FormItem>
                                      <FormLabel>Companies worked at</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          rows={4}
                                          placeholder="One company per line"
                                          disabled={!cvOnlineMeta}
                                          {...inputField}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="space-y-4">
                                <div className="h-px w-full bg-emerald-200" />
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Education</p>
                                <div className="grid gap-4 md:grid-cols-2">
                                  <FormField
                                    control={cvOnlineForm.control}
                                    name="degree"
                                    render={({ field: inputField }) => (
                                      <FormItem>
                                        <FormLabel>Degree</FormLabel>
                                        <FormControl>
                                          <Input
                                            placeholder="Degree"
                                            disabled={!cvOnlineMeta}
                                            {...inputField}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={cvOnlineForm.control}
                                    name="yearOfGraduation"
                                    render={({ field: inputField }) => (
                                      <FormItem>
                                        <FormLabel>Year of graduation</FormLabel>
                                        <FormControl>
                                          <Input
                                            placeholder="2024"
                                            disabled={!cvOnlineMeta}
                                            {...inputField}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={cvOnlineForm.control}
                                    name="collegeName"
                                    render={({ field: inputField }) => (
                                      <FormItem>
                                        <FormLabel>College name</FormLabel>
                                        <FormControl>
                                          <Input
                                            placeholder="College name"
                                            disabled={!cvOnlineMeta}
                                            {...inputField}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={cvOnlineForm.control}
                                    name="university"
                                    render={({ field: inputField }) => (
                                      <FormItem>
                                        <FormLabel>University</FormLabel>
                                        <FormControl>
                                          <Input
                                            placeholder="University"
                                            disabled={!cvOnlineMeta}
                                            {...inputField}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="h-px w-full bg-emerald-200" />
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Awards & Certifications</p>
                                <FormField
                                  control={cvOnlineForm.control}
                                  name="awards"
                                  render={({ field: inputField }) => (
                                    <FormItem>
                                      <FormLabel>Awards</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          rows={2}
                                          placeholder="One award per line"
                                          disabled={!cvOnlineMeta}
                                          {...inputField}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={cvOnlineForm.control}
                                  name="certification"
                                  render={({ field: inputField }) => (
                                    <FormItem>
                                      <FormLabel>Certification</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          rows={2}
                                          placeholder="One certification per line"
                                          disabled={!cvOnlineMeta}
                                          {...inputField}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => handleCvOnlineDialogChange(false)}>
                            Dong
                          </Button>
                          <Button type="submit" disabled={!cvOnlineMeta || isCvOnlineSaving}>
                            {isCvOnlineSaving ? "Dang luu..." : "Luu CV Online"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                </DialogContent>
              </Dialog>
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
                    <p className="text-xs text-muted-foreground">PDF (Tối đa 10MB)</p>
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
              {isRecommendedLoading ? (
                <p className="text-sm text-muted-foreground">Dang tai goi y...</p>
              ) : recommendedItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chua co goi y phu hop.</p>
              ) : (
                recommendedItems.map((job) => {
                  const logo = !job.logoUrl && job.logoId ? PlaceHolderImages.find((p) => p.id === job.logoId) : null;
                  return (
                    <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-start gap-4 group">
                      {job.logoUrl ? (
                        <img
                          src={job.logoUrl}
                          alt={`${job.company} logo`}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : logo ? (
                        <Image
                          src={logo.imageUrl}
                          alt={`${job.company} logo`}
                          width={48}
                          height={48}
                          className="rounded-lg"
                          data-ai-hint={logo.imageHint}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted" />
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
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


