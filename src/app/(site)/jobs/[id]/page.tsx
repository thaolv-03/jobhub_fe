'use client';

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { MapPin, DollarSign, Briefcase, Bookmark, BookmarkCheck, Share2, CalendarClock } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useJobSeekerProfileGate } from "@/contexts/job-seeker-profile-context";
import { addFavorite, listFavorites, removeFavorite } from "@/lib/favorites";
import { formatJobType, getJob, type Job } from "@/lib/jobs";
import { ApiError } from "@/lib/api-types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { getCompany, type Company } from "@/lib/companies";

const formatSalary = (job: Job) => {
  const min = job.minSalary ?? null;
  const max = job.maxSalary ?? null;
  if (min != null && max != null) {
    return `${min} triệu - ${max} triệu`;
  }
  if (min != null) {
    return `T? ${min} triệu`;
  }
  if (max != null) {
    return `??n ${max} triệu`;
  }
  return "Thương lượng";
};

const escapeHtml = (input: string) =>
  input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatJobDescription = (value: string) => {
  if (/<[a-z][\s\S]*>/i.test(value)) {
    return value;
  }
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, roles } = useAuth();
  const { toast } = useToast();
  const { ensureProfile } = useJobSeekerProfileGate();

  const jobIdParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const jobId = jobIdParam ? Number(jobIdParam) : NaN;

  const [job, setJob] = React.useState<Job | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [company, setCompany] = React.useState<Company | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const fetchJob = async () => {
      if (!jobId || Number.isNaN(jobId)) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await getJob(jobId);
        if (!mounted) return;
        setJob(data);
      } catch (error) {
        if (!mounted) return;
        setJob(null);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    void fetchJob();
    return () => {
      mounted = false;
    };
  }, [jobId]);

  React.useEffect(() => {
    if (!job?.companyId) {
      setCompany(null);
      return;
    }
    if (job.companyName) {
      setCompany((prev) => prev ?? null);
    }
    let mounted = true;
    const loadCompany = async () => {
      try {
        const data = await getCompany(job.companyId);
        if (!mounted) return;
        setCompany(data);
      } catch (error) {
        if (!mounted) return;
        setCompany(null);
      }
    };
    void loadCompany();
    return () => {
      mounted = false;
    };
  }, [job?.companyId, job?.companyName]);

  React.useEffect(() => {
    let mounted = true;
    const fetchFavorite = async () => {
      if (!isAuthenticated || !roles.includes("JOB_SEEKER") || !jobId || Number.isNaN(jobId)) {
        setIsFavorite(false);
        return;
      }
      try {
        const data = await listFavorites(0, 200);
        if (!mounted) return;
        setIsFavorite(data.items.some((item) => item.jobId === jobId));
      } catch (error) {
        if (!mounted) return;
        setIsFavorite(false);
      }
    };
    void fetchFavorite();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, roles, jobId]);

  const handleApply = async () => {
    if (!job || !jobId) {
      return;
    }
    if (!isAuthenticated) {
      router.push(`/login?next=/jobs/${jobId}`);
      return;
    }
    await ensureProfile({ type: "APPLY_JOB", jobId: String(jobId), jobTitle: job.title });
  };

  const handleToggleFavorite = async () => {
    if (!jobId || Number.isNaN(jobId)) return;
    if (!isAuthenticated) {
      router.push(`/login?next=/jobs/${jobId}`);
      return;
    }
    const result = await ensureProfile({ type: "FAVORITE_JOB" });
    if (!result.hasProfile) {
      return;
    }

    try {
      if (isFavorite) {
        await removeFavorite(jobId);
        setIsFavorite(false);
      } else {
        await addFavorite(jobId);
        setIsFavorite(true);
      }
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        variant: "destructive",
        title: "Không thể cập nhật yêu thích",
        description: apiError.message,
      });
    }
  };

  if (isLoading) {
    return (
      <Container className="py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/2 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
        </div>
      </Container>
    );
  }

  if (!job) {
    return (
      <Container className="py-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Không tìm thấy việc làm</h1>
          <p className="text-muted-foreground mt-4">Công việc bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <Button asChild className="mt-6">
            <Link href="/jobs">Quay lại danh sách</Link>
          </Button>
        </div>
      </Container>
    );
  }

  const bannerImage = PlaceHolderImages.find((p) => p.id === "job-detail-banner");
  const companyName = job.companyName ?? company?.companyName ?? "Không rõ";
  const companyAvatar = job.companyAvatarUrl ?? company?.avatarUrl ?? null;
  const companyIntro = company?.introduction ?? null;
  const companyLink = job.companyId ? `/companies/${job.companyId}` : "#";
  const requirementsText = (job.requirements ?? []).join("\n");

  return (
    <div className="flex flex-col">
      <main className="flex-1">
        <Container className="py-8">
          <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden mb-8">
            {bannerImage && (
              <Image
                src={bannerImage.imageUrl}
                alt="Job Banner"
                fill
                style={{ objectFit: "cover" }}
                data-ai-hint={bannerImage.imageHint}
              />
            )}
          </div>

          <div className="bg-card border rounded-xl p-6 md:p-8 -mt-20 relative z-10 max-w-4xl mx-auto shadow-lg">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {companyAvatar ? (
                <Image
                  src={companyAvatar}
                  alt={`${companyName} logo`}
                  width={80}
                  height={80}
                  className="rounded-md border p-1"
                />
              ) : null}
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold">{job.title}</h1>
                <Link href={companyLink} className="text-lg text-primary hover:underline">{companyName}</Link>
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-muted-foreground">
                  <p className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> {job.location ?? "Không rõ"}</p>
                  <p className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> {formatSalary(job)}</p>
                  <p className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" /> {formatJobType(job.jobType)}</p>
                  {job.deadline ? (
                    <p className="flex items-center gap-2"><CalendarClock className="w-5 h-5 text-primary" /> Hạn nộp: {format(new Date(job.deadline), "dd/MM/yyyy")}</p>
                  ) : null}
              </div>
              </div>
              <div className="flex items-center gap-2 mt-4 md:mt-0">
                <Button variant="outline" size="icon" onClick={handleToggleFavorite}>
                  {isFavorite ? <BookmarkCheck /> : <Bookmark />}
                </Button>
                <Button variant="outline" size="icon"><Share2 /></Button>
                <Button size="lg" className="ml-2" onClick={handleApply}>Ứng tuyển ngay</Button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-8">
            <div className="md:col-span-2 space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Mô tả công việc</h2>
                {job.description ? (
                  <div
                    className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatJobDescription(job.description) }}
                  />
                ) : (
                  <p className="text-muted-foreground">Chưa có mô tả.</p>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4">Yêu cầu kỹ năng</h2>
                {requirementsText ? (
                  <div
                    className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatJobDescription(requirementsText) }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa có yêu cầu kỹ năng.</p>
                )}
              </div>
            </div>
            <div className="md:col-span-1 space-y-6">
              <div className="bg-card border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Kỹ năng</h3>
                <div className="flex flex-wrap gap-2">
                  {(job.tags ?? []).map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                  {(job.tags?.length || 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có kỹ năng.</p>
                  ) : null}
                </div>
              </div>

              <div className="bg-card border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Danh mục</h3>
                <div className="flex flex-wrap gap-2">
                  {(job.categories ?? []).map((category) => (
                    <Badge key={category} variant="outline">{category}</Badge>
                  ))}
                  {(job.categories?.length || 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có danh mục.</p>
                  ) : null}
                </div>
              </div>

              <div className="bg-card border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Thông tin nhanh</h3>
                <p className="text-sm text-muted-foreground">Công việc được đăng bởi {companyName}.</p>
                {companyIntro ? (
                  <p className="mt-3 text-sm text-muted-foreground">{companyIntro}</p>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Chưa có thông tin giới thiệu công ty.</p>
                )}
                <Button asChild variant="link" className="p-0 mt-2">
                  <Link href={companyLink}>Tìm hiểu thêm</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
