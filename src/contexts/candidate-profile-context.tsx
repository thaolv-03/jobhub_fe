"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  applyToJob,
  CandidateProfile,
  createCandidateProfile,
  fetchCandidateProfile,
  uploadCandidateCv,
} from "@/lib/candidate-profile";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { updateAccount } from "@/lib/auth-storage";
import { refreshToken } from "@/lib/auth";

type ApplyIntent = {
  type: "APPLY_JOB";
  jobId: string;
  jobTitle?: string;
};

type OpenProfileIntent = {
  type: "OPEN_PROFILE";
};

type GateIntent = ApplyIntent | OpenProfileIntent;

type EnsureProfileResult = {
  hasProfile: boolean;
};

type CandidateProfileGateContextValue = {
  hasProfile: boolean | null;
  profile: CandidateProfile | null;
  ensureProfile: (intent: GateIntent) => Promise<EnsureProfileResult>;
};

const CandidateProfileGateContext = createContext<CandidateProfileGateContextValue | undefined>(undefined);

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

export function CandidateProfileGateProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const router = useRouter();
  const { isAuthenticated, roles, reload } = useAuth();

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [intent, setIntent] = useState<GateIntent | null>(null);
  const [applyJobId, setApplyJobId] = useState<string | null>(null);
  const [applyJobTitle, setApplyJobTitle] = useState<string | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isUploadingCv, setIsUploadingCv] = useState(false);

  const inflightRef = useRef<Promise<CandidateProfile | null> | null>(null);
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

  const loadProfileOnce = useCallback(async () => {
    if (hasProfile !== null) {
      return profile;
    }
    if (inflightRef.current) {
      return inflightRef.current;
    }

    inflightRef.current = fetchCandidateProfile()
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

  const openApplyDialog = useCallback((nextIntent: ApplyIntent) => {
    setApplyJobId(nextIntent.jobId);
    setApplyJobTitle(nextIntent.jobTitle);
    setIsApplyOpen(true);
  }, []);

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

      if (!roles.includes("JOB_SEEKER")) {
        setIntent(nextIntent);
        setIsCreateOpen(true);
        return new Promise((resolve) => {
          pendingResolveRef.current = resolve;
        });
      }

      try {
        const currentProfile = await loadProfileOnce();
        if (currentProfile) {
          if (nextIntent.type === "APPLY_JOB") {
            openApplyDialog(nextIntent);
          } else {
            router.push("/candidate/dashboard");
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
    [isAuthenticated, loadProfileOnce, openApplyDialog, roles, router, toast]
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
      setSelectedFile(null);
      setIsApplying(false);
      setIsUploadingCv(false);
    }
  }, []);

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
        const created = await createCandidateProfile(payload);
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
          await refreshToken();
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
          openApplyDialog(intent);
        } else if (intent?.type === "OPEN_PROFILE") {
          router.push("/candidate/dashboard");
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

    try {
      setIsApplying(true);
      let nextProfile = profile;

      if (!nextProfile?.cvUrl) {
        if (!selectedFile) {
          toast({
            title: "Chưa có CV",
            description: "Vui lòng chọn CV để tiếp tục.",
            variant: "destructive",
          });
          setIsApplying(false);
          return;
        }
        if (selectedFile.type !== "application/pdf") {
          toast({
            title: "CV không hợp lệ",
            description: "Vui lòng chọn file PDF.",
            variant: "destructive",
          });
          setIsApplying(false);
          return;
        }
        if (selectedFile.size > 5 * 1024 * 1024) {
          toast({
            title: "CV quá lớn",
            description: "Kích thước file không được vượt quá 5MB.",
            variant: "destructive",
          });
          setIsApplying(false);
          return;
        }
        setIsUploadingCv(true);
        nextProfile = await uploadCandidateCv(selectedFile);
        setProfile(nextProfile);
        setIsUploadingCv(false);
      }

      await applyToJob(applyJobId, {
        cvUrl: nextProfile?.cvUrl ?? null,
        cvId: nextProfile?.cvId ?? null,
      });
      toast({
        title: "Ứng tuyển thành công",
        description: "Hồ sơ của bạn đã được gửi.",
      });
      setIsApplyOpen(false);
      setApplyJobId(null);
      setSelectedFile(null);
      setIsApplying(false);
    } catch (error) {
      setIsUploadingCv(false);
      setIsApplying(false);
      toast({
        title: "Ứng tuyển thất bại",
        description: "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  }, [applyJobId, profile, selectedFile, toast]);

  const value = useMemo(
    () => ({
      hasProfile,
      profile,
      ensureProfile,
    }),
    [ensureProfile, hasProfile, profile]
  );

  return (
    <CandidateProfileGateContext.Provider value={value}>
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
                    <FormLabel>Địa chỉ/Thành phố</FormLabel>
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
                    <FormLabel>Giới thiệu bản thân</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tóm tắt kinh nghiệm và mục tiêu nghề nghiệp..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => handleCreateClose(false)} disabled={form.formState.isSubmitting}>
                  Huỷ
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Đang lưu..." : "Lưu thông tin"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isApplyOpen} onOpenChange={handleApplyClose}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Ứng tuyển ngay</DialogTitle>
            <DialogDescription>
              {applyJobTitle ? `Ứng tuyển vị trí: ${applyJobTitle}` : "Hoàn tất hồ sơ ứng tuyển của bạn."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {profile?.cvUrl ? (
              <div className="rounded-lg border p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">CV hiện có</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.cvName ?? "CV đã tải lên"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={profile.cvUrl} target="_blank" rel="noreferrer">
                      Xem CV
                    </a>
                  </Button>
                  <Button size="sm" onClick={handleApplySubmit} disabled={isApplying}>
                    Dùng CV này để ứng tuyển
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Tải CV của bạn</label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground">
                  Chấp nhận file PDF, tối đa 5MB. File sẽ được tải lên và dùng để ứng tuyển.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" type="button" onClick={() => handleApplyClose(false)} disabled={isApplying}>
              Huỷ
            </Button>
            <Button type="button" onClick={handleApplySubmit} disabled={isApplying || isUploadingCv}>
              {isUploadingCv ? "Đang tải CV..." : isApplying ? "Đang gửi..." : "Gửi hồ sơ ứng tuyển"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CandidateProfileGateContext.Provider>
  );
}

export function useCandidateProfileGate() {
  const context = useContext(CandidateProfileGateContext);
  if (!context) {
    throw new Error("useCandidateProfileGate must be used within CandidateProfileGateProvider");
  }
  return context;
}
