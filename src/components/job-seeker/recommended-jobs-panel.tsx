"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search as SearchIcon, Heart, CircleDollarSign } from "lucide-react";
import { recommendJobs, type Job } from "@/lib/jobs";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { addFavorite, listFavorites, removeFavorite } from "@/lib/favorites";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_PAGE_SIZE = 10;

const fallbackRecommendedJobs = [
  {
    id: 4,
    title: "Product Manager",
    company: "MoMo",
    location: "TP. Hồ Chí Minh",
    salaryText: "Cạnh tranh",
    logoId: "company-logo-momo",
  },
  {
    id: 5,
    title: "Kỹ sư DevOps",
    company: "Tiki",
    location: "Hà Nội",
    salaryText: "Trên $2000",
    logoId: "company-logo-tiki",
  },
];

export function RecommendedJobsPanel() {
  const { toast } = useToast();
  const [recommendedJobs, setRecommendedJobs] = React.useState<Job[]>([]);
  const [isRecommendedLoading, setIsRecommendedLoading] = React.useState(false);
  const [savingFavoriteId, setSavingFavoriteId] = React.useState<number | null>(null);
  const [favoriteIds, setFavoriteIds] = React.useState<Set<number>>(new Set());
  const [recommendedSearch, setRecommendedSearch] = React.useState("");
  const [recommendedPage, setRecommendedPage] = React.useState(0);

  React.useEffect(() => {
    let mounted = true;
    const loadRecommendations = async () => {
      try {
        setIsRecommendedLoading(true);
        const data = await recommendJobs({
          pagination: { page: 0, pageSize: 10 },
          sortBy: "createAt",
          sortOrder: "DESC",
        });
        if (!mounted) return;
        setRecommendedJobs(data.items);
      } catch {
        if (!mounted) return;
        setRecommendedJobs([]);
      } finally {
        if (mounted) setIsRecommendedLoading(false);
      }
    };
    void loadRecommendations();
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    const loadFavorites = async () => {
      try {
        const data = await listFavorites(0, 200);
        if (!mounted) return;
        const ids = new Set<number>(data.items.map((item) => item.jobId));
        setFavoriteIds(ids);
      } catch {
        if (!mounted) return;
        setFavoriteIds(new Set());
      }
    };
    void loadFavorites();
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (recommendedPage !== 0) {
      setRecommendedPage(0);
    }
  }, [recommendedSearch, recommendedPage]);

  const recommendedItems: {
    id: number;
    title: string;
    company: string;
    location?: string | null;
    minSalary?: number | null;
    maxSalary?: number | null;
    salaryText?: string;
    deadline?: string | null;
    createdAt?: string | null;
    logoUrl?: string | null;
    logoId?: string;
  }[] =
    recommendedJobs.length > 0
      ? recommendedJobs.map((job) => ({
          id: job.jobId,
          title: job.title,
          company: job.companyName ?? "Unknown",
          location: job.location ?? null,
          minSalary: job.minSalary ?? null,
          maxSalary: job.maxSalary ?? null,
          deadline: job.deadline ?? null,
          createdAt: job.createdAt ?? null,
          logoUrl: job.companyAvatarUrl ?? null,
        }))
      : fallbackRecommendedJobs.map((job) => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          salaryText: job.salaryText,
          deadline: null,
          createdAt: null,
          logoUrl: null as string | null,
          logoId: job.logoId,
        }));

  const filteredRecommended = React.useMemo(() => {
    const keyword = recommendedSearch.trim().toLowerCase();
    if (!keyword) return recommendedItems;
    return recommendedItems.filter((job) => {
      return job.title.toLowerCase().includes(keyword) || job.company.toLowerCase().includes(keyword);
    });
  }, [recommendedItems, recommendedSearch]);

  const recommendedTotalPages = Math.max(1, Math.ceil(filteredRecommended.length / DEFAULT_PAGE_SIZE));
  const visibleRecommended = React.useMemo(() => {
    const start = recommendedPage * DEFAULT_PAGE_SIZE;
    return filteredRecommended.slice(start, start + DEFAULT_PAGE_SIZE);
  }, [filteredRecommended, recommendedPage]);

  const formatSalary = (job: {
    minSalary?: number | null;
    maxSalary?: number | null;
    salaryText?: string;
  }) => {
    if (job.salaryText) return job.salaryText;
    const min = job.minSalary ?? null;
    const max = job.maxSalary ?? null;
    if (min != null && max != null) return `${min} - ${max} triệu`;
    if (min != null) return `Từ ${min} triệu`;
    if (max != null) return `Đến ${max} triệu`;
    return "Thỏa thuận";
  };

  const formatDaysLeft = (deadline?: string | null) => {
    if (!deadline) return null;
    const end = new Date(deadline);
    if (Number.isNaN(end.getTime())) return null;
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (days < 0) return "Đã hết hạn";
    if (days === 0) return "Hôm nay là hạn cuối";
    return `Còn ${days} ngày để ứng tuyển`;
  };

  const formatUpdated = (createdAt?: string | null) => {
    if (!createdAt) return null;
    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) return null;
    const diffMs = Date.now() - created.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 1) return "Cập nhật vừa xong";
    if (hours < 24) return `Cập nhật ${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `Cập nhật ${days} ngày trước`;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Gợi ý cho bạn</CardTitle>
            <CardDescription>Các công việc phù hợp với kỹ năng của bạn.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={recommendedSearch}
                onChange={(event) => setRecommendedSearch(event.target.value)}
                placeholder="Tìm gợi ý"
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {isRecommendedLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải gợi ý...</p>
          ) : visibleRecommended.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có gợi ý phù hợp.</p>
          ) : (
            visibleRecommended.map((job) => {
              const logo = !job.logoUrl && job.logoId ? PlaceHolderImages.find((p) => p.id === job.logoId) : null;
              const daysLeft = formatDaysLeft(job.deadline);
              const updated = formatUpdated(job.createdAt);
              const isFavorited = favoriteIds.has(job.id);
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="group flex flex-col gap-4 rounded-2xl border bg-emerald-50/50 p-4 transition-shadow hover:shadow-sm sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-white">
                      {job.logoUrl ? (
                        <img
                          src={job.logoUrl}
                          alt={`${job.company} logo`}
                          className="h-10 w-10 rounded-xl object-cover"
                        />
                      ) : logo ? (
                        <Image
                          src={logo.imageUrl}
                          alt={`${job.company} logo`}
                          width={40}
                          height={40}
                          className="rounded-xl"
                          data-ai-hint={logo.imageHint}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-muted" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold leading-tight group-hover:text-primary">
                        {job.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {job.location ? (
                          <span className="rounded-full border bg-muted/30 px-2 py-1">{job.location}</span>
                        ) : null}
                        {daysLeft ? (
                          <span className="rounded-full border bg-muted/30 px-2 py-1">{daysLeft}</span>
                        ) : null}
                        {updated ? (
                          <span className="rounded-full border bg-muted/30 px-2 py-1">{updated}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full items-center justify-between gap-3 sm:ml-auto sm:w-auto sm:flex-col sm:items-end">
                    <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                      <CircleDollarSign className="h-4 w-4" />
                      {formatSalary(job)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button className="bg-emerald-600 text-white hover:bg-emerald-700" size="sm">
                        Ứng tuyển
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className={`h-9 w-9 border-emerald-200 text-emerald-600 hover:bg-emerald-50 ${
                          isFavorited ? "bg-emerald-50" : ""
                        }`}
                        disabled={savingFavoriteId === job.id}
                        onClick={async (event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (savingFavoriteId === job.id) return;
                          try {
                            setSavingFavoriteId(job.id);
                            if (isFavorited) {
                              await removeFavorite(job.id);
                              setFavoriteIds((prev) => {
                                const next = new Set(prev);
                                next.delete(job.id);
                                return next;
                              });
                              toast({ title: "Đã bỏ khỏi yêu thích." });
                            } else {
                              await addFavorite(job.id);
                              setFavoriteIds((prev) => new Set(prev).add(job.id));
                              toast({ title: "Đã thêm vào yêu thích." });
                            }
                          } catch (error) {
                            toast({
                              title: "Không thể cập nhật yêu thích.",
                              variant: "destructive",
                            });
                          } finally {
                            setSavingFavoriteId(null);
                          }
                        }}
                      >
                        <Heart className={`h-4 w-4 ${isFavorited ? "fill-emerald-600" : ""}`} />
                      </Button>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
          <Pagination className="mt-2">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setRecommendedPage((prev) => Math.max(0, prev - 1))}
                  className={recommendedPage === 0 ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
              {(() => {
                const pages = new Set<number>([
                  0,
                  recommendedTotalPages - 1,
                  recommendedPage - 1,
                  recommendedPage,
                  recommendedPage + 1,
                ]);
                const sorted = Array.from(pages)
                  .filter((page) => page >= 0 && page < recommendedTotalPages)
                  .sort((a, b) => a - b);
                const items: Array<number | "ellipsis"> = [];
                let prev = -1;
                sorted.forEach((page) => {
                  if (prev !== -1 && page - prev > 1) {
                    items.push("ellipsis");
                  }
                  items.push(page);
                  prev = page;
                });
                return items.map((item, index) =>
                  item === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        isActive={item === recommendedPage}
                        onClick={() => setRecommendedPage(item)}
                      >
                        {item + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )
                );
              })()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setRecommendedPage((prev) => Math.min(recommendedTotalPages - 1, prev + 1))}
                  className={
                    recommendedPage >= recommendedTotalPages - 1 ? "pointer-events-none opacity-50" : undefined
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardContent>
      </Card>
      <Card className="hidden h-fit overflow-hidden rounded-2xl border bg-white lg:block">
        <Image
          src="/images/jobs/AIList1.png"
          alt="Banner gợi ý việc làm"
          width={560}
          height={720}
          className="h-auto w-full object-cover"
          priority
        />
      </Card>
    </div>
  );
}
