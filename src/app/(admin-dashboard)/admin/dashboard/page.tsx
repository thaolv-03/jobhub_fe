'use client';

import React from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { fetchAdminDashboardCharts } from "@/lib/admin-dashboard";
import {
  fetchPendingRecruiters,
  fetchRecruiterDocuments,
  updateRecruiterStatus,
  RecruiterAdmin,
  RecruiterStatus,
  RecruiterDocument,
} from "@/lib/admin-recruiter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableHeader } from "@/components/ui/sortable-header";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { buildPaginationItems } from "@/components/admin/pagination-utils";
import {
  Activity,
  FileText,
  FolderSearch,
  ShieldCheck,
  Users,
} from "lucide-react";

const buildMonthlySeries = (
  points: { month: string; count: number }[] | undefined,
  valueKey: "jobs" | "cv"
) => {
  const now = new Date();
  const map = new Map((points ?? []).map((item) => [item.month, item.count]));
  const data = [] as Array<{ month: string; jobs?: number; cv?: number }>;
  for (let i = 11; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const key = `${date.getFullYear()}-${month}`;
    const label = `Th${date.getMonth() + 1}`;
    const count = map.get(key) ?? 0;
    if (valueKey == "jobs") {
      data.push({ month: label, jobs: count });
    } else {
      data.push({ month: label, cv: count });
    }
  }
  return data;
};

const sumPoints = (points: { count: number }[] | undefined) =>
  (points ?? []).reduce((total, item) => total + (item.count ?? 0), 0);

const USE_MOCK_CHARTS = true; // set true to use mock data
// const USE_MOCK_CHARTS = false; // set true to use mock data

const DEFAULT_PAGE_SIZE = 10;

const MOCK_CHARTS = {
  jobPosts: [
    { month: "2025-06", count: 18 },
    { month: "2025-07", count: 26 },
    { month: "2025-08", count: 31 },
    { month: "2025-09", count: 22 },
    { month: "2025-10", count: 35 },
    { month: "2025-11", count: 41 },
    { month: "2025-12", count: 29 },
    { month: "2026-01", count: 33 },
  ],
  cvUploads: [
    { month: "2025-06", count: 120 },
    { month: "2025-07", count: 168 },
    { month: "2025-08", count: 190 },
    { month: "2025-09", count: 155 },
    { month: "2025-10", count: 210 },
    { month: "2025-11", count: 248 },
    { month: "2025-12", count: 198 },
    { month: "2026-01", count: 225 },
  ],
};

const jobsChartConfig = {
  jobs: {
    label: "Tin tuyển dụng",
    color: "hsl(var(--chart-1))",
  },
};

const cvChartConfig = {
  cv: {
    label: "Tải lên CV",
    color: "hsl(var(--chart-2))",
  },
};

