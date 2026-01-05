"use client";

import React from "react";
import { useToast } from "@/hooks/use-toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminTableFooter } from "@/components/admin/admin-table-footer";
import { getAccessToken } from "@/lib/auth-storage";
import {
  AccountStatus,
  JobSeekerAdmin,
  searchJobSeekers,
  updateJobSeekerAccountStatus,
} from "@/lib/admin-users";

const PAGE_SIZE = 8;

const getAccountStatusLabel = (status: AccountStatus) => {
  switch (status) {
    case "ACTIVE":
      return "Hoạt động";
    case "INACTIVE":
      return "Không hoạt động";
    case "LOCKED":
      return "Đã khóa";
    default:
      return status;
  }
};

const getAccountStatusBadgeClass = (status: AccountStatus) => {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "LOCKED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "INACTIVE":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "";
  }
};

const nextAccountStatus = (status: AccountStatus) => {
  return status === "LOCKED" ? "ACTIVE" : "LOCKED";
};

export default function ManageJobSeekersPage() {
  const { toast } = useToast();
  const [jobSeekers, setJobSeekers] = React.useState<JobSeekerAdmin[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [accountStatusFilter, setAccountStatusFilter] = React.useState<"all" | AccountStatus>("all");
  const [page, setPage] = React.useState(1);
  const [updatingJobSeekerId, setUpdatingJobSeekerId] = React.useState<number | null>(null);
  const [isCvOpen, setIsCvOpen] = React.useState(false);
  const [selectedCvUrl, setSelectedCvUrl] = React.useState<string | null>(null);

  const loadJobSeekers = React.useCallback(async () => {
    if (!getAccessToken()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await searchJobSeekers({
        page: Math.max(0, page - 1),
        pageSize: PAGE_SIZE,
        searchedBy: debouncedSearch,
      });
      setJobSeekers(data.items);
      setTotalCount(data.count);
    } catch (error) {
      toast({
        title: "Không thể tải ứng viên",
        description: "Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page, toast]);

  React.useEffect(() => {
    void loadJobSeekers();
  }, [loadJobSeekers]);

  const visibleJobSeekers = React.useMemo(() => {
    if (accountStatusFilter === "all") return jobSeekers;
    return jobSeekers.filter((jobSeeker) => jobSeeker.accountStatus === accountStatusFilter);
  }, [jobSeekers, accountStatusFilter]);

  const handleToggleAccountStatus = async (jobSeekerId: number, status: AccountStatus) => {
    if (!getAccessToken()) return;
    try {
      setUpdatingJobSeekerId(jobSeekerId);
      await updateJobSeekerAccountStatus(jobSeekerId, nextAccountStatus(status));
      await loadJobSeekers();
    } catch (error) {
      toast({
        title: "Cập nhật tài khoản thất bại",
        description: "Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setUpdatingJobSeekerId(null);
    }
  };

  const handleViewCv = (cvUrl: string | null | undefined) => {
    if (!cvUrl) return;
    setSelectedCvUrl(cvUrl);
    setIsCvOpen(true);
  };

  const accountStatusOptions: ("all" | AccountStatus)[] = ["all", "ACTIVE", "INACTIVE", "LOCKED"];

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Ứng viên</CardTitle>
            <CardDescription>Hồ sơ có vai trò JOB_SEEKER.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Tìm theo tên, email, số điện thoại"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-64"
            />
            <Select
              value={accountStatusFilter}
              onValueChange={(value) => {
                setAccountStatusFilter(value as "all" | AccountStatus);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {accountStatusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "all" ? "Tất cả trạng thái" : getAccountStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ngày sinh</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Giới thiệu</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>CV</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-6 text-center text-sm text-muted-foreground">
                    Đang tải danh sách ứng viên...
                  </TableCell>
                </TableRow>
              ) : visibleJobSeekers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-sm text-muted-foreground">
                    Không tìm thấy ứng viên.
                  </TableCell>
                </TableRow>
              ) : (
                visibleJobSeekers.map((jobSeeker) => (
                  <TableRow key={jobSeeker.jobSeekerId}>
                    <TableCell>{jobSeeker.jobSeekerId}</TableCell>
                    <TableCell>{jobSeeker.fullName}</TableCell>
                    <TableCell>{jobSeeker.email}</TableCell>
                    <TableCell>{jobSeeker.dob ?? "-"}</TableCell>
                    <TableCell>{jobSeeker.phone ?? "-"}</TableCell>
                    <TableCell>{jobSeeker.address ?? "-"}</TableCell>
                    <TableCell>{jobSeeker.createdAt ?? "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{jobSeeker.bio ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getAccountStatusBadgeClass(jobSeeker.accountStatus)}>
                        {getAccountStatusLabel(jobSeeker.accountStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!jobSeeker.cvUrl}
                        onClick={() => handleViewCv(jobSeeker.cvUrl)}
                      >
                        Xem CV
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingJobSeekerId === jobSeeker.jobSeekerId}
                        onClick={() => handleToggleAccountStatus(jobSeeker.jobSeekerId, jobSeeker.accountStatus)}
                        className={
                          jobSeeker.accountStatus === "LOCKED"
                            ? "hover:bg-emerald-600 hover:text-white"
                            : "hover:bg-amber-500 hover:text-white"
                        }
                      >
                        {jobSeeker.accountStatus === "LOCKED" ? "Mở khóa" : "Khóa"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <AdminTableFooter
            totalCount={totalCount}
            totalLabel="ứng viên"
            page={page}
            pageSize={PAGE_SIZE}
            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setPage((prev) => prev + 1)}
          />
        </CardContent>
      </Card>

      <Dialog open={isCvOpen} onOpenChange={setIsCvOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>CV ứng viên</DialogTitle>
            <DialogDescription>Xem lại CV đã tải lên.</DialogDescription>
          </DialogHeader>
          {selectedCvUrl ? (
            <iframe title="CV ứng viên" src={selectedCvUrl} className="h-[70vh] w-full rounded-md border" />
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Chưa chọn CV.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

