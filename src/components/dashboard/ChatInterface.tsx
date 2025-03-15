
import React, { useState } from 'react';
import Avatar from '@/components/dashboard/Avatar';
import { Button } from '@/components/ui/button';
import UserProfile from './UserProfile';
import { Contact } from './ContactsTable';
import {
  MessageSquare,
  MessageCircle,
  PenSquare,
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
  channel: 'sms' | 'whatsapp' | 'internal';
};

type ChatInterfaceProps = {
  contact: Contact;
  onClose: () => void;
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ contact, onClose }) => {
  const [activeChannel, setActiveChannel] = useState<string>('sms');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I wanted to follow up on your recent purchase.',
      sender: 'user',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      channel: 'sms'
    },
    {
      id: '2',
      text: 'Thank you for reaching out. Everything is working great!',
      sender: 'contact',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      channel: 'sms'
    },
    {
      id: '3',
      text: 'Great! Let me know if you need anything else.',
      sender: 'user',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      channel: 'sms'
    }
  ]);

  const handleSend = () => {
    if (!messageText.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date().toISOString(),
      channel: activeChannel as 'sms' | 'whatsapp' | 'internal'
    };
    
    setMessages([...messages, newMessage]);
    setMessageText('');
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
            <UserProfile contact={contact} />
          </div>

          {/* Right Side - Chat */}
          <div className="w-2/3 flex flex-col">
            {/* Channel Tabs */}
            <Tabs defaultValue="sms" className="flex-1 flex flex-col">
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
                <TabsContent value="sms" className="mt-0 space-y-4">
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
                    <p>No WhatsApp messages yet</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="internal" className="mt-0 h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <PenSquare className="mx-auto mb-2" />
                    <p>No internal comments yet</p>
                  </div>
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
                  />
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" className="px-3" disabled={!messageText.trim()}>
                      Clear
                    </Button>
                    <Button size="sm" className="px-3" onClick={handleSend} disabled={!messageText.trim()}>
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
