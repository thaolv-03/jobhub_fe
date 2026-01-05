'use client';

 import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
 import { useRouter } from 'next/navigation';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Progress } from '@/components/ui/progress';
 import { useAuth } from '@/hooks/use-auth';
 import { useToast } from '@/hooks/use-toast';
 import { apiRequest, ApiError } from '@/lib/api-client';
import { getAccount, RoleName } from '@/lib/auth';
import { updateAccount } from '@/lib/auth-storage';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { Building2, Check, Circle, Clock, FileCheck2, UploadCloud } from 'lucide-react';

 type RecruiterProfileResponse = {
   recruiterId: number;
   companyId: number;
   companyName: string;
   position: string;
   phone: string;
   status: 'PENDING' | 'APPROVED' | 'REJECTED';
 };

 type CompanyResponse = {
   companyId: number;
   companyName: string;
   location: string;
   website?: string | null;
   avatarUrl?: string | null;
   isApproved?: boolean | null;
 };

type RecruiterDocument = {
  documentId: number;
  fileKey: string;
  downloadUrl: string;
  fileName: string;
  contentType: string;
};

type StepStatus = "done" | "active" | "inactive";

const StepIndicator = ({ steps }: { steps: Array<{ label: string; status: StepStatus }> }) => (
  <div className="flex items-center justify-between gap-4">
    {steps.map((step, index) => {
      const isDone = step.status === "done";
      const isActive = step.status === "active";
      const lineClass = isDone || isActive ? "bg-primary" : "bg-muted-foreground/30 dark:bg-slate-700/60";
      return (
        <div key={step.label} className="flex flex-1 flex-col items-center text-center">
          <div className="flex w-full items-center">
            <div className={`h-[2px] flex-1 ${index === 0 ? "bg-transparent" : lineClass}`} />
            <div
              className={[
                "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold",
                isDone ? "border-primary bg-primary text-primary-foreground" : "",
                isActive ? "border-primary text-primary dark:text-primary" : "",
                step.status === "inactive" ? "border-muted-foreground/30 text-muted-foreground dark:border-slate-700 dark:text-slate-400" : "",
              ].join(" ")}
            >
              {isDone ? <Check className="h-4 w-4 text-white" /> : index + 1}
            </div>
            <div className={`h-[2px] flex-1 ${index === steps.length - 1 ? "bg-transparent" : lineClass}`} />
          </div>
          <span
            className={[
              "mt-2 text-xs font-medium",
              isDone ? "text-primary dark:text-primary" : "",
              isActive ? "text-primary dark:text-primary" : "",
              step.status === "inactive" ? "text-muted-foreground dark:text-slate-400" : "",
            ].join(" ")}
          >
            {step.label}
          </span>
        </div>
      );
    })}
  </div>
);

 export default function PendingApprovalPage() {
   const { account, accessToken, reload } = useAuth();
   const { toast } = useToast();
   const router = useRouter();
   const fileInputRef = useRef<HTMLInputElement | null>(null);

   const [recruiter, setRecruiter] = useState<RecruiterProfileResponse | null>(null);
   const [company, setCompany] = useState<CompanyResponse | null>(null);
   const [documents, setDocuments] = useState<RecruiterDocument[]>([]);
   const [isCheckingStatus, setIsCheckingStatus] = useState(false);
   const [isSavingCompany, setIsSavingCompany] = useState(false);
   const [isUploadingDoc, setIsUploadingDoc] = useState(false);
   const [companyForm, setCompanyForm] = useState({
     companyName: '',
     location: '',
     website: '',
   });
   const [companyUpdated, setCompanyUpdated] = useState(false);

   const promoteRecruiterRole = useCallback(() => {
     const cached = getAccount();
     if (!cached) {
       return;
     }
     const hasRecruiter = cached.roles?.some((role) => role.roleName === 'RECRUITER');
     const nextRoles = (cached.roles || []).filter((role) => role.roleName !== 'RECRUITER_PENDING');
     if (!hasRecruiter) {
       nextRoles.push({
         roleId: -2,
         roleName: 'RECRUITER' as RoleName,
         roleDescription: 'Recruiter (client fallback)',
         permissions: [],
       });
     }
     const updated = { ...cached, roles: nextRoles };
     localStorage.setItem('jobhub_account', JSON.stringify(updated));
     reload();
   }, [reload]);

  const fetchRecruiter = useCallback(async () => {
    if (!accessToken) {
      return;
    }
    try {
      const response = await apiRequest<RecruiterProfileResponse>('/api/recruiters/me', {
        method: 'GET',
        accessToken,
      });
      setRecruiter(response.data);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      const isNotFound = apiError?.code === 404 || apiError?.status?.toLowerCase().includes('not_found');
      if (isNotFound) {
        localStorage.removeItem('jobhub_consulting_submitted');
        localStorage.removeItem('jobhub_upgrade_company_source');
        updateAccount<any>((current) => {
          if (!current || !Array.isArray(current.roles)) return current;
          return {
            ...current,
            roles: current.roles.filter(
              (role: { roleName?: string }) => role.roleName !== 'RECRUITER' && role.roleName !== 'RECRUITER_PENDING'
            ),
          };
        });
        router.replace('/recruiter/dashboard/upgrade-recruiter');
      }
      throw error;
    }
  }, [accessToken, router]);

   const fetchCompany = useCallback(
     async (companyId?: number) => {
       if (!accessToken || !companyId) {
         return;
       }
       const response = await apiRequest<CompanyResponse>(`/api/companies/${companyId}`, {
         method: 'GET',
         accessToken,
       });
       setCompany(response.data);
       setCompanyForm({
         companyName: response.data.companyName || '',
         location: response.data.location || '',
         website: response.data.website || '',
       });
       return response.data;
     },
     [accessToken]
   );

   const fetchDocuments = useCallback(async () => {
     if (!accessToken) {
       return;
     }
     const response = await apiRequest<RecruiterDocument[]>('/api/recruiters/documents', {
       method: 'GET',
       accessToken,
     });
     setDocuments(response.data || []);
   }, [accessToken]);

   const checkStatus = useCallback(async () => {
     if (!accessToken || isCheckingStatus) {
       return;
     }
     setIsCheckingStatus(true);
     try {
       const data = await fetchRecruiter();
       if (data?.status === 'APPROVED') {
         promoteRecruiterRole();
         router.replace('/recruiter/dashboard');
       }
    } catch (error) {
      const apiError = error as ApiError;
      const isNotFound = apiError?.code === 404 || apiError?.status?.toLowerCase().includes('not_found');
      if (isNotFound) {
        return;
      }
      toast({
        variant: 'destructive',
        title: 'Status check failed',
        description: apiError.message || 'Could not check recruiter status.',
      });
     } finally {
       setIsCheckingStatus(false);
     }
   }, [accessToken, fetchRecruiter, isCheckingStatus, promoteRecruiterRole, router, toast]);

   useEffect(() => {
     if (!accessToken) {
       return;
     }
    const init = async () => {
      try {
        const recruiterData = await fetchRecruiter();
        if (recruiterData?.companyId) {
          await fetchCompany(recruiterData.companyId);
        }
        await fetchDocuments();
      } catch (error) {
        // handled in fetchRecruiter
      }
    };
    void init();
  }, [accessToken, fetchCompany, fetchDocuments, fetchRecruiter]);

   useEffect(() => {
     if (!accessToken) {
       return;
     }
     const interval = setInterval(() => {
       void checkStatus();
     }, 15000);
     return () => clearInterval(interval);
   }, [accessToken, checkStatus]);

   const handleCompanySave = async () => {
     if (!recruiter?.companyId) {
       toast({
         variant: 'destructive',
         title: 'Missing company',
        description: 'Thông tin công ty chưa sẵn sàng.',
       });
       return;
     }
     setIsSavingCompany(true);
     try {
       const response = await apiRequest<CompanyResponse>(`/api/companies/${recruiter.companyId}`, {
         method: 'PATCH',
         accessToken,
         body: {
           companyName: companyForm.companyName,
           location: companyForm.location,
           website: companyForm.website,
         },
       });
       setCompany(response.data);
       setCompanyUpdated(true);
       toast({
        title: 'Cập nhật công ty',
        description: 'Thông tin công ty đã được lưu.',
       });
     } catch (error) {
       const apiError = error as ApiError;
       toast({
         variant: 'destructive',
         title: 'Update failed',
         description: apiError.message || 'Could not update company info.',
       });
     } finally {
       setIsSavingCompany(false);
     }
   };

   const handleUploadDocument = async (event: React.ChangeEvent<HTMLInputElement>) => {
     const file = event.target.files?.[0];
     if (!file || !accessToken) {
       return;
     }
     setIsUploadingDoc(true);
     try {
       const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
       const formData = new FormData();
       formData.append('file', file);
       await fetchWithAuth(`${baseUrl}/api/recruiters/documents`, {
         method: 'POST',
         body: formData,
         accessToken,
       });
       toast({
         title: 'Document uploaded',
         description: 'Your registration document was uploaded.',
       });
       if (fileInputRef.current) {
         fileInputRef.current.value = '';
       }
       await fetchDocuments();
     } catch (error) {
       const apiError = error as ApiError;
       toast({
         variant: 'destructive',
        title: 'Tải lên thất bại',
         description: apiError.message || 'Could not upload document.',
       });
     } finally {
       setIsUploadingDoc(false);
     }
   };

   const upgradeCompanySource = typeof window !== 'undefined'
     ? localStorage.getItem('jobhub_upgrade_company_source')
     : null;
  const normalizedSource = upgradeCompanySource?.toLowerCase();
  const isExistingCompany = normalizedSource === 'existing' || company?.isApproved === true;
   const showCompanyForm = !isExistingCompany;
   const showBusinessRegistration = !isExistingCompany;

   const companyComplete = useMemo(() => {
     if (companyUpdated) {
       return true;
     }
     if (recruiter?.companyId) {
       return true;
     }
     return Boolean(company?.companyName && company?.location);
   }, [company, companyUpdated, recruiter]);

   const documentsComplete = isExistingCompany ? true : documents.length > 0;
   const approvalComplete = recruiter?.status === 'APPROVED';
   const totalSteps = 3;
   const completedSteps = [companyComplete, documentsComplete, approvalComplete].filter(Boolean).length;
   const progressValue = Math.round((completedSteps / totalSteps) * 100);

   return (
     <main className="flex min-h-[calc(100vh-113px)] flex-col items-center gap-6 bg-slate-50 p-4 md:gap-8 md:p-8 dark:bg-slate-950">
       <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.35fr,1fr]">
         <Card className="text-center border-border/60 bg-background/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
           <CardHeader>
             <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
               <Clock className="h-8 w-8" />
             </div>
              <CardTitle className="text-2xl font-bold dark:text-slate-100">Yêu cầu của bạn đang được xem xét</CardTitle>
              <CardDescription className="text-lg dark:text-slate-300">
                Cảm ơn bạn đã gửi yêu cầu nâng cấp nhà tuyển dụng. Chúng tôi sẽ thông báo qua email khi được duyệt.
              </CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <StepIndicator
               steps={[
                 { label: "Thông tin nhà tuyển dụng", status: "done" },
                 { label: "Nhu cầu tư vấn", status: "done" },
                 { label: "Chờ phê duyệt", status: "active" },
               ]}
             />
              <p className="text-muted-foreground dark:text-slate-300">
                Hồ sơ của bạn đang được đánh giá. Thông báo sẽ được gửi đến <span className="font-semibold text-foreground dark:text-slate-100">{account?.email}</span>.
              </p>
              <p className="text-sm text-muted-foreground dark:text-slate-300">
                Thời gian xét duyệt thường trong vòng 24 giờ làm việc.
              </p>
              <Button variant="outline" className="hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground" onClick={checkStatus} disabled={isCheckingStatus}>
                {isCheckingStatus ? 'Đang kiểm tra...' : 'Kiểm tra trạng thái duyệt'}
              </Button>
           </CardContent>
         </Card>

         <div className="space-y-6">
           <Card className="border-border/60 bg-background/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
             <CardHeader>
                <CardTitle className="dark:text-slate-100">Danh sách xác minh</CardTitle>
                <CardDescription className="dark:text-slate-300">Hoàn tất các mục để admin phê duyệt nhanh hơn.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <Progress value={progressValue} className="bg-slate-200/70 dark:bg-slate-800/70" />
               <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>Hoàn tất</span>
                 <span className="font-medium">{progressValue}%</span>
               </div>
               <div className="space-y-2 text-sm text-slate-600 dark:text-slate-200">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     {companyComplete ? <FileCheck2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground dark:text-slate-400" />}
                      <span>Thông tin công ty</span>
                   </div>
                   <Badge
                     variant={companyComplete ? 'secondary' : 'outline'}
                     className={
                       companyComplete
                         ? 'bg-primary text-primary-foreground hover:bg-primary dark:bg-primary dark:text-primary-foreground'
                         : 'dark:text-slate-200'
                     }
                   >
                      {companyComplete ? 'Hoàn tất' : 'Đang chờ'}
                   </Badge>
                 </div>
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     {documentsComplete ? <FileCheck2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground dark:text-slate-400" />}
                      <span>Giấy phép kinh doanh</span>
                   </div>
                   <Badge
                     variant={documentsComplete ? 'secondary' : 'outline'}
                     className={
                       documentsComplete
                         ? 'bg-primary text-primary-foreground hover:bg-primary dark:bg-primary dark:text-primary-foreground'
                         : 'dark:text-slate-200'
                     }
                   >
                      {documentsComplete ? 'Hoàn tất' : 'Đang chờ'}
                   </Badge>
                 </div>
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     {approvalComplete ? <FileCheck2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground dark:text-slate-400" />}
                      <span>Chờ admin phê duyệt</span>
                   </div>
                   <Badge
                     variant={approvalComplete ? 'secondary' : 'outline'}
                     className={
                       approvalComplete
                         ? 'bg-primary text-primary-foreground hover:bg-primary dark:bg-primary dark:text-primary-foreground'
                         : 'dark:text-slate-200'
                     }
                   >
                      {approvalComplete ? 'Hoàn tất' : 'Đang chờ'}
                   </Badge>
                 </div>
               </div>
             </CardContent>
           </Card>

           {showCompanyForm && (
             <Card className="border-border/60 bg-background/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
               <CardHeader>
                 <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                   <Building2 className="h-5 w-5" />
                    Cập nhật thông tin công ty
                 </CardTitle>
                  <CardDescription className="dark:text-slate-300">Giữ dữ liệu công ty chính xác để xét duyệt nhanh hơn.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="company-name" className="text-slate-900 dark:text-slate-200">Tên công ty</Label>
                   <Input
                     id="company-name"
                     value={companyForm.companyName}
                     className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                     onChange={(event) => setCompanyForm((prev) => ({ ...prev, companyName: event.target.value }))}
                   />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="company-location" className="text-slate-900 dark:text-slate-200">Địa chỉ</Label>
                   <Input
                     id="company-location"
                     value={companyForm.location}
                     className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                     onChange={(event) => setCompanyForm((prev) => ({ ...prev, location: event.target.value }))}
                   />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="company-website" className="text-slate-900 dark:text-slate-200">Website</Label>
                   <Input
                     id="company-website"
                     value={companyForm.website}
                     className="bg-white dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70"
                     onChange={(event) => setCompanyForm((prev) => ({ ...prev, website: event.target.value }))}
                   />
                 </div>
                  <Button type="button" onClick={handleCompanySave} disabled={isSavingCompany}>
                    {isSavingCompany ? 'Đang lưu...' : 'Lưu thông tin công ty'}
                  </Button>
               </CardContent>
             </Card>
           )}

           {showBusinessRegistration && (
             <Card className="border-border/60 bg-background/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
               <CardHeader>
                 <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                   <UploadCloud className="h-5 w-5" />
                    Tải lên giấy phép kinh doanh
                 </CardTitle>
                  <CardDescription className="dark:text-slate-300">Tải lên file PDF hoặc ảnh để admin xác minh.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="doc-upload" className="text-slate-900 dark:text-slate-200">Chọn tài liệu</Label>
                   <Input
                     id="doc-upload"
                     type="file"
                     className="bg-white text-slate-800 file:text-slate-700 file:bg-slate-100 file:border-slate-200 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:border-slate-700/70 dark:file:text-slate-100 dark:file:bg-slate-800/70 dark:file:border-slate-700"
                     ref={fileInputRef}
                     onChange={handleUploadDocument}
                     disabled={isUploadingDoc}
                   />
                 </div>
                 <div className="space-y-2 text-sm">
                    {documents.length === 0 && <p className="text-muted-foreground dark:text-slate-300">Chưa có tài liệu nào được tải lên.</p>}
                   {documents.map((doc) => (
                     <div key={doc.documentId} className="flex items-center justify-between gap-2">
                       <span className="truncate">{doc.fileName}</span>
                        <a className="text-primary underline" href={doc.downloadUrl} target="_blank" rel="noreferrer">
                          Xem
                        </a>
                     </div>
                   ))}
                 </div>
                  <Button type="button" variant="outline" className="hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground" onClick={fetchDocuments} disabled={isUploadingDoc}>
                    Làm mới tài liệu
                  </Button>
               </CardContent>
             </Card>
           )}
         </div>
       </div>
     </main>
   );
 }

