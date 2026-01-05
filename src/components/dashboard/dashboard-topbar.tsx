"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

type DashboardTopbarProps = {
  title: string;
  subtitle?: string;
  roleLabel?: string;
  showSidebar?: boolean;
  searchPlaceholder?: string;
  primaryAction?: React.ReactNode;
  rightActions?: React.ReactNode;
};

export function DashboardTopbar({
  title,
  subtitle,
  roleLabel = "Dashboard",
  showSidebar = true,
  searchPlaceholder,
  primaryAction,
  rightActions,
}: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex items-center gap-3">
        {showSidebar ? <SidebarTrigger className="inline-flex" /> : null}
        {showSidebar ? <Separator orientation="vertical" className="h-6" /> : null}
        <div className="leading-tight">
          <p className="text-xs uppercase tracking-wide text-muted-foreground dark:text-slate-400">{roleLabel}</p>
          <h1 className="text-lg font-semibold text-foreground dark:text-slate-100">{title}</h1>
        </div>
      </div>
      <div className="ml-auto flex flex-1 items-center justify-end gap-2 md:gap-3">
        {searchPlaceholder ? (
          <div className="hidden max-w-xs flex-1 md:block">
            <Input
              placeholder={searchPlaceholder}
              className="h-9 bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
            />
          </div>
        ) : null}
        {primaryAction}
        {rightActions}
      </div>
      {subtitle ? <p className="sr-only">{subtitle}</p> : null}
    </header>
  );
}
