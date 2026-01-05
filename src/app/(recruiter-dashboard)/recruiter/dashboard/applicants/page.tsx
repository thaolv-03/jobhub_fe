'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { apiRequest, ApiError } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { searchJobs, searchApplications } from '@/lib/recruiter-search';

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
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const lastTokenRef = useRef<string | null>(null);

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
        setJobs([]);
        hasLoadedRef.current = false;
        lastTokenRef.current = null;
        return;
      }
      if (hasLoadedRef.current && lastTokenRef.current === accessToken) {
        return;
      }
      lastTokenRef.current = accessToken;
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await searchJobs<PageListDTO<JobDTO>>({
          pagination: { page: 0, pageSize: 10 },
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

        setJobs(rows);
        hasLoadedRef.current = true;
      } catch (error) {
        const apiError = error as ApiError;
        setErrorMessage(apiError.message || "Không thể tải danh sách tin tuyển dụng.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchJobs();
  }, [accessToken]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card className="border-border/60 bg-background/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Quản lý ứng viên</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-300">
            Chọn tin tuyển dụng để xem danh sách ứng viên.
          </CardDescription>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-slate-600 dark:text-slate-300">Vị trí</TableHead>
                  <TableHead className="text-center text-slate-600 dark:text-slate-300">Ngày đăng</TableHead>
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
                        <Link href={`/recruiter/dashboard/applicants/${job.jobId}`}>Xem ứng viên</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}


