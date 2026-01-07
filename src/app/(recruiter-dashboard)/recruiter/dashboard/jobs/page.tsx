'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import { Input } from "@/components/ui/input";
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
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { apiRequest, ApiError } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { searchJobs, searchApplications } from '@/lib/recruiter-search';
import { SortableHeader } from "@/components/ui/sortable-header";

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
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 400);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC" | null>(null);
  const allowedSortFields = useMemo(() => new Set(["title", "status", "createAt", "deadline"]), []);
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
    setSortBy(null);
    setSortOrder(null);
    if (currentPage !== 0) {
      setCurrentPage(0);
    }
  }, [debouncedSearch]);

  const handleSort = (field: string) => {
    if (!allowedSortFields.has(field)) return;
    setSortBy((current) => {
      if (current !== field) {
        setSortOrder("ASC");
        if (currentPage !== 0) {
          setCurrentPage(0);
        }
        return field;
      }
      setSortOrder((order) => (order === "ASC" ? "DESC" : "ASC"));
      if (currentPage !== 0) {
        setCurrentPage(0);
      }
      return current;
    });
  };

  useEffect(() => {
    const fetchJobs = async () => {
      if (!accessToken) {
        setIsLoading(false);
        setPostedJobs([]);
        setTotalCount(0);
        return;
      }
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const normalizedSortBy = sortBy && allowedSortFields.has(sortBy) ? sortBy : null;
        const normalizedSortOrder = normalizedSortBy ? sortOrder : null;
        const response = await searchJobs<PageListDTO<JobDTO>>({
          pagination: { page: currentPage, pageSize: DEFAULT_PAGE_SIZE },
          sortBy: normalizedSortBy ?? undefined,
          sortOrder: normalizedSortOrder ?? undefined,
          searchedBy: debouncedSearch,
          filter: null,
        }, accessToken);

        const items = response.data?.items || [];
        setTotalCount(response.data?.count ?? 0);
        const rows = await Promise.all(items.map(async (job) => {
          try {
            const apps = await searchApplications<PageListDTO<unknown>>(job.jobId, {
              pagination: { page: 0, pageSize: 1 },
              sortBy: null,
              sortOrder: null,
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
  }, [accessToken, currentPage, debouncedSearch, sortBy, sortOrder]);

  const handleCloseJob = async (jobId: number, jobTitle: string) => {
    if (!accessToken) {
      return;
    }

    const confirmed = typeof window === "undefined" ? true : window.confirm(`Dừng tin "${jobTitle}"?`);
    if (!confirmed) return;

    try {
      await apiRequest(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        accessToken,
        body: { status: "CLOSED" },
      });
      setPostedJobs(jobs => jobs.map(job => job.jobId === jobId ? { ...job, status: 'CLOSED' } : job));
      toast({
        title: "Dừng tin tuyển dụng",
        description: `Tin "${jobTitle}" da duoc dung.`,
      });
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        variant: "destructive",
        title: "Cập nhật thất bại",
        description: apiError.message || "Không thể cập nhật trạng thái tin.",
      });
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const pageItems = useMemo(() => {
    if (totalPages <= 1) return [0];
    const pages = new Set<number>([0, totalPages - 1, currentPage - 1, currentPage, currentPage + 1]);
    const sorted = Array.from(pages)
      .filter((page) => page >= 0 && page < totalPages)
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
  }, [currentPage, totalPages]);

  const goToPage = (page: number) => {
    if (page < 0 || page >= totalPages) return;
    setCurrentPage(page);
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card className="border-border/60 bg-background/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="grid gap-2">
            <CardTitle className="dark:text-slate-100">Quản lý tin tuyển dụng</CardTitle>
            <CardDescription className="dark:text-slate-300">
              Xem, sửa hoặc dừng các tin tuyển dụng của bạn.
            </CardDescription>
          </div>
          <div className="ml-auto flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm tin tuyển dụng..."
              className="h-9 w-full sm:w-[220px] dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
            <Button asChild size="sm" className="gap-1">
              <Link href="/recruiter/dashboard/post-job">
                Đăng tin mới
                <PlusCircle className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : errorMessage ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground dark:border-slate-800 dark:text-slate-300">
              {errorMessage}
            </div>
          ) : postedJobs.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortableHeader label="Vị trí" field="title" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    </TableHead>
                    <TableHead className="text-center">
                      <SortableHeader label="Ngày đăng" field="createAt" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="center" />
                    </TableHead>
                    <TableHead className="text-center">Ứng viên</TableHead>
                    <TableHead className="text-center">
                      <SortableHeader label="Trạng thái" field="status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="center" />
                    </TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {postedJobs.map(job => (
                    <TableRow key={job.jobId}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell className="text-center text-muted-foreground dark:text-slate-300">{formatDate(job.createdAt)}</TableCell>
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
                              <Link href={`/recruiter/dashboard/jobs/${job.jobId}/edit`}>Sửa</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/recruiter/dashboard/applicants/${job.jobId}`}>Xem Ứng viên</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCloseJob(job.jobId, job.title)}
                              disabled={job.status === 'CLOSED'}
                              className="text-red-500"
                            >
                              Dừng tin
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
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        goToPage(currentPage - 1);
                      }}
                    />
                  </PaginationItem>
                  {pageItems.map((pageItem, index) => {
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
                          href="#"
                          isActive={pageItem === currentPage}
                          onClick={(event) => {
                            event.preventDefault();
                            goToPage(pageItem);
                          }}
                        >
                          {pageItem + 1}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        goToPage(currentPage + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg dark:border-slate-800">
              <FilePlus className="mx-auto h-12 w-12 text-muted-foreground dark:text-slate-300" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Chưa có tin tuyển dụng nào</h3>
              <p className="mt-2 text-sm text-muted-foreground dark:text-slate-200">Hãy bắt đầu tạo tin tuyển dụng đầu tiên của bạn.</p>
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
