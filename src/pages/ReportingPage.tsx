
import React, { useState, createContext, useContext } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CalendarIcon, Download } from "lucide-react";
import { format, subDays, subWeeks, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import Sidebar from '@/components/dashboard/Sidebar';
import DeliveryReports from './DeliveryReports';
import CampaignPerformance from './CampaignPerformance';
import ContactsOverview from './ContactsOverview';
import MessagesOverview from './MessagesOverview';
import { DateRange } from "react-day-picker";

interface DateRangeContextType {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export const useDateRange = () => {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
};

const ReportingPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("messages");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [showCustomRange, setShowCustomRange] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleRangeSelect = (range: string) => {
    const today = new Date();
    
    switch (range) {
      case 'day':
        setDateRange({
          from: subDays(today, 1),
          to: today,
        });
        setShowCustomRange(false);
        break;
      case 'week':
        setDateRange({
          from: subWeeks(today, 1),
          to: today,
        });
        setShowCustomRange(false);
        break;
      case 'month':
        setDateRange({
          from: subMonths(today, 1),
          to: today,
        });
        setShowCustomRange(false);
        break;
      case 'custom':
        setShowCustomRange(true);
        break;
    }
  };

  const getSelectedRangeLabel = () => {
    if (!dateRange?.from || !dateRange?.to) return 'Select Date Range';
    
    const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 1) return 'Past Day';
    if (daysDiff <= 7) return 'Past Week';
    if (daysDiff <= 31) return 'Past Month';
    
    return `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`;
  };

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange }}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />
        
        <div className="flex-1 space-y-6 p-4 sm:p-6 ml-0 sm:ml-[240px]">
          {/* Header with Date Filter and Export Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 px-2">
            <h1 className="text-2xl font-bold text-primary">Reporting</h1>
            
            <div className="flex items-center gap-4 ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-[150px]">
                    {getSelectedRangeLabel()} <CalendarIcon className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleRangeSelect("day")}>Past Day</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRangeSelect("week")}>Past Week</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRangeSelect("month")}>Past Month</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRangeSelect("custom")}>Custom Range</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Conditionally show Export button - hide on Messages Overview */}
              {activeTab !== "messages" && (
                <Button variant="default">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              )}
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {showCustomRange && (
            <div className="flex justify-end px-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[300px] justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
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
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="messages" className="text-xs sm:text-sm">Messages Overview</TabsTrigger>
              <TabsTrigger value="delivery" className="text-xs sm:text-sm">Delivery Reports</TabsTrigger>
              <TabsTrigger value="campaign" className="text-xs sm:text-sm">Campaign Performance</TabsTrigger>
              <TabsTrigger value="contacts" className="text-xs sm:text-sm">Contacts Overview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="messages" className="space-y-4">
              <MessagesOverview />
            </TabsContent>
            
            <TabsContent value="delivery" className="space-y-4">
              <DeliveryReports />
            </TabsContent>
            
            <TabsContent value="campaign" className="space-y-4">
              <CampaignPerformance />
            </TabsContent>
            
            <TabsContent value="contacts" className="space-y-4">
              <ContactsOverview />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DateRangeContext.Provider>
  );
};

export default ReportingPage;
