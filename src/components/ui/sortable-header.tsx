"use client";

import React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SortOrder = "ASC" | "DESC" | null;

type SortableHeaderProps = {
  label: string;
  field: string;
  sortBy: string | null;
  sortOrder: SortOrder;
  onSort: (field: string) => void;
  align?: "left" | "center" | "right";
  className?: string;
};

export function SortableHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
  align = "left",
  className,
}: SortableHeaderProps) {
  const isActive = sortBy === field;
  const Icon = !isActive ? ArrowUpDown : sortOrder === "ASC" ? ArrowUp : ArrowDown;
  const alignClass =
    align === "center" ? "justify-center text-center" : align === "right" ? "justify-end text-right" : "justify-start";

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        "flex w-full items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100",
        alignClass,
        className
      )}
      aria-sort={isActive ? (sortOrder === "ASC" ? "ascending" : "descending") : "none"}
    >
      <span>{label}</span>
      <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-slate-400")} />
    </button>
  );
}
