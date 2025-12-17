
"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "../ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { Skeleton } from "../ui/skeleton";

export function Navbar() {
  const { account, isAuthenticated, isLoading, logout, roles } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  }

  const getAvatarFallback = (email?: string) => {
    return email ? email.charAt(0).toUpperCase() : 'U';
  }
  
  const getDashboardPath = () => {
      if (roles.includes('ADMIN')) return '/employer/dashboard'; // Assuming Admin uses employer dash for now
      if (roles.includes('RECRUITER')) return '/employer/dashboard';
      if (roles.includes('JOB_SEEKER')) return '/candidate/dashboard';
      return '/';
  }

  const renderAuthSection = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-20 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      );
    }

    if (isAuthenticated && account) {
      return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
              >
                <Avatar>
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${account.accountId}`} alt="Avatar" />
                    <AvatarFallback>{getAvatarFallback(account.email)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{account.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(getDashboardPath())}>Dashboard</DropdownMenuItem>
              <DropdownMenuItem disabled>Cài đặt</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Đăng xuất</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      );
    }

    return (
      <>
        <Button asChild variant="ghost">
            <Link href="/login">Đăng nhập</Link>
        </Button>
        <Button asChild>
            <Link href="/register">Đăng ký</Link>
        </Button>
      </>
    );
  }

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
            {renderAuthSection()}
            <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
