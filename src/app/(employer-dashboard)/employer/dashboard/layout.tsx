'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, ApiError } from "@/lib/api-client";
import { getAuthFailed } from "@/lib/auth-storage";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { Navbar } from "@/components/layout/navbar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Sparkles,
  Users,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: "exact" | "startsWith";
  action?: "post-job";
};

const recruiterNavItems: NavItem[] = [
  { href: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard, match: "exact" },
  { href: "/employer/dashboard/jobs", label: "Quản lý tin đăng", icon: Briefcase, match: "startsWith" },
  { href: "/employer/dashboard/post-job", label: "Đăng tin mới", icon: PlusCircle, match: "startsWith", action: "post-job" },
  { href: "/employer/dashboard/applicants", label: "Quản lý ứng viên", icon: Users, match: "startsWith" },
  { href: "/employer/dashboard/ai-cv", label: "CV đề xuất bằng AI", icon: Sparkles, match: "startsWith" },
];

const pageMetaMap = [
  {
    match: "/employer/dashboard",
    exact: true,
    title: "Tổng quan",
    subtitle: "Theo dõi hiệu suất tuyển dụng và hoạt động mới nhất.",
  },
  {
    match: "/employer/dashboard/jobs",
    title: "Quản lý tin đăng",
    subtitle: "Theo dõi, chỉnh sửa và quản trị các tin tuyển dụng.",
  },
  {
    match: "/employer/dashboard/post-job",
    title: "Đăng tin mới",
    subtitle: "Tạo tin tuyển dụng mới để thu hút ứng viên phù hợp.",
  },
  {
    match: "/employer/dashboard/applicants",
    title: "Quản lý ứng viên",
    subtitle: "Xem danh sách và trạng thái hồ sơ ứng viên.",
  },
  {
    match: "/employer/dashboard/ai-cv",
    title: "CV đề xuất bằng AI",
    subtitle: "Tổng hợp gợi ý CV thông minh cho tin tuyển dụng.",
  },
  {
    match: "/employer/dashboard/consulting-need",
    title: "Nhu cầu tư vấn",
    subtitle: "Hoàn thiện thông tin để đội ngũ JobHub hỗ trợ bạn.",
  },
  {
    match: "/employer/dashboard/pending-approval",
    title: "Đang chờ duyệt",
    subtitle: "Hồ sơ tuyển dụng đang được kiểm duyệt.",
  },
  {
    match: "/employer/dashboard/upgrade-recruiter",
    title: "Nâng cấp tài khoản",
    subtitle: "Trở thành recruiter để sử dụng đầy đủ tính năng.",
  },
];

function EmployerDashboardGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, roles, accessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [recruiterStatus, setRecruiterStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const lastStatusKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (getAuthFailed()) {
      return;
    }

    const hasRecruiterRole = roles.includes('RECRUITER') || roles.includes('RECRUITER_PENDING');
    if (!hasRecruiterRole) {
      setRecruiterStatus(null);
      return;
    }
    if (!accessToken) {
      return;
    }

    const statusKey = `${accessToken}:${roles.join(',')}`;
    if (lastStatusKeyRef.current === statusKey) {
      return;
    }
    lastStatusKeyRef.current = statusKey;

    const fetchStatus = async () => {
      try {
        setIsStatusLoading(true);
        const response = await apiRequest<{ status: 'PENDING' | 'APPROVED' | 'REJECTED' }>('/api/recruiters/me', {
          method: 'GET',
          accessToken,
        });
        setRecruiterStatus(response.data?.status ?? null);
      } catch (error) {
        const apiError = error as ApiError;
        console.error('Failed to fetch recruiter status', apiError.message);
        setRecruiterStatus(null);
        lastStatusKeyRef.current = null;
      } finally {
        setIsStatusLoading(false);
      }
    };

    void fetchStatus();
  }, [accessToken, isLoading, roles]);

  useEffect(() => {
    if (isLoading || isStatusLoading) {
      return;
    }

    const isRecruiter = roles.includes('RECRUITER');
    const isPendingRecruiter = roles.includes('RECRUITER_PENDING');
    const isApproved = recruiterStatus === 'APPROVED';
    const isNotApproved = recruiterStatus === null || recruiterStatus === 'PENDING' || recruiterStatus === 'REJECTED';
    const consultationSubmitted = typeof window !== 'undefined'
      ? localStorage.getItem('jobhub_consulting_submitted') === 'true'
      : false;

    const isGatewayPage = pathname === '/employer/dashboard/upgrade-recruiter'
      || pathname === '/employer/dashboard/consulting-need'
      || pathname === '/employer/dashboard/pending-approval';

    if (isRecruiter) {
      if (isNotApproved) {
        const target = consultationSubmitted
          ? '/employer/dashboard/pending-approval'
          : '/employer/dashboard/consulting-need';
        if (pathname !== target) {
          router.replace(target);
        }
        return;
      }
      if (!isApproved) {
        return;
      }
      if (isGatewayPage) {
        router.replace('/employer/dashboard');
      }
      return;
    }

    if (isPendingRecruiter) {
      if (isApproved) {
        router.replace('/employer/dashboard');
        return;
      }
      const target = consultationSubmitted
        ? '/employer/dashboard/pending-approval'
        : '/employer/dashboard/consulting-need';
      if (pathname !== target) {
        router.replace(target);
      }
    } else {
      if (pathname !== '/employer/dashboard/upgrade-recruiter') {
        router.replace('/employer/dashboard/upgrade-recruiter');
      }
    }
  }, [isLoading, isStatusLoading, recruiterStatus, roles, pathname, router]);

  if (isLoading || isStatusLoading) {
    return (
      <div className="flex-1 p-6">
        <Skeleton className="h-[360px] w-full" />
      </div>
    );
  }

  const isRecruiter = roles.includes('RECRUITER');
  const isPendingRecruiter = roles.includes('RECRUITER_PENDING');
  const isApproved = recruiterStatus === 'APPROVED';
  const consultationSubmitted = typeof window !== 'undefined'
    ? localStorage.getItem('jobhub_consulting_submitted') === 'true'
    : false;
  const pendingTarget = consultationSubmitted
    ? '/employer/dashboard/pending-approval'
    : '/employer/dashboard/consulting-need';

  if (isRecruiter && !isApproved) {
    if (pathname !== pendingTarget) {
      return null;
    }
  }

  if (!isRecruiter) {
    if (isPendingRecruiter && pathname !== pendingTarget) {
      return null;
    }
    if (!isPendingRecruiter && pathname !== '/employer/dashboard/upgrade-recruiter') {
      return null;
    }
  }

  return <>{children}</>;
}

