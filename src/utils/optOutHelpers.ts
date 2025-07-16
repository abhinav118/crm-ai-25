
import { supabase } from '@/integrations/supabase/client';

// Standard opt-out keywords for detection
export const OPT_OUT_KEYWORDS = [
  "stop", "stopall", "unsubscribe", "cancel", "end", "quit",
  "please stop", "stop sending", "remove", "remove me", "take me off",
  "opt out", "no more", "i want to stop", "don't text me", "do not text",
  "block", "cancel subscription", "stop texts", "i want to unsubscribe",
  "enough", "quit sending"
];

export const FUZZY_MATCH_EXAMPLES = [
  "i no longer want to receive", "remove me from this list",
  "can you stop texting", "not interested", "don't message again"
];

export const RESUBSCRIBE_KEYWORDS = [
  "start", "yes", "subscribe", "join", "rejoin", "unstop"
];

// Check if message is an opt-out request
export function isOptOut(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  
  // Check for exact keyword matches
  if (OPT_OUT_KEYWORDS.some(keyword => normalized.includes(keyword))) {
    return true;
  }
  
  // Check for fuzzy matches
  if (FUZZY_MATCH_EXAMPLES.some(fuzzy => normalized.includes(fuzzy))) {
    return true;
  }
  
  return false;
}

// Check if message is a resubscribe request
export function isResubscribe(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  return RESUBSCRIBE_KEYWORDS.some(keyword => normalized === keyword);
}

// Log opt-out event
export async function logOptOutEvent(phone: string, message: string, contactId?: string) {
  try {
    const { error } = await supabase
      .from('contact_logs')
      .insert({
        action: 'opt_out',
        contact_info: {
          phone,
          message,
          contact_id: contactId,
          timestamp: new Date().toISOString()
        }
      });
    
    if (error) {
      console.error('Error logging opt-out event:', error);
      throw error;
    }
    
    console.log('Opt-out event logged successfully');
  } catch (error) {
    console.error('Failed to log opt-out event:', error);
    throw error;
  }
}

// Handle contact opt-out by moving to UNSUBSCRIBED segment
export async function handleContactOptOut(contactId: string) {
  try {
    // Update the contact's segment to UNSUBSCRIBED and set status to inactive
    const { error: contactUpdateError } = await supabase
      .from('contacts')
      .update({ 
        segment_name: 'UNSUBSCRIBED',
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId);

    if (contactUpdateError) {
      console.error('Error updating contact segment:', contactUpdateError);
      throw contactUpdateError;
    }

    // Trigger contacts_segments update
    await supabase.rpc('update_contacts_segments');

    console.log('Contact successfully moved to UNSUBSCRIBED segment');
    return { success: true };
  } catch (error) {
    console.error('Failed to handle contact opt-out:', error);
    throw error;
  }
}

// Handle contact resubscribe by moving to unassigned segment
export async function handleContactResubscribe(contactId: string) {
  try {
    // Update the contact's segment to unassigned and set status to active
    const { error: contactUpdateError } = await supabase
      .from('contacts')
      .update({ 
        segment_name: 'unassigned',
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId);

    if (contactUpdateError) {
      console.error('Error updating contact segment:', contactUpdateError);
      throw contactUpdateError;
    }

    // Trigger contacts_segments update
    await supabase.rpc('update_contacts_segments');

    console.log('Contact successfully resubscribed and moved to unassigned segment');
    return { success: true };
  } catch (error) {
    console.error('Failed to handle contact resubscribe:', error);
    throw error;
  }
}

// Send opt-out confirmation
export async function sendOptOutConfirmation(toNumber: string, fromNumber: string) {
  try {
    const { data, error } = await supabase.functions.invoke('send-via-telnyx', {
      body: {
        to: toNumber,
        from: fromNumber,
        text: "You've been unsubscribed from our messaging list. You will no longer receive SMS messages from us. Reply START to resubscribe.",
        schedule_type: 'now'
      }
    });

    if (error) {
      console.error('Error sending opt-out confirmation:', error);
      throw error;
    }

    console.log('Opt-out confirmation sent successfully');
    return data;
  } catch (error) {
    console.error('Failed to send opt-out confirmation:', error);
    throw error;
  }
}

// Send resubscribe confirmation
export async function sendResubscribeConfirmation(toNumber: string, fromNumber: string) {
  try {
    const { data, error } = await supabase.functions.invoke('send-via-telnyx', {
      body: {
        to: toNumber,
        from: fromNumber,
        text: "Welcome back! You've been resubscribed to our messaging list. Reply STOP to unsubscribe at any time.",
        schedule_type: 'now'
      }
    });

    if (error) {
      console.error('Error sending resubscribe confirmation:', error);
      throw error;
    }

    console.log('Resubscribe confirmation sent successfully');
    return data;
  } catch (error) {
    console.error('Failed to send resubscribe confirmation:', error);
    throw error;
  }
}
