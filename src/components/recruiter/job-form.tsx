'use client';

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CATEGORIES, CATEGORY_ID_SET, JOB_TAGS, TAG_ID_SET } from "@/lib/job-form-data";

export const LOCATION_OPTIONS = [
  { value: "\u0048\u00e0 \u004e\u1ed9\u0069", label: "\u0048\u00e0 \u004e\u1ed9\u0069" },
  { value: "\u0110\u00e0 \u004e\u1eb5\u006e\u0067", label: "\u0110\u00e0 \u004e\u1eb5\u006e\u0067" },
  { value: "TP HCM", label: "TP HCM" },
  { value: "Remote", label: "Remote" },
];

const jobSchema = z.object({
  title: z.string().min(1, { message: "Tiêu đề không được để trống." }),
  location: z.string({ required_error: "Vui lòng chọn địa điểm." }),
  min_salary: z.coerce.number().min(0, "Mức lương không hợp lệ.").optional(),
  max_salary: z.coerce.number().min(0, "Mức lương không hợp lệ.").optional(),
  job_type: z.enum(["FULL_TIME", "PART_TIME", "INTERN", "CONTRACT", "FREELANCE"], {
    required_error: "Vui lòng chọn loại hình công việc.",
  }),
  deadline: z.date().optional(),
  description: z.string().min(20, { message: "Mô tả công việc cần ít nhất 20 ký tự." }),
  categoryIds: z
    .array(z.number().int())
    .min(1, { message: "Vui lòng chọn danh mục." })
    .refine((values) => values.every((value) => CATEGORY_ID_SET.has(value)), {
      message: "Danh mục không hợp lệ.",
    }),
  tagIds: z
    .array(z.number().int())
    .refine((values) => values.every((value) => TAG_ID_SET.has(value)), {
      message: "Kỹ năng không hợp lệ.",
    }),
  requirements: z.string().optional(),
});

export type JobFormValues = z.infer<typeof jobSchema>;

type JobFormProps = {
  initialValues?: Partial<JobFormValues>;
  onSubmit: (values: JobFormValues) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
};

const defaultValues: Partial<JobFormValues> = {
  title: "",
  location: undefined,
  min_salary: 0,
  max_salary: 0,
  job_type: undefined,
  deadline: undefined,
  description: "",
  categoryIds: [],
  tagIds: [],
  requirements: "",
};

