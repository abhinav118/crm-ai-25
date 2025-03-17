
import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchContactLogs } from '@/utils/contactLogger';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Mail } from 'lucide-react';

type LogEntry = {
  id: string;
  action: string;
  contact_info: any;
  created_at: string;
};

const BulkActionsTable: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const loadLogs = async () => {
      setIsLoading(true);
      const data = await fetchContactLogs();
      setLogs(data);
      setIsLoading(false);
    };

    loadLogs();

    // Set up realtime subscription for new logs
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_logs'
        },
        (payload) => {
          console.log('Realtime update for contact_logs:', payload);
          loadLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    }).format(date);
  };

  const getActionColor = (action: string) => {
    switch(action) {
      case 'add': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'message_sent': return 'bg-indigo-100 text-indigo-800';
      case 'message_received': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch(action) {
      case 'message_sent':
      case 'message_received':
        return action.includes('email') ? <Mail size={14} className="mr-1" /> : <MessageSquare size={14} className="mr-1" />;
      default:
        return null;
    }
  };

  const getActionLabel = (action: string) => {
    switch(action) {
      case 'add': return 'ADDED';
      case 'update': return 'UPDATED';
      case 'delete': return 'DELETED';
      case 'message_sent': return 'MESSAGE SENT';
      case 'message_received': return 'MESSAGE RECEIVED';
      default: return action.toUpperCase();
    }
  };

  const handleViewDetails = (log: LogEntry) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {formatDate(log.created_at)}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getActionColor(log.action)} flex items-center`}>
                      {getActionIcon(log.action)}
                      {getActionLabel(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.contact_info.name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(log)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Contact Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedLog?.action.includes('message') 
                ? 'Message Details' 
                : 'Contact Details'}
            </DialogTitle>
            <DialogDescription>
              {getActionLabel(selectedLog?.action || '')} at {selectedLog && formatDate(selectedLog.created_at)}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-1">
              {selectedLog && selectedLog.action.includes('message') && selectedLog.contact_info.message && (
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="font-medium text-sm mb-1">Message:</p>
                  <p className="text-gray-700">{selectedLog.contact_info.message}</p>
                  
                  {selectedLog.contact_info.channel && (
                    <div className="mt-2 flex items-center">
                      <span className="text-xs text-gray-500 mr-2">Via:</span>
                      <Badge variant="outline">
                        {selectedLog.contact_info.channel}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
              
              {selectedLog && Object.entries(selectedLog.contact_info)
                .filter(([key]) => !['message', 'id', 'updated_at'].includes(key))
                .map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 gap-2">
                    <div className="font-medium capitalize col-span-1">{key.replace(/_/g, ' ')}:</div>
                    <div className="col-span-2">
                      {Array.isArray(value) ? (
                        <div className="flex flex-wrap gap-1">
                          {(value as string[]).map((item, i) => (
                            <Badge key={i} variant="outline" className="px-2 py-0.5 text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      ) : typeof value === 'object' && value !== null ? (
                        <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : (
                        String(value || '-')
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BulkActionsTable;
