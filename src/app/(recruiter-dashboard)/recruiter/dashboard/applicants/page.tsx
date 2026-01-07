'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Users } from 'lucide-react';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
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

export default function RecruiterApplicantsPage() {
  const { accessToken } = useAuth();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 400);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC" | null>(null);
  const allowedSortFields = useMemo(() => new Set(["title", "createAt", "status"]), []);

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
        setJobs([]);
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

        setJobs(rows);
      } catch (error) {
        const apiError = error as ApiError;
        setErrorMessage(apiError.message || "Không thể tải danh sách tin tuyển dụng.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchJobs();
  }, [accessToken, currentPage, debouncedSearch, sortBy, sortOrder]);

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
      <Card className="border-border/60 bg-background/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="grid gap-2">
            <CardTitle className="text-slate-900 dark:text-slate-100">Quản lý ứng viên</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              Chọn tin tuyển dụng để xem danh sách ứng viên.
            </CardDescription>
          </div>
          <div className="ml-auto w-full sm:w-auto">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm tin tuyển dụng..."
              className="h-9 w-full sm:w-[220px] dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full dark:bg-slate-800" />
              <Skeleton className="h-10 w-full dark:bg-slate-800" />
            </div>
          ) : errorMessage ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground dark:border-slate-700/70 dark:text-slate-300">
              {errorMessage}
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground dark:border-slate-700/70 dark:text-slate-300">
              Chưa có tin tuyển dụng để hiển thị ứng viên.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-slate-600 dark:text-slate-300">
                      <SortableHeader label="Vị trí" field="title" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    </TableHead>
                    <TableHead className="text-center text-slate-600 dark:text-slate-300">
                      <SortableHeader label="Ngày đăng" field="createAt" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="center" />
                    </TableHead>
                    <TableHead className="text-center text-slate-600 dark:text-slate-300">Ứng viên</TableHead>
                    <TableHead className="text-right text-slate-600 dark:text-slate-300">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.jobId}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{job.title}</TableCell>
                      <TableCell className="text-center text-muted-foreground dark:text-slate-300">{formatDate(job.createdAt)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Users className="h-4 w-4" /> {job.applicants}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm">
                          <Link href={`/recruiter/dashboard/applicants/${job.jobId}`}>Xem Ứng viên</Link>
                        </Button>
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
          )}
        </CardContent>
      </Card>
    </main>
  );
}
