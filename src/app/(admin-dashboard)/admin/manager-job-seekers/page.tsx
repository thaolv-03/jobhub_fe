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
import { AccountStatus, JobSeekerAdmin, fetchJobSeekers, updateAccountStatus } from "@/lib/admin-users";

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

const nextAccountStatus = (status: AccountStatus) => {
  return status === "LOCKED" ? "ACTIVE" : "LOCKED";
};

export default function ManageJobSeekersPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = React.useState(true);
  const [jobSeekers, setJobSeekers] = React.useState<JobSeekerAdmin[]>([]);
  const [accountStatusFilter, setAccountStatusFilter] = React.useState<"all" | AccountStatus>("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [updatingAccountId, setUpdatingAccountId] = React.useState<string | null>(null);
  const [isCvOpen, setIsCvOpen] = React.useState(false);
  const [selectedCvUrl, setSelectedCvUrl] = React.useState<string | null>(null);

  const loadJobSeekers = React.useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const data = await fetchJobSeekers(accessToken);
      setJobSeekers(data);
    } catch (error) {
      toast({
        title: "Failed to load job seekers",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, toast]);

  React.useEffect(() => {
    void loadJobSeekers();
  }, [loadJobSeekers]);

  const filteredJobSeekers = React.useMemo(() => {
    const searchValue = normalize(search.trim());
    return jobSeekers.filter((item) => {
      const matchesSearch =
        !searchValue ||
        normalize(item.fullName).includes(searchValue) ||
        normalize(item.accountEmail).includes(searchValue) ||
        normalize(item.phone).includes(searchValue) ||
        normalize(item.address).includes(searchValue) ||
        normalize(String(item.jobSeekerId)).includes(searchValue);
      const matchesStatus = accountStatusFilter === "all" || item.accountStatus === accountStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobSeekers, search, accountStatusFilter]);

  const pagedJobSeekers = filteredJobSeekers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleToggleAccountStatus = async (accountId: string, status: AccountStatus) => {
    if (!accessToken) return;
    try {
      setUpdatingAccountId(accountId);
      await updateAccountStatus(accessToken, accountId, nextAccountStatus(status));
      await loadJobSeekers();
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

  const handleViewCv = (cvUrl: string | null | undefined) => {
    if (!cvUrl) return;
    setSelectedCvUrl(cvUrl);
    setIsCvOpen(true);
  };

  const accountStatusOptions: ("all" | AccountStatus)[] = ["all", "ACTIVE", "INACTIVE", "LOCKED"];

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
        Loading job seekers...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Job seekers</CardTitle>
            <CardDescription>Profiles with JOB_SEEKER role.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search by name, email, phone"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-64"
            />
            <Select
              value={accountStatusFilter}
              onValueChange={(value) => {
                setAccountStatusFilter(value as "all" | AccountStatus);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {accountStatusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "all" ? "All statuses" : getAccountStatusLabel(status)}
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
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Dob</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Bio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>CV</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedJobSeekers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-sm text-muted-foreground">
                    No job seekers found.
                  </TableCell>
                </TableRow>
              ) : (
                pagedJobSeekers.map((jobSeeker) => (
                  <TableRow key={jobSeeker.jobSeekerId}>
                    <TableCell>{jobSeeker.jobSeekerId}</TableCell>
                    <TableCell>{jobSeeker.fullName}</TableCell>
                    <TableCell>{jobSeeker.accountEmail}</TableCell>
                    <TableCell>{jobSeeker.dob ?? "-"}</TableCell>
                    <TableCell>{jobSeeker.phone ?? "-"}</TableCell>
                    <TableCell>{jobSeeker.address ?? "-"}</TableCell>
                    <TableCell>{jobSeeker.createdAt ?? "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{jobSeeker.bio ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getAccountStatusLabel(jobSeeker.accountStatus)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!jobSeeker.cvUrl}
                        onClick={() => handleViewCv(jobSeeker.cvUrl)}
                      >
                        View CV
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingAccountId === jobSeeker.accountId}
                        onClick={() => handleToggleAccountStatus(jobSeeker.accountId, jobSeeker.accountStatus)}
                      >
                        {jobSeeker.accountStatus === "LOCKED" ? "Unlock" : "Lock"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <AdminTableFooter
            totalCount={filteredJobSeekers.length}
            totalLabel="job seekers"
            page={page}
            pageSize={PAGE_SIZE}
            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setPage((prev) => prev + 1)}
          />
        </CardContent>
      </Card>

      <Dialog open={isCvOpen} onOpenChange={setIsCvOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Candidate CV</DialogTitle>
            <DialogDescription>Review the uploaded CV.</DialogDescription>
          </DialogHeader>
          {selectedCvUrl ? (
            <iframe title="Candidate CV" src={selectedCvUrl} className="h-[70vh] w-full rounded-md border" />
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No CV selected.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
