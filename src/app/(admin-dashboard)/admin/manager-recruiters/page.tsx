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
import { fetchRecruiterDocuments, RecruiterDocument, updateRecruiterStatus } from "@/lib/admin-recruiter";
import {
  AccountStatus,
  RecruiterAdminDetail,
  RecruiterStatus,
  searchRecruiters,
  updateRecruiterAccountStatus,
} from "@/lib/admin-users";
import { getAccessToken } from "@/lib/auth-storage";

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

const getRecruiterStatusLabel = (status: RecruiterAdminDetail["status"]) => {
  switch (status) {
    case "APPROVED":
      return "Đã duyệt";
    case "REJECTED":
      return "Từ chối";
    default:
      return "Chờ duyệt";
  }
};

const getRecruiterStatusBadgeClass = (status: RecruiterAdminDetail["status"]) => {
  switch (status) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
};

const nextAccountStatus = (status: AccountStatus) => {
  return status === "LOCKED" ? "ACTIVE" : "LOCKED";
};

export default function ManageRecruitersPage() {
  const { toast } = useToast();
  const [recruiters, setRecruiters] = React.useState<RecruiterAdminDetail[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [accountStatusFilter, setAccountStatusFilter] = React.useState<"all" | AccountStatus>("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | RecruiterStatus>("all");
  const [page, setPage] = React.useState(1);
  const [updatingAccountId, setUpdatingAccountId] = React.useState<number | null>(null);
  const [updatingRecruiterId, setUpdatingRecruiterId] = React.useState<number | null>(null);
  const [isDocsOpen, setIsDocsOpen] = React.useState(false);
  const [docsLoading, setDocsLoading] = React.useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = React.useState<RecruiterAdminDetail | null>(null);
  const [documents, setDocuments] = React.useState<RecruiterDocument[]>([]);

  const loadRecruiters = React.useCallback(async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await searchRecruiters({
        page: Math.max(0, page - 1),
        pageSize: PAGE_SIZE,
        searchedBy: debouncedSearch,
      });
      setRecruiters(data.items);
      setTotalCount(data.count);
    } catch (error) {
      toast({
        title: "Không thể tải nhà tuyển dụng",
        description: "Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page, toast]);

  React.useEffect(() => {
    void loadRecruiters();
  }, [loadRecruiters]);

  const visibleRecruiters = React.useMemo(() => {
    return recruiters.filter((recruiter) => {
      const matchesStatus = statusFilter === "all" || recruiter.status === statusFilter;
      const matchesAccount = accountStatusFilter === "all" || recruiter.accountStatus === accountStatusFilter;
      return matchesStatus && matchesAccount;
    });
  }, [recruiters, statusFilter, accountStatusFilter]);

  const handleToggleAccountStatus = async (recruiterId: number, status: AccountStatus) => {
    if (!getAccessToken()) return;
    try {
      setUpdatingAccountId(recruiterId);
      await updateRecruiterAccountStatus(recruiterId, nextAccountStatus(status));
      await loadRecruiters();
    } catch (error) {
      toast({
        title: "Cập nhật tài khoản thất bại",
        description: "Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setUpdatingAccountId(null);
    }
  };

  const handleRecruiterStatusUpdate = async (recruiterId: number, status: RecruiterAdminDetail["status"]) => {
    const accessToken = getAccessToken();
    if (!accessToken) return;
    try {
      setUpdatingRecruiterId(recruiterId);
      await updateRecruiterStatus(accessToken, recruiterId, status);
      await loadRecruiters();
      toast({ title: "Đã cập nhật trạng thái nhà tuyển dụng" });
    } catch (error) {
      toast({
        title: "Cập nhật nhà tuyển dụng thất bại",
        description: "Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setUpdatingRecruiterId(null);
    }
  };

  const handleViewDocuments = async (recruiter: RecruiterAdminDetail) => {
    const accessToken = getAccessToken();
    if (!accessToken) return;
    setSelectedRecruiter(recruiter);
    setDocsLoading(true);
    try {
      const docs = await fetchRecruiterDocuments(accessToken, recruiter.recruiterId);
      setDocuments(docs);
      setIsDocsOpen(true);
    } catch (error) {
      toast({
        title: "Không thể tải tài liệu",
        description: "Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setDocsLoading(false);
    }
  };

  const accountStatusOptions: ("all" | AccountStatus)[] = ["all", "ACTIVE", "INACTIVE", "LOCKED"];
  const recruiterStatusOptions: ("all" | RecruiterStatus)[] = ["all", "PENDING", "APPROVED", "REJECTED"];

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Nhà tuyển dụng</CardTitle>
            <CardDescription>Hồ sơ có vai trò RECRUITER.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Tìm theo email, công ty, số điện thoại"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-64"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as "all" | RecruiterStatus);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Trạng thái duyệt" />
              </SelectTrigger>
              <SelectContent>
                {recruiterStatusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "all" ? "Tất cả trạng thái" : getRecruiterStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={accountStatusFilter}
              onValueChange={(value) => {
                setAccountStatusFilter(value as "all" | AccountStatus);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Trạng thái tài khoản" />
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
                <TableHead>Email</TableHead>
                <TableHead>Công ty</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Chức vụ</TableHead>
                <TableHead>Trạng thái duyệt</TableHead>
                <TableHead>Tài liệu</TableHead>
                <TableHead>Trạng thái tài khoản</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-6 text-center text-sm text-muted-foreground">
                    Đang tải danh sách nhà tuyển dụng...
                  </TableCell>
                </TableRow>
              ) : visibleRecruiters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                    Không tìm thấy nhà tuyển dụng.
                  </TableCell>
                </TableRow>
              ) : (
                visibleRecruiters.map((recruiter) => (
                  <TableRow key={recruiter.recruiterId}>
                    <TableCell>{recruiter.recruiterId}</TableCell>
                    <TableCell>{recruiter.email}</TableCell>
                    <TableCell>{recruiter.companyName ?? "-"}</TableCell>
                    <TableCell>{recruiter.phone ?? "-"}</TableCell>
                    <TableCell>{recruiter.position ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRecruiterStatusBadgeClass(recruiter.status)}>
                        {getRecruiterStatusLabel(recruiter.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDocuments(recruiter)}
                        disabled={docsLoading}
                      >
                        Xem hồ sơ
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getAccountStatusBadgeClass(recruiter.accountStatus)}>
                        {getAccountStatusLabel(recruiter.accountStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={recruiter.status === "APPROVED" || updatingRecruiterId === recruiter.recruiterId}
                          onClick={() => handleRecruiterStatusUpdate(recruiter.recruiterId, "APPROVED")}
                          className="hover:bg-emerald-600 hover:text-white"
                        >
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={recruiter.status === "APPROVED" || updatingRecruiterId === recruiter.recruiterId}
                          onClick={() => handleRecruiterStatusUpdate(recruiter.recruiterId, "REJECTED")}
                          className="hover:bg-rose-600 hover:text-white"
                        >
                          Từ chối
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingAccountId === recruiter.recruiterId}
                          onClick={() => handleToggleAccountStatus(recruiter.recruiterId, recruiter.accountStatus)}
                          className={
                            recruiter.accountStatus === "LOCKED"
                              ? "hover:bg-emerald-600 hover:text-white"
                              : "hover:bg-amber-500 hover:text-white"
                          }
                        >
                          {recruiter.accountStatus === "LOCKED" ? "Mở khóa" : "Khóa"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <AdminTableFooter
            totalCount={totalCount}
            totalLabel="nhà tuyển dụng"
            page={page}
            pageSize={PAGE_SIZE}
            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setPage((prev) => prev + 1)}
          />
        </CardContent>
      </Card>

      <Dialog open={isDocsOpen} onOpenChange={setIsDocsOpen}>
        <DialogContent className="max-w-lg w-[min(32rem,calc(100vw-2rem))] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Tài liệu nhà tuyển dụng</DialogTitle>
            <DialogDescription>
              {selectedRecruiter
                ? `Tài liệu của nhà tuyển dụng #${selectedRecruiter.recruiterId}`
                : "Chưa chọn nhà tuyển dụng"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {documents.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                {selectedRecruiter ? "Chưa có tài liệu." : "Hãy chọn nhà tuyển dụng để xem tài liệu."}
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.documentId} className="w-full rounded-lg border bg-background p-4 overflow-hidden">
                  <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground">{doc.contentType}</p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="shrink-0 justify-self-end">
                      <a href={doc.downloadUrl} target="_blank" rel="noreferrer">
                        Mở
                      </a>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
