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
import { buildPaginationItems } from "@/components/admin/pagination-utils";

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
    return buildPaginationItems(currentPage, totalPages);
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
