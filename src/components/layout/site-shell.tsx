"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/layout/container";

type SiteShellProps = {
  children: React.ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-secondary/40">
        <Container className="py-12">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
            <div className="space-y-6">
              <div>
                <Link href="/" className="text-3xl font-bold tracking-tight">
                  JobHub
                </Link>
                <p className="mt-2 text-sm text-muted-foreground">
                  Kết nối cơ hội nghề nghiệp và doanh nghiệp hàng đầu.
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-foreground">Liên hệ</p>
                <p className="text-muted-foreground">Hotline: (024) 7107 6480</p>
                <p className="text-muted-foreground">Email: hotro@jobhub.vn</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Ứng dụng tải xuống</p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="#"
                    className="rounded-full border bg-background px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    App Store
                  </Link>
                  <Link
                    href="#"
                    className="rounded-full border bg-background px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Google Play
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-3 text-sm">
                <p className="font-semibold text-foreground">Về JobHub</p>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Giới thiệu</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Góc báo chí</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Tuyển dụng</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Liên hệ</Link>
                <Link href="/chinh-sach" className="block text-muted-foreground hover:text-foreground">Chính sách bảo mật</Link>
              </div>
              <div className="space-y-3 text-sm">
                <p className="font-semibold text-foreground">Hồ sơ và CV</p>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Quản lý CV của bạn</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Hướng dẫn viết CV</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Thư viện CV theo ngành</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Review CV</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Hỏi đáp</Link>
              </div>
              <div className="space-y-3 text-sm">
                <p className="font-semibold text-foreground">Xây dựng sự nghiệp</p>
                <Link href="/jobs" className="block text-muted-foreground hover:text-foreground">Việc làm tốt nhất</Link>
                <Link href="/jobs" className="block text-muted-foreground hover:text-foreground">Việc làm lương cao</Link>
                <Link href="/jobs" className="block text-muted-foreground hover:text-foreground">Việc làm quản lý</Link>
                <Link href="/jobs" className="block text-muted-foreground hover:text-foreground">Việc làm IT</Link>
                <Link href="/jobs" className="block text-muted-foreground hover:text-foreground">Việc làm bán thời gian</Link>
              </div>
              <div className="space-y-3 text-sm">
                <p className="font-semibold text-foreground">Quy tắc chung</p>
                <Link href="/dieu-khoan" className="block text-muted-foreground hover:text-foreground">Điều kiện giao dịch chung</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Giá dịch vụ & Thanh toán</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Thông tin vận chuyển</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Quy chế hoạt động</Link>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground md:flex-row">
            <span>© {new Date().getFullYear()} JobHub. All rights reserved.</span>
            <div className="flex gap-4">
              <Link href="/dieu-khoan" className="hover:text-foreground">Điều khoản</Link>
              <Link href="/chinh-sach" className="hover:text-foreground">Chính sách</Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}

