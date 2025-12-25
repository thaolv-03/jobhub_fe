import { cn } from "@/lib/utils";

export default function RecruiterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <div className={cn("theme-recruiter")}>{children}</div>;
}


