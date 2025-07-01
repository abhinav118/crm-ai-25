
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ResponseReportData } from '@/hooks/useResponseReports';

interface ResponseReportsTableProps {
  data: ResponseReportData[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const ResponseReportsTable: React.FC<ResponseReportsTableProps> = ({
  data,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No response data available for the selected date range.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign Name</TableHead>
              <TableHead>Contact Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Sent Time</TableHead>
              <TableHead>First Reply Time</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((response, index) => (
              <TableRow key={`${response.campaignId}-${response.contactId}-${index}`}>
                <TableCell className="font-medium">{response.campaignName}</TableCell>
                <TableCell>{response.contactName}</TableCell>
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
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default ResponseReportsTable;
