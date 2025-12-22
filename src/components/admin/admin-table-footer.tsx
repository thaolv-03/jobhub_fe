"use client";

import React from "react";
import { Button } from "@/components/ui/button";

type AdminTableFooterProps = {
  totalCount: number;
  totalLabel: string;
  page: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
};

export function AdminTableFooter({
  totalCount,
  totalLabel,
  page,
  pageSize,
  onPrev,
  onNext,
}: AdminTableFooterProps) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <span className="text-xs text-muted-foreground">
        {totalCount} {totalLabel}
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={onPrev}>
          Prev
        </Button>
        <Button size="sm" variant="outline" disabled={page * pageSize >= totalCount} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
