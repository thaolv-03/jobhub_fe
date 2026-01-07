"use client";

import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type AdminTableFooterProps = {
  totalCount: number;
  totalLabel: string;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function AdminTableFooter({
  totalCount,
  totalLabel,
  page,
  pageSize,
  onPageChange,
}: AdminTableFooterProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const pageItems = React.useMemo(() => {
    if (totalPages <= 1) return [1];
    const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    const sorted = Array.from(pages)
      .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
      .sort((a, b) => a - b);
    const result: Array<number | "ellipsis"> = [];
    let prev = 0;
    sorted.forEach((pageNumber) => {
      if (prev !== 0 && pageNumber - prev > 1) {
        result.push("ellipsis");
      }
      result.push(pageNumber);
      prev = pageNumber;
    });
    return result;
  }, [currentPage, totalPages]);

  return (
    <div className="mt-4 flex items-center justify-between">
      <span className="text-xs text-muted-foreground">
        {totalCount} {totalLabel}
      </span>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(currentPage - 1)}
              className={currentPage <= 1 ? "pointer-events-none opacity-50" : undefined}
            />
          </PaginationItem>
          {pageItems.map((pageItem, index) => {
            if (pageItem === "ellipsis") {
              return (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }
            return (
              <PaginationItem key={pageItem}>
                <PaginationLink
                  isActive={pageItem === currentPage}
                  onClick={() => onPageChange(pageItem)}
                >
                  {pageItem}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(currentPage + 1)}
              className={currentPage >= totalPages ? "pointer-events-none opacity-50" : undefined}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