function SidebarCollapseButton() {
  const { toggleSidebar, state } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleSidebar}
      className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center"
    >
      {state === "expanded" ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
      <span className="text-xs font-medium group-data-[collapsible=icon]:hidden">
        {state === "expanded" ? "Thu gọn sidebar" : "Mở rộng sidebar"}
      </span>
    </Button>
  );
}

function RecruiterSidebar({
  pathname,
  onPostJob,
  showSidebar,
}: {
  pathname: string;
  onPostJob: () => void;
  showSidebar: boolean;
}) {
  if (!showSidebar) return null;

  const isActive = (item: NavItem) => {
    if (item.match === "exact") {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="gap-3 border-b px-4 py-4">
        <Link
          href="/employer/dashboard"
          className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
            <p className="text-base font-semibold">JobHub</p>
            <p className="text-xs text-muted-foreground">Recruiter Dashboard</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-2 px-2 py-4">
        <SidebarMenu>
          {recruiterNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            if (item.action === "post-job") {
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={active}
                    onClick={onPostJob}
                    tooltip={item.label}
                    className="relative gap-3 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:after:absolute data-[active=true]:after:left-0 data-[active=true]:after:top-2 data-[active=true]:after:h-4 data-[active=true]:after:w-1 data-[active=true]:after:rounded-full data-[active=true]:after:bg-primary"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.label}
                  className="relative gap-3 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:after:absolute data-[active=true]:after:left-0 data-[active=true]:after:top-2 data-[active=true]:after:h-4 data-[active=true]:after:w-1 data-[active=true]:after:rounded-full data-[active=true]:after:bg-primary"
                >
                  <Link href={item.href}>
                    <Icon className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-4">
        <SidebarCollapseButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default function EmployerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const { logout, roles } = useAuth();
  const router = useRouter();
  const showSidebar = roles.includes('RECRUITER');
  const showSiteNavbar = [
    '/employer/dashboard/upgrade-recruiter',
    '/employer/dashboard/consulting-need',
    '/employer/dashboard/pending-approval',
  ].includes(pathname);

  const handlePostJobClick = () => {
    if (roles.includes('RECRUITER')) {
      router.push('/employer/dashboard/post-job');
    } else if (roles.includes('RECRUITER_PENDING')) {
      router.push('/employer/dashboard/pending-approval');
    } else {
      router.push('/employer/dashboard/upgrade-recruiter');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const pageMeta = useMemo(() => {
    const exactMatch = pageMetaMap.find((item) => item.exact && item.match === pathname);
    if (exactMatch) return exactMatch;
    return pageMetaMap.find((item) => pathname.startsWith(item.match)) ?? pageMetaMap[0];
  }, [pathname]);

  return (
    <SidebarProvider defaultOpen>
      <RecruiterSidebar pathname={pathname} onPostJob={handlePostJobClick} showSidebar={showSidebar} />
      <SidebarInset>
        {showSiteNavbar ? (
          <Navbar />
        ) : (
          <DashboardTopbar
            title={pageMeta.title}
            subtitle={pageMeta.subtitle}
            showSidebar={showSidebar}
            roleLabel="Recruiter"
            searchPlaceholder="Tìm kiếm nhanh..."
            primaryAction={
              <Button size="sm" className="hidden gap-2 md:inline-flex" onClick={handlePostJobClick}>
                <PlusCircle className="h-4 w-4" />
                Đăng tin mới
              </Button>
            }
            rightActions={
              <>
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt="Recruiter avatar" />
                        <AvatarFallback>RH</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Hồ sơ</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            }
          />
        )}
        <main className="flex-1 bg-muted/30">
          <EmployerDashboardGuard>{children}</EmployerDashboardGuard>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
