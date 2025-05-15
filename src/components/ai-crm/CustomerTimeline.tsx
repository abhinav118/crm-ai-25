
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  ShoppingBag, 
  MessageSquare, 
  Heart,
  Clock, 
  Star, 
  User, 
  Gift, 
  ArrowRight
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  date: string;
  type: 'first_order' | 'birthday' | 'coupon_sent' | 'inactive' | 're_engaged' | 'milestone' | 'review' | 'support' | 'referral';
  title: string;
  description?: string;
}

interface CustomerTimelineProps {
  customerId: string | null;
}

const CustomerTimeline = ({ customerId }: CustomerTimelineProps) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only fetch data when a customer is selected
    if (!customerId) {
      setEvents([]);
      return;
    }

    const fetchTimelineEvents = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be a Supabase or API call
        setTimeout(() => {
          const mockEvents: TimelineEvent[] = [
            {
              id: 'event_1',
              date: '2022-11-15',
              type: 'first_order',
              title: 'First Order',
              description: 'Placed first order of $89.99'
            },
            {
              id: 'event_2',
              date: '2023-01-12',
              type: 'birthday',
              title: 'Birthday',
              description: 'Customer birthday - sent special offer'
            },
            {
              id: 'event_3',
              date: '2023-02-05',
              type: 'coupon_sent',
              title: 'Coupon Sent',
              description: '20% off coupon sent via email'
            },
            {
              id: 'event_4',
              date: '2023-03-20',
              type: 'inactive',
              title: 'Inactive Period',
              description: 'No activity for 30 days'
            },
            {
              id: 'event_5',
              date: '2023-04-10',
              type: 're_engaged',
              title: 'Re-engaged',
              description: 'Returned to shop after recovery email'
            },
            {
              id: 'event_6',
              date: '2023-05-05',
              type: 'milestone',
              title: '5th Purchase',
              description: 'Achieved VIP status with 5th purchase'
            },
            {
              id: 'event_7',
              date: '2023-05-25',
              type: 'review',
              title: 'Left Review',
              description: 'Posted a 5-star product review'
            }
          ];
          
          setEvents(mockEvents);
          setIsLoading(false);
        }, 800);
        
      } catch (error) {
        console.error('Error fetching timeline events:', error);
        setIsLoading(false);
      }
    };

    fetchTimelineEvents();
  }, [customerId]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'first_order':
        return <ShoppingBag className="h-full w-full p-1" />;
      case 'birthday':
        return <Gift className="h-full w-full p-1" />;
      case 'coupon_sent':
        return <MessageSquare className="h-full w-full p-1" />;
      case 'inactive':
        return <Clock className="h-full w-full p-1" />;
      case 're_engaged':
        return <ArrowRight className="h-full w-full p-1" />;
      case 'milestone':
        return <Star className="h-full w-full p-1" />;
      case 'review':
        return <Heart className="h-full w-full p-1" />;
      case 'support':
        return <MessageSquare className="h-full w-full p-1" />;
      case 'referral':
        return <User className="h-full w-full p-1" />;
      default:
        return <Calendar className="h-full w-full p-1" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'first_order':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'birthday':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'coupon_sent':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'inactive':
        return 'bg-red-100 text-red-700 border-red-300';
      case 're_engaged':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'milestone':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'review':
        return 'bg-pink-100 text-pink-700 border-pink-300';
      case 'support':
        return 'bg-indigo-100 text-indigo-700 border-indigo-300';
      case 'referral':
        return 'bg-cyan-100 text-cyan-700 border-cyan-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Customer Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {customerId ? (
          isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <ScrollArea className="w-full h-[100px]">
                <div className="flex gap-4 min-w-max py-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-2 w-[120px]">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-4">
              <p className="text-gray-500 text-sm">Customer journey highlights</p>
              <ScrollArea className="w-full">
                <div className="flex min-w-max py-2">
                  {events.map((event, index) => (
                    <div key={event.id} className="flex flex-col items-center relative px-4">
                      {/* Connection line */}
                      {index < events.length - 1 && (
                        <div className="absolute top-[30px] left-[calc(50%+24px)] h-[1px] w-[calc(100%-48px)] border-t border-dashed border-gray-300" />
                      )}
                      
                      {/* Event icon */}
                      <div 
                        className={`relative z-10 h-[60px] w-[60px] flex items-center justify-center rounded-full ${getEventColor(event.type)}`}
                      >
                        {getEventIcon(event.type)}
                      </div>
                      
                      {/* Event title */}
                      <div className="mt-2 text-center w-[120px]">
                        <span className="font-medium text-sm">{event.title}</span>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                        {event.description && (
                          <div className="text-xs text-gray-700 mt-1">
                            {event.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">No timeline events found for this customer</p>
            </div>
          )
        ) : (
          <div className="p-6 flex items-center justify-center">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Select a customer to view their timeline
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerTimeline;
