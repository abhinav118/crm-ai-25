import React, { useState, createContext, useContext } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CalendarIcon, Download } from "lucide-react";
import { format, subDays, subWeeks, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import TopToolbar from '@/components/TopToolbar';
import Sidebar from '@/components/dashboard/Sidebar';
import DeliveryReports from './DeliveryReports';
import ContactsOverview from './ContactsOverview';
import MessagesOverview from './MessagesOverview';
import ResponseReports from './ResponseReports';
import { DateRange } from "react-day-picker";
import { useDeliveryReportMetrics } from '@/hooks/useDeliveryReportMetrics';
import { useContactsMetrics } from '@/hooks/useContactsMetrics';
import { exportDeliveryReport, exportContactsReport } from '@/utils/csvExport';
import { toast } from '@/hooks/use-toast';

interface DateRangeContextType {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
}

export const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

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

  // Fetch data for export functionality
  const { data: deliveryMetrics } = useDeliveryReportMetrics(dateRange);
  const { data: contactsMetrics } = useContactsMetrics(dateRange);

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

  const handleExportReport = () => {
    try {
      if (activeTab === 'delivery' && deliveryMetrics?.campaignData) {
        exportDeliveryReport(deliveryMetrics.campaignData, dateRange);
        toast({
          title: "Export Successful",
          description: "Delivery report has been downloaded as CSV.",
        });
      } else if (activeTab === 'contacts' && contactsMetrics?.segment_performance) {
        exportContactsReport(contactsMetrics.segment_performance, dateRange);
        toast({
          title: "Export Successful", 
          description: "Contacts report has been downloaded as CSV.",
        });
      } else {
        toast({
          title: "Export Failed",
          description: "No data available for export.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting the report.",
        variant: "destructive",
      });
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

  const getTabDescription = (tab: string) => {
    switch (tab) {
      case "messages":
        return "Comprehensive view of messaging activity and performance";
      case "delivery":
        return "Detailed delivery status and success rates for your campaigns";
      case "contacts":
        return "Monitor contact growth, segmentation, and engagement trends";
      case "responses":
        return "Track and analyze inbound message responses and campaign engagement";
      default:
        return "";
    }
  };

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case "messages":
        return "Messages Overview";
      case "delivery":
        return "Delivery Reports";
      case "contacts":
        return "Contacts Overview";
      case "responses":
        return "Response Reports";
      default:
        return "";
    }
  };

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange }}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />

        <div className="flex-1 ml-0 sm:ml-[234px] min-w-0">
          <TopToolbar pageTitle="Reporting" />
          <div className="space-y-6 p-2 xs:p-3 sm:p-6">
            <div className="flex flex-col gap-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="w-full overflow-x-auto">
                    <TabsList className="flex gap-2 min-w-[380px] xs:min-w-[420px] w-fit sm:w-auto px-1">
                      <TabsTrigger value="messages" className="text-xs xs:text-sm md:text-base px-3 py-2 whitespace-nowrap">Messages Overview</TabsTrigger>
                      <TabsTrigger value="delivery" className="text-xs xs:text-sm md:text-base px-3 py-2 whitespace-nowrap">Delivery Reports</TabsTrigger>
                      <TabsTrigger value="contacts" className="text-xs xs:text-sm md:text-base px-3 py-2 whitespace-nowrap">Contacts Overview</TabsTrigger>
                      <TabsTrigger value="responses" className="text-xs xs:text-sm md:text-base px-3 py-2 whitespace-nowrap">Response Reports</TabsTrigger>
                    </TabsList>
                  </div>
                  <div className="flex flex-col gap-2 xs:flex-row xs:items-center xs:gap-3 w-full xs:w-auto">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full xs:w-[180px] min-w-[140px]">
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
                    {activeTab !== "messages" && (
                      <Button 
                        onClick={handleExportReport}
                        className="bg-[#6366F1] hover:bg-[#5855EB] text-white px-4 py-2 h-10 font-medium w-full xs:w-auto whitespace-nowrap"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                      </Button>
                    )}
                  </div>
                </div>
                {showCustomRange && (
                  <div className="flex justify-end mb-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full xs:w-[275px] sm:w-[300px] justify-start text-left font-normal",
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
                      <PopoverContent className="w-full xs:w-auto p-0" align="end">
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
                <TabsContent value="messages" className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{getTabTitle("messages")}</h2>
                    <p className="text-gray-600 mt-1">{getTabDescription("messages")}</p>
                  </div>
                  <MessagesOverview />
                </TabsContent>
                <TabsContent value="delivery" className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{getTabTitle("delivery")}</h2>
                    <p className="text-gray-600 mt-1">{getTabDescription("delivery")}</p>
                  </div>
                  <DeliveryReports />
                </TabsContent>
                <TabsContent value="contacts" className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{getTabTitle("contacts")}</h2>
                    <p className="text-gray-600 mt-1">{getTabDescription("contacts")}</p>
                  </div>
                  <ContactsOverview />
                </TabsContent>
                <TabsContent value="responses" className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{getTabTitle("responses")}</h2>
                    <p className="text-gray-600 mt-1">{getTabDescription("responses")}</p>
                  </div>
                  <ResponseReports />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </DateRangeContext.Provider>
  );
};

export default ReportingPage;
