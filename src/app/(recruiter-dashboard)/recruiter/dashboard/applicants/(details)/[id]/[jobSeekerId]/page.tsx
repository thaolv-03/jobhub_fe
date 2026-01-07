'use client';

import React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import { getApplicationDetail, type ApplicationDetail } from "@/lib/applications";
import { fetchJobSeekerById, type JobSeekerProfile } from "@/lib/job-seeker-profile";

export default function ApplicantProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const jobId = Number(params?.id);
  const jobSeekerId = Number(params?.jobSeekerId);
  const applicationId = searchParams?.get("applicationId") ?? null;
  const { accessToken } = useAuth();
  const [profile, setProfile] = React.useState<JobSeekerProfile | null>(null);
  const [applicationDetail, setApplicationDetail] = React.useState<ApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("vi-VN");
  };

  React.useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      if (!jobSeekerId || Number.isNaN(jobSeekerId)) {
        setIsLoading(false);
        setErrorMessage("Không tìm thấy ứng viên.");
        return;
      }
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [data, detail] = await Promise.all([
          fetchJobSeekerById(jobSeekerId, accessToken),
          applicationId ? getApplicationDetail(applicationId, accessToken) : Promise.resolve(null),
        ]);
        if (!mounted) return;
        setProfile(data);
        setApplicationDetail(detail);
      } catch (error) {
        const apiError = error as ApiError;
        if (!mounted) return;
        setErrorMessage(apiError.message || "Không thể tải hồ sơ ứng viên.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadProfile();
    return () => {
      mounted = false;
    };
  }, [accessToken, jobSeekerId, applicationId]);

  const displayName = profile?.fullName || `Ứng viên #${jobSeekerId}`;
  const skills = (profile?.skills ?? []).filter((skill) => skill?.skillName);
  const initial = displayName?.trim()?.charAt(0)?.toUpperCase() || "U";
  const parsedCvJson = applicationDetail?.parsedCvJson ?? null;
  const jobTitle = applicationDetail?.jobTitle?.trim();
  const displayJobTitle = jobTitle ? `vị trí ${jobTitle}` : `tin tuyển dụng #${jobId}`;

  const parsedCvData = React.useMemo(() => {
    if (!parsedCvJson) return null;
    try {
      return JSON.parse(parsedCvJson) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [parsedCvJson]);

  const readParsedValue = React.useCallback((key: string) => {
    if (!parsedCvData) return "";
    if (typeof parsedCvData !== "object") return "";
    const direct = parsedCvData[key as keyof typeof parsedCvData];
    if (direct !== undefined) return direct;
    const matchKey = Object.keys(parsedCvData).find((item) => item.toLowerCase() === key.toLowerCase());
    if (!matchKey) return "";
    return parsedCvData[matchKey];
  }, [parsedCvData]);

  const normalizeValue = (value: unknown) => {
    if (value == null) return "";
    if (Array.isArray(value)) return value.filter(Boolean).join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const cvFields = [
    { key: "NAME", label: "Họ và tên" },
    { key: "EMAIL ADDRESS", label: "Email" },
    { key: "CONTACT", label: "Số điện thoại" },
    { key: "LOCATION", label: "Địa điểm" },
    { key: "DESIGNATION", label: "Chức danh" },
    { key: "YEARS OF EXPERIENCE", label: "Số năm kinh nghiệm" },
    { key: "SKILLS", label: "Kỹ năng" },
    { key: "COMPANIES WORKED AT", label: "Công ty đã làm" },
    { key: "WORKED AS", label: "Vị trí đã làm" },
    { key: "COLLEGE NAME", label: "Trường cao đẳng" },
    { key: "UNIVERSITY", label: "Đại học" },
    { key: "DEGREE", label: "Bằng cấp" },
    { key: "YEAR OF GRADUATION", label: "Năm tốt nghiệp" },
    { key: "CERTIFICATION", label: "Chứng chỉ" },
    { key: "AWARDS", label: "Giải thưởng" },
    { key: "LANGUAGE", label: "Ngôn ngữ" },
    { key: "LINKEDIN LINK", label: "Liên kết LinkedIn" },
  ];

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card className="border-border/60 bg-background/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle className="text-slate-900 dark:text-slate-100">Hồ sơ ứng viên</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              Ứng viên cho tin tuyển dụng {displayJobTitle}.
            </CardDescription>
          </div>
          <Button asChild variant="outline" className="ml-auto dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
            <Link href={`/recruiter/dashboard/applicants/${jobId}`}>Quay lại</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full dark:bg-slate-800" />
              <Skeleton className="h-10 w-full dark:bg-slate-800" />
              <Skeleton className="h-10 w-full dark:bg-slate-800" />
            </div>
          ) : errorMessage ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground dark:border-slate-700/70 dark:text-slate-300">
              {errorMessage}
            </div>
          ) : !profile ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground dark:border-slate-700/70 dark:text-slate-300">
              Không có dữ liệu hồ sơ.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatarUrl ?? undefined} alt={displayName} />
                  <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{displayName}</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-300">{profile.email || "-"}</p>
                </div>
                <div className="sm:ml-auto">
                  {profile.cvUrl ? (
                    <Button asChild>
                      <a href={profile.cvUrl} target="_blank" rel="noreferrer">
                        Xem CV
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
                      Chưa có CV
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4 md:col-span-2 dark:border-slate-800/70 dark:bg-slate-950/40">
                  <p className="text-sm text-muted-foreground dark:text-slate-300">Kỹ năng</p>
                  {skills.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span
                          key={skill.skillId ?? skill.skillName}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                        >
                          {skill.skillName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground dark:text-slate-300">Chưa có kỹ năng</p>
                  )}
                </div>
                <div className="rounded-lg border p-4 dark:border-slate-800/70 dark:bg-slate-950/40">
                  <p className="text-sm text-muted-foreground dark:text-slate-300">Số điện thoại</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{profile.phone || "-"}</p>
                </div>
                <div className="rounded-lg border p-4 dark:border-slate-800/70 dark:bg-slate-950/40">
                  <p className="text-sm text-muted-foreground dark:text-slate-300">Ngày sinh</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{formatDate(profile.dob ?? undefined)}</p>
                </div>
                <div className="rounded-lg border p-4 md:col-span-2 dark:border-slate-800/70 dark:bg-slate-950/40">
                  <p className="text-sm text-muted-foreground dark:text-slate-300">Địa chỉ</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{profile.address || "-"}</p>
                </div>
                <div className="rounded-lg border p-4 md:col-span-2 dark:border-slate-800/70 dark:bg-slate-950/40">
                  <p className="text-sm text-muted-foreground dark:text-slate-300">Giới thiệu</p>
                  <p className="whitespace-pre-line text-slate-900 dark:text-slate-100">{profile.bio || "-"}</p>
                </div>
                <div className="rounded-lg border bg-emerald-50/70 p-4 md:col-span-2 dark:border-slate-800/70 dark:bg-emerald-950/20">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-muted-foreground dark:text-slate-300">CV Online</p>
                    {applicationDetail?.matchingScore != null ? (
                      <p className="text-xs text-muted-foreground dark:text-slate-400">
                        Điểm phù hợp: {applicationDetail.matchingScore}
                      </p>
                    ) : null}
                  </div>
                  {!parsedCvData ? (
                    <p className="mt-2 text-sm text-muted-foreground dark:text-slate-300">Chưa có dữ liệu CV online.</p>
                  ) : (
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {cvFields.map((field) => {
                        const value = normalizeValue(readParsedValue(field.key));
                        if (!value) return null;
                        return (
                          <div key={field.key} className="rounded-lg border bg-muted/20 p-3 dark:border-slate-800/70 dark:bg-slate-900/50">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-400">{field.label}</p>
                            <p className="text-sm text-slate-900 dark:text-slate-100">{value}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
