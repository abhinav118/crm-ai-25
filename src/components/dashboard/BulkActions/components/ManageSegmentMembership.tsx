
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ManageSegmentMembershipProps {
  onActionComplete: () => void;
  segmentFilter?: string;
  availableSegments?: string[];
  onSegmentFilterChange?: (segment: string) => void;
}

const ManageSegmentMembership: React.FC<ManageSegmentMembershipProps> = ({
  onActionComplete,
  segmentFilter = 'all',
  availableSegments = [],
  onSegmentFilterChange
}) => {
  const [selectedSegment, setSelectedSegment] = useState(segmentFilter);
  const [selectedAction, setSelectedAction] = useState('');
  const [newSegmentName, setNewSegmentName] = useState('');
  const [targetSegment, setTargetSegment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch contacts for the selected segment
  const { data: segmentContacts, isLoading: isLoadingContacts } = useQuery({
    queryKey: ['segment-contacts', selectedSegment],
    queryFn: async () => {
      console.log('Fetching contacts for segment:', selectedSegment);
      
      let query = supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply segment filter if not "all"
      if (selectedSegment !== 'all') {
        query = query.eq('segment_name', selectedSegment);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching segment contacts:', error);
        throw error;
      }

      console.log('Fetched segment contacts:', data?.length);
      return data || [];
    },
    enabled: !!selectedSegment,
  });

  const handleApplyAction = async () => {
    if (!selectedAction || !selectedSegment || selectedSegment === 'all') {
      toast({
        title: 'Invalid Selection',
        description: 'Please select a segment and action',
        variant: 'destructive'
      });
      return;
    }

    if (selectedAction === 'move' && !targetSegment) {
      toast({
        title: 'Missing Target',
        description: 'Please select a target segment',
        variant: 'destructive'
      });
      return;
    }

    if (selectedAction === 'rename' && !newSegmentName) {
      toast({
        title: 'Missing Name',
        description: 'Please enter a new segment name',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const contactsToUpdate = segmentContacts || [];
      
      if (contactsToUpdate.length === 0) {
        toast({
          title: 'No Contacts',
          description: 'No contacts found in the selected segment',
          variant: 'destructive'
        });
        return;
      }

      let updatedContacts = [];

      for (const contact of contactsToUpdate) {
        let newSegmentName = contact.segment_name;
        
        switch (selectedAction) {
          case 'move':
            newSegmentName = targetSegment;
            break;
          case 'rename':
            newSegmentName = newSegmentName;
            break;
          case 'remove':
            newSegmentName = null;
            break;
        }

        updatedContacts.push({
          id: contact.id,
          segment_name: newSegmentName
        });
      }

      // Batch update contacts
      const { error } = await supabase
        .from('contacts')
        .upsert(updatedContacts);

      if (error) throw error;

      let successMessage = '';
      switch (selectedAction) {
        case 'move':
          successMessage = `Moved ${contactsToUpdate.length} contacts from "${selectedSegment}" to "${targetSegment}"`;
          break;
        case 'rename':
          successMessage = `Renamed segment "${selectedSegment}" to "${newSegmentName}" for ${contactsToUpdate.length} contacts`;
          break;
        case 'remove':
          successMessage = `Removed ${contactsToUpdate.length} contacts from segment "${selectedSegment}"`;
          break;
      }
      
      toast({
        title: 'Success',
        description: successMessage,
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['segment-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-segments'] });
      
      onActionComplete();
      setNewSegmentName('');
      setTargetSegment('');
      setSelectedAction('');
      
    } catch (error) {
      console.error('Error updating segment membership:', error);
      toast({
        title: 'Error',
        description: 'Failed to update segment membership. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSegmentChange = (segment: string) => {
    setSelectedSegment(segment);
    onSegmentFilterChange?.(segment);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Segment Membership</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Segment Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Source Segment</label>
            <Select value={selectedSegment} onValueChange={handleSegmentChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Segment..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" disabled>All Segments (Select a specific segment)</SelectItem>
                {availableSegments.map((segment) => (
                  <SelectItem key={segment} value={segment}>
                    {segment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contacts Count */}
          {selectedSegment !== 'all' && (
            <div className="text-sm text-gray-600">
              {isLoadingContacts ? (
                'Loading contacts...'
              ) : (
                `${segmentContacts?.length || 0} contacts in "${selectedSegment}" segment`
              )}
            </div>
          )}

          {/* Action Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Action</label>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Action..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="move">Move to Another Segment</SelectItem>
                <SelectItem value="rename">Rename Current Segment</SelectItem>
                <SelectItem value="remove">Remove from Segment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Segment Selector for Move */}
          {selectedAction === 'move' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Segment</label>
              <div className="flex gap-2">
                <Select value={targetSegment} onValueChange={setTargetSegment}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select target segment..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSegments
                      .filter(segment => segment !== selectedSegment)
                      .map((segment) => (
                        <SelectItem key={segment} value={segment}>
                          {segment}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Input
                  value={targetSegment}
                  onChange={(e) => setTargetSegment(e.target.value)}
                  placeholder="Or type new segment name..."
                  className="flex-1"
                />
              </div>
            </div>
          )}

          {/* New Segment Name for Rename */}
          {selectedAction === 'rename' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">New Segment Name</label>
              <Input
                value={newSegmentName}
                onChange={(e) => setNewSegmentName(e.target.value)}
                placeholder="Enter new segment name..."
              />
            </div>
          )}

          {/* Apply Button */}
          <Button 
            onClick={handleApplyAction}
            disabled={isLoading || !selectedAction || selectedSegment === 'all'}
            className="w-full"
          >
            {isLoading ? 'Applying...' : 'Apply Action'}
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      {selectedSegment !== 'all' && segmentContacts && segmentContacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview - Contacts in "{selectedSegment}"</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {segmentContacts.slice(0, 5).map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{contact.first_name} {contact.last_name}</div>
                    <div className="text-sm text-gray-500">{contact.email}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {contact.segment_name || 'No Segment'}
                  </Badge>
                </div>
              ))}
              {segmentContacts.length > 5 && (
                <div className="text-sm text-gray-500 text-center">
                  And {segmentContacts.length - 5} more contacts...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManageSegmentMembership;
