"use client";

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
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: "exact" | "startsWith";
};

const adminNavItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Tổng quan", icon: LayoutDashboard, match: "exact" },
  { href: "/admin/dashboard#pending-recruiters", label: "Duyệt nhà tuyển dụng", icon: Users, match: "startsWith" },
  { href: "/admin/manager-job-seekers", label: "Quản lý ứng viên", icon: UserCog, match: "startsWith" },
  { href: "/admin/manager-recruiters", label: "Quản lý nhà tuyển dụng", icon: Users, match: "startsWith" },
  { href: "/admin/dashboard#settings", label: "Cài đặt", icon: Settings, match: "startsWith" },
];

const pageMetaMap = [
  {
    match: "/admin/dashboard",
    exact: true,
    title: "Tổng quan quản trị",
    subtitle: "Theo dõi phê duyệt, hoạt động và tình trạng hệ thống.",
  },
  {
    match: "/admin/manager-job-seekers",
    exact: true,
    title: "Quản lý ứng viên",
    subtitle: "Xem hồ sơ và CV của ứng viên.",
  },
  {
    match: "/admin/manager-recruiters",
    exact: true,
    title: "Quản lý nhà tuyển dụng",
    subtitle: "Duyệt và theo dõi tài khoản nhà tuyển dụng.",
  },
];

function AdminDashboardGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, roles } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return;
    if (!roles.includes("ADMIN")) {
      router.replace("/login");
    }
  }, [isLoading, roles, router]);

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <Skeleton className="h-[360px] w-full" />
      </div>
    );
  }

  if (!roles.includes("ADMIN")) {
    return null;
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

function AdminSidebar({
  pathname,
  hash,
  onHashClick,
}: {
  pathname: string;
  hash: string;
  onHashClick: (targetHash: string) => void;
}) {
  const isActive = (item: NavItem) => {
    const [base, itemHash] = item.href.split("#");
    const hasHash = Boolean(hash);
    if (itemHash) {
      return pathname === base && hash === itemHash;
    }
    if (hasHash && pathname === "/admin/dashboard" && item.href === "/admin/dashboard") {
      return false;
    }
    if (item.match === "exact") {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="gap-3 border-b px-4 py-4">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
            <p className="text-base font-semibold">JobHub</p>
            <p className="text-xs text-muted-foreground">Bảng điều khiển admin</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-2 px-2 py-4">
        <SidebarMenu>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const [base, itemHash] = item.href.split("#");
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item)}
                  tooltip={item.label}
                  className="relative gap-3 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:after:absolute data-[active=true]:after:left-0 data-[active=true]:after:top-2 data-[active=true]:after:h-4 data-[active=true]:after:w-1 data-[active=true]:after:rounded-full data-[active=true]:after:bg-primary"
                >
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (itemHash && pathname === base) {
                        onHashClick(itemHash);
                        return;
                      }
                      if (!itemHash && item.href === "/admin/dashboard") {
                        onHashClick("");
                      }
                    }}
                  >
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hash, setHash] = React.useState("");
  const router = useRouter();
  const { logout } = useAuth();

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const updateHash = () => setHash(window.location.hash.replace("#", ""));
    updateHash();
    window.addEventListener("hashchange", updateHash);
    window.addEventListener("popstate", updateHash);
    return () => {
      window.removeEventListener("hashchange", updateHash);
      window.removeEventListener("popstate", updateHash);
    };
  }, []);

  const handleHashClick = React.useCallback((targetHash: string) => {
    if (typeof window === "undefined") return;
    setHash(targetHash);
    if (!targetHash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.replaceState(null, "", "/admin/dashboard");
      return;
    }
    const target = document.getElementById(targetHash);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    window.history.replaceState(null, "", `/admin/dashboard#${targetHash}`);
  }, []);

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
      <AdminSidebar pathname={pathname} hash={hash} onHashClick={handleHashClick} />
      <SidebarInset>
        <DashboardTopbar
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          roleLabel="Admin"
          showSidebar
          searchPlaceholder="Quick search..."
          rightActions={
            <>
              <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
                <Link href="/">Về trang chủ</Link>
              </Button>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt="Admin avatar" />
                      <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        />
        <main className="flex-1 bg-muted/30">
          <AdminDashboardGuard>{children}</AdminDashboardGuard>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
