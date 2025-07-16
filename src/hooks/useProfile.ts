
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  mobileNumber: string;
  timeZone: string;
  textableNumber: string;
}

export const useProfile = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const fetchProfile = async () => {
    if (!user || !isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is okay for new users
        console.error('Error fetching profile:', profileError);
      }

      console.log('Profile data fetched:', { user, profile });

      // Set profile data
      setProfileData({
        id: user.id,
        email: user.email,
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        company: profile?.company || '',
        mobileNumber: profile?.mobile_number || '',
        timeZone: profile?.time_zone || 'America/New_York',
        textableNumber: profile?.textable_number || '',
      });
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Omit<ProfileData, 'id' | 'email'>>) => {
    if (!profileData || !user) return;

    try {
      setUpdating(true);

      // Format mobile number if provided
      const formattedUpdates = {
        ...updates,
        ...(updates.mobileNumber && {
          mobileNumber: formatPhoneNumber(updates.mobileNumber)
        })
      };

      console.log('Updating profile with:', formattedUpdates);

      // Update user_profiles table
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: profileData.id,
          first_name: formattedUpdates.firstName ?? profileData.firstName,
          last_name: formattedUpdates.lastName ?? profileData.lastName,
          company: formattedUpdates.company ?? profileData.company,
          mobile_number: formattedUpdates.mobileNumber ?? profileData.mobileNumber,
          time_zone: formattedUpdates.timeZone ?? profileData.timeZone,
          textable_number: formattedUpdates.textableNumber ?? profileData.textableNumber,
          email: profileData.email,
        });

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to update profile',
          variant: 'destructive',
        });
        return;
      }

      // Update local state
      setProfileData(prev => prev ? { ...prev, ...formattedUpdates } : null);
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Error in updateProfile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return false;

    try {
      setUpdatingPassword(true);

      // First verify the current password
      const { data: loginData, error: fetchError } = await supabase
        .from('user_logins')
        .select('login_password')
        .eq('login_email', user.email)
        .single();

      if (fetchError || !loginData) {
        console.error('Error fetching login data:', fetchError);
        toast({
          title: 'Error',
          description: 'Failed to verify current password',
          variant: 'destructive',
        });
        return false;
      }

      // Verify current password matches
      if (loginData.login_password !== currentPassword) {
        toast({
          title: 'Error',
          description: 'Current password is incorrect',
          variant: 'destructive',
        });
        return false;
      }

      // Update password in user_logins table
      const { error: updateError } = await supabase
        .from('user_logins')
        .update({ login_password: newPassword })
        .eq('login_email', user.email);

      if (updateError) {
        console.error('Error updating password:', updateError);
        toast({
          title: 'Error',
          description: 'Failed to update password',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Success',
        description: 'Password updated successfully',
      });
      return true;
    } catch (error) {
      console.error('Error in updatePassword:', error);
      toast({
        title: 'Error',
        description: 'Failed to update password',
        variant: 'destructive',
      });
      return false;
    } finally {
      setUpdatingPassword(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfile();
    } else {
      setLoading(false);
      setProfileData(null);
    }
  }, [user, isAuthenticated]);

  return {
    profileData,
    loading,
    updating,
    updatingPassword,
    updateProfile,
    updatePassword,
    refetch: fetchProfile,
  };
};
