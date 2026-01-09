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
                  Ket noi co hoi nghe nghiep va doanh nghiep hang dau.
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-foreground">Lien he</p>
                <p className="text-muted-foreground">Hotline: (024) 7107 6480</p>
                <p className="text-muted-foreground">Email: hotro@jobhub.vn</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Ung dung tai xuong</p>
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
                <p className="font-semibold text-foreground">Ve JobHub</p>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Gioi thieu</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Goc bao chi</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Tuyen dung</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Lien he</Link>
                <Link href="/chinh-sach" className="block text-muted-foreground hover:text-foreground">Chinh sach bao mat</Link>
              </div>
              <div className="space-y-3 text-sm">
                <p className="font-semibold text-foreground">Ho so va CV</p>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Quan ly CV cua ban</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Huong dan viet CV</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Thu vien CV theo nganh</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Review CV</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Hoi dap</Link>
              </div>
              <div className="space-y-3 text-sm">
                <p className="font-semibold text-foreground">Xay dung su nghiep</p>
                <Link href="/jobs" className="block text-muted-foreground hover:text-foreground">Viec lam tot nhat</Link>
                <Link href="/jobs" className="block text-muted-foreground hover:text-foreground">Viec lam luong cao</Link>
                <Link href="/jobs" className="block text-muted-foreground hover:text-foreground">Viec lam quan ly</Link>
                <Link href="/jobs" className="block text-muted-foreground hover:text-foreground">Viec lam IT</Link>
                <Link href="/jobs" className="block text-muted-foreground hover:text-foreground">Viec lam ban thoi gian</Link>
              </div>
              <div className="space-y-3 text-sm">
                <p className="font-semibold text-foreground">Quy tac chung</p>
                <Link href="/dieu-khoan" className="block text-muted-foreground hover:text-foreground">Dieu kien giao dich chung</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Gia dich vu & Thanh toan</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Thong tin van chuyen</Link>
                <Link href="#" className="block text-muted-foreground hover:text-foreground">Quy che hoat dong</Link>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground md:flex-row">
            <span>© {new Date().getFullYear()} JobHub. All rights reserved.</span>
            <div className="flex gap-4">
              <Link href="/dieu-khoan" className="hover:text-foreground">Dieu khoan</Link>
              <Link href="/chinh-sach" className="hover:text-foreground">Chinh sach</Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
