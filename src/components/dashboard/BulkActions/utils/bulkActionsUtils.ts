import { supabase } from '@/integrations/supabase/client';

/**
 * Utility functions for bulk actions on contacts
 */
export const bulkActionsUtils = {
  /**
   * Get contacts by IDs
   */
  async getContactsByIds(ids: string[]) {
    if (!ids.length) return { data: [], error: null };
    
    return await supabase
      .from('contacts')
      .select('*')
      .in('id', ids);
  },
  
  /**
   * Check if a tag exists in any of the contacts
   */
  tagExistsInContacts(tag: string, contacts: { tags?: string[] }[]) {
    return contacts.some(contact => 
      contact.tags && contact.tags.includes(tag)
    );
  },
  
  /**
   * Format a list of contact IDs for display
   */
  formatContactIds(ids: string[], maxDisplay = 3) {
    if (ids.length <= maxDisplay) {
      return ids.join(', ');
    }
    
    return `${ids.slice(0, maxDisplay).join(', ')} and ${ids.length - maxDisplay} more`;
  },
  
  /**
   * Log bulk actions to the activity log
   */
  async logBulkAction(action: string, contactIds: string[], details?: Record<string, any>) {
    try {
      const timestamp = new Date().toISOString();
      const logEntries = contactIds.map(contactId => ({
        contact_id: contactId,
        action_type: action,
        details: details || {},
        created_at: timestamp
      }));
      
      await supabase
        .from('contact_activity_log')
        .insert(logEntries);
    } catch (error) {
      console.error('Error logging bulk action:', error);
    }
  }
}; 