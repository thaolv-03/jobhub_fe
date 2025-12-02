
'use client';

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Users, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const postedJobs = [
    { id: "1", title: "Kỹ sư phần mềm (ReactJS, NodeJS)", applicants: 25, status: "Đang mở" },
    { id: "2", title: "UI/UX Designer", applicants: 10, status: "Đang mở" },
    { id: "3", title: "Chuyên viên phân tích dữ liệu", applicants: 15, status: "Đã đóng" },
    { id: "4", title: "Product Manager", applicants: 5, status: "Đang phỏng vấn" },
];

const recentApplicants = [
    { name: "Nguyễn Văn A", job: "Kỹ sư phần mềm", applied: "2 giờ trước"},
    { name: "Trần Thị B", job: "UI/UX Designer", applied: "1 ngày trước"},
    { name: "Lê Văn C", job: "Kỹ sư phần mềm", applied: "3 ngày trước"},
]

export default function EmployerDashboardPage() {
    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Tổng tin đăng</CardDescription>
                                <CardTitle className="text-4xl">12</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-muted-foreground">
                                    +5 so với tháng trước
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Lượt ứng tuyển mới</CardDescription>
                                <CardTitle className="text-4xl">54</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-muted-foreground">
                                    +15% so với tuần trước
                                </div>
                            </CardContent>
                        </Card>
                    </div>
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
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vị trí</TableHead>
                                        <TableHead className="text-center">Ứng viên</TableHead>
                                        <TableHead className="text-center">Trạng thái</TableHead>
                                        <TableHead className="text-right">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {postedJobs.map(job => (
                                        <TableRow key={job.id}>
                                            <TableCell className="font-medium">{job.title}</TableCell>
                                            <TableCell className="text-center">
                                                <Link href={`/employer/dashboard/applicants/${job.id}`} className="text-blue-600 hover:underline flex items-center justify-center gap-2">
                                                    {job.applicants} <Users className="h-4 w-4"/>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={job.status === 'Đã đóng' ? 'destructive' : 'secondary'}>{job.status}</Badge>
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
                                                        <DropdownMenuItem className="text-red-500">Đóng</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                         <CardFooter>
                           <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                    <PaginationPrevious href="#" />
                                    </PaginationItem>
                                    <PaginationItem>
                                    <PaginationLink href="#" isActive>1</PaginationLink>
                                    </PaginationItem>
                                    <PaginationItem>
                                    <PaginationLink href="#">2</PaginationLink>
                                    </PaginationItem>
                                    <PaginationItem>
                                    <PaginationEllipsis />
                                    </PaginationItem>
                                    <PaginationItem>
                                    <PaginationNext href="#" />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </CardFooter>
                    </Card>
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle>Ứng viên gần đây</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-8">
                        {recentApplicants.map((applicant, index) => (
                             <div key={index} className="flex items-center gap-4">
                                <div className="grid gap-1">
                                    <p className="text-sm font-medium leading-none">{applicant.name}</p>
                                    <p className="text-sm text-muted-foreground">{applicant.job}</p>
                                </div>
                                <div className="ml-auto text-sm text-muted-foreground">{applicant.applied}</div>
                             </div>
                        ))}
                    </CardContent>
                    <CardFooter>
                         <Button asChild size="sm" className="w-full">
                            <Link href="#">
                                Xem tất cả ứng viên
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </main>
    );
}
