
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Account, getAccount, getAccessToken, clearAuthData, login as apiLogin, LoginRequest, logout as apiLogout, RoleName } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  account: Account | null;
  accessToken: string | null;
  roles: RoleName[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<Account>;
  logout: () => Promise<void>;
  reload: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkAuthState = useCallback(() => {
    setIsLoading(true);
    try {
        const storedAccount = getAccount();
        const token = getAccessToken();
        if (storedAccount && token) {
            setAccount(storedAccount);
            setAccessToken(token);
        } else {
            setAccount(null);
            setAccessToken(null);
        }
    } catch (error) {
        console.error("Failed to parse auth data from storage", error);
        clearAuthData();
        setAccount(null);
        setAccessToken(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAuthState();
    
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'jobhub_account' || event.key === 'jobhub_access_token') {
            checkAuthState();
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuthState]);

  const handleLogin = async (credentials: LoginRequest): Promise<Account> => {
    const account = await apiLogin(credentials);
    checkAuthState(); // Reload state from storage
    return account;
  };

  const handleLogout = async () => {
    try {
        await apiLogout();
    } catch (error) {
        console.error("API logout failed, clearing client-side data anyway.", error);
    } finally {
        clearAuthData();
        setAccount(null);
        setAccessToken(null);
    }
  };
  
  const roles = account?.roles.map(r => r.roleName) || [];

  return (
    <AuthContext.Provider
      value={{
        account,
        accessToken,
        roles,
        isAuthenticated: !!account && !!accessToken,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        reload: checkAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
