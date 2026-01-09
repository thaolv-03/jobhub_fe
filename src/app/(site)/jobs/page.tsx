'use client';

import React, { useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Building, MapPin, DollarSign, Search, Bookmark, BookmarkCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Container } from "@/components/layout/container";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { addFavorite, listFavorites, removeFavorite } from "@/lib/favorites";
import { useJobs } from "@/hooks/use-jobs";
import { CATEGORIES } from "@/lib/job-form-data";
import { useCompanies } from "@/hooks/use-companies";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError } from "@/lib/api-types";
import type { Job, JobType, JobSearchRequest } from "@/lib/jobs";
import { useJobSeekerProfileGate } from "@/contexts/job-seeker-profile-context";

const PAGE_SIZE = 10;

const LOCATION_OPTIONS = [
  { value: "\u0048\u00e0 \u004e\u1ed9\u0069", label: "\u0048\u00e0 \u004e\u1ed9\u0069" },
  { value: "\u0110\u00e0 \u004e\u1eb5\u006e\u0067", label: "\u0110\u00e0 \u004e\u1eb5\u006e\u0067" },
  { value: "TP HCM", label: "TP H\u1ed3 Ch\u00ed Minh" },
];

const SALARY_RANGES = [
  { value: "all", label: "Tất cả", min: null, max: null },
  { value: "under-10", label: "Dưới 10", min: null, max: 10 },
  { value: "10-20", label: "10 - 20", min: 10, max: 20 },
  { value: "over-20", label: "Trên 20", min: 20, max: null },
];

const JOB_TYPE_OPTIONS: { value: JobType; label: string }[] = [
  { value: "FULL_TIME", label: "Toàn thời gian" },
  { value: "PART_TIME", label: "Bán thời gian" },
  { value: "CONTRACT", label: "Hợp đồng" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "INTERN", label: "Thực tập" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "deadline", label: "Hạn nộp" },
  { value: "title", label: "Tiêu đề" },
];

const buildSearchText = (keyword: string) => keyword.trim();

const formatSalary = (job: Job) => {
  const min = job.minSalary ?? null;
  const max = job.maxSalary ?? null;
  if (min != null && max != null) {
    return `${min} triệu - ${max} triệu`;
  }
  if (min != null) {
    return `Từ ${min} triệu`;
  }
  if (max != null) {
    return `Đến ${max} triệu`;
  }
  return "Thương lượng";
};

