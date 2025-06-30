
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Contact } from '@/pages/Inbox';

export const useContact = (contactId: string) => {
  return useQuery({
    queryKey: ['contact', contactId],
    queryFn: async (): Promise<Contact> => {
      console.log('Fetching contact:', contactId);
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error) {
        console.error('Error fetching contact:', error);
        throw error;
      }

      return data;
    },
    enabled: !!contactId,
  });
};
