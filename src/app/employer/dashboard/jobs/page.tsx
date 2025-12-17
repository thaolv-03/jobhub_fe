
'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Users, FilePlus } from "lucide-react";
import Link from "next/link";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination"
import { useToast } from '@/hooks/use-toast';

const initialPostedJobs = [
    { id: "1", title: "Kỹ sư phần mềm (ReactJS, NodeJS)", applicants: 25, status: "Đang mở", createdDate: "15/07/2024" },
    { id: "2", title: "UI/UX Designer", applicants: 10, status: "Đang mở", createdDate: "12/07/2024" },
    { id: "3", title: "Chuyên viên phân tích dữ liệu", applicants: 15, status: "Đã đóng", createdDate: "10/07/2024" },
    { id: "4", title: "Product Manager", applicants: 5, status: "Đang phỏng vấn", createdDate: "05/07/2024" },
    { id: "5", title: "Kỹ sư DevOps", applicants: 8, status: "Đã đóng", createdDate: "01/07/2024" },
];

export default function EmployerJobsPage() {
    const [postedJobs, setPostedJobs] = React.useState(initialPostedJobs);
    const { toast } = useToast();

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "Đang mở": return "secondary";
            case "Đã đóng": return "destructive";
            case "Đang phỏng vấn": return "default";
            default: return "outline";
        }
    }
    
    const handleCloseJob = (jobId: string, jobTitle: string) => {
        setPostedJobs(jobs => jobs.map(job => job.id === jobId ? {...job, status: 'Đã đóng'} : job));
        toast({
            title: "Đã đóng tin tuyển dụng",
            description: `Tin "${jobTitle}" đã được đóng.`,
        });
    }

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
             <Card>
                <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-2">
                        <CardTitle>Quản lý tin tuyển dụng</CardTitle>
                        <CardDescription>
                            Xem, sửa hoặc đóng các tin tuyển dụng của bạn.
                        </CardDescription>
                    </div>
                    <Button asChild size="sm" className="ml-auto gap-1">
                        <Link href="/employer/dashboard/post-job">
                            Đăng tin mới
                            <PlusCircle className="h-4 w-4" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                   {postedJobs.length > 0 ? (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Vị trí</TableHead>
                                    <TableHead className="text-center">Ngày đăng</TableHead>
                                    <TableHead className="text-center">Ứng viên</TableHead>
                                    <TableHead className="text-center">Trạng thái</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {postedJobs.map(job => (
                                    <TableRow key={job.id}>
                                        <TableCell className="font-medium">{job.title}</TableCell>
                                        <TableCell className="text-center text-muted-foreground">{job.createdDate}</TableCell>
                                        <TableCell className="text-center">
                                            <Link href={`/employer/dashboard/applicants/${job.id}`} className="text-primary hover:underline flex items-center justify-center gap-2">
                                                {job.applicants} <Users className="h-4 w-4"/>
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={getStatusVariant(job.status) as any}>{job.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem>Sửa</DropdownMenuItem>
                                                    <DropdownMenuItem asChild><Link href={`/employer/dashboard/applicants/${job.id}`}>Xem ứng viên</Link></DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleCloseJob(job.id, job.title)} 
                                                        disabled={job.status === 'Đã đóng'}
                                                        className="text-red-500"
                                                    >
                                                        Đóng tin
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         <Pagination className="mt-6">
                            <PaginationContent>
                                <PaginationItem>
                                <PaginationPrevious href="#" />
                                </PaginationItem>
                                <PaginationItem>
                                <PaginationLink href="#" isActive>1</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                <PaginationEllipsis />
                                </PaginationItem>
                                <PaginationItem>
                                <PaginationNext href="#" />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </>
                   ) : (
                     <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <FilePlus className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Chưa có tin tuyển dụng nào</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Hãy bắt đầu tạo tin tuyển dụng đầu tiên của bạn.</p>
                        <Button asChild className="mt-6">
                            <Link href="/employer/dashboard/post-job">Đăng tin ngay</Link>
                        </Button>
                    </div>
                   )}
                </CardContent>
            </Card>
        </main>
    );
}
