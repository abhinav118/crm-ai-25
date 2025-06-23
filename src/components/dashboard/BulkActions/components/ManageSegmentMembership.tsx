import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, UserMinus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Contact {
  id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  segment_name?: string;
}

interface ManageSegmentMembershipProps {
  selectedContacts: string[];
  onClose: () => void;
  onSuccess: () => void;
}

interface ContactUpdate {
  id: string;
  first_name: string;
  action: 'add' | 'remove';
}

const ManageSegmentMembership: React.FC<ManageSegmentMembershipProps> = ({
  selectedContacts,
  onClose,
  onSuccess
}) => {
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [availableSegments, setAvailableSegments] = useState<string[]>([]);
  const [contactUpdates, setContactUpdates] = useState<ContactUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadSegments();
    loadSelectedContacts();
  }, [selectedContacts]);

  const loadSegments = async () => {
    try {
      const { data: segments, error } = await supabase
        .from('contacts_segments')
        .select('segment_name')
        .not('segment_name', 'is', null);

      if (error) throw error;

      const uniqueSegments = [...new Set(segments?.map(s => s.segment_name) || [])];
      setAvailableSegments(uniqueSegments);
    } catch (error) {
      console.error('Error loading segments:', error);
      toast({
        title: "Error",
        description: "Failed to load segments",
        variant: "destructive"
      });
    }
  };

  const loadSelectedContacts = async () => {
    try {
      const { data: contactsData, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone, segment_name')
        .in('id', selectedContacts);

      if (error) throw error;

      setContacts(contactsData || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load contact details",
        variant: "destructive"
      });
    }
  };

  const handleContactAction = (contactId: string, firstName: string, action: 'add' | 'remove') => {
    setContactUpdates(prev => {
      const existing = prev.find(update => update.id === contactId);
      if (existing) {
        return prev.map(update => 
          update.id === contactId ? { ...update, action } : update
        );
      } else {
        return [...prev, { id: contactId, first_name: firstName, action }];
      }
    });
  };

  const removeContactUpdate = (contactId: string) => {
    setContactUpdates(prev => prev.filter(update => update.id !== contactId));
  };

  const getContactCurrentSegment = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact?.segment_name;
  };

  const getContactAction = (contactId: string) => {
    const update = contactUpdates.find(u => u.id === contactId);
    return update?.action;
  };

  const handleSaveChanges = async () => {
    if (!selectedSegment || contactUpdates.length === 0) return;

    setIsLoading(true);
    try {
      // Prepare updates for contacts table
      const contactsToUpdate = contactUpdates.map(contact => ({
        id: contact.id,
        segment_name: contact.action === 'add' ? selectedSegment : null,
        updated_at: new Date().toISOString(),
        first_name: contact.first_name || 'Unknown' // Ensure first_name is provided
      }));

      // Update contacts table
      const { error: updateError } = await supabase
        .from('contacts')
        .upsert(contactsToUpdate);

      if (updateError) {
        throw updateError;
      }

      // Handle segment membership updates
      for (const update of contactUpdates) {
        if (update.action === 'add') {
          // Get or create segment
          let { data: segment, error: segmentError } = await supabase
            .from('contacts_segments')
            .select('*')
            .eq('segment_name', selectedSegment)
            .single();

          if (segmentError && segmentError.code === 'PGRST116') {
            // Segment doesn't exist, create it
            const { data: newSegment, error: createError } = await supabase
              .from('contacts_segments')
              .insert({
                segment_name: selectedSegment,
                contacts_membership: []
              })
              .select()
              .single();

            if (createError) throw createError;
            segment = newSegment;
          } else if (segmentError) {
            throw segmentError;
          }

          // Add contact to segment membership
          const currentMembership = segment?.contacts_membership || [];
          const contactData = contacts.find(c => c.id === update.id);
          
          if (contactData && !currentMembership.some((member: any) => member.id === update.id)) {
            const updatedMembership = [...currentMembership, {
              id: update.id,
              first_name: contactData.first_name,
              last_name: contactData.last_name || '',
              email: contactData.email || '',
              phone: contactData.phone || ''
            }];

            const { error: membershipError } = await supabase
              .from('contacts_segments')
              .update({ contacts_membership: updatedMembership })
              .eq('segment_name', selectedSegment);

            if (membershipError) throw membershipError;
          }
        } else if (update.action === 'remove') {
          // Remove contact from segment membership
          const { data: segment, error: segmentError } = await supabase
            .from('contacts_segments')
            .select('*')
            .eq('segment_name', selectedSegment)
            .single();

          if (segmentError) throw segmentError;

          const currentMembership = segment?.contacts_membership || [];
          const updatedMembership = currentMembership.filter((member: any) => member.id !== update.id);

          const { error: membershipError } = await supabase
            .from('contacts_segments')
            .update({ contacts_membership: updatedMembership })
            .eq('segment_name', selectedSegment);

          if (membershipError) throw membershipError;
        }
      }

      toast({
        title: "Success",
        description: `Updated segment membership for ${contactUpdates.length} contact${contactUpdates.length > 1 ? 's' : ''}`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating segment membership:', error);
      toast({
        title: "Error",
        description: "Failed to update segment membership",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Segment Membership</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Segment</label>
            <Select value={selectedSegment} onValueChange={setSelectedSegment}>
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

          {selectedSegment && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Selected Contacts ({selectedContacts.length})
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {contacts.map((contact) => {
                  const currentSegment = getContactCurrentSegment(contact.id);
                  const pendingAction = getContactAction(contact.id);
                  const isInSelectedSegment = currentSegment === selectedSegment;

                  return (
                    <div key={contact.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {contact.first_name} {contact.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {contact.email || contact.phone}
                        </div>
                        {currentSegment && (
                          <Badge variant="outline" className="text-xs mt-1">
                            Current: {currentSegment}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {pendingAction ? (
                          <div className="flex items-center gap-2">
                            <Badge variant={pendingAction === 'add' ? 'default' : 'destructive'}>
                              {pendingAction === 'add' ? 'Adding' : 'Removing'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeContactUpdate(contact.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            {!isInSelectedSegment && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleContactAction(contact.id, contact.first_name, 'add')}
                              >
                                <UserPlus className="h-3 w-3" />
                              </Button>
                            )}
                            {isInSelectedSegment && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleContactAction(contact.id, contact.first_name, 'remove')}
                              >
                                <UserMinus className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {contactUpdates.length > 0 && (
            <div className="p-3 bg-blue-50 rounded">
              <div className="text-sm font-medium text-blue-800 mb-1">
                Pending Changes ({contactUpdates.length})
              </div>
              <div className="text-xs text-blue-600">
                {contactUpdates.filter(u => u.action === 'add').length} to add, {' '}
                {contactUpdates.filter(u => u.action === 'remove').length} to remove
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveChanges} 
              disabled={!selectedSegment || contactUpdates.length === 0 || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageSegmentMembership;
