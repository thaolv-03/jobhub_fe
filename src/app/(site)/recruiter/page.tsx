"use client";

import React from "react";
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

const recruiterBanners = [
  "/images/recruiter-banner/recruiter-banner_1.png",
  "/images/recruiter-banner/recruiter-banner_2.png",
  "/images/recruiter-banner/recruiter-banner_3.png",
  "/images/recruiter-banner/recruiter-banner_4.png",
];

export default function RecruiterLandingPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeBannerIndex, setActiveBannerIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveBannerIndex((current) => (current + 1) % recruiterBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
        <div className="relative overflow-hidden bg-[url('/images/backgrounds/background_lightmode.png')] bg-cover bg-center bg-no-repeat dark:bg-[url('/images/backgrounds/background_darkmode.png')]">
          <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/70 to-white/40 dark:from-slate-950/80 dark:via-slate-950/70 dark:to-slate-950/40" />
          <section className="relative">
            <Container>
              <div className="grid lg:grid-cols-2 gap-12 items-center py-16 md:py-24">
                <div className="space-y-6">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline text-primary drop-shadow-sm dark:text-emerald-300">
                    Tìm kiếm và tuyển dụng nhân tài hàng đầu
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl dark:text-slate-200/90">
                    Nền tảng của chúng tôi giúp bạn kết nối với các ứng viên chất lượng, quản lý quy trình tuyển dụng và
                    xây dựng đội ngũ vững mạnh một cách hiệu quả.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" onClick={handleStartPosting}>
                      Bắt đầu đăng tin
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-white text-slate-900 hover:bg-white/90 dark:bg-white/90 dark:text-slate-900"
                      onClick={handleConsulting}
                    >
                      Liên hệ tư vấn
                    </Button>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="relative h-[320px] w-full max-w-[560px] overflow-hidden rounded-xl shadow-2xl md:h-[400px]">
                    {recruiterBanners.map((src, index) => (
                      <Image
                        key={src}
                        src={src}
                        alt="Recruiter banner"
                        fill
                        sizes="(min-width: 1024px) 560px, 90vw"
                        className={`object-cover transition-opacity duration-700 ${index === activeBannerIndex ? "opacity-100" : "opacity-0"}`}
                        priority={index === 0}
                      />
                    ))}
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                      {recruiterBanners.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`h-2 w-2 rounded-full ${index === activeBannerIndex ? "bg-white" : "bg-white/50"}`}
                          aria-label={`Go to banner ${index + 1}`}
                          onClick={() => setActiveBannerIndex(index)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Container>
          </section>
        </div>

        <section className="py-16 md:py-24 bg-muted/40 dark:bg-slate-900/60">
          <Container>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-4 text-foreground dark:text-white">
                Tại sao chọn JobHub cho nhà tuyển dụng?
              </h2>
              <p className="text-muted-foreground md:text-lg dark:text-slate-300">
                Chúng tôi cung cấp bộ công cụ mạnh mẽ và toàn diện để giải quyết mọi thách thức trong quy trình tuyển
                dụng của bạn.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {features.map((feature, index) => (
                <Card key={index} className="border-border/60 bg-background/80 shadow-sm backdrop-blur dark:bg-slate-950/60">
                  <CardHeader>
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-slate-900 dark:text-slate-100">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section className="py-16 md:py-24 bg-background dark:bg-slate-950">
          <Container className="text-center">
            <h2 className="text-3xl font-bold text-foreground dark:text-white">
              Sẵn sàng xây dựng đội ngũ trong mơ của bạn?
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto dark:text-slate-300">
              Tham gia cùng hàng ngàn nhà tuyển dụng khác và bắt đầu tìm kiếm những ứng viên xuất sắc nhất ngay hôm nay.
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
