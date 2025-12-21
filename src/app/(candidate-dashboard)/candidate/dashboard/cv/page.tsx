
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileText } from 'lucide-react';

export default function ManageCvPage() {
    const { toast } = useToast();
    const [uploadedCvs, setUploadedCvs] = React.useState([
        "Fullstack_Developer_CV_2024.pdf",
        "Frontend_Engineer_Resume.pdf"
    ]);

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

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="max-w-4xl mx-auto w-full">
                <Card>
                    <CardHeader>
                        <CardTitle>Quản lý CV</CardTitle>
                        <CardDescription>Tải lên và quản lý các CV của bạn để sẵn sàng ứng tuyển.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="flex items-center justify-center w-full">
                            <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Nhấn để tải lên</span> hoặc kéo thả</p>
                                    <p className="text-xs text-muted-foreground">PDF (Tối đa 5MB)</p>
                                </div>
                                <Input id="dropzone-file" type="file" className="hidden" accept=".pdf" onChange={handleCvUpload} />
                            </Label>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-medium text-lg">CV đã tải lên</h3>
                            {uploadedCvs.length > 0 ? (
                                <ul className="space-y-3">
                                    {uploadedCvs.map(cv => (
                                        <li key={cv} className="flex items-center justify-between rounded-lg border bg-background p-4 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-6 w-6 text-primary" />
                                                <p className="text-sm font-medium truncate pr-2">{cv}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeCv(cv)}>
                                                <X className="h-4 w-4" />
                                                <span className="sr-only">Xóa CV</span>
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                    <p className="text-sm text-muted-foreground">Chưa có CV nào được tải lên.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
