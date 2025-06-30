
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface Conversation {
  id: string;
  contact_id: string;
  status: 'open' | 'closed';
  assigned_to?: string | null;
  assigned_at?: string | null;
  last_message_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  contact: {
    id: string;
    first_name: string;
    last_name?: string;
    phone?: string;
    email?: string;
  };
  last_message?: {
    content: string;
    sender: string;
    sent_at: string;
  };
  unread_count: number;
}

interface UseConversationsProps {
  status?: 'open' | 'closed';
  sortOrder?: 'newest' | 'oldest';
}

export function useConversations({ status = 'open', sortOrder = 'newest' }: UseConversationsProps) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['conversations', status, sortOrder],
    queryFn: async () => {
      // First get conversations with contact info
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, phone, email)
        `)
        .eq('status', status)
        .order('last_message_at', { ascending: sortOrder === 'oldest' });

      if (error) throw error;

      // Get last message for each conversation
      const conversationsWithMessages = await Promise.all(
        (conversations || []).map(async (conv) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, sender, sent_at')
            .eq('contact_id', conv.contact_id)
            .order('sent_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count (messages from contact that are newer than last read)
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('contact_id', conv.contact_id)
            .eq('sender', 'contact');

          return {
            ...conv,
            last_message: lastMessage,
            unread_count: unreadCount || 0
          };
        })
      );

      return conversationsWithMessages as Conversation[];
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Set up real-time subscriptions
  useEffect(() => {
    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      })
      .subscribe();

    const messagesChannel = supabase
      .channel('messages-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [queryClient]);

  return query;
}
