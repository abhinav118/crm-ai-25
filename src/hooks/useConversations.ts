
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
        let allConversations: Conversation[] = [];

        if (debouncedSearchTerm && debouncedSearchTerm.length > 0) {
          // Priority 1: Search by first_name
          const firstNameQuery = supabase
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
            `)
            .ilike('first_name', `%${debouncedSearchTerm}%`);

          // Priority 2: Search by last_name (excluding already found contacts)
          const lastNameQuery = supabase
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
            `)
            .ilike('last_name', `%${debouncedSearchTerm}%`);

          // Priority 3: Search by phone
          const phoneQuery = supabase
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
            `)
            .ilike('phone', `%${debouncedSearchTerm}%`);

          // Execute searches in priority order
          const [firstNameResults, lastNameResults, phoneResults] = await Promise.all([
            firstNameQuery,
            lastNameQuery,
            phoneQuery
          ]);

          if (firstNameResults.error) throw firstNameResults.error;
          if (lastNameResults.error) throw lastNameResults.error;
          if (phoneResults.error) throw phoneResults.error;

          // Combine results, removing duplicates while maintaining priority
          const foundContactIds = new Set<string>();
          const prioritizedContacts: any[] = [];

          // Add first_name matches first
          if (firstNameResults.data) {
            firstNameResults.data.forEach(contact => {
              if (!foundContactIds.has(contact.id)) {
                foundContactIds.add(contact.id);
                prioritizedContacts.push(contact);
              }
            });
          }

          // Add last_name matches second
          if (lastNameResults.data) {
            lastNameResults.data.forEach(contact => {
              if (!foundContactIds.has(contact.id)) {
                foundContactIds.add(contact.id);
                prioritizedContacts.push(contact);
              }
            });
          }

          // Add phone matches third
          if (phoneResults.data) {
            phoneResults.data.forEach(contact => {
              if (!foundContactIds.has(contact.id)) {
                foundContactIds.add(contact.id);
                prioritizedContacts.push(contact);
              }
            });
          }

          // Priority 4: Search by message content
          if (prioritizedContacts.length < 50) { // Limit message search to avoid performance issues
            const messageQuery = supabase
              .from('messages')
              .select(`
                contact_id,
                content,
                contacts!inner (
                  id,
                  first_name,
                  last_name,
                  phone,
                  email,
                  created_at,
                  updated_at
                )
              `)
              .ilike('content', `%${debouncedSearchTerm}%`)
              .limit(20);

            const messageResults = await messageQuery;
            if (messageResults.error) throw messageResults.error;

            if (messageResults.data) {
              // Get unique contacts from message search
              const messageContacts = messageResults.data.reduce((acc, msg) => {
                const contact = msg.contacts;
                if (!foundContactIds.has(contact.id)) {
                  foundContactIds.add(contact.id);
                  acc.push(contact);
                }
                return acc;
              }, [] as any[]);

              // Fetch full contact data with messages for message search results
              if (messageContacts.length > 0) {
                const contactIds = messageContacts.map(c => c.id);
                const fullContactQuery = supabase
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
                  `)
                  .in('id', contactIds);

                const fullContactResults = await fullContactQuery;
                if (fullContactResults.error) throw fullContactResults.error;

                if (fullContactResults.data) {
                  prioritizedContacts.push(...fullContactResults.data);
                }
              }
            }
          }

          console.log(`Found ${prioritizedContacts.length} contacts with messages from search`);
          
          // Transform prioritized results
          allConversations = prioritizedContacts.map(contact => {
            const messages = contact.messages || [];
            const sortedMessages = messages.sort((a, b) => 
              new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
            );
            const lastMessage = sortedMessages[0] || null;

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
              assignedTo: null
            };
          });

        } else {
          // No search term - fetch all conversations
          const query = supabase
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
          allConversations = contactsWithMessages.map(contact => {
            const messages = contact.messages || [];
            const sortedMessages = messages.sort((a, b) => 
              new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
            );
            const lastMessage = sortedMessages[0] || null;

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
              assignedTo: null
            };
          });
        }

        // Filter conversations based on status (for now, all are considered 'open')
        const filteredConversations = allConversations.filter(conv => {
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
