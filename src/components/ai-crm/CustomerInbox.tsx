
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Inbox, Mail, MessageSquare, Instagram, Facebook, Search, Sparkles, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
  tags?: string[];
  last_message?: string;
  last_platform?: 'SMS' | 'Email' | 'Instagram' | 'Facebook';
  last_timestamp?: string;
  unread?: boolean;
}

interface Message {
  id: string;
  sender: 'user' | 'customer';
  content: string;
  timestamp: string;
  channel: 'SMS' | 'Email' | 'Instagram' | 'Facebook';
  read: boolean;
  customer_id: string;
  customer_name: string;
}

interface CustomerInboxProps {
  onSelectCustomer: (customerId: string) => void;
}

const CustomerInbox = ({ onSelectCustomer }: CustomerInboxProps) => {
  const [activeChannel, setActiveChannel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [suggestedReply, setSuggestedReply] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [filters, setFilters] = useState({
    unreplied: false,
    promotions: false,
    vip: false,
  });
  const [platformFilters, setPlatformFilters] = useState<string[]>([]);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching contacts:', error);
        throw error;
      }
      
      // Transform the data to match our Contact interface
      const formattedContacts: Contact[] = data?.map(contact => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        created_at: contact.created_at,
        tags: contact.tags,
        last_message: "Hi there! Do you have this product in blue?", // Mock data, would come from messages table
        last_platform: ['SMS', 'Email', 'Instagram', 'Facebook'][Math.floor(Math.random() * 4)] as 'SMS' | 'Email' | 'Instagram' | 'Facebook', // Mock data
        last_timestamp: new Date().toISOString(), // Mock data
        unread: Math.random() > 0.5, // Mock data
      })) || [];
      
      setContacts(formattedContacts);
    } catch (error) {
      console.error('Error in fetchContacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessagesForContact = async (contactId: string) => {
    try {
      // In a real app, this would fetch from messages table in Supabase
      // For now, we'll use mock data
      const mockMessages: Message[] = [
        {
          id: '1',
          sender: 'customer',
          content: "Hi, I'd like to know if the summer sale is still going on?",
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          channel: 'SMS',
          read: false,
          customer_id: contactId,
          customer_name: 'Customer'
        },
        {
          id: '2',
          sender: 'user',
          content: 'Yes, our summer sale is active until the end of the month! You can get 20% off on all summer items.',
          timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
          channel: 'SMS',
          read: true,
          customer_id: contactId,
          customer_name: 'You'
        },
        {
          id: '3',
          sender: 'customer',
          content: "That's great! Do you have the blue swimsuit in medium size?",
          timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
          channel: 'SMS',
          read: false,
          customer_id: contactId,
          customer_name: 'Customer'
        }
      ];
      
      setMessages(mockMessages);
      setSelectedMessage(mockMessages[mockMessages.length - 1]);
      generateAiSuggestion(mockMessages[mockMessages.length - 1]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // Filter by channel
      if (activeChannel !== 'all' && contact.last_platform?.toLowerCase() !== activeChannel) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = contact.name.toLowerCase().includes(query);
        const messageMatch = contact.last_message?.toLowerCase().includes(query) || false;
        
        if (!nameMatch && !messageMatch) {
          return false;
        }
      }
      
      // Apply tag and status filters
      if (filters.vip && (!contact.tags || !contact.tags.includes('VIP'))) {
        return false;
      }
      
      if (filters.promotions && (!contact.tags || !contact.tags.includes('promotion-responsive'))) {
        return false;
      }
      
      // Filter by platform
      if (platformFilters.length > 0 && 
          contact.last_platform && 
          !platformFilters.includes(contact.last_platform)) {
        return false;
      }
      
      // For unreplied, we would need to check the last message in a real implementation
      if (filters.unreplied && !contact.unread) {
        return false;
      }
      
      return true;
    });
  }, [contacts, activeChannel, searchQuery, filters, platformFilters]);

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    onSelectCustomer(contact.id);
    fetchMessagesForContact(contact.id);
  };

  const generateAiSuggestion = async (message: Message) => {
    setLoadingSuggestion(true);
    setTimeout(() => {
      // Simulate AI suggestion generation
      let suggestedResponse = '';
      
      if (message.content.includes('sale')) {
        suggestedResponse = 'Yes, our summer sale is active until the end of the month! You can get 20% off on all summer items using code SUMMER20.';
      } else if (message.content.includes('swimsuit')) {
        suggestedResponse = 'We do have the blue swimsuit in medium size! Would you like me to reserve one for you?';
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
    if (!replyText.trim() || !selectedContact) return;
    
    const newMessage: Message = {
      id: `reply-${Date.now()}`,
      sender: 'user',
      content: replyText,
      timestamp: new Date().toISOString(),
      channel: selectedContact.last_platform || 'SMS',
      read: true,
      customer_id: selectedContact.id,
      customer_name: 'You'
    };
    
    // In a real app, you would send this to Supabase
    console.log('Sending reply:', newMessage);
    
    // Update the UI optimistically
    setMessages([...messages, newMessage]);
    setReplyText('');
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
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

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      if (isToday) {
        return format(date, 'h:mm a');
      } else {
        return formatDistanceToNow(date, { addSuffix: true });
      }
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  };

  const toggleFilter = (filter: 'unreplied' | 'promotions' | 'vip') => {
    setFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  const handlePlatformFilterChange = (value: string[]) => {
    setPlatformFilters(value);
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Filter size={16} className="mr-2" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Quick Filters</DropdownMenuLabel>
                <div className="p-2">
                  <Button 
                    variant={filters.unreplied ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => toggleFilter('unreplied')}
                    className="mb-2 w-full justify-start"
                  >
                    Unreplied
                  </Button>
                  <Button 
                    variant={filters.promotions ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => toggleFilter('promotions')}
                    className="mb-2 w-full justify-start"
                  >
                    Promotions
                  </Button>
                  <Button 
                    variant={filters.vip ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => toggleFilter('vip')}
                    className="w-full justify-start"
                  >
                    VIP
                  </Button>
                </div>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Platforms</DropdownMenuLabel>
                <div className="p-2">
                  <ToggleGroup 
                    type="multiple" 
                    className="justify-start flex-wrap gap-1"
                    value={platformFilters}
                    onValueChange={handlePlatformFilterChange}
                  >
                    <ToggleGroupItem value="SMS" size="sm" className="flex gap-1">
                      <MessageSquare size={14} />
                      SMS
                    </ToggleGroupItem>
                    <ToggleGroupItem value="Email" size="sm" className="flex gap-1">
                      <Mail size={14} />
                      Email
                    </ToggleGroupItem>
                    <ToggleGroupItem value="Instagram" size="sm" className="flex gap-1">
                      <Instagram size={14} />
                      Insta
                    </ToggleGroupItem>
                    <ToggleGroupItem value="Facebook" size="sm" className="flex gap-1">
                      <Facebook size={14} />
                      FB
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeChannel} onValueChange={setActiveChannel} className="w-full">
          <div className="mb-4">
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search contacts..."
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
              ) : filteredContacts.length > 0 ? (
                <div>
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`p-3 cursor-pointer border-b ${
                        selectedContact?.id === contact.id
                          ? "bg-blue-50"
                          : contact.unread
                          ? "bg-gray-50"
                          : ""
                      } hover:bg-gray-100`}
                      onClick={() => handleContactSelect(contact)}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <div className="bg-primary text-white rounded-full h-full w-full flex items-center justify-center text-xs font-medium">
                            {contact.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-medium truncate">{contact.name}</div>
                            <div className="text-xs text-gray-500">
                              {contact.last_timestamp && formatTimestamp(contact.last_timestamp)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            {contact.last_platform && getChannelIcon(contact.last_platform)}
                            <span className="truncate">{contact.last_message?.substring(0, 30)}...</span>
                          </div>
                        </div>
                      </div>
                      {contact.unread && <div className="w-2 h-2 rounded-full bg-blue-500 absolute top-4 right-2" />}
                      
                      {contact.tags?.includes('VIP') && (
                        <div className="mt-1 flex">
                          <Badge variant="secondary" className="text-xs">VIP</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-4">
                  <p className="text-gray-500 text-sm text-center">No contacts found</p>
                </div>
              )}
            </div>
            
            <div className="w-2/3 flex flex-col">
              {selectedContact ? (
                <>
                  <div className="p-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <div className="bg-primary text-white rounded-full h-full w-full flex items-center justify-center text-xs font-medium">
                          {selectedContact.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      </Avatar>
                      <div>
                        <div className="font-medium">{selectedContact.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          {selectedContact.last_platform && getChannelIcon(selectedContact.last_platform)}
                          <span>{selectedContact.last_platform}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectCustomer(selectedContact.id)}
                    >
                      View Profile
                    </Button>
                  </div>
                  
                  <div className="flex-1 p-3 overflow-y-auto space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="flex flex-col gap-1">
                        <div className={`flex items-start gap-2 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                          {message.sender === 'customer' && (
                            <Avatar className="h-8 w-8 mt-1">
                              <div className="bg-primary text-white rounded-full h-full w-full flex items-center justify-center text-xs font-medium">
                                {selectedContact.name.split(' ').map(n => n[0]).join('')}
                              </div>
                            </Avatar>
                          )}
                          <div>
                            <div 
                              className={`${
                                message.sender === 'user' 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-100 text-gray-800'
                              } rounded-lg p-3 max-w-[85%]`}
                            >
                              <p>{message.content}</p>
                            </div>
                            <div className={`text-xs text-gray-500 mt-1 ${message.sender === 'user' ? 'text-right' : 'ml-2'}`}>
                              {formatTimestamp(message.timestamp)}
                            </div>
                          </div>
                          {message.sender === 'user' && (
                            <Avatar className="h-8 w-8 mt-1">
                              <div className="bg-blue-700 text-white rounded-full h-full w-full flex items-center justify-center text-xs font-medium">
                                You
                              </div>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    ))}
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
                    <p className="mt-1 text-gray-500 text-sm">Select a contact from the list to view the conversation.</p>
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
