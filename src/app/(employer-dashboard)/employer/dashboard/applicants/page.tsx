'use client';

import React, { useEffect, useState } from 'react';
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

export default function EmployerApplicantsPage() {
  const { accessToken } = useAuth();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        return;
      }
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
      <Card>
        <CardHeader>
          <CardTitle>Quản lý ứng viên</CardTitle>
          <CardDescription>Chọn tin tuyển dụng để xem danh sách ứng viên.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : errorMessage ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              {errorMessage}
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Chưa có tin tuyển dụng để hiển thị ứng viên.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vị trí</TableHead>
                  <TableHead className="text-center">Ngày đăng</TableHead>
                  <TableHead className="text-center">Ứng viên</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.jobId}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{formatDate(job.createdAt)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4" /> {job.applicants}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm">
                        <Link href={`/employer/dashboard/applicants/${job.jobId}`}>Xem ứng viên</Link>
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
