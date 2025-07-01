
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDateRange } from './ReportingPage';
import { useResponseReports } from '@/hooks/useResponseReports';
import { exportResponseReports } from '@/utils/csvExport';
import { toast } from '@/hooks/use-toast';
import ResponseRateChart from '@/components/reporting/ResponseRateChart';
import ResponseReportsTable from '@/components/reporting/ResponseReportsTable';

const ResponseReports = () => {
  const { dateRange } = useDateRange();
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
        <div className="h-96 bg-gray-100 animate-pulse rounded-lg"></div>
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

      {/* Campaign Responses Table */}
      <Card>
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
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ResponseReports;
