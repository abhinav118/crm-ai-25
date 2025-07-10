
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  login_email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useCustomAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useCustomAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('crm_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('crm_user');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in with email:', email);
      
      const { data, error } = await supabase
        .from('user_logins')
        .select('*')
        .eq('login_email', email)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Database error:', error);
        return { error: 'User not found' };
      }

      if (!data) {
        return { error: 'User not found' };
      }

      // Compare password (in production, you should hash and compare)
      if (data.login_password !== password) {
        return { error: 'Invalid password' };
      }

      // Store user in localStorage and state
      const userProfile: UserProfile = {
        id: data.id,
        login_email: data.login_email,
        first_name: data.first_name,
        last_name: data.last_name,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      localStorage.setItem('crm_user', JSON.stringify(userProfile));
      setUser(userProfile);
      
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'Authentication failed' };
    }
  };

  const signOut = () => {
    localStorage.removeItem('crm_user');
    setUser(null);
  };

  return {
    user,
    loading,
    signIn,
    signOut
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};
