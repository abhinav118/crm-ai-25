
import React from 'react';
import { format } from 'date-fns';
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '@/components/ui/chat-bubble';
import { AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/utils/contactHelpers';

interface Message {
  id: string;
  content: string;
  sent_at: string;
  sender: string;
  contact_id: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name?: string;
  phone?: string;
}

interface ChatBubbleListProps {
  messages: Message[];
  contact: Contact;
  isLoading?: boolean;
}

const ChatBubbleList: React.FC<ChatBubbleListProps> = ({ 
  messages, 
  contact, 
  isLoading = false 
}) => {
  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'h:mm a');
    } catch (e) {
      return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-1/4 h-3 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div>
          <div className="text-gray-400 mb-2">No messages yet</div>
          <div className="text-sm text-gray-500">Start a conversation below</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isOutbound = message.sender === 'user';
        return (
          <ChatBubble
            key={message.id}
            variant={isOutbound ? 'sent' : 'received'}
          >
            {!isOutbound && (
              <ChatBubbleAvatar>
                <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                  {getInitials(contact)}
                </AvatarFallback>
              </ChatBubbleAvatar>
            )}
            <div className="flex flex-col space-y-1">
              <ChatBubbleMessage variant={isOutbound ? 'sent' : 'received'}>
                {message.content}
              </ChatBubbleMessage>
              <div className={`text-xs text-gray-500 ${isOutbound ? 'text-right' : 'text-left'}`}>
                {formatMessageTime(message.sent_at)}
              </div>
            </div>
          </ChatBubble>
        );
      })}
    </div>
  );
};

export default ChatBubbleList;
