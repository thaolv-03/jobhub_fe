'use client';

import React from "react";
import { useParams, useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { JobForm, type JobFormValues, LOCATION_OPTIONS } from "@/components/recruiter/job-form";
import { uploadJobJd } from "@/lib/jobs";
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
    .map((name) => items.find((item) => item.name == name)?.id)
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
    .replace(/[̀-ͯ]/g, "")
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
  const jobId = jobIdParam ? Number(jobIdParam) : Number.NaN;

  const [initialValues, setInitialValues] = React.useState<Partial<JobFormValues> | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [jdFile, setJdFile] = React.useState<File | null>(null);
  const [jdUploading, setJdUploading] = React.useState(false);
  const [jdUploaded, setJdUploaded] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const loadJob = async () => {
      if (!accessToken || !jobId || Number.isNaN(jobId)) {
        setIsLoading(false);
        setErrorMessage("Không tìm thấy tin tuyển dụng.");
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
        setErrorMessage(apiError.message || "Không tải được thông tin tuyển dụng.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void loadJob();
    return () => {
      mounted = false;
    };
  }, [accessToken, jobId]);

  const handleJdUpload = async () => {
    if (!accessToken || !jobId || Number.isNaN(jobId)) return;
    if (!jdFile) {
      toast({
        variant: "destructive",
        title: "Chưa chọn JD",
        description: "Vui lòng chọn file JD trước khi tải lên.",
      });
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
    ];
    if (!allowedTypes.includes(jdFile.type)) {
      toast({
        variant: "destructive",
        title: "Định dạng không hợp lệ",
        description: "Hỗ trợ PDF, DOC, DOCX, PNG, JPG.",
      });
      return;
    }
    if (jdFile.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File quá lớn",
        description: "Dung lượng tối đa 10MB.",
      });
      return;
    }

    try {
      setJdUploading(true);
      await uploadJobJd(jobId, jdFile);
      toast({
        title: "Tải JD thành công",
        description: "JD đã được tải lên cho tin tuyển dụng này.",
      });
      setJdFile(null);
      setJdUploaded(true);
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        variant: "destructive",
        title: "Tải JD thất bại",
        description: apiError.message || "Không thể tải JD lên.",
      });
    } finally {
      setJdUploading(false);
    }
  };

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
        title: "Cập nhật thành công",
        description: `Tin tuyển dụng "${values.title}" đã được cập nhật.`,
      });
      router.push("/recruiter/dashboard/jobs");
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        variant: "destructive",
        title: "Cập nhật thất bại",
        description: apiError.message || "Không thể cập nhật tin tuyển dụng.",
      });
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="mx-auto w-full max-w-4xl">
        <Card className="border-border/60 bg-background/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">{"Chỉnh sửa tin tuyển dụng"}</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              {"Cập nhật thông tin cho tin tuyển dụng của bạn."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || (!initialValues && !errorMessage) ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full dark:bg-slate-800" />
                <Skeleton className="h-10 w-full dark:bg-slate-800" />
                <Skeleton className="h-10 w-full dark:bg-slate-800" />
              </div>
            ) : errorMessage ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground dark:border-slate-700/70 dark:text-slate-300">
                {errorMessage}
              </div>
            ) : (
              <>
                <JobForm
                  initialValues={initialValues ?? undefined}
                  onSubmit={handleUpdate}
                  submitLabel={"Lưu thay đổi"}
                  onCancel={() => router.back()}
                />
                <div className="mt-6 rounded-lg border border-dashed p-4 dark:border-slate-700/70">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{"Tải JD cho tin tuyển dụng"}</p>
                      <p className="text-xs text-muted-foreground">{"Hỗ trợ PDF, DOC, DOCX, PNG, JPG (tối đa 10MB)."}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        id="jd-upload"
                        type="file"
                        className="text-sm"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          setJdFile(file);
                        }}
                      />
                      <Button type="button" onClick={handleJdUpload} disabled={jdUploading || !jdFile}>
                        {jdUploading ? "Đang tải..." : "Tải JD"}
                      </Button>
                    </div>
                  </div>
                  {jdFile ? (
                    <p className="mt-2 text-xs text-muted-foreground">{`Đã chọn: ${jdFile.name}`}</p>
                  ) : null}
                  {jdUploaded ? (
                    <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">Da tai JD</p>
                  ) : null}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
