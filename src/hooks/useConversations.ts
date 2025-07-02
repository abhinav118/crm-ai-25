
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Conversation } from '@/pages/Inbox';
import { useDebounce } from '@/hooks/use-debounce';

export const useConversations = (filterStatus: 'open' | 'closed', sortOrder: 'newest' | 'oldest', searchTerm?: string) => {
  const debouncedSearchTerm = useDebounce(searchTerm || '', 300);
  
  return useQuery({
    queryKey: ['conversations', filterStatus, sortOrder, debouncedSearchTerm],
    queryFn: async (): Promise<Conversation[]> => {
      console.log('Fetching conversations...');
      
      try {
        // Build the query
        let query = supabase
          .from('contacts')
          .select(`
            id,
            first_name,
            last_name,
            phone,
            email,
            created_at,
            updated_at,
            messages!inner (
              id,
              content,
              sender,
              sent_at,
              channel,
              contact_id,
              is_read,
              direction
            )
          `);

        // Add search filters if search term exists
        if (debouncedSearchTerm && debouncedSearchTerm.length > 0) {
          query = query.or(`first_name.ilike.%${debouncedSearchTerm}%,last_name.ilike.%${debouncedSearchTerm}%,phone.ilike.%${debouncedSearchTerm}%`);
        }

        const { data: contactsWithMessages, error } = await query
          .order('updated_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('Error fetching conversations:', error);
          throw error;
        }

        if (!contactsWithMessages || contactsWithMessages.length === 0) {
          console.log('No conversations found');
          return [];
        }

        console.log(`Found ${contactsWithMessages.length} contacts with messages`);

        // Transform data to match our Conversation interface
        const conversations: Conversation[] = contactsWithMessages.map(contact => {
          // Get the latest message for this contact
          const messages = contact.messages || [];
          const sortedMessages = messages.sort((a, b) => 
            new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
          );
          const lastMessage = sortedMessages[0] || null;

          // Count unread inbound messages only (don't show alerts for outbound messages)
          const unreadCount = messages.filter(msg => 
            msg.direction === 'inbound' && !msg.is_read
          ).length;

          return {
            contact: {
              id: contact.id,
              first_name: contact.first_name,
              last_name: contact.last_name,
              phone: contact.phone,
              email: contact.email,
              created_at: contact.created_at,
              updated_at: contact.updated_at
            },
            lastMessage: lastMessage ? {
              id: lastMessage.id,
              contact_id: lastMessage.contact_id,
              content: lastMessage.content,
              sender: lastMessage.sender as 'user' | 'contact',
              sent_at: lastMessage.sent_at,
              channel: lastMessage.channel
            } : null,
            unreadCount,
            assignedTo: null // Will be enhanced when assignment logic is added
          };
        });

        // Filter conversations based on status (for now, all are considered 'open')
        const filteredConversations = conversations.filter(conv => {
          if (filterStatus === 'open') return true; // Show all for now
          if (filterStatus === 'closed') return false; // No closed conversations yet
          return true;
        });

        // Sort conversations by last message time
        filteredConversations.sort((a, b) => {
          const aTime = a.lastMessage ? new Date(a.lastMessage.sent_at).getTime() : 0;
          const bTime = b.lastMessage ? new Date(b.lastMessage.sent_at).getTime() : 0;
          
          return sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
        });

        console.log(`Successfully fetched ${filteredConversations.length} conversations`);
        
        return filteredConversations;

      } catch (error) {
        console.error('Fatal error in useConversations:', error);
        throw error;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};
