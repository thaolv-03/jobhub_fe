
"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "../ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold text-2xl text-primary">JobHub</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-4 text-sm font-medium">
            <Link
              href="/jobs"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Việc làm
            </Link>
             <Link
              href="/candidate/dashboard"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Hồ sơ ứng viên
            </Link>
             <Link
              href="/employer/dashboard"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Nhà tuyển dụng
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
            <Button asChild variant="ghost">
                <Link href="/login">Đăng nhập</Link>
            </Button>
            <Button asChild>
                <Link href="/login">Đăng ký</Link>
            </Button>
            <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
