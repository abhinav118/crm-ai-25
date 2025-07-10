
import React from 'react';
import { AuthProvider } from '@/hooks/useCustomAuth';

interface CustomAuthProviderProps {
  children: React.ReactNode;
}

export const CustomAuthProvider = ({ children }: CustomAuthProviderProps) => {
  return <AuthProvider>{children}</AuthProvider>;
};
