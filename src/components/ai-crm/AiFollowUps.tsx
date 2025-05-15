
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, MessageSquare, Sparkles, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';

interface FollowUpSuggestion {
  id: string;
  customerId: string;
  customerName: string;
  action: string;
  reason: string;
  suggestedMessage: string;
  daysSinceLastOrder: number;
  priority: 'high' | 'medium' | 'low';
}

const AiFollowUps = () => {
  const [suggestions, setSuggestions] = useState<FollowUpSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  useEffect(() => {
    // Simulating fetching follow-up suggestions from a database
    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be a Supabase or API call
        setTimeout(() => {
          const mockSuggestions: FollowUpSuggestion[] = [
            {
              id: 'sug_1',
              customerId: 'cust_101',
              customerName: 'Samantha Lee',
              action: 'Send $5 coupon',
              reason: 'Hasn\'t ordered in 21 days',
              suggestedMessage: 'Hi Samantha, we miss you! Enjoy $5 off your next order with code WELCOME5.',
              daysSinceLastOrder: 21,
              priority: 'high'
            },
            {
              id: 'sug_2',
              customerId: 'cust_102',
              customerName: 'Robert Chen',
              action: 'Send product review request',
              reason: 'Purchased premium item 7 days ago',
              suggestedMessage: 'Hi Robert, how are you enjoying your new purchase? We\'d love to hear your thoughts!',
              daysSinceLastOrder: 7,
              priority: 'medium'
            },
            {
              id: 'sug_3',
              customerId: 'cust_103',
              customerName: 'Jessica Martinez',
              action: 'Offer exclusive preview',
              reason: 'VIP customer with birthday next week',
              suggestedMessage: 'Happy early birthday, Jessica! As a valued customer, we\'re giving you exclusive early access to our new collection.',
              daysSinceLastOrder: 14,
              priority: 'high'
            },
            {
              id: 'sug_4',
              customerId: 'cust_104',
              customerName: 'David Wilson',
              action: 'Send reactivation email',
              reason: 'Abandoned cart 3 days ago',
              suggestedMessage: 'Hi David, you left some items in your cart! They\'re still waiting for you with a 10% discount.',
              daysSinceLastOrder: 30,
              priority: 'medium'
            },
            {
              id: 'sug_5',
              customerId: 'cust_105',
              customerName: 'Amanda Taylor',
              action: 'Recommend complementary products',
              reason: 'Recent purchase could be enhanced',
              suggestedMessage: 'Amanda, we noticed you recently purchased our premium yoga mat. Complete your setup with our matching accessories!',
              daysSinceLastOrder: 5,
              priority: 'low'
            }
          ];
          
          setSuggestions(mockSuggestions);
          setIsLoading(false);
        }, 1000);
        
      } catch (error) {
        console.error('Error fetching follow-up suggestions:', error);
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  const handleApprove = (suggestionId: string) => {
    // In a real app, this would send the approved suggestion to be executed
    console.log(`Approved suggestion: ${suggestionId}`);
    // Remove the suggestion from the list
    setSuggestions(suggestions.filter(suggestion => suggestion.id !== suggestionId));
  };

  const handleIgnore = (suggestionId: string) => {
    // In a real app, this would mark the suggestion as ignored
    console.log(`Ignored suggestion: ${suggestionId}`);
    // Remove the suggestion from the list
    setSuggestions(suggestions.filter(suggestion => suggestion.id !== suggestionId));
  };

  const handleSendSms = (suggestion: FollowUpSuggestion) => {
    // In a real app, this would send an SMS with the suggested message
    console.log(`Sending SMS to ${suggestion.customerName}: ${suggestion.suggestedMessage}`);
    // Remove the suggestion from the list
    setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
  };

  const handleSelectSuggestion = (suggestionId: string) => {
    setSelectedSuggestion(suggestionId === selectedSuggestion ? null : suggestionId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Follow-Ups
          </CardTitle>
          <Badge className="bg-green-100 text-green-800 border-none">
            {suggestions.length} Suggestions
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
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-20 rounded-md" />
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="border rounded-md overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
                       onClick={() => handleSelectSuggestion(suggestion.id)}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <div className="bg-primary text-white rounded-full h-full w-full flex items-center justify-center text-xs font-medium">
                          {suggestion.customerName.split(' ').map(n => n[0]).join('')}
                        </div>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{suggestion.customerName}</h4>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <AlertCircle className="h-3 w-3" />
                          <span>{suggestion.reason}</span>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={getPriorityColor(suggestion.priority)}
                    >
                      {suggestion.priority} priority
                    </Badge>
                  </div>
                  
                  <div className={`transition-all duration-200 ${
                    selectedSuggestion === suggestion.id ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                  }`}>
                    <div className="p-3 border-t">
                      <div className="mb-3">
                        <div className="text-sm font-medium mb-1">Suggested Action:</div>
                        <div className="text-sm flex items-center gap-1">
                          <Sparkles className="h-4 w-4 text-blue-500" />
                          {suggestion.action}
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="text-sm font-medium mb-1">Suggested Message:</div>
                        <div className="text-sm bg-blue-50 p-2 rounded-md">
                          "{suggestion.suggestedMessage}"
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="gap-1"
                          onClick={() => handleIgnore(suggestion.id)}
                        >
                          <XCircle className="h-4 w-4" />
                          Ignore
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="gap-1"
                          onClick={() => handleApprove(suggestion.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button 
                          size="sm"
                          className="gap-1"
                          onClick={() => handleSendSms(suggestion)}
                        >
                          <MessageSquare className="h-4 w-4" />
                          Send SMS
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Sparkles className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-gray-700 font-medium">No follow-ups needed</h3>
                <p className="mt-1 text-gray-500 text-sm">All your customers are engaged!</p>
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AiFollowUps;
