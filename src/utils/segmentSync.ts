
import { supabase } from '@/integrations/supabase/client';

export const syncContactToSegment = async (contact: any) => {
  try {
    console.log('Syncing contact to segment:', contact);
    
    const { data, error } = await supabase.functions.invoke('sync-unassigned-segment', {
      body: { contact }
    });

    if (error) {
      console.error('Error syncing contact to segment:', error);
      throw error;
    }

    console.log('Contact synced successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to sync contact to segment:', error);
    throw error;
  }
};
