"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function CandidateSettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">Cài đặt</h2>
        <p className="text-sm text-muted-foreground">Tính năng đang phát triển</p>
      </div>

      <Card className="max-w-xl shadow-sm">
        <CardHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Settings className="h-6 w-6" />
          </div>
          <CardTitle className="mt-4">Sắp ra mắt</CardTitle>
          <CardDescription>
            JobHub đang hoàn thiện khu vực cài đặt để bạn dễ dàng tùy chỉnh hồ sơ và bảo mật.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled className="w-full">Coming soon</Button>
        </CardContent>
      </Card>
    </div>
  );
}
