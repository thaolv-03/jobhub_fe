'use client';

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, MapPin, Briefcase, DollarSign, Search, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { Container } from "@/components/layout/container";
import { BannerSlider } from "@/components/home/banner-slider";
import { formatJobType, type JobType } from "@/lib/jobs";
import { useAuth } from "@/hooks/use-auth";
import { useFeaturedJobs } from "@/hooks/use-jobs";
import { useTopCompanies } from "@/hooks/use-companies";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useCompanies } from "@/hooks/use-companies";
import { CATEGORIES } from "@/lib/job-form-data";

const formatSalary = (job: { minSalary?: number | null; maxSalary?: number | null }) => {
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

const locations = [
  { value: "all", label: "\u0054\u1ea5\u0074 c\u1ea3 \u0111\u1ecb\u0061 \u0111\u0069\u1ec3\u006d" },
  { value: "\u0048\u00e0 \u004e\u1ed9\u0069", label: "\u0048\u00e0 \u004e\u1ed9\u0069" },
  { value: "TP HCM", label: "TP \u0048\u1ed3 \u0043\u00ed \u004d\u0069\u006e\u0068" },
  { value: "\u0110\u00e0 \u004e\u1eb5\u006e\u0067", label: "\u0110\u00e0 \u004e\u1eb5\u006e\u0067" },
];

const jobTypeOptions: { value: JobType | "all"; label: string }[] = [
  { value: "all", label: "Tất cả loại hình" },
  { value: "FULL_TIME", label: formatJobType("FULL_TIME") },
  { value: "PART_TIME", label: formatJobType("PART_TIME") },
  { value: "CONTRACT", label: formatJobType("CONTRACT") },
  { value: "FREELANCE", label: formatJobType("FREELANCE") },
  { value: "INTERN", label: formatJobType("INTERN") },
];

export default function Home() {
  const router = useRouter();
  const { accessToken, roles } = useAuth();
  const [keyword, setKeyword] = React.useState("");
  const [location, setLocation] = React.useState("all");
  const [category, setCategory] = React.useState("all");
  const [jobType, setJobType] = React.useState<JobType | "all">("all");

  // Debounce keyword for better performance
  const debouncedKeyword = useDebouncedValue(keyword, 300);

  // Fetch data with React Query
  const { data: featuredJobs = [], isLoading: isFeaturedLoading } = useFeaturedJobs(4);
  const { data: topCompanies = [], isLoading: isTopCompaniesLoading } = useTopCompanies(6);

  // Get unique company IDs from featured jobs
  const companyIds = useMemo(() => {
    const seen = new Set<number>();
    const ids: number[] = [];
    featuredJobs.forEach((job) => {
      if (job.companyId && !job.companyName && !seen.has(job.companyId)) {
        seen.add(job.companyId);
        ids.push(job.companyId);
      }
    });
    return ids;
  }, [featuredJobs]);

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

  // Memoize category options with "all" option
  const categoryOptionsWithAll = useMemo(() => {
    return [{ value: "all", label: "Danh mục" }, ...CATEGORIES.map((item) => ({ value: item.name, label: item.name }))];
  }, []);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (debouncedKeyword.trim()) {
      params.set("q", debouncedKeyword.trim());
    }
    if (location && location !== "all") {
      params.set("location", location);
    }
    if (category && category !== "all") {
      params.set("category", category);
    }
    if (jobType && jobType !== "all") {
      params.set("jobType", jobType);
    }
    const queryString = params.toString();
    router.push(queryString ? `/jobs?${queryString}` : "/jobs");
  };

  return (
    <div className="flex flex-col">
      <div className="relative overflow-hidden bg-[url('/images/backgrounds/background_lightmode.png')] bg-cover bg-center bg-no-repeat dark:bg-[url('/images/backgrounds/background_darkmode.png')]">
        <div className="absolute inset-0 bg-white/70 dark:bg-black/50" />
        <div className="relative z-10">
          <section className="relative">
            <Container>
          <div className="py-16 md:py-24">
            <div className="space-y-8">
              <div className="space-y-6 max-w-3xl lg:max-w-4xl">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
                  Tìm kiếm công việc mơ ước của bạn ngay hôm nay
                </h1>
                <p className="max-w-[640px] text-muted-foreground md:text-xl">
                  JobHub là nơi tốt nhất để bạn tìm kiếm cơ hội nghề nghiệp tiếp theo. Khám phá hàng ngàn danh sách việc làm từ các công ty hàng đầu.
                </p>
              </div>
              <div className="pt-2">
                <form onSubmit={handleSearch} className="w-full">
                  <div className="w-full">
                    <div className="rounded-full border bg-background/95 p-2 shadow-lg">
                      <div className="flex flex-col gap-2 md:flex-row md:flex-nowrap md:items-center md:gap-4">
                        <div className="relative flex flex-1 items-center gap-2 px-4 py-2">
                          <Search className="h-5 w-5 text-primary" />
                          <Input
                            type="text"
                            value={keyword}
                            onChange={(event) => setKeyword(event.target.value)}
                            placeholder="Tìm kiếm vị trí, công ty..."
                            className="min-h-[48px] flex-1 border-0 bg-transparent px-2.5 py-2 leading-6 shadow-none focus-visible:ring-0 md:px-0"
                          />
                        </div>
                        <div className="hidden h-6 w-px bg-border md:block" />
                        <div className="relative flex flex-1 items-center gap-2 px-4 py-2">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <Select value={location} onValueChange={setLocation}>
                            <SelectTrigger className="min-h-[48px] w-full min-w-[180px] border-0 bg-transparent px-2.5 py-2 leading-6 shadow-none focus:ring-0 focus-visible:ring-0 md:w-auto md:px-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {locations.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="hidden h-6 w-px bg-border md:block" />
                        <div className="relative flex flex-1 items-center gap-2 px-4 py-2">
                          <Tag className="h-5 w-5 text-muted-foreground" />
                          <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="min-h-[48px] w-full min-w-[170px] border-0 bg-transparent px-2.5 py-2 leading-6 shadow-none focus:ring-0 focus-visible:ring-0 md:w-auto md:px-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categoryOptionsWithAll.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="hidden h-6 w-px bg-border md:block" />
                        <div className="relative flex flex-1 items-center gap-2 px-4 py-2">
                          <Briefcase className="h-5 w-5 text-muted-foreground" />
                          <Select value={jobType} onValueChange={(value) => setJobType(value as JobType | "all")}> 
                            <SelectTrigger className="min-h-[48px] w-full min-w-[170px] border-0 bg-transparent px-2.5 py-2 leading-6 shadow-none focus:ring-0 focus-visible:ring-0 md:w-auto md:px-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {jobTypeOptions.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="h-12 w-full rounded-full px-8 text-sm font-semibold md:ml-auto md:w-auto md:shrink-0">
                          TÌM VIỆC
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Container>
          </section>
          <BannerSlider />
        </div>
      </div>

      <section className="py-16 md:py-20 bg-secondary/50">
        <Container>
          <h2 className="text-3xl font-bold text-center mb-10">Công việc nổi bật</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isFeaturedLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={`featured-skeleton-${index}`} className="animate-pulse">
                  <CardHeader className="space-y-2">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="h-4 w-32 rounded bg-muted" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-3 w-3/4 rounded bg-muted" />
                  </CardContent>
                </Card>
              ))
            ) : featuredJobs.length > 0 ? (
              featuredJobs.map((job) => {
                const company = companyMap[job.companyId];
                const companyName = job.companyName ?? company?.companyName ?? "Unknown";
                const companyAvatar = job.companyAvatarUrl ?? company?.avatarUrl ?? null;
                return (
                  <Card key={job.jobId} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-start gap-4">
                      {companyAvatar ? (
                        <Image
                          src={companyAvatar}
                          alt={`${companyName} logo`}
                          width={48}
                          height={48}
                          className="rounded-md"
                          loading="lazy"
                        />
                      ) : null}
                      <div>
                        <CardTitle className="text-lg mb-1">{job.title}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building className="w-4 h-4" /> {companyName}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" /> {job.location ?? "Unknown"}
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="w-4 h-4" /> {formatSalary(job)}
                      </p>
                      <div className="pt-2">
                        <Link href={`/jobs/${job.jobId}`}>
                          <Button variant="outline" className="w-full">Xem chi tiết</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center text-sm text-muted-foreground">
                Chưa có việc nổi bật.
              </div>
            )}
          </div>
          <div className="text-center mt-12">
            <Link href="/jobs">
              <Button size="lg">Xem tất cả việc làm</Button>
            </Link>
          </div>
        </Container>
      </section>

      <section className="py-16 md:py-20">
        <Container>
          <h2 className="text-3xl font-bold text-center mb-10">Công ty hàng đầu</h2>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {isTopCompaniesLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={`top-company-skeleton-${index}`} className="h-20 w-32 rounded-xl bg-muted animate-pulse" />
              ))
            ) : topCompanies.length > 0 ? (
              topCompanies.map((company) => {
                const logo = PlaceHolderImages.find((p) => p.id === "company-logo-fpt");
                return (
                  <Link
                    key={company.companyId}
                    href={`/companies/${company.companyId}`}
                    className="group flex h-20 w-32 items-center justify-center rounded-xl border border-white bg-white p-3 shadow-sm transition-transform hover:-translate-y-1"
                  >
                    {company.avatarUrl || logo?.imageUrl ? (
                      <Image
                        src={company.avatarUrl || logo?.imageUrl || undefined}
                        alt={company.companyName}
                        width={96}
                        height={48}
                        className="h-12 w-24 object-contain transition-transform duration-200 group-hover:scale-105"
                        loading="lazy"
                        data-ai-hint={logo?.imageHint}
                      />
                    ) : (
                      <div className="h-12 w-24 rounded-md bg-muted" />
                    )}
                  </Link>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có công ty nổi bật.</p>
            )}
          </div>
        </Container>
      </section>
    </div>
  );
}
