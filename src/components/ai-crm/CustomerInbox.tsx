import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Send, Plus, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getFullName } from '@/utils/contactHelpers';

interface Contact {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  tags: string[];
  last_activity: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

interface Message {
  id: string;
  contact_id: string;
  content: string;
  sender: string;
  sent_at: string;
  channel: string;
}

interface Conversation {
  contact: Contact;
  lastMessage: Message | null;
  unreadCount: number;
}

const CustomerInbox = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.contact.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      
      // Fetch contacts with their latest messages
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (contactsError) throw contactsError;

      const conversationsData: Conversation[] = [];

      for (const contact of contacts || []) {
        // Get the latest message for each contact
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('contact_id', contact.id)
          .order('sent_at', { ascending: false })
          .limit(1)
          .single();

        // Count unread messages (assuming messages from 'contact' are unread)
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('contact_id', contact.id)
          .eq('sender', 'contact');

        conversationsData.push({
          contact,
          lastMessage: lastMessage || null,
          unreadCount: unreadCount || 0
        });
      }

      setConversations(conversationsData);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (contactId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contact_id', contactId)
        .order('sent_at', { ascending: true });

      if (error) throw error;
      
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          contact_id: selectedConversation.contact.id,
          content: newMessage,
          sender: 'user',
          channel: 'chat'
        });

      if (error) throw error;

      setNewMessage('');
      fetchMessages(selectedConversation.contact.id);
      fetchConversations(); // Refresh conversations to update last message
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = getFullName(conv.contact).toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (conv.contact.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || conv.contact.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex h-full bg-white">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('active')}
            >
              Active
            </Button>
            <Button
              variant={filterStatus === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('inactive')}
            >
              Inactive
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No conversations found</div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.contact.id}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.contact.id === conversation.contact.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{getFullName(conversation.contact)}</h3>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{conversation.contact.email}</p>
                    {conversation.lastMessage && (
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {conversation.lastMessage.content}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant={conversation.contact.status === 'active' ? 'success' : 'secondary'}>
                      {conversation.contact.status}
                    </Badge>
                    {conversation.lastMessage && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(conversation.lastMessage.sent_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{getFullName(selectedConversation.contact)}</h2>
                  <p className="text-sm text-gray-500">{selectedConversation.contact.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedConversation.contact.status === 'active' ? 'success' : 'secondary'}>
                    {selectedConversation.contact.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.sent_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p>Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerInbox;
