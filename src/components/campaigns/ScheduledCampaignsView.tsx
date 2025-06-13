
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Search, MessageSquare, Users, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ScheduledCampaignsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [recipientsFilter, setRecipientsFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<any>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch scheduled campaigns
  const { data: scheduledCampaigns = [], isLoading } = useQuery({
    queryKey: ['scheduled-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telnyx_campaigns')
        .select('*')
        .eq('schedule_type', 'later')
        .not('schedule_time', 'is', null)
        .eq('status', 'scheduled')
        .order('schedule_time', { ascending: true });

      if (error) {
        console.error('Error fetching scheduled campaigns:', error);
        toast({
          title: "Error",
          description: "Failed to load scheduled campaigns",
          variant: "destructive",
        });
        return [];
      }
      return data || [];
    }
  });

  const handleClearFilters = () => {
    setSearchQuery('');
    setDateRange(undefined);
    setRecipientsFilter('all');
  };

  const handleCreateCampaign = () => {
    navigate('/campaigns/create');
  };

  const handleEditCampaign = (campaign: any) => {
    navigate(`/campaigns/create?editCampaignId=${campaign.id}`);
  };

  const handleDeleteClick = (campaign: any) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!campaignToDelete) return;

    try {
      // Delete from telnyx_campaigns
      const { error: campaignError } = await supabase
        .from('telnyx_campaigns')
        .delete()
        .eq('id', campaignToDelete.id);

      if (campaignError) throw campaignError;

      // Delete related scheduled_jobs if they exist
      const { error: jobError } = await supabase
        .from('scheduled_jobs')
        .delete()
        .eq('type', 'send_sms')
        .contains('payload', { campaign_id: campaignToDelete.id });

      if (jobError) {
        console.warn('No related scheduled jobs found or error deleting:', jobError);
      }

      // Refresh the campaigns list
      queryClient.invalidateQueries({ queryKey: ['scheduled-campaigns'] });

      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });

      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: "Failed to delete campaign. Please try again",
        variant: "destructive",
      });
    }
  };

  // Filter campaigns based on search query and recipients
  const filteredCampaigns = scheduledCampaigns.filter(campaign => {
    const matchesSearch = campaign.campaign_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.message?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const recipientCount = campaign.recipients?.length || 0;
    const matchesRecipients = recipientsFilter === 'all' || 
                             (recipientsFilter === 'customers' && recipientCount > 100) ||
                             (recipientsFilter === 'prospects' && recipientCount <= 100) ||
                             (recipientsFilter === 'vip' && recipientCount > 200);
    
    return matchesSearch && matchesRecipients;
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

      {/* Filters Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          {/* Search Field */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search"
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
                    <span>mm/dd/yyyy – mm/dd/yyyy</span>
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

          {/* Recipients Filter */}
          <div>
            <Select value={recipientsFilter} onValueChange={setRecipientsFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Recipients: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Recipients: All</SelectItem>
                <SelectItem value="customers">Customers</SelectItem>
                <SelectItem value="prospects">Prospects</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end items-center mt-4">
          {/* Clear Filter */}
          <Button 
            variant="link" 
            onClick={handleClearFilters}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            CLEAR
          </Button>
        </div>
      </div>

      {/* Campaigns Table */}
      {filteredCampaigns.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Message Preview</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Scheduled Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
                  <TableCell className="max-w-xs">
                    <span className="truncate block">
                      {campaign.message?.substring(0, 40)}
                      {campaign.message && campaign.message.length > 40 ? '...' : ''}
                    </span>
                  </TableCell>
                  <TableCell>{campaign.recipients?.length || 0}</TableCell>
                  <TableCell>
                    {campaign.schedule_time ? format(new Date(campaign.schedule_time), 'MMM d, yyyy h:mm a') : 'Not set'}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Scheduled
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCampaign(campaign)}
                        className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(campaign)}
                        className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
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
              {isLoading ? 'Loading scheduled campaigns...' : 'You haven\'t scheduled any group texts yet'}
            </h3>
            {!isLoading && (
              <Button 
                variant="link" 
                onClick={handleCreateCampaign}
                className="text-blue-600 hover:text-blue-700 font-medium text-base"
              >
                CREATE A NEW TEXT NOW!
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this scheduled campaign?</DialogTitle>
            <DialogDescription>
              This action will cancel the message before it's sent. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduledCampaignsView;
