"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  applyToJob,
  JobSeekerProfile,
  createJobSeekerProfile,
  fetchJobSeekerProfile,
  fetchLatestCvOnline,
  parseJobSeekerCv,
  ParsedCvDTO,
  saveCvOnline,
  uploadJobSeekerCv,
} from "@/lib/job-seeker-profile";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { updateAccount } from "@/lib/auth-storage";
import { refreshToken } from "@/lib/auth";
import { CvOnlineDialog, buildCvOnlineDefaults, buildParsedDataFromValues, type CvOnlineFormValues, type CvOnlineMeta } from "@/components/job-seeker/cv-online-dialog";

type ApplyIntent = {
  type: "APPLY_JOB";
  jobId: string;
  jobTitle?: string;
};

type OpenProfileIntent = {
  type: "OPEN_PROFILE";
};

type FavoriteIntent = {
  type: "FAVORITE_JOB";
};

type GateIntent = ApplyIntent | OpenProfileIntent | FavoriteIntent;

type EnsureProfileResult = {
  hasProfile: boolean;
};

type JobSeekerProfileGateContextValue = {
  hasProfile: boolean | null;
  profile: JobSeekerProfile | null;
  ensureProfile: (intent: GateIntent) => Promise<EnsureProfileResult>;
};

const JobSeekerProfileGateContext = createContext<JobSeekerProfileGateContextValue | undefined>(undefined);

