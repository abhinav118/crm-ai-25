
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Search, MessageSquare, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Sidebar from '@/components/dashboard/Sidebar';
import { DateRange } from 'react-day-picker';

const CampaignsPage: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [statusFilter, setStatusFilter] = useState('all');
  const [recipientsFilter, setRecipientsFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const handleClearFilters = () => {
    setSearchQuery('');
    setDateRange(undefined);
    setStatusFilter('all');
    setRecipientsFilter('all');
    setTypeFilter('all');
  };

  const handleCreateCampaign = () => {
    // This would navigate to campaign creation or open a modal
    console.log('Create campaign clicked');
  };

  const handleCreateNewText = () => {
    // Same action as create campaign button
    handleCreateCampaign();
  };

  return (
    <div className="flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-[70px]' : 'ml-[240px]'}`}>
        <div className="p-8">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Sent Text Campaigns</h1>
              <p className="text-gray-600 max-w-4xl">
                Group Texts are an effective way to attract new customers, connect with existing customers, and increase sales. Here you can create new texts and view the performance of previously sent texts.
              </p>
            </div>
            <Button onClick={handleCreateCampaign} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2">
              CREATE CAMPAIGN
            </Button>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
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
              <div className="lg:col-span-2">
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

              {/* Status Filter */}
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Status: All</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
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

            <div className="flex justify-between items-center mt-4">
              {/* Type Filter */}
              <div className="w-48">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Type: All</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

          {/* Empty State */}
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <div className="text-center">
              <div className="mb-6">
                <div className="relative inline-block">
                  <MessageSquare className="h-16 w-16 text-blue-500 mb-2" />
                  <Users className="h-12 w-12 text-purple-500 absolute -bottom-2 -right-2" />
                </div>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                You haven't created any group texts yet
              </h3>
              <Button 
                variant="link" 
                onClick={handleCreateNewText}
                className="text-blue-600 hover:text-blue-700 font-medium text-base"
              >
                CREATE A NEW TEXT NOW!
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignsPage;
