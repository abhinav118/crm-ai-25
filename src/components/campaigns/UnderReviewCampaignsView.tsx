import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Search, MessageSquare, Users, Eye, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Sample under review campaign data for demonstration
const sampleCampaigns = [
  {
    id: '1',
    name: 'Holiday Special Offer',
    message: 'Hi {{first_name}}! 🎁 Special holiday discount - Get 25% off your next order with code HOLIDAY25. Limited time offer!',
    recipients: 280,
    submitted: '2024-01-16',
    status: 'under review'
  },
  {
    id: '2', 
    name: 'New Product Launch',
    message: 'Hey {{first_name}}! We\'re excited to introduce our new product line. Be the first to try it with 20% off! 🚀',
    recipients: 95,
    submitted: '2024-01-15',
    status: 'under review'
  }
];

const UnderReviewCampaignsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [recipientsFilter, setRecipientsFilter] = useState('all');
  
  const navigate = useNavigate();

  const handleClearFilters = () => {
    setSearchQuery('');
    setDateRange(undefined);
    setRecipientsFilter('all');
  };

  const handleCreateCampaign = () => {
    navigate('/campaigns/create');
  };

  const handleViewMessage = (campaign: typeof sampleCampaigns[0]) => {
    navigate('/campaigns/create', {
      state: {
        prefilledMessage: campaign.message,
        campaignName: campaign.name
      }
    });
  };

  // Filter campaigns based on search query and recipients
  const filteredCampaigns = sampleCampaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRecipients = recipientsFilter === 'all' || 
                             (recipientsFilter === 'customers' && campaign.recipients > 100) ||
                             (recipientsFilter === 'prospects' && campaign.recipients <= 100) ||
                             (recipientsFilter === 'vip' && campaign.recipients > 200);
    
    return matchesSearch && matchesRecipients;
  });

  return (
    <div>
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Under Review</h1>
          <p className="text-gray-600 max-w-4xl">
            These messages are under review from our Compliance team to ensure they adhere to wireless carrier rules and regulations. Once a message has been approved, you may send it at any time. You can{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700">learn more here</a>.
          </p>
        </div>
        <Button onClick={handleCreateCampaign} className="bg-[#6366F1] hover:bg-[#5855EB] text-white font-medium px-6 py-2 gap-2 rounded-md">
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
                <TableHead>Recipients</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{campaign.recipients}</TableCell>
                  <TableCell>{format(new Date(campaign.submitted), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {campaign.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleViewMessage(campaign)}
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View Message
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
              No campaigns under review
            </h3>
            <Button 
              variant="link" 
              onClick={handleCreateCampaign}
              className="text-blue-600 hover:text-blue-700 font-medium text-base"
            >
              CREATE A NEW TEXT NOW!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnderReviewCampaignsView;
