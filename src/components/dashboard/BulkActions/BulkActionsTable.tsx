
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface ContactInfo {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface BulkActionsTableProps {
  segmentFilter?: string;
  availableSegments?: string[];
  onSegmentFilterChange?: (segment: string) => void;
}

const BulkActionsTable: React.FC<BulkActionsTableProps> = ({
  segmentFilter = 'all',
  availableSegments = [],
  onSegmentFilterChange
}) => {
  const [selectedSegment, setSelectedSegment] = useState(segmentFilter);

  // Fetch contact logs filtered by segment
  const { data: activityLogs, isLoading } = useQuery({
    queryKey: ['contact-logs', selectedSegment],
    queryFn: async () => {
      console.log('Fetching activity logs for segment:', selectedSegment);
      
      let query = supabase
        .from('contact_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: logs, error } = await query;
      
      if (error) {
        console.error('Error fetching activity logs:', error);
        throw error;
      }

      // If we have a segment filter, filter the logs by contacts in that segment
      if (selectedSegment !== 'all') {
        // Get contacts in the selected segment
        const { data: segmentContacts, error: contactsError } = await supabase
          .from('contacts')
          .select('id, first_name, last_name')
          .eq('segment_name', selectedSegment);
        
        if (contactsError) {
          console.error('Error fetching segment contacts:', contactsError);
          throw contactsError;
        }

        const segmentContactIds = new Set(segmentContacts?.map(c => c.id) || []);
        
        // Filter logs to only include activities related to contacts in the segment
        const filteredLogs = logs?.filter(log => {
          const contactInfo = log.contact_info as ContactInfo;
          return contactInfo?.id && segmentContactIds.has(contactInfo.id);
        }) || [];

        return filteredLogs;
      }

      return logs || [];
    },
  });

  const handleSegmentChange = (segment: string) => {
    setSelectedSegment(segment);
    onSegmentFilterChange?.(segment);
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'add':
        return 'success';
      case 'update':
        return 'default';
      case 'delete':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Segment Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Filter by Segment</label>
            <Select value={selectedSegment} onValueChange={handleSegmentChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Segment..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                {availableSegments.map((segment) => (
                  <SelectItem key={segment} value={segment}>
                    {segment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results Info */}
          <div className="text-sm text-gray-600">
            {isLoading ? (
              'Loading activity logs...'
            ) : (
              `${activityLogs?.length || 0} activities found${selectedSegment !== 'all' ? ` for "${selectedSegment}" segment` : ''}`
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 border rounded animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="w-32 h-4 bg-gray-200 rounded" />
                    <div className="w-16 h-4 bg-gray-200 rounded" />
                  </div>
                  <div className="w-48 h-3 bg-gray-200 rounded mt-2" />
                </div>
              ))}
            </div>
          ) : activityLogs && activityLogs.length > 0 ? (
            <div className="space-y-2">
              {activityLogs.map((log) => {
                const contactInfo = log.contact_info as ContactInfo;
                return (
                  <div key={log.id} className="p-3 border rounded hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                        <span className="font-medium">
                          {contactInfo?.first_name} {contactInfo?.last_name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {contactInfo?.email && (
                        <div>Email: {contactInfo.email}</div>
                      )}
                      {log.batch_name && (
                        <div>Batch: {log.batch_name}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No activity logs found{selectedSegment !== 'all' ? ` for "${selectedSegment}" segment` : ''}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkActionsTable;
