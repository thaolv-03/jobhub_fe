
'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { CandidateProfileGateProvider } from '@/contexts/candidate-profile-context';
import { ThemeProvider } from './theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CandidateProfileGateProvider>
          {children}
        </CandidateProfileGateProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
