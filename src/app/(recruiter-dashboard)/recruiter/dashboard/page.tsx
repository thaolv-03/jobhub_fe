'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { SortableHeader } from '@/components/ui/sortable-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useRecruiterJobs } from '@/hooks/use-jobs';
import { useApplications } from '@/hooks/use-applications';
import { getApplicationsCount } from '@/lib/recruiter-search';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  Briefcase,
  CheckCircle2,
  ArrowDown,
  ArrowUp,
  ExternalLink,
  MoreHorizontal,
  PlusCircle,
  Search,
  Users,
} from 'lucide-react';

const DEFAULT_PAGE_SIZE = 10;

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

type JobRow = JobDTO & {
  applicants: number;
};

export default function RecruiterDashboardPage() {
  const { roles, accessToken } = useAuth();
  const router = useRouter();
  const [jobsSearch, setJobsSearch] = React.useState("");
  const debouncedJobsSearch = useDebouncedValue(jobsSearch.trim(), 400);
  const [jobsSortBy, setJobsSortBy] = React.useState<string | null>(null);
  const [jobsSortOrder, setJobsSortOrder] = React.useState<"ASC" | "DESC" | null>(null);
  const [jobsPage, setJobsPage] = React.useState(0);
  const allowedJobsSortFields = React.useMemo(() => new Set(["title", "status", "createAt", "deadline"]), []);
  const [recentSearch, setRecentSearch] = React.useState("");
  const debouncedRecentSearch = useDebouncedValue(recentSearch.trim(), 400);
  const [recentSortBy, setRecentSortBy] = React.useState<string | null>(null);
  const [recentSortOrder, setRecentSortOrder] = React.useState<"ASC" | "DESC" | null>(null);
  const [recentPage, setRecentPage] = React.useState(0);
  const allowedRecentSortFields = React.useMemo(() => new Set(["appliedAt", "status"]), []);

  React.useEffect(() => {
    setJobsSortBy(null);
    setJobsSortOrder(null);
    if (jobsPage !== 0) {
      setJobsPage(0);
    }
  }, [debouncedJobsSearch]);

  React.useEffect(() => {
    setRecentSortBy(null);
    setRecentSortOrder(null);
    if (recentPage !== 0) {
      setRecentPage(0);
    }
  }, [debouncedRecentSearch]);

  const handleJobsSort = (field: string) => {
    if (!allowedJobsSortFields.has(field)) return;
    setJobsSortBy((current) => {
      if (current !== field) {
        setJobsSortOrder("ASC");
        if (jobsPage !== 0) setJobsPage(0);
        return field;
      }
      setJobsSortOrder((order) => (order === "ASC" ? "DESC" : "ASC"));
      if (jobsPage !== 0) setJobsPage(0);
      return current;
    });
  };

  const handleRecentSortChange = (value: string) => {
    if (value === "none") {
      setRecentSortBy(null);
      setRecentSortOrder(null);
      if (recentPage !== 0) {
        setRecentPage(0);
      }
      return;
    }
    setRecentSortBy(value);
    setRecentSortOrder("ASC");
    if (recentPage !== 0) {
      setRecentPage(0);
    }
  };

  // Memoize request object to prevent queryKey changes
  const jobsRequest = React.useMemo(() => {
    const normalizedSortBy = jobsSortBy && allowedJobsSortFields.has(jobsSortBy) ? jobsSortBy : null;
    const normalizedSortOrder = normalizedSortBy ? jobsSortOrder : null;
    return {
      pagination: { page: jobsPage, pageSize: DEFAULT_PAGE_SIZE },
      sortBy: normalizedSortBy ?? undefined,
      sortOrder: normalizedSortOrder ?? undefined,
      searchedBy: debouncedJobsSearch,
      filter: null,
    };
  }, [jobsPage, jobsSortBy, jobsSortOrder, debouncedJobsSearch, allowedJobsSortFields]);

  // Memoize enabled flag to ensure stability
  const isJobsEnabled = React.useMemo(() => !!accessToken, [accessToken]);

  // Fetch jobs with React Query (recruiter endpoint)
  const { data: jobsResponse, isLoading: isJobsLoading } = useRecruiterJobs(
    jobsRequest,
    accessToken,
    isJobsEnabled
  );

  // Memoize jobItems to prevent infinite loop
  const jobItems = React.useMemo(() => jobsResponse?.items ?? [], [jobsResponse?.items]);
  
  // Extract job IDs for dependency comparison (stable reference)
  const jobIdList = React.useMemo(() => jobItems.map((job) => job.jobId), [jobItems]);
  const jobIdsKey = React.useMemo(() => {
    const ids = [...jobIdList].sort((a, b) => a - b);
    return ids.length > 0 ? ids.join(',') : '';
  }, [jobIdList]);

  // Fetch application counts for all jobs in parallel using Promise.all
  const [applicationCounts, setApplicationCounts] = React.useState<Record<number, number>>({});
  const [isLoadingCounts, setIsLoadingCounts] = React.useState(false);

  React.useEffect(() => {
    if (!accessToken || jobIdsKey === '') {
      setApplicationCounts({});
      setIsLoadingCounts(false);
      return;
    }

    let mounted = true;
    setIsLoadingCounts(true);

    getApplicationsCount<Record<string, number>>(jobIdList, accessToken)
      .then((result) => {
        if (!mounted) return;
        const response = result.data ?? {};
        const counts: Record<number, number> = {};
        jobIdList.forEach((jobId) => {
          counts[jobId] = response[String(jobId)] ?? 0;
        });
        setApplicationCounts(counts);
        setIsLoadingCounts(false);
      })
      .catch(() => {
        if (!mounted) return;
        const counts: Record<number, number> = {};
        jobIdList.forEach((jobId) => {
          counts[jobId] = 0;
        });
        setApplicationCounts(counts);
        setIsLoadingCounts(false);
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobIdsKey, accessToken]);

  // Combine jobs with application counts
  const jobs = useMemo(() => {
    return jobItems.map((job) => ({
      ...job,
      applicants: applicationCounts[job.jobId] ?? 0,
    }));
  }, [jobItems, applicationCounts]);

  const jobsTotalCount = jobsResponse?.count ?? 0;
  const jobsTotalPages = Math.max(1, Math.ceil(jobsTotalCount / DEFAULT_PAGE_SIZE));
  const jobsPageItems = useMemo(() => {
    if (jobsTotalPages <= 1) return [0];
    const pages = new Set<number>([0, jobsTotalPages - 1, jobsPage - 1, jobsPage, jobsPage + 1]);
    const sorted = Array.from(pages)
      .filter((page) => page >= 0 && page < jobsTotalPages)
      .sort((a, b) => a - b);
    const result: Array<number | "ellipsis"> = [];
    let prev = -1;
    sorted.forEach((page) => {
      if (prev !== -1 && page - prev > 1) {
        result.push("ellipsis");
      }
      result.push(page);
      prev = page;
    });
    return result;
  }, [jobsPage, jobsTotalPages]);

  const goToJobsPage = (page: number) => {
    if (page < 0 || page >= jobsTotalPages) return;
    setJobsPage(page);
  };

  // Memoize applications request object
  const applicationsRequest = React.useMemo(() => {
    const normalizedSortBy = recentSortBy && allowedRecentSortFields.has(recentSortBy) ? recentSortBy : null;
    const normalizedSortOrder = normalizedSortBy ? recentSortOrder : null;
    return {
      pagination: { page: recentPage, pageSize: DEFAULT_PAGE_SIZE },
      sortBy: normalizedSortBy ?? undefined,
      sortOrder: normalizedSortOrder ?? undefined,
      searchedBy: debouncedRecentSearch,
      filter: null,
    };
  }, [recentPage, recentSortBy, recentSortOrder, debouncedRecentSearch, allowedRecentSortFields]);

  // Memoize firstJobId to prevent unnecessary re-renders
  const firstJobId = React.useMemo<number | null>(() => {
    if (jobs.length === 0) return null;
    const firstJob = jobs[0];
    if (!firstJob || typeof firstJob.jobId !== 'number') return null;
    return firstJob.jobId;
  }, [jobs.length, jobs[0]?.jobId ?? null]);

  // Memoize enabled flag for applications
  const isApplicationsEnabled = React.useMemo(() => !!firstJobId && !!accessToken, [firstJobId, accessToken]);

  // Fetch recent applicants for first job
  const { data: applicationsResponse } = useApplications(
    firstJobId,
    applicationsRequest,
    accessToken,
    isApplicationsEnabled
  );

  const recentApplicants = applicationsResponse?.data?.items ?? [];
  const recentTotalCount = applicationsResponse?.data?.count ?? 0;
  const recentTotalPages = Math.max(1, Math.ceil(recentTotalCount / DEFAULT_PAGE_SIZE));
  const recentPageItems = useMemo(() => {
    if (recentTotalPages <= 1) return [0];
    const pages = new Set<number>([0, recentTotalPages - 1, recentPage - 1, recentPage, recentPage + 1]);
    const sorted = Array.from(pages)
      .filter((page) => page >= 0 && page < recentTotalPages)
      .sort((a, b) => a - b);
    const result: Array<number | "ellipsis"> = [];
    let prev = -1;
    sorted.forEach((page) => {
      if (prev !== -1 && page - prev > 1) {
        result.push("ellipsis");
      }
      result.push(page);
      prev = page;
    });
    return result;
  }, [recentPage, recentTotalPages]);

  const goToRecentPage = (page: number) => {
    if (page < 0 || page >= recentTotalPages) return;
    setRecentPage(page);
  };

  const handlePostJobClick = () => {
    if (roles.includes('RECRUITER')) {
      router.push('/recruiter/dashboard/post-job');
    } else {
      router.push('/recruiter/dashboard/upgrade-recruiter');
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

  const isLoading = isJobsLoading;
  const totalApplicants = jobs.reduce((sum, job) => sum + job.applicants, 0);
  const openJobs = jobs.filter((job) => job.status === 'OPEN').length;

  const stats = [
    { label: 'Tổng tin đăng', value: jobsTotalCount, icon: Briefcase, badge: 'Tất cả' },
    { label: 'Tin đang mở', value: openJobs, icon: CheckCircle2, badge: 'Đang tuyển' },
    { label: 'Lượt ứng tuyển mới', value: totalApplicants, icon: Users, badge: 'Tổng' },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">Tổng quan</h2>
        <p className="text-sm text-muted-foreground dark:text-slate-300">
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
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className="shadow-sm border-border/60 dark:border-slate-800 dark:bg-slate-950/70">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                    <div>
                      <CardDescription className="text-slate-600 dark:text-slate-200">{item.label}</CardDescription>
                      <CardTitle className="text-3xl text-slate-900 dark:text-slate-100">{item.value}</CardTitle>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20">
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
            <Card className="lg:col-span-2 shadow-sm border-border/60 dark:border-slate-800 dark:bg-slate-950/70">
              <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="grid gap-1">
                  <CardTitle className="dark:text-slate-100">Quản lý tin tuyển dụng</CardTitle>
                  <CardDescription className="dark:text-slate-300">
                    Theo dõi, chỉnh sửa và kiểm soát hiệu quả tin tuyển dụng của bạn.
                  </CardDescription>
                </div>
                <div className="ml-auto flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={jobsSearch}
                      onChange={(event) => setJobsSearch(event.target.value)}
                      placeholder="Tìm tin tuyển dụng"
                      className="pl-9"
                    />
                  </div>
                  <Button size="sm" className="gap-2" onClick={handlePostJobClick}>
                    Đăng tin mới
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-8 text-center dark:border-slate-800 dark:bg-slate-900/40">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-medium text-slate-900 dark:text-slate-100">Chưa có tin tuyển dụng</p>
                      <p className="text-sm text-muted-foreground dark:text-slate-200">
                        Tạo tin đầu tiên để bắt đầu nhận ứng viên phù hợp.
                      </p>
                    </div>
                    <Button size="sm" onClick={handlePostJobClick}>
                      Đăng tin mới
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-lg border border-border/60 dark:border-slate-800">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              <SortableHeader label="Vị trí" field="title" sortBy={jobsSortBy} sortOrder={jobsSortOrder} onSort={handleJobsSort} />
                            </TableHead>
                          <TableHead className="text-center">Ứng viên</TableHead>
                            <TableHead className="text-center">
                              <SortableHeader label="Trạng thái" field="status" sortBy={jobsSortBy} sortOrder={jobsSortOrder} onSort={handleJobsSort} align="center" />
                            </TableHead>
                            <TableHead className="text-center">
                              <SortableHeader label="Ngày đăng" field="createAt" sortBy={jobsSortBy} sortOrder={jobsSortOrder} onSort={handleJobsSort} align="center" />
                            </TableHead>
                            <TableHead className="text-right">Hành động</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {jobs.map((job) => (
                            <TableRow key={job.jobId}>
                              <TableCell className="font-medium">{job.title}</TableCell>
                              <TableCell className="text-center">
                                <Link
                                  href={`/recruiter/dashboard/applicants/${job.jobId}`}
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
                                      <Link href={`/recruiter/dashboard/applicants/${job.jobId}`}>
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
                    <Pagination className="mt-4">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => goToJobsPage(jobsPage - 1)}
                            className={jobsPage === 0 ? "pointer-events-none opacity-50" : undefined}
                          />
                        </PaginationItem>
                        {jobsPageItems.map((pageItem, index) => {
                          if (pageItem === "ellipsis") {
                            return (
                              <PaginationItem key={`ellipsis-${index}`}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return (
                            <PaginationItem key={pageItem}>
                              <PaginationLink
                                isActive={pageItem === jobsPage}
                                onClick={() => goToJobsPage(pageItem)}
                              >
                                {pageItem + 1}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => goToJobsPage(jobsPage + 1)}
                            className={jobsPage >= jobsTotalPages - 1 ? "pointer-events-none opacity-50" : undefined}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/60 dark:border-slate-800 dark:bg-slate-950/70">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="dark:text-slate-100">Ứng viên gần đây</CardTitle>
                  <CardDescription className="dark:text-slate-300">Những ứng viên mới nhất từ tin đăng của bạn.</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={recentSearch}
                      onChange={(event) => setRecentSearch(event.target.value)}
                      placeholder="Tìm ứng viên"
                      className="pl-9"
                    />
                  </div>
                  <Select value={recentSortBy ?? "none"} onValueChange={handleRecentSortChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sắp xếp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không sắp xếp</SelectItem>
                      <SelectItem value="appliedAt">Ngày nộp</SelectItem>
                      <SelectItem value="status">Trạng thái</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!recentSortBy}
                    onClick={() => {
                      setRecentSortOrder((order) => (order === "ASC" ? "DESC" : "ASC"));
                      if (recentPage !== 0) {
                        setRecentPage(0);
                      }
                    }}
                  >
                    {recentSortOrder === "DESC" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                {recentApplicants.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-6 text-center dark:border-slate-800 dark:bg-slate-900/40">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
                      <Users className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-medium text-slate-900 dark:text-slate-100">Chưa có ứng viên</p>
                      <p className="text-sm text-muted-foreground dark:text-slate-200">Ứng viên mới sẽ xuất hiện tại đây.</p>
                    </div>
                  </div>
                ) : (
                  recentApplicants.map((applicant) => (
                    <div key={applicant.applicationId} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground dark:bg-slate-900/60 dark:text-slate-300">
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
                <Pagination className="pt-2">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => goToRecentPage(recentPage - 1)}
                        className={recentPage === 0 ? "pointer-events-none opacity-50" : undefined}
                      />
                    </PaginationItem>
                    {recentPageItems.map((pageItem, index) => {
                      if (pageItem === "ellipsis") {
                        return (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return (
                        <PaginationItem key={pageItem}>
                          <PaginationLink
                            isActive={pageItem === recentPage}
                            onClick={() => goToRecentPage(pageItem)}
                          >
                            {pageItem + 1}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => goToRecentPage(recentPage + 1)}
                        className={recentPage >= recentTotalPages - 1 ? "pointer-events-none opacity-50" : undefined}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </CardContent>
              <CardFooter>
                <Button asChild size="sm" className="w-full">
                  <Link href="/recruiter/dashboard/applicants">
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
