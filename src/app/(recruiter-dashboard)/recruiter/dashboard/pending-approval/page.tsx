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
      const lineClass = isDone || isActive ? "bg-emerald-500" : "bg-muted-foreground/30";
      return (
        <div key={step.label} className="flex flex-1 flex-col items-center text-center">
          <div className="flex w-full items-center">
            <div className={`h-[2px] flex-1 ${index === 0 ? "bg-transparent" : lineClass}`} />
            <div
              className={[
                "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold",
                isDone ? "border-emerald-500 bg-emerald-500 text-white" : "",
                isActive ? "border-emerald-500 text-emerald-600" : "",
                step.status === "inactive" ? "border-muted-foreground/30 text-muted-foreground" : "",
              ].join(" ")}
            >
              {isDone ? <Check className="h-4 w-4 text-white" /> : index + 1}
            </div>
            <div className={`h-[2px] flex-1 ${index === steps.length - 1 ? "bg-transparent" : lineClass}`} />
          </div>
          <span
            className={[
              "mt-2 text-xs font-medium",
              isDone ? "text-emerald-600" : "",
              isActive ? "text-emerald-700" : "",
              step.status === "inactive" ? "text-muted-foreground" : "",
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
         description: 'Company information is not available yet.',
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
         title: 'Company updated',
         description: 'Company information was saved successfully.',
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
         title: 'Upload failed',
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
     <main className="flex min-h-[calc(100vh-113px)] flex-col items-center gap-6 p-4 md:gap-8 md:p-8">
       <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.35fr,1fr]">
         <Card className="text-center">
           <CardHeader>
             <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
               <Clock className="h-8 w-8" />
             </div>
             <CardTitle className="text-2xl font-bold">Your request is being reviewed</CardTitle>
             <CardDescription className="text-lg">
               Thanks for submitting your recruiter upgrade. We will notify you by email once approved.
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
             <p className="text-muted-foreground">
               We are reviewing your profile. Notifications will be sent to <span className="font-semibold text-foreground">{account?.email}</span>.
             </p>
             <p className="text-sm text-muted-foreground">
               Typical review time is within 24 business hours.
             </p>
             <Button variant="outline" onClick={checkStatus} disabled={isCheckingStatus}>
               {isCheckingStatus ? 'Checking...' : 'Check approval status'}
             </Button>
           </CardContent>
         </Card>

         <div className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>Verification checklist</CardTitle>
               <CardDescription>Complete these items to help admins approve faster.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <Progress value={progressValue} />
               <div className="flex items-center justify-between text-sm">
                 <span>Completed</span>
                 <span className="font-medium">{progressValue}%</span>
               </div>
               <div className="space-y-2 text-sm">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     {companyComplete ? <FileCheck2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                     <span>Company information</span>
                   </div>
                   <Badge variant={companyComplete ? 'secondary' : 'outline'}>{companyComplete ? 'Done' : 'Pending'}</Badge>
                 </div>
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     {documentsComplete ? <FileCheck2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                     <span>Business registration</span>
                   </div>
                   <Badge variant={documentsComplete ? 'secondary' : 'outline'}>{documentsComplete ? 'Done' : 'Pending'}</Badge>
                 </div>
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     {approvalComplete ? <FileCheck2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                     <span>Waiting for admin approval</span>
                   </div>
                   <Badge variant={approvalComplete ? 'secondary' : 'outline'}>{approvalComplete ? 'Done' : 'Pending'}</Badge>
                 </div>
               </div>
             </CardContent>
           </Card>

           {showCompanyForm && (
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Building2 className="h-5 w-5" />
                   Update company info
                 </CardTitle>
                 <CardDescription>Keep company data accurate for faster review.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="company-name">Company name</Label>
                   <Input
                     id="company-name"
                     value={companyForm.companyName}
                     onChange={(event) => setCompanyForm((prev) => ({ ...prev, companyName: event.target.value }))}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="company-location">Location</Label>
                   <Input
                     id="company-location"
                     value={companyForm.location}
                     onChange={(event) => setCompanyForm((prev) => ({ ...prev, location: event.target.value }))}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="company-website">Website</Label>
                   <Input
                     id="company-website"
                     value={companyForm.website}
                     onChange={(event) => setCompanyForm((prev) => ({ ...prev, website: event.target.value }))}
                   />
                 </div>
                 <Button type="button" onClick={handleCompanySave} disabled={isSavingCompany}>
                   {isSavingCompany ? 'Saving...' : 'Save company info'}
                 </Button>
               </CardContent>
             </Card>
           )}

           {showBusinessRegistration && (
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <UploadCloud className="h-5 w-5" />
                   Upload business registration
                 </CardTitle>
                 <CardDescription>Upload a PDF or image file for admin verification.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="doc-upload">Select document</Label>
                   <Input
                     id="doc-upload"
                     type="file"
                     ref={fileInputRef}
                     onChange={handleUploadDocument}
                     disabled={isUploadingDoc}
                   />
                 </div>
                 <div className="space-y-2 text-sm">
                   {documents.length === 0 && <p className="text-muted-foreground">No documents uploaded yet.</p>}
                   {documents.map((doc) => (
                     <div key={doc.documentId} className="flex items-center justify-between gap-2">
                       <span className="truncate">{doc.fileName}</span>
                       <a className="text-primary underline" href={doc.downloadUrl} target="_blank" rel="noreferrer">
                         View
                       </a>
                     </div>
                   ))}
                 </div>
                 <Button type="button" variant="outline" onClick={fetchDocuments} disabled={isUploadingDoc}>
                   Refresh documents
                 </Button>
               </CardContent>
             </Card>
           )}
         </div>
       </div>
     </main>
   );
 }

