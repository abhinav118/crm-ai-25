
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, User, Search, Filter, SortDesc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type Conversation = {
  contactId: string;
  contactName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messageCount: number;
};

const Conversations: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchConversations();
  }, []);
  
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = conversations.filter(
        convo => convo.contactName.toLowerCase().includes(query)
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);
  
  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching conversations...');
      
      // First get all contacts
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id, name');
        
      if (contactsError) {
        console.error('Error fetching contacts:', contactsError);
        throw contactsError;
      }
      
      if (!contacts || contacts.length === 0) {
        console.log('No contacts found');
        setConversations([]);
        setFilteredConversations([]);
        setIsLoading(false);
        return;
      }
      
      console.log(`Found ${contacts.length} contacts`);
      
      // For each contact, get their latest message
      const conversationsData = await Promise.all((contacts || []).map(async (contact) => {
        try {
          const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .eq('contact_id', contact.id)
            .order('sent_at', { ascending: false })
            .limit(1);
            
          if (messagesError) {
            console.error(`Error fetching messages for contact ${contact.id}:`, messagesError);
            return null;
          }
          
          // Get message count for this contact
          const { count: messageCount, error: countError } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('contact_id', contact.id);
            
          if (countError) {
            console.error(`Error counting messages for contact ${contact.id}:`, countError);
            return null;
          }
          
          // If contact has messages, create a conversation object
          if (messages && messages.length > 0) {
            return {
              contactId: contact.id,
              contactName: contact.name,
              lastMessage: messages[0].content,
              lastMessageTime: messages[0].sent_at,
              unreadCount: 0, // Mock unread count for now
              messageCount: messageCount || 0
            };
          }
          return null;
        } catch (err) {
          console.error(`Error processing contact ${contact.id}:`, err);
          return null;
        }
      }));
      
      // Filter out contacts with no messages and null results
      const validConversations = conversationsData.filter(Boolean) as Conversation[];
      
      console.log(`Found ${validConversations.length} valid conversations`);
      
      // Sort by most recent message
      validConversations.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
      
      setConversations(validConversations);
      setFilteredConversations(validConversations);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      toast({
        title: 'Error loading conversations',
        description: 'There was a problem loading your conversations. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      
      if (date.toDateString() === today.toDateString()) {
        // Return time if today
        return format(date, 'h:mm a');
      } else {
        // Return date if not today
        return format(date, 'MMM d');
      }
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };
  
  const truncateMessage = (message: string, maxLength = 50) => {
    return message.length > maxLength
      ? message.substring(0, maxLength) + '...'
      : message;
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Conversations</h2>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button size="sm" variant="outline">
            <SortDesc className="mr-2 h-4 w-4" />
            Sort
          </Button>
        </div>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder="Search conversations..."
          className="pl-10"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>
      
      <Card>
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4 py-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : filteredConversations.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Last Message</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConversations.map((convo) => (
                  <TableRow 
                    key={convo.contactId}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => console.log('Open conversation:', convo.contactId)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 text-primary h-10 w-10 rounded-full flex items-center justify-center">
                          <User size={20} />
                        </div>
                        <span>{convo.contactName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {truncateMessage(convo.lastMessage)}
                    </TableCell>
                    <TableCell>{convo.messageCount}</TableCell>
                    <TableCell>{formatDate(convo.lastMessageTime)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="text-primary" size={24} />
            </div>
            <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
            <p className="text-muted-foreground mb-4">Start messaging your contacts to begin conversations</p>
            <Button>Start a conversation</Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Conversations;
