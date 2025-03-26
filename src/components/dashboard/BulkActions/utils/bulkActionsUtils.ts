
import { supabase } from "@/integrations/supabase/client";
import { bulkLogAction, getContactsByIds } from "@/utils/contactLogger";

export const bulkActionsUtils = {
  // Get contacts by their IDs
  getContactsByIds,
  
  // Log a bulk action
  logBulkAction: async (action: string, contactIds: string[], details: Record<string, any> = {}) => {
    return bulkLogAction(action, contactIds, details);
  },
  
  // Add a tag to multiple contacts
  addTagToContacts: async (contactIds: string[], tag: string) => {
    if (!contactIds.length || !tag) return { success: false, error: "Missing required data" };
    
    try {
      const { data: contacts } = await getContactsByIds(contactIds);
      
      for (const contact of contacts) {
        const currentTags = contact.tags || [];
        if (!currentTags.includes(tag)) {
          const updatedTags = [...currentTags, tag];
          
          const { error } = await supabase
            .from('contacts')
            .update({ tags: updatedTags })
            .eq('id', contact.id);
            
          if (error) throw error;
        }
      }
      
      // Log the bulk tag addition
      await bulkLogAction(
        'update', 
        contactIds, 
        { 
          action_name: 'Add Tag', 
          tag,
          timestamp: new Date().toISOString() 
        }
      );
      
      return { success: true };
    } catch (error) {
      console.error("Error adding tag to contacts:", error);
      return { success: false, error };
    }
  },
  
  // Remove a tag from multiple contacts
  removeTagFromContacts: async (contactIds: string[], tag: string) => {
    if (!contactIds.length || !tag) return { success: false, error: "Missing required data" };
    
    try {
      const { data: contacts } = await getContactsByIds(contactIds);
      
      for (const contact of contacts) {
        const currentTags = contact.tags || [];
        if (currentTags.includes(tag)) {
          const updatedTags = currentTags.filter(t => t !== tag);
          
          const { error } = await supabase
            .from('contacts')
            .update({ tags: updatedTags })
            .eq('id', contact.id);
            
          if (error) throw error;
        }
      }
      
      // Log the bulk tag removal
      await bulkLogAction(
        'update', 
        contactIds, 
        { 
          action_name: 'Remove Tag', 
          tag,
          timestamp: new Date().toISOString() 
        }
      );
      
      return { success: true };
    } catch (error) {
      console.error("Error removing tag from contacts:", error);
      return { success: false, error };
    }
  },
  
  // Set status for multiple contacts
  setContactsStatus: async (contactIds: string[], status: string) => {
    if (!contactIds.length) return { success: false, error: "No contacts selected" };
    
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ status })
        .in('id', contactIds);
        
      if (error) throw error;
      
      // Log the bulk status update
      await bulkLogAction(
        'update', 
        contactIds, 
        { 
          action_name: 'Change Status', 
          status,
          timestamp: new Date().toISOString() 
        }
      );
      
      return { success: true };
    } catch (error) {
      console.error("Error updating contacts status:", error);
      return { success: false, error };
    }
  },
  
  // Delete multiple contacts
  deleteContacts: async (contactIds: string[]) => {
    if (!contactIds.length) return { success: false, error: "No contacts selected" };
    
    try {
      // First get the contact data before deletion for logging
      const { data: contacts } = await getContactsByIds(contactIds);
      
      // Delete the contacts
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', contactIds);
        
      if (error) throw error;
      
      // Log the deletion for each contact
      for (const contact of contacts) {
        await supabase.from('contact_logs').insert({
          action: 'delete',
          contact_info: {
            id: contact.id,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
            status: contact.status,
            tags: contact.tags || [],
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting contacts:", error);
      return { success: false, error };
    }
  },
};
