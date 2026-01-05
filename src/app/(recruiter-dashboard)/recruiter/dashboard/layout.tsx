'use client';

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, ApiError } from "@/lib/api-client";
import { getAuthFailed, updateAccount } from "@/lib/auth-storage";
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
import { fetchRecruiterProfile } from "@/lib/recruiter-profile";
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
  UserCircle2,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: "exact" | "startsWith";
  action?: "post-job";
};

const recruiterNavItems: NavItem[] = [
  { href: "/recruiter/dashboard", label: "Dashboard", icon: LayoutDashboard, match: "exact" },
  { href: "/recruiter/dashboard/profile", label: "Hồ sơ", icon: UserCircle2, match: "startsWith" },
  { href: "/recruiter/dashboard/jobs", label: "Quản lý tin đăng", icon: Briefcase, match: "startsWith" },
  { href: "/recruiter/dashboard/post-job", label: "Đăng tin mới", icon: PlusCircle, match: "startsWith", action: "post-job" },
  { href: "/recruiter/dashboard/applicants", label: "Quản lý ứng viên", icon: Users, match: "startsWith" },
  { href: "/recruiter/dashboard/ai-cv", label: "CV đề xuất bằng AI", icon: Sparkles, match: "startsWith" },
];

const pageMetaMap = [
  {
    match: "/recruiter/dashboard",
    exact: true,
    title: "Tổng quan",
    subtitle: "Theo dõi hiệu suất tuyển dụng và hoạt động mới nhất.",
  },
  {
    match: "/recruiter/dashboard/profile",
    title: "Hồ sơ recruiter",
    subtitle: "Cập nhật ảnh đại diện và thông tin hồ sơ.",
  },
  {
    match: "/recruiter/dashboard/jobs",
    title: "Quản lý tin đăng",
    subtitle: "Theo dõi, chỉnh sửa và quản trị các tin tuyển dụng.",
  },
  {
    match: "/recruiter/dashboard/post-job",
    title: "Đăng tin mới",
    subtitle: "Tạo tin tuyển dụng mới để thu hút ứng viên phù hợp.",
  },
  {
    match: "/recruiter/dashboard/applicants",
    title: "Quản lý ứng viên",
    subtitle: "Xem danh sách và trạng thái hồ sơ ứng viên.",
  },
  {
    match: "/recruiter/dashboard/ai-cv",
    title: "CV đề xuất bằng AI",
    subtitle: "Tổng hợp gợi ý CV thông minh cho tin tuyển dụng.",
  },
  {
    match: "/recruiter/dashboard/consulting-need",
    title: "Nhu cầu tư vấn",
    subtitle: "Hoàn thiện thông tin để đội ngũ JobHub hỗ trợ bạn.",
  },
  {
    match: "/recruiter/dashboard/pending-approval",
    title: "Đang chờ duyệt",
    subtitle: "Hồ sơ tuyển dụng đang được kiểm duyệt.",
  },
  {
    match: "/recruiter/dashboard/upgrade-recruiter",
    title: "Đăng ký tài khoản",
    subtitle: "Trở thành recruiter để sử dụng đầy đủ tính năng.",
  },
];

function RecruiterDashboardGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, roles, accessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [recruiterStatus, setRecruiterStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [isRecruiterMissing, setIsRecruiterMissing] = useState(false);
  const clearRecruiterRole = () => {
    updateAccount<any>((current) => {
      if (!current || !Array.isArray(current.roles)) return current;
      const nextRoles = current.roles.filter(
        (role: { roleName?: string }) => role.roleName !== "RECRUITER" && role.roleName !== "RECRUITER_PENDING"
      );
      return { ...current, roles: nextRoles };
    });
  };

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

    const fetchStatus = async () => {
      try {
        setIsStatusLoading(true);
        const response = await apiRequest<{ status: 'PENDING' | 'APPROVED' | 'REJECTED'; companyId?: number | null }>(
          '/api/recruiters/me',
          {
          method: 'GET',
          accessToken,
        });
        const isMissingCompany = !response.data?.companyId;
        const hasPendingRole = roles.includes('RECRUITER_PENDING');
        setIsRecruiterMissing(isMissingCompany && !hasPendingRole);
        if (isMissingCompany && !hasPendingRole) {
          try {
            localStorage.removeItem('jobhub_consulting_submitted');
            localStorage.removeItem('jobhub_upgrade_company_source');
            clearRecruiterRole();
          } catch (storageError) {
            console.error('Failed to reset recruiter upgrade cache', storageError);
          }
        }
        setRecruiterStatus(response.data?.status ?? null);
      } catch (error) {
        const apiError = error as ApiError;
        const isNotFound = apiError?.code === 404 || apiError?.status?.toLowerCase().includes('not_found');
        const hasPendingRole = roles.includes('RECRUITER_PENDING');
        if (isNotFound && hasPendingRole) {
          setIsRecruiterMissing(false);
          setRecruiterStatus('PENDING');
          return;
        }
        if (isNotFound) {
          setIsRecruiterMissing(true);
          setRecruiterStatus(null);
          try {
            localStorage.removeItem('jobhub_consulting_submitted');
            localStorage.removeItem('jobhub_upgrade_company_source');
            clearRecruiterRole();
          } catch (storageError) {
            console.error('Failed to reset recruiter upgrade cache', storageError);
          }
        } else {
          console.error('Failed to fetch recruiter status', apiError.message);
          setRecruiterStatus(null);
        }
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

    if (isRecruiterMissing) {
      if (pathname !== '/recruiter/dashboard/upgrade-recruiter') {
        router.replace('/recruiter/dashboard/upgrade-recruiter');
      }
      return;
    }

    const isRecruiter = roles.includes('RECRUITER');
    const isPendingRecruiter = roles.includes('RECRUITER_PENDING');
    const isApproved = recruiterStatus === 'APPROVED';
    const isPendingStatus = recruiterStatus === 'PENDING' || recruiterStatus === 'REJECTED';
    const consultationSubmitted = typeof window !== 'undefined'
      ? localStorage.getItem('jobhub_consulting_submitted') === 'true'
      : false;

    const isGatewayPage = pathname === '/recruiter/dashboard/upgrade-recruiter'
      || pathname === '/recruiter/dashboard/consulting-need'
      || pathname === '/recruiter/dashboard/pending-approval';

    if (isRecruiter) {
      if (isPendingStatus) {
        const target = consultationSubmitted
          ? '/recruiter/dashboard/pending-approval'
          : '/recruiter/dashboard/consulting-need';
        if (pathname !== target) {
          router.replace(target);
        }
        return;
      }
      if (!isApproved) {
        return;
      }
      if (isGatewayPage) {
        router.replace('/recruiter/dashboard');
      }
      return;
    }

    if (isPendingRecruiter) {
      if (isApproved) {
        router.replace('/recruiter/dashboard');
        return;
      }
      const target = consultationSubmitted
        ? '/recruiter/dashboard/pending-approval'
        : '/recruiter/dashboard/consulting-need';
      if (pathname !== target) {
        router.replace(target);
      }
    } else {
      if (pathname !== '/recruiter/dashboard/upgrade-recruiter') {
        router.replace('/recruiter/dashboard/upgrade-recruiter');
      }
    }
  }, [isLoading, isStatusLoading, recruiterStatus, roles, pathname, router, isRecruiterMissing]);

  if (isLoading || isStatusLoading) {
    return (
      <div className="flex-1 p-6">
        <Skeleton className="h-[360px] w-full" />
      </div>
    );
  }

  if (isRecruiterMissing) {
    if (pathname !== '/recruiter/dashboard/upgrade-recruiter') {
      return null;
    }
    return <>{children}</>;
  }

  const isRecruiter = roles.includes('RECRUITER');
  const isPendingRecruiter = roles.includes('RECRUITER_PENDING');
  const isApproved = recruiterStatus === 'APPROVED';
  const isPendingStatus = recruiterStatus === 'PENDING' || recruiterStatus === 'REJECTED';
  const consultationSubmitted = typeof window !== 'undefined'
    ? localStorage.getItem('jobhub_consulting_submitted') === 'true'
    : false;
  const pendingTarget = consultationSubmitted
    ? '/recruiter/dashboard/pending-approval'
    : '/recruiter/dashboard/consulting-need';

  if (isRecruiter && isPendingStatus) {
    if (pathname !== pendingTarget) {
      return null;
    }
  }

  if (!isRecruiter) {
    if (isPendingRecruiter && pathname !== pendingTarget) {
      return null;
    }
    if (!isPendingRecruiter && pathname !== '/recruiter/dashboard/upgrade-recruiter') {
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
      className="w-full justify-start gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white group-data-[collapsible=icon]:justify-center"
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
    <Sidebar variant="inset" collapsible="icon" className="border-r border-slate-200/60 dark:border-slate-800/80">
      <SidebarHeader className="gap-3 border-b px-4 py-4 border-slate-200/70 dark:border-slate-800">
        <Link
          href="/recruiter/dashboard"
          className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">JobHub</p>
            <p className="text-xs text-muted-foreground dark:text-slate-400">Recruiter Dashboard</p>
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
                    className="relative gap-3 text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:after:absolute data-[active=true]:after:left-0 data-[active=true]:after:top-2 data-[active=true]:after:h-4 data-[active=true]:after:w-1 data-[active=true]:after:rounded-full data-[active=true]:after:bg-primary"
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
                  className="relative gap-3 text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:after:absolute data-[active=true]:after:left-0 data-[active=true]:after:top-2 data-[active=true]:after:h-4 data-[active=true]:after:w-1 data-[active=true]:after:rounded-full data-[active=true]:after:bg-primary"
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

export default function RecruiterDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const { logout, roles, account } = useAuth();
  const router = useRouter();
  const showSiteNavbar = [
    '/recruiter/dashboard/upgrade-recruiter',
    '/recruiter/dashboard/consulting-need',
    '/recruiter/dashboard/pending-approval',
  ].includes(pathname);
  const showSidebar = roles.includes('RECRUITER') && !showSiteNavbar;
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(account?.avatarUrl ?? null);

  React.useEffect(() => {
    setAvatarUrl(account?.avatarUrl ?? null);
  }, [account?.avatarUrl]);

  React.useEffect(() => {
    if (!roles.includes('RECRUITER')) return;
    let mounted = true;
    const loadAvatar = async () => {
      try {
        const profile = await fetchRecruiterProfile();
        if (!mounted) return;
        setAvatarUrl(profile?.avatarUrl ?? null);
      } catch (error) {
        if (!mounted) return;
      }
    };
    void loadAvatar();
    return () => {
      mounted = false;
    };
  }, [roles]);
  useEffect(() => {
    if (pathname !== '/recruiter/dashboard') {
      return;
    }
    if (!roles.includes('RECRUITER')) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    const intent = sessionStorage.getItem('jobhub_post_job_intent');
    if (intent !== 'true') {
      return;
    }
    sessionStorage.removeItem('jobhub_post_job_intent');
    router.replace('/recruiter/dashboard/post-job');
  }, [pathname, roles, router]);

  const handlePostJobClick = () => {
    if (roles.includes('RECRUITER')) {
      router.push('/recruiter/dashboard/post-job');
    } else if (roles.includes('RECRUITER_PENDING')) {
      router.push('/recruiter/dashboard/pending-approval');
    } else {
      router.push('/recruiter/dashboard/upgrade-recruiter');
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
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="hidden md:inline-flex border-slate-200 bg-white text-slate-800 hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-emerald-300 dark:hover:text-emerald-200"
                >
                  <Link href="/">Về trang chủ</Link>
                </Button>
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8 overflow-hidden">
                        <AvatarImage src={avatarUrl || undefined} alt="Recruiter avatar" className="h-full w-full object-cover" />
                        <AvatarFallback className="dark:text-slate-200">RH</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="dark:border-slate-800 dark:bg-slate-950">
                    <DropdownMenuItem asChild className="dark:focus:bg-slate-900">
                      <Link href="/recruiter/dashboard/profile">Hồ sơ</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive dark:focus:bg-slate-900">
                      <LogOut className="mr-2 h-4 w-4" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            }
          />
        )}
        <main className="flex-1 bg-muted/30 dark:bg-slate-950">
          <RecruiterDashboardGuard>{children}</RecruiterDashboardGuard>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}





