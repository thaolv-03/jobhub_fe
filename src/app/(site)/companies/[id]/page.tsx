'use client';

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Briefcase, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { useToast } from "@/hooks/use-toast";
import { getCompany, type Company } from "@/lib/companies";
import { formatJobType, searchJobs, type Job } from "@/lib/jobs";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const PAGE_SIZE = 6;

const formatSalary = (job: Job) => {
  const min = job.minSalary ?? null;
  const max = job.maxSalary ?? null;
  if (min != null && max != null) {
    return `${min} - ${max} triệu`;
  }
  if (min != null) {
    return `Từ ${min} triệu`;
  }
  if (max != null) {
    return `Đến ${max} triệu`;
  }
  return "Thương lượng";
};

export default function CompanyDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const companyIdParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const companyId = companyIdParam ? Number(companyIdParam) : NaN;

  const [company, setCompany] = React.useState<Company | null>(null);
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    const loadCompany = async () => {
      if (!companyId || Number.isNaN(companyId)) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const data = await getCompany(companyId);
        if (!mounted) return;
        setCompany(data);
      } catch (error) {
        if (!mounted) return;
        setCompany(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void loadCompany();
    return () => {
      mounted = false;
    };
  }, [companyId]);

  React.useEffect(() => {
    let mounted = true;
    const loadJobs = async () => {
      if (!companyId || Number.isNaN(companyId)) return;
      try {
        const data = await searchJobs({
          pagination: { page: 0, pageSize: PAGE_SIZE },
          sortedBy: [{ field: "createAt", sort: "DESC" }],
          searchedBy: "",
          filter: { companyIds: [companyId] },
        });
        if (!mounted) return;
        setJobs(data.items);
      } catch (error) {
        if (!mounted) return;
        setJobs([]);
        toast({
          variant: "destructive",
          title: "Không thể tải việc làm",
          description: "Vui lòng thử lại sau.",
        });
      }
    };
    void loadJobs();
    return () => {
      mounted = false;
    };
  }, [companyId, toast]);

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

  if (!company) {
    return (
      <Container className="py-10 text-center">
        <h1 className="text-3xl font-bold">Không tìm thấy công ty</h1>
        <p className="text-muted-foreground mt-4">Thông tin công ty không tồn tại hoặc đã bị xóa.</p>
        <Button asChild className="mt-6">
          <Link href="/companies">Quay lại danh sách công ty</Link>
        </Button>
      </Container>
    );
  }

  const logo = PlaceHolderImages.find((p) => p.id === "company-logo-fpt");

  return (
    <div className="flex flex-col">
      <main className="flex-1">
        <Container className="py-10 space-y-8">
          <Card>
            <CardContent className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between py-8">
              <div className="flex items-center gap-4">
                {company.avatarUrl ? (
                  <Image
                    src={company.avatarUrl}
                    alt={`${company.companyName} logo`}
                    width={72}
                    height={72}
                    className="rounded-xl border p-1"
                  />
                ) : logo ? (
                  <Image
                    src={logo.imageUrl}
                    alt="Company logo"
                    width={72}
                    height={72}
                    className="rounded-xl border p-1"
                    data-ai-hint={logo.imageHint}
                  />
                ) : null}
                <div>
                  <h1 className="text-2xl font-bold">{company.companyName}</h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {company.location ?? "Không rõ"}
                  </p>
                </div>
              </div>
              {company.website ? (
                <Button asChild variant="outline">
                  <a href={company.website} target="_blank" rel="noreferrer">Website công ty</a>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Giới thiệu công ty</CardTitle>
                  <CardDescription>Thông tin tổng quan về doanh nghiệp.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {company.introduction ?? "Chưa có thông tin giới thiệu."}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Việc làm đang tuyển</CardTitle>
                  <CardDescription>Danh sách job được đăng bởi công ty.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {jobs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có việc làm đang tuyển.</p>
                  ) : (
                    jobs.map((job) => (
                      <div key={job.jobId} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                        <div className="space-y-1">
                          <Link href={`/jobs/${job.jobId}`} className="font-semibold hover:underline">
                            {job.title}
                          </Link>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{formatJobType(job.jobType)}</span>
                            <span>{formatSalary(job)}</span>
                          </div>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/jobs/${job.jobId}`}>Xem chi tiết</Link>
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Thông tin nhanh</CardTitle>
                <CardDescription>Tổng quan doanh nghiệp.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p><span className="font-medium text-foreground">Tên công ty:</span> {company.companyName}</p>
                <p><span className="font-medium text-foreground">Địa điểm:</span> {company.location ?? "Không rõ"}</p>
                <p><span className="font-medium text-foreground">Website:</span> {company.website ?? "Chưa cập nhật"}</p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>
    </div>
  );
}
