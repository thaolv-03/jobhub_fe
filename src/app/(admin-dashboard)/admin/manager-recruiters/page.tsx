"use client";

import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminTableFooter } from "@/components/admin/admin-table-footer";
import { fetchRecruiterDocuments, RecruiterDocument, updateRecruiterStatus } from "@/lib/admin-recruiter";
import { AccountStatus, RecruiterAdminDetail, fetchRecruiters, updateAccountStatus } from "@/lib/admin-users";

const PAGE_SIZE = 8;

const normalize = (value: string | null | undefined) => (value ?? "").toLowerCase();

const getAccountStatusLabel = (status: AccountStatus) => {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "INACTIVE":
      return "Inactive";
    case "LOCKED":
      return "Locked";
    default:
      return status;
  }
};

const getRecruiterStatusLabel = (status: RecruiterAdminDetail["status"]) => {
  switch (status) {
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    default:
      return "Pending";
  }
};

const nextAccountStatus = (status: AccountStatus) => {
  return status === "LOCKED" ? "ACTIVE" : "LOCKED";
};

export default function ManageRecruitersPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = React.useState(true);
  const [recruiters, setRecruiters] = React.useState<RecruiterAdminDetail[]>([]);
  const [accountStatusFilter, setAccountStatusFilter] = React.useState<"all" | AccountStatus>("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | RecruiterAdminDetail["status"]>("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [updatingAccountId, setUpdatingAccountId] = React.useState<string | null>(null);
  const [updatingRecruiterId, setUpdatingRecruiterId] = React.useState<number | null>(null);
  const [isDocsOpen, setIsDocsOpen] = React.useState(false);
  const [docsLoading, setDocsLoading] = React.useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = React.useState<RecruiterAdminDetail | null>(null);
  const [documents, setDocuments] = React.useState<RecruiterDocument[]>([]);

  const loadRecruiters = React.useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const data = await fetchRecruiters(accessToken);
      setRecruiters(data);
    } catch (error) {
      toast({
        title: "Failed to load recruiters",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, toast]);

  React.useEffect(() => {
    void loadRecruiters();
  }, [loadRecruiters]);

  const filteredRecruiters = React.useMemo(() => {
    const searchValue = normalize(search.trim());
    return recruiters.filter((item) => {
      const matchesSearch =
        !searchValue ||
        normalize(item.accountEmail).includes(searchValue) ||
        normalize(item.companyName).includes(searchValue) ||
        normalize(item.phone).includes(searchValue) ||
        normalize(item.position).includes(searchValue) ||
        normalize(String(item.recruiterId)).includes(searchValue);
      const matchesAccountStatus = accountStatusFilter === "all" || item.accountStatus === accountStatusFilter;
      const matchesRecruiterStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesAccountStatus && matchesRecruiterStatus;
    });
  }, [recruiters, search, accountStatusFilter, statusFilter]);

  const pagedRecruiters = filteredRecruiters.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleToggleAccountStatus = async (accountId: string, status: AccountStatus) => {
    if (!accessToken) return;
    try {
      setUpdatingAccountId(accountId);
      await updateAccountStatus(accessToken, accountId, nextAccountStatus(status));
      await loadRecruiters();
    } catch (error) {
      toast({
        title: "Failed to update account",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingAccountId(null);
    }
  };

  const handleRecruiterStatusUpdate = async (
    recruiterId: number,
    status: RecruiterAdminDetail["status"]
  ) => {
    if (!accessToken) return;
    try {
      setUpdatingRecruiterId(recruiterId);
      await updateRecruiterStatus(accessToken, recruiterId, status);
      await loadRecruiters();
      toast({ title: "Recruiter status updated" });
    } catch (error) {
      toast({
        title: "Failed to update recruiter",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingRecruiterId(null);
    }
  };

  const handleViewDocuments = async (recruiter: RecruiterAdminDetail) => {
    if (!accessToken) return;
    setSelectedRecruiter(recruiter);
    setDocsLoading(true);
    try {
      const docs = await fetchRecruiterDocuments(accessToken, recruiter.recruiterId);
      setDocuments(docs);
      setIsDocsOpen(true);
    } catch (error) {
      toast({
        title: "Failed to load documents",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDocsLoading(false);
    }
  };

  const accountStatusOptions: ("all" | AccountStatus)[] = ["all", "ACTIVE", "INACTIVE", "LOCKED"];
  const recruiterStatusOptions: ("all" | RecruiterAdminDetail["status"])[] = [
    "all",
    "PENDING",
    "APPROVED",
    "REJECTED",
  ];

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
        Loading recruiters...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Recruiters</CardTitle>
            <CardDescription>Profiles with RECRUITER role.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search by email, company, phone"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-64"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as "all" | RecruiterAdminDetail["status"]);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Recruiter status" />
              </SelectTrigger>
              <SelectContent>
                {recruiterStatusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "all" ? "All recruiter statuses" : getRecruiterStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={accountStatusFilter}
              onValueChange={(value) => {
                setAccountStatusFilter(value as "all" | AccountStatus);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Account status" />
              </SelectTrigger>
              <SelectContent>
                {accountStatusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "all" ? "All account statuses" : getAccountStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Account status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRecruiters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                    No recruiters found.
                  </TableCell>
                </TableRow>
              ) : (
                pagedRecruiters.map((recruiter) => (
                  <TableRow key={recruiter.recruiterId}>
                    <TableCell>{recruiter.recruiterId}</TableCell>
                    <TableCell>{recruiter.accountEmail}</TableCell>
                    <TableCell>{recruiter.companyName ?? "-"}</TableCell>
                    <TableCell>{recruiter.phone ?? "-"}</TableCell>
                    <TableCell>{recruiter.position ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getRecruiterStatusLabel(recruiter.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDocuments(recruiter)}
                        disabled={docsLoading}
                      >
                        View docs
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getAccountStatusLabel(recruiter.accountStatus)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingRecruiterId === recruiter.recruiterId}
                          onClick={() => handleRecruiterStatusUpdate(recruiter.recruiterId, "APPROVED")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingRecruiterId === recruiter.recruiterId}
                          onClick={() => handleRecruiterStatusUpdate(recruiter.recruiterId, "REJECTED")}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingAccountId === recruiter.accountId}
                          onClick={() => handleToggleAccountStatus(recruiter.accountId, recruiter.accountStatus)}
                        >
                          {recruiter.accountStatus === "LOCKED" ? "Unlock" : "Lock"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <AdminTableFooter
            totalCount={filteredRecruiters.length}
            totalLabel="recruiters"
            page={page}
            pageSize={PAGE_SIZE}
            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setPage((prev) => prev + 1)}
          />
        </CardContent>
      </Card>

      <Dialog open={isDocsOpen} onOpenChange={setIsDocsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Recruiter documents</DialogTitle>
            <DialogDescription>
              {selectedRecruiter
                ? `Recruiter #${selectedRecruiter.recruiterId} documents`
                : "No recruiter selected"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {documents.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                {selectedRecruiter ? "No documents available." : "Select a recruiter to view documents."}
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.documentId} className="rounded-lg border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground">{doc.contentType}</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <a href={doc.downloadUrl} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
