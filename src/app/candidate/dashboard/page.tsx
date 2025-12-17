
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload } from "lucide-react";
import React from "react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

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


const recommendedJobs = [
    { id: 4, title: "Product Manager", company: "MoMo", location: "TP. Hồ Chí Minh", salary: "Cạnh tranh", logoId: "company-logo-momo" },
    { id: 5, title: "Kỹ sư DevOps", company: "Tiki", location: "Hà Nội", salary: "Trên $2000", logoId: "company-logo-tiki" },
];

export default function CandidateDashboardPage() {
    const { toast } = useToast();
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
                <div className="grid gap-4 md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-2 grid auto-rows-max items-start gap-4">
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
                    </div>
                    <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                         <Card>
                            <CardHeader>
                                <CardTitle>Gợi ý cho bạn</CardTitle>
                                <CardDescription>Các công việc phù hợp với kỹ năng của bạn.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                {recommendedJobs.map(job => {
                                     const logo = PlaceHolderImages.find(p => p.id === job.logoId);
                                     return (
                                        <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-start gap-4 group">
                                            {logo && <Image src={logo.imageUrl} alt={`${job.company} logo`} width={48} height={48} className="rounded-lg" data-ai-hint={logo.imageHint} />}
                                            <div className="grid gap-1">
                                                <p className="text-sm font-medium leading-none group-hover:text-primary">{job.title}</p>
                                                <p className="text-sm text-muted-foreground">{job.company}</p>
                                            </div>
                                            <Button variant="outline" size="sm" className="ml-auto opacity-0 group-hover:opacity-100">Xem</Button>
                                        </Link>
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
