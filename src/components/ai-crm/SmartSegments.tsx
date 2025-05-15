
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Users, Sparkles, ArrowRight, Eye } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface Segment {
  id: string;
  name: string;
  description: string;
  size: number;
  tags: string[];
  filters: {
    key: string;
    value: string;
  }[];
}

const SmartSegments = () => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [activeSegment, setActiveSegment] = useState<Segment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulating fetching segments from a database
    const fetchSegments = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be a Supabase or API call
        setTimeout(() => {
          const mockSegments: Segment[] = [
            {
              id: 'seg_1',
              name: 'Loyal Customers',
              description: 'Customers who ordered 3+ times in the past 60 days',
              size: 158,
              tags: ['high-value', 'active'],
              filters: [
                { key: 'Orders count (60d)', value: '≥ 3' },
                { key: 'Average order value', value: '≥ $45' }
              ]
            },
            {
              id: 'seg_2',
              name: 'Dropped Off After 1st Order',
              description: 'Made one purchase but didn\'t return within 30 days',
              size: 76,
              tags: ['at-risk', 'one-time'],
              filters: [
                { key: 'Orders count', value: '= 1' },
                { key: 'Days since last order', value: '≥ 30' }
              ]
            },
            {
              id: 'seg_3',
              name: 'Promo Sensitive',
              description: 'Only makes purchases with discount codes',
              size: 124,
              tags: ['price-sensitive', 'occasional'],
              filters: [
                { key: 'Orders with discounts', value: '= 100%' },
                { key: 'Promotion opens', value: '≥ 80%' }
              ]
            },
            {
              id: 'seg_4',
              name: 'Potential Advocates',
              description: 'High engagement, frequent purchases, likely to refer',
              size: 52,
              tags: ['engaged', 'high-value'],
              filters: [
                { key: 'Engagement score', value: '≥ 8/10' },
                { key: 'Orders count (90d)', value: '≥ 4' }
              ]
            },
            {
              id: 'seg_5',
              name: 'Birthday This Month',
              description: 'Customers with birthdays in the current month',
              size: 38,
              tags: ['celebration', 'personalization'],
              filters: [
                { key: 'Birthday', value: 'This month' },
                { key: 'Profile completeness', value: '≥ 75%' }
              ]
            }
          ];
          
          setSegments(mockSegments);
          setActiveSegment(mockSegments[0]);
          setIsLoading(false);
        }, 1500);
        
      } catch (error) {
        console.error('Error fetching segments:', error);
        setIsLoading(false);
      }
    };

    fetchSegments();
  }, []);

  const handleSegmentClick = (segment: Segment) => {
    setActiveSegment(segment);
  };

  const handleCreateCampaign = () => {
    if (!activeSegment) return;
    // In a real app, this would navigate to the campaign creator with the segment pre-selected
    console.log(`Creating campaign for segment: ${activeSegment.name}`);
    // Example: router.push(`/campaigns/new?segmentId=${activeSegment.id}`);
  };

  function getTagColor(tag: string) {
    switch (tag) {
      case 'high-value':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'at-risk':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'one-time':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'price-sensitive':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'occasional':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'engaged':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'celebration':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'personalization':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Smart Segments
          </CardTitle>
          <Button size="sm" variant="outline" className="gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            Generate New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 h-[400px]">
          <div className="col-span-1 border rounded-md overflow-hidden">
            <div className="p-2 bg-muted/20 border-b">
              <h3 className="text-sm font-medium">AI-Generated Segments</h3>
            </div>
            <ScrollArea className="h-[357px]">
              {isLoading ? (
                <div className="p-3 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <div className="flex gap-1 mt-1">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {segments.map((segment) => (
                    <div
                      key={segment.id}
                      className={`p-3 cursor-pointer border-b ${
                        activeSegment?.id === segment.id
                          ? "bg-blue-50"
                          : ""
                      } hover:bg-gray-50`}
                      onClick={() => handleSegmentClick(segment)}
                    >
                      <h4 className="font-medium">{segment.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{segment.size} customers</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {segment.tags.map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="outline" 
                            className={`text-xs py-0 ${getTagColor(tag)}`}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          
          <div className="col-span-2 border rounded-md overflow-hidden">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-gray-400" />
                  <p className="mt-2 text-gray-500">Loading segments...</p>
                </div>
              </div>
            ) : activeSegment ? (
              <div className="h-full flex flex-col">
                <div className="p-3 border-b bg-muted/20">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{activeSegment.name}</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-1 h-8">
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </Button>
                      <Button size="sm" className="gap-1 h-8" onClick={handleCreateCampaign}>
                        Create Campaign
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="mb-6">
                    <p className="text-gray-600 mb-2">{activeSegment.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {activeSegment.tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className={`${getTagColor(tag)}`}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Segment Size</h4>
                      <div className="flex items-center gap-4">
                        <Progress 
                          value={Math.min(activeSegment.size / 10, 100)} 
                          className="h-2"
                        />
                        <span className="font-medium text-sm">{activeSegment.size} customers</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Segment Filters</h4>
                      <div className="space-y-2">
                        {activeSegment.filters.map((filter, index) => (
                          <div key={index} className="flex justify-between bg-gray-50 p-2 rounded-md">
                            <span className="text-sm text-gray-700">{filter.key}</span>
                            <span className="text-sm font-medium">{filter.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Recommended Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="justify-start gap-2">
                        <Sparkles className="h-4 w-4" />
                        Generate Email Campaign
                      </Button>
                      <Button variant="outline" className="justify-start gap-2">
                        <Sparkles className="h-4 w-4" />
                        Generate SMS Sequence
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">Select a segment to view details</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartSegments;
