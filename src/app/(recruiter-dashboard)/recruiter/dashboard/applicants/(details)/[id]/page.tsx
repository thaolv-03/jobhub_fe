'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest, ApiError } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { searchApplications } from '@/lib/recruiter-search';

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

export default function ApplicantsDetailPage() {
  const params = useParams();
  const jobId = Number(params?.id);
  const { accessToken } = useAuth();
  const [applications, setApplications] = useState<ApplicationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("vi-VN");
  };

  useEffect(() => {
    const fetchApplications = async () => {
      if (!accessToken || !jobId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await searchApplications<PageListDTO<ApplicationDTO>>(jobId, {
          pagination: { page: 0, pageSize: 20 },
          sortedBy: [],
          searchedBy: "",
          filter: null,
        }, accessToken);
        setApplications(response.data?.items || []);
      } catch (error) {
        const apiError = error as ApiError;
        setErrorMessage(apiError.message || 'Không thể tải danh sách ứng viên.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchApplications();
  }, [accessToken, jobId]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle>Danh sách ứng viên</CardTitle>
            <CardDescription>Danh sách ứng viên cho tin tuyển dụng #{jobId}.</CardDescription>
          </div>
          <Button asChild variant="outline" className="ml-auto">
            <Link href="/recruiter/dashboard/applicants">Quay lại</Link>
          </Button>
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
          ) : applications.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Chưa có ứng viên nào cho tin này.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application ID</TableHead>
                  <TableHead className="text-center">Ứng viên</TableHead>
                  <TableHead className="text-center">Ngày nộp</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((item) => (
                  <TableRow key={item.applicationId}>
                    <TableCell className="font-medium">{item.applicationId}</TableCell>
                    <TableCell className="text-center">#{item.jobSeekerId}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{formatDate(item.appliedAt)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{item.status}</Badge>
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

