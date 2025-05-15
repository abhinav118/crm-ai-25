
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Inbox, Mail, MessageSquare, Instagram, Facebook, Search, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  sender: 'user' | 'customer';
  content: string;
  timestamp: string;
  channel: 'sms' | 'email' | 'instagram' | 'facebook';
  read: boolean;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
}

interface CustomerInboxProps {
  onSelectCustomer: (customerId: string) => void;
}

const CustomerInbox = ({ onSelectCustomer }: CustomerInboxProps) => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [suggestedReply, setSuggestedReply] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  useEffect(() => {
    // Simulating loading messages from a database
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        // In a real application, this would be a call to Supabase or another backend
        // For now, we'll use mock data
        const mockMessages: Message[] = [
          {
            id: '1',
            sender: 'customer',
            content: "Hi, I'd like to know if the summer sale is still going on?",
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            channel: 'sms',
            read: false,
            customerId: 'cust_123',
            customerName: 'Emma Johnson'
          },
          {
            id: '2',
            sender: 'customer',
            content: 'Just received my order #4532 but the color is wrong. I ordered blue but got green.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            channel: 'email',
            read: true,
            customerId: 'cust_124',
            customerName: 'Michael Williams'
          },
          {
            id: '3',
            sender: 'customer',
            content: 'I saw your Instagram post about new items. Are they in stock now?',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
            channel: 'instagram',
            read: false,
            customerId: 'cust_125',
            customerName: 'Sophia Miller'
          },
          {
            id: '4',
            sender: 'customer',
            content: 'Is there a discount code for loyal customers this month?',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            channel: 'facebook',
            read: true,
            customerId: 'cust_126',
            customerName: 'William Jones'
          },
          {
            id: '5',
            sender: 'customer',
            content: "I'd like to update my subscription to the premium tier.",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
            channel: 'sms',
            read: true,
            customerId: 'cust_127',
            customerName: 'Charlotte Wilson'
          }
        ];
        
        setMessages(mockMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const filteredMessages = messages.filter(message => {
    // Filter by tab
    if (activeTab !== 'all' && message.channel !== activeTab) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        message.content.toLowerCase().includes(query) ||
        message.customerName.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const handleMessageSelect = (message: Message) => {
    setSelectedMessage(message);
    onSelectCustomer(message.customerId);
    
    // Generate AI suggestion when message is selected
    generateAiSuggestion(message);
  };

  const generateAiSuggestion = async (message: Message) => {
    setLoadingSuggestion(true);
    setTimeout(() => {
      // Simulate AI suggestion generation
      let suggestedResponse = '';
      
      if (message.content.includes('sale')) {
        suggestedResponse = 'Yes, our summer sale is active until the end of the month! You can get 20% off on all summer items using code SUMMER20.';
      } else if (message.content.includes('order')) {
        suggestedResponse = "I'm very sorry about the mix-up with your order. I'd be happy to arrange for a return and send you the correct color right away.";
      } else if (message.content.includes('Instagram')) {
        suggestedResponse = 'Yes, all the items from our recent Instagram post are now in stock! Would you like me to share a link to purchase them?';
      } else if (message.content.includes('discount')) {
        suggestedResponse = 'We appreciate our loyal customers! You can use code LOYAL15 for 15% off your next purchase this month.';
      } else if (message.content.includes('subscription')) {
        suggestedResponse = 'Great! I can help you upgrade to our premium tier. Would you prefer to be billed monthly or annually? The annual plan includes a 15% discount.';
      } else {
        suggestedResponse = 'Thank you for your message! How can I help you today?';
      }
      
      setSuggestedReply(suggestedResponse);
      setLoadingSuggestion(false);
    }, 1000);
  };

  const useSuggestion = () => {
    setReplyText(suggestedReply);
  };

  const sendReply = () => {
    if (!replyText.trim() || !selectedMessage) return;
    
    const newMessage: Message = {
      id: `reply-${Date.now()}`,
      sender: 'user',
      content: replyText,
      timestamp: new Date().toISOString(),
      channel: selectedMessage.channel,
      read: true,
      customerId: selectedMessage.customerId,
      customerName: 'You'
    };
    
    // In a real app, you would send this to a backend
    console.log('Sending reply:', newMessage);
    
    // Update the UI optimistically
    setMessages([...messages, newMessage]);
    setReplyText('');
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms':
        return <MessageSquare size={16} />;
      case 'email':
        return <Mail size={16} />;
      case 'instagram':
        return <Instagram size={16} />;
      case 'facebook':
        return <Facebook size={16} />;
      default:
        return <MessageSquare size={16} />;
    }
  };

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            Customer Inbox
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
              Unreplied
            </Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
              Promotions
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
              VIP
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-4">
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search messages..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="instagram">Instagram</TabsTrigger>
              <TabsTrigger value="facebook">Facebook</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex h-[400px] border rounded-md">
            <div className="w-1/3 border-r overflow-y-auto">
              {isLoading ? (
                <div className="p-3 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredMessages.length > 0 ? (
                <div>
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 cursor-pointer border-b ${
                        selectedMessage?.id === message.id
                          ? "bg-blue-50"
                          : message.read
                          ? ""
                          : "bg-gray-50"
                      } hover:bg-gray-100`}
                      onClick={() => handleMessageSelect(message)}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <div className="bg-primary text-white rounded-full h-full w-full flex items-center justify-center text-xs font-medium">
                            {message.customerName.split(' ').map(n => n[0]).join('')}
                          </div>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-medium truncate">{message.customerName}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            {getChannelIcon(message.channel)}
                            <span className="truncate">{message.content.substring(0, 30)}...</span>
                          </div>
                        </div>
                      </div>
                      {!message.read && <div className="w-2 h-2 rounded-full bg-blue-500 absolute top-4 right-2" />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-4">
                  <p className="text-gray-500 text-sm text-center">No messages found</p>
                </div>
              )}
            </div>
            
            <div className="w-2/3 flex flex-col">
              {selectedMessage ? (
                <>
                  <div className="p-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <div className="bg-primary text-white rounded-full h-full w-full flex items-center justify-center text-xs font-medium">
                          {selectedMessage.customerName.split(' ').map(n => n[0]).join('')}
                        </div>
                      </Avatar>
                      <div>
                        <div className="font-medium">{selectedMessage.customerName}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          {getChannelIcon(selectedMessage.channel)}
                          <span>{selectedMessage.channel.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectCustomer(selectedMessage.customerId)}
                    >
                      View Profile
                    </Button>
                  </div>
                  
                  <div className="flex-1 p-3 overflow-y-auto space-y-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start gap-2">
                        <Avatar className="h-8 w-8 mt-1">
                          <div className="bg-primary text-white rounded-full h-full w-full flex items-center justify-center text-xs font-medium">
                            {selectedMessage.customerName.split(' ').map(n => n[0]).join('')}
                          </div>
                        </Avatar>
                        <div>
                          <div className="bg-gray-100 rounded-lg p-3 max-w-[85%]">
                            <p>{selectedMessage.content}</p>
                          </div>
                          <div className="text-xs text-gray-500 ml-2 mt-1">
                            {new Date(selectedMessage.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {suggestedReply && (
                    <div className="mx-3 my-2 p-2 border border-blue-200 bg-blue-50 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-blue-700">
                          <Sparkles className="h-4 w-4" />
                          <span>AI Suggested Reply</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-blue-700" 
                          onClick={useSuggestion}
                        >
                          Use
                        </Button>
                      </div>
                      <p className="text-sm mt-1 text-gray-700">{suggestedReply}</p>
                    </div>
                  )}
                  
                  {loadingSuggestion && (
                    <div className="mx-3 my-2 p-2 border border-gray-200 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-t-blue-500 border-blue-200 animate-spin"></div>
                        <span className="text-sm text-gray-500">Generating smart reply...</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-3 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        className="flex-1"
                      />
                      <Button onClick={sendReply}>Send</Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Inbox className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-gray-700 font-medium">No conversation selected</h3>
                    <p className="mt-1 text-gray-500 text-sm">Select a message from the list to view the conversation.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CustomerInbox;
