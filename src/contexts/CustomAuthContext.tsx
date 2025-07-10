
import React, { createContext, useContext, ReactNode } from 'react';
import { useCustomAuth, UserProfile } from '@/hooks/useCustomAuth';

interface CustomAuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const CustomAuthContext = createContext<CustomAuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(CustomAuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within a CustomAuthProvider');
  }
  return context;
};

interface CustomAuthProviderProps {
  children: ReactNode;
}

export const CustomAuthProvider = ({ children }: CustomAuthProviderProps) => {
  const auth = useCustomAuth();

  return (
    <CustomAuthContext.Provider value={auth}>
      {children}
    </CustomAuthContext.Provider>
  );
};
