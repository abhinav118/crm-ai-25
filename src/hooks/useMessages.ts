
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface Message {
  id: string;
  contact_id: string;
  content: string;
  sender: 'user' | 'contact';
  channel: 'sms' | 'email';
  sent_at: string;
}

export function useMessages(contactId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contact_id', contactId)
        .order('sent_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!contactId,
  });

  // Set up real-time subscription for this contact's messages
  useEffect(() => {
    if (!contactId) return;

    const channel = supabase
      .channel(`messages-${contactId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `contact_id=eq.${contactId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['messages', contactId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contactId, queryClient]);

  return query;
}
