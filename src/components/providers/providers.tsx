
'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { JobSeekerProfileGateProvider } from '@/contexts/job-seeker-profile-context';
import { ThemeProvider } from './theme-provider';
import { QueryProvider } from './query-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <JobSeekerProfileGateProvider>
            {children}
          </JobSeekerProfileGateProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