const profileSchema = z.object({
  fullName: z.string().min(1, "Vui lòng nhập họ và tên."),
  phone: z
    .string()
    .min(1, "Vui lòng nhập số điện thoại.")
    .regex(/^\+?\d[\d\s-]{7,15}$/, "Số điện thoại không hợp lệ."),
  address: z.string().min(1, "Vui lòng nhập địa chỉ hoặc thành phố."),
  birthDate: z.string().optional(),
  bio: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function JobSeekerProfileGateProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const router = useRouter();
  const { isAuthenticated, roles, reload } = useAuth();

  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [intent, setIntent] = useState<GateIntent | null>(null);
  const [applyJobId, setApplyJobId] = useState<string | null>(null);
  const [applyJobTitle, setApplyJobTitle] = useState<string | undefined>(undefined);
  const [isApplying, setIsApplying] = useState(false);
  const [cvOnlineLatest, setCvOnlineLatest] = useState<ParsedCvDTO | null>(null);
  const [cvOnlineMeta, setCvOnlineMeta] = useState<CvOnlineMeta | null>(null);
  const [cvOnlineFileName, setCvOnlineFileName] = useState<string | null>(null);
  const [cvOnlineFile, setCvOnlineFile] = useState<File | null>(null);
  const [isCvOnlineOpen, setIsCvOnlineOpen] = useState(false);
  const [isCvParsing, setIsCvParsing] = useState(false);
  const [isCvOnlineSaving, setIsCvOnlineSaving] = useState(false);
  const [isCvOnlineLoading, setIsCvOnlineLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isConfirmAccepted, setIsConfirmAccepted] = useState(false);

  const inflightRef = useRef<Promise<JobSeekerProfile | null> | null>(null);
  const pendingResolveRef = useRef<((result: EnsureProfileResult) => void) | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      address: "",
      birthDate: "",
      bio: "",
    },
  });

  const cvOnlineForm = useForm<CvOnlineFormValues>({
    defaultValues: buildCvOnlineDefaults(null),
  });

  const loadProfileOnce = useCallback(async () => {
    if (hasProfile !== null) {
      return profile;
    }
    if (inflightRef.current) {
      return inflightRef.current;
    }

    inflightRef.current = fetchJobSeekerProfile({ allowUnauthenticated: true })
      .then((data) => {
        setProfile(data);
        setHasProfile(!!data);
        return data;
      })
      .catch((error) => {
        setProfile(null);
        setHasProfile(null);
        throw error;
      })
      .finally(() => {
        inflightRef.current = null;
      });

    return inflightRef.current;
  }, [hasProfile, profile]);

  const openApplyDialog = useCallback(async (nextIntent: ApplyIntent) => {
    setApplyJobId(nextIntent.jobId);
    setApplyJobTitle(nextIntent.jobTitle);
    setIsApplyOpen(false);
    setIsConfirmOpen(false);
    setIsConfirmAccepted(false);
    setIsCvOnlineOpen(false);
    try {
      const latest = await fetchLatestCvOnline();
      if (latest?.cvId) {
        setCvOnlineLatest(latest);
        setIsConfirmOpen(true);
        return;
      }
      setCvOnlineLatest(null);
      setCvOnlineMeta(null);
      setCvOnlineFileName(null);
      setCvOnlineFile(null);
      cvOnlineForm.reset(buildCvOnlineDefaults(null));
      setIsCvOnlineOpen(true);
    } catch (error) {
      setCvOnlineLatest(null);
      toast({
        title: "Không tải được CV Online",
        description: "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  }, [cvOnlineForm, toast]);

  const resolvePending = useCallback((value: EnsureProfileResult) => {
    if (pendingResolveRef.current) {
      pendingResolveRef.current(value);
      pendingResolveRef.current = null;
    }
  }, []);

  const ensureProfile = useCallback(
    async (nextIntent: GateIntent): Promise<EnsureProfileResult> => {
      if (!isAuthenticated) {
        toast({
          title: "Bạn cần đăng nhập",
          description: "Vui lòng đăng nhập để tiếp tục.",
          variant: "destructive",
        });
        return { hasProfile: false };
      }

      try {
        const currentProfile = await loadProfileOnce();
        if (currentProfile) {
          if (!roles.includes("JOB_SEEKER")) {
            updateAccount((current) => {
              if (!current || typeof current !== "object") return current;
              const next = { ...(current as any) };
              const nextRoles = Array.isArray(next.roles) ? [...next.roles] : [];
              const hasJobSeeker = nextRoles.some((role: any) => role?.roleName === "JOB_SEEKER");
              if (!hasJobSeeker) {
                nextRoles.push({
                  roleId: -1,
                  roleName: "JOB_SEEKER",
                  roleDescription: "Job seeker (client fallback)",
                  permissions: [],
                });
              }
              next.roles = nextRoles;
              return next;
            });
            reload();
          }

          if (nextIntent.type === "APPLY_JOB") {
            await openApplyDialog(nextIntent);
          } else if (nextIntent.type === "OPEN_PROFILE") {
            router.push("/job-seeker/dashboard");
          }
          return { hasProfile: true };
        }
      } catch (error) {
        toast({
          title: "Không thể kiểm tra hồ sơ",
          description: "Vui lòng thử lại sau.",
          variant: "destructive",
        });
        return { hasProfile: false };
      }

      setIntent(nextIntent);
      setIsCreateOpen(true);

      return new Promise((resolve) => {
        pendingResolveRef.current = resolve;
      });
    },
    [isAuthenticated, loadProfileOnce, openApplyDialog, reload, roles, router, toast]
  );

  const handleCreateClose = useCallback(
    (open: boolean) => {
      setIsCreateOpen(open);
      if (!open) {
        form.reset();
        setIntent(null);
        resolvePending({ hasProfile: false });
      }
    },
    [form, resolvePending]
  );

  const handleApplyClose = useCallback((open: boolean) => {
    setIsApplyOpen(open);
    if (!open) {
      setApplyJobId(null);
      setApplyJobTitle(undefined);
      setIsApplying(false);
      setIsConfirmAccepted(false);
    }
  }, []);

  const handleCvOnlineClose = useCallback((open: boolean) => {
    setIsCvOnlineOpen(open);
    if (!open) {
      setIsCvParsing(false);
      setIsCvOnlineSaving(false);
      setCvOnlineMeta(null);
      setCvOnlineFileName(null);
      setCvOnlineFile(null);
      cvOnlineForm.reset(buildCvOnlineDefaults(null));
      if (!cvOnlineLatest?.cvId) {
        setApplyJobId(null);
        setApplyJobTitle(undefined);
      }
    }
  }, [cvOnlineForm, cvOnlineLatest]);

  const handleCvParseUpload = async (file: File) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Loi", description: "Chỉ hỗ trợ PDF, DOC, DOCX, PNG, JPG.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Loi", description: "Kích thước file vượt quá 10MB.", variant: "destructive" });
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
      const apiError = error as ApiError;
      toast({
        title: "Phân tích CV thất bại",
        description: apiError.message ?? "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsCvParsing(false);
    }
  };

  const loadLatestCvOnline = useCallback(async () => {
    if (isCvOnlineLoading) return null;
    try {
      setIsCvOnlineLoading(true);
      const latest = cvOnlineLatest ?? (await fetchLatestCvOnline());
      if (!latest) {
        setCvOnlineMeta(null);
        setCvOnlineFileName(null);
        cvOnlineForm.reset(buildCvOnlineDefaults(null));
        return null;
      }
      const parsedData = latest.parsedData && typeof latest.parsedData === "object" ? latest.parsedData : {};
      setCvOnlineLatest(latest);
      setCvOnlineMeta({
        fileKey: latest.fileUrl ?? "",
        rawText: latest.extractedText ?? "",
        parsedData: parsedData as Record<string, unknown>,
      });
      setCvOnlineFileName(latest.fileUrl ?? "CV Online");
      cvOnlineForm.reset(buildCvOnlineDefaults(parsedData as Record<string, unknown>));
      return latest;
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        title: "Không tải được CV Online",
        description: apiError.message ?? "Vui lòng thử lại sau.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCvOnlineLoading(false);
    }
  }, [cvOnlineForm, cvOnlineLatest, isCvOnlineLoading, toast]);

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
          setProfile((current) => (current ? { ...current, cvUrl: updatedProfile.cvUrl ?? current.cvUrl } : current));
        } catch (uploadError) {
          const apiError = uploadError as ApiError;
          toast({
            title: "Tải CV thất bại",
            description: apiError.message ?? "Vui lòng thử lại sau.",
            variant: "destructive",
          });
          return;
        }
      }
      const parsedData = buildParsedDataFromValues(values);
      const saved = await saveCvOnline({
        fileKey: cvOnlineMeta.fileKey,
        rawText: cvOnlineMeta.rawText,
        parsedData,
      });
      setCvOnlineMeta((current) => (current ? { ...current, parsedData } : current));
      setCvOnlineLatest(saved);
      setCvOnlineFile(null);
      setIsCvOnlineOpen(false);
      setIsConfirmOpen(true);
      toast({ title: "Đã lưu CV online", description: "Thông tin CV online đã được lưu." });
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        title: "Lưu CV online thất bại",
        description: apiError.message ?? "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsCvOnlineSaving(false);
    }
  };

  const handleConfirmClose = (open: boolean) => {
    setIsConfirmOpen(open);
    if (!open) {
      setIsConfirmAccepted(false);
      setApplyJobId(null);
      setApplyJobTitle(undefined);
    }
  };

  const handleConfirmAccept = () => {
    setIsConfirmAccepted(true);
    setIsConfirmOpen(false);
    setIsApplyOpen(true);
  };

  const handleProfileSubmit = useCallback(
    async (values: ProfileFormValues) => {
      const payload = {
        fullName: values.fullName.trim(),
        phone: values.phone.trim(),
        address: values.address.trim(),
        dob: values.birthDate?.trim() ? values.birthDate : null,
        bio: values.bio?.trim() ? values.bio : null,
      };

      try {
        const created = await createJobSeekerProfile(payload);
        setProfile(created);
        setHasProfile(true);
        updateAccount((current) => {
          if (!current || typeof current !== "object") return current;
          const next = { ...(current as any) };
          const nextRoles = Array.isArray(next.roles) ? [...next.roles] : [];
          const hasJobSeeker = nextRoles.some((role: any) => role?.roleName === "JOB_SEEKER");
          if (!hasJobSeeker) {
            nextRoles.push({
              roleId: -1,
              roleName: "JOB_SEEKER",
              roleDescription: "Job seeker (client fallback)",
              permissions: [],
            });
          }
          next.roles = nextRoles;
          return next;
        });
        try {
          await refreshToken({ suppressAuthFailure: true });
        } catch (error) {
          // Ignore refresh errors; UI still updated via local storage.
        }
        reload();
        toast({
          title: "Tạo hồ sơ thành công",
          description: "Bạn có thể tiếp tục thao tác.",
        });
        setIsCreateOpen(false);
        form.reset();

        if (intent?.type === "APPLY_JOB") {
          await openApplyDialog(intent);
        } else if (intent?.type === "OPEN_PROFILE") {
          router.push("/job-seeker/dashboard");
        }

        resolvePending({ hasProfile: true });
        setIntent(null);
      } catch (error) {
        toast({
          title: "Không thể tạo hồ sơ",
          description: "Vui lòng kiểm tra lại thông tin.",
          variant: "destructive",
        });
      }
    },
    [form, intent, openApplyDialog, refreshToken, reload, resolvePending, router, toast]
  );

  const handleApplySubmit = useCallback(async () => {
    if (!applyJobId) {
      return;
    }
    if (!isConfirmAccepted || !cvOnlineLatest?.cvId) {
      return;
    }

    try {
      setIsApplying(true);
      await applyToJob(applyJobId, {
        parsedCvId: cvOnlineLatest.cvId,
      });
      toast({
        title: "Ứng tuyển thành công",
        description: "Hồ sơ của bạn đã được gửi.",
      });
      setIsApplyOpen(false);
      setApplyJobId(null);
      setIsConfirmAccepted(false);
    } catch (error) {
      toast({
        title: "Ứng tuyển thất bại",
        description: "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  }, [applyJobId, cvOnlineLatest, isConfirmAccepted, toast]);

  const value = useMemo(
    () => ({
      hasProfile,
      profile,
      ensureProfile,
    }),
    [ensureProfile, hasProfile, profile]
  );

  return (
    <JobSeekerProfileGateContext.Provider value={value}>
      {children}

      <Dialog open={isCreateOpen} onOpenChange={handleCreateClose}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Tạo hồ sơ người tìm việc</DialogTitle>
            <DialogDescription>Vui lòng điền thông tin để tiếp tục.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ và tên</FormLabel>
                    <FormControl>
                      <Input placeholder="Nguyễn Văn A" {...field} />
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
                      <Input placeholder="0123 456 789" {...field} />
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
                      <Input placeholder="TP. Hồ Chí Minh" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthDate"
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
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giới thiệu bản thân</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tóm tắt kinh nghiệm và mục tiêu nghề nghiệp..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => handleCreateClose(false)} disabled={form.formState.isSubmitting}>
                  Hủy
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Đang lưu..." : "Lưu thông tin"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmOpen} onOpenChange={handleConfirmClose}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Xác nhận ứng tuyển</DialogTitle>
            <DialogDescription>
              Bạn có muốn sử dụng CV Online hiện tại để ứng tuyển cho công việc này không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" type="button" onClick={() => handleConfirmClose(false)}>
              Hủy
            </Button>
            <Button type="button" onClick={handleConfirmAccept} disabled={!cvOnlineLatest?.cvId}>
              Ứng tuyển
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isApplyOpen} onOpenChange={handleApplyClose}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Ứng tuyển ngay</DialogTitle>
            <DialogDescription>
              {applyJobTitle ? `Ứng tuyển vị trí: ${applyJobTitle}` : "Hoàn tất hồ sơ ứng tuyển của bạn."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">CV Online</p>
                <p className="text-sm text-muted-foreground">
                  {cvOnlineLatest?.fileUrl ? "CV online đã lưu" : "CV online sẵn sàng"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={async () => {
                    setIsApplyOpen(false);
                    await loadLatestCvOnline();
                    setIsCvOnlineOpen(true);
                  }}
                >
                  Cập nhật CV Online
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" type="button" onClick={() => handleApplyClose(false)} disabled={isApplying}>
              Hủy
            </Button>
            <Button type="button" onClick={handleApplySubmit} disabled={isApplying || !cvOnlineLatest?.cvId}>
              {isApplying ? "Đang gửi..." : "Gửi hồ sơ ứng tuyển"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CvOnlineDialog
        open={isCvOnlineOpen}
        onOpenChange={handleCvOnlineClose}
        form={cvOnlineForm}
        cvOnlineMeta={cvOnlineMeta}
        cvOnlineFileName={cvOnlineFileName}
        isParsing={isCvParsing}
        isSaving={isCvOnlineSaving}
        isLoading={isCvOnlineLoading}
        onParseFile={handleCvParseUpload}
        onSave={handleCvOnlineSave}
      />
    </JobSeekerProfileGateContext.Provider>
  );
}

export function useJobSeekerProfileGate() {
  const context = useContext(JobSeekerProfileGateContext);
  if (!context) {
    throw new Error("useJobSeekerProfileGate must be used within JobSeekerProfileGateProvider");
  }
  return context;
}












