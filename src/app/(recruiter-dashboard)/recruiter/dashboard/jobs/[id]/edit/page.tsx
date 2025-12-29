'use client';

import React from "react";
import { useParams, useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { JobForm, type JobFormValues, LOCATION_OPTIONS } from "@/components/recruiter/job-form";
import { CATEGORIES, JOB_TAGS } from "@/lib/job-form-data";

type JobDetail = {
  jobId: number;
  title: string;
  description?: string | null;
  location?: string | null;
  minSalary?: number | null;
  maxSalary?: number | null;
  jobType?: JobFormValues["job_type"] | null;
  deadline?: string | null;
  categories?: string[] | null;
  tags?: string[] | null;
  requirements?: string[] | null;
};

const mapNamesToIds = (names: string[] | null | undefined, items: { id: number; name: string }[]) =>
  (names ?? [])
    .map((name) => items.find((item) => item.name === name)?.id)
    .filter((value): value is number => typeof value === "number");

const toRequirementList = (value?: string) => {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};


const normalizeLocation = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const resolveJobTypeValue = (value?: string | null): JobFormValues["job_type"] | undefined => {
  if (!value) return undefined;
  const normalized = value.toLowerCase().replace(/[^a-z]+/g, " ").trim();
  if (normalized.includes("full")) return "FULL_TIME";
  if (normalized.includes("part")) return "PART_TIME";
  if (normalized.includes("intern")) return "INTERN";
  if (normalized.includes("contract")) return "CONTRACT";
  if (normalized.includes("freelance")) return "FREELANCE";
  return undefined;
};

const resolveLocationValue = (value?: string | null) => {
  if (!value) return undefined;
  const normalized = normalizeLocation(value);
  for (const option of LOCATION_OPTIONS) {
    if (normalizeLocation(option.value) == normalized || normalizeLocation(option.label) == normalized) {
      return option.value;
    }
  }
  if (normalized.includes("ho chi minh") || normalized == "hcm" || normalized == "tp hcm") {
    return LOCATION_OPTIONS[2]?.value ?? value;
  }
  if (normalized.includes("ha noi")) {
    return LOCATION_OPTIONS[0]?.value ?? value;
  }
  if (normalized.includes("da nang")) {
    return LOCATION_OPTIONS[1]?.value ?? value;
  }
  return value;
};

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const jobIdParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const jobId = jobIdParam ? Number(jobIdParam) : NaN;

  const [initialValues, setInitialValues] = React.useState<Partial<JobFormValues> | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const loadJob = async () => {
      if (!accessToken || !jobId || Number.isNaN(jobId)) {
        setIsLoading(false);
        setErrorMessage("Kh“ng tAªm th §y tin tuy?n d?ng.");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await apiRequest<JobDetail>(`/api/jobs/${jobId}/owner`, {
          method: "GET",
          accessToken,
        });
        const job = response.data;
        if (!job || !mounted) return;

        setInitialValues({
          title: job.title ?? "",
          description: job.description ?? "",
          location: resolveLocationValue(job.location) ?? "",
          min_salary: job.minSalary ?? 0,
          max_salary: job.maxSalary ?? 0,
          job_type: resolveJobTypeValue(job.jobType ?? undefined) ?? "FULL_TIME",
          deadline: job.deadline ? new Date(job.deadline) : undefined,
          categoryIds: mapNamesToIds(job.categories, CATEGORIES),
          tagIds: mapNamesToIds(job.tags, JOB_TAGS),
          requirements: (job.requirements ?? []).join("\n"),
        });
      } catch (error) {
        const apiError = error as ApiError;
        if (!mounted) return;
        setErrorMessage(apiError.message || "Kh“ng t?i Ž`ŽŸng tin tuy?n d?ng.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void loadJob();
    return () => {
      mounted = false;
    };
  }, [accessToken, jobId]);

  const handleUpdate = async (values: JobFormValues) => {
    if (!accessToken || !jobId || Number.isNaN(jobId)) return;

    try {
      const deadline = values.deadline ? values.deadline.toISOString().split("T")[0] : undefined;
      await apiRequest(`/api/jobs/${jobId}`, {
        method: "PATCH",
        accessToken,
        body: {
          title: values.title,
          description: values.description,
          location: values.location,
          minSalary: values.min_salary,
          maxSalary: values.max_salary,
          jobType: values.job_type,
          deadline,
          tagIds: values.tagIds,
          categoryIds: values.categoryIds,
          requirements: toRequirementList(values.requirements),
        },
      });

      toast({
        title: "Cập nhật thành công!",
        description: `Tin tuyển dụng \"${values.title}\" đã được cập nhật.`,
      });
      router.push("/recruiter/dashboard/jobs");
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        variant: "destructive",
        title: "Cập nhật thất bại",
        description: apiError.message || "Không thể cập nhật tin tuyển dụng.",
      });
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="max-w-4xl mx-auto w-full">
        <Card>
          <CardHeader>
            <CardTitle>Chỉnh sửa tin tuyển dụng</CardTitle>
            <CardDescription>Cập nhật thông tin cho tin tuyển dụng của bạn.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || (!initialValues && !errorMessage) ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : errorMessage ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                {errorMessage}
              </div>
            ) : (
              <JobForm
                initialValues={initialValues ?? undefined}
                onSubmit={handleUpdate}
                submitLabel="Lưu thay đổi"
                onCancel={() => router.back()}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
