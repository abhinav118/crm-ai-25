
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Conversation } from '@/pages/Inbox';

export const useConversations = (filterStatus: string, sortOrder: 'newest' | 'oldest') => {
  return useQuery({
    queryKey: ['conversations', filterStatus, sortOrder],
    queryFn: async (): Promise<Conversation[]> => {
      console.log('Fetching conversations with optimized query...');
      
      try {
        // Single optimized query that gets contacts with their latest messages
        const { data: conversationData, error } = await supabase
          .from('contacts')
          .select(`
            id,
            first_name,
            last_name,
            phone,
            email,
            created_at,
            updated_at
          `)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Error fetching contacts:', error);
          throw error;
        }

        if (!conversationData || conversationData.length === 0) {
          console.log('No contacts found');
          return [];
        }

        console.log(`Found ${conversationData.length} contacts, fetching their latest messages...`);

        const conversations: Conversation[] = [];

        // Get latest messages for all contacts in a more efficient way
        for (const contact of conversationData) {
          try {
            // Get the latest message for this contact using maybeSingle() to avoid errors
            const { data: lastMessage, error: messageError } = await supabase
              .from('messages')
              .select('*')
              .eq('contact_id', contact.id)
              .order('sent_at', { ascending: false })
              .limit(1)
              .maybeSingle(); // This prevents errors when no messages exist

            if (messageError) {
              console.error(`Error fetching messages for contact ${contact.id}:`, messageError);
              continue; // Skip this contact but don't fail the entire query
            }

            // Count unread messages (messages from contact)
            const { count: unreadCount, error: countError } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('contact_id', contact.id)
              .eq('sender', 'contact');

            if (countError) {
              console.error(`Error counting unread messages for contact ${contact.id}:`, countError);
            }

            // Include contact even if they have no messages (for new contacts)
            conversations.push({
              contact,
              lastMessage: lastMessage ? {
                ...lastMessage,
                sender: lastMessage.sender as 'user' | 'contact'
              } : null,
              unreadCount: unreadCount || 0,
              assignedTo: null // Will be enhanced when assignment logic is added
            });

          } catch (contactError) {
            console.error(`Error processing contact ${contact.id}:`, contactError);
            // Continue with other contacts even if one fails
            continue;
          }
        }

        // Sort conversations by last message time, putting contacts with no messages at the end
        conversations.sort((a, b) => {
          const aTime = a.lastMessage ? new Date(a.lastMessage.sent_at).getTime() : 0;
          const bTime = b.lastMessage ? new Date(b.lastMessage.sent_at).getTime() : 0;
          
          if (aTime === 0 && bTime === 0) {
            // Both have no messages, sort by contact creation/update time
            return new Date(b.contact.updated_at).getTime() - new Date(a.contact.updated_at).getTime();
          }
          
          return sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
        });

        console.log(`Successfully fetched ${conversations.length} conversations`);
        console.log('Conversations with messages:', conversations.filter(c => c.lastMessage).length);
        console.log('Conversations without messages:', conversations.filter(c => !c.lastMessage).length);
        
        return conversations;

      } catch (error) {
        console.error('Fatal error in useConversations:', error);
        throw error;
      }
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });
};
