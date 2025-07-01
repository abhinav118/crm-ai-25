
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponseReportData } from '@/hooks/useResponseReports';
import { exportResponseReports } from '@/utils/csvExport';
import { toast } from '@/hooks/use-toast';
import { DateRange } from "react-day-picker";

interface ResponseCampaignSubsectionProps {
  campaignName: string;
  allResponses: ResponseReportData[];
  onBack: () => void;
  dateRange?: DateRange;
}

const ResponseCampaignSubsection: React.FC<ResponseCampaignSubsectionProps> = ({
  campaignName,
  allResponses,
  onBack,
  dateRange,
}) => {
  const filteredResponses = allResponses.filter(
    response => response.campaignName === campaignName
  );

  const handleExportFiltered = () => {
    try {
      if (filteredResponses.length > 0) {
        exportResponseReports(filteredResponses, dateRange);
        toast({
          title: "Export Successful",
          description: `Responses for "${campaignName}" have been downloaded as CSV.`,
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-[#6366F1] hover:text-[#5855EB] hover:bg-[#6366F1]/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Responses
          </Button>
          <CardTitle>Responses for "{campaignName}"</CardTitle>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Sent Time</TableHead>
                  <TableHead>First Reply Time</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResponses.map((response, index) => (
                  <TableRow key={`${response.campaignId}-${response.contactId}-${index}`}>
                    <TableCell className="font-medium">{response.contactName}</TableCell>
                    <TableCell>{response.phone}</TableCell>
                    <TableCell>{response.sentTime}</TableCell>
                    <TableCell>{response.firstReplyTime}</TableCell>
                    <TableCell className="max-w-xs truncate" title={response.message}>
                      {response.message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 text-sm text-gray-500">
              Showing {filteredResponses.length} response{filteredResponses.length !== 1 ? 's' : ''} for "{campaignName}"
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResponseCampaignSubsection;
