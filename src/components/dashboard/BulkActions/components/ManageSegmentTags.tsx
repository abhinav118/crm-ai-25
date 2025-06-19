
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ManageSegmentTagsProps {
  onActionComplete: () => void;
  segmentFilter?: string;
  availableSegments?: string[];
  onSegmentFilterChange?: (segment: string) => void;
}

const ManageSegmentTags: React.FC<ManageSegmentTagsProps> = ({
  onActionComplete,
  segmentFilter = 'all',
  availableSegments = [],
  onSegmentFilterChange
}) => {
  const [selectedSegment, setSelectedSegment] = useState(segmentFilter);
  const [selectedAction, setSelectedAction] = useState('');
  const [tagValue, setTagValue] = useState('');
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

  // Get available tags from all contacts
  const { data: availableTags } = useQuery({
    queryKey: ['available-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('tags')
        .not('tags', 'is', null);
      
      if (error) throw error;
      
      const allTags = new Set<string>();
      data?.forEach(contact => {
        contact.tags?.forEach((tag: string) => allTags.add(tag));
      });
      
      return Array.from(allTags).sort();
    },
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

    if ((selectedAction === 'add' || selectedAction === 'remove') && !tagValue) {
      toast({
        title: 'Missing Tag',
        description: 'Please enter a tag value',
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
        let newTags = [...(contact.tags || [])];
        
        switch (selectedAction) {
          case 'add':
            if (!newTags.includes(tagValue)) {
              newTags.push(tagValue);
            }
            break;
          case 'remove':
            newTags = newTags.filter(tag => tag !== tagValue);
            break;
          case 'clear':
            newTags = [];
            break;
        }

        updatedContacts.push({
          id: contact.id,
          tags: newTags
        });
      }

      // Batch update contacts
      const { error } = await supabase
        .from('contacts')
        .upsert(updatedContacts);

      if (error) throw error;

      const actionText = selectedAction === 'add' ? 'added to' : 
                        selectedAction === 'remove' ? 'removed from' : 'cleared from';
      
      toast({
        title: 'Success',
        description: `Tags ${actionText} ${contactsToUpdate.length} contacts in segment "${selectedSegment}"`,
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['segment-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['available-tags'] });
      
      onActionComplete();
      setTagValue('');
      setSelectedAction('');
      
    } catch (error) {
      console.error('Error updating segment tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tags. Please try again.',
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
          <CardTitle>Manage Segment Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Segment Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Segment</label>
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
                <SelectItem value="add">Add Tag to All Contacts</SelectItem>
                <SelectItem value="remove">Remove Tag from All Contacts</SelectItem>
                <SelectItem value="clear">Clear All Tags from All Contacts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tag Input/Selector */}
          {(selectedAction === 'add' || selectedAction === 'remove') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Tag</label>
              <div className="flex gap-2">
                <Select value={tagValue} onValueChange={setTagValue}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select existing tag or type new one..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTags?.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="text"
                  value={tagValue}
                  onChange={(e) => setTagValue(e.target.value)}
                  placeholder="Or type new tag..."
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
              </div>
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
                  <div className="flex flex-wrap gap-1">
                    {contact.tags?.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
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

export default ManageSegmentTags;
