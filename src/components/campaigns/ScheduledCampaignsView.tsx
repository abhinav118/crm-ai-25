
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Search, MessageSquare, Users, Plus, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useScheduledTelnyxCampaigns, TelnyxCampaign, useDeleteTelnyxCampaign } from '@/hooks/useTelnyxCampaigns';
import { toast } from '@/hooks/use-toast';
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

const ScheduledCampaignsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedSegment, setSelectedSegment] = useState('all');
  
  const navigate = useNavigate();

  const { data: scheduledCampaigns = [], isLoading, error } = useScheduledTelnyxCampaigns();
  const deleteCampaign = useDeleteTelnyxCampaign();

  // Fetch segments for the filter dropdown
  const { data: segments = [] } = useQuery({
    queryKey: ['campaign-segments-scheduled'],
    queryFn: async () => {
      console.log('Fetching segments for scheduled campaigns filter...');
      
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

      console.log('Processed segment options for scheduled campaigns:', segmentOptions);
      return segmentOptions;
    },
  });

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

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this scheduled campaign?')) {
      deleteCampaign.mutate(id, {
        onSuccess: () => {
          toast({ title: 'Campaign deleted', description: 'The campaign was deleted successfully.' });
        },
        onError: () => {
          toast({ title: 'Error', description: 'Failed to delete campaign.' });
        }
      });
    }
  };

  // Enhanced filtering logic
  const filteredCampaigns = scheduledCampaigns.filter((campaign) => {
    // Search filter - check campaign name and message content
    const matchesSearch = searchQuery === '' || 
      campaign.campaign_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.message?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Date range filter for schedule_time
    const matchesDateRange = !dateRange?.from || !dateRange?.to || 
      (campaign.schedule_time && 
       new Date(campaign.schedule_time) >= dateRange.from && 
       new Date(campaign.schedule_time) <= dateRange.to);
    
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
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Scheduled Text Campaigns</h1>
          <p className="text-gray-600 max-w-4xl">
            Group Texts are an effective way to attract new customers, connect with existing customers, and increase sales. Here you can create new texts and edit the settings of previously scheduled texts.
          </p>
        </div>
        <Button 
          onClick={handleCreateCampaign} 
          className="bg-[#6366F1] hover:bg-[#5855EB] text-white font-medium px-6 py-2 gap-2 rounded-md"
        >
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

          {/* Date Range Picker for Schedule Time */}
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
                    <span>Select schedule date range</span>
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
                Schedule Date: {format(dateRange.from, "MM/dd/yyyy")} 
                {dateRange.to && ` - ${format(dateRange.to, "MM/dd/yyyy")}`}
              </Badge>
            )}
            {selectedSegment !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Segment: {selectedSegment}
              </Badge>
            )}
            <span className="text-sm text-gray-500">
              ({filteredCampaigns.length} of {scheduledCampaigns.length} campaigns)
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
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Actions</TableHead>
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
                  <TableCell>
                    {campaign.schedule_time
                      ? format(new Date(campaign.schedule_time), 'MMM d, yyyy, h:mm a')
                      : ''}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {campaign.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <MessageCell
                      message={campaign.message}
                      mediaUrl={campaign.media_url || undefined}
                      onView={() => handleViewMessage(campaign)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-red-500 hover:text-red-600 ml-2"
                      onClick={() => handleDelete(campaign.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <div className="text-center">
            <div className="mb-6">
              <div className="relative inline-block">
                <MessageSquare className="h-16 w-16 text-blue-500 mb-2" />
                <Users className="h-12 w-12 text-purple-500 absolute -bottom-2 -right-2" />
              </div>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-4">
              {scheduledCampaigns.length === 0 
                ? "You haven't scheduled any group texts yet"
                : "No campaigns match your filters"}
            </h3>
            {scheduledCampaigns.length === 0 ? (
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
    </div>
  );
};

export default ScheduledCampaignsView;
