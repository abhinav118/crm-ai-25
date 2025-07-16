
import { useState, useEffect, useCallback } from 'react';
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

  const updateAuthState = useCallback((newState: Partial<AuthState>) => {
    console.log('useAuth: Updating auth state:', newState);
    setAuthState(prev => {
      const updated = { ...prev, ...newState };
      console.log('useAuth: Auth state updated from:', prev, 'to:', updated);
      return updated;
    });
  }, []);

  const checkSession = useCallback(() => {
    console.log('useAuth: Checking session...');
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) {
      console.log('useAuth: No session data found');
      updateAuthState({ loading: false, isAuthenticated: false, user: null });
      return false;
    }

    try {
      const { user, timestamp } = JSON.parse(sessionData);
      const now = Date.now();
      const isExpired = (now - timestamp) > SESSION_DURATION;

      console.log('useAuth: Session data found:', { user: user.email, timestamp, isExpired });

      if (isExpired) {
        console.log('useAuth: Session expired');
        localStorage.removeItem(SESSION_KEY);
        updateAuthState({ loading: false, isAuthenticated: false, user: null });
        return false;
      }

      console.log('useAuth: Valid session found for user:', user.email);
      updateAuthState({
        user,
        loading: false,
        isAuthenticated: true,
      });
      return true;
    } catch (error) {
      console.error('useAuth: Error parsing session data:', error);
      localStorage.removeItem(SESSION_KEY);
      updateAuthState({ loading: false, isAuthenticated: false, user: null });
      return false;
    }
  }, [updateAuthState]);

  const login = async (email: string, password: string) => {
    try {
      console.log('useAuth: Starting login for:', email);
      updateAuthState({ loading: true });

      const { data, error } = await supabase
        .from('user_logins')
        .select('id, login_email, login_password')
        .eq('login_email', email)
        .single();

      if (error || !data) {
        console.log('useAuth: Login failed - user not found or error:', error);
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password',
          variant: 'destructive',
        });
        updateAuthState({ loading: false });
        return false;
      }

      // Note: This is a simple password check. In production, passwords should be hashed.
      if (data.login_password !== password) {
        console.log('useAuth: Login failed - invalid password');
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password',
          variant: 'destructive',
        });
        updateAuthState({ loading: false });
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

      console.log('useAuth: Login successful, storing session for user:', user.email);
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      
      updateAuthState({
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
      console.error('useAuth: Login error:', error);
      toast({
        title: 'Login Failed',
        description: 'An error occurred during login',
        variant: 'destructive',
      });
      updateAuthState({ loading: false });
      return false;
    }
  };

  const logout = useCallback(() => {
    console.log('useAuth: Logging out user');
    localStorage.removeItem(SESSION_KEY);
    updateAuthState({
      user: null,
      loading: false,
      isAuthenticated: false,
    });
    toast({
      title: 'Logged Out',
      description: 'You have been logged out successfully',
    });
  }, [updateAuthState, toast]);

  useEffect(() => {
    console.log('useAuth: Component mounted, checking initial session');
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
            console.log('useAuth: Session expired during periodic check');
            logout();
            toast({
              title: 'Session Expired',
              description: 'Please log in again',
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('useAuth: Error checking session during periodic check:', error);
          logout();
        }
      }
    }, 60000); // Check every minute

    return () => {
      console.log('useAuth: Component unmounting, clearing interval');
      clearInterval(interval);
    };
  }, [checkSession, logout, toast]);

  return {
    ...authState,
    login,
    logout,
    checkSession,
  };
};
