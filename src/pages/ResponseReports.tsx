
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Calendar, MessageSquare, BarChart3, Users } from "lucide-react";
import { format, differenceInMinutes, differenceInHours, differenceInDays } from "date-fns";
import { useDateRange } from './ReportingPage';
import { useResponseReports } from '@/hooks/useResponseReports';
import { DataTable } from '@/components/ui/data-table';
import { exportResponsesReport, exportCampaignResponsesReport } from '@/utils/csvExport';
import { toast } from '@/hooks/use-toast';
import { ResponseRateChart } from '@/components/reporting/ResponseRateChart';

const ResponseReports = () => {
  const { dateRange } = useDateRange();
  const [searchQuery, setSearchQuery] = useState('');
  const [allResponsesPage, setAllResponsesPage] = useState(1);
  const [campaignResponsesPage, setCampaignResponsesPage] = useState(1);
  const [allResponsesPageSize, setAllResponsesPageSize] = useState(25);
  const [campaignResponsesPageSize, setCampaignResponsesPageSize] = useState(25);

  const { 
    data: allResponsesResult, 
    isLoading: allResponsesLoading
  } = useResponseReports.getAllResponses(dateRange, allResponsesPage, allResponsesPageSize);

  const { 
    data: campaignResponsesResult, 
    isLoading: campaignResponsesLoading
  } = useResponseReports.getCampaignResponses(dateRange, campaignResponsesPage, campaignResponsesPageSize);

  const { data: responseRateData } = useResponseReports.getResponseRateChart(dateRange);

  // Extract data and totalCount from the query results
  const allResponsesData = allResponsesResult?.data || [];
  const allResponsesTotal = allResponsesResult?.totalCount || 0;
  const campaignResponsesData = campaignResponsesResult?.data || [];
  const campaignResponsesTotal = campaignResponsesResult?.totalCount || 0;

  const getReplyDelay = (sentTime: string, replyTime: string) => {
    const sent = new Date(sentTime);
    const reply = new Date(replyTime);
    
    const minutes = differenceInMinutes(reply, sent);
    const hours = differenceInHours(reply, sent);
    const days = differenceInDays(reply, sent);
    
    if (minutes < 60) {
      return `${minutes}m later`;
    } else if (hours < 24) {
      return `${hours}h later`;
    } else {
      return `${days}d later`;
    }
  };

  const allResponsesColumns = [
    {
      id: 'timestamp',
      header: '🕒 Timestamp',
      accessorKey: 'sent_at' as const,
      cell: ({ row }: { row: any }) => (
        <span className="text-sm font-medium">
          {format(new Date(row.sent_at), 'h:mm a')}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: 'contact_name',
      header: '👤 Contact',
      accessorKey: 'contact_name' as const,
      cell: ({ row }: { row: any }) => (
        <span className="font-medium text-gray-900">{row.contact_name}</span>
      ),
      enableSorting: true,
    },
    {
      id: 'phone',
      header: '📞 Phone',
      accessorKey: 'phone' as const,
      cell: ({ row }: { row: any }) => (
        <span className="text-gray-600 font-mono text-sm">{row.phone}</span>
      ),
      enableSorting: true,
    },
    {
      id: 'content',
      header: '💬 Message Body',
      accessorKey: 'content' as const,
      cell: ({ row }: { row: any }) => (
        <div className="max-w-xs">
          <p className="truncate text-gray-700" title={row.content}>
            "{row.content}"
          </p>
        </div>
      ),
    },
    {
      id: 'campaign_name',
      header: '📦 Campaign',
      accessorKey: 'campaign_name' as const,
      cell: ({ row }: { row: any }) => (
        row.campaign_name ? (
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
            {row.campaign_name}
          </Badge>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
  ];

  const campaignResponsesColumns = [
    {
      id: 'campaign_name',
      header: '📦 Campaign',
      accessorKey: 'campaign_name' as const,
      cell: ({ row }: { row: any }) => (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium">
          {row.campaign_name}
        </Badge>
      ),
      enableSorting: true,
    },
    {
      id: 'contact_name',
      header: '👤 Contact',
      accessorKey: 'contact_name' as const,
      cell: ({ row }: { row: any }) => (
        <span className="font-medium text-gray-900">{row.contact_name}</span>
      ),
      enableSorting: true,
    },
    {
      id: 'phone',
      header: '📞 Phone',
      accessorKey: 'phone' as const,
      cell: ({ row }: { row: any }) => (
        <span className="text-gray-600 font-mono text-sm">{row.phone}</span>
      ),
      enableSorting: true,
    },
    {
      id: 'sent_time',
      header: '🕒 Sent Time',
      accessorKey: 'sent_time' as const,
      cell: ({ row }: { row: any }) => (
        <span className="text-sm text-gray-600">
          {format(new Date(row.sent_time), 'MMM dd, h:mm a')}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: 'first_reply_time',
      header: '🕒 Reply Time',
      accessorKey: 'first_reply_time' as const,
      cell: ({ row }: { row: any }) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">
            {format(new Date(row.first_reply_time), 'MMM dd, h:mm a')}
          </span>
          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200 w-fit">
            {getReplyDelay(row.sent_time, row.first_reply_time)}
          </Badge>
        </div>
      ),
      enableSorting: true,
    },
    {
      id: 'message',
      header: '💬 Message',
      accessorKey: 'message' as const,
      cell: ({ row }: { row: any }) => (
        <div className="max-w-xs">
          <p className="truncate text-gray-700" title={row.message}>
            "{row.message}"
          </p>
        </div>
      ),
    },
  ];

  const handleExportAllResponses = () => {
    if (allResponsesData.length) {
      exportResponsesReport(allResponsesData, dateRange);
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
    if (campaignResponsesData.length) {
      exportCampaignResponsesReport(campaignResponsesData, dateRange);
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            Response Reports
          </h1>
          <p className="text-gray-600 mt-2">Analyze customer replies and campaign engagement over time</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search responses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <Calendar className="h-4 w-4" />
            <span>Last 7 Days</span>
          </div>
        </div>
      </div>

      {/* Section 1: All Responses */}
      <Card className="shadow-sm border-0 ring-1 ring-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                All Inbound Responses
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Complete history of customer replies</p>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={allResponsesPageSize.toString()}
                onValueChange={(value) => {
                  setAllResponsesPageSize(Number(value));
                  setAllResponsesPage(1);
                }}
              >
                <SelectTrigger className="w-20 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExportAllResponses} variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="bg-white rounded-lg border">
              <DataTable
                data={allResponsesData}
                columns={allResponsesColumns}
                className="min-w-full"
              />
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
              <div className="text-sm text-gray-600">
                Showing {((allResponsesPage - 1) * allResponsesPageSize) + 1} to {Math.min(allResponsesPage * allResponsesPageSize, allResponsesTotal)} of {allResponsesTotal} responses
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
                <span className="text-sm text-gray-500 px-2">
                  {allResponsesPage} of {Math.ceil(allResponsesTotal / allResponsesPageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAllResponsesPage(allResponsesPage + 1)}
                  disabled={allResponsesPage >= Math.ceil(allResponsesTotal / allResponsesPageSize)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Campaign Responses */}
      <Card className="shadow-sm border-0 ring-1 ring-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Campaign Response Matches
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">First response after each outbound campaign message</p>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={campaignResponsesPageSize.toString()}
                onValueChange={(value) => {
                  setCampaignResponsesPageSize(Number(value));
                  setCampaignResponsesPage(1);
                }}
              >
                <SelectTrigger className="w-20 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExportCampaignResponses} variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="bg-white rounded-lg border">
              <DataTable
                data={campaignResponsesData}
                columns={campaignResponsesColumns}
                className="min-w-full"
              />
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
              <div className="text-sm text-gray-600">
                Showing {((campaignResponsesPage - 1) * campaignResponsesPageSize) + 1} to {Math.min(campaignResponsesPage * campaignResponsesPageSize, campaignResponsesTotal)} of {campaignResponsesTotal} campaign responses
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
                <span className="text-sm text-gray-500 px-2">
                  {campaignResponsesPage} of {Math.ceil(campaignResponsesTotal / campaignResponsesPageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCampaignResponsesPage(campaignResponsesPage + 1)}
                  disabled={campaignResponsesPage >= Math.ceil(campaignResponsesTotal / campaignResponsesPageSize)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Campaign Response Rate Chart */}
      <Card className="shadow-sm border-0 ring-1 ring-gray-200">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Campaign Response Rate (%)
          </CardTitle>
          <p className="text-sm text-gray-600">Response rates across all campaigns in the selected period</p>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg border p-4">
            <ResponseRateChart data={responseRateData || []} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResponseReports;
