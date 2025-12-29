'use client';

import React from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { JobForm, type JobFormValues } from "@/components/recruiter/job-form";

const toRequirementList = (value?: string) => {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

export default function PostJobPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { accessToken } = useAuth();

  const handleJobSubmit = async (values: JobFormValues) => {
    if (!accessToken) {
      return;
    }

    try {
      const deadline = values.deadline ? values.deadline.toISOString().split("T")[0] : undefined;

      await apiRequest("/api/jobs", {
        method: "POST",
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
        title: "Đăng tin thành công!",
        description: `Tin tuyển dụng cho vị trí "${values.title}" đã được đăng.`,
      });
      router.push("/recruiter/dashboard/jobs");
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        variant: "destructive",
        title: "Đăng tin thất bại",
        description: apiError.message || "Có lỗi xảy ra. Vui lòng thử lại.",
      });
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="max-w-4xl mx-auto w-full">
        <Card>
          <CardHeader>
            <CardTitle>Đăng tin tuyển dụng mới</CardTitle>
            <CardDescription>Điền các thông tin chi tiết về vị trí bạn muốn tuyển dụng.</CardDescription>
          </CardHeader>
          <CardContent>
            <JobForm
              onSubmit={handleJobSubmit}
              submitLabel="Đăng tin"
              onCancel={() => router.back()}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
