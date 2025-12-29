'use client';

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import { fetchJobSeekerById, type JobSeekerProfile } from "@/lib/job-seeker-profile";

export default function ApplicantProfilePage() {
  const params = useParams();
  const jobId = Number(params?.id);
  const jobSeekerId = Number(params?.jobSeekerId);
  const { accessToken } = useAuth();
  const [profile, setProfile] = React.useState<JobSeekerProfile | null>(null);
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
        const data = await fetchJobSeekerById(jobSeekerId, accessToken);
        if (!mounted) return;
        setProfile(data);
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
  }, [accessToken, jobSeekerId]);

  const displayName = profile?.fullName || `Ứng viên #${jobSeekerId}`;
  const skills = (profile?.skills ?? []).filter((skill) => skill?.skillName);
  const initial = displayName?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle>Hồ sơ ứng viên</CardTitle>
            <CardDescription>
              Ứng viên #{jobSeekerId} trong tin tuyển dụng #{jobId}.
            </CardDescription>
          </div>
          <Button asChild variant="outline" className="ml-auto">
            <Link href={`/recruiter/dashboard/applicants/${jobId}`}>Quay lại</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : errorMessage ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              {errorMessage}
            </div>
          ) : !profile ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
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
                  <p className="text-xl font-semibold">{displayName}</p>
                  <p className="text-sm text-muted-foreground">{profile.email || "-"}</p>
                </div>
                <div className="sm:ml-auto">
                  {profile.cvUrl ? (
                    <Button asChild>
                      <a href={profile.cvUrl} target="_blank" rel="noreferrer">
                        Xem CV
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>
                      Chưa có CV
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4 md:col-span-2">
                  <p className="text-sm text-muted-foreground">Ky nang</p>
                  {skills.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span key={skill.skillId ?? skill.skillName} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                          {skill.skillName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">Chua co ky nang</p>
                  )}
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Số điện thoại</p>
                  <p className="font-medium">{profile.phone || "-"}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Ngày sinh</p>
                  <p className="font-medium">{formatDate(profile.dob ?? undefined)}</p>
                </div>
                <div className="rounded-lg border p-4 md:col-span-2">
                  <p className="text-sm text-muted-foreground">Địa chỉ</p>
                  <p className="font-medium">{profile.address || "-"}</p>
                </div>
                <div className="rounded-lg border p-4 md:col-span-2">
                  <p className="text-sm text-muted-foreground">Giới thiệu</p>
                  <p className="whitespace-pre-line">{profile.bio || "-"}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
