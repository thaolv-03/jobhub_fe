'use client';

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
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
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import {
  Bookmark,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCircle2,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: "exact" | "startsWith";
};

const jobSeekerNavItems: NavItem[] = [
  { href: "/job-seeker/dashboard", label: "Dashboard", icon: LayoutDashboard, match: "exact" },
  { href: "/job-seeker/dashboard/applied-jobs", label: "Việc đã ứng tuyển", icon: FileText, match: "startsWith" },
  { href: "/job-seeker/dashboard/saved-jobs", label: "Việc đã lưu", icon: Bookmark, match: "startsWith" },
  { href: "/job-seeker/dashboard/settings", label: "Cài đặt", icon: Settings, match: "startsWith" },
];

const pageMetaMap = [
  {
    match: "/job-seeker/dashboard",
    exact: true,
    title: "Tổng quan",
    subtitle: "Tóm tắt hồ sơ và hoạt động ứng tuyển gần đây.",
  },
  {
    match: "/job-seeker/dashboard/applied-jobs",
    title: "Việc đã ứng tuyển",
    subtitle: "Theo dõi trạng thái các hồ sơ đã nộp.",
  },
  {
    match: "/job-seeker/dashboard/saved-jobs",
    title: "Việc đã lưu",
    subtitle: "Danh sách việc làm bạn quan tâm để xem lại.",
  },
  {
    match: "/job-seeker/dashboard/settings",
    title: "Cài đặt",
    subtitle: "Tuỳ chỉnh trải nghiệm và bảo mật tài khoản.",
  },
];

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

function JobSeekerSidebar({ pathname }: { pathname: string }) {
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
          href="/job-seeker/dashboard"
          className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserCircle2 className="h-5 w-5" />
          </span>
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
            <p className="text-base font-semibold">JobHub</p>
            <p className="text-xs text-muted-foreground">Job Seeker Dashboard</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-2 px-2 py-4">
        <SidebarMenu>
          {jobSeekerNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item)}
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

export default function JobSeekerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const pageMeta = useMemo(() => {
    const exactMatch = pageMetaMap.find((item) => item.exact && item.match === pathname);
    if (exactMatch) return exactMatch;
    return pageMetaMap.find((item) => pathname.startsWith(item.match)) ?? pageMetaMap[0];
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <SidebarProvider defaultOpen>
      <JobSeekerSidebar pathname={pathname} />
      <SidebarInset>
        <DashboardTopbar
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          roleLabel="Ứng viên"
          showSidebar
          rightActions={
            <>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt="Job seeker avatar" />
                      <AvatarFallback>U</AvatarFallback>
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
        <main className="flex-1 bg-muted/30">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}



