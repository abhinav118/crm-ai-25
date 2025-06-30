
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SendMessageProps {
  contactId: string;
  content: string;
  channel: 'sms' | 'chat';
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, content, channel }: SendMessageProps) => {
      console.log('Sending message:', { contactId, content, channel });

      // Insert message into database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          contact_id: contactId,
          content,
          sender: 'user',
          channel,
          direction: 'outbound',
          is_read: true // Outbound messages are always considered "read"
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      // If SMS enabled, also send via Telnyx (would integrate with existing SMS logic)
      if (channel === 'sms') {
        try {
          // This would call the existing Telnyx integration
          console.log('Would send SMS via Telnyx integration');
        } catch (smsError) {
          console.error('SMS sending failed, but message saved to database:', smsError);
        }
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: ['messages', variables.contactId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      console.log('Message sent successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
    },
  });
};
