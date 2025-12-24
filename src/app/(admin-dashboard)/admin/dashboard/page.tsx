'use client';

import React from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  fetchPendingRecruiters,
  fetchRecruiterDocuments,
  updateRecruiterStatus,
  RecruiterAdmin,
  RecruiterStatus,
  RecruiterDocument,
} from "@/lib/admin-recruiter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Activity,
  FileText,
  FolderSearch,
  ShieldCheck,
  Users,
} from "lucide-react";

const jobActivityData = [
  { month: "Jan", jobs: 0 },
  { month: "Feb", jobs: 0 },
  { month: "Mar", jobs: 0 },
  { month: "Apr", jobs: 0 },
  { month: "May", jobs: 0 },
  { month: "Jun", jobs: 0 },
  { month: "Jul", jobs: 0 },
  { month: "Aug", jobs: 0 },
  { month: "Sep", jobs: 0 },
  { month: "Oct", jobs: 0 },
  { month: "Nov", jobs: 0 },
  { month: "Dec", jobs: 0 },
];

const cvActivityData = [
  { month: "Jan", cv: 0 },
  { month: "Feb", cv: 0 },
  { month: "Mar", cv: 0 },
  { month: "Apr", cv: 0 },
  { month: "May", cv: 0 },
  { month: "Jun", cv: 0 },
  { month: "Jul", cv: 0 },
  { month: "Aug", cv: 0 },
  { month: "Sep", cv: 0 },
  { month: "Oct", cv: 0 },
  { month: "Nov", cv: 0 },
  { month: "Dec", cv: 0 },
];

const jobsChartConfig = {
  jobs: {
    label: "Job posts",
    color: "hsl(var(--chart-1))",
  },
};

const cvChartConfig = {
  cv: {
    label: "CV uploads",
    color: "hsl(var(--chart-2))",
  },
};

export default function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const [pendingRecruiters, setPendingRecruiters] = React.useState<RecruiterAdmin[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState<number | null>(null);
  const [isDocsOpen, setIsDocsOpen] = React.useState(false);
  const [docsLoading, setDocsLoading] = React.useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = React.useState<RecruiterAdmin | null>(null);
  const [documents, setDocuments] = React.useState<RecruiterDocument[]>([]);

  React.useEffect(() => {
    if (!accessToken) return;
    let mounted = true;

    const loadPending = async () => {
      try {
        setIsLoading(true);
        const data = await fetchPendingRecruiters(accessToken);
        if (!mounted) return;
        setPendingRecruiters(data);
      } catch (error) {
        if (!mounted) return;
        toast({
          title: "Failed to load pending recruiters",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadPending();

    return () => {
      mounted = false;
    };
  }, [accessToken, toast]);

  const handleStatusUpdate = async (recruiterId: number, status: RecruiterStatus) => {
    if (!accessToken) return;
    try {
      setIsUpdating(recruiterId);
      await updateRecruiterStatus(accessToken, recruiterId, status);
      setPendingRecruiters((prev) => prev.filter((item) => item.recruiterId !== recruiterId));
      toast({
        title: "Status updated",
        description: `Recruiter ${recruiterId} marked as ${status.toLowerCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleViewDocuments = async (recruiter: RecruiterAdmin) => {
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


  const pendingCount = pendingRecruiters.length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Pending recruiters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Waiting for approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Job posts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">0</div>
            <p className="text-xs text-muted-foreground">Placeholder until stats API</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">CV uploads</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">0</div>
            <p className="text-xs text-muted-foreground">Placeholder until stats API</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">100%</div>
            <p className="text-xs text-muted-foreground">Admin workflow ready</p>
          </CardContent>
        </Card>
      </section>

      <section id="analytics" className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Job posting activity</CardTitle>
            <CardDescription>Monthly job posts (placeholder data).</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={jobsChartConfig} className="h-[260px]">
              <AreaChart data={jobActivityData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="jobs"
                  stroke="var(--color-jobs)"
                  fill="var(--color-jobs)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>CV upload volume</CardTitle>
            <CardDescription>Monthly CV uploads (placeholder data).</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={cvChartConfig} className="h-[260px]">
              <BarChart data={cvActivityData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="cv" fill="var(--color-cv)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>

      <section id="pending-recruiters" className="grid gap-6">
        <Card>
          <CardHeader className="flex items-center justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle>Pending recruiter approvals</CardTitle>
              <CardDescription>Review and approve recruiter onboarding requests.</CardDescription>
            </div>
            <Badge variant="secondary">{pendingCount} pending</Badge>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Loading pending recruiters...
              </div>
            ) : pendingRecruiters.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                No pending recruiters at the moment.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRecruiters.map((recruiter) => (
                    <TableRow key={recruiter.recruiterId}>
                      <TableCell className="font-medium">#{recruiter.recruiterId}</TableCell>
                      <TableCell>{recruiter.companyName ?? "Pending profile"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {recruiter.email ?? "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{recruiter.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDocuments(recruiter)}
                            disabled={docsLoading}
                          >
                            View docs
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(recruiter.recruiterId, "APPROVED")}
                            disabled={isUpdating === recruiter.recruiterId}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(recruiter.recruiterId, "REJECTED")}
                            disabled={isUpdating === recruiter.recruiterId}
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </section>

      <Dialog open={isDocsOpen} onOpenChange={setIsDocsOpen}>
        <DialogContent className="max-w-lg w-[min(32rem,calc(100vw-2rem))] overflow-hidden">
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
                <div key={doc.documentId} className="w-full rounded-lg border bg-background p-4 overflow-hidden">
                  <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground">{doc.contentType}</p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="shrink-0 justify-self-end">
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

      <section id="settings">
        <Card>
          <CardHeader>
            <CardTitle>Admin settings</CardTitle>
            <CardDescription>Centralize future admin settings and policies.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
            <FolderSearch className="h-4 w-4" />
            Settings panel coming soon.
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
