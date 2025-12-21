'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";

const jobSchema = z.object({
    title: z.string().min(1, { message: "Tieu de khong duoc de trong." }),
    location: z.string({ required_error: "Vui long chon dia diem." }),
    min_salary: z.coerce.number().min(0, "Muc luong khong hop le.").optional(),
    max_salary: z.coerce.number().min(0, "Muc luong khong hop le.").optional(),
    job_type: z.string({ required_error: "Vui long chon loai hinh cong viec." }),
    deadline: z.date().optional(),
    description: z.string().min(20, { message: "Mo ta cong viec can it nhat 20 ky tu." }),
});

type JobFormValues = z.infer<typeof jobSchema>;

export default function PostJobPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { accessToken } = useAuth();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<JobFormValues>({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            title: "",
            location: undefined,
            min_salary: 0,
            max_salary: 0,
            job_type: undefined,
            deadline: undefined,
            description: "",
        },
    });

    const handleJobSubmit = async (values: JobFormValues) => {
        if (!accessToken || isSubmitting) {
            return;
        }
        setIsSubmitting(true);
        try {
            const deadline = values.deadline
                ? values.deadline.toISOString().split('T')[0]
                : undefined;

            await apiRequest('/api/jobs', {
                method: 'POST',
                accessToken,
                body: {
                    title: values.title,
                    description: values.description,
                    location: values.location,
                    minSalary: values.min_salary,
                    maxSalary: values.max_salary,
                    jobType: values.job_type,
                    deadline,
                },
            });

            toast({
                title: "Dang tin thanh cong!",
                description: `Tin tuyen dung cho vi tri \"${values.title}\" da duoc dang.`,
            });
            form.reset();
            router.push("/employer/dashboard/jobs");
        } catch (error) {
            const apiError = error as ApiError;
            toast({
                variant: "destructive",
                title: "Dang tin that bai",
                description: apiError.message || "Co loi xay ra. Vui long thu lai.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="max-w-4xl mx-auto w-full">
                <Card>
                    <CardHeader>
                        <CardTitle>Dang tin tuyen dung moi</CardTitle>
                        <CardDescription>Dien cac thong tin chi tiet ve vi tri ban muon tuyen dung.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleJobSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tieu de cong viec</FormLabel>
                                            <FormControl><Input placeholder="Vi du: Ky su phan mem (ReactJS, NodeJS)" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Dia diem</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Chon thanh pho" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Ha Noi">Ha Noi</SelectItem>
                                                        <SelectItem value="Da Nang">Da Nang</SelectItem>
                                                        <SelectItem value="TP HCM">TP HCM</SelectItem>
                                                        <SelectItem value="Remote">Remote</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="job_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Loai hinh cong viec</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Chon loai hinh" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Full-time">Toan thoi gian</SelectItem>
                                                        <SelectItem value="Part-time">Ban thoi gian</SelectItem>
                                                        <SelectItem value="Contract">Hop dong</SelectItem>
                                                        <SelectItem value="Internship">Thuc tap</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="min_salary"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Luong toi thieu (trieu VND)</FormLabel>
                                                <FormControl><Input type="number" placeholder="Vi du: 20" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="max_salary"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Luong toi da (trieu VND)</FormLabel>
                                                <FormControl><Input type="number" placeholder="Vi du: 50" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="deadline"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                            <FormLabel>Han nop ho so</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                    >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Chon ngay</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date() || date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                 <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mo ta cong viec</FormLabel>
                                            <FormControl><Textarea className="min-h-32" placeholder="Mo ta chi tiet ve cong viec, trach nhiem, yeu cau..." {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => router.back()}>Huy</Button>
                                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Dang dang..." : "Dang tin"}</Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
