
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Download } from "lucide-react";
import { format, subDays, subWeeks, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { useDateRange } from './ReportingPage';
import { useResponseReports } from '@/hooks/useResponseReports';
import { DataTable } from '@/components/ui/data-table';
import { exportResponsesReport, exportCampaignResponsesReport } from '@/utils/csvExport';
import { toast } from '@/hooks/use-toast';
import { ResponseRateChart } from '@/components/reporting/ResponseRateChart';

const ResponseReports = () => {
  const { dateRange } = useDateRange();
  const [allResponsesPage, setAllResponsesPage] = useState(1);
  const [campaignResponsesPage, setCampaignResponsesPage] = useState(1);
  const [allResponsesPageSize, setAllResponsesPageSize] = useState(25);
  const [campaignResponsesPageSize, setCampaignResponsesPageSize] = useState(25);

  const { 
    data: allResponses, 
    isLoading: allResponsesLoading,
    totalCount: allResponsesTotal
  } = useResponseReports.getAllResponses(dateRange, allResponsesPage, allResponsesPageSize);

  const { 
    data: campaignResponses, 
    isLoading: campaignResponsesLoading,
    totalCount: campaignResponsesTotal
  } = useResponseReports.getCampaignResponses(dateRange, campaignResponsesPage, campaignResponsesPageSize);

  const { data: responseRateData } = useResponseReports.getResponseRateChart(dateRange);

  const allResponsesColumns = [
    {
      id: 'timestamp',
      header: 'Timestamp',
      accessorKey: 'sent_at' as const,
      cell: ({ row }: { row: any }) => format(new Date(row.sent_at), 'MMM dd, yyyy hh:mm a'),
      enableSorting: true,
    },
    {
      id: 'contact_name',
      header: 'Contact Name',
      accessorKey: 'contact_name' as const,
      enableSorting: true,
    },
    {
      id: 'phone',
      header: 'Phone',
      accessorKey: 'phone' as const,
      enableSorting: true,
    },
    {
      id: 'content',
      header: 'Message Body',
      accessorKey: 'content' as const,
      cell: ({ row }: { row: any }) => (
        <div className="max-w-xs truncate" title={row.content}>
          {row.content}
        </div>
      ),
    },
    {
      id: 'campaign_name',
      header: 'Campaign Name',
      accessorKey: 'campaign_name' as const,
      cell: ({ row }: { row: any }) => row.campaign_name || '-',
    },
  ];

  const campaignResponsesColumns = [
    {
      id: 'campaign_name',
      header: 'Campaign Name',
      accessorKey: 'campaign_name' as const,
      enableSorting: true,
    },
    {
      id: 'contact_name',
      header: 'Contact Name',
      accessorKey: 'contact_name' as const,
      enableSorting: true,
    },
    {
      id: 'phone',
      header: 'Phone',
      accessorKey: 'phone' as const,
      enableSorting: true,
    },
    {
      id: 'sent_time',
      header: 'Sent Time',
      accessorKey: 'sent_time' as const,
      cell: ({ row }: { row: any }) => format(new Date(row.sent_time), 'MMM dd, yyyy hh:mm a'),
      enableSorting: true,
    },
    {
      id: 'first_reply_time',
      header: 'First Reply Time',
      accessorKey: 'first_reply_time' as const,
      cell: ({ row }: { row: any }) => format(new Date(row.first_reply_time), 'MMM dd, yyyy hh:mm a'),
      enableSorting: true,
    },
    {
      id: 'message',
      header: 'Message',
      accessorKey: 'message' as const,
      cell: ({ row }: { row: any }) => (
        <div className="max-w-xs truncate" title={row.message}>
          {row.message}
        </div>
      ),
    },
  ];

  const handleExportAllResponses = () => {
    if (allResponses?.length) {
      exportResponsesReport(allResponses, dateRange);
      toast({
        title: "Export Successful",
        description: "All responses report has been downloaded as CSV.",
      });
    } else {
      toast({
        title: "Export Failed",
        description: "No data available for export.",
        variant: "destructive",
      });
    }
  };

  const handleExportCampaignResponses = () => {
    if (campaignResponses?.length) {
      exportCampaignResponsesReport(campaignResponses, dateRange);
      toast({
        title: "Export Successful",
        description: "Campaign responses report has been downloaded as CSV.",
      });
    } else {
      toast({
        title: "Export Failed",
        description: "No data available for export.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Response Reports</h2>
        <p className="text-gray-600 mt-1">Track and analyze inbound message responses</p>
      </div>

      {/* Section 1: All Responses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Responses</CardTitle>
          <Button onClick={handleExportAllResponses} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <DataTable
              data={allResponses || []}
              columns={allResponsesColumns}
              className="min-w-full"
            />
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Rows per page:</span>
                <Select
                  value={allResponsesPageSize.toString()}
                  onValueChange={(value) => {
                    setAllResponsesPageSize(Number(value));
                    setAllResponsesPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAllResponsesPage(Math.max(1, allResponsesPage - 1))}
                  disabled={allResponsesPage <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-500">
                  Page {allResponsesPage} of {Math.ceil((allResponsesTotal || 0) / allResponsesPageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAllResponsesPage(allResponsesPage + 1)}
                  disabled={allResponsesPage >= Math.ceil((allResponsesTotal || 0) / allResponsesPageSize)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Campaign Responses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Campaign Responses</CardTitle>
          <Button onClick={handleExportCampaignResponses} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <DataTable
              data={campaignResponses || []}
              columns={campaignResponsesColumns}
              className="min-w-full"
            />
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Rows per page:</span>
                <Select
                  value={campaignResponsesPageSize.toString()}
                  onValueChange={(value) => {
                    setCampaignResponsesPageSize(Number(value));
                    setCampaignResponsesPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCampaignResponsesPage(Math.max(1, campaignResponsesPage - 1))}
                  disabled={campaignResponsesPage <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-500">
                  Page {campaignResponsesPage} of {Math.ceil((campaignResponsesTotal || 0) / campaignResponsesPageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCampaignResponsesPage(campaignResponsesPage + 1)}
                  disabled={campaignResponsesPage >= Math.ceil((campaignResponsesTotal || 0) / campaignResponsesPageSize)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Campaign Response Rate Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Response Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponseRateChart data={responseRateData || []} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ResponseReports;
