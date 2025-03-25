import React from 'react';
import { ProcessedContact } from './types';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ReviewStageProps {
  contacts: ProcessedContact[];
  stats: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  status: 'idle' | 'in-progress' | 'complete' | 'error';
  progress: number;
  onImport: () => void;
}

const ReviewStage: React.FC<ReviewStageProps> = ({
  contacts,
  stats,
  status,
  progress,
  onImport,
}) => {
  // Preview just the first 5 contacts
  const previewContacts = contacts.slice(0, 5);

  // Format phone number for display
  const formatPhone = (phone: string | null) => {
    if (!phone) return '';
    
    // Remove non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return phone;
  };

  const getStatusBadge = (contact: ProcessedContact) => {
    if (contact.action === 'create') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <PlusCircle size={12} className="mr-1" /> New
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <RefreshCw size={12} className="mr-1" /> Update
        </Badge>
      );
    }
  };

  const renderImportStatus = () => {
    if (status === 'idle') {
      return (
        <div className="bg-muted/40 p-4 rounded-md">
          <p className="text-sm text-muted-foreground">
            Review your import settings before proceeding.
          </p>
        </div>
      );
    } else if (status === 'in-progress') {
      return (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-md">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium text-blue-700">
              Importing contacts...
            </p>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-blue-600">
              {Math.round(progress)}% complete
            </p>
          </div>
        </div>
      );
    } else if (status === 'complete') {
      return (
        <div className="bg-green-50 border border-green-100 p-4 rounded-md">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <div>
              <p className="text-sm font-medium text-green-700">
                Import complete!
              </p>
              <p className="text-xs text-green-600 mt-1">
                Successfully imported {stats.total - stats.errors - stats.skipped} contacts.
                {stats.created > 0 && ` Created ${stats.created} new contacts.`}
                {stats.updated > 0 && ` Updated ${stats.updated} existing contacts.`}
                {stats.errors > 0 && ` Failed to import ${stats.errors} contacts due to errors.`}
              </p>
            </div>
          </div>
        </div>
      );
    } else if (status === 'error') {
      return (
        <div className="bg-red-50 border border-red-100 p-4 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <p className="text-sm font-medium text-red-700">
                Import failed
              </p>
              <p className="text-xs text-red-600 mt-1">
                An error occurred during the import process. Please try again.
              </p>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-4">Review Import</h3>
        
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-muted/30 p-3 rounded-md">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-md">
            <p className="text-sm text-green-700">Create</p>
            <p className="text-2xl font-semibold text-green-700">{stats.created}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">Update</p>
            <p className="text-2xl font-semibold text-blue-700">{stats.updated}</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-md">
            <p className="text-sm text-amber-700">Errors</p>
            <p className="text-2xl font-semibold text-amber-700">{stats.errors}</p>
          </div>
        </div>
        
        {renderImportStatus()}
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium mb-2">Preview ({Math.min(5, contacts.length)} of {contacts.length} contacts)</h4>
        
        <ScrollArea className="h-[300px] border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Action</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewContacts.map((contact, index) => (
                <TableRow key={index}>
                  <TableCell>{getStatusBadge(contact)}</TableCell>
                  <TableCell className="font-medium">{contact.data.name || '—'}</TableCell>
                  <TableCell>{contact.data.email || '—'}</TableCell>
                  <TableCell>{formatPhone(contact.data.phone) || '—'}</TableCell>
                  <TableCell>{contact.data.company || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={contact.data.status === 'active' ? 'default' : 'secondary'}>
                      {contact.data.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {contact.data.tags && contact.data.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {contact.data.tags.slice(0, 2).map((tag: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {contact.data.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{contact.data.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <div className="flex justify-end pt-4">
        {status === 'idle' && (
          <Button 
            onClick={onImport}
            disabled={contacts.length === 0}
            className="gap-2"
          >
            Import {contacts.length} Contacts
          </Button>
        )}
        {status === 'error' && (
          <Button 
            onClick={onImport}
            variant="outline"
            className="gap-2"
          >
            Retry Import
          </Button>
        )}
      </div>
    </div>
  );
};

export default ReviewStage; 