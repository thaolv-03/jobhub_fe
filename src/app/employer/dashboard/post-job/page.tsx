
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, X } from "lucide-react";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

const jobSchema = z.object({
    title: z.string().min(1, { message: "Tiêu đề không được để trống." }),
    location: z.string({ required_error: "Vui lòng chọn địa điểm." }),
    min_salary: z.coerce.number().min(0, "Mức lương không hợp lệ.").optional(),
    max_salary: z.coerce.number().min(0, "Mức lương không hợp lệ.").optional(),
    job_type: z.string({ required_error: "Vui lòng chọn loại hình công việc." }),
    deadline: z.date().optional(),
    description: z.string().min(20, { message: "Mô tả công việc cần ít nhất 20 ký tự." }),
    skills: z.array(z.string()).min(1, { message: "Yêu cầu ít nhất một kỹ năng." }),
});

export default function PostJobPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [skillInput, setSkillInput] = React.useState("");

    const form = useForm<z.infer<typeof jobSchema>>({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            title: "",
            location: undefined,
            min_salary: 0,
            max_salary: 0,
            job_type: undefined,
            deadline: undefined,
            description: "",
            skills: [],
        },
    });

    const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && skillInput.trim()) {
            e.preventDefault();
            const newSkill = skillInput.trim();
            const currentSkills = form.getValues("skills");
            if (!currentSkills.includes(newSkill)) {
                form.setValue("skills", [...currentSkills, newSkill]);
                setSkillInput("");
            }
        }
    };

    const removeSkill = (index: number) => {
        const currentSkills = form.getValues("skills");
        currentSkills.splice(index, 1);
        form.setValue("skills", currentSkills);
    };

    const handleJobSubmit = (values: z.infer<typeof jobSchema>) => {
        console.log("Đăng tin tuyển dụng với:", values);
        toast({
            title: "Đăng tin thành công!",
            description: `Tin tuyển dụng cho vị trí "${values.title}" đã được đăng.`,
        });
        form.reset();
        router.push("/employer/dashboard");
    };

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="max-w-4xl mx-auto w-full">
                <Card>
                    <CardHeader>
                        <CardTitle>Đăng tin tuyển dụng mới</CardTitle>
                        <CardDescription>Điền các thông tin chi tiết về vị trí bạn muốn tuyển dụng.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleJobSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tiêu đề công việc</FormLabel>
                                            <FormControl><Input placeholder="Ví dụ: Kỹ sư phần mềm (ReactJS, NodeJS)" {...field} /></FormControl>
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
                                                <FormLabel>Địa điểm</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Chọn thành phố" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="hanoi">Hà Nội</SelectItem>
                                                        <SelectItem value="danang">Đà Nẵng</SelectItem>
                                                        <SelectItem value="hcm">TP. Hồ Chí Minh</SelectItem>
                                                        <SelectItem value="remote">Từ xa</SelectItem>
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
                                                <FormLabel>Loại hình công việc</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Chọn loại hình" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Full-time">Toàn thời gian</SelectItem>
                                                        <SelectItem value="Part-time">Bán thời gian</SelectItem>
                                                        <SelectItem value="Contract">Hợp đồng</SelectItem>
                                                        <SelectItem value="Internship">Thực tập</SelectItem>
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
                                                <FormLabel>Lương tối thiểu (triệu VND)</FormLabel>
                                                <FormControl><Input type="number" placeholder="Ví dụ: 20" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="max_salary"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Lương tối đa (triệu VND)</FormLabel>
                                                <FormControl><Input type="number" placeholder="Ví dụ: 50" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="deadline"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                            <FormLabel>Hạn nộp hồ sơ</FormLabel>
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
                                                        <span>Chọn ngày</span>
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
                                            <FormLabel>Mô tả công việc</FormLabel>
                                            <FormControl><Textarea className="min-h-32" placeholder="Mô tả chi tiết về công việc, trách nhiệm, yêu cầu..." {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="skills"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>Kỹ năng yêu cầu</FormLabel>
                                                <div className="flex flex-wrap gap-2">
                                                    {form.getValues("skills").map((skill, index) => (
                                                        <Badge key={index} variant="secondary" className="text-base">
                                                            {skill}
                                                            <button type="button" onClick={() => removeSkill(index)} className="ml-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <FormControl>
                                                     <Input 
                                                        placeholder="Thêm kỹ năng và nhấn Enter..." 
                                                        value={skillInput}
                                                        onChange={(e) => setSkillInput(e.target.value)}
                                                        onKeyDown={addSkill}
                                                    />
                                                </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => router.back()}>Hủy</Button>
                                    <Button type="submit">Đăng tin</Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

    