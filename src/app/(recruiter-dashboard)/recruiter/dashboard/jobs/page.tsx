'use client';

import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Users, FilePlus } from "lucide-react";
import Link from "next/link";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest, ApiError } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { searchJobs, searchApplications } from '@/lib/recruiter-search';

const DEFAULT_PAGE_SIZE = 10;

type JobDTO = {
  jobId: number;
  title: string;
  status: string;
  createdAt?: string | null;
};

type PageListDTO<T> = {
  items: T[];
  count: number;
};

type JobRow = JobDTO & {
  applicants: number;
};

export default function RecruiterJobsPage() {
  const { accessToken } = useAuth();
  const [postedJobs, setPostedJobs] = useState<JobRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "OPEN":
        return "secondary";
      case "CLOSED":
        return "destructive";
      case "DRAFT":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("vi-VN");
  };

  useEffect(() => {
    const fetchJobs = async () => {
      if (!accessToken) {
        setIsLoading(false);
        setPostedJobs([]);
        return;
      }
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await searchJobs<PageListDTO<JobDTO>>({
          pagination: { page: 0, pageSize: DEFAULT_PAGE_SIZE },
          sortedBy: [{ field: "createAt", sort: "desc" }],
          searchedBy: "",
          filter: null,
        }, accessToken);

        const items = response.data?.items || [];
        const rows = await Promise.all(items.map(async (job) => {
          try {
            const apps = await searchApplications<PageListDTO<unknown>>(job.jobId, {
              pagination: { page: 0, pageSize: 1 },
              sortedBy: [],
              searchedBy: "",
              filter: null,
            }, accessToken);
            return { ...job, applicants: apps.data?.count || 0 };
          } catch {
            return { ...job, applicants: 0 };
          }
        }));

        setPostedJobs(rows);
      } catch (error) {
        const apiError = error as ApiError;
        setErrorMessage(apiError.message || "Không thể tải danh sách tin tuyển dụng.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchJobs();
  }, [accessToken]);

  const handleCloseJob = async (jobId: number, jobTitle: string) => {
    if (!accessToken) {
      return;
    }

    const confirmed = typeof window === "undefined" ? true : window.confirm(`D?ng tin "${jobTitle}"?`);
    if (!confirmed) return;

    try {
      await apiRequest(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        accessToken,
        body: { status: "CLOSED" },
      });
      setPostedJobs(jobs => jobs.map(job => job.jobId === jobId ? { ...job, status: 'CLOSED' } : job));
      toast({
        title: "Đăng tin tuyển dụng",
        description: `Tin "${jobTitle}" đã được đóng.`,
      });
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        variant: "destructive",
        title: "Cập nhật thất bại",
        description: apiError.message || "Không thể cập nhật trạng thái tin.",
      });
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle>Quản lý tin tuyển dụng</CardTitle>
            <CardDescription>
              Xem, sửa hoặc đóng các tin tuyển dụng của bạn.
            </CardDescription>
          </div>
          <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/recruiter/dashboard/post-job">
              Đăng tin mới
              <PlusCircle className="h-4 w-4" />
            </Link>
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
          ) : postedJobs.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vị trí</TableHead>
                    <TableHead className="text-center">Ngày đăng</TableHead>
                    <TableHead className="text-center">Ứng viên</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {postedJobs.map(job => (
                    <TableRow key={job.jobId}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{formatDate(job.createdAt)}</TableCell>
                      <TableCell className="text-center">
                        <Link href={`/recruiter/dashboard/applicants/${job.jobId}`} className="text-primary hover:underline flex items-center justify-center gap-2">
                          {job.applicants} <Users className="h-4 w-4" />
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusVariant(job.status) as any}>{job.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem asChild>
                              <Link href={`/recruiter/dashboard/jobs/${job.jobId}/edit`}>S?a</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/recruiter/dashboard/applicants/${job.jobId}`}>Xem ứng viên</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCloseJob(job.jobId, job.title)}
                              disabled={job.status === 'CLOSED'}
                              className="text-red-500"
                            >
                              Đóng tin
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <FilePlus className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Chưa có tin tuyển dụng nào</h3>
              <p className="mt-2 text-sm text-muted-foreground">Hãy bắt đầu tạo tin tuyển dụng đầu tiên của bạn.</p>
              <Button asChild className="mt-6">
                <Link href="/recruiter/dashboard/post-job">Đăng tin ngay</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}


