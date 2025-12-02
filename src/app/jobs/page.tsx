
'use client';

import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Building, MapPin, DollarSign, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";


const jobs = [
  { id: "1", title: "Kỹ sư phần mềm (ReactJS, NodeJS)", company: "FPT Software", location: "Hà Nội", salary: "Thỏa thuận", logoId: "company-logo-fpt" },
  { id: "2", title: "Chuyên viên phân tích dữ liệu", company: "Viettel", location: "Đà Nẵng", salary: "$1500 - $2500", logoId: "company-logo-viettel" },
  { id: "3", title: "UI/UX Designer", company: "VNG Corporation", location: "TP. Hồ Chí Minh", salary: "Đến 30 triệu", logoId: "company-logo-vng" },
  { id: "4", title: "Product Manager", company: "MoMo", location: "TP. Hồ Chí Minh", salary: "Cạnh tranh", logoId: "company-logo-momo" },
  { id: "5", title: "Kỹ sư DevOps", company: "Tiki", location: "Hà Nội", salary: "Trên $2000", logoId: "company-logo-tiki" },
  { id: "6", title: "Marketing Executive", company: "Shopee", location: "TP. Hồ Chí Minh", salary: "15 - 25 triệu", logoId: "company-logo-shopee" },
];

export default function JobsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <div className="container grid lg:grid-cols-4 gap-8 py-8">
          {/* Filters */}
          <aside className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Bộ lọc</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative">
                  <Input placeholder="Tìm kiếm việc làm..."/>
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                </div>

                <Accordion type="multiple" defaultValue={['location', 'salary']} className="w-full">
                  <AccordionItem value="location">
                    <AccordionTrigger>Địa điểm</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="loc-hanoi" />
                        <Label htmlFor="loc-hanoi">Hà Nội</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="loc-danang" />
                        <Label htmlFor="loc-danang">Đà Nẵng</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="loc-hcm" />
                        <Label htmlFor="loc-hcm">TP. Hồ Chí Minh</Label>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="salary">
                    <AccordionTrigger>Mức lương</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="sal-all" />
                        <Label htmlFor="sal-all">Tất cả</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="sal-1" />
                        <Label htmlFor="sal-1">Dưới 10 triệu</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="sal-2" />
                        <Label htmlFor="sal-2">10 - 20 triệu</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="sal-3" />
                        <Label htmlFor="sal-3">Trên 20 triệu</Label>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="type">
                    <AccordionTrigger>Loại hình</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="type-fulltime" />
                        <Label htmlFor="type-fulltime">Toàn thời gian</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="type-parttime" />
                        <Label htmlFor="type-parttime">Bán thời gian</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="type-remote" />
                        <Label htmlFor="type-remote">Từ xa</Label>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </aside>

          {/* Jobs List */}
          <main className="lg:col-span-3">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Danh sách việc làm</h2>
                  <Select>
                      <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Sắp xếp theo" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="newest">Mới nhất</SelectItem>
                          <SelectItem value="salary-desc">Lương giảm dần</SelectItem>
                          <SelectItem value="salary-asc">Lương tăng dần</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
            <div className="space-y-6">
              {jobs.map(job => {
                const logo = PlaceHolderImages.find(p => p.id === job.logoId);
                return (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="grid grid-cols-[auto_1fr_auto] items-start gap-4">
                      {logo && <Image src={logo.imageUrl} alt={`${job.company} logo`} width={64} height={64} className="rounded-lg" data-ai-hint={logo.imageHint} />}
                      <div className="space-y-1">
                        <CardTitle>{job.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2"><Building className="w-4 h-4"/>{job.company}</CardDescription>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1 text-sm text-muted-foreground">
                          <p className="flex items-center gap-1"><MapPin className="w-4 h-4"/>{job.location}</p>
                          <p className="flex items-center gap-1"><DollarSign className="w-4 h-4"/>{job.salary}</p>
                        </div>
                      </div>
                      <Link href={`/jobs/${job.id}`} passHref>
                          <Button variant="secondary">Xem chi tiết</Button>
                      </Link>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
            <Pagination className="mt-8">
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
          </main>
        </div>
      </main>
    </div>
  );
}
