
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const SESSION_KEY = 'auth_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
  });
  const { toast } = useToast();

  const checkSession = () => {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) {
      setAuthState(prev => ({ ...prev, loading: false }));
      return false;
    }

    try {
      const { user, timestamp } = JSON.parse(sessionData);
      const now = Date.now();
      const isExpired = (now - timestamp) > SESSION_DURATION;

      if (isExpired) {
        localStorage.removeItem(SESSION_KEY);
        setAuthState(prev => ({ ...prev, loading: false }));
        return false;
      }

      setAuthState({
        user,
        loading: false,
        isAuthenticated: true,
      });
      return true;
    } catch (error) {
      console.error('Error parsing session data:', error);
      localStorage.removeItem(SESSION_KEY);
      setAuthState(prev => ({ ...prev, loading: false }));
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase
        .from('user_logins')
        .select('id, login_email, login_password')
        .eq('login_email', email)
        .single();

      if (error || !data) {
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password',
          variant: 'destructive',
        });
        setAuthState(prev => ({ ...prev, loading: false }));
        return false;
      }

      // Note: This is a simple password check. In production, passwords should be hashed.
      if (data.login_password !== password) {
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password',
          variant: 'destructive',
        });
        setAuthState(prev => ({ ...prev, loading: false }));
        return false;
      }

      const user = {
        id: data.id,
        email: data.login_email,
      };

      const sessionData = {
        user,
        timestamp: Date.now(),
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      setAuthState({
        user,
        loading: false,
        isAuthenticated: true,
      });

      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: 'An error occurred during login',
        variant: 'destructive',
      });
      setAuthState(prev => ({ ...prev, loading: false }));
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setAuthState({
      user: null,
      loading: false,
      isAuthenticated: false,
    });
    toast({
      title: 'Logged Out',
      description: 'You have been logged out successfully',
    });
  };

  useEffect(() => {
    checkSession();

    // Check session validity every minute
    const interval = setInterval(() => {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (sessionData) {
        try {
          const { timestamp } = JSON.parse(sessionData);
          const now = Date.now();
          const isExpired = (now - timestamp) > SESSION_DURATION;

          if (isExpired) {
            logout();
            toast({
              title: 'Session Expired',
              description: 'Please log in again',
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('Error checking session:', error);
          logout();
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    ...authState,
    login,
    logout,
    checkSession,
  };
};
