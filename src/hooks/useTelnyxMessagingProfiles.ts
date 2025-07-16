
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TelnyxNumberData {
  id: string;
  phone_number: string;
  messaging_profile_name: string;
  messaging_profile_id: string;
  type: string;
}

export interface TelnyxMessagingProfilesResponse {
  data: TelnyxNumberData[];
  total: number;
}

const fetchTelnyxMessagingProfiles = async (): Promise<TelnyxMessagingProfilesResponse> => {
  console.log('Fetching Telnyx messaging profiles...');
  
  const { data, error } = await supabase.functions.invoke('fetch-telnyx-messaging-profiles', {
    method: 'POST'
  });

  if (error) {
    console.error('Error fetching Telnyx messaging profiles:', error);
    throw new Error(`Failed to fetch messaging profiles: ${error.message}`);
  }

  console.log('Telnyx data received:', data);
  return data;
};

export const useTelnyxMessagingProfiles = () => {
  return useQuery({
    queryKey: ['telnyx-messaging-profiles'],
    queryFn: fetchTelnyxMessagingProfiles,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
  });
};
