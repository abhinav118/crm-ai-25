import React, { useEffect, useRef, useState } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useSendMessage } from '@/hooks/useSendMessage';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getFullName } from '@/utils/contactHelpers';
import { MessageHelpers } from './MessageHelpers';
import { MessageBubble } from './MessageBubble';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface ChatThreadProps {
  contactId: string;
}

export const ChatThread: React.FC<ChatThreadProps> = ({ contactId }) => {
  const [messageText, setMessageText] = React.useState('');
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { profileData, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  
  const { data: messages = [], isLoading: messagesLoading } = useMessages(contactId);
  const sendMessage = useSendMessage();

  // Fetch contact details
  const { data: contact } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
  });

  // Auto-scroll to bottom when messages change or when opening chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!messageText.trim() && !attachedImageUrl) || !contact) return;

    if (!profileData?.textableNumber) {
      toast({
        title: 'No Textable Number Configured',
        description: 'Please configure a textable number in Settings > Numbers before sending messages',
        variant: 'destructive'
      });
      return;
    }

    try {
      const payload = {
        contactId: contact.id,
        content: messageText.trim() || '',
        channel: 'sms' as const,
        contactPhone: contact.phone || undefined,
        ...(attachedImageUrl && { media_url: attachedImageUrl })
      };

      await sendMessage.mutateAsync(payload);

      setMessageText('');
      setAttachedImageUrl(null);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    if (inputRef.current) {
      const input = inputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newText = messageText.slice(0, start) + emoji + messageText.slice(end);
      setMessageText(newText);
      
      // Set cursor position after emoji
      setTimeout(() => {
        input.selectionStart = input.selectionEnd = start + emoji.length;
        input.focus();
      }, 0);
    }
  };

  const handleImageUpload = (imageUrl: string) => {
    setAttachedImageUrl(imageUrl);
  };

  const handleLinkInsert = (linkText: string) => {
    if (inputRef.current) {
      const input = inputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newText = messageText.slice(0, start) + linkText + messageText.slice(end);
      setMessageText(newText);
      
      // Set cursor position after link
      setTimeout(() => {
        input.selectionStart = input.selectionEnd = start + linkText.length;
        input.focus();
      }, 0);
    }
  };

  const isDisabled = sendMessage.isPending || profileLoading || !profileData?.textableNumber;

  if (!contact) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>Loading contact...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-medium text-sm">
            {getFullName(contact).split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">
              {getFullName(contact)}
            </h2>
            <p className="text-sm text-gray-500">{contact.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Warning if no textable number configured */}
      {!profileData?.textableNumber && !profileLoading && (
        <div className="mx-4 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">No textable number configured</p>
          <p className="text-xs text-yellow-700">Please go to Settings > Numbers to configure a textable number before sending messages.</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messagesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-16 w-3/4" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Start the conversation by sending a message</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <MessageHelpers
            onEmojiSelect={handleEmojiSelect}
            onImageUpload={handleImageUpload}
            onLinkInsert={handleLinkInsert}
          />
          
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your SMS message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isDisabled}
            />
            <span className="absolute right-4 bottom-1 text-xs text-gray-400">
              {messageText.length}/160 characters
            </span>
          </div>

          <button 
            type="button"
            onClick={() => setMessageText('')}
            className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded"
            disabled={isDisabled}
          >
            Clear
          </button>

          <Button
            type="submit"
            size="sm"
            disabled={(!messageText.trim() && !attachedImageUrl) || isDisabled}
            className="bg-blue-600 hover:bg-blue-700 rounded-full px-6"
          >
            {sendMessage.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : profileLoading ? (
              'Loading...'
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        {attachedImageUrl && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg flex items-center gap-2">
            <img src={attachedImageUrl} alt="Attached" className="h-12 w-12 object-cover rounded" />
            <span className="text-sm text-gray-600">Image attached</span>
            <button 
              onClick={() => setAttachedImageUrl(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
