import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function AiCvPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">CV đề xuất bằng AI</h2>
        <p className="text-sm text-muted-foreground dark:text-slate-300">Tính năng đang phát triển</p>
      </div>

      <Card className="max-w-xl border-border/60 bg-background/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
        <CardHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <CardTitle className="mt-4 text-slate-900 dark:text-slate-100">Sắp ra mắt</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-300">
            JobHub đang xây dựng tính năng gợi ý CV thông minh để giúp bạn tuyển đúng người nhanh hơn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled className="w-full">Coming soon</Button>
        </CardContent>
      </Card>
    </div>
  );
}
