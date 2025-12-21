'use client';

import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, ApiError } from "@/lib/api-client";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { CONSULTING_BUDGET_UNITS, CONSULTING_INDUSTRIES, CONSULTING_POSITIONS } from "@/lib/constants/consulting";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const consultationSchema = z.object({
  position: z.string().min(1, { message: "Vui lòng chọn vị trí tuyển dụng." }),
  industry: z.string().min(1, { message: "Vui lòng chọn lĩnh vực." }),
  budgetAmount: z.coerce.number().min(0, { message: "Ngân sách phải lớn hơn hoặc bằng 0." }),
  budgetUnit: z.string().min(1, { message: "Vui lòng chọn đơn vị ngân sách." }),
  notes: z.string().optional(),
});

type ConsultationFormValues = z.infer<typeof consultationSchema>;

type StepStatus = "done" | "active" | "inactive";

const StepIndicator = ({ steps }: { steps: Array<{ label: string; status: StepStatus }> }) => (
  <div className="flex items-center justify-between gap-4">
    {steps.map((step, index) => {
      const isDone = step.status === "done";
      const isActive = step.status === "active";
      const lineClass = isDone || isActive ? "bg-emerald-500" : "bg-muted-foreground/30";
      return (
        <div key={step.label} className="flex flex-1 flex-col items-center text-center">
          <div className="flex w-full items-center">
            <div className={`h-[2px] flex-1 ${index === 0 ? "bg-transparent" : lineClass}`} />
            <div
              className={[
                "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold",
                isDone ? "border-emerald-500 bg-emerald-500 text-white" : "",
                isActive ? "border-emerald-500 text-emerald-600" : "",
                step.status === "inactive" ? "border-muted-foreground/30 text-muted-foreground" : "",
              ].join(" ")}
            >
              {isDone ? <Check className="h-4 w-4 text-white" /> : index + 1}
            </div>
            <div className={`h-[2px] flex-1 ${index === steps.length - 1 ? "bg-transparent" : lineClass}`} />
          </div>
          <span
            className={[
              "mt-2 text-xs font-medium",
              isDone ? "text-emerald-600" : "",
              isActive ? "text-emerald-700" : "",
              step.status === "inactive" ? "text-muted-foreground" : "",
            ].join(" ")}
          >
            {step.label}
          </span>
        </div>
      );
    })}
  </div>
);

export default function ConsultingNeedPage() {
  const { account, accessToken } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const form = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationSchema),
    mode: "onChange",
    defaultValues: {
      position: "",
      industry: "",
      budgetAmount: 0,
      budgetUnit: "VND/tháng",
      notes: "",
    },
  });

  const heroImage = useMemo(
    () => PlaceHolderImages.find((image) => image.id === "job-hero"),
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (localStorage.getItem("jobhub_consulting_submitted") === "true") {
      router.replace("/employer/dashboard/pending-approval");
    }
  }, [router]);

  const handleSubmit = async (values: ConsultationFormValues) => {
    if (!accessToken || isSubmittingRef.current || isSubmitting) {
      return;
    }
    if (typeof window !== "undefined") {
      const alreadySubmitted = localStorage.getItem("jobhub_consulting_submitted") === "true";
      if (alreadySubmitted) {
        router.replace("/employer/dashboard/pending-approval");
        return;
      }
    }
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      await apiRequest("/api/recruiters/consultations", {
        method: "POST",
        accessToken,
        body: {
          hiringPosition: values.position,
          industry: values.industry,
          budget: values.budgetAmount,
          currency: values.budgetUnit,
          notes: values.notes,
        },
      });

      localStorage.setItem("jobhub_consulting_submitted", "true");
      toast({
        title: "Gửi nhu cầu tư vấn thành công",
        description: "Chúng tôi sẽ sớm liên hệ để hỗ trợ bạn.",
      });
      router.push("/employer/dashboard/pending-approval");
    } catch (error) {
      const apiError = error as ApiError;
      const isAlreadySubmitted =
        apiError.code === 409 ||
        apiError.code === 501 ||
        apiError.status === "UNCATEGORIZED_EXCEPTION" ||
        apiError.status === "CONFLICT" ||
        apiError.message.toLowerCase().includes("already");

      if (isAlreadySubmitted) {
        localStorage.setItem("jobhub_consulting_submitted", "true");
        router.replace("/employer/dashboard/pending-approval");
        return;
      }

      toast({
        variant: "destructive",
        title: "Gửi nhu cầu tư vấn thất bại",
        description: apiError.message || "Vui lòng thử lại.",
      });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const displayName = account?.email?.split("@")[0] || "JobHub";

  return (
    <main className="flex min-h-[calc(100vh-113px)] flex-col items-center justify-center gap-6 p-4 md:gap-10 md:p-8">
      <div className="w-full max-w-6xl">
        <Card className="overflow-hidden">
          <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
            <div className="p-6 md:p-10">
              <div className="space-y-2">
                <p className="text-lg font-semibold text-muted-foreground">Chào mừng {displayName}</p>
                <h1 className="text-2xl font-semibold text-emerald-600">Đến với JobHub Recruitment</h1>
                <p className="text-sm text-muted-foreground">
                  Vui lòng điền các thông tin tuyển dụng bên dưới để chúng tôi hỗ trợ bạn tốt hơn.
                </p>
              </div>

              <div className="mt-6">
                <StepIndicator
                  steps={[
                    { label: "Thông tin nhà tuyển dụng", status: "done" },
                    { label: "Nhu cầu tư vấn", status: "active" },
                    { label: "Chờ phê duyệt", status: "inactive" },
                  ]}
                />
              </div>

              <div className="mt-8">
                <CardHeader className="px-0 pb-4">
                  <CardTitle>Nhu cầu tư vấn</CardTitle>
                  <CardDescription>Hãy giúp chúng tôi hiểu nhu cầu tuyển dụng của bạn.</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bạn đang tuyển dụng vị trí nào? *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn vị trí tuyển dụng" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CONSULTING_POSITIONS.map((position) => (
                                  <SelectItem key={position} value={position}>
                                    {position}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lĩnh vực *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn lĩnh vực hoạt động" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CONSULTING_INDUSTRIES.map((industry) => (
                                  <SelectItem key={industry} value={industry}>
                                    {industry}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="budgetAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ngân sách tuyển dụng cho vị trí này của bạn là? *</FormLabel>
                            <div className="grid gap-3 md:grid-cols-[1fr,200px]">
                              <FormControl>
                                <Input type="number" min={0} {...field} />
                              </FormControl>
                              <FormField
                                control={form.control}
                                name="budgetUnit"
                                render={({ field: unitField }) => (
                                  <FormItem>
                                    <Select onValueChange={unitField.onChange} value={unitField.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Đơn vị" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {CONSULTING_BUDGET_UNITS.map((unit) => (
                                          <SelectItem key={unit} value={unit}>
                                            {unit}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ghi chú tuyển dụng (không bắt buộc)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ví dụ: Cần tuyển gấp trong 1 tháng, ưu tiên kinh nghiệm Spring Cloud/AWS."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="ml-auto flex items-center gap-2"
                        disabled={isSubmitting || !form.formState.isValid}
                      >
                        {isSubmitting ? "Đang gửi..." : "Hoàn thành"}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </div>
            </div>

            <div className="relative hidden bg-emerald-600/10 lg:block">
              {heroImage && (
                <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  fill
                  className="object-cover"
                  data-ai-hint={heroImage.imageHint}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/30 via-emerald-600/10 to-transparent" />
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
