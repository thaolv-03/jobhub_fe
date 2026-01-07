'use client';

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSearch, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { listApplications, withdrawApplication, type Application } from "@/lib/applications";
import { getJob, type Job } from "@/lib/jobs";
import { ApiError } from "@/lib/api-types";
import { SortableHeader } from "@/components/ui/sortable-header";

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Đã nộp",
  REVIEWING: "Đang xem xét",
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

const DEFAULT_PAGE_SIZE = 10;
const SEARCH_PAGE_SIZE = 200;

export default function AppliedJobsPage() {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<ApplicationRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const debouncedSearch = useDebouncedValue(searchTerm.trim(), 400);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [sortBy, setSortBy] = React.useState<string | null>(null);
  const [sortOrder, setSortOrder] = React.useState<"ASC" | "DESC" | null>(null);
  const allowedSortFields = React.useMemo(() => new Set(["appliedAt", "status"]), []);

  React.useEffect(() => {
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

  React.useEffect(() => {
    let mounted = true;
    const loadApplications = async () => {
      setIsLoading(true);
      try {
        const isClientPaging = Boolean(debouncedSearch || sortBy);
        const pageSize = isClientPaging ? SEARCH_PAGE_SIZE : DEFAULT_PAGE_SIZE;
        const page = isClientPaging ? 0 : currentPage;
        const normalizedSortBy = sortBy && allowedSortFields.has(sortBy) ? sortBy : null;
        const normalizedSortOrder = normalizedSortBy ? sortOrder : null;
        const data = await listApplications(page, pageSize, {
          searchedBy: debouncedSearch || undefined,
          sortBy: normalizedSortBy,
          sortOrder: normalizedSortOrder,
        });
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
        setTotalCount(data.count ?? data.items.length);
      } catch (error) {
        if (!mounted) return;
        setRows([]);
        setTotalCount(0);
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
  }, [currentPage, debouncedSearch, sortBy, sortOrder]);

  const filteredRows = React.useMemo(() => {
    if (!debouncedSearch) return rows;
    const keyword = debouncedSearch.toLowerCase();
    return rows.filter((item) => {
      const title = item.job?.title ?? "";
      const company = item.job?.companyName ?? "";
      const statusLabel = STATUS_LABELS[item.status ?? ""] ?? item.status ?? "";
      const haystack = [title, company, statusLabel].join(" ").toLowerCase();
      return haystack.includes(keyword);
    });
  }, [rows, debouncedSearch]);

  const sortedRows = React.useMemo(() => {
    if (!sortBy || !sortOrder) return filteredRows;
    const direction = sortOrder === "ASC" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      const valueA =
        sortBy === "title"
          ? a.job?.title ?? ""
          : sortBy === "companyName"
            ? a.job?.companyName ?? ""
            : sortBy === "appliedAt"
              ? a.appliedAt ?? ""
              : sortBy === "status"
                ? STATUS_LABELS[a.status ?? ""] ?? a.status ?? ""
                : "";
      const valueB =
        sortBy === "title"
          ? b.job?.title ?? ""
          : sortBy === "companyName"
            ? b.job?.companyName ?? ""
            : sortBy === "appliedAt"
              ? b.appliedAt ?? ""
              : sortBy === "status"
                ? STATUS_LABELS[b.status ?? ""] ?? b.status ?? ""
                : "";
      return String(valueA).localeCompare(String(valueB)) * direction;
    });
  }, [filteredRows, sortBy, sortOrder]);

  const isClientPaging = Boolean(debouncedSearch || sortBy);
  const effectiveTotalCount = isClientPaging ? sortedRows.length : totalCount;
  const totalPages = Math.max(1, Math.ceil(effectiveTotalCount / DEFAULT_PAGE_SIZE));
  const pageItems = React.useMemo(() => {
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

  const visibleRows = React.useMemo(() => {
    if (!isClientPaging) return rows;
    const start = currentPage * DEFAULT_PAGE_SIZE;
    return sortedRows.slice(start, start + DEFAULT_PAGE_SIZE);
  }, [rows, sortedRows, isClientPaging, currentPage]);

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
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Việc đã ứng tuyển</CardTitle>
              <CardDescription>Theo dõi trạng thái hồ sơ ứng tuyển của bạn.</CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm kiếm việc đã ứng tuyển"
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">Đang tải dữ liệu...</div>
          ) : visibleRows.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vị trí</TableHead>
                    <TableHead>Công ty</TableHead>
                    <TableHead className="text-center">
                      <SortableHeader label="Ngày nộp" field="appliedAt" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="center" />
                    </TableHead>
                    <TableHead className="text-center">
                      <SortableHeader label="Trạng thái" field="status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="center" />
                    </TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRows.map((item) => (
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
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => goToPage(currentPage - 1)}
                      className={currentPage === 0 ? "pointer-events-none opacity-50" : undefined}
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
                          isActive={pageItem === currentPage}
                          onClick={() => goToPage(pageItem)}
                        >
                          {pageItem + 1}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => goToPage(currentPage + 1)}
                      className={currentPage >= totalPages - 1 ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
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
