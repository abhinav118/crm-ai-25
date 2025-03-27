import React, { useState, useEffect, useRef } from 'react';
import Avatar from '@/components/dashboard/Avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import UserProfile from './UserProfile';
import { Contact } from './ContactsTable';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logContactAction } from '@/utils/contactLogger';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Mail,
  X,
  Smile,
  Link,
  FileText,
  Send,
  Phone
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
  channel: 'sms' | 'email';
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
  const [isFetching, setIsFetching] = useState(true);
  const [updatedContact, setUpdatedContact] = useState<Contact>(contact);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (!contact?.id) return;
      
      setIsFetching(true);
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
            channel: msg.channel as 'sms' | 'email'
          }));
          
          setMessages(formattedMessages);
          
          setTimeout(scrollToBottom, 100);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load messages',
          variant: 'destructive'
        });
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchMessages();
  }, [contact, toast]);

  useEffect(() => {
    if (!contact?.id) return;
    
    console.log('Setting up messages subscription for contact:', contact.id);
    
    const subscription = supabase
      .channel(`messages-changes-${contact.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `contact_id=eq.${contact.id}`
      }, (payload) => {
        console.log('Messages change received:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new;
          const formattedMessage = {
            id: newMessage.id,
            text: newMessage.content,
            sender: newMessage.sender,
            timestamp: newMessage.sent_at,
            channel: newMessage.channel
          };
          
          console.log('Adding new message to state:', formattedMessage);
          setMessages(prev => [...prev, formattedMessage]);
          
          setTimeout(scrollToBottom, 50);

          if (newMessage.sender === 'contact') {
            logContactAction('message_received', {
              id: contact.id,
              name: contact.name,
              message: newMessage.content,
              channel: newMessage.channel,
              timestamp: newMessage.sent_at
            });
          }
        }
      })
      .subscribe();
    
    return () => {
      console.log('Cleaning up message subscription');
      supabase.removeChannel(subscription);
    };
  }, [contact?.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;
    
    const tempId = Date.now().toString();
    const newMessage: Message = {
      id: tempId,
      text: messageText,
      sender: 'user',
      timestamp: new Date().toISOString(),
      channel: activeChannel as 'sms' | 'email'
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessageText('');
    setIsLoading(true);
    
    scrollToBottom();
    
    try {
      const messageInsert = {
        contact_id: updatedContact.id,
        content: messageText,
        sender: 'user',
        channel: activeChannel
      };
      
      console.log('Inserting message:', messageInsert);
      
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert(messageInsert)
        .select();
      
      console.log('Insert response:', messageData, messageError);
      
      if (messageError) {
        throw messageError;
      }
      
      if (activeChannel === 'sms' && updatedContact.phone) {
        console.log('Sending SMS via Supabase Edge Function');
        
        const { data: twilioResponse, error: twilioError } = await supabase.functions.invoke('send-sms', {
          body: {
            to: updatedContact.phone,
            message: messageText,
            contactId: updatedContact.id
          }
        });
        
        console.log('Twilio response:', twilioResponse);
        
        if (twilioError) {
          throw new Error(`Failed to send SMS: ${twilioError.message}`);
        }
        
        if (twilioResponse && !twilioResponse.success) {
          throw new Error(`Twilio error: ${twilioResponse.error || 'Unknown error'}`);
        }
      } else if (activeChannel === 'email' && updatedContact.email) {
        console.log('Email sending would happen here');
        toast({
          title: 'Email Feature',
          description: 'Email sending feature is not fully implemented yet.',
          variant: 'default'
        });
      }
      
      await logContactAction('message_sent', {
        id: updatedContact.id,
        name: updatedContact.name,
        message: messageText,
        channel: activeChannel,
        timestamp: new Date().toISOString()
      });
      
      if (messageData && messageData.length > 0) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId
              ? {
                  id: messageData[0].id,
                  text: messageData[0].content,
                  sender: messageData[0].sender as 'user' | 'contact',
                  timestamp: messageData[0].sent_at,
                  channel: messageData[0].channel as 'sms' | 'email'
                }
              : msg
          )
        );
      }
      
      await supabase
        .from('contacts')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', updatedContact.id);
      
      toast({
        title: 'Message sent',
        description: activeChannel === 'sms' 
          ? 'SMS sent successfully' 
          : activeChannel === 'email'
          ? 'Email saved successfully'
          : 'Message saved successfully',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleContactUpdate = (updatedContactData: Contact) => {
    setUpdatedContact(updatedContactData);
  };

  const getChannelPlaceholder = (channel: string) => {
    switch(channel) {
      case 'sms': return 'Type your SMS message...';
      case 'email': return 'Type your email message...';
      default: return 'Type your message...';
    }
  };

  const isChannelDisabled = (channel: string) => {
    if (channel === 'sms' && !updatedContact.phone) return true;
    if (channel === 'email' && !updatedContact.email) return true;
    return false;
  };

  const getMissingInfoMessage = (channel: string) => {
    if (channel === 'sms' && !updatedContact.phone) return 'No phone number available';
    if (channel === 'email' && !updatedContact.email) return 'No email address available';
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl h-[90vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={updatedContact.name} status={updatedContact.status as any} />
            <div>
              <h3 className="font-medium text-gray-900">{updatedContact.name}</h3>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Phone size={14} />
                {updatedContact.phone || 'No phone number'}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          <div className="w-[320px] min-w-[320px] border-r">
            <UserProfile 
              contact={updatedContact}
              onSave={handleContactUpdate}
            />
          </div>

          <div className="flex-1 flex flex-col">
            <Tabs 
              defaultValue="sms" 
              className="flex-1 flex flex-col"
              onValueChange={value => setActiveChannel(value)}
            >
              <div className="px-4 pt-4">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="sms" className="flex items-center gap-2">
                    <MessageSquare size={16} />
                    <span>SMS</span>
                  </TabsTrigger>
                  <TabsTrigger value="email" className="flex items-center gap-2">
                    <Mail size={16} />
                    <span>Email</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden p-4 flex flex-col">
                <TabsContent value="sms" className="mt-0 h-full flex flex-col">
                  {!contact.phone && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500 bg-yellow-50 p-4 rounded-lg">
                        <p className="font-medium">No phone number available</p>
                        <p className="text-sm">Add a phone number to the contact profile to enable SMS.</p>
                      </div>
                    </div>
                  )}
                  
                  {contact.phone && messages.filter(msg => msg.channel === 'sms').length === 0 && !isFetching && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500">
                        <MessageSquare className="mx-auto mb-2" />
                        <p>No SMS messages yet</p>
                        <p className="text-sm">Send a message to start the conversation</p>
                      </div>
                    </div>
                  )}

                  {isFetching && (
                    <div className="flex items-center justify-center h-20">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-4 border-primary border-t-transparent mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading messages...</p>
                      </div>
                    </div>
                  )}
                  
                  {!isFetching && messages.filter(msg => msg.channel === 'sms').length > 0 && (
                    <div className="h-full flex flex-col" ref={scrollAreaContainerRef}>
                      <ScrollArea className="flex-1 pr-4" type="auto">
                        <div className="space-y-4 pb-2">
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
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="email" className="mt-0 h-full flex flex-col">
                  {!contact.email && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500 bg-yellow-50 p-4 rounded-lg">
                        <p className="font-medium">No email address available</p>
                        <p className="text-sm">Add an email address to the contact profile to enable Email.</p>
                      </div>
                    </div>
                  )}
                  
                  {contact.email && messages.filter(msg => msg.channel === 'email').length === 0 && !isFetching && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500">
                        <Mail className="mx-auto mb-2" />
                        <p>No email messages yet</p>
                        <p className="text-sm">Send an email to start the conversation</p>
                      </div>
                    </div>
                  )}

                  {isFetching && (
                    <div className="flex items-center justify-center h-20">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-4 border-primary border-t-transparent mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading messages...</p>
                      </div>
                    </div>
                  )}
                  
                  {!isFetching && messages.filter(msg => msg.channel === 'email').length > 0 && (
                    <div className="h-full flex flex-col">
                      <ScrollArea className="flex-1 pr-4" type="auto">
                        <div className="space-y-4 pb-2">
                          {messages
                            .filter(msg => msg.channel === 'email')
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
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </TabsContent>
              </div>

              <div className="p-4 border-t">
                <form onSubmit={handleSend} className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Button type="button" variant="ghost" size="sm">
                      <Smile size={18} />
                    </Button>
                    <Button type="button" variant="ghost" size="sm">
                      <Link size={18} />
                    </Button>
                    <Button type="button" variant="ghost" size="sm">
                      <FileText size={18} />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      className="flex-1 resize-none h-[60px]"
                      placeholder={getChannelPlaceholder(activeChannel)}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={handleKeyPress}
                      disabled={isChannelDisabled(activeChannel) || isLoading}
                    />
                    <div className="flex flex-col gap-2">
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm" 
                        className="px-3" 
                        onClick={() => setMessageText('')}
                        disabled={!messageText.trim() || isLoading}
                      >
                        Clear
                      </Button>
                      <Button 
                        type="submit"
                        size="sm" 
                        className="px-3" 
                        disabled={!messageText.trim() || isChannelDisabled(activeChannel) || isLoading}
                      >
                        <Send size={14} className="mr-1" />
                        {isLoading ? 'Sending...' : 'Send'}
                      </Button>
                    </div>
                  </div>
                  {isChannelDisabled(activeChannel) && (
                    <p className="text-sm text-yellow-600 mt-2">
                      {getMissingInfoMessage(activeChannel)}
                    </p>
                  )}
                </form>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
