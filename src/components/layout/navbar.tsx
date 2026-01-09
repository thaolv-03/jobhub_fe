"use client";

import React, { type MouseEvent } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "../ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { Skeleton } from "../ui/skeleton";
import { LogOut, LayoutDashboard, Settings, Briefcase } from "lucide-react";
import { Container } from "@/components/layout/container";
import { useJobSeekerProfileGate } from "@/contexts/job-seeker-profile-context";
import { fetchJobSeekerProfile } from "@/lib/job-seeker-profile";
import { fetchRecruiterProfile } from "@/lib/recruiter-profile";

export function Navbar() {
  const { account, isAuthenticated, isLoading, logout, roles } = useAuth();
  const router = useRouter();
  const { ensureProfile } = useJobSeekerProfileGate();
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(account?.avatarUrl ?? null);

  React.useEffect(() => {
    setAvatarUrl(account?.avatarUrl ?? null);
  }, [account?.avatarUrl]);

  React.useEffect(() => {
    if (!isAuthenticated || !account) return;
    let mounted = true;
    const loadAvatar = async () => {
      try {
        if (roles.includes("JOB_SEEKER")) {
          const profile = await fetchJobSeekerProfile();
          if (!mounted) return;
          setAvatarUrl(profile?.avatarUrl ?? null);
          return;
        }
        if (roles.includes("RECRUITER") || roles.includes("RECRUITER_PENDING")) {
          const profile = await fetchRecruiterProfile();
          if (!mounted) return;
          setAvatarUrl(profile?.avatarUrl ?? null);
        }
      } catch (error) {
        if (!mounted) return;
      }
    };
    void loadAvatar();
    return () => {
      mounted = false;
    };
  }, [account, isAuthenticated, roles]);

  const handleLogout = async () => {
    await logout();
  };

  const getAvatarFallback = (email?: string) => {
    return email ? email.charAt(0).toUpperCase() : "U";
  };

  const getDashboardPath = () => {
    const userRoles = roles;
    if (userRoles.includes("ADMIN")) {
      return "/admin/dashboard";
    }
    if (userRoles.includes("RECRUITER") || userRoles.includes("RECRUITER_PENDING")) {
      return "/recruiter/dashboard";
    }
    if (userRoles.includes("JOB_SEEKER")) {
      return "/job-seeker/dashboard";
    }
    return "/login";
  };

  const handleRecruiterRedirect = () => {
    if (!isAuthenticated) {
      router.push("/login?next=/recruiter");
      return;
    }
    // Always redirect to the recruiter dashboard. The layout will handle role-based redirection.
    router.push("/recruiter");
  };

  const handleJobSeekerProfileClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      router.push("/login?next=/job-seeker/dashboard/cv");
      return;
    }
    await ensureProfile({ type: "OPEN_PROFILE" });
  };

  const renderAuthSection = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-44 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      );
    }

    if (isAuthenticated && account) {
      return (
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="border-slate-200 bg-slate-50 text-slate-800 hover:border-primary hover:bg-primary hover:text-primary-foreground dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-emerald-300"
            onClick={handleRecruiterRedirect}
          >
            Nhà tuyển dụng
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="overflow-hidden rounded-full">
                <Avatar>
                  <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                  <AvatarFallback>{getAvatarFallback(account.email)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 dark:border-slate-800 dark:bg-slate-950">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{account.email.split("@")[0]}</p>
                  <p className="text-xs leading-none text-muted-foreground">{account.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(getDashboardPath())}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Settings className="mr-2 h-4 w-4" />
                <span>Cài đặt</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="outline"
          className="border-slate-200 bg-white text-slate-800 hover:border-primary hover:bg-primary hover:text-primary-foreground dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:border-emerald-300"
        >
          <Link href="/login">Đăng nhập</Link>
        </Button>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/register">Đăng ký</Link>
        </Button>
        <div className="mx-2 h-6 border-l border-slate-200 dark:border-slate-700"></div>
        <Button
          variant="outline"
          className="border-slate-200 bg-slate-50 text-slate-800 hover:border-primary hover:bg-primary hover:text-primary-foreground dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-emerald-300"
          onClick={handleRecruiterRedirect}
        >
          Nhà tuyển dụng
        </Button>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 dark:border-slate-800 dark:bg-slate-950/90">
      <Container className="flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center gap-2 shrink-0 pt-1.5">
            <Briefcase className="h-6 w-6 text-primary -translate-y-0.5" />
            <img
              src="/images/LogoJobHub_Black.png"
              alt="JobHub"
              className="block h-16 w-auto object-contain dark:hidden"
            />
            <img
              src="/images/logoJobHub.png"
              alt="JobHub"
              className="hidden h-16 w-auto object-contain dark:block"
            />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link
              href="/jobs"
              className="text-slate-600 transition-colors hover:text-primary dark:text-slate-300 dark:hover:text-emerald-300"
            >
              Tìm việc làm
            </Link>
            <Link
              href="/companies"
              className="text-slate-600 transition-colors hover:text-primary dark:text-slate-300 dark:hover:text-emerald-300"
            >
              Danh sách công ty
            </Link>
            <Link
              href="/job-seeker/dashboard"
              className="text-slate-600 transition-colors hover:text-primary dark:text-slate-300 dark:hover:text-emerald-300"
              onClick={handleJobSeekerProfileClick}
            >
              Hồ sơ & CV
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {renderAuthSection()}
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}
