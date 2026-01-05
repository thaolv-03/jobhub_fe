'use client';

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Building, MapPin, DollarSign, BookmarkX, Bookmark, Search } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { listFavorites, removeFavorite } from "@/lib/favorites";
import { getJob, type Job } from "@/lib/jobs";
import { ApiError } from "@/lib/api-types";
import { PlaceHolderImages } from "@/lib/placeholder-images";

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

type SavedJobRow = Job & { favoriteId?: number };

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = React.useState<SavedJobRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const { toast } = useToast();
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  React.useEffect(() => {
    let mounted = true;
    const loadFavorites = async () => {
      setIsLoading(true);
      try {
        const favorites = await listFavorites(0, 50, debouncedSearch);
        const jobs = await Promise.all(
          favorites.items.map(async (item) => {
            try {
              const job = await getJob(item.jobId);
              return { ...job, favoriteId: item.favoriteId };
            } catch (error) {
              return null;
            }
          })
        );
        if (!mounted) return;
        const normalizedQuery = debouncedSearch.toLowerCase();
        const filtered = jobs.filter((job): job is SavedJobRow => Boolean(job)).filter((job) => {
          if (!normalizedQuery) return true;
          const haystack = [job.title, job.companyName, job.location]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(normalizedQuery);
        });
        setSavedJobs(filtered);
      } catch (error) {
        if (!mounted) return;
        setSavedJobs([]);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    void loadFavorites();
    return () => {
      mounted = false;
    };
  }, [debouncedSearch]);

  const handleUnsave = async (jobId: number, jobTitle: string) => {
    try {
      await removeFavorite(jobId);
      setSavedJobs((prev) => prev.filter((job) => job.jobId != jobId));
      toast({
        title: "Đã bỏ lưu",
        description: `Đã bỏ lưu công việc "${jobTitle}".`,
      });
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        variant: "destructive",
        title: "Không thể bỏ lưu",
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
              <CardTitle>Việc đã lưu</CardTitle>
              <CardDescription>
                {savedJobs.length > 0
                  ? `Bạn có ${savedJobs.length} việc đã lưu. Đừng bỏ lỡ cơ hội ứng tuyển!`
                  : "Bạn chưa lưu công việc nào."}
              </CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm kiếm việc đã lưu"
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">Đang tải dữ liệu...</div>
          ) : savedJobs.length > 0 ? (
            <div className="space-y-4">
              {savedJobs.map((job) => {
                const logo = PlaceHolderImages.find((p) => p.id === "company-logo-fpt");
                return (
                  <Card key={job.jobId} className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        {job.companyAvatarUrl ? (
                          <Image
                            src={job.companyAvatarUrl}
                            alt={`${job.companyName ?? "Company"} logo`}
                            width={56}
                            height={56}
                            className="rounded-md"
                          />
                        ) : logo ? (
                          <Image
                            src={logo.imageUrl}
                            alt="Company logo"
                            width={56}
                            height={56}
                            className="rounded-md"
                            data-ai-hint={logo.imageHint}
                          />
                        ) : null}
                        <div>
                          <CardTitle className="text-base leading-tight">{job.title}</CardTitle>
                          <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
                            <Building className="w-4 h-4" /> {job.companyName ?? "Unknown"}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {job.location ?? "Unknown"}</span>
                            <span className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> {formatSalary(job)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                        <Button asChild className="w-full md:w-auto">
                          <Link href={`/jobs/${job.jobId}`}>Ứng tuyển ngay</Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUnsave(job.jobId, job.title)}
                          className="w-full md:w-10"
                        >
                          <BookmarkX className="h-5 w-5" />
                          <span className="sr-only">Bỏ lưu</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <Bookmark className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Chưa có việc được lưu</h3>
              <p className="mt-2 text-sm text-muted-foreground">Lưu lại các việc bạn quan tâm để xem lại sau.</p>
              <Button asChild className="mt-6">
                <Link href="/jobs">Khám phá việc làm</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}



