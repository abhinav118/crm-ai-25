
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, AlertCircle, Phone, User } from 'lucide-react';

interface ErrorDetail {
  error_details: string;
  phone_number: string;
  contact_id: string;
}

interface CampaignErrorsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  errors: ErrorDetail[];
}

export const CampaignErrorsDialog: React.FC<CampaignErrorsDialogProps> = ({
  isOpen,
  onClose,
  campaignName,
  errors
}) => {
  const handleExportErrors = () => {
    const csvContent = [
      ['Error Details', 'Phone Number', 'Contact ID'],
      ...errors.map(error => [
        error.error_details,
        error.phone_number,
        error.contact_id
      ])
    ];
    
    const csvString = csvContent.map(row => 
      row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${campaignName}_errors.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getErrorTypeColor = (errorDetails: string) => {
    if (errorDetails.toLowerCase().includes('invalid')) return 'destructive';
    if (errorDetails.toLowerCase().includes('rate limit')) return 'secondary';
    if (errorDetails.toLowerCase().includes('blocked')) return 'outline';
    return 'default';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Campaign Errors: {campaignName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">
                {errors.length} Error{errors.length !== 1 ? 's' : ''}
              </Badge>
              <span className="text-sm text-gray-600">
                Failed to deliver to {errors.length} recipient{errors.length !== 1 ? 's' : ''}
              </span>
            </div>
            <Button 
              onClick={handleExportErrors}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export Errors
            </Button>
          </div>

          <ScrollArea className="h-[400px] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Error Details</TableHead>
                  <TableHead className="w-[25%]">Phone Number</TableHead>
                  <TableHead className="w-[25%]">Contact ID</TableHead>
                  <TableHead className="w-[10%]">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errors.map((error, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <div className="max-w-sm">
                        <p className="text-sm text-gray-900 break-words">
                          {error.error_details}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="font-mono text-sm">
                          {error.phone_number}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {error.contact_id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getErrorTypeColor(error.error_details)} className="text-xs">
                        {error.error_details.toLowerCase().includes('invalid') ? 'Invalid' :
                         error.error_details.toLowerCase().includes('rate limit') ? 'Rate Limit' :
                         error.error_details.toLowerCase().includes('blocked') ? 'Blocked' :
                         'Other'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
