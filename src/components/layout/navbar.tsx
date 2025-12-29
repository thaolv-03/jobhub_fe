"use client";

import React, { type MouseEvent } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "../ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
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
  }

  const getAvatarFallback = (email?: string) => {
    return email ? email.charAt(0).toUpperCase() : 'U';
  }
  
  const getDashboardPath = () => {
      const userRoles = roles;
      if (userRoles.includes('ADMIN')) {
        return '/admin/dashboard';
      }
      if (userRoles.includes('RECRUITER') || userRoles.includes('RECRUITER_PENDING')) {
        return '/recruiter/dashboard';
      }
      if (userRoles.includes('JOB_SEEKER')) {
        return '/job-seeker/dashboard';
      }
      return '/login';
  }

  const handleRecruiterRedirect = () => {
    if (!isAuthenticated) {
        router.push('/login?next=/recruiter/dashboard');
        return;
    }
    // Always redirect to the recruiter dashboard. The layout will handle role-based redirection.
    router.push('/recruiter/dashboard');
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
            <Button variant="outline" onClick={handleRecruiterRedirect}>
                Đăng tuyển & Tìm hồ sơ
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="overflow-hidden rounded-full"
                >
                    <Avatar>
                        <AvatarImage src={avatarUrl ?? ""} alt="Avatar" />
                        <AvatarFallback>{getAvatarFallback(account.email)}</AvatarFallback>
                    </Avatar>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                           {account.email.split('@')[0]}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                           {account.email}
                        </p>
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
            <Button asChild variant="ghost">
                <Link href="/login">Đăng nhập</Link>
            </Button>
            <Button asChild>
                <Link href="/register">Đăng ký</Link>
            </Button>
            <div className="h-6 border-l mx-2"></div>
            <Button variant="outline" onClick={handleRecruiterRedirect}>
                Nhà tuyển dụng
            </Button>
        </div>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <Container className="flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Briefcase className="h-6 w-6 text-primary"/>
            <span className="inline-block font-bold text-2xl">JobHub</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/jobs"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Tìm việc làm
            </Link>
            <Link
              href="/job-seeker/dashboard"
              className="text-muted-foreground transition-colors hover:text-primary"
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


