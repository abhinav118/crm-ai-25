
import React, { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { fetchContactLogs, formatLogEntry } from '@/utils/contactLogger';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, MessageSquare, Tag, User, Pencil, Trash } from 'lucide-react';
import Avatar from './Avatar';
import { supabase } from '@/integrations/supabase/client';

type LogEntry = {
  id: string;
  description: string;
  date: string;
  action: string;
  contact: any;
  timestamp: string;
};

const BulkActionsTable = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getLogs = async () => {
      setIsLoading(true);
      try {
        const logsData = await fetchContactLogs();
        const formattedLogs = logsData.map(formatLogEntry);
        setLogs(formattedLogs);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getLogs();

    // Set up realtime subscription
    const subscription = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_logs'
        },
        () => {
          // Refresh logs when a new log is added
          getLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Helper function to get icon based on action
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'add':
        return <User className="h-4 w-4 text-green-500" />;
      case 'update':
        return <Pencil className="h-4 w-4 text-blue-500" />;
      case 'delete':
        return <Trash className="h-4 w-4 text-red-500" />;
      case 'message_sent':
        return <MessageSquare className="h-4 w-4 text-indigo-500" />;
      case 'message_received':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <CalendarIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get badge color based on action
  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'add':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'message_sent':
        return 'bg-indigo-100 text-indigo-800';
      case 'message_received':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatActionType = (action: string) => {
    switch (action) {
      case 'add':
        return 'Add';
      case 'update':
        return 'Update';
      case 'delete':
        return 'Delete';
      case 'message_sent':
        return 'Sent';
      case 'message_received':
        return 'Received';
      default:
        return action.replace('_', ' ');
    }
  };

  const columns = [
    {
      id: 'contact',
      header: 'Contact',
      cell: ({ row }: { row: any }) => {
        const log = row.original;
        const contact = log.contact || {};
        return (
          <div className="flex items-center gap-2">
            {contact.name && <Avatar name={contact.name} size="sm" />}
            <div>
              <div className="font-medium">{contact.name || 'Unknown Contact'}</div>
              {contact.email && <div className="text-xs text-gray-500">{contact.email}</div>}
            </div>
          </div>
        );
      },
    },
    {
      id: 'action',
      header: 'Action',
      cell: ({ row }: { row: any }) => {
        const log = row.original;
        return (
          <div className="flex items-center gap-2">
            {getActionIcon(log.action)}
            <Badge variant="outline" className={`${getActionBadgeColor(log.action)} border-0`}>
              {formatActionType(log.action)}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      cell: ({ row }: { row: any }) => {
        const log = row.original;
        // Show message content if available
        if ((log.action === 'message_sent' || log.action === 'message_received') && log.contact?.message) {
          return (
            <div>
              <div>{log.description}</div>
              <div className="text-sm text-gray-500 mt-1 italic">"{log.contact.message}"</div>
            </div>
          );
        }
        // Show tags if this was a tag update
        if (log.action === 'update' && log.contact?.tags && log.contact.tags.length > 0) {
          return (
            <div>
              <div>{log.description}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {log.contact.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="px-2 py-0.5 text-xs flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          );
        }
        return log.description;
      },
    },
    {
      id: 'date',
      header: 'Date',
      accessorKey: 'date',
    },
  ];

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
    <div className="glass-card">
      <DataTable
        data={logs}
        columns={columns}
      />
    </div>
  );
};

export default BulkActionsTable;