export default function JobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated, roles } = useAuth();
  const { ensureProfile } = useJobSeekerProfileGate();

  const [keyword, setKeyword] = React.useState("");
  const [categoryParam, setCategoryParam] = React.useState<string | null>(null);
  const [selectedLocations, setSelectedLocations] = React.useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = React.useState<JobType[]>([]);
  const [salaryRange, setSalaryRange] = React.useState<string>("all");
  const [sort, setSort] = React.useState("newest");
  const [page, setPage] = React.useState(0);
  const [favoriteIds, setFavoriteIds] = React.useState<Set<number>>(new Set());

  // Debounce keyword
  const debouncedKeyword = useDebouncedValue(keyword, 500);

  // Initialize from URL params
  React.useEffect(() => {
    const q = searchParams.get("q") ?? "";
    const location = searchParams.get("location") ?? "";
    const category = searchParams.get("category");
    const jobTypeParam = searchParams.get("jobType");

    setKeyword(q);
    setCategoryParam(category);
    if (jobTypeParam && ["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", "INTERN"].includes(jobTypeParam)) {
      setSelectedJobTypes([jobTypeParam as JobType]);
    } else {
      setSelectedJobTypes([]);
    }
    if (location) {
      const loc = LOCATION_OPTIONS.find((item) => item.value === location);
      setSelectedLocations(loc ? [loc.value] : []);
    } else {
      setSelectedLocations([]);
    }
  }, [searchParams]);

  // Load favorites
  const loadFavorites = React.useCallback(async () => {
    if (!isAuthenticated || !roles.includes("JOB_SEEKER")) {
      setFavoriteIds(new Set());
      return;
    }
    try {
      const data = await listFavorites(0, 200);
      setFavoriteIds(new Set(data.items.map((item) => item.jobId)));
    } catch (error) {
      setFavoriteIds(new Set());
    }
  }, [isAuthenticated, roles]);

  React.useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  const categoryOptions = React.useMemo(() => CATEGORIES.map((category) => category.name), []);

  // Build search request
  const searchRequest = useMemo<JobSearchRequest>(() => {
    const searchText = buildSearchText(debouncedKeyword);
    const matchedCategory = categoryParam
      ? CATEGORIES.find(
          (category) => category.name.toLowerCase() === categoryParam.trim().toLowerCase()
        )
      : null;
    const locationFilters = selectedLocations.map((loc) => loc.trim().toLowerCase()).filter(Boolean);
    const range = SALARY_RANGES.find((item) => item.value === salaryRange);

      return {
        pagination: { page, pageSize: PAGE_SIZE },
        sortBy: sort === "newest" ? "createAt" : sort === "deadline" ? "deadline" : "title",
        sortOrder: sort === "newest" ? "DESC" : "ASC",
        searchedBy: searchText || undefined,
        filter: {
          locations: locationFilters.length > 0 ? locationFilters : undefined,
        jobTypes: selectedJobTypes.length > 0 ? selectedJobTypes : undefined,
        salaryMin: range?.min ?? null,
        salaryMax: range?.max ?? null,
        categoryIds: matchedCategory ? [matchedCategory.id] : undefined,
      },
    };
  }, [debouncedKeyword, categoryParam, selectedLocations, selectedJobTypes, salaryRange, sort, page]);

  // Fetch jobs with React Query
  const { data: jobsData, isLoading } = useJobs(searchRequest);

  const jobs = jobsData?.items ?? [];
  const total = jobsData?.count ?? 0;

  // Get unique company IDs
  const companyIds = useMemo(() => {
    const seen = new Set<number>();
    const ids: number[] = [];
    jobs.forEach((job) => {
      if (job.companyId && !job.companyName && !seen.has(job.companyId)) {
        seen.add(job.companyId);
        ids.push(job.companyId);
      }
    });
    return ids;
  }, [jobs]);

  // Batch fetch companies
  const { data: companies = [] } = useCompanies(companyIds, companyIds.length > 0);

  // Create company map
  const companyMap = useMemo(() => {
    const map: Record<number, typeof companies[0]> = {};
    companies.forEach((company) => {
      map[company.companyId] = company;
    });
    return map;
  }, [companies]);

  const handleSearchSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (debouncedKeyword.trim()) {
      params.set("q", debouncedKeyword.trim());
    }
        if (selectedLocations[0]) {
      params.set("location", selectedLocations[0]);
    }
    if (categoryParam) {
      params.set("category", categoryParam);
    }
    setPage(0);
    router.push(params.toString() ? `/jobs?${params.toString()}` : "/jobs");
  }, [debouncedKeyword, selectedLocations, categoryParam, router]);

  const toggleLocation = useCallback((value: string, checked: boolean) => {
    setSelectedLocations((prev) => {
      if (checked) return [...prev, value];
      return prev.filter((item) => item !== value);
    });
    setPage(0);
  }, []);

  const toggleJobType = useCallback((value: JobType, checked: boolean) => {
    setSelectedJobTypes((prev) => {
      if (checked) return [...prev, value];
      return prev.filter((item) => item !== value);
    });
    setPage(0);
  }, []);

  const handleSalaryChange = useCallback((value: string) => {
    setSalaryRange(value);
    setPage(0);
  }, []);

  const handleToggleFavorite = useCallback(async (jobId: number) => {
    if (!isAuthenticated) {
      router.push(`/login?next=/jobs`);
      return;
    }
    const result = await ensureProfile({ type: "FAVORITE_JOB" });
    if (!result.hasProfile) {
      return;
    }

    const alreadySaved = favoriteIds.has(jobId);
    try {
      if (alreadySaved) {
        await removeFavorite(jobId);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
      } else {
        await addFavorite(jobId);
        setFavoriteIds((prev) => new Set(prev).add(jobId));
      }
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        variant: "destructive",
        title: "Không thể cập nhật yêu thích",
        description: apiError.message,
      });
    }
  }, [isAuthenticated, favoriteIds, ensureProfile, router, toast]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col">
      <main className="flex-1">
        <Container className="grid gap-8 py-8 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Bộ lọc</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Input
                    placeholder="Tìm kiếm việc làm..."
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </form>

                <Accordion type="multiple" defaultValue={["location", "category", "salary", "type"]} className="w-full">
                  <AccordionItem value="location">
                    <AccordionTrigger>Địa điểm</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      {LOCATION_OPTIONS.map((item) => (
                        <div key={item.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`loc-${item.value}`}
                            checked={selectedLocations.includes(item.value)}
                            onCheckedChange={(checked) => toggleLocation(item.value, Boolean(checked))}
                          />
                          <Label htmlFor={`loc-${item.value}`}>{item.label}</Label>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="salary">
                    <AccordionTrigger>Mức lương</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      {SALARY_RANGES.map((item) => (
                        <div key={item.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`sal-${item.value}`}
                            checked={salaryRange === item.value}
                            onCheckedChange={() => handleSalaryChange(item.value)}
                          />
                          <Label htmlFor={`sal-${item.value}`}>{item.label}</Label>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="category">
                    <AccordionTrigger>Danh mục</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      {categoryOptions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Chưa có danh mục.</p>
                      ) : (
                        categoryOptions.map((name) => (
                          <div key={name} className="flex items-center space-x-2">
                            <Checkbox
                              id={`cat-${name}`}
                              checked={categoryParam === name}
                              onCheckedChange={(checked) => {
                                setCategoryParam(checked ? name : null);
                                setPage(0);
                              }}
                            />
                            <Label htmlFor={`cat-${name}`}>{name}</Label>
                          </div>
                        ))
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="type">
                    <AccordionTrigger>Loại hình</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      {JOB_TYPE_OPTIONS.map((item) => (
                        <div key={item.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`type-${item.value}`}
                            checked={selectedJobTypes.includes(item.value)}
                            onCheckedChange={(checked) => toggleJobType(item.value, Boolean(checked))}
                          />
                          <Label htmlFor={`type-${item.value}`}>{item.label}</Label>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </aside>

          <main className="lg:col-span-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold">Danh sách việc làm</h2>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4 space-y-6">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <Card key={`job-skeleton-${index}`} className="animate-pulse">
                    <CardHeader className="space-y-2">
                      <div className="h-4 w-40 rounded bg-muted" />
                      <div className="h-3 w-32 rounded bg-muted" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-3/4 rounded bg-muted" />
                    </CardContent>
                  </Card>
                ))
              ) : jobs.length > 0 ? (
                jobs.map((job) => {
                  const logo = PlaceHolderImages.find((p) => p.id === "company-logo-fpt");
                  const company = companyMap[job.companyId];
                  const companyName = job.companyName ?? company?.companyName ?? "Unknown";
                  const companyAvatar = job.companyAvatarUrl ?? company?.avatarUrl ?? null;
                  return (
                    <Card
                      key={job.jobId}
                      className="cursor-pointer border-emerald-100/80 bg-emerald-50/50 transition-shadow hover:shadow-md"
                      onClick={() => router.push(`/jobs/${job.jobId}`)}
                    >
                      <CardHeader className="grid grid-cols-[auto_1fr_auto] items-start gap-4">
                        {companyAvatar ? (
                          <Image
                            src={companyAvatar}
                            alt={`${companyName} logo`}
                            width={64}
                            height={64}
                            className="rounded-lg"
                            loading="lazy"
                          />
                        ) : logo ? (
                          <Image
                            src={logo.imageUrl}
                            alt="Company logo"
                            width={64}
                            height={64}
                            className="rounded-lg"
                            loading="lazy"
                            data-ai-hint={logo.imageHint}
                          />
                        ) : null}
                        <div className="space-y-1">
                          <CardTitle>{job.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Building className="w-4 h-4" />{companyName}
                          </CardDescription>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1 text-sm text-muted-foreground">
                            <p className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location ?? "Unknown"}</p>
                            <p className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{formatSalary(job)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleToggleFavorite(job.jobId);
                            }}
                            aria-label="Toggle favorite"
                          >
                            {favoriteIds.has(job.jobId) ? (
                              <BookmarkCheck className="h-5 w-5 text-primary" />
                            ) : (
                              <Bookmark className="h-5 w-5" />
                            )}
                          </Button>
                          <Link href={`/jobs/${job.jobId}`}>
                            <Button className="bg-emerald-600 text-white hover:bg-emerald-700">Ứng tuyển</Button>
                          </Link>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    Không tìm thấy việc làm phù hợp.
                  </CardContent>
                </Card>
              )}
            </div>
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setPage((prev) => Math.max(0, prev - 1));
                    }}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).slice(0, 5).map((_, index) => (
                  <PaginationItem key={`page-${index}`}>
                    <PaginationLink
                      href="#"
                      isActive={page === index}
                      onClick={(event) => {
                        event.preventDefault();
                        setPage(index);
                      }}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                {totalPages > 5 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setPage((prev) => Math.min(totalPages - 1, prev + 1));
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </main>
        </Container>
      </main>
    </div>
  );
}



