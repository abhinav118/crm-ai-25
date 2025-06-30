
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import type { Message } from '@/pages/Inbox';

export const useMessages = (contactId: string) => {
  const query = useQuery({
    queryKey: ['messages', contactId],
    queryFn: async (): Promise<Message[]> => {
      console.log('Fetching messages for contact:', contactId);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contact_id', contactId)
        .order('sent_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      console.log('Fetched messages:', data?.length || 0);
      
      // Type cast the database results to match our Message interface
      return (data || []).map(msg => ({
        ...msg,
        sender: msg.sender as 'user' | 'contact'
      }));
    },
    enabled: !!contactId,
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!contactId) return;

    console.log('Setting up real-time subscription for contact:', contactId);
    
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `contact_id=eq.${contactId}`
        },
        (payload) => {
          console.log('Real-time message update:', payload);
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [contactId, query]);

  return query;
};
