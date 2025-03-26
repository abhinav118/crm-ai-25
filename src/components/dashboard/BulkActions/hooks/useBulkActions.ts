
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '../../ContactsTable';
import { bulkActionsUtils } from '../utils/bulkActionsUtils';

export interface UseBulkActionsProps {
  onContactsUpdated?: () => void;
}

export const useBulkActions = ({ onContactsUpdated }: UseBulkActionsProps = {}) => {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Handle selecting/deselecting a single contact
  const handleSelectContact = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedContacts(prev => [...prev, id]);
    } else {
      setSelectedContacts(prev => prev.filter(contactId => contactId !== id));
    }
  };

  // Handle selecting/deselecting all contacts
  const handleSelectAll = (contacts: Contact[], selected: boolean) => {
    if (selected) {
      setSelectedContacts(contacts.map(contact => contact.id));
    } else {
      setSelectedContacts([]);
    }
  };

  // Add tags to selected contacts
  const addTagToContacts = async (tag: string) => {
    if (!selectedContacts.length) return;
    
    setLoading(true);
    try {
      const result = await bulkActionsUtils.addTagToContacts(selectedContacts, tag);
      
      if (result.success && onContactsUpdated) {
        onContactsUpdated();
      }
    } catch (error) {
      console.error('Error adding tag to contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Change status of selected contacts
  const changeContactsStatus = async (status: string) => {
    if (!selectedContacts.length) return;
    
    setLoading(true);
    try {
      const result = await bulkActionsUtils.setContactsStatus(selectedContacts, status);
      
      if (result.success && onContactsUpdated) {
        onContactsUpdated();
      }
    } catch (error) {
      console.error('Error changing contacts status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete selected contacts
  const deleteContacts = async () => {
    if (!selectedContacts.length) return;
    
    setLoading(true);
    try {
      const result = await bulkActionsUtils.deleteContacts(selectedContacts);
      
      if (result.success) {
        // Clear selection after deletion
        setSelectedContacts([]);
        
        // Notify parent component to refresh contacts
        if (onContactsUpdated) onContactsUpdated();
      }
    } catch (error) {
      console.error('Error deleting contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    selectedContacts,
    loading,
    handleSelectContact,
    handleSelectAll,
    addTagToContacts,
    changeContactsStatus,
    deleteContacts,
    clearSelection: () => setSelectedContacts([])
  };
};
