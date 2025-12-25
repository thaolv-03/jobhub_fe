
'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { JobSeekerProfileGateProvider } from '@/contexts/job-seeker-profile-context';
import { ThemeProvider } from './theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <JobSeekerProfileGateProvider>
          {children}
        </JobSeekerProfileGateProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
