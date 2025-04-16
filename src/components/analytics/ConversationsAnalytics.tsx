import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MetricsCard } from './MetricsCard';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { MessageSquare, Zap, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type ConversationStats = {
  total_messages: number;
  total_contacts: number;
  avg_response_time: number;
};

type RecentMessage = {
  id: string;
  contact_id: string;
  content: string;
  sender: string;
  sent_at: string;
  contact_name?: string;
};

export const ConversationsAnalytics = () => {
  const [stats, setStats] = useState<ConversationStats>({
    total_messages: 0,
    total_contacts: 0,
    avg_response_time: 0,
  });
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch messages count
        const { count: messageCount, error: messagesError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true });
          
        if (messagesError) throw messagesError;
        
        // Fetch unique contacts who have messages - fix the distinct method error
        // Instead of using distinct(), first get all contact_ids and then count unique ones
        const { data: contactsData, error: contactsError } = await supabase
          .from('messages')
          .select('contact_id');
          
        if (contactsError) throw contactsError;
        
        // Count unique contact_ids
        const uniqueContactIds = new Set();
        contactsData?.forEach(item => uniqueContactIds.add(item.contact_id));
        const uniqueContactsCount = uniqueContactIds.size;
        
        // Fetch recent messages with contact info
        const { data: messagesData, error: recentMessagesError } = await supabase
          .from('messages')
          .select(`
            id, 
            contact_id,
            content,
            sender,
            sent_at
          `)
          .order('sent_at', { ascending: false })
          .limit(10);
          
        if (recentMessagesError) throw recentMessagesError;
        
        // Get contact names for the messages
        const messagesWithContacts = await Promise.all((messagesData || []).map(async (message) => {
          const { data: contactData } = await supabase
            .from('contacts')
            .select('name')
            .eq('id', message.contact_id)
            .single();
            
          return {
            ...message,
            contact_name: contactData?.name || 'Unknown Contact'
          };
        }));
        
        // Calculate average response time (mock data for now)
        const avgResponseTime = 25; // 25 minutes as example
        
        setStats({
          total_messages: messageCount || 0,
          total_contacts: uniqueContactsCount,
          avg_response_time: avgResponseTime
        });
        
        setRecentMessages(messagesWithContacts);
      } catch (err) {
        console.error('Error fetching conversation analytics:', err);
        setError('Failed to load conversation analytics data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  const truncateContent = (content: string, maxLength = 100) => {
    return content.length > maxLength
      ? content.substring(0, maxLength) + '...'
      : content;
  };
  
  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricsCard 
          title="Total Messages"
          value={stats.total_messages.toString()}
          icon={<MessageSquare />}
          color="blue"
        />
        <MetricsCard 
          title="Active Contacts"
          value={stats.total_contacts.toString()}
          icon={<Users />}
          color="green"
        />
        <MetricsCard 
          title="Avg Response Time"
          value={`${stats.avg_response_time} min`}
          icon={<Zap />}
          color="orange"
        />
      </div>
      
      {/* Recent Messages Table */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Conversations</h2>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <p>Loading conversation data...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p>{error}</p>
          </div>
        ) : recentMessages.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell className="font-medium">{message.contact_name}</TableCell>
                    <TableCell className="max-w-xs truncate">{truncateContent(message.content)}</TableCell>
                    <TableCell>{message.sender === 'user' ? 'You' : 'Contact'}</TableCell>
                    <TableCell>{formatDate(message.sent_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="text-blue-500" size={24} />
            </div>
            <h3 className="text-xl font-medium mb-2">No messages found</h3>
            <p className="text-gray-500">Start conversations with your contacts to see them here</p>
          </div>
        )}
      </div>
    </div>
  );
};
