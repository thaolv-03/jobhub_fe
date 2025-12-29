'use client';

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { listApplications, withdrawApplication, type Application } from "@/lib/applications";
import { getJob, type Job } from "@/lib/jobs";
import { ApiError } from "@/lib/api-types";

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Đã nộp",
  REVIEWING: "Đang xem",
  SHORTLIST: "Phỏng vấn",
  REJECTED: "Từ chối",
  HIRED: "Đã nhận",
  WITHDRAWN: "Đã rút",
};

const getStatusVariant = (status?: string | null) => {
  switch (status) {
    case "APPLIED":
      return "default";
    case "REVIEWING":
    case "SHORTLIST":
      return "secondary";
    case "REJECTED":
      return "destructive";
    case "WITHDRAWN":
      return "outline";
    case "HIRED":
      return "default";
    default:
      return "outline";
  }
};

type ApplicationRow = Application & { job?: Job | null };

export default function AppliedJobsPage() {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<ApplicationRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    const loadApplications = async () => {
      setIsLoading(true);
      try {
        const data = await listApplications(0, 50);
        const jobs = await Promise.all(
          data.items.map(async (item) => {
            try {
              return await getJob(item.jobId);
            } catch (error) {
              return null;
            }
          })
        );
        if (!mounted) return;
        const nextRows = data.items.map((item, index) => ({
          ...item,
          job: jobs[index],
        }));
        setRows(nextRows);
      } catch (error) {
        if (!mounted) return;
        setRows([]);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    void loadApplications();
    return () => {
      mounted = false;
    };
  }, []);

  const handleWithdraw = async (applicationId: string) => {
    try {
      const updated = await withdrawApplication(applicationId);
      setRows((prev) =>
        prev.map((item) =>
          item.applicationId === updated.applicationId
            ? { ...item, status: updated.status ?? "WITHDRAWN" }
            : item
        )
      );
      toast({
        title: "Đã rút hồ sơ",
        description: "Ứng tuyển đã được rút.",
      });
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        variant: "destructive",
        title: "Không thể rút hồ sơ",
        description: apiError.message,
      });
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Việc đã ứng tuyển</CardTitle>
          <CardDescription>Theo dõi trạng thái hồ sơ ứng tuyển của bạn.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">Dang tai du lieu...</div>
          ) : rows.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vị trí</TableHead>
                    <TableHead>Công ty</TableHead>
                    <TableHead className="text-center">Ngày nộp</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((item) => (
                    <TableRow key={item.applicationId}>
                      <TableCell className="font-medium">{item.job?.title ?? "Unknown"}</TableCell>
                      <TableCell className="text-muted-foreground">{item.job?.companyName ?? "Unknown"}</TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {item.appliedAt ? format(new Date(item.appliedAt), "dd/MM/yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusVariant(item.status) as any}>
                          {STATUS_LABELS[item.status ?? ""] ?? item.status ?? "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/jobs/${item.jobId}`}>Xem tin</Link>
                        </Button>
                        {item.status === "APPLIED" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWithdraw(item.applicationId)}
                          >
                            Rút hồ sơ
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <FileSearch className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Chưa ứng tuyển công việc nào</h3>
              <p className="mt-2 text-sm text-muted-foreground">Hãy bắt đầu tìm kiếm và ứng tuyển công việc phù hợp!</p>
              <Button asChild className="mt-6">
                <Link href="/jobs">Tìm việc ngay</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
