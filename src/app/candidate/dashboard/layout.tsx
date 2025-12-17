
'use client';

import Link from "next/link"
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { cn } from "@/lib/utils";

const candidateNavItems = [
  { href: "/candidate/dashboard", label: "Hồ sơ của tôi" },
  { href: "/candidate/dashboard/cv", label: "Quản lý CV" },
  { href: "/candidate/dashboard/applied-jobs", label: "Việc đã ứng tuyển" },
  { href: "/candidate/dashboard/saved-jobs", label: "Việc làm đã lưu" },
];

export default function CandidateDashboardLayout({
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
                 {candidateNavItems.map((item) => (
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
