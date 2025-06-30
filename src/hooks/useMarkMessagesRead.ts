
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useMarkMessagesRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactId: string) => {
      console.log('Marking messages as read for contact:', contactId);

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('contact_id', contactId)
        .eq('direction', 'inbound')
        .eq('is_read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
        throw error;
      }

      return { contactId };
    },
    onSuccess: (data) => {
      // Invalidate conversations to update unread counts
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', data.contactId] });
      
      console.log('Messages marked as read successfully for contact:', data.contactId);
    },
    onError: (error) => {
      console.error('Failed to mark messages as read:', error);
    },
  });
};
