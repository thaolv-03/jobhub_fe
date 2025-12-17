
'use client';

import Link from "next/link"
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { cn } from "@/lib/utils";

const employerNavItems = [
  { href: "/employer/dashboard", label: "Dashboard" },
  { href: "/employer/dashboard/jobs", label: "Quản lý tin đăng" },
  { href: "/employer/dashboard/post-job", label: "Đăng tin mới" },
  { href: "/employer/dashboard/applicants", label: "Quản lý ứng viên" },
];

export default function EmployerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full flex-col">
        <Navbar />
        <div className="border-b">
            <nav className="container flex items-center">
                {employerNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "py-3 px-4 text-sm font-medium transition-colors hover:text-primary",
                            pathname === item.href ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                        )}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>
        </div>
        <div className="flex-1 bg-muted/40">
             {children}
        </div>
    </div>
  )
}
