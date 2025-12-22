'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { searchApplications, searchJobs } from '@/lib/recruiter-search';
import {
  Briefcase,
  CheckCircle2,
  ExternalLink,
  MoreHorizontal,
  PlusCircle,
  Users,
} from 'lucide-react';

const DEFAULT_PAGE_SIZE = 5;

type JobDTO = {
  jobId: number;
  title: string;
  status: string;
  createdAt?: string | null;
};

type ApplicationDTO = {
  applicationId: string;
  jobId: number;
  jobSeekerId: number;
  appliedAt: string;
  status: string;
};

type PageListDTO<T> = {
  items: T[];
  count: number;
};

type JobRow = JobDTO & {
  applicants: number;
};

export default function EmployerDashboardPage() {
  const { roles, accessToken } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [recentApplicants, setRecentApplicants] = useState<ApplicationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const lastTokenRef = useRef<string | null>(null);

  const handlePostJobClick = () => {
    if (roles.includes('RECRUITER')) {
      router.push('/employer/dashboard/post-job');
    } else {
      router.push('/employer/dashboard/upgrade-recruiter');
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('vi-VN');
  };

  const getStatusVariant = (status: string): 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'OPEN':
        return 'secondary';
      case 'CLOSED':
        return 'destructive';
      case 'DRAFT':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'Đang mở';
      case 'CLOSED':
        return 'Đã đóng';
      case 'DRAFT':
        return 'Nháp';
      default:
        return status;
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!accessToken) return;
      if (isFetchingRef.current) return;
      if (lastTokenRef.current === accessToken) return;
      lastTokenRef.current = accessToken;
      isFetchingRef.current = true;
      setIsLoading(true);
      setErrorMessage(null);
      let hasError = false;
      try {
        const jobsResponse = await searchJobs<PageListDTO<JobDTO>>({
          pagination: { page: 0, pageSize: DEFAULT_PAGE_SIZE },
          sortedBy: [{ field: 'createAt', sort: 'desc' }],
          searchedBy: '',
          filter: null,
        }, accessToken);

        const jobItems = jobsResponse.data?.items || [];
        const rows = await Promise.all(jobItems.map(async (job) => {
          try {
            const apps = await searchApplications<PageListDTO<unknown>>(job.jobId, {
              pagination: { page: 0, pageSize: 1 },
              sortedBy: [],
              searchedBy: '',
              filter: null,
            }, accessToken);
            return { ...job, applicants: apps.data?.count || 0 };
          } catch {
            return { ...job, applicants: 0 };
          }
        }));

        setJobs(rows);

        if (rows.length > 0) {
          const applications = await searchApplications<PageListDTO<ApplicationDTO>>(rows[0].jobId, {
            pagination: { page: 0, pageSize: 5 },
            sortedBy: [],
            searchedBy: '',
            filter: null,
          }, accessToken);
          setRecentApplicants(applications.data?.items || []);
        } else {
          setRecentApplicants([]);
        }
      } catch (error) {
        hasError = true;
        const apiError = error as ApiError;
        setErrorMessage(apiError.message || 'Không thể tải dữ liệu dashboard.');
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
        if (hasError) {
          lastTokenRef.current = null;
        }
      }
    };

    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    void fetchDashboard();
  }, [accessToken]);

  const totalApplicants = jobs.reduce((sum, job) => sum + job.applicants, 0);
  const openJobs = jobs.filter((job) => job.status === 'OPEN').length;

  const stats = [
    { label: 'Tổng tin đăng', value: jobs.length, icon: Briefcase, badge: 'Tất cả' },
    { label: 'Tin đang mở', value: openJobs, icon: CheckCircle2, badge: 'Đang tuyển' },
    { label: 'Lượt ứng tuyển mới', value: totalApplicants, icon: Users, badge: 'Tổng' },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">Tổng quan</h2>
        <p className="text-sm text-muted-foreground">
          Bảng điều khiển nhanh giúp bạn theo dõi hiệu quả tuyển dụng và ứng viên mới.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-[320px] w-full md:col-span-2" />
          <Skeleton className="h-[320px] w-full" />
        </div>
      ) : errorMessage ? (
        <div className="rounded-lg border border-dashed bg-background p-6 text-center text-sm text-muted-foreground">
          {errorMessage}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                    <div>
                      <CardDescription>{item.label}</CardDescription>
                      <CardTitle className="text-3xl">{item.value}</CardTitle>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">{item.badge}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="grid gap-1">
                  <CardTitle>Quản lý tin tuyển dụng</CardTitle>
                  <CardDescription>
                    Theo dõi, chỉnh sửa và kiểm soát hiệu quả tin tuyển dụng của bạn.
                  </CardDescription>
                </div>
                <Button size="sm" className="gap-2 lg:ml-auto" onClick={handlePostJobClick}>
                  Đăng tin mới
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-medium">Chưa có tin tuyển dụng</p>
                      <p className="text-sm text-muted-foreground">
                        Tạo tin đầu tiên để bắt đầu nhận ứng viên phù hợp.
                      </p>
                    </div>
                    <Button size="sm" onClick={handlePostJobClick}>
                      Đăng tin mới
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vị trí</TableHead>
                          <TableHead className="text-center">Ứng viên</TableHead>
                          <TableHead className="text-center">Trạng thái</TableHead>
                          <TableHead className="text-center">Ngày đăng</TableHead>
                          <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobs.map((job) => (
                          <TableRow key={job.jobId}>
                            <TableCell className="font-medium">{job.title}</TableCell>
                            <TableCell className="text-center">
                              <Link
                                href={`/employer/dashboard/applicants/${job.jobId}`}
                                className="inline-flex items-center justify-center gap-2 text-primary hover:underline"
                              >
                                {job.applicants} <Users className="h-4 w-4" />
                              </Link>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={getStatusVariant(job.status)}>{getStatusLabel(job.status)}</Badge>
                            </TableCell>
                            <TableCell className="text-center text-sm text-muted-foreground">
                              {formatDate(job.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Chỉnh sửa</DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/employer/dashboard/applicants/${job.jobId}`}>
                                      Xem ứng viên
                                    </Link>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Ứng viên gần đây</CardTitle>
                <CardDescription>Những ứng viên mới nhất từ tin đăng của bạn.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {recentApplicants.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Users className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-medium">Chưa có ứng viên</p>
                      <p className="text-sm text-muted-foreground">Ứng viên mới sẽ xuất hiện tại đây.</p>
                    </div>
                  </div>
                ) : (
                  recentApplicants.map((applicant) => (
                    <div key={applicant.applicationId} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Ứng viên #{applicant.jobSeekerId}</p>
                        <p className="text-xs text-muted-foreground">Job #{applicant.jobId}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(applicant.appliedAt)}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
              <CardFooter>
                <Button asChild size="sm" className="w-full">
                  <Link href="/employer/dashboard/applicants">
                    Xem tất cả ứng viên
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
