
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchContactLogs, formatLogEntry } from '@/utils/contactLogger';

export type LogEntry = {
  id: string;
  description: string;
  date: string;
  action: string;
  contact: any;
  timestamp: string;
};

export const useBulkActionsData = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getLogs = async () => {
      setIsLoading(true);
      try {
        const logsData = await fetchContactLogs();
        
        // Ensure each log has the required fields before formatting
        const validLogs = logsData.filter(log => log && log.action);
        
        console.log('Fetched logs:', validLogs);
        
        // If we have valid logs, format them, otherwise use empty array
        const formattedLogs = validLogs.length > 0 
          ? validLogs.map(log => formatLogEntry(log))
          : [];
          
        setLogs(formattedLogs);
      } catch (error) {
        console.error('Error fetching logs:', error);
        setLogs([]); // Set empty array on error
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

  return { logs, isLoading };
};
