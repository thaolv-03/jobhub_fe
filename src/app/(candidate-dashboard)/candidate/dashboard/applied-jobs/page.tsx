
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSearch } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const appliedJobsData = [
  { id: 1, jobId: "1", title: "Kỹ sư phần mềm (ReactJS, NodeJS)", company: "FPT Software", status: "Đang chờ", appliedDate: "20/07/2024" },
  { id: 2, jobId: "3", title: "UI/UX Designer", company: "VNG Corporation", status: "Đã xem", appliedDate: "18/07/2024" },
  { id: 3, jobId: "2", title: "Chuyên viên phân tích dữ liệu", company: "Viettel", status: "Từ chối", appliedDate: "15/07/2024" },
  { id: 4, jobId: "5", title: "Kỹ sư DevOps", company: "Tiki", status: "Đang chờ", appliedDate: "12/07/2024" },
];

export default function AppliedJobsPage() {

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Đang chờ': return 'default';
            case 'Đã xem': return 'secondary';
            case 'Từ chối': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Việc làm đã ứng tuyển</CardTitle>
                    <CardDescription>Theo dõi trạng thái các hồ sơ ứng tuyển của bạn.</CardDescription>
                </CardHeader>
                <CardContent>
                    {appliedJobsData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vị trí</TableHead>
                                        <TableHead>Công ty</TableHead>
                                        <TableHead className="text-center">Ngày nộp</TableHead>
                                        <TableHead className="text-center">Trạng thái</TableHead>
                                        <TableHead className="text-right">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {appliedJobsData.map(job => (
                                        <TableRow key={job.id}>
                                            <TableCell className="font-medium">{job.title}</TableCell>
                                            <TableCell className="text-muted-foreground">{job.company}</TableCell>
                                            <TableCell className="text-center text-muted-foreground">{job.appliedDate}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={getStatusVariant(job.status) as any}>{job.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/jobs/${job.jobId}`}>Xem tin</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed rounded-lg">
                            <FileSearch className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">Chưa ứng tuyển công việc nào</h3>
                            <p className="mt-2 text-sm text-muted-foreground">Hãy bắt đầu tìm kiếm và ứng tuyển những công việc mơ ước của bạn!</p>
                            <Button asChild className="mt-6">
                                <Link href="/jobs">Tìm việc ngay</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
