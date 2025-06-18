
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Paperclip, Smile, Phone, Video, MoreVertical } from 'lucide-react';
import { Contact } from './ContactsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getFullName } from '@/utils/contactHelpers';

export interface ChatInterfaceProps {
  contact: Contact;
  onClose?: () => void;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'contact';
  timestamp: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ contact, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchMessages();
  }, [contact.id]);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contact_id', contact.id)
        .order('sent_at', { ascending: true });

      if (error) throw error;

      const transformedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender === 'user' ? 'user' : 'contact',
        timestamp: msg.sent_at
      }));

      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            contact_id: contact.id,
            content: messageContent,
            sender: 'user',
            sent_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const newMsg: Message = {
        id: data.id,
        content: data.content,
        sender: 'user',
        timestamp: data.sent_at
      };

      setMessages(prev => [...prev, newMsg]);

      toast({
        title: 'Message sent',
        description: `Message sent to ${getFullName(contact)}`,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
      // Restore the message if sending failed
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
            {getFullName(contact).charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold">{getFullName(contact)}</h3>
            <p className="text-sm text-gray-500">
              {contact.phone ? `${contact.phone} • ` : ''}
              {contact.status === 'active' ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Phone size={16} />
          </Button>
          <Button variant="ghost" size="sm">
            <Video size={16} />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical size={16} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation with {getFullName(contact)}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatMessageTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t bg-gray-50">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Button type="button" variant="ghost" size="sm">
            <Paperclip size={16} />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${getFullName(contact)}...`}
            className="flex-1"
            disabled={isSending}
          />
          <Button type="button" variant="ghost" size="sm">
            <Smile size={16} />
          </Button>
          <Button type="submit" size="sm" disabled={isSending || !newMessage.trim()}>
            <Send size={16} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
