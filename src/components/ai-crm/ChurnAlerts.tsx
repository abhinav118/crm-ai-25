
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, LifeBuoy, Mail, MessageSquare, SparkleIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ChurnRiskCustomer {
  id: string;
  name: string;
  email: string;
  riskLevel: 'high' | 'medium' | 'low';
  riskScore: number;
  reasons: string[];
  daysSinceLastOrder: number;
  recoveryAction: string;
  recoveryMessage: string;
}

const ChurnAlerts = () => {
  const [customers, setCustomers] = useState<ChurnRiskCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulating fetching churn risk customers from a database
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be a Supabase or API call
        setTimeout(() => {
          const mockCustomers: ChurnRiskCustomer[] = [
            {
              id: 'cust_201',
              name: 'Thomas Black',
              email: 'thomas@example.com',
              riskLevel: 'high',
              riskScore: 87,
              reasons: [
                'Opened emails but no order in 3 weeks',
                'Last interaction was a support ticket',
                'Viewed competitors\' ads on social media'
              ],
              daysSinceLastOrder: 45,
              recoveryAction: 'Send personalized reengagement email with discount',
              recoveryMessage: 'Hi Thomas, we noticed you haven\'t been by in a while. Here\'s a 15% discount code just for you: COMEBACK15'
            },
            {
              id: 'cust_202',
              name: 'Maria Rodriguez',
              email: 'maria@example.com',
              riskLevel: 'medium',
              riskScore: 65,
              reasons: [
                'Abandoned cart last week',
                'Decreasing engagement with emails',
                'Lower average order value'
              ],
              daysSinceLastOrder: 28,
              recoveryAction: 'Send cart abandonment reminder with free shipping',
              recoveryMessage: 'Maria, your cart is waiting! Complete your purchase now and enjoy free shipping on us.'
            },
            {
              id: 'cust_203',
              name: 'Jake Johnson',
              email: 'jake@example.com',
              riskLevel: 'high',
              riskScore: 92,
              reasons: [
                'Multiple negative product reviews',
                'Unsubscribed from newsletter',
                'Asked about return policy'
              ],
              daysSinceLastOrder: 52,
              recoveryAction: 'Send personal note from customer service manager',
              recoveryMessage: 'Jake, we value your feedback and would love to make things right. Can we schedule a quick call to discuss your experience?'
            },
            {
              id: 'cust_204',
              name: 'Sophia Williams',
              email: 'sophia@example.com',
              riskLevel: 'medium',
              riskScore: 58,
              reasons: [
                'Seasonal buyer approaching off-season',
                'Only opens promotional emails',
                'Browse but no purchase in 35 days'
              ],
              daysSinceLastOrder: 35,
              recoveryAction: 'Send early access to new seasonal collection',
              recoveryMessage: 'Sophia, get an exclusive preview of our new seasonal collection before anyone else!'
            },
            {
              id: 'cust_205',
              name: 'Ethan Park',
              email: 'ethan@example.com',
              riskLevel: 'low',
              riskScore: 42,
              reasons: [
                'Reduced website visit frequency',
                'No social media engagement',
                'Last order smaller than usual'
              ],
              daysSinceLastOrder: 21,
              recoveryAction: 'Send product recommendation based on past purchases',
              recoveryMessage: 'Ethan, based on your previous orders, we think you\'ll love these new items we just got in!'
            }
          ];
          
          setCustomers(mockCustomers);
          setIsLoading(false);
        }, 1200);
        
      } catch (error) {
        console.error('Error fetching churn risk customers:', error);
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const sendRecoveryMessage = (customer: ChurnRiskCustomer) => {
    // In a real app, this would send the message through the appropriate channel
    console.log(`Sending recovery message to ${customer.name}: ${customer.recoveryMessage}`);
    // Optimistic UI update
    setCustomers(customers.filter(c => c.id !== customer.id));
  };

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Churn Alerts
          </CardTitle>
          <Badge className="bg-red-100 text-red-800 border-none">
            {customers.length} At Risk
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-md p-3 space-y-3">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ))}
            </div>
          ) : customers.length > 0 ? (
            <Accordion type="multiple" className="space-y-3">
              {customers.map((customer) => (
                <AccordionItem 
                  key={customer.id} 
                  value={customer.id}
                  className="border rounded-md overflow-hidden"
                >
                  <AccordionTrigger className="px-3 py-2 hover:no-underline">
                    <div className="flex items-center w-full">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <div className="bg-primary text-white rounded-full h-full w-full flex items-center justify-center text-xs font-medium">
                            {customer.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        </Avatar>
                        <div className="text-left">
                          <h4 className="font-medium">{customer.name}</h4>
                          <div className="text-xs text-gray-500">
                            {customer.daysSinceLastOrder} days since last order
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={getRiskBadgeColor(customer.riskLevel)}
                      >
                        {customer.riskLevel} risk
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3">
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-sm font-medium mb-1">Risk Factors:</h5>
                        <ul className="text-sm space-y-1">
                          {customer.reasons.map((reason, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-1">Suggested Recovery:</h5>
                        <div className="bg-blue-50 p-2 rounded-md text-sm flex items-start gap-2">
                          <SparkleIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>{customer.recoveryAction}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="gap-1"
                          onClick={() => sendRecoveryMessage(customer)}
                        >
                          <Mail className="h-4 w-4" />
                          Send Email
                        </Button>
                        <Button 
                          size="sm"
                          className="gap-1"
                          onClick={() => sendRecoveryMessage(customer)}
                        >
                          <MessageSquare className="h-4 w-4" />
                          Send SMS
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <LifeBuoy className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-gray-700 font-medium">No churn risks detected</h3>
                <p className="mt-1 text-gray-500 text-sm">All your customers are currently in good standing.</p>
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ChurnAlerts;
