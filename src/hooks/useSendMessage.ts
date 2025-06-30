
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SendMessageProps {
  contactId: string;
  content: string;
  channel: 'sms' | 'email';
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ contactId, content, channel }: SendMessageProps) => {
      // First, insert the message into the database
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          contact_id: contactId,
          content,
          sender: 'user',
          channel
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // If SMS, send via Telnyx
      if (channel === 'sms') {
        // Get contact phone number
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .select('phone')
          .eq('id', contactId)
          .single();

        if (contactError || !contact?.phone) {
          throw new Error('Contact phone number not found');
        }

        // Send via Telnyx
        const { error: telnyxError } = await supabase.functions.invoke('send-via-telnyx', {
          body: {
            to: contact.phone,
            text: content,
            schedule_type: 'now',
            contactId
          }
        });

        if (telnyxError) {
          throw new Error(`Failed to send SMS: ${telnyxError.message}`);
        }
      }

      return messageData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });
}
