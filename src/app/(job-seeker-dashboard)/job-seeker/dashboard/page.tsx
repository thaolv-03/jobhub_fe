"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CvOnlineDialog, buildCvOnlineDefaults, buildParsedDataFromValues, type CvOnlineFormValues, type CvOnlineMeta } from "@/components/job-seeker/cv-online-dialog";
import {
  fetchJobSeekerProfile,
  deleteJobSeekerCv,
  parseJobSeekerCv,
  fetchLatestCvOnline,
  saveCvOnline,
  updateJobSeekerProfile,
  uploadJobSeekerAvatar,
  uploadJobSeekerCv,
} from "@/lib/job-seeker-profile";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-types";
import { recommendJobs, type Job } from "@/lib/jobs";
import { updateAccount } from "@/lib/auth-storage";
import { createJobSeekerSkill, deleteJobSeekerSkill, listJobSeekerSkills, type JobSeekerSkill } from "@/lib/job-seeker-skills";
import { JOB_TAGS } from "@/lib/job-form-data";

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

export default function JobSeekerDashboardPage() {
  const { toast } = useToast();
  const { account, reload } = useAuth();
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState<string | null>(null);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = React.useState(false);
  const [uploadedCvs, setUploadedCvs] = React.useState<string[]>([]);
  const [cvUrl, setCvUrl] = React.useState<string | null>(null);
  const [isCvOpening, setIsCvOpening] = React.useState(false);
  const [isProfileSaving, setIsProfileSaving] = React.useState(false);
  const [skillOptions, setSkillOptions] = React.useState<string[]>([]);
  const [skills, setSkills] = React.useState<JobSeekerSkill[]>([]);
  const [initialSkills, setInitialSkills] = React.useState<JobSeekerSkill[]>([]);
  const [selectedSkill, setSelectedSkill] = React.useState("");
  const [skillSearch, setSkillSearch] = React.useState("");
  const [customSkill, setCustomSkill] = React.useState("");
  const [recommendedJobs, setRecommendedJobs] = React.useState<Job[]>([]);
  const [isRecommendedLoading, setIsRecommendedLoading] = React.useState(false);
  const [cvOnlineFileName, setCvOnlineFileName] = React.useState<string | null>(null);
  const [cvOnlineFile, setCvOnlineFile] = React.useState<File | null>(null);
  const [cvOnlineMeta, setCvOnlineMeta] = React.useState<CvOnlineMeta | null>(null);
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
      setUploadedCvs(profile?.cvUrl ? ["CV đã tải lên"] : []);
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
        const names = Array.from(
          new Set(
            JOB_TAGS
              .map((tag) => tag.name?.trim())
              .filter((name): name is string => Boolean(name))
          )
        ).sort((a, b) => a.localeCompare(b));
        if (!mounted) return;
        setSkillOptions(names);
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
    if (!file) {
      return;
    }
    const errorMessage = validateAvatarFile(file);
    if (errorMessage) {
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
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

  const openCv = async () => {
    if (isCvOpening) return;
    try {
      setIsCvOpening(true);
      const profile = await fetchJobSeekerProfile();
      let url = profile?.cvUrl ?? null;
      if (!url) {
        const latest = await fetchLatestCvOnline();
        url = latest?.fileUrl ?? null;
      }
      if (!url) {
        toast({ title: "Không có CV", description: "Vui lòng tải CV trước.", variant: "destructive" });
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      toast({
        title: "Không mở được CV",
        description: apiError?.message ?? "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsCvOpening(false);
    }
  };

  const removeCv = async (cvName: string) => {
    try {
      await deleteJobSeekerCv();
      setUploadedCvs((current) => current.filter((cv) => cv !== cvName));
      setCvUrl(null);
      toast({ title: "Đã xóa CV.", description: `${cvName} đã được xóa.`, variant: "destructive" });
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      toast({
        title: "Xóa CV thất bại",
        description: apiError?.message ?? "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  };

  const handleCvParseUpload = async (file: File) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Lỗi", description: "Chỉ hỗ trợ PDF, DOC, DOCX, PNG, JPG.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Lỗi", description: "Kích thước file vượt quá 10MB.", variant: "destructive" });
      return;
    }

    try {
      setIsCvParsing(true);
      const response = await parseJobSeekerCv(file);
      const parsedData = response.parsedData && typeof response.parsedData === "object" ? response.parsedData : {};
      setCvOnlineMeta({ fileKey: response.fileKey, rawText: response.rawText, parsedData });
      setCvOnlineFileName(file.name);
      setCvOnlineFile(file);
      cvOnlineForm.reset(buildCvOnlineDefaults(parsedData));
      toast({ title: "Thành công", description: "Đã phân tích CV. Vui lòng kiểm tra và chỉnh sửa." });
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      toast({
        title: "Phân tích CV thất bại",
        description: apiError?.message ?? "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsCvParsing(false);
      }
  };

  const handleCvOnlineSave = async (values: CvOnlineFormValues) => {
    if (!cvOnlineMeta?.fileKey || !cvOnlineMeta?.rawText) {
      toast({ title: "Chưa có CV", description: "Vui lòng tải CV để phân tích trước.", variant: "destructive" });
      return;
    }

    try {
      setIsCvOnlineSaving(true);
      if (cvOnlineFile) {
        try {
          const updatedProfile = await uploadJobSeekerCv(cvOnlineFile);
          setCvUrl(updatedProfile.cvUrl ?? null);
          setUploadedCvs(updatedProfile.cvUrl ? ["CV đã tải lên"] : []);
        } catch (uploadError) {
          const apiError = uploadError instanceof ApiError ? uploadError : null;
          toast({
            title: "Tải CV thất bại",
            description: apiError?.message ?? "Vui lòng thử lại sau.",
            variant: "destructive",
          });
          return;
        }
      }
      const parsedData = buildParsedDataFromValues(values);
      await saveCvOnline({
        fileKey: cvOnlineMeta.fileKey,
        rawText: cvOnlineMeta.rawText,
        parsedData,
      });
      setCvOnlineMeta((current) => (current ? { ...current, parsedData } : current));
      setCvOnlineFile(null);
      toast({ title: "Đã lưu CV online", description: "Thông tin CV online đã được lưu." });
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      toast({
        title: "Lưu CV online thất bại",
        description: apiError?.message ?? "Vui lòng thử lại sau.",
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
        title: "Không tải được CV Online",
        description: apiError?.message ?? "Vui lòng thử lại sau.",
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
    setCvOnlineFile(null);
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
                          <Input
                            value={skillSearch}
                            onChange={(event) => setSkillSearch(event.target.value)}
                            placeholder="Search skills..."
                          />
                          {(() => {
                            const normalizedQuery = skillSearch.trim().toLowerCase();
                            if (!normalizedQuery) return null;
                            const availableOptions = skillOptions.filter(
                              (option) =>
                                !skills.some(
                                  (skill) => normalizeSkill(skill.skillName) === normalizeSkill(option)
                                )
                            );
                            const filteredOptions = availableOptions.filter((option) =>
                              option.toLowerCase().includes(normalizedQuery)
                            );
                            return (
                              <div className="mt-2 max-h-56 overflow-auto rounded-md border bg-white p-1 shadow-sm dark:border-slate-700/70 dark:bg-slate-900">
                                {filteredOptions.length === 0 ? (
                                  <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                                    No skills found
                                  </div>
                                ) : (
                                  filteredOptions.map((option) => (
                                    <button
                                      key={option}
                                      type="button"
                                      className="flex w-full items-center rounded-sm px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                                      onClick={() => {
                                        addSkillByName(option);
                                        setSkillSearch("");
                                      }}
                                    >
                                      {option}
                                    </button>
                                  ))
                                )}
                              </div>
                            );
                          })()}
                          <Select
                            value={selectedSkill}
                            onValueChange={(value) => {
                              setSelectedSkill(value);
                              addSkillByName(value);
                              setSkillSearch("");
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose available skills" />
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                if (skillOptions.length === 0) {
                                  return (
                                    <SelectItem value="__empty" disabled>
                                      No skills available
                                    </SelectItem>
                                  );
                                }
                                const availableOptions = skillOptions.filter(
                                  (option) =>
                                    !skills.some(
                                      (skill) => normalizeSkill(skill.skillName) === normalizeSkill(option)
                                    )
                                );
                                if (availableOptions.length === 0) {
                                  return (
                                    <SelectItem value="__empty" disabled>
                                      No skills found
                                    </SelectItem>
                                  );
                                }
                                return availableOptions.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ));
                              })()}
                            </SelectContent>
                          </Select>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                              placeholder="Add a new skill..."
                              value={customSkill}
                              onChange={(event) => setCustomSkill(event.target.value)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              
                              onClick={() => addSkillByName(customSkill)}
                            >
                              Add
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
              <Button variant="outline" onClick={() => handleCvOnlineDialogChange(true)}>
                CV Online (AI)
              </Button>
              <CvOnlineDialog
                open={isCvOnlineOpen}
                onOpenChange={handleCvOnlineDialogChange}
                form={cvOnlineForm}
                cvOnlineMeta={cvOnlineMeta}
                cvOnlineFileName={cvOnlineFileName}
                isParsing={isCvParsing}
                isSaving={isCvOnlineSaving}
                isLoading={isCvOnlineLoading}
                onParseFile={handleCvParseUpload}
                onSave={handleCvOnlineSave}
              />
            </CardHeader>
            <CardContent className="grid gap-6">
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
                            <Button variant="outline" size="sm" onClick={openCv} disabled={isCvOpening}>
                              {isCvOpening ? "Đang mở..." : "Xem CV"}
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
                <p className="text-sm text-muted-foreground">Đang tải gợi ý...</p>
              ) : recommendedItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có gợi ý phù hợp.</p>
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










