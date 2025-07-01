
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ImageLightbox } from './ImageLightbox';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'contact';
  sent_at: string;
  media_url?: string;
}

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <div
      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          message.sender === 'user'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        {message.content && (
          <p className="text-sm mb-1">{message.content}</p>
        )}
        
        {message.media_url && (
          <div className="mt-2">
            <img 
              src={message.media_url} 
              alt="Shared image" 
              className="max-w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setLightboxOpen(true)}
              style={{ maxHeight: '200px' }}
            />
          </div>
        )}
        
        <p className={`text-xs mt-1 ${
          message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {format(new Date(message.sent_at), 'MMM d, h:mm a')}
        </p>
      </div>

      {message.media_url && (
        <ImageLightbox
          imageUrl={message.media_url}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};
