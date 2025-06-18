
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Smile, Paperclip, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ChatInputProps {
  contactId: string;
  contactPhone?: string;
  onMessageSent: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ contactId, contactPhone, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!message.trim() || !contactPhone) {
      toast({
        title: 'Error',
        description: 'Please enter a message and ensure contact has a phone number',
        variant: 'destructive'
      });
      return;
    }

    setIsSending(true);
    try {
      // Send via Telnyx
      const { data, error } = await supabase.functions.invoke('send-via-telnyx', {
        body: {
          to: contactPhone,
          text: message,
          schedule_type: 'now'
        }
      });

      if (error) throw error;

      // Save message to database
      const { error: dbError } = await supabase
        .from('messages')
        .insert({
          contact_id: contactId,
          content: message,
          direction: 'outbound',
          status: 'sent',
          sent_at: new Date().toISOString()
        });

      if (dbError) {
        console.error('Error saving message to database:', dbError);
      }

      setMessage('');
      onMessageSent();
      
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error sending message',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClear = () => {
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-gray-50">
      <div className="flex items-end space-x-3">
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your SMS message..."
            className="min-h-[80px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            disabled={isSending}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
            disabled={isSending}
          >
            <Smile className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
            disabled={isSending}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
            disabled={isSending}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={isSending || !message.trim()}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !message.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
