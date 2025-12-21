'use client';
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { BarChart, Users, FilePlus } from "lucide-react";
import { Container } from "@/components/layout/container";

const features = [
    {
        icon: FilePlus,
        title: "Đăng tin không giới hạn",
        description: "Tiếp cận hàng ngàn ứng viên tiềm năng bằng cách đăng tin tuyển dụng một cách nhanh chóng và dễ dàng.",
    },
    {
        icon: Users,
        title: "Quản lý ứng viên hiệu quả",
        description: "Hệ thống quản lý chuyên nghiệp giúp bạn theo dõi, sàng lọc và tương tác với ứng viên.",
    },
    {
        icon: BarChart,
        title: "Báo cáo & Phân tích",
        description: "Nhận báo cáo chi tiết về hiệu quả tin đăng và xu hướng tuyển dụng để tối ưu hóa chiến lược.",
    },
];

export default function EmployerLandingPage() {
  return (
    <div className="flex flex-col">
      <main className="flex-1">
        <section className="bg-background">
          <Container>
            <div className="grid lg:grid-cols-2 gap-12 items-center py-16 md:py-24">
              <div className="space-y-6">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline text-primary">
                  Tìm kiếm và tuyển dụng nhân tài hàng đầu
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Nền tảng của chúng tôi giúp bạn kết nối với các ứng viên chất lượng, quản lý quy trình tuyển dụng và xây dựng đội ngũ vững mạnh một cách hiệu quả.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                   <Button asChild size="lg">
                      <Link href="/register">Bắt đầu đăng tin</Link>
                   </Button>
                   <Button asChild size="lg" variant="outline">
                      <Link href="#">Liên hệ tư vấn</Link>
                   </Button>
                </div>
              </div>
              <div className="flex justify-center">
                   <Image
                      src="https://picsum.photos/seed/employer-hero/600/400"
                      alt="Employer working"
                      width={600}
                      height={400}
                      className="rounded-xl object-cover shadow-2xl"
                      data-ai-hint="team collaboration"
                  />
              </div>
            </div>
          </Container>
        </section>

        <section className="py-16 md:py-24 bg-muted/40">
          <Container>
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold mb-4">Tại sao chọn JobHub for Employers?</h2>
                <p className="text-muted-foreground md:text-lg">
                    Chúng tôi cung cấp bộ công cụ mạnh mẽ và toàn diện để giải quyết mọi thách thức trong quy trình tuyển dụng của bạn.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {features.map((feature, index) => (
                <Card key={index}>
                    <CardHeader>
                        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                            <feature.icon className="h-6 w-6"/>
                        </div>
                        <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section className="py-16 md:py-24 bg-background">
            <Container className="text-center">
                <h2 className="text-3xl font-bold">Sẵn sàng để xây dựng đội ngũ trong mơ của bạn?</h2>
                <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                    Tham gia cùng hàng ngàn nhà tuyển dụng khác và bắt đầu tìm kiếm những ứng viên xuất sắc nhất ngay hôm nay.
                </p>
                 <Button asChild size="lg" className="mt-8">
                    <Link href="/register">Đăng tin tuyển dụng miễn phí</Link>
                 </Button>
            </Container>
        </section>
      </main>
    </div>
  );
}
