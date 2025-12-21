'use client';

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, MapPin, Briefcase, DollarSign, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { Container } from "@/components/layout/container";
import { BannerSlider } from "@/components/home/banner-slider";

const companyLogos = PlaceHolderImages.filter((p) => p.id.startsWith("company-logo"));

const featuredJobs = [
  {
    id: "1",
    title: "Kỹ sư phần mềm (ReactJS, NodeJS)",
    company: "FPT Software",
    location: "Hà Nội",
    salary: "Thỏa thuận",
    logoId: "company-logo-fpt",
  },
  {
    id: "2",
    title: "Chuyên viên phân tích dữ liệu",
    company: "Viettel",
    location: "Đà Nẵng",
    salary: "$1500 - $2500",
    logoId: "company-logo-viettel",
  },
  {
    id: "3",
    title: "UI/UX Designer",
    company: "VNG Corporation",
    location: "TP. Hồ Chí Minh",
    salary: "Đến 30 triệu",
    logoId: "company-logo-vng",
  },
  {
    id: "4",
    title: "Product Manager",
    company: "MoMo",
    location: "TP. Hồ Chí Minh",
    salary: "Cạnh tranh",
    logoId: "company-logo-momo",
  },
];

const locations = [
  { value: "all", label: "Tất cả địa điểm" },
  { value: "ha-noi", label: "Hà Nội" },
  { value: "tp-ho-chi-minh", label: "TP. Hồ Chí Minh" },
  { value: "da-nang", label: "Đà Nẵng" },
];

const categories = [
  { value: "all", label: "Ngành nghề" },
  { value: "it", label: "IT - Phần mềm" },
  { value: "design", label: "Thiết kế" },
  { value: "marketing", label: "Marketing" },
];

export default function Home() {
  const router = useRouter();
  const [keyword, setKeyword] = React.useState("");
  const [location, setLocation] = React.useState("all");
  const [category, setCategory] = React.useState("all");

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) {
      params.set("q", keyword.trim());
    }
    if (location && location !== "all") {
      params.set("location", location);
    }
    if (category && category !== "all") {
      params.set("category", category);
    }
    const queryString = params.toString();
    router.push(queryString ? `/jobs?${queryString}` : "/jobs");
  };

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <Container>
          <div className="py-16 md:py-24">
            <div className="space-y-8">
              <div className="space-y-6 max-w-3xl lg:max-w-4xl">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
                Tìm kiếm công việc mơ ước của bạn ngay hôm nay
              </h1>
              <p className="max-w-[640px] text-muted-foreground md:text-xl">
                JobHub là nơi tốt nhất để bạn tìm kiếm cơ hội nghề nghiệp tiếp theo. Khám phá hàng ngàn danh sách việc làm từ các công ty hàng đầu.
              </p>
              </div>
              <div className="pt-2">
                <form onSubmit={handleSearch} className="w-full">
                  <div className="w-full">
                  <div className="rounded-full border bg-background/95 p-2 shadow-lg">
                    <div className="flex flex-col gap-2 md:flex-row md:flex-nowrap md:items-center md:gap-4">
                      <div className="relative flex flex-1 items-center gap-2 px-4 py-2">
                        <Search className="h-5 w-5 text-primary" />
                        <Input
                          type="text"
                          value={keyword}
                          onChange={(event) => setKeyword(event.target.value)}
                          placeholder="Từ khóa, chức danh hoặc công ty"
                          className="min-h-[48px] flex-1 border-0 bg-transparent px-2.5 py-2 leading-6 shadow-none focus-visible:ring-0 md:px-0"
                        />
                      </div>
                      <div className="hidden h-6 w-px bg-border md:block" />
                      <div className="relative flex flex-1 items-center gap-2 px-4 py-2">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <Select value={location} onValueChange={setLocation}>
                          <SelectTrigger className="min-h-[48px] w-full min-w-[180px] border-0 bg-transparent px-2.5 py-2 leading-6 shadow-none focus:ring-0 focus-visible:ring-0 md:w-auto md:px-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="hidden h-6 w-px bg-border md:block" />
                      <div className="relative flex flex-1 items-center gap-2 px-4 py-2">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger className="min-h-[48px] w-full min-w-[170px] border-0 bg-transparent px-2.5 py-2 leading-6 shadow-none focus:ring-0 focus-visible:ring-0 md:w-auto md:px-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="h-12 w-full rounded-full px-8 text-sm font-semibold md:ml-auto md:w-auto md:shrink-0">
                        TÌM VIỆC
                      </Button>
                    </div>
                  </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Container>
      </section>
      <BannerSlider />

      <section className="py-16 md:py-20 bg-secondary/50">
        <Container>
          <h2 className="text-3xl font-bold text-center mb-10">Công việc nổi bật</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredJobs.map((job) => {
              const logo = PlaceHolderImages.find((p) => p.id === job.logoId);
              return (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-start gap-4">
                    {logo && (
                      <Image
                        src={logo.imageUrl}
                        alt={`${job.company} logo`}
                        width={48}
                        height={48}
                        className="rounded-md"
                        data-ai-hint={logo.imageHint}
                      />
                    )}
                    <div>
                      <CardTitle className="text-lg mb-1">{job.title}</CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building className="w-4 h-4" /> {job.company}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" /> {job.location}
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="w-4 h-4" /> {job.salary}
                    </p>
                    <div className="pt-2">
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" className="w-full">Xem chi tiết</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="text-center mt-12">
            <Link href="/jobs">
              <Button size="lg">Xem tất cả việc làm</Button>
            </Link>
          </div>
        </Container>
      </section>

      <section className="py-16 md:py-20">
        <Container>
          <h2 className="text-3xl font-bold text-center mb-10">Công ty hàng đầu</h2>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {companyLogos.map((logo) => (
              <div key={logo.id} className="grayscale hover:grayscale-0 transition-all">
                <Image
                  src={logo.imageUrl}
                  alt={logo.description}
                  width={130}
                  height={50}
                  className="object-contain"
                  data-ai-hint={logo.imageHint}
                />
              </div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