export default function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const [pendingRecruiters, setPendingRecruiters] = React.useState<RecruiterAdmin[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState<number | null>(null);
  const [isDocsOpen, setIsDocsOpen] = React.useState(false);
  const [docsLoading, setDocsLoading] = React.useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = React.useState<RecruiterAdmin | null>(null);
  const [documents, setDocuments] = React.useState<RecruiterDocument[]>([]);
  const [jobActivityData, setJobActivityData] = React.useState(() => buildMonthlySeries([], "jobs"));
  const [cvActivityData, setCvActivityData] = React.useState(() => buildMonthlySeries([], "cv"));
  const [jobsTotal, setJobsTotal] = React.useState(0);
  const [cvTotal, setCvTotal] = React.useState(0);
  const [chartsLoading, setChartsLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortBy, setSortBy] = React.useState<string | null>(null);
  const [sortOrder, setSortOrder] = React.useState<"ASC" | "DESC" | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const allowedSortFields = React.useMemo(
    () => new Set(["account.email", "company.companyName", "status"]),
    []
  );

  React.useEffect(() => {
    setCurrentPage(1);
    setSortBy(null);
    setSortOrder(null);
  }, [searchTerm]);

  const handleSort = (field: string) => {
    if (!allowedSortFields.has(field)) return;
    setSortBy((current) => {
      if (current !== field) {
        setSortOrder("ASC");
        setCurrentPage(1);
        return field;
      }
      setSortOrder((order) => (order === "ASC" ? "DESC" : "ASC"));
      setCurrentPage(1);
      return current;
    });
  };

  React.useEffect(() => {
    if (!accessToken) return;
    let mounted = true;

    const loadPending = async () => {
      try {
        setIsLoading(true);
        const data = await fetchPendingRecruiters(accessToken);
        if (!mounted) return;
        setPendingRecruiters(data);
      } catch (error) {
        if (!mounted) return;
        toast({
          title: "Không thể tải danh sách chờ duyệt",
          description: "Vui lòng thử lại.",
          variant: "destructive",
        });
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadPending();

    return () => {
      mounted = false;
    };
  }, [accessToken, toast]);

  React.useEffect(() => {
    if (!accessToken) return;
    let mounted = true;

    const loadCharts = async () => {
      try {
        setChartsLoading(true);
        const data = USE_MOCK_CHARTS
          ? MOCK_CHARTS
          : await fetchAdminDashboardCharts(accessToken);
        if (!mounted) return;
        setJobActivityData(buildMonthlySeries(data.jobPosts, "jobs"));
        setCvActivityData(buildMonthlySeries(data.cvUploads, "cv"));
        setJobsTotal(sumPoints(data.jobPosts));
        setCvTotal(sumPoints(data.cvUploads));
      } catch (error) {
        if (!mounted) return;
        toast({
          title: "Khong the tai bieu do",
          description: "Vui long thu lai.",
          variant: "destructive",
        });
      } finally {
        if (mounted) setChartsLoading(false);
      }
    };

    void loadCharts();

    return () => {
      mounted = false;
    };
  }, [accessToken, toast]);

  const handleStatusUpdate = async (recruiterId: number, status: RecruiterStatus) => {
    if (!accessToken) return;
    try {
      setIsUpdating(recruiterId);
      await updateRecruiterStatus(accessToken, recruiterId, status);
      setPendingRecruiters((prev) => prev.filter((item) => item.recruiterId !== recruiterId));
      toast({
        title: "Đã cập nhật trạng thái",
        description: `Nhà tuyển dụng #${recruiterId} đã được cập nhật ${status.toLowerCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Cập nhật thất bại",
        description: "Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleViewDocuments = async (recruiter: RecruiterAdmin) => {
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


  const pendingCount = pendingRecruiters.length;
  const filteredPending = React.useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return pendingRecruiters;
    return pendingRecruiters.filter((recruiter) => {
      const haystack = [
        recruiter.recruiterId,
        recruiter.companyName,
        recruiter.email,
        recruiter.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [pendingRecruiters, searchTerm]);

  const sortedPending = React.useMemo(() => {
    if (!sortBy || !sortOrder) return filteredPending;
    const direction = sortOrder === "ASC" ? 1 : -1;
    return [...filteredPending].sort((a, b) => {
      const getValue = (item: RecruiterAdmin) => {
        if (sortBy === "account.email") return item.email ?? "";
        if (sortBy === "company.companyName") return item.companyName ?? "";
        return (item as Record<string, unknown>)[sortBy] ?? "";
      };
      const valueA = getValue(a);
      const valueB = getValue(b);
      return String(valueA).localeCompare(String(valueB)) * direction;
    });
  }, [filteredPending, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedPending.length / DEFAULT_PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const visiblePending = React.useMemo(() => {
    const start = (safePage - 1) * DEFAULT_PAGE_SIZE;
    return sortedPending.slice(start, start + DEFAULT_PAGE_SIZE);
  }, [sortedPending, safePage]);
  const pageItems = React.useMemo(() => {
    return buildPaginationItems(safePage, totalPages);
  }, [safePage, totalPages]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Nhà tuyển dụng chờ duyệt</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Đang chờ phê duyệt</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Tin tuyển dụng</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{jobsTotal}</div>
            <p className="text-xs text-muted-foreground">12 tháng gần nhất.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">CV tải lên</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{cvTotal}</div>
            <p className="text-xs text-muted-foreground">12 tháng gần nhất.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Tuân thủ</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">100%</div>
            <p className="text-xs text-muted-foreground">Quy trình admin đã sẵn sàng</p>
          </CardContent>
        </Card>
      </section>

      <section id="analytics" className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động đăng tin</CardTitle>
            <CardDescription>Dữ liệu 12 tháng gần nhất{chartsLoading ? " (đang tải)" : ""}.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={jobsChartConfig} className="h-[260px] w-full -mx-4">
              <AreaChart data={jobActivityData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="jobs"
                  stroke="var(--color-jobs)"
                  fill="var(--color-jobs)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Khối lượng CV tải lên</CardTitle>
            <CardDescription>Dữ liệu 12 tháng gần nhất{chartsLoading ? " (đang tải)" : ""}.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={cvChartConfig} className="h-[260px] w-full -mx-4">
              <BarChart data={cvActivityData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="cv" fill="var(--color-cv)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>

      <section id="pending-recruiters" className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Yêu cầu duyệt nhà tuyển dụng</CardTitle>
              <CardDescription>Rà soát và phê duyệt yêu cầu đăng ký nhà tuyển dụng.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">{pendingCount} chờ duyệt</Badge>
              <Input
                placeholder="Tìm theo công ty hoặc email"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-64"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Đang tải danh sách chờ duyệt...
              </div>
            ) : visiblePending.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Hiện chưa có nhà tuyển dụng chờ duyệt.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <span>ID</span>
                    </TableHead>
                    <TableHead>
                      <SortableHeader label="Công ty" field="company.companyName" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    </TableHead>
                    <TableHead>
                      <SortableHeader label="Email" field="account.email" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    </TableHead>
                    <TableHead>
                      <SortableHeader label="Trạng thái" field="status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    </TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiblePending.map((recruiter) => (
                    <TableRow key={recruiter.recruiterId}>
                      <TableCell className="font-medium">#{recruiter.recruiterId}</TableCell>
                      <TableCell>{recruiter.companyName ?? "Chưa có hồ sơ"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {recruiter.email ?? "Không rõ"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{recruiter.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDocuments(recruiter)}
                            disabled={docsLoading}
                          >
                            Xem hồ sơ
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(recruiter.recruiterId, "APPROVED")}
                            disabled={isUpdating === recruiter.recruiterId}
                          >
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(recruiter.recruiterId, "REJECTED")}
                            disabled={isUpdating === recruiter.recruiterId}
                          >
                            Từ chối
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className={safePage <= 1 ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
                {pageItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink isActive={item === safePage} onClick={() => setCurrentPage(item)}>
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    className={safePage >= totalPages ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardContent>
        </Card>

      </section>

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

      <section id="settings">
        <Card>
          <CardHeader>
            <CardTitle>{"C\u00e0i \u0111\u1eb7t qu\u1ea3n tr\u1ecb"}</CardTitle>
            <CardDescription>{"T\u1eadp trung c\u00e1c thi\u1ebft l\u1eadp v\u00e0 ch\u00ednh s\u00e1ch qu\u1ea3n tr\u1ecb."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  {"Ch\u00ednh s\u00e1ch & Quy \u0111\u1ecbnh"}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {"Qu\u1ea3n l\u00fd c\u00e1c ch\u00ednh s\u00e1ch v\u00e0 quy \u0111\u1ecbnh s\u1eed d\u1ee5ng h\u1ec7 th\u1ed1ng."}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <li>{"\u2022 Quy \u0111\u1ecbnh s\u1eed d\u1ee5ng h\u1ec7 th\u1ed1ng"}</li>
                  <li>{"\u2022 Ch\u00ednh s\u00e1ch b\u1ea3o m\u1eadt"}</li>
                  <li>{"\u2022 \u0110i\u1ec1u kho\u1ea3n d\u1ecbch v\u1ee5"}</li>
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline">{"Xem danh s\u00e1ch"}</Button>
                  <Button size="sm">{"C\u1eadp nh\u1eadt"}</Button>
                </div>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <Users className="h-4 w-4 text-emerald-500" />
                  {"Qu\u1ea3n tr\u1ecb ng\u01b0\u1eddi d\u00f9ng"}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {"\u0110i\u1ec1u ch\u1ec9nh tham s\u1ed1 li\u00ean quan \u0111\u1ebfn qu\u1ea3n tr\u1ecb ng\u01b0\u1eddi d\u00f9ng v\u00e0 ph\u00e2n quy\u1ec1n."}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <li>{"\u2022 Vai tr\u00f2 & quy\u1ec1n h\u1ea1n"}</li>
                  <li>{"\u2022 Quy t\u1eafc x\u00e9t duy\u1ec7t"}</li>
                  <li>{"\u2022 Gi\u1edbi h\u1ea1n thao t\u00e1c"}</li>
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline">{"Thi\u1ebft l\u1eadp"}</Button>
                  <Button size="sm">{"Xem log"}</Button>
                </div>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  {"V\u1eadn h\u00e0nh & C\u1eadp nh\u1eadt"}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {"Theo d\u00f5i tr\u1ea1ng th\u00e1i v\u1eadn h\u00e0nh v\u00e0 chu\u1ea9n b\u1ecb cho c\u00e1c c\u1eadp nh\u1eadt trong t\u01b0\u01a1ng lai."}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <li>{"\u2022 Tr\u1ea1ng th\u00e1i d\u1ecbch v\u1ee5"}</li>
                  <li>{"\u2022 L\u1ecbch b\u1ea3o tr\u00ec"}</li>
                  <li>{"\u2022 K\u1ebf ho\u1ea1ch n\u00e2ng c\u1ea5p"}</li>
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline">{"Theo d\u00f5i"}</Button>
                  <Button size="sm">{"L\u00ean l\u1ecbch"}</Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border bg-slate-50 p-4 text-sm text-muted-foreground dark:border-slate-800 dark:bg-slate-900/40">
              <FolderSearch className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{"Ghi ch\u00fa"}</p>
                <p>{"B\u1ea3ng c\u00e0i \u0111\u1eb7t s\u1ebd ti\u1ebfp t\u1ee5c m\u1edf r\u1ed9ng khi t\u00edch h\u1ee3p c\u00e1c c\u1ea5u h\u00ecnh m\u1edbi."}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
