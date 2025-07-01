
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDateRange } from './ReportingPage';
import { useResponseReports } from '@/hooks/useResponseReports';
import { exportResponseReports } from '@/utils/csvExport';
import { toast } from '@/hooks/use-toast';
import ResponseRateChart from '@/components/reporting/ResponseRateChart';
import ResponseReportsTable from '@/components/reporting/ResponseReportsTable';
import { Skeleton } from '@/components/ui/skeleton';

const ResponseReports = () => {
  const { dateRange } = useDateRange();
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const { data: responseData, isLoading } = useResponseReports(dateRange, currentPage, pageSize);

  const handleExport = () => {
    try {
      if (responseData?.responses && responseData.responses.length > 0) {
        exportResponseReports(responseData.responses, dateRange);
        toast({
          title: "Export Successful",
          description: "Response report has been downloaded as CSV.",
        });
      } else {
        toast({
          title: "Export Failed",
          description: "No response data available for export.",
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

  const handleExportFiltered = () => {
    try {
      const filteredResponses = responseData?.responses?.filter(
        response => response.campaignName === selectedCampaign
      ) || [];
      
      if (filteredResponses.length > 0) {
        exportResponseReports(filteredResponses, dateRange);
        toast({
          title: "Export Successful",
          description: `Responses for "${selectedCampaign}" have been downloaded as CSV.`,
        });
      } else {
        toast({
          title: "Export Failed",
          description: "No response data available for this campaign.",
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

  const handleCampaignClick = (campaignName: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedCampaign(campaignName);
      setIsTransitioning(false);
    }, 150);
  };

  const handleBackToAll = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedCampaign(null);
      setIsTransitioning(false);
    }, 150);
  };

  const filteredResponses = selectedCampaign 
    ? responseData?.responses?.filter(response => response.campaignName === selectedCampaign) || []
    : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Chart Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full rounded-lg" />
          </CardContent>
        </Card>
        {/* Table Skeleton */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <Skeleton className="h-6 w-1/4 mb-2" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-[100px] rounded" />
              <Skeleton className="h-10 w-24 rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Response Rate Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Response Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponseRateChart data={responseData?.chartData || []} />
        </CardContent>
      </Card>

      {/* Campaign Responses Table with Slide Animation */}
      <Card>
        <div className="relative overflow-hidden">
          {/* All Campaigns View */}
          <div className={`transition-transform duration-300 ease-in-out ${
            selectedCampaign ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'
          } ${isTransitioning ? 'pointer-events-none' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Campaign Responses</CardTitle>
              <div className="flex items-center gap-4">
                <Select value={pageSize.toString()} onValueChange={(value) => {
                  setPageSize(parseInt(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleExport} className="bg-[#6366F1] hover:bg-[#5855EB] text-white">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponseReportsTable 
                data={responseData?.responses || []}
                totalCount={responseData?.totalCount || 0}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onCampaignClick={handleCampaignClick}
              />
            </CardContent>
          </div>

          {/* Selected Campaign View */}
          <div className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
            selectedCampaign ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          } ${isTransitioning ? 'pointer-events-none' : ''}`}>
            {selectedCampaign && (
              <>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      onClick={handleBackToAll}
                      className="text-[#6366F1] hover:text-[#5855EB] hover:bg-[#6366F1]/10"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to All Responses
                    </Button>
                    <CardTitle>Responses for "{selectedCampaign}"</CardTitle>
                  </div>
                  <Button
                    onClick={handleExportFiltered}
                    className="bg-[#6366F1] hover:bg-[#5855EB] text-white"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  {filteredResponses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No responses found for this campaign.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-medium">Contact Name</th>
                            <th className="text-left p-2 font-medium">Phone</th>
                            <th className="text-left p-2 font-medium">Sent Time</th>
                            <th className="text-left p-2 font-medium">First Reply Time</th>
                            <th className="text-left p-2 font-medium">Message</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredResponses.map((response, index) => (
                            <tr key={`${response.campaignId}-${response.contactId}-${index}`} className="border-b">
                              <td className="p-2 font-medium">{response.contactName}</td>
                              <td className="p-2">{response.phone}</td>
                              <td className="p-2">{response.sentTime}</td>
                              <td className="p-2">{response.firstReplyTime}</td>
                              <td className="p-2 max-w-xs truncate" title={response.message}>
                                {response.message}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="mt-4 text-sm text-gray-500">
                        Showing {filteredResponses.length} response{filteredResponses.length !== 1 ? 's' : ''} for "{selectedCampaign}"
                      </div>
                    </div>
                  )}
                </CardContent>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ResponseReports;