export function JobForm({ initialValues, onSubmit, submitLabel = "Đăng tin", onCancel }: JobFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [categorySelectValue, setCategorySelectValue] = React.useState("");
  const [tagSelectValue, setTagSelectValue] = React.useState("");
  const [skillSearch, setSkillSearch] = React.useState("");
  const resolvedDefaultValues = React.useMemo(
    () => ({ ...defaultValues, ...initialValues }),
    [initialValues]
  );
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: resolvedDefaultValues,
  });

  React.useEffect(() => {
    if (!initialValues) return;
    form.reset({ ...defaultValues, ...initialValues });
  }, [form, initialValues]);

  const handleSubmit = async (values: JobFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-900 dark:text-slate-200">Tiêu đề công việc</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ví dụ: Kỹ sư phần mềm (ReactJS, NodeJS)"
                  {...field}
                  className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-900 dark:text-slate-200">Địa điểm</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:border-slate-700/70">
                      <SelectValue placeholder="Chọn thành phố" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700">
                    {LOCATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-slate-900 dark:text-slate-100">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="job_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-900 dark:text-slate-200">Loại hình công việc</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:border-slate-700/70">
                      <SelectValue placeholder="Chọn loại hình" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700">
                    <SelectItem value="FULL_TIME" className="text-slate-900 dark:text-slate-100">Toàn thời gian</SelectItem>
                    <SelectItem value="PART_TIME" className="text-slate-900 dark:text-slate-100">Bán thời gian</SelectItem>
                    <SelectItem value="CONTRACT" className="text-slate-900 dark:text-slate-100">Hợp đồng</SelectItem>
                    <SelectItem value="INTERN" className="text-slate-900 dark:text-slate-100">Thực tập</SelectItem>
                    <SelectItem value="FREELANCE" className="text-slate-900 dark:text-slate-100">Freelance</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="min_salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-900 dark:text-slate-200">Lương tối thiểu (triệu VND)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ví dụ: 20"
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
            name="max_salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-900 dark:text-slate-200">Lương tối đa (triệu VND)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ví dụ: 50"
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
            name="deadline"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-slate-900 dark:text-slate-200">Hạn nộp hồ sơ</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal dark:bg-slate-900/70 dark:text-slate-100 dark:border-slate-700",
                          !field.value && "text-muted-foreground dark:text-slate-400"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Chọn ngày</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto border border-slate-200 bg-white p-0 shadow-md dark:border-slate-700 dark:bg-slate-900" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="categoryIds"
          render={({ field }) => {
            const selectedIds = field.value ?? [];
            const selectedCategories = CATEGORIES.filter((category) => selectedIds.includes(category.id));
            return (
              <FormItem>
                <FormLabel className="text-slate-900 dark:text-slate-200">Danh mục</FormLabel>
                <Select
                  value={categorySelectValue}
                  onValueChange={(value) => {
                    setCategorySelectValue(value);
                    const id = Number(value);
                    if (!CATEGORY_ID_SET.has(id)) {
                      setCategorySelectValue("");
                      return;
                    }
                    if (!selectedIds.includes(id)) {
                      field.onChange([...selectedIds, id]);
                    }
                    setCategorySelectValue("");
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:border-slate-700/70">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700">
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)} className="text-slate-900 dark:text-slate-100">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedCategories.map((category) => (
                      <Badge
                        key={category.id}
                        variant="secondary"
                        className="flex items-center gap-1 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <span>{category.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                          onClick={() => {
                            field.onChange(selectedIds.filter((id) => id !== category.id));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="tagIds"
          render={({ field }) => {
            const selectedIds = field.value ?? [];
            const selectedTags = JOB_TAGS.filter((tag) => selectedIds.includes(tag.id));
            const normalizedQuery = skillSearch.trim().toLowerCase();
            const filteredTags = normalizedQuery
              ? JOB_TAGS.filter(
                  (tag) =>
                    !selectedIds.includes(tag.id) &&
                    tag.name.toLowerCase().includes(normalizedQuery)
                )
              : [];
            return (
              <FormItem>
                <FormLabel className="text-slate-900 dark:text-slate-200">Kỹ năng yêu cầu</FormLabel>
                <Input
                  value={skillSearch}
                  onChange={(event) => {
                    setSkillSearch(event.target.value);
                  }}
                  placeholder="Tìm kiếm kỹ năng sau đó nhấn vào ô Chọn kỹ năng..."
                  className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                />
                {normalizedQuery ? (
                  <div className="mt-2 max-h-56 overflow-auto rounded-md border bg-white p-1 shadow-sm dark:border-slate-700/70 dark:bg-slate-900">
                    {filteredTags.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                        No skills found
                      </div>
                    ) : (
                      filteredTags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          className="flex w-full items-center rounded-sm px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                          onClick={() => {
                            if (!selectedIds.includes(tag.id)) {
                              field.onChange([...selectedIds, tag.id]);
                            }
                            setSkillSearch("");
                          }}
                        >
                          {tag.name}
                        </button>
                      ))
                    )}
                  </div>
                ) : null}

                <Select
                  value={tagSelectValue}
                  onValueChange={(value) => {
                    setTagSelectValue(value);
                    const id = Number(value);
                    if (!TAG_ID_SET.has(id)) {
                      setTagSelectValue("");
                      return;
                    }
                    if (!selectedIds.includes(id)) {
                      field.onChange([...selectedIds, id]);
                    }
                    setTagSelectValue("");
                    setSkillSearch("");
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:border-slate-700/70">
                      <SelectValue placeholder="Chọn kỹ năng" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700">
                    {JOB_TAGS.map((tag) => (
                      <SelectItem key={tag.id} value={String(tag.id)} className="text-slate-900 dark:text-slate-100">
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="flex items-center gap-1 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <span>{tag.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                          onClick={() => {
                            field.onChange(selectedIds.filter((id) => id !== tag.id));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="requirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-900 dark:text-slate-200">Yêu cầu kỹ năng</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-32 bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                  placeholder="Nhập yêu cầu kỹ năng (mỗi dòng là một yêu cầu)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-900 dark:text-slate-200">Mô tả công việc</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-32 bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                  placeholder="Mô tả chi tiết về công việc, trách nhiệm, yêu cầu..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} className="dark:bg-slate-900/70 dark:text-slate-100 dark:border-slate-700">
              Hủy
            </Button>
          ) : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang đăng..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
