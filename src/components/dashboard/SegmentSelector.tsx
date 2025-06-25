
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SegmentSelectorProps {
  contactId: string;
  currentSegment?: string;
  onSegmentUpdated?: (newSegment: string | null) => void;
}

const SegmentSelector: React.FC<SegmentSelectorProps> = ({
  contactId,
  currentSegment,
  onSegmentUpdated
}) => {
  const [availableSegments, setAvailableSegments] = useState<string[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string>(currentSegment || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchAvailableSegments();
  }, []);

  useEffect(() => {
    setSelectedSegment(currentSegment || '');
  }, [currentSegment]);

  const fetchAvailableSegments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('contacts_segments')
        .select('segment_name')
        .order('segment_name');

      if (error) throw error;

      const segments = data?.map(item => item.segment_name) || [];
      setAvailableSegments(segments);
    } catch (error) {
      console.error('Error fetching segments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available segments',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateContactSegment = async () => {
    if (!contactId) return;

    try {
      setIsUpdating(true);

      // First, get the contact details
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (contactError) throw contactError;

      // Update the contact's segment_name
      const { error: updateError } = await supabase
        .from('contacts')
        .update({ 
          segment_name: selectedSegment || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId);

      if (updateError) throw updateError;

      // If there was an old segment, remove the contact from it
      if (currentSegment && currentSegment !== selectedSegment) {
        await removeContactFromSegment(contactId, currentSegment);
      }

      // If there's a new segment, add the contact to it
      if (selectedSegment && selectedSegment !== currentSegment) {
        await addContactToSegment(contact, selectedSegment);
      }

      toast({
        title: 'Success',
        description: 'Contact segment updated successfully'
      });

      if (onSegmentUpdated) {
        onSegmentUpdated(selectedSegment || null);
      }
    } catch (error) {
      console.error('Error updating segment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update contact segment',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const addContactToSegment = async (contact: any, segmentName: string) => {
    // Get current segment membership
    const { data: segment, error: segmentError } = await supabase
      .from('contacts_segments')
      .select('contacts_membership')
      .eq('segment_name', segmentName)
      .single();

    if (segmentError) throw segmentError;

    // Create contact object for segment membership
    const contactForSegment = {
      id: contact.id,
      name: contact.last_name 
        ? `${contact.first_name} ${contact.last_name}` 
        : contact.first_name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      status: contact.status,
      tags: contact.tags || [],
      created_at: contact.created_at,
      updated_at: contact.updated_at
    };

    // Add to segment if not already there
    const currentMembers = segment.contacts_membership || [];
    const isAlreadyMember = currentMembers.some((member: any) => member.id === contact.id);

    if (!isAlreadyMember) {
      const updatedMembers = [...currentMembers, contactForSegment];
      
      const { error: updateSegmentError } = await supabase
        .from('contacts_segments')
        .update({ 
          contacts_membership: updatedMembers,
          updated_at: new Date().toISOString()
        })
        .eq('segment_name', segmentName);

      if (updateSegmentError) throw updateSegmentError;
    }
  };

  const removeContactFromSegment = async (contactId: string, segmentName: string) => {
    // Get current segment membership
    const { data: segment, error: segmentError } = await supabase
      .from('contacts_segments')
      .select('contacts_membership')
      .eq('segment_name', segmentName)
      .single();

    if (segmentError) throw segmentError;

    // Remove contact from segment membership
    const currentMembers = segment.contacts_membership || [];
    const updatedMembers = currentMembers.filter((member: any) => member.id !== contactId);

    const { error: updateSegmentError } = await supabase
      .from('contacts_segments')
      .update({ 
        contacts_membership: updatedMembers,
        updated_at: new Date().toISOString()
      })
      .eq('segment_name', segmentName);

    if (updateSegmentError) throw updateSegmentError;
  };

  const hasChanges = selectedSegment !== (currentSegment || '');

  return (
    <div className="space-y-3">
      <Label htmlFor="segment">Segment</Label>
      <div className="flex items-center gap-2">
        <Select
          value={selectedSegment}
          onValueChange={setSelectedSegment}
          disabled={isLoading || isUpdating}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a segment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No segment</SelectItem>
            {availableSegments.map((segment) => (
              <SelectItem key={segment} value={segment}>
                {segment}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={updateContactSegment}
          disabled={!hasChanges || isUpdating}
          size="sm"
        >
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            'Update'
          )}
        </Button>
      </div>
      {currentSegment && (
        <p className="text-sm text-gray-500">
          Current segment: <span className="font-medium">{currentSegment}</span>
        </p>
      )}
    </div>
  );
};

export default SegmentSelector;
