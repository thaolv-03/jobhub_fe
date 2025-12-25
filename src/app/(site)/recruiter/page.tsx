'use client';

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Users, FilePlus } from "lucide-react";
import { Container } from "@/components/layout/container";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

const features = [
  {
    icon: FilePlus,
    title: "Đăng tin không giới hạn",
    description:
      "Tiếp cận hàng ngàn ứng viên tiềm năng bằng cách đăng tin tuyển dụng nhanh chóng và dễ dàng.",
  },
  {
    icon: Users,
    title: "Quản lý ứng viên hiệu quả",
    description:
      "Hệ thống quản lý chuyên nghiệp giúp bạn theo dõi, sàng lọc và tương tác với ứng viên.",
  },
  {
    icon: BarChart,
    title: "Báo cáo & Phân tích",
    description:
      "Nhận báo cáo chi tiết về hiệu quả tin đăng và xu hướng tuyển dụng để tối ưu chiến lược.",
  },
];

export default function RecruiterLandingPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleStartPosting = () => {
    const next = "/recruiter/dashboard/post-job";
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (typeof window !== "undefined") {
      sessionStorage.setItem("jobhub_post_job_intent", "true");
    }
    router.push(next);
  };

  const handleConsulting = () => {
    const next = "/recruiter/dashboard/consulting-need";
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    router.push(next);
  };

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
                  Nền tảng của chúng tôi giúp bạn kết nối với các ứng viên chất lượng, quản lý quy
                  trình tuyển dụng và xây dựng đội ngũ vững mạnh một cách hiệu quả.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" onClick={handleStartPosting}>
                    Bắt đầu đăng tin
                  </Button>
                  <Button size="lg" variant="outline" onClick={handleConsulting}>
                    Liên hệ tư vấn
                  </Button>
                </div>
              </div>
              <div className="flex justify-center">
                <Image
                  src="https://picsum.photos/seed/employer-hero/600/400"
                  alt="Recruiter working"
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
              <h2 className="text-3xl font-bold mb-4">Tại sao chọn JobHub for Recruiters?</h2>
              <p className="text-muted-foreground md:text-lg">
                Chúng tôi cung cấp bộ công cụ mạnh mẽ và toàn diện để giải quyết mọi thách thức trong
                quy trình tuyển dụng của bạn.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {features.map((feature, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section className="py-16 md:py-24 bg-background">
          <Container className="text-center">
            <h2 className="text-3xl font-bold">Sẵn sàng xây dựng đội ngũ trong mơ của bạn?</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Tham gia cùng hàng ngàn nhà tuyển dụng khác và bắt đầu tìm kiếm những ứng viên xuất
              sắc nhất ngay hôm nay.
            </p>
            <Button size="lg" className="mt-8" onClick={handleStartPosting}>
              Đăng tin tuyển dụng miễn phí
            </Button>
          </Container>
        </section>
      </main>
    </div>
  );
}
