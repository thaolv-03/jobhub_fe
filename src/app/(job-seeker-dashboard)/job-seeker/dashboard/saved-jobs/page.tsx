'use client';

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Building, MapPin, DollarSign, BookmarkX, Bookmark } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { listFavorites, removeFavorite } from "@/lib/favorites";
import { getJob, type Job } from "@/lib/jobs";
import { ApiError } from "@/lib/api-types";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const formatSalary = (job: Job) => {
  const min = job.minSalary ?? null;
  const max = job.maxSalary ?? null;
  if (min != null && max != null) {
    return `${min} triệu - ${max} triệu`;
  }
  if (min != null) {
    return `T? ${min} triệu`;
  }
  if (max != null) {
    return `??n ${max} triệu`;
  }
  return "Thương lượng";
};

type SavedJobRow = Job & { favoriteId?: number };

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = React.useState<SavedJobRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    let mounted = true;
    const loadFavorites = async () => {
      setIsLoading(true);
      try {
        const favorites = await listFavorites(0, 50);
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
        setSavedJobs(jobs.filter((job): job is SavedJobRow => Boolean(job)));
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
  }, []);

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
          <CardTitle>Việc đã lưu</CardTitle>
          <CardDescription>
            {savedJobs.length > 0
              ? `Bạn có ${savedJobs.length} việc đã lưu. Dừng bỏ lỡ cơ hội ứng tuyển!`
              : "Bạn chưa lưu công việc nào."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">Đang tải dữ liệu...</div>
          ) : savedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedJobs.map((job) => {
                const logo = PlaceHolderImages.find((p) => p.id === "company-logo-fpt");
                return (
                  <Card key={job.jobId} className="flex flex-col">
                    <CardHeader className="flex flex-row items-start gap-4">
                      {job.companyAvatarUrl ? (
                        <Image
                          src={job.companyAvatarUrl}
                          alt={`${job.companyName ?? "Company"} logo`}
                          width={48}
                          height={48}
                          className="rounded-md"
                        />
                      ) : logo ? (
                        <Image
                          src={logo.imageUrl}
                          alt="Company logo"
                          width={48}
                          height={48}
                          className="rounded-md"
                          data-ai-hint={logo.imageHint}
                        />
                      ) : null}
                      <div>
                        <CardTitle className="text-lg mb-1 leading-tight">{job.title}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1"><Building className="w-4 h-4" /> {job.companyName ?? "Unknown"}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" /> {job.location ?? "Unknown"}</p>
                      <p className="flex items-center gap-2 text-muted-foreground"><DollarSign className="w-4 h-4" /> {formatSalary(job)}</p>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button asChild className="flex-1">
                        <Link href={`/jobs/${job.jobId}`}>Ứng tuyển ngay</Link>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleUnsave(job.jobId, job.title)}>
                        <BookmarkX className="h-5 w-5" />
                        <span className="sr-only">Bỏ lưu</span>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <Bookmark className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Chua co viec duoc luu</h3>
              <p className="mt-2 text-sm text-muted-foreground">Luu lai cac viec ban quan tam de xem lai sau.</p>
              <Button asChild className="mt-6">
                <Link href="/jobs">Kham pha viec lam</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
