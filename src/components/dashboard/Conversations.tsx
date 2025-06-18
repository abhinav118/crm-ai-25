
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getFullName } from '@/utils/contactHelpers';
import ContactInfoPanel from './ContactInfoPanel';
import ChatBubbleList from './ChatBubbleList';
import ChatInput from './ChatInput';

type Message = {
  id: string;
  content: string;
  sent_at: string;
  sender: string;
  contact_id: string;
};

type Contact = {
  id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status: 'active' | 'inactive';
  tags?: string[];
  lastActivity?: string;
  createdAt?: string;
};

interface ConversationsProps {
  selectedContactId?: string;
  onClose?: () => void;
}

const Conversations: React.FC<ConversationsProps> = ({ selectedContactId, onClose }) => {
  const [contact, setContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    if (selectedContactId) {
      fetchContactAndMessages();
    }
  }, [selectedContactId]);
  
  const fetchContactAndMessages = async () => {
    if (!selectedContactId) return;
    
    setIsLoading(true);
    try {
      console.log('Fetching contact and messages for:', selectedContactId);
      
      // Fetch contact information
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', selectedContactId)
        .single();
        
      if (contactError) {
        console.error('Error fetching contact:', contactError);
        throw contactError;
      }
      
      if (!contactData) {
        console.log('No contact found');
        return;
      }
      
      // Transform contact data
      const transformedContact: Contact = {
        id: contactData.id,
        first_name: contactData.first_name,
        last_name: contactData.last_name,
        email: contactData.email,
        phone: contactData.phone,
        company: contactData.company,
        status: contactData.status as 'active' | 'inactive',
        tags: contactData.tags || [],
        lastActivity: contactData.last_activity,
        createdAt: contactData.created_at
      };
      
      setContact(transformedContact);
      
      // Fetch messages for this contact using the correct schema
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('contact_id', selectedContactId)
        .order('sent_at', { ascending: true });
        
      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        throw messagesError;
      }
      
      setMessages(messagesData || []);
      
    } catch (err) {
      console.error('Error fetching contact and messages:', err);
      toast({
        title: 'Error loading conversation',
        description: 'There was a problem loading the conversation. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEdit = (contact: Contact) => {
    // This will be handled by the parent component
    console.log('Edit contact:', contact);
  };
  
  const handleMessageSent = () => {
    // Refresh messages after sending
    fetchContactAndMessages();
  };
  
  if (!selectedContactId || !contact) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
          <p className="text-gray-500">Select a contact to view their conversation</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-full bg-white">
      {/* Left Panel - Contact Information */}
      <ContactInfoPanel 
        contact={contact} 
        onEdit={handleEdit}
      />
      
      {/* Right Panel - Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {getFullName(contact)}
            </h2>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </Button>
            )}
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="sms" className="flex-1 flex flex-col">
          <div className="border-b border-gray-200 px-4">
            <TabsList className="h-10">
              <TabsTrigger value="sms" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>SMS</span>
              </TabsTrigger>
              <TabsTrigger value="email" disabled className="flex items-center space-x-2 opacity-50">
                <span>Email</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="sms" className="flex-1 flex flex-col m-0">
            {/* Messages */}
            <ChatBubbleList 
              messages={messages}
              contact={contact}
              isLoading={isLoading}
            />
            
            {/* Input */}
            <ChatInput
              contactId={contact.id}
              contactPhone={contact.phone}
              onMessageSent={handleMessageSent}
            />
          </TabsContent>
          
          <TabsContent value="email" className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p>Email functionality coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Conversations;
