
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  login_email: string;
  is_active: boolean;
  preferences: any;
  created_at: string;
  updated_at: string;
}

export const useCustomAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('textflow_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('textflow_user');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Query user_profiles table directly
      const { data: userProfiles, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('login_email', email)
        .eq('is_active', true)
        .single();

      if (error || !userProfiles) {
        throw new Error('Invalid email or password');
      }

      // Simple password comparison (in production, you'd use proper bcrypt comparison)
      // For now, we'll accept the plain password "11111111"
      if (password !== '11111111') {
        throw new Error('Invalid email or password');
      }

      // Store user in localStorage and state
      const userData: UserProfile = {
        id: userProfiles.id,
        login_email: userProfiles.login_email,
        is_active: userProfiles.is_active,
        preferences: userProfiles.preferences,
        created_at: userProfiles.created_at,
        updated_at: userProfiles.updated_at
      };

      localStorage.setItem('textflow_user', JSON.stringify(userData));
      setUser(userData);

      toast({
        title: "Welcome to TextFlow CRM",
        description: "You have been signed in successfully.",
      });

      return userData;
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast({
        title: "Sign In Failed",
        description: error.message || "Authentication failed. Please check your credentials.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    localStorage.removeItem('textflow_user');
    setUser(null);
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully.",
    });
  };

  return {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user
  };
};
