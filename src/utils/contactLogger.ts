import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ContactData } from '@/components/dashboard/ContactForm/types';
import { Contact } from '@/components/dashboard/ContactsTable';

export type ContactAction = 'add' | 'update' | 'delete' | 'message_sent' | 'message_received';

const isContactInfoMissingColumnError = (error: any) => {
  return error?.code === 'PGRST204' && typeof error?.message === 'string' && error.message.includes('contact_info');
};

const isDetailsMissingColumnError = (error: any) => {
  return error?.code === 'PGRST204' && typeof error?.message === 'string' && error.message.includes('details');
};

type ContactLogsPayloadKey = 'contact_info' | 'details';
let contactLogsPayloadKey: ContactLogsPayloadKey | null = null;

const setPayloadKeyOnError = (error: any): ContactLogsPayloadKey | null => {
  if (isContactInfoMissingColumnError(error)) {
    contactLogsPayloadKey = 'details';
    return contactLogsPayloadKey;
  }
  if (isDetailsMissingColumnError(error)) {
    contactLogsPayloadKey = 'contact_info';
    return contactLogsPayloadKey;
  }
  return null;
};

const withPayloadKey = (entry: any, key: ContactLogsPayloadKey) => {
  if (!entry || typeof entry !== 'object') return entry;
  if (!('contact_info' in entry) && !('details' in entry)) return entry;

  const { contact_info, details, ...rest } = entry;
  const value = key === 'details' ? (details ?? contact_info) : (contact_info ?? details);
  return {
    ...rest,
    [key]: value
  };
};

const resolveContactLogsPayloadKey = async (): Promise<ContactLogsPayloadKey> => {
  if (contactLogsPayloadKey) return contactLogsPayloadKey;

  const { error: detailsError } = await supabase.from('contact_logs').select('details').limit(1);
  if (!detailsError) {
    contactLogsPayloadKey = 'details';
    return contactLogsPayloadKey;
  }

  if (!isDetailsMissingColumnError(detailsError)) {
    const resolved = setPayloadKeyOnError(detailsError);
    if (resolved) return resolved;
  }

  const { error: infoError } = await supabase.from('contact_logs').select('contact_info').limit(1);
  if (!infoError) {
    contactLogsPayloadKey = 'contact_info';
    return contactLogsPayloadKey;
  }

  setPayloadKeyOnError(infoError);
  return contactLogsPayloadKey || 'details';
};

const insertContactLogsWithFallback = async (entries: any | any[]) => {
  const payload = Array.isArray(entries) ? entries : [entries];
  const payloadKey = await resolveContactLogsPayloadKey();
  const normalizedPayload = payload.map((entry) => withPayloadKey(entry, payloadKey));

  const { error } = await supabase.from('contact_logs').insert(normalizedPayload as any);
  if (!error) return;

  const alternateKey = setPayloadKeyOnError(error);
  if (alternateKey) {
    const fallbackPayload = payload.map((entry) => withPayloadKey(entry, alternateKey));
    const { error: fallbackError } = await supabase.from('contact_logs').insert(fallbackPayload as any);
    if (fallbackError) throw fallbackError;
    return;
  }

  throw error;
};

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
    
    await insertContactLogsWithFallback({
      action,
      contact_info: jsonContactInfo
    });
    
    console.log(`Contact ${action} action logged successfully`);
  } catch (error) {
    console.error(`Failed to log contact ${action} action:`, error);
    // We don't want to break the main functionality if logging fails
    // so we just log the error and don't throw it
  }
};

// Function to log a batch operation (e.g., SMS sent to multiple contacts)
export const logBatchAction = async (
  action: string,
  batchName: string,
  contactsInfo: any[]
): Promise<void> => {
  try {
    if (!contactsInfo || contactsInfo.length === 0) {
      console.warn('No contacts provided for batch logging');
      return;
    }
    
    // Generate a batch ID
    const batchId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    // Create log entries for each contact
    const logEntries = contactsInfo.map(contact => {
      // Make sure contact info is JSON-compatible
      const contactInfo = JSON.parse(JSON.stringify(contact));
      
      // Add timestamp if not provided
      if (!contactInfo.timestamp) {
        contactInfo.timestamp = timestamp;
      }
      
      return {
        action,
        contact_info: contactInfo,
        batch_id: batchId,
        batch_name: batchName,
        created_at: timestamp
      };
    });
    
    // Insert all log entries
    await insertContactLogsWithFallback(logEntries);
    
    console.log(`Batch ${action} action logged successfully for ${contactsInfo.length} contacts`);
  } catch (error) {
    console.error(`Failed to log batch ${action} action:`, error);
    // We don't want to break the main functionality if logging fails
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
  const { action, contact_info, details, created_at } = log;
  const date = new Date(created_at);
  
  let description = '';
  let contact = contact_info || details || {};
  
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
      if (contact.message) {
        description += `: "${contact.message.substring(0, 50)}${contact.message.length > 50 ? '...' : ''}"`;
      }
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

// New utility function to fix the error in bulkActionsUtils.ts
export const getContactsByIds = async (contactIds: string[]) => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .in('id', contactIds);
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching contacts by IDs:', error);
    return { data: [], error };
  }
};

// Utility function for bulk action logging to fix the error in bulkActionsUtils.ts
export const bulkLogAction = async (action: string, contactIds: string[], details: Record<string, any> = {}) => {
  try {
    if (!contactIds.length) return;
    
    // First get the contact data for all the IDs
    const { data: contacts } = await getContactsByIds(contactIds);
    if (!contacts.length) return;
    
    // Create log entries
    const logEntries = contacts.map(contact => {
      return {
        action: action,
        contact_info: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          status: contact.status,
          tags: contact.tags || [],
          details: details,
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      };
    });
    
    // Insert the logs
    await insertContactLogsWithFallback(logEntries);
    
    console.log(`Bulk logged ${action} for ${contactIds.length} contacts`);
    
  } catch (error) {
    console.error(`Error logging bulk action ${action}:`, error);
  }
};
