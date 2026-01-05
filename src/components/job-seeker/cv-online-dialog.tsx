"use client";

import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export type CvOnlineMeta = {
  fileKey: string;
  rawText: string;
  parsedData: Record<string, unknown>;
};

const CV_ONLINE_FIELDS = [
  { id: "name", label: "Họ và tên", key: "NAME" },
  { id: "emailAddress", label: "Email", key: "EMAIL ADDRESS" },
  { id: "contact", label: "Liên hệ", key: "CONTACT" },
  { id: "location", label: "Địa điểm", key: "LOCATION" },
  { id: "linkedinLink", label: "Liên kết LinkedIn", key: "LINKEDIN LINK" },
  { id: "designation", label: "Chức danh", key: "DESIGNATION" },
  { id: "workedAs", label: "Vị trí đã làm", key: "WORKED AS", multi: true },
  { id: "companiesWorkedAt", label: "Công ty đã làm", key: "COMPANIES WORKED AT", multi: true },
  { id: "yearsOfExperience", label: "Số năm kinh nghiệm", key: "YEARS OF EXPERIENCE" },
  { id: "skills", label: "Kỹ năng", key: "SKILLS", multi: true },
  { id: "awards", label: "Giải thưởng", key: "AWARDS", multi: true },
  { id: "certification", label: "Chứng chỉ", key: "CERTIFICATION", multi: true },
  { id: "language", label: "Ngôn ngữ", key: "LANGUAGE", multi: true },
  { id: "degree", label: "Bằng cấp", key: "DEGREE" },
  { id: "collegeName", label: "Tên trường/Cao đẳng", key: "COLLEGE NAME" },
  { id: "university", label: "Đại học", key: "UNIVERSITY" },
  { id: "yearOfGraduation", label: "Năm tốt nghiệp", key: "YEAR OF GRADUATION" },
] as const;

export type CvOnlineFormValues = {
  [K in typeof CV_ONLINE_FIELDS[number]["id"]]: string;
};

const normalizeParsedValue = (value: unknown) => {
  if (value == null) return "";
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean).join("\n");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return String(value).trim();
};

const getParsedValue = (parsedData: Record<string, unknown> | null | undefined, key: string) => {
  if (!parsedData) return "";
  const match = Object.keys(parsedData).find((item) => item.toLowerCase() === key.toLowerCase());
  if (!match) return "";
  return normalizeParsedValue(parsedData[match]);
};

export const buildCvOnlineDefaults = (parsedData?: Record<string, unknown> | null) => {
  return CV_ONLINE_FIELDS.reduce((acc, field) => {
    acc[field.id] = getParsedValue(parsedData, field.key);
    return acc;
  }, {} as CvOnlineFormValues);
};

const parseListValue = (value: string) =>
  value
    .split(/\r?\n|,/g)
    .map((item) => item.trim())
    .filter(Boolean);

export const buildParsedDataFromValues = (values: CvOnlineFormValues) => {
  return CV_ONLINE_FIELDS.reduce((acc, field) => {
    const raw = values[field.id]?.trim() ?? "";
    if (field.multi) {
      acc[field.key] = raw ? parseListValue(raw) : [];
    } else {
      acc[field.key] = raw;
    }
    return acc;
  }, {} as Record<string, unknown>);
};

type CvOnlineDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<CvOnlineFormValues>;
  cvOnlineMeta: CvOnlineMeta | null;
  cvOnlineFileName: string | null;
  isParsing: boolean;
  isSaving: boolean;
  isLoading?: boolean;
  onParseFile: (file: File) => Promise<void>;
  onSave: (values: CvOnlineFormValues) => Promise<void>;
};

