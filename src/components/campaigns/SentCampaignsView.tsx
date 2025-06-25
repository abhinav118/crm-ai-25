import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Search, MessageSquare, Users, Eye, Plus, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSentTelnyxCampaigns, TelnyxCampaign } from '@/hooks/useTelnyxCampaigns';
import { toast } from '@/hooks/use-toast';
import { CampaignProgressDialog } from './CampaignProgressDialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

// Simple inline MessageCell component
interface MessageCellProps {
  message: string;
  mediaUrl?: string | null;
  onView: () => void;
  className?: string;
}

const MessageCell: React.FC<MessageCellProps> = ({
  mediaUrl,
  onView,
  className = ""
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {mediaUrl ? (
        <div className="relative group">
          <img
            src={mediaUrl}
            alt="MMS"
            className="w-8 h-8 rounded object-cover border border-gray-200 bg-gray-50"
            style={{ minWidth: 32, minHeight: 32, maxWidth: 32, maxHeight: 32 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="absolute -top-1 -left-1 bg-white rounded-full shadow p-0.5">
            <ImageIcon className="w-3 h-3 text-blue-400" />
          </span>
        </div>
      ) : null}
      <Button
        variant="link"
        size="sm"
        onClick={e => { e.stopPropagation(); onView(); }}
        className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 p-0"
        tabIndex={0}
      >
        View Message
      </Button>
    </div>
  );
};

const SentCampaignsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedCampaignName, setSelectedCampaignName] = useState<string>('');
  
  const navigate = useNavigate();

  const { data: sentCampaigns = [], isLoading, error, refetch } = useSentTelnyxCampaigns();

  // Fetch segments for the filter dropdown
  const { data: segments = [] } = useQuery({
    queryKey: ['campaign-segments'],
    queryFn: async () => {
      console.log('Fetching segments for campaign filter...');
      
      const { data, error } = await supabase
        .from('contacts_segments')
        .select('segment_name')
        .order('segment_name', { ascending: true });
      
      if (error) {
        console.error('Error fetching segments:', error);
        return [];
      }

      // Remove duplicates and ensure values are trimmed
      const segmentOptions = Array.from(
        new Set((data ?? []).map(seg => seg.segment_name?.trim()).filter(Boolean))
      );

      console.log('Processed segment options for campaigns:', segmentOptions);
      return segmentOptions;
    },
  });

  // Set up Supabase Realtime listener for campaign progress updates
  useEffect(() => {
    const channel = supabase
      .channel('sent-campaigns-progress')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'telnyx_campaigns',
          filter: 'status=in.(sending,completed,failed)'
        },
        (payload) => {
          console.log('Campaign progress update received:', payload);
          // Refetch data when progress updates are received
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Auto-refresh for campaigns with incomplete progress
  useEffect(() => {
    const hasIncompleteProgress = sentCampaigns.some(
      campaign => campaign.progress_percentage < 100 && 
      (campaign.status === 'sending' || campaign.status === 'scheduled')
    );

    if (hasIncompleteProgress) {
      const interval = setInterval(() => {
        console.log('Auto-refreshing campaigns with incomplete progress');
        refetch();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [sentCampaigns, refetch]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setDateRange(undefined);
    setSelectedSegment('all');
  };

  const handleCreateCampaign = () => {
    navigate('/campaigns/create');
  };

  const handleViewMessage = (campaign: TelnyxCampaign) => {
    navigate('/campaigns/create', {
      state: {
        ...campaign,
        prefilledMessage: campaign.message,
        campaignName: campaign.campaign_name,
        recipients: campaign.recipients,
        mediaUrl: campaign.media_url,
      }
    });
  };

  const handleViewProgress = (campaign: TelnyxCampaign) => {
    setSelectedCampaignId(campaign.id);
    setSelectedCampaignName(campaign.campaign_name);
    setProgressDialogOpen(true);
  };

  const renderProgressCell = (campaign: TelnyxCampaign) => {
    if (campaign.progress_percentage < 100 && (campaign.status === 'sending' || campaign.status === 'scheduled')) {
      return (
        <div className="flex items-center gap-2">
          <Progress value={campaign.progress_percentage || 0} className="w-20" />
          <span className="text-sm text-gray-600">{campaign.progress_percentage || 0}%</span>
        </div>
      );
    } else {
      return <Badge variant="success">Completed</Badge>;
    }
  };

  const renderStatusCell = (campaign: TelnyxCampaign) => {
    if (campaign.status === 'sending') {
      return (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {campaign.status}
          </span>
          <Button
            variant="link"
            size="sm"
            onClick={() => handleViewProgress(campaign)}
            className="text-blue-600 hover:text-blue-700 text-xs"
          >
            View Progress
          </Button>
        </div>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        {campaign.status}
      </span>
    );
  };

  // Enhanced filtering logic
  const filteredCampaigns = sentCampaigns.filter((campaign) => {
    // Search filter - check campaign name and message content
    const matchesSearch = searchQuery === '' || 
      campaign.campaign_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.message?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Date range filter
    const matchesDateRange = !dateRange?.from || !dateRange?.to || 
      (campaign.created_at && 
       new Date(campaign.created_at) >= dateRange.from && 
       new Date(campaign.created_at) <= dateRange.to);
    
    // Segment filter
    const matchesSegment = selectedSegment === 'all' || 
      campaign.segment_name === selectedSegment;
    
    return matchesSearch && matchesDateRange && matchesSegment;
  });

  return (
    <div>
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Sent Text Campaigns</h1>
          <p className="text-gray-600 max-w-4xl">
            Group Texts are an effective way to attract new customers, connect with existing customers, and increase sales. Here you can create new texts and view the performance of previously sent texts.
          </p>
        </div>
        <Button onClick={handleCreateCampaign} className="bg-[#6366F1] hover:bg-[#5855EB] text-white font-medium px-6 py-2 gap-2 rounded-md">
          <Plus size={16} />
          Create Campaign
        </Button>
      </div>

      {/* Enhanced Filters Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Search Field */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search campaigns or message content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Date Range Picker */}
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MM/dd/yyyy")} – {format(dateRange.to, "MM/dd/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "MM/dd/yyyy")
                    )
                  ) : (
                    <span>Select date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Segment Filter */}
          <div>
            <Select value={selectedSegment} onValueChange={setSelectedSegment}>
              <SelectTrigger>
                <SelectValue placeholder="All Segments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                {segments.map(segment => (
                  <SelectItem key={segment} value={segment}>
                    {segment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters Button */}
          <div>
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(searchQuery || dateRange?.from || selectedSegment !== 'all') && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="text-xs">
                Search: "{searchQuery}"
              </Badge>
            )}
            {dateRange?.from && (
              <Badge variant="secondary" className="text-xs">
                Date: {format(dateRange.from, "MM/dd/yyyy")} 
                {dateRange.to && ` - ${format(dateRange.to, "MM/dd/yyyy")}`}
              </Badge>
            )}
            {selectedSegment !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Segment: {selectedSegment}
              </Badge>
            )}
            <span className="text-sm text-gray-500">
              ({filteredCampaigns.length} of {sentCampaigns.length} campaigns)
            </span>
          </div>
        )}
      </div>

      {/* Data loading/error states */}
      {isLoading && <div className="p-8 text-center">Loading...</div>}
      {error && <div className="p-8 text-center text-red-600">Failed to load campaigns.</div>}

      {/* Campaigns Table */}
      {filteredCampaigns.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Sent Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
                  <TableCell>
                    {Array.isArray(campaign.recipients) && typeof campaign.recipients[0] === 'string' && campaign.recipients[0].startsWith('+') 
                      ? campaign.recipients.length 
                      : campaign.recipients?.length || 0}
                  </TableCell>
                  <TableCell>{campaign.segment_name || 'N/A'}</TableCell>
                  <TableCell>{campaign.created_at ? format(new Date(campaign.created_at), 'MMM d, yyyy, h:mm a') : ''}</TableCell>
                  <TableCell>{renderStatusCell(campaign)}</TableCell>
                  <TableCell>{renderProgressCell(campaign)}</TableCell>
                  <TableCell>
                    <MessageCell
                      message={campaign.message}
                      mediaUrl={campaign.media_url || undefined}
                      onView={() => handleViewMessage(campaign)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <div className="text-center">
            <div className="mb-6">
              <div className="relative inline-block">
                <MessageSquare className="h-16 w-16 text-blue-500 mb-2" />
                <Users className="h-12 w-12 text-purple-500 absolute -bottom-2 -right-2" />
              </div>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-4">
              {sentCampaigns.length === 0 
                ? "You haven't created any group texts yet"
                : "No campaigns match your filters"}
            </h3>
            {sentCampaigns.length === 0 ? (
              <Button 
                variant="link" 
                onClick={handleCreateCampaign}
                className="text-blue-600 hover:text-blue-700 font-medium text-base"
              >
                CREATE A NEW TEXT NOW!
              </Button>
            ) : (
              <Button 
                variant="link" 
                onClick={handleClearFilters}
                className="text-blue-600 hover:text-blue-700 font-medium text-base"
              >
                CLEAR FILTERS
              </Button>
            )}
          </div>
        </div>
      )}
      <CampaignProgressDialog
        isOpen={progressDialogOpen}
        onClose={() => setProgressDialogOpen(false)}
        campaignId={selectedCampaignId}
        campaignName={selectedCampaignName}
      />
    </div>
  );
};

export default SentCampaignsView;
