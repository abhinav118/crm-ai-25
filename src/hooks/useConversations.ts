
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Conversation } from '@/pages/Inbox';

export const useConversations = (filterStatus: string, sortOrder: 'newest' | 'oldest') => {
  return useQuery({
    queryKey: ['conversations', filterStatus, sortOrder],
    queryFn: async (): Promise<Conversation[]> => {
      console.log('Fetching conversations...');
      
      // Get all contacts with their latest messages
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (contactsError) {
        console.error('Error fetching contacts:', contactsError);
        throw contactsError;
      }

      const conversations: Conversation[] = [];

      for (const contact of contacts || []) {
        // Get the latest message for this contact
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('contact_id', contact.id)
          .order('sent_at', { ascending: false })
          .limit(1)
          .single();

        // Count unread messages (messages from contact that are newer than last user message)
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('contact_id', contact.id)
          .eq('sender', 'contact');

        // Only include contacts that have messages
        if (lastMessage) {
          conversations.push({
            contact,
            lastMessage,
            unreadCount: unreadCount || 0,
            assignedTo: null // Will be enhanced when assignment logic is added
          });
        }
      }

      // Sort conversations
      conversations.sort((a, b) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.sent_at).getTime() : 0;
        const bTime = b.lastMessage ? new Date(b.lastMessage.sent_at).getTime() : 0;
        
        return sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
      });

      console.log('Fetched conversations:', conversations.length);
      return conversations;
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });
};
