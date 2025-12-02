
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, X } from "lucide-react";
import React from "react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
    name: z.string().min(1, { message: "Họ và tên không được để trống." }),
    email: z.string().email({ message: "Email không hợp lệ." }),
    phone: z.string().optional(),
    address: z.string().optional(),
    bio: z.string().optional(),
    skills: z.string().optional(),
});

const initialUser = {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "0987654321",
    address: "123 Đường ABC, Quận 1, TP. Hồ Chí Minh",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    skills: "ReactJS, NodeJS, TypeScript, Next.js",
    bio: "Full-stack developer with over 5 years of experience in building modern web applications. Passionate about creating clean, efficient, and user-friendly solutions."
};

const appliedJobs = [
  { id: 1, title: "Kỹ sư phần mềm (ReactJS, NodeJS)", company: "FPT Software", status: "Đang chờ", appliedDate: "20/07/2024" },
  { id: 2, title: "UI/UX Designer", company: "VNG Corporation", status: "Đã xem", appliedDate: "18/07/2024" },
  { id: 3, title: "Chuyên viên phân tích dữ liệu", company: "Viettel", status: "Từ chối", appliedDate: "15/07/2024" },
];

const recommendedJobs = [
    { id: 4, title: "Product Manager", company: "MoMo", location: "TP. Hồ Chí Minh", salary: "Cạnh tranh", logoId: "company-logo-momo" },
    { id: 5, title: "Kỹ sư DevOps", company: "Tiki", location: "Hà Nội", salary: "Trên $2000", logoId: "company-logo-tiki" },
];

export default function CandidateDashboardPage() {
    const { toast } = useToast();
    const [uploadedCvs, setUploadedCvs] = React.useState(["Fullstack_Developer_CV.pdf"]);
    const [avatar, setAvatar] = React.useState(initialUser.avatar);

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: initialUser.name,
            email: initialUser.email,
            phone: initialUser.phone,
            address: initialUser.address,
            bio: initialUser.bio,
            skills: initialUser.skills,
        },
    });
    
    const skillsArray = form.watch('skills')?.split(',').map(s => s.trim()).filter(Boolean) || [];


    const handleProfileSubmit = (values: z.infer<typeof profileSchema>) => {
        console.log("Updating profile with:", values);
        toast({
            title: "Cập nhật thành công!",
            description: "Thông tin cá nhân của bạn đã được lưu.",
        });
    };
    
    const handleCvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                toast({ title: "Lỗi", description: "Vui lòng chỉ tải lên file PDF.", variant: "destructive" });
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB
                 toast({ title: "Lỗi", description: "Kích thước file không được vượt quá 5MB.", variant: "destructive" });
                return;
            }
            if (uploadedCvs.includes(file.name)) {
                toast({ title: "Lỗi", description: "Tên file đã tồn tại. Vui lòng đổi tên và thử lại.", variant: "destructive" });
                return;
            }

            setUploadedCvs(prev => [...prev, file.name]);
            toast({ title: "Thành công", description: `Đã tải lên CV: ${file.name}` });
        }
    };

    const removeCv = (cvName: string) => {
        setUploadedCvs(uploadedCvs.filter(cv => cv !== cvName));
        toast({ title: "Đã xóa CV.", description: `${cvName} đã được xóa.`, variant: "destructive" });
    };

     const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
                toast({ title: "Thành công", description: "Ảnh đại diện đã được thay đổi." });
            };
            reader.readAsDataURL(file);
        }
    };
    
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 grid auto-rows-max items-start gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Thông tin cá nhân</CardTitle>
                                <CardDescription>Cập nhật thông tin và ảnh đại diện của bạn.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-20 w-20">
                                                <AvatarImage src={avatar} alt="Avatar" />
                                                <AvatarFallback>JD</AvatarFallback>
                                            </Avatar>
                                            <Button asChild variant="outline">
                                                <Label htmlFor="avatar-upload">
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Thay đổi ảnh
                                                    <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                                </Label>
                                            </Button>
                                        </div>
                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Họ và tên</FormLabel>
                                                        <FormControl><Input {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Email</FormLabel>
                                                        <FormControl><Input type="email" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                             <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Số điện thoại</FormLabel>
                                                        <FormControl><Input {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="address"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Địa chỉ</FormLabel>
                                                        <FormControl><Input {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="bio"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Giới thiệu bản thân</FormLabel>
                                                    <FormControl><Textarea className="min-h-24" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                       <FormField
                                            control={form.control}
                                            name="skills"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Kỹ năng</FormLabel>
                                                    <FormControl>
                                                        <Textarea 
                                                            placeholder="Nhập các kỹ năng, cách nhau bằng dấu phẩy..." 
                                                            className="min-h-24"
                                                            {...field} 
                                                        />
                                                    </FormControl>
                                                     <div className="flex flex-wrap gap-2 pt-2">
                                                        {skillsArray.map(skill => (
                                                            <Badge key={skill} variant="secondary" className="text-base">
                                                                {skill}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit">Lưu thay đổi</Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Việc làm đã ứng tuyển</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-800">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vị trí</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Công ty</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày nộp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                            {appliedJobs.map(job => (
                                                <tr key={job.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{job.title}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{job.company}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <Badge variant={job.status === 'Từ chối' ? 'destructive' : 'secondary'}>{job.status}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{job.appliedDate}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Quản lý CV</CardTitle>
                                <CardDescription>Tải lên và quản lý các CV của bạn.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                               <div className="flex items-center justify-center w-full">
                                    <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Nhấn để tải lên</span> hoặc kéo thả</p>
                                            <p className="text-xs text-muted-foreground">PDF (Tối đa 5MB)</p>
                                        </div>
                                        <Input id="dropzone-file" type="file" className="hidden" accept=".pdf" onChange={handleCvUpload} />
                                    </Label>
                                </div>
                                <div className="space-y-2">
                                    <p className="font-medium">CV đã tải lên:</p>
                                    {uploadedCvs.length > 0 ? (
                                        uploadedCvs.map(cv => (
                                        <div key={cv} className="flex items-center justify-between rounded-lg border bg-background p-3">
                                            <p className="text-sm font-medium truncate pr-2">{cv}</p>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeCv(cv)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">Chưa có CV nào được tải lên.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Gợi ý cho bạn</CardTitle>
                                <CardDescription>Các công việc phù hợp với kỹ năng của bạn.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                {recommendedJobs.map(job => {
                                     const logo = PlaceHolderImages.find(p => p.id === job.logoId);
                                     return (
                                        <div key={job.id} className="flex items-start gap-4">
                                            {logo && <Image src={logo.imageUrl} alt={`${job.company} logo`} width={48} height={48} className="rounded-lg" data-ai-hint={logo.imageHint} />}
                                            <div className="grid gap-1">
                                                <p className="text-sm font-medium leading-none">{job.title}</p>
                                                <p className="text-sm text-muted-foreground">{job.company}</p>
                                            </div>
                                            <Button variant="outline" size="sm" className="ml-auto">Xem</Button>
                                        </div>
                                     )
                                })}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

    