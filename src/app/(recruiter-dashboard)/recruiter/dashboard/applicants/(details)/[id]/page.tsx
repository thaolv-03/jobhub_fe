'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { updateApplicationStatus } from '@/lib/applications';
import { sendApplicationStatusNotification } from '@/lib/notifications';
import { searchApplications } from '@/lib/recruiter-search';

type ApplicationDTO = {
  applicationId: string;
  jobId: number;
  jobSeekerId: number;
  appliedAt: string;
  status: string;
  matchingScore?: number | null;
};

type PageListDTO<T> = {
  items: T[];
  count: number;
};

const statusOptions = [
  { value: "APPLIED", label: "Đã ứng tuyển", canUpdate: false },
  { value: "REVIEWING", label: "Đang xem xét", canUpdate: true },
  { value: "SHORTLIST", label: "Phỏng vấn", canUpdate: true },
  { value: "REJECTED", label: "Từ chối", canUpdate: true },
  { value: "HIRED", label: "Đã tuyển", canUpdate: true },
  { value: "WITHDRAWN", label: "Ứng viên rút hồ sơ", canUpdate: false },
];

const getStatusLabel = (status?: string | null) => {
  const matched = statusOptions.find((option) => option.value === status);
  return matched?.label ?? status ?? "-";
};

export default function ApplicantsDetailPage() {
  const params = useParams();
  const jobId = Number(params?.id);
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<ApplicationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("vi-VN");
  };

  const formatScore = (value?: number | null) => {
    if (value == null || Number.isNaN(value)) return "-";
    const normalized = value > 1 ? value : value * 100;
    return `${normalized.toFixed(0)}%`;
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
          sortedBy: [{ field: "matchingScore", sort: "DESC" }],
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

  const handleStatusChange = async (application: ApplicationDTO, nextStatus: string) => {
    if (!accessToken || !application?.applicationId || application.status === nextStatus) {
      return;
    }
    const prevStatus = application.status;
    setUpdatingIds((prev) => ({ ...prev, [application.applicationId]: true }));
    setApplications((prev) =>
      prev.map((item) =>
        item.applicationId === application.applicationId ? { ...item, status: nextStatus } : item
      )
    );
    try {
      await updateApplicationStatus(application.applicationId, nextStatus, null, accessToken);
      await sendApplicationStatusNotification(
        {
          applicationId: application.applicationId,
          jobId: application.jobId,
          jobSeekerId: application.jobSeekerId,
          status: nextStatus,
        },
        accessToken
      );
      toast({
        title: "Cập nhật trạng thái thành công",
        description: `Ứng viên #${application.jobSeekerId} đã được cập nhật trạng thái.`,
      });
    } catch (error) {
      const apiError = error as ApiError;
      setApplications((prev) =>
        prev.map((item) =>
          item.applicationId === application.applicationId ? { ...item, status: prevStatus } : item
        )
      );
      toast({
        variant: "destructive",
        title: "Không thể cập nhật trạng thái",
        description: apiError.message || "Vui lòng thử lại.",
      });
    } finally {
      setUpdatingIds((prev) => ({ ...prev, [application.applicationId]: false }));
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card className="border-border/60 bg-background/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle className="text-slate-900 dark:text-slate-100">Danh sách ứng viên</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              Danh sách ứng viên cho tin tuyển dụng #{jobId}.
            </CardDescription>
          </div>
          <Button asChild variant="outline" className="ml-auto dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
            <Link href="/recruiter/dashboard/applicants">Quay lại</Link>
          </Button>
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
          ) : applications.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground dark:border-slate-700/70 dark:text-slate-300">
              Chưa có ứng viên nào cho tin này.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-slate-600 dark:text-slate-300">No.</TableHead>
                  <TableHead className="text-center text-slate-600 dark:text-slate-300">Ứng viên</TableHead>
                  <TableHead className="text-center text-slate-600 dark:text-slate-300">Ngày nộp</TableHead>
                  <TableHead className="text-center text-slate-600 dark:text-slate-300">Điểm</TableHead>
                  <TableHead className="text-center text-slate-600 dark:text-slate-300">Trạng thái</TableHead>
                  <TableHead className="text-center text-slate-600 dark:text-slate-300">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((item, index) => (
                  <TableRow key={item.applicationId}>
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">{index + 1}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span>#{item.jobSeekerId}</span>
                        {index < 3 ? (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                            {`Top ${index + 1}`}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground dark:text-slate-300">{formatDate(item.appliedAt)}</TableCell>
                    <TableCell className="text-center">
                      {formatScore(item.matchingScore)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <Select
                          value={item.status ?? ""}
                          onValueChange={(value) => void handleStatusChange(item, value)}
                          disabled={updatingIds[item.applicationId]}
                        >
                          <SelectTrigger className="h-9 w-[180px] border-slate-200 text-xs dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
                            <SelectValue placeholder={getStatusLabel(item.status)} />
                          </SelectTrigger>
                          <SelectContent className="dark:border-slate-800 dark:bg-slate-950">
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value} disabled={!option.canUpdate}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button asChild size="sm" variant="outline" className="dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
                        <Link
                          href={`/recruiter/dashboard/applicants/${jobId}/${item.jobSeekerId}?applicationId=${item.applicationId}`}
                        >
                          Xem hồ sơ
                        </Link>
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

