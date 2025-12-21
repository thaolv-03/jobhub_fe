
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Building, MapPin, DollarSign, BookmarkX, Bookmark } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';

const initialSavedJobs = [
  { id: "4", title: "Product Manager", company: "MoMo", location: "TP. Hồ Chí Minh", salary: "Cạnh tranh", logoId: "company-logo-momo" },
  { id: "5", title: "Kỹ sư DevOps", company: "Tiki", location: "Hà Nội", salary: "Trên $2000", logoId: "company-logo-tiki" },
  { id: "1", title: "Kỹ sư phần mềm (ReactJS, NodeJS)", company: "FPT Software", location: "Hà Nội", salary: "Thỏa thuận", logoId: "company-logo-fpt" },
];


export default function SavedJobsPage() {
    const [savedJobs, setSavedJobs] = React.useState(initialSavedJobs);
    const { toast } = useToast();

    const handleUnsave = (jobId: string, jobTitle: string) => {
        setSavedJobs(prev => prev.filter(job => job.id !== jobId));
        toast({
            title: "Đã bỏ lưu việc làm",
            description: `Bạn đã bỏ lưu công việc "${jobTitle}".`,
        });
    };

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Việc làm đã lưu</CardTitle>
                    <CardDescription>
                        {savedJobs.length > 0 
                            ? `Bạn có ${savedJobs.length} việc làm đã lưu. Đừng bỏ lỡ cơ hội ứng tuyển!`
                            : 'Bạn chưa lưu công việc nào.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {savedJobs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {savedJobs.map(job => {
                                const logo = PlaceHolderImages.find(p => p.id === job.logoId);
                                return (
                                <Card key={job.id} className="flex flex-col">
                                    <CardHeader className="flex flex-row items-start gap-4">
                                        {logo && <Image src={logo.imageUrl} alt={`${job.company} logo`} width={48} height={48} className="rounded-md" data-ai-hint={logo.imageHint} />}
                                        <div>
                                            <CardTitle className="text-lg mb-1 leading-tight">{job.title}</CardTitle>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1"><Building className="w-4 h-4" /> {job.company}</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-2 text-sm">
                                        <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" /> {job.location}</p>
                                        <p className="flex items-center gap-2 text-muted-foreground"><DollarSign className="w-4 h-4" /> {job.salary}</p>
                                    </CardContent>
                                    <CardFooter className="flex gap-2">
                                        <Button asChild className="flex-1">
                                            <Link href={`/jobs/${job.id}`}>Ứng tuyển</Link>
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={() => handleUnsave(job.id, job.title)}>
                                            <BookmarkX className="h-5 w-5" />
                                            <span className="sr-only">Bỏ lưu</span>
                                        </Button>
                                    </CardFooter>
                                </Card>
                                )
                            })}
                        </div>
                    ) : (
                         <div className="text-center py-16 border-2 border-dashed rounded-lg">
                            <Bookmark className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">Chưa có việc làm nào được lưu</h3>
                            <p className="mt-2 text-sm text-muted-foreground">Lưu lại các công việc bạn quan tâm để xem lại sau.</p>
                            <Button asChild className="mt-6">
                                <Link href="/jobs">Khám phá việc làm</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
