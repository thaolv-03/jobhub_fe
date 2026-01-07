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
import { SortableHeader } from "@/components/ui/sortable-header";
import { getAccessToken } from "@/lib/auth-storage";
import {
  AccountStatus,
  JobSeekerAdmin,
  searchJobSeekers,
  updateJobSeekerAccountStatus,
} from "@/lib/admin-users";

const PAGE_SIZE = 10;
const SEARCH_PAGE_SIZE = 200;

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
  const [sortBy, setSortBy] = React.useState<string | null>(null);
  const [sortOrder, setSortOrder] = React.useState<"ASC" | "DESC" | null>(null);
  const allowedSortFields = React.useMemo(
    () => new Set(["createAt", "fullName", "account.email"]),
    []
  );
  const [updatingJobSeekerId, setUpdatingJobSeekerId] = React.useState<number | null>(null);
  const [isCvOpen, setIsCvOpen] = React.useState(false);
  const [selectedCvUrl, setSelectedCvUrl] = React.useState<string | null>(null);

  const isClientPaging = Boolean(debouncedSearch) || accountStatusFilter !== "all" || Boolean(sortBy);

  const loadJobSeekers = React.useCallback(async () => {
    if (!getAccessToken()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const normalizedSortBy = sortBy && allowedSortFields.has(sortBy) ? sortBy : null;
      const normalizedSortOrder = normalizedSortBy ? sortOrder : null;
      const data = await searchJobSeekers({
        page: isClientPaging ? 0 : Math.max(0, page - 1),
        pageSize: isClientPaging ? SEARCH_PAGE_SIZE : PAGE_SIZE,
        searchedBy: debouncedSearch,
        sortBy: normalizedSortBy,
        sortOrder: normalizedSortOrder,
      });
      setJobSeekers(data.items);
      setTotalCount(data.count ?? data.items.length);
    } catch (error) {
      toast({
        title: "Không thể tải ứng viên",
        description: "Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page, sortBy, sortOrder, toast, isClientPaging]);

  React.useEffect(() => {
    void loadJobSeekers();
  }, [loadJobSeekers]);

  React.useEffect(() => {
    setPage(1);
    setSortBy(null);
    setSortOrder(null);
  }, [debouncedSearch, accountStatusFilter]);

  const handleSort = (field: string) => {
    if (!allowedSortFields.has(field)) return;
    setSortBy((current) => {
      if (current !== field) {
        setSortOrder("ASC");
        setPage(1);
        return field;
      }
      setSortOrder((order) => (order === "ASC" ? "DESC" : "ASC"));
      setPage(1);
      return current;
    });
  };

  const filteredJobSeekers = React.useMemo(() => {
    const keyword = debouncedSearch.toLowerCase();
    return jobSeekers.filter((jobSeeker) => {
      const matchesStatus = accountStatusFilter === "all" || jobSeeker.accountStatus === accountStatusFilter;
      if (!matchesStatus) return false;
      if (!keyword) return true;
      const haystack = [
        jobSeeker.fullName,
        jobSeeker.email,
        jobSeeker.phone,
        jobSeeker.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [jobSeekers, accountStatusFilter, debouncedSearch]);

  const sortedJobSeekers = React.useMemo(() => {
    if (!sortBy || !sortOrder) return filteredJobSeekers;
    const direction = sortOrder === "ASC" ? 1 : -1;
    return [...filteredJobSeekers].sort((a, b) => {
      const getValue = (item: JobSeekerAdmin) => {
        if (sortBy === "account.email") return item.email ?? "";
        if (sortBy === "createAt") return item.createdAt ?? "";
        return (item as Record<string, unknown>)[sortBy] ?? "";
      };
      const valueA = getValue(a);
      const valueB = getValue(b);
      return String(valueA).localeCompare(String(valueB)) * direction;
    });
  }, [filteredJobSeekers, sortBy, sortOrder]);

  const effectiveTotalCount = isClientPaging ? sortedJobSeekers.length : totalCount;
  const totalPages = Math.max(1, Math.ceil(effectiveTotalCount / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleJobSeekers = React.useMemo(() => {
    if (!isClientPaging) return sortedJobSeekers;
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedJobSeekers.slice(start, start + PAGE_SIZE);
  }, [sortedJobSeekers, currentPage, isClientPaging]);

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
              }}
              className="w-64"
            />
            <Select
              value={accountStatusFilter}
              onValueChange={(value) => {
                setAccountStatusFilter(value as "all" | AccountStatus);
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
                <TableHead>
                  <span>ID</span>
                </TableHead>
                <TableHead>
                  <SortableHeader label="Tên" field="fullName" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <SortableHeader label="Email" field="account.email" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <span>Ngày sinh</span>
                </TableHead>
                <TableHead>
                  <span>Số điện thoại</span>
                </TableHead>
                <TableHead>
                  <span>Địa chỉ</span>
                </TableHead>
                <TableHead>
                  <SortableHeader label="Ngày tạo" field="createAt" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <span>Giới thiệu</span>
                </TableHead>
                <TableHead>
                  <span>Trạng thái</span>
                </TableHead>
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
            totalCount={effectiveTotalCount}
            totalLabel="ứng viên"
            page={currentPage}
            pageSize={PAGE_SIZE}
            onPageChange={(nextPage) => setPage(Math.min(Math.max(1, nextPage), totalPages))}
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

