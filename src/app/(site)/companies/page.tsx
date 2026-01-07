'use client';

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Building2, MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Container } from "@/components/layout/container";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useToast } from "@/hooks/use-toast";
import { searchCompanies, type Company } from "@/lib/companies";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const PAGE_SIZE = 12;

export default function CompaniesPage() {
  const { toast } = useToast();
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    const loadCompanies = async () => {
      setIsLoading(true);
      try {
        const data = await searchCompanies({
          pagination: { page, pageSize: PAGE_SIZE },
          sortBy: "companyName",
          sortOrder: "ASC",
          searchedBy: debouncedSearch || "",
          filter: null,
        });
        if (!mounted) return;
        setCompanies(data.items);
        setTotal(data.count);
      } catch (error) {
        if (!mounted) return;
        setCompanies([]);
        setTotal(0);
        toast({
          variant: "destructive",
          title: "Không thể tải danh sách công ty",
          description: "Vui lòng thử lại sau.",
        });
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void loadCompanies();
    return () => {
      mounted = false;
    };
  }, [debouncedSearch, page, toast]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col">
      <main className="flex-1">
        <Container className="py-10 space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Danh sách công ty</h1>
              <p className="text-muted-foreground">Khám phá các nhà tuyển dụng và cơ hội việc làm nổi bật.</p>
            </div>
            <div className="relative w-full md:w-[360px]">
              <Input
                placeholder="Tìm công ty theo tên..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <Card key={`company-skeleton-${index}`} className="animate-pulse">
                  <CardHeader className="space-y-3">
                    <div className="h-5 w-1/2 rounded bg-muted" />
                    <div className="h-4 w-3/4 rounded bg-muted" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-3 w-2/3 rounded bg-muted" />
                  </CardContent>
                </Card>
              ))
            ) : companies.length > 0 ? (
              companies.map((company) => {
                const logo = PlaceHolderImages.find((p) => p.id === "company-logo-fpt");
                return (
                  <Card key={company.companyId} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row gap-4 items-center">
                      {company.avatarUrl ? (
                        <Image
                          src={company.avatarUrl}
                          alt={`${company.companyName} logo`}
                          width={56}
                          height={56}
                          className="rounded-lg border p-1"
                        />
                      ) : logo ? (
                        <Image
                          src={logo.imageUrl}
                          alt="Company logo"
                          width={56}
                          height={56}
                          className="rounded-lg border p-1"
                          data-ai-hint={logo.imageHint}
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg border bg-muted">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <CardTitle className="break-words text-lg leading-snug">{company.companyName}</CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {company.location ?? "Không rõ"}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {company.introduction ?? "Chưa có thông tin giới thiệu."}
                      </p>
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href={`/companies/${company.companyId}`}>Xem chi tiết</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="sm:col-span-2 lg:col-span-3">
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  Không tìm thấy công ty phù hợp.
                </CardContent>
              </Card>
            )}
          </div>

          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    setPage((prev) => Math.max(0, prev - 1));
                  }}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).slice(0, 5).map((_, index) => (
                <PaginationItem key={`company-page-${index}`}>
                  <PaginationLink
                    href="#"
                    isActive={page === index}
                    onClick={(event) => {
                      event.preventDefault();
                      setPage(index);
                    }}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              {totalPages > 5 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    setPage((prev) => Math.min(totalPages - 1, prev + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </Container>
      </main>
    </div>
  );
}
