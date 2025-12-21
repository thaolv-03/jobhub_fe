import { cn } from "@/lib/utils";

export default function EmployerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <div className={cn("theme-employer")}>{children}</div>;
}
