'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { SortableHeader } from '@/components/ui/sortable-header';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { ApiError } from '@/lib/api-client';
import { chatMatchCandidate, type CandidateChatResponse } from '@/lib/candidate-chat';
import { getJob, type Job } from '@/lib/jobs';
import { fetchJobSeekerById, type JobSeekerProfile } from '@/lib/job-seeker-profile';
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

const DEFAULT_PAGE_SIZE = 10;

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
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [applications, setApplications] = useState<ApplicationDTO[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC" | null>(null);
  const [profileMap, setProfileMap] = useState<Record<number, JobSeekerProfile>>({});
  const debouncedSearch = useDebouncedValue(searchTerm, 400);
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatResult, setChatResult] = useState<CandidateChatResponse | null>(null);
  const [chatProfile, setChatProfile] = useState<JobSeekerProfile | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const allowedSortFields = useMemo(() => new Set(["appliedAt", "status", "matchingScore"]), []);

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("vi-VN");
  };

  useEffect(() => {
    let mounted = true;
    const loadJobTitle = async () => {
      if (!jobId || Number.isNaN(jobId)) return;
      try {
        const job: Job = await getJob(jobId);
        if (mounted) setJobTitle(job.title ?? null);
      } catch {
        if (mounted) setJobTitle(null);
      }
    };

    void loadJobTitle();
    return () => {
      mounted = false;
    };
  }, [jobId]);

  useEffect(() => {
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

  useEffect(() => {
    let mounted = true;
    const fetchApplications = async () => {
      if (!accessToken || !jobId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const normalizedSortBy = sortBy && allowedSortFields.has(sortBy) ? sortBy : null;
        const normalizedSortOrder = normalizedSortBy ? sortOrder : null;
        const response = await searchApplications<PageListDTO<ApplicationDTO>>(
          jobId,
          {
            pagination: {
              page: debouncedSearch ? 0 : currentPage,
              pageSize: debouncedSearch ? 200 : DEFAULT_PAGE_SIZE,
            },
            sortBy: normalizedSortBy ?? undefined,
            sortOrder: normalizedSortOrder ?? undefined,
            searchedBy: debouncedSearch,
            filter: null,
          },
          accessToken
        );

        const items = response.data?.items || [];
        if (!mounted) return;
        setApplications(items);
        setTotalCount(response.data?.count ?? 0);

      } catch (error) {
        const apiError = error as ApiError;
        if (mounted) {
          setErrorMessage(apiError.message || "Không thể tải danh sách ứng viên.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void fetchApplications();
    return () => {
      mounted = false;
    };
  }, [accessToken, jobId, currentPage, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => {
    let mounted = true;
    const fetchProfiles = async () => {
      if (!accessToken || applications.length === 0) return;
      const missingIds = Array.from(new Set(applications.map((item) => item.jobSeekerId))).filter(
        (id) => !profileMap[id]
      );
      if (missingIds.length === 0) return;

      const profiles = await Promise.all(
        missingIds.map(async (id) => {
          try {
            const profile = await fetchJobSeekerById(id, accessToken);
            return { id, profile };
          } catch {
            return { id, profile: null };
          }
        })
      );

      if (!mounted) return;
      setProfileMap((prev) => {
        const next = { ...prev };
        profiles.forEach(({ id, profile }) => {
          if (profile) {
            next[id] = profile;
          }
        });
        return next;
      });
    };

    void fetchProfiles();
    return () => {
      mounted = false;
    };
  }, [accessToken, applications, profileMap]);

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

  const normalizeText = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();

  const filteredApplications = useMemo(() => {
    const keyword = normalizeText(debouncedSearch.trim());
    if (!keyword) return applications;
    return applications.filter((item) => {
      const profile = profileMap[item.jobSeekerId];
      const name = normalizeText(profile?.fullName ?? "");
      const idLabel = normalizeText(`ung vien #${item.jobSeekerId}`);
      return name.includes(keyword) || idLabel.includes(keyword) || String(item.jobSeekerId).includes(keyword);
    });
  }, [applications, debouncedSearch, profileMap]);

  const baseApplications = debouncedSearch ? filteredApplications : applications;
  const sortedApplications = useMemo(() => {
    if (!sortBy || !sortOrder) return baseApplications;
    const direction = sortOrder === "ASC" ? 1 : -1;
    return [...baseApplications].sort((a, b) => {
      const valueA =
        sortBy === "jobSeekerId"
          ? a.jobSeekerId
          : sortBy === "appliedAt"
            ? a.appliedAt ?? ""
            : sortBy === "status"
              ? a.status ?? ""
              : sortBy === "matchingScore"
                ? a.matchingScore ?? 0
                : "";
      const valueB =
        sortBy === "jobSeekerId"
          ? b.jobSeekerId
          : sortBy === "appliedAt"
            ? b.appliedAt ?? ""
            : sortBy === "status"
              ? b.status ?? ""
              : sortBy === "matchingScore"
                ? b.matchingScore ?? 0
                : "";
      return String(valueA).localeCompare(String(valueB)) * direction;
    });
  }, [baseApplications, sortBy, sortOrder]);

  const effectiveTotalCount = debouncedSearch ? sortedApplications.length : totalCount;
  const isRanking = sortBy === "matchingScore" && sortOrder === "DESC";
  const totalPages = Math.max(1, Math.ceil(effectiveTotalCount / DEFAULT_PAGE_SIZE));
  const visibleApplications = useMemo(() => {
    if (!debouncedSearch) return sortedApplications;
    const start = currentPage * DEFAULT_PAGE_SIZE;
    return sortedApplications.slice(start, start + DEFAULT_PAGE_SIZE);
  }, [currentPage, debouncedSearch, sortedApplications]);
  const pageItems = useMemo(() => {
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

  const handleChat = async () => {
    if (!jobId || !accessToken) return;
    const trimmedPrompt = chatPrompt.trim();
    if (!trimmedPrompt) {
      toast({
        variant: "destructive",
        title: "Cần nhập nội dung",
        description: "Vui lòng nhập câu hỏi để tìm ứng viên.",
      });
      return;
    }

    setIsChatLoading(true);
    setChatError(null);
    setChatResult(null);
    setChatProfile(null);

    try {
      const result = await chatMatchCandidate(jobId, trimmedPrompt, accessToken);
      setChatResult(result);
      try {
        const profile = await fetchJobSeekerById(result.jobSeekerId, accessToken);
        setChatProfile(profile);
      } catch {
        setChatProfile(null);
      }
    } catch (error) {
      const apiError = error as ApiError;
      setChatError(apiError.message || "Không thể tìm ứng viên phù hợp.");
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleXoaChat = () => {
    setChatPrompt("");
    setChatResult(null);
    setChatProfile(null);
    setChatError(null);
  };

  const handleOpenProfile = async () => {
    if (!chatResult || !accessToken) return;
    setIsProfileDialogOpen(true);
    if (chatProfile) return;
    setIsProfileLoading(true);
    try {
      const profile = await fetchJobSeekerById(chatResult.jobSeekerId, accessToken);
      setChatProfile(profile);
    } catch (error) {
      const apiError = error as ApiError;
      setChatError(apiError.message || "Không thể tải hồ sơ ứng viên.");
    } finally {
      setIsProfileLoading(false);
    }
  };

  const displayJobTitle = jobTitle ? `vị trí ${jobTitle}` : `tin tuyển dụng #${jobId}`;
  const shouldShowPagination = true;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <Card className="border-border/60 bg-background/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="grid gap-2">
              <CardTitle className="text-slate-900 dark:text-slate-100">Danh sách ứng viên</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                Danh sách ứng viên cho {displayJobTitle}.
              </CardDescription>
            </div>
            <div className="ml-auto flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm ứng viên..."
                className="h-9 w-full sm:w-[220px] dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
              />
              <Button asChild variant="outline" className="dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
                <Link href="/recruiter/dashboard/applicants">Quay lại</Link>
              </Button>
            </div>
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
            ) : visibleApplications.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground dark:border-slate-700/70 dark:text-slate-300">
                Chưa có ứng viên nào cho tin này.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                    <TableHead className="text-slate-600 dark:text-slate-300">No.</TableHead>
                    <TableHead className="text-center text-slate-600 dark:text-slate-300">Ứng viên</TableHead>
                    <TableHead className="text-center text-slate-600 dark:text-slate-300">
                      <SortableHeader label="Ngày nộp" field="appliedAt" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="center" />
                    </TableHead>
                    <TableHead className="text-center text-slate-600 dark:text-slate-300">
                      <SortableHeader label="Trạng thái" field="status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="center" />
                    </TableHead>
                    <TableHead className="text-center text-slate-600 dark:text-slate-300">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleApplications.map((item, index) => {
                      const profile = profileMap[item.jobSeekerId];
                      const displayName = profile?.fullName || `Ứng viên #${item.jobSeekerId}`;
                      const rowIndex = debouncedSearch ? currentPage * DEFAULT_PAGE_SIZE + index : index;
                      return (
                        <TableRow key={item.applicationId}>
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">{rowIndex + 1}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span>{displayName}</span>
                              {!debouncedSearch && isRanking && rowIndex < 3 ? (
                                <Badge variant="secondary" className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                                  {`Top ${rowIndex + 1}`}
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground dark:text-slate-300">
                            {formatDate(item.appliedAt)}
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
                      );
                    })}
                  </TableBody>
                </Table>
                {shouldShowPagination ? (
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {!debouncedSearch ? (
                        <Button
                          type="button"
                          variant={isRanking ? "default" : "outline"}
                          onClick={() => {
                            if (isRanking) {
                              setSortBy(null);
                              setSortOrder(null);
                            } else {
                              setSortBy("matchingScore");
                              setSortOrder("DESC");
                            }
                            if (currentPage !== 0) {
                              setCurrentPage(0);
                            }
                          }}
                          className="w-fit"
                        >
                          {isRanking ? "Bỏ xếp hạng" : "Xếp hạng"}
                        </Button>
                    ) : (
                      <div />
                    )}
                    <Pagination className="sm:ml-auto">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(event) => {
                              event.preventDefault();
                              goToPage(currentPage - 1);
                            }}
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
                                href="#"
                                isActive={pageItem === currentPage}
                                onClick={(event) => {
                                  event.preventDefault();
                                  goToPage(pageItem);
                                }}
                              >
                                {pageItem + 1}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(event) => {
                              event.preventDefault();
                              goToPage(currentPage + 1);
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-background/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Đề xuất ứng viên phù hợp</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              Nhập mong muốn của bạn để tìm ứng viên phù hợp cho {displayJobTitle}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={chatPrompt}
              onChange={(event) => setChatPrompt(event.target.value)}
              placeholder="Nhập mong muốn của bạn..."
              className="min-h-[140px] dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void handleChat()} disabled={isChatLoading}>
                {isChatLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Đang tìm...
                  </span>
                ) : (
                  "Tìm ứng viên phù hợp"
                )}
              </Button>
              <Button variant="outline" onClick={handleXoaChat} disabled={isChatLoading}>
                Xóa
              </Button>
            </div>
            {chatError ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground dark:border-slate-700/70 dark:text-slate-300">
                {chatError}
              </div>
            ) : null}
            {chatResult ? (
              <button
                type="button"
                onClick={() => void handleOpenProfile()}
                className="flex w-full items-start gap-3 rounded-lg border border-slate-200 p-4 text-left transition hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={chatProfile?.avatarUrl ?? undefined} alt={chatResult.fullName} />
                  <AvatarFallback>{chatResult.fullName?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{chatResult.fullName}</p>
                    <p className="text-xs text-muted-foreground dark:text-slate-300">Ứng viên đề xuất</p>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{chatResult.reason}</p>
                </div>
              </button>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Hồ sơ ứng viên</DialogTitle>
            <DialogDescription>
              {chatResult ? `Chi tiết Ứng viên ${chatResult.fullName}.` : "Chi tiết Ứng viên."}
            </DialogDescription>
          </DialogHeader>
          {isProfileLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full dark:bg-slate-800" />
              <Skeleton className="h-10 w-full dark:bg-slate-800" />
              <Skeleton className="h-10 w-full dark:bg-slate-800" />
            </div>
          ) : chatProfile ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={chatProfile.avatarUrl ?? undefined} alt={chatProfile.fullName} />
                  <AvatarFallback>{chatProfile.fullName?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{chatProfile.fullName}</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-300">{chatProfile.phone || "-"}</p>
                </div>
                {chatProfile.cvUrl ? (
                  <Button asChild className="sm:ml-auto">
                    <a href={chatProfile.cvUrl} target="_blank" rel="noreferrer">
                      Xem CV
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" disabled className="sm:ml-auto dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
                    Chưa có CV
                  </Button>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border p-3 dark:border-slate-800/70 dark:bg-slate-950/40">
                  <p className="text-xs text-muted-foreground dark:text-slate-300">Địa chỉ</p>
                  <p className="text-sm text-slate-900 dark:text-slate-100">{chatProfile.address || "-"}</p>
                </div>
                <div className="rounded-lg border p-3 dark:border-slate-800/70 dark:bg-slate-950/40">
                  <p className="text-xs text-muted-foreground dark:text-slate-300">Ngày sinh</p>
                  <p className="text-sm text-slate-900 dark:text-slate-100">{formatDate(chatProfile.dob ?? undefined)}</p>
                </div>
                <div className="rounded-lg border p-3 md:col-span-2 dark:border-slate-800/70 dark:bg-slate-950/40">
                  <p className="text-xs text-muted-foreground dark:text-slate-300">Giới thiệu</p>
                  <p className="text-sm text-slate-900 dark:text-slate-100">{chatProfile.bio || "-"}</p>
                </div>
                <div className="rounded-lg border p-3 md:col-span-2 dark:border-slate-800/70 dark:bg-slate-950/40">
                  <p className="text-xs text-muted-foreground dark:text-slate-300">Kỹ năng</p>
                  {chatProfile.skills && chatProfile.skills.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {chatProfile.skills
                        .filter((skill) => skill?.skillName)
                        .map((skill) => (
                          <span
                            key={skill.skillId ?? skill.skillName}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                          >
                            {skill.skillName}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground dark:text-slate-300">Chưa có kỹ năng</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground dark:border-slate-700/70 dark:text-slate-300">
              Không có dữ liệu hồ sơ.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
