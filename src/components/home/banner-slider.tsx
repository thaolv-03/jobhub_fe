"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

type BannerItem = {
  id: string;
  title?: string;
  imageSrc?: string;
  href: string;
  backgroundClass?: string;
};

const banners: BannerItem[] = [
  {
    id: "banner-1",
    title: "Khám phá cơ hội mới",
    href: "/jobs",
    backgroundClass: "bg-gradient-to-br from-emerald-500/20 via-emerald-200/40 to-transparent",
  },
  {
    id: "banner-2",
    title: "Hệ thống AI gợi ý CV",
    href: "/recruiter",
    backgroundClass: "bg-gradient-to-br from-emerald-600/20 via-slate-900/20 to-transparent",
  },
  {
    id: "banner-3",
    title: "Cập nhật hồ sơ nhanh",
    href: "/job-seeker/dashboard",
    backgroundClass: "bg-gradient-to-br from-emerald-400/20 via-emerald-100/50 to-transparent",
  },
  {
    id: "banner-4",
    title: "Đăng tin tuyển dụng",
    href: "/recruiter",
    backgroundClass: "bg-gradient-to-br from-emerald-700/20 via-emerald-200/40 to-transparent",
  },
];

export function BannerSlider() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isHovering, setIsHovering] = React.useState(false);
  const isMobile = useIsMobile();
  const perView = isMobile ? 1 : 2;
  const maxIndex = Math.max(0, banners.length - perView);
  const viewportRef = React.useRef<HTMLDivElement | null>(null);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + (maxIndex + 1)) % (maxIndex + 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % (maxIndex + 1));
  };

  React.useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  React.useEffect(() => {
    if (isHovering || banners.length <= perView) return;
    const timer = setInterval(handleNext, 5000);
    return () => clearInterval(timer);
  }, [isHovering, perView, maxIndex]);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const step = viewport.clientWidth / perView;
    viewport.scrollTo({ left: activeIndex * step, behavior: "smooth" });
  }, [activeIndex, perView]);

  return (
    <section className="py-12">
      <Container>
        <div
          className="relative"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Khám phá nhanh</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrev} aria-label="Previous banner">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext} aria-label="Next banner">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div ref={viewportRef} className="overflow-hidden">
            <div className="-mx-2 flex">
              {banners.map((banner) => (
                <div key={banner.id} className="w-full md:w-1/2 shrink-0 px-2">
                  <Link
                    href={banner.href}
                    className={cn(
                      "group relative flex h-48 items-end overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md",
                      banner.backgroundClass
                    )}
                  >
                    {banner.imageSrc ? (
                      <Image
                        src={banner.imageSrc}
                        alt={banner.title || "Banner"}
                        fill
                        className="object-cover"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/30 to-transparent" />
                    <div className="relative z-10 p-6">
                      <p className="text-sm font-medium text-primary">JobHub</p>
                      <h3 className="mt-2 text-xl font-semibold">{banner.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">Khám phá ngay</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}


