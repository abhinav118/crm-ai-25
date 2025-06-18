import { useState, useEffect } from 'react';
import { X, User, ShoppingBag, MessageSquare, Calendar, BarChart, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { getFullName, getInitials } from '@/utils/contactHelpers';

interface CustomerType {
  id: string;
  first_name: string;
  last_name?: string;
  email: string | null;
  phone: string | null;
  joinedDate: string;
  lastOrder: string;
  lifetimeValue: number;
  orderCount: number;
  tags: string[];
  customerType: string;
  purchaseHistory: {
    id: string;
    date: string;
    items: {
      name: string;
      price: number;
      quantity: number;
    }[];
    total: number;
  }[];
  engagementHistory: {
    id: string;
    date: string;
    type: 'email_open' | 'email_click' | 'sms_view' | 'website_visit' | 'order_placed';
    description: string;
  }[];
  notes?: string;
}

interface CustomerProfilePanelProps {
  customerId: string;
  onClose: () => void;
}

const CustomerProfilePanel = ({ customerId, onClose }: CustomerProfilePanelProps) => {
  const [customer, setCustomer] = useState<CustomerType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [noteSummary, setNoteSummary] = useState('');

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      setIsLoading(true);
      try {
        // Try to fetch the real customer from Supabase first
        const { data: contactData, error: contactError } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', customerId)
          .single();

        if (contactError) {
          console.error('Error fetching contact:', contactError);
          // Fall back to mock data if we can't fetch the real contact
          fallbackToMockData();
          return;
        }

        // Create a customer profile from the contact data
        if (contactData) {
          const customerDetails: CustomerType = {
            id: contactData.id,
            first_name: contactData.first_name,
            last_name: contactData.last_name,
            email: contactData.email || 'No email available',
            phone: contactData.phone || 'No phone available',
            joinedDate: contactData.created_at,
            lastOrder: contactData.last_activity || new Date().toISOString(),
            lifetimeValue: Math.floor(Math.random() * 1000) + 100, // Mock data
            orderCount: Math.floor(Math.random() * 20) + 1, // Mock data
            tags: contactData.tags || [],
            customerType: getCustomerType(contactData),
            purchaseHistory: generateMockPurchaseHistory(),
            engagementHistory: generateMockEngagementHistory(),
            // Handle the case where notes might be missing from the contact data
            notes: contactData.notes || `Notes about ${getFullName(contactData)}'s preferences and history.`
          };
          
          setCustomer(customerDetails);
          // We need to pass a string to generateNoteSummary, not undefined
          generateNoteSummary(customerDetails.notes || '');
        } else {
          fallbackToMockData();
        }
      } catch (error) {
        console.error('Error fetching customer details:', error);
        fallbackToMockData();
      } finally {
        setIsLoading(false);
      }
    };

    const fallbackToMockData = () => {
      // Mock data based on customerId
      setTimeout(() => {
        const customerDetails: CustomerType = {
          id: customerId,
          first_name: customerId === 'cust_123' ? 'Emma' : 
                customerId === 'cust_124' ? 'Michael' :
                customerId === 'cust_125' ? 'Sophia' :
                customerId === 'cust_126' ? 'William' : 'Charlotte',
          last_name: customerId === 'cust_123' ? 'Johnson' : 
                 customerId === 'cust_124' ? 'Williams' :
                 customerId === 'cust_125' ? 'Miller' :
                 customerId === 'cust_126' ? 'Jones' : 'Wilson',
          email: customerId === 'cust_123' ? 'emma@example.com' :
                 customerId === 'cust_124' ? 'michael@example.com' :
                 customerId === 'cust_125' ? 'sophia@example.com' :
                 customerId === 'cust_126' ? 'william@example.com' : 'charlotte@example.com',
          phone: customerId === 'cust_123' ? '(555) 123-4567' :
                 customerId === 'cust_124' ? '(555) 234-5678' :
                 customerId === 'cust_125' ? '(555) 345-6789' :
                 customerId === 'cust_126' ? '(555) 456-7890' : '(555) 567-8901',
          joinedDate: '2023-02-15',
          lastOrder: customerId === 'cust_123' ? '2023-05-01' : 
                     customerId === 'cust_124' ? '2023-04-10' :
                     customerId === 'cust_125' ? '2023-05-12' :
                     customerId === 'cust_126' ? '2023-03-22' : '2023-04-05',
          lifetimeValue: customerId === 'cust_123' ? 735.42 :
                         customerId === 'cust_124' ? 348.95 :
                         customerId === 'cust_125' ? 1244.80 :
                         customerId === 'cust_126' ? 87.50 : 562.25,
          orderCount: customerId === 'cust_123' ? 8 :
                      customerId === 'cust_124' ? 3 :
                      customerId === 'cust_125' ? 12 :
                      customerId === 'cust_126' ? 1 : 5,
          tags: customerId === 'cust_123' ? ['loyal', 'promotion-responsive', 'weekday-shopper'] :
                customerId === 'cust_124' ? ['new-customer', 'mobile-user'] :
                customerId === 'cust_125' ? ['vip', 'high-value', 'organic'] :
                customerId === 'cust_126' ? ['one-time', 'discount-user'] : ['returning', 'referred'],
          customerType: customerId === 'cust_123' ? 'High Value Regular' :
                        customerId === 'cust_124' ? 'New Explorer' :
                        customerId === 'cust_125' ? 'VIP Advocate' :
                        customerId === 'cust_126' ? 'First-Timer' : 'Steady Returner',
          purchaseHistory: generateMockPurchaseHistory(),
          engagementHistory: generateMockEngagementHistory(),
          notes: customerId === 'cust_123' ? 'Emma prefers email communication. She shops mostly during work hours and responds well to percentage-based discounts.' :
                 customerId === 'cust_124' ? 'Michael reported an issue with his first order. We replaced the item and he was satisfied with the resolution.' :
                 customerId === 'cust_125' ? 'Sophia is an influencer who shared our products on Instagram. She has brought in several referrals. Consider for early access to new products.' :
                 customerId === 'cust_126' ? 'William only purchased once during a major sale event. Might be price-sensitive and waiting for promotions.' : 'Charlotte regularly shops from our sustainable collection. She values eco-friendly packaging and ethical sourcing.'
        };
        
        setCustomer(customerDetails);
        generateNoteSummary(customerDetails.notes);
        setIsLoading(false);
      }, 800);
    };

    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

  const getCustomerType = (contact: any) => {
    if (contact.tags?.includes('vip')) return 'VIP Advocate';
    if (contact.tags?.includes('loyal')) return 'High Value Regular';
    if (contact.tags?.includes('new-customer')) return 'New Explorer';
    return 'Regular Customer';
  };

  const generateMockPurchaseHistory = () => {
    // Generate 1-3 random purchase records
    const numPurchases = Math.floor(Math.random() * 3) + 1;
    return Array.from({ length: numPurchases }, (_, i) => ({
      id: `ord_${i + 1}`,
      date: new Date(Date.now() - (i * 1000 * 60 * 60 * 24 * 15)).toISOString(),
      items: [
        { 
          name: ['Premium T-shirt', 'Running Shoes', 'Denim Jeans', 'Winter Jacket'][Math.floor(Math.random() * 4)], 
          price: Number((Math.random() * 100 + 20).toFixed(2)), 
          quantity: Math.floor(Math.random() * 2) + 1 
        },
        { 
          name: ['Athletic Socks', 'Baseball Cap', 'Sunglasses', 'Phone Case'][Math.floor(Math.random() * 4)], 
          price: Number((Math.random() * 30 + 10).toFixed(2)), 
          quantity: Math.floor(Math.random() * 3) + 1 
        }
      ],
      total: Number((Math.random() * 150 + 50).toFixed(2))
    }));
  };

  const generateMockEngagementHistory = () => {
    // Generate 3-5 random engagement events
    const numEvents = Math.floor(Math.random() * 3) + 3;
    const types = ['email_open', 'email_click', 'sms_view', 'website_visit', 'order_placed'] as const;
    const descriptions = [
      'Opened "Summer Collection Launch" email',
      'Clicked "Shop Now" in newsletter',
      'Viewed SMS about "Weekend Flash Sale"',
      'Viewed "New Arrivals" page',
      'Placed order #12345'
    ];
    
    return Array.from({ length: numEvents }, (_, i) => ({
      id: `eng_${i + 1}`,
      date: new Date(Date.now() - (i * 1000 * 60 * 60 * 24 * 5)).toISOString(),
      type: types[i % types.length],
      description: descriptions[i % descriptions.length]
    }));
  };

  const generateNoteSummary = (notes: string) => {
    // Simulate AI-generated summary of notes
    setTimeout(() => {
      // In a real app, this would call an AI model
      const summary = notes.length > 100 
        ? notes.substring(0, 100) + "... " + "Customer prefers digital communication and responds to percentage-based offers."
        : notes;
      setNoteSummary(summary);
    }, 800);
  };

  const getEngagementIcon = (type: string) => {
    switch (type) {
      case 'email_open':
        return <MessageSquare size={14} />;
      case 'email_click':
        return <MessageSquare size={14} />;
      case 'sms_view':
        return <MessageSquare size={14} />;
      case 'website_visit':
        return <User size={14} />;
      case 'order_placed':
        return <ShoppingBag size={14} />;
      default:
        return <Calendar size={14} />;
    }
  };

  const getEngagementColor = (type: string) => {
    switch (type) {
      case 'email_open':
        return 'text-blue-500';
      case 'email_click':
        return 'text-green-500';
      case 'sms_view':
        return 'text-purple-500';
      case 'website_visit':
        return 'text-amber-500';
      case 'order_placed':
        return 'text-emerald-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[500px] bg-white shadow-xl border-l flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-medium">Customer Profile</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X size={18} />
        </Button>
      </div>
      
      {isLoading ? (
        <div className="p-4 space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      ) : customer ? (
        <>
          <div className="p-4 bg-gray-50 flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <div className="bg-primary text-2xl text-white rounded-full h-full w-full flex items-center justify-center font-medium">
                {getInitials(customer)}
              </div>
            </Avatar>
            <div>
              <h3 className="text-xl font-medium">{getFullName(customer)}</h3>
              <div className="flex items-center mt-1 space-x-2">
                <Badge className="bg-blue-100 text-blue-800 border-none hover:bg-blue-200">
                  {customer.customerType}
                </Badge>
                <div className="flex items-center text-xs text-gray-500 gap-1">
                  <Clock size={12} />
                  <span>Customer since {new Date(customer.joinedDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-4 border-b">
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                <TabsTrigger value="purchases" className="flex-1">Purchases</TabsTrigger>
                <TabsTrigger value="engagement" className="flex-1">Engagement</TabsTrigger>
              </TabsList>
            </div>
            
            <ScrollArea className="flex-1 p-4 overflow-y-auto">
              <TabsContent value="overview" className="space-y-6 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-3 flex flex-col">
                    <div className="text-sm text-gray-500">Lifetime Value</div>
                    <div className="text-2xl font-medium mt-1">${customer.lifetimeValue.toFixed(2)}</div>
                  </div>
                  <div className="border rounded-lg p-3 flex flex-col">
                    <div className="text-sm text-gray-500">Total Orders</div>
                    <div className="text-2xl font-medium mt-1">{customer.orderCount}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Contact Information</h4>
                  <div className="border rounded-lg divide-y">
                    <div className="flex justify-between p-3">
                      <span className="text-gray-500">Email</span>
                      <span className="font-medium">{customer.email}</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span className="text-gray-500">Phone</span>
                      <span className="font-medium">{customer.phone}</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span className="text-gray-500">Last Order</span>
                      <span className="font-medium">{new Date(customer.lastOrder).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Tags & Segments</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {customer.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Notes & Summary</h4>
                    <Button variant="outline" size="sm" className="h-7 gap-1" onClick={() => generateNoteSummary(customer.notes)}>
                      <Sparkles className="h-3.5 w-3.5" />
                      Regenerate Insights
                    </Button>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-sm">{customer.notes}</div>
                    {noteSummary && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-1 text-sm text-blue-700 mb-1">
                          <Sparkles className="h-4 w-4" />
                          <span>AI Summary</span>
                        </div>
                        <div className="text-sm bg-blue-50 p-2 rounded">{noteSummary}</div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="purchases" className="space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Purchase History</h4>
                  <Badge variant="outline" className="gap-1">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    {customer.orderCount} Orders
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  {customer.purchaseHistory.map((order) => (
                    <div key={order.id} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          <span className="font-medium">Order #{order.id}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(order.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{item.quantity}x {item.name}</span>
                              <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-2 border-t flex justify-between font-medium">
                          <span>Total</span>
                          <span>${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="engagement" className="space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Engagement Timeline</h4>
                  <Button variant="outline" size="sm" className="h-7 gap-1">
                    <BarChart className="h-3.5 w-3.5" />
                    Engagement Score
                  </Button>
                </div>
                
                <div className="space-y-4 relative">
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200 z-0"></div>
                  
                  {customer.engagementHistory.map((event) => (
                    <div key={event.id} className="flex gap-4 relative z-10">
                      <div className={`h-6 w-6 rounded-full bg-white border-2 flex items-center justify-center ${getEngagementColor(event.type)}`}>
                        {getEngagementIcon(event.type)}
                      </div>
                      <div className="flex-1 bg-white">
                        <div className="text-sm">{event.description}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(event.date).toLocaleDateString()} • {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
          
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-1">
                <MessageSquare className="h-4 w-4" />
                Send Message
              </Button>
              <Button className="flex-1 gap-1">
                <Sparkles className="h-4 w-4" />
                AI Recommendation
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500">Customer not found</p>
        </div>
      )}
    </div>
  );
};

export default CustomerProfilePanel;
