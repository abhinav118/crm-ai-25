
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ContactData } from '@/components/dashboard/ContactForm/types';
import { Contact } from '@/components/dashboard/ContactsTable';

export type ContactAction = 'add' | 'update' | 'delete' | 'message_sent' | 'message_received';

export const logContactAction = async (
  action: ContactAction,
  contactInfo: ContactData | Contact | Partial<Contact> | any
): Promise<void> => {
  try {
    // Convert the contactInfo to a JSON-compatible object
    const jsonContactInfo = JSON.parse(JSON.stringify(contactInfo));
    
    // Add timestamp if not provided
    if (!jsonContactInfo.timestamp) {
      jsonContactInfo.timestamp = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('contact_logs')
      .insert({
        action,
        contact_info: jsonContactInfo
      });

    if (error) {
      console.error(`Error logging ${action} contact action:`, error);
      throw error;
    }
    
    console.log(`Contact ${action} action logged successfully`);
  } catch (error) {
    console.error(`Failed to log contact ${action} action:`, error);
    // We don't want to break the main functionality if logging fails
    // so we just log the error and don't throw it
  }
};

export const fetchContactLogs = async () => {
  try {
    const { data, error } = await supabase
      .from('contact_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching contact logs:', error);
    toast({
      title: 'Error',
      description: 'Failed to fetch contact logs',
      variant: 'destructive'
    });
    return [];
  }
};

// Helper to format log entries for display
export const formatLogEntry = (log: any) => {
  const { action, contact_info, created_at } = log;
  const date = new Date(created_at);
  
  let description = '';
  let contact = contact_info || {};
  
  switch (action) {
    case 'add':
      description = `Contact "${contact.name}" was added`;
      break;
    case 'update':
      if (contact.action_name) {
        description = `${contact.action_name}: Updated "${contact.name}"`;
        if (contact.tags && contact.tags.length > 0) {
          description += ` with tags: ${contact.tags.join(', ')}`;
        }
      } else {
        description = `Contact "${contact.name}" was updated`;
      }
      break;
    case 'delete':
      description = `Contact "${contact.name}" was deleted`;
      break;
    case 'message_sent':
      description = `Message sent to "${contact.name}"${contact.channel ? ` via ${contact.channel}` : ''}`;
      break;
    case 'message_received':
      description = `Message received from "${contact.name}"${contact.channel ? ` via ${contact.channel}` : ''}`;
      break;
    default:
      description = `Action "${action}" performed on contact "${contact.name}"`;
  }
  
  return {
    id: log.id,
    description,
    date: date.toLocaleString(),
    action,
    contact: contact,
    timestamp: created_at
  };
};
