
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SendMessageProps {
  contactId: string;
  content: string;
  channel: 'sms' | 'chat';
  contactPhone?: string;
  media_url?: string;
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, content, channel, contactPhone, media_url }: SendMessageProps) => {
      console.log('Sending message:', { contactId, content, channel, contactPhone, media_url });

      // First insert message into database as outbound and read
      const messageData = {
        contact_id: contactId,
        content,
        sender: 'user',
        channel,
        direction: 'outbound',
        is_read: true,
        ...(media_url && { media_url })
      };

      const { data: savedMessage, error: messageError } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (messageError) {
        console.error('Error saving message to database:', messageError);
        throw messageError;
      }

      // If SMS and we have a phone number, send via Telnyx
      if (channel === 'sms' && contactPhone) {
        try {
          console.log('Sending SMS via Telnyx to:', contactPhone);
          
          const telnyxPayload: any = {
            to: contactPhone,
            text: content,
            schedule_type: 'now'
          };

          // Add media_url if provided
          if (media_url) {
            telnyxPayload.media_url = media_url;
          }
          
          const { data: telnyxResponse, error: telnyxError } = await supabase.functions.invoke('send-via-telnyx', {
            body: telnyxPayload
          });

          console.log('Telnyx response:', telnyxResponse);

          if (telnyxError) {
            console.error('Telnyx error:', telnyxError);
            throw new Error(`Failed to send SMS: ${telnyxError.message}`);
          }

          if (telnyxResponse && !telnyxResponse.success) {
            console.error('Telnyx API error:', telnyxResponse.error);
            throw new Error(`Telnyx API error: ${telnyxResponse.error || 'Unknown error'}`);
          }

          console.log('SMS sent successfully via Telnyx');
        } catch (smsError) {
          console.error('SMS sending failed:', smsError);
          // Don't throw here - message is already saved to database
          // Just log the error and continue
        }
      }

      return savedMessage;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch messages and conversations
      queryClient.invalidateQueries({ queryKey: ['messages', variables.contactId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      console.log('Message sent and saved successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
    },
  });
};