export function CvOnlineDialog({
  open,
  onOpenChange,
  form,
  cvOnlineMeta,
  cvOnlineFileName,
  isParsing,
  isSaving,
  isLoading,
  onParseFile,
  onSave,
}: CvOnlineDialogProps) {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await onParseFile(file);
    event.target.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl border-border/60 bg-background p-0 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex max-h-[90vh] flex-col">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="space-y-1">
              <DialogTitle className="text-xl text-slate-900 dark:text-slate-100">CV Online (AI)</DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-300">
                Tải CV để phân tích và chỉnh sửa trước khi lưu.
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-slate-700 dark:text-slate-200">
              X
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Tải CV để phân tích</p>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                />
                <p className="text-xs text-muted-foreground dark:text-slate-300">PDF, DOC, DOCX, PNG, JPG (tối đa 10MB).</p>
                {isLoading ? <p className="text-xs text-muted-foreground dark:text-slate-300">Đang tải CV Online...</p> : null}
                {isParsing ? <p className="text-xs text-muted-foreground dark:text-slate-300">Đang phân tích CV...</p> : null}
                {cvOnlineFileName ? <p className="text-xs text-muted-foreground dark:text-slate-300">Tệp: {cvOnlineFileName}</p> : null}
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
                  <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
                    <div className="space-y-6 rounded-lg bg-emerald-50 p-4 dark:bg-slate-900/60 dark:border dark:border-slate-800">
                      <div className="space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-300">Thông tin cá nhân</p>
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 dark:text-slate-200">Họ và tên</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Họ và tên"
                                  disabled={!cvOnlineMeta}
                                  {...field}
                                  className="bg-white dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="designation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 dark:text-slate-200">Chức danh</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Vị trí / chức danh"
                                  disabled={!cvOnlineMeta}
                                  {...field}
                                  className="bg-white dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="emailAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 dark:text-slate-200">Email</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="username@gmail.com"
                                  disabled={!cvOnlineMeta}
                                  {...field}
                                  className="bg-white dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contact"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 dark:text-slate-200">Liên hệ</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Số điện thoại"
                                  disabled={!cvOnlineMeta}
                                  {...field}
                                  className="bg-white dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 dark:text-slate-200">Địa điểm</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Thành phố, Quốc gia"
                                  disabled={!cvOnlineMeta}
                                  {...field}
                                  className="bg-white dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="linkedinLink"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 dark:text-slate-200">LinkedIn</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://linkedin.com/in/..."
                                  disabled={!cvOnlineMeta}
                                  {...field}
                                  className="bg-white dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="h-px w-full bg-emerald-200 dark:bg-slate-700" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-300">Kỹ năng</p>
                        <FormField
                          control={form.control}
                          name="skills"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 dark:text-slate-200">Kỹ năng</FormLabel>
                              <FormControl>
                                <Textarea
                                  rows={4}
                                  placeholder="Mỗi kỹ năng một dòng"
                                  disabled={!cvOnlineMeta}
                                  {...field}
                                  className="bg-white dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 dark:text-slate-200">Ngôn ngữ</FormLabel>
                              <FormControl>
                                <Textarea
                                  rows={3}
                                  placeholder="Mỗi ngôn ngữ một dòng"
                                  disabled={!cvOnlineMeta}
                                  {...field}
                                  className="bg-white dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-6 rounded-lg bg-white p-4 dark:bg-slate-950/70 dark:border dark:border-slate-800">
                      <div className="space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-300">Kinh nghiệm</p>
                        <FormField
                          control={form.control}
                          name="yearsOfExperience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 dark:text-slate-200">Số năm kinh nghiệm</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ví dụ: 3 năm"
                                  disabled={!cvOnlineMeta}
                                  {...field}
                                  className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="workedAs"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 dark:text-slate-200">Vị trí đã làm</FormLabel>
                              <FormControl>
                                <Textarea
                                  rows={4}
                                  placeholder="Mỗi vị trí một dòng"
                                  disabled={!cvOnlineMeta}
                                  {...field}
                                  className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="companiesWorkedAt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 dark:text-slate-200">Công ty đã làm</FormLabel>
                              <FormControl>
                                <Textarea
                                  rows={4}
                                  placeholder="Mỗi công ty một dòng"
                                  disabled={!cvOnlineMeta}
                                  {...field}
                                  className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="h-px w-full bg-emerald-200 dark:bg-slate-700" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-300">Học vấn</p>
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="degree"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-900 dark:text-slate-200">Bằng cấp</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Bằng cấp"
                                    disabled={!cvOnlineMeta}
                                    {...field}
                                    className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="yearOfGraduation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-900 dark:text-slate-200">Năm tốt nghiệp</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="2024"
                                    disabled={!cvOnlineMeta}
                                    {...field}
                                    className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="collegeName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-900 dark:text-slate-200">Tên trường/Cao đẳng</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Tên trường/Cao đẳng"
                                    disabled={!cvOnlineMeta}
                                    {...field}
                                    className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="university"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-900 dark:text-slate-200">Đại học</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Đại học"
                                    disabled={!cvOnlineMeta}
                                    {...field}
                                    className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="h-px w-full bg-emerald-200 dark:bg-slate-700" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-300">Giải thưởng & Chứng chỉ</p>
                        <FormField
                          control={form.control}
                          name="awards"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 dark:text-slate-200">Giải thưởng</FormLabel>
                              <FormControl>
                                <Textarea
                                  rows={2}
                                  placeholder="Mỗi giải thưởng một dòng"
                                  disabled={!cvOnlineMeta}
                                  {...field}
                                  className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="certification"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 dark:text-slate-200">Chứng chỉ</FormLabel>
                              <FormControl>
                                <Textarea
                                  rows={2}
                                  placeholder="Mỗi chứng chỉ một dòng"
                                  disabled={!cvOnlineMeta}
                                  {...field}
                                  className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
                      Hủy
                    </Button>
                    <Button type="submit" disabled={!cvOnlineMeta || isSaving}>
                      {isSaving ? "Đang lưu..." : "Lưu CV Online"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
