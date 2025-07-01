
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
import { format } from 'date-fns';
import { MessageHelpers } from './MessageHelpers';

interface ChatThreadProps {
  contactId: string;
}

export const ChatThread: React.FC<ChatThreadProps> = ({ contactId }) => {
  const [messageText, setMessageText] = React.useState('');
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
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
    
    if (!messageText.trim() || !contact) return;

    try {
      const payload = {
        contactId: contact.id,
        content: messageText.trim(),
        channel: 'sms',
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
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = messageText.slice(0, start) + emoji + messageText.slice(end);
      setMessageText(newText);
      
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    }
  };

  const handleImageUpload = (imageUrl: string) => {
    setAttachedImageUrl(imageUrl);
  };

  const handleLinkInsert = (linkText: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = messageText.slice(0, start) + linkText + messageText.slice(end);
      setMessageText(newText);
      
      // Set cursor position after link
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + linkText.length;
        textarea.focus();
      }, 0);
    }
  };

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
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {getFullName(contact)}
            </h2>
            <p className="text-sm text-gray-500">{contact.phone}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
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
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {format(new Date(message.sent_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        {/* Show attached image preview */}
        {attachedImageUrl && (
          <div className="mb-3 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src={attachedImageUrl} 
                  alt="Attached" 
                  className="w-12 h-12 object-cover rounded"
                />
                <span className="text-sm text-gray-600">Image attached</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAttachedImageUrl(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Remove
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="space-y-3">
          {/* Message helpers */}
          <MessageHelpers
            onEmojiSelect={handleEmojiSelect}
            onImageUpload={handleImageUpload}
            onLinkInsert={handleLinkInsert}
          />
          
          {/* Input area */}
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your SMS message..."
                className="min-h-[60px] resize-none"
                disabled={sendMessage.isPending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  setMessageText('');
                  setAttachedImageUrl(null);
                }}
                disabled={(!messageText.trim() && !attachedImageUrl) || sendMessage.isPending}
                className="px-3"
              >
                Clear
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!messageText.trim() || sendMessage.isPending}
                className="px-3"
              >
                {sendMessage.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
