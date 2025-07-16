
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  mobileNumber: string;
  timeZone: string;
}

export const useProfile = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

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
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error getting user:', userError);
        return;
      }

      // Get user login info (for email)
      const { data: loginData, error: loginError } = await supabase
        .from('user_logins')
        .select('login_email')
        .eq('id', user.id)
        .single();

      if (loginError) {
        console.error('Error fetching login data:', loginError);
      }

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

      // Set profile data
      setProfileData({
        id: user.id,
        email: loginData?.login_email || '',
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        company: profile?.company || '',
        mobileNumber: profile?.mobile_number || '',
        timeZone: profile?.time_zone || 'America/New_York',
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
    if (!profileData) return;

    try {
      setUpdating(true);

      // Format mobile number if provided
      const formattedUpdates = {
        ...updates,
        ...(updates.mobileNumber && {
          mobileNumber: formatPhoneNumber(updates.mobileNumber)
        })
      };

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

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profileData,
    loading,
    updating,
    updateProfile,
    refetch: fetchProfile,
  };
};
