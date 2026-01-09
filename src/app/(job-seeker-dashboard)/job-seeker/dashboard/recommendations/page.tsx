"use client";

import React from "react";
import { RecommendedJobsPanel } from "@/components/job-seeker/recommended-jobs-panel";

export default function JobRecommendationsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <RecommendedJobsPanel />
    </div>
  );
}
