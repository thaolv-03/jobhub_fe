

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileDown, Filter } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import React from "react";


const applicantsData = [
    { id: "1", name: "Nguyễn Văn A", email: "nguyenvana@email.com", status: "Mới", appliedDate: "20/07/2024", cv: "/cv.pdf" },
    { id: "2", name: "Trần Thị B", email: "tranthib@email.com", status: "Đang xem", appliedDate: "21/07/2024", cv: "/cv.pdf" },
    { id: "3", name: "Lê Văn C", email: "levanc@email.com", status: "Phù hợp", appliedDate: "19/07/2024", cv: "/cv.pdf" },
    { id: "4", name: "Phạm Thị D", email: "phamthid@email.com", status: "Đã phỏng vấn", appliedDate: "18/07/2024", cv: "/cv.pdf" },
    { id: "5", name: "Hoàng Văn E", email: "hoangvane@email.com", status: "Từ chối", appliedDate: "17/07/2024", cv: "/cv.pdf" },
];

const jobTitle = "Kỹ sư phần mềm (ReactJS, NodeJS)";

export default function ApplicantsPage({ params }: { params: { id: string } }) {
    const { toast } = useToast();
    const [applicants, setApplicants] = React.useState(applicantsData);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "Mới": return "default";
            case "Phù hợp": return "secondary";
            case "Đã phỏng vấn": return "outline";
            case "Từ chối": return "destructive";
            default: return "secondary";
        }
    }

    const handleAction = (applicantName: string, action: string) => {
        toast({
            title: `Đã ${action.toLowerCase()} ứng viên ${applicantName}.`,
            description: "Đây là một hành động giả lập và chưa có tác dụng thực tế.",
        });
    };

    const handleStatusChange = (applicantId: string, newStatus: string) => {
        setApplicants(prev => prev.map(app => app.id === applicantId ? { ...app, status: newStatus } : app));
        toast({
            title: "Cập nhật thành công!",
            description: `Trạng thái của ứng viên đã được đổi thành "${newStatus}".`,
        });
    };


    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                        <Link href="/employer/dashboard">Dashboard</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Ứng viên cho vị trí "{jobTitle}"</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <Card>
                <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-2">
                        <CardTitle>Danh sách ứng viên</CardTitle>
                        <CardDescription>
                            Tổng cộng có {applicants.length} ứng viên đã nộp hồ sơ.
                        </CardDescription>
                    </div>
                     <div className="ml-auto flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 gap-1">
                                    <Filter className="h-3.5 w-3.5" />
                                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                        Lọc
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Lọc theo trạng thái</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem checked>Mới</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem>Đang xem</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem>Phù hợp</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem>Đã phỏng vấn</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem>Từ chối</DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button size="sm" variant="outline" className="h-8 gap-1">
                            <FileDown className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Xuất file
                            </span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tên ứng viên</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-center">Trạng thái</TableHead>
                                <TableHead>Ngày nộp</TableHead>
                                <TableHead className="text-right">Hành động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {applicants.map(applicant => (
                                <TableRow key={applicant.id}>
                                    <TableCell className="font-medium">{applicant.name}</TableCell>
                                    <TableCell>{applicant.email}</TableCell>
                                    <TableCell className="text-center">
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="w-28 justify-center">
                                                     <Badge variant={getStatusVariant(applicant.status) as any}>{applicant.status}</Badge>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuLabel>Đổi trạng thái</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleStatusChange(applicant.id, "Mới")}>Mới</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(applicant.id, "Đang xem")}>Đang xem</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(applicant.id, "Phù hợp")}>Phù hợp</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(applicant.id, "Đã phỏng vấn")}>Đã phỏng vấn</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(applicant.id, "Từ chối")} className="text-red-500">Từ chối</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    <TableCell>{applicant.appliedDate}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => handleAction(applicant.name, 'Xem CV')}>Xem CV</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleAction(applicant.name, 'Mời phỏng vấn')}>Mời phỏng vấn</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleAction(applicant.name, 'Đánh dấu "Phù hợp"')}>Đánh dấu "Phù hợp"</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleAction(applicant.name, 'Từ chối')} className="text-red-500">Từ chối</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </main>
    );
}
