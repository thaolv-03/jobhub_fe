import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Navbar } from "@/components/layout/navbar";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, Briefcase, DollarSign } from "lucide-react";
import Link from "next/link";

const heroImage = PlaceHolderImages.find(p => p.id === "job-hero");
const companyLogos = PlaceHolderImages.filter(p => p.id.startsWith('company-logo'));

const featuredJobs = [
  {
    id: "1",
    title: "Kỹ sư phần mềm (ReactJS, NodeJS)",
    company: "FPT Software",
    location: "Hà Nội",
    salary: "Thỏa thuận",
    logoId: "company-logo-fpt"
  },
  {
    id: "2",
    title: "Chuyên viên phân tích dữ liệu",
    company: "Viettel",
    location: "Đà Nẵng",
    salary: "$1500 - $2500",
    logoId: "company-logo-viettel"
  },
  {
    id: "3",
    title: "UI/UX Designer",
    company: "VNG Corporation",
    location: "TP. Hồ Chí Minh",
    salary: "Đến 30 triệu",
    logoId: "company-logo-vng"
  },
   {
    id: "4",
    title: "Product Manager",
    company: "MoMo",
    location: "TP. Hồ Chí Minh",
    salary: "Cạnh tranh",
    logoId: "company-logo-momo"
  }
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <section className="container grid lg:grid-cols-2 gap-12 items-center py-12 md:py-24 lg:py-32">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
              Tìm kiếm công việc mơ ước của bạn ngay hôm nay
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              JobHub là nơi tốt nhất để bạn tìm kiếm cơ hội nghề nghiệp tiếp theo. Khám phá hàng ngàn danh sách việc làm từ các công ty hàng đầu.
            </p>
             <div className="flex w-full max-w-lg items-center space-x-2">
              <Input type="text" placeholder="Tìm việc theo kỹ năng, vị trí, hoặc công ty" className="flex-1" />
              <Button type="submit">Tìm kiếm</Button>
            </div>
          </div>
          <div className="flex justify-center">
              {heroImage && (
                   <Image
                      src={heroImage.imageUrl}
                      alt={heroImage.description}
                      width={600}
                      height={400}
                      className="rounded-xl object-cover shadow-2xl"
                      data-ai-hint={heroImage.imageHint}
                  />
              )}
          </div>
        </section>

        <section className="py-12 md:py-24 bg-secondary">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-10">Công việc nổi bật</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredJobs.map((job) => {
                const logo = PlaceHolderImages.find(p => p.id === job.logoId);
                return (
                  <Card key={job.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-start gap-4">
                      {logo && <Image src={logo.imageUrl} alt={`${job.company} logo`} width={48} height={48} className="rounded-md" data-ai-hint={logo.imageHint} />}
                      <div>
                        <CardTitle className="text-lg mb-1">{job.title}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1"><Building className="w-4 h-4" /> {job.company}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" /> {job.location}</p>
                      <p className="flex items-center gap-2 text-muted-foreground"><DollarSign className="w-4 h-4" /> {job.salary}</p>
                      <div className="pt-2">
                        <Link href={`/jobs/${job.id}`} passHref>
                          <Button variant="outline" className="w-full">Xem chi tiết</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            <div className="text-center mt-12">
              <Link href="/jobs" passHref>
                <Button size="lg">Xem tất cả việc làm</Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-10">Công ty hàng đầu</h2>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              {companyLogos.map(logo => (
                <div key={logo.id} className="grayscale hover:grayscale-0 transition-all">
                  <Image src={logo.imageUrl} alt={logo.description} width={130} height={50} className="object-contain" data-ai-hint={logo.imageHint} />
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
      <footer className="py-6 bg-background border-t">
        <div className="container text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} JobHub. All rights reserved. | <Link href="/dieu-khoan" className="hover:text-primary">Điều khoản</Link> | <Link href="/chinh-sach" className="hover:text-primary">Chính sách</Link>
        </div>
      </footer>
    </div>
  );
}
