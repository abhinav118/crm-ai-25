import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Contact } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ManageSegmentMembershipProps {
  selectedContacts: Contact[];
  availableSegments: string[];
  segmentFilter: string;
  onSegmentFilterChange: (segment: string) => void;
}

const ManageSegmentMembership: React.FC<ManageSegmentMembershipProps> = ({
  selectedContacts,
  availableSegments,
  segmentFilter,
  onSegmentFilterChange
}) => {
  const [contactSegments, setContactSegments] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchContactSegments();
  }, [selectedContacts]);

  const fetchContactSegments = async () => {
    try {
      const { data: contactsData, error } = await supabase
        .from('contacts')
        .select('id, segments')
        .in('id', selectedContacts);

      if (error) throw error;

      const contactSegmentMap: Record<string, string[]> = {};
      contactsData.forEach(contact => {
        contactSegmentMap[contact.id] = contact.segments || [];
      });

      setContactSegments(contactSegmentMap);
    } catch (error) {
      console.error('Error fetching contact segments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch contact segments",
        variant: "destructive"
      });
    }
  };

  const handleAddToSegment = async (segmentName: string) => {
    if (selectedContacts.length === 0) return;
    
    setIsLoading(true);
    try {
      const contactIds = selectedContacts.map(contact => contact.id);
      
      for (const contactId of contactIds) {
        const currentSegments = Array.isArray(contactSegments[contactId]) 
          ? contactSegments[contactId] 
          : [];
        
        if (!currentSegments.includes(segmentName)) {
          const updatedSegments = [...currentSegments, segmentName];
          
          const { error } = await supabase
            .from('contacts')
            .update({ segments: updatedSegments })
            .eq('id', contactId);
            
          if (error) throw error;
        }
      }
      
      await fetchContactSegments();
      toast({
        title: "Success",
        description: `Added ${selectedContacts.length} contact(s) to ${segmentName}`,
      });
    } catch (error) {
      console.error('Error adding contacts to segment:', error);
      toast({
        title: "Error",
        description: "Failed to add contacts to segment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromSegment = async (segmentName: string) => {
    if (selectedContacts.length === 0) return;
    
    setIsLoading(true);
    try {
      const contactIds = selectedContacts.map(contact => contact.id);
      
      for (const contactId of contactIds) {
        const currentSegments = Array.isArray(contactSegments[contactId]) 
          ? contactSegments[contactId] 
          : [];
        
        if (currentSegments.includes(segmentName)) {
          const updatedSegments = currentSegments.filter(s => s !== segmentName);
          
          const { error } = await supabase
            .from('contacts')
            .update({ segments: updatedSegments })
            .eq('id', contactId);
            
          if (error) throw error;
        }
      }
      
      await fetchContactSegments();
      toast({
        title: "Success",
        description: `Removed ${selectedContacts.length} contact(s) from ${segmentName}`,
      });
    } catch (error) {
      console.error('Error removing contacts from segment:', error);
      toast({
        title: "Error",
        description: "Failed to remove contacts from segment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Select Segment</label>
        <Select value={segmentFilter} onValueChange={onSegmentFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a segment..." />
          </SelectTrigger>
          <SelectContent>
            {availableSegments.map((segment) => (
              <SelectItem key={segment} value={segment}>
                {segment}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedContacts.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-2 block">
            Selected Contacts ({selectedContacts.length})
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedContacts.map((contact) => {
              const currentSegments = contactSegments[contact.id] || [];
              const isInSelectedSegment = currentSegments.includes(segmentFilter);

              return (
                <div key={contact.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {contact.first_name} {contact.last_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {contact.email || contact.phone}
                    </div>
                    {currentSegments.length > 0 && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Current: {currentSegments.join(', ')}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!isInSelectedSegment && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddToSegment(segmentFilter)}
                      >
                        <UserPlus className="h-3 w-3" />
                      </Button>
                    )}
                    {isInSelectedSegment && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFromSegment(segmentFilter)}
                      >
                        <UserMinus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSegmentMembership;
