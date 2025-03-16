import React, { useState, useEffect } from 'react';
import Avatar from '@/components/dashboard/Avatar';
import { Button } from '@/components/ui/button';
import UserProfile from './UserProfile';
import { Contact } from './ContactsTable';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  MessageSquare,
  MessageCircle,
  PenSquare,
  X,
  Smile,
  Link,
  FileText,
  Send,
  Phone,
  AlertTriangle
} from 'lucide-react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'contact';
  timestamp: string;
  channel: 'sms' | 'whatsapp' | 'internal';
};

type ChatInterfaceProps = {
  contact: Contact;
  onClose: () => void;
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ contact, onClose }) => {
  const [activeChannel, setActiveChannel] = useState<string>('sms');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch messages from Supabase when contact changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!contact?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('contact_id', contact.id)
          .order('sent_at', { ascending: true });
        
        if (error) {
          throw error;
        }
        
        if (data) {
          const formattedMessages = data.map(msg => ({
            id: msg.id,
            text: msg.content,
            sender: msg.sender as 'user' | 'contact',
            timestamp: msg.sent_at,
            channel: msg.channel as 'sms' | 'whatsapp' | 'internal'
          }));
          
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load messages',
          variant: 'destructive'
        });
      }
    };
    
    fetchMessages();
  }, [contact, toast]);

  const handleSend = async () => {
    if (!messageText.trim()) return;
    
    // First, create a temporary message to show in the UI
    const tempId = Date.now().toString();
    const newMessage: Message = {
      id: tempId,
      text: messageText,
      sender: 'user',
      timestamp: new Date().toISOString(),
      channel: activeChannel as 'sms' | 'whatsapp' | 'internal'
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessageText('');
    setIsLoading(true);
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to send messages');
      }
      
      // If it's an SMS, send it via Twilio
      if (activeChannel === 'sms' && contact.phone) {
        // Call our Supabase Edge Function to send SMS
        const { data: twilioResponse, error: twilioError } = await supabase.functions.invoke('send-sms', {
          body: {
            to: contact.phone,
            message: messageText,
            contactId: contact.id
          }
        });
        
        if (twilioError) {
          throw new Error(`Failed to send SMS: ${twilioError.message}`);
        }
        
        if (!twilioResponse.success) {
          throw new Error(`Twilio error: ${twilioResponse.error}`);
        }
      }
      
      // Store the message in Supabase
      const { data, error } = await supabase
        .from('messages')
        .insert({
          contact_id: contact.id,
          content: messageText,
          sender: 'user',
          channel: activeChannel,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Replace the temporary message with the one from the database
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId
            ? {
                id: data.id,
                text: data.content,
                sender: data.sender as 'user' | 'contact',
                timestamp: data.sent_at,
                channel: data.channel as 'sms' | 'whatsapp' | 'internal'
              }
            : msg
        )
      );
      
      toast({
        title: 'Message sent',
        description: activeChannel === 'sms' 
          ? 'SMS sent successfully' 
          : 'Message saved successfully',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove the temporary message on failure
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={contact.name} status={contact.status as any} />
            <div>
              <h3 className="font-medium text-gray-900">{contact.name}</h3>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Phone size={14} />
                {contact.phone || 'No phone number'}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        
        {/* Split View: Profile and Chat */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Side - Profile */}
          <div className="w-1/3 border-r p-4 overflow-y-auto">
            <UserProfile 
              contact={contact} 
              onSave={async (updatedContact) => {
                try {
                  const { error } = await supabase
                    .from('contacts')
                    .update({
                      name: updatedContact.name,
                      email: updatedContact.email,
                      phone: updatedContact.phone,
                      company: updatedContact.company,
                      status: updatedContact.status
                    })
                    .eq('id', contact.id);
                  
                  if (error) throw error;
                  
                  toast({
                    title: 'Success',
                    description: 'Contact updated successfully',
                  });
                } catch (error) {
                  console.error('Error updating contact:', error);
                  toast({
                    title: 'Error',
                    description: 'Failed to update contact',
                    variant: 'destructive'
                  });
                }
              }}
            />
          </div>

          {/* Right Side - Chat */}
          <div className="w-2/3 flex flex-col">
            {/* Channel Tabs */}
            <Tabs 
              defaultValue="sms" 
              className="flex-1 flex flex-col"
              onValueChange={value => setActiveChannel(value)}
            >
              <div className="px-4 pt-4">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="sms" className="flex items-center gap-2">
                    <MessageSquare size={16} />
                    <span>SMS</span>
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                    <MessageCircle size={16} />
                    <span>WhatsApp</span>
                  </TabsTrigger>
                  <TabsTrigger value="internal" className="flex items-center gap-2">
                    <PenSquare size={16} />
                    <span>Internal</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <TabsContent value="sms" className="mt-0 space-y-4 h-full">
                  {!contact.phone && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500 bg-yellow-50 p-4 rounded-lg">
                        <AlertTriangle className="mx-auto mb-2 text-yellow-500" />
                        <p className="font-medium">No phone number available</p>
                        <p className="text-sm">Add a phone number to the contact profile to enable SMS.</p>
                      </div>
                    </div>
                  )}
                  
                  {contact.phone && messages.filter(msg => msg.channel === 'sms').length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500">
                        <MessageSquare className="mx-auto mb-2" />
                        <p>No SMS messages yet</p>
                        <p className="text-sm">Send a message to start the conversation</p>
                      </div>
                    </div>
                  )}
                  
                  {messages
                    .filter(msg => msg.channel === 'sms')
                    .map(message => (
                      <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-lg ${message.sender === 'user' ? 'bg-primary text-white' : 'bg-gray-100'}`}>
                          <p className="text-sm">{message.text}</p>
                          <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-primary-foreground/70' : 'text-gray-500'}`}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                </TabsContent>
                
                <TabsContent value="whatsapp" className="mt-0 h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MessageCircle className="mx-auto mb-2" />
                    <p>WhatsApp integration coming soon</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="internal" className="mt-0 h-full flex items-center justify-center">
                  {messages.filter(msg => msg.channel === 'internal').length === 0 ? (
                    <div className="text-center text-gray-500">
                      <PenSquare className="mx-auto mb-2" />
                      <p>No internal comments yet</p>
                      <p className="text-sm">Add notes about this contact for your team</p>
                    </div>
                  ) : (
                    <div className="w-full space-y-4">
                      {messages
                        .filter(msg => msg.channel === 'internal')
                        .map(message => (
                          <div key={message.id} className="p-3 bg-gray-50 rounded-lg border">
                            <p className="text-sm">{message.text}</p>
                            <p className="text-xs mt-1 text-gray-500">
                              {new Date(message.timestamp).toLocaleString()}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </TabsContent>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Button variant="ghost" size="sm">
                    <Smile size={18} />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Link size={18} />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <FileText size={18} />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <textarea
                    className="flex-1 border rounded-md p-2 text-sm resize-none h-[60px]"
                    placeholder={`Type your ${activeChannel === 'internal' ? 'comment' : 'message'}...`}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={activeChannel === 'sms' && !contact.phone}
                  />
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="px-3" 
                      onClick={() => setMessageText('')}
                      disabled={!messageText.trim()}
                    >
                      Clear
                    </Button>
                    <Button 
                      size="sm" 
                      className="px-3" 
                      onClick={handleSend} 
                      disabled={!messageText.trim() || (activeChannel === 'sms' && !contact.phone)}
                      isLoading={isLoading}
                    >
                      <Send size={14} className="mr-1" />
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
