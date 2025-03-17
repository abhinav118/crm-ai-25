
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ContactData } from '@/components/dashboard/ContactForm/types';
import { Contact } from '@/components/dashboard/ContactsTable';

export type ContactAction = 'add' | 'update' | 'delete';

export const logContactAction = async (
  action: ContactAction,
  contactInfo: ContactData | Contact | Partial<Contact>
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('contact_logs')
      .insert({
        action,
        contact_info: contactInfo
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
