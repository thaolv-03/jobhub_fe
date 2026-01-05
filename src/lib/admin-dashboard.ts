import { apiRequest } from "@/lib/api-client";

export type AdminChartPoint = {
  month: string;
  count: number;
};

export type AdminDashboardChart = {
  jobPosts: AdminChartPoint[];
  cvUploads: AdminChartPoint[];
};

export async function fetchAdminDashboardCharts(accessToken: string) {
  const response = await apiRequest<AdminDashboardChart>("/api/admin/dashboard/charts", {
    method: "GET",
    accessToken,
  });
  return (
    response.data ?? {
      jobPosts: [],
      cvUploads: [],
    }
  );
}
