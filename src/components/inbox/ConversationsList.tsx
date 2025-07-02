
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useConversations } from '@/hooks/useConversations';
import { useMarkMessagesRead } from '@/hooks/useMarkMessagesRead';
import { getFullName } from '@/utils/contactHelpers';
import { format } from 'date-fns';

interface ConversationsListProps {
  selectedContactId: string | null;
  onSelectContact: (contactId: string) => void;
  filterStatus: 'open' | 'closed';
  onFilterChange: (status: 'open' | 'closed') => void;
  sortOrder: 'newest' | 'oldest';
  onSortChange: (order: 'newest' | 'oldest') => void;
  searchTerm: string;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  selectedContactId,
  onSelectContact,
  filterStatus,
  onFilterChange,
  sortOrder,
  onSortChange,
  searchTerm,
}) => {
  const { data: conversations = [], isLoading, error, isError } = useConversations(filterStatus, sortOrder, searchTerm);
  const markMessagesRead = useMarkMessagesRead();

  const handleTakeConversation = (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement assignment logic
    console.log('Taking conversation:', contactId);
  };

  const handleSelectContact = async (contactId: string) => {
    // Mark messages as read when conversation is opened
    try {
      await markMessagesRead.mutateAsync(contactId);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
    
    // Select the contact
    onSelectContact(contactId);
  };

  if (isError) {
    console.error('Error in ConversationsList:', error);
    return (
      <div className="p-4">
        <div className="text-center text-red-500">
          <p>Error loading conversations</p>
          <p className="text-sm text-gray-500 mt-2">
            {error instanceof Error ? error.message : 'Failed to load conversations'}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-0">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="space-y-3">
              <div className="text-4xl">💬</div>
              <p className="font-medium">No conversations yet</p>
              <p className="text-sm">
                Start messaging your contacts to see conversations here.
              </p>
            </div>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.contact.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedContactId === conversation.contact.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleSelectContact(conversation.contact.id)}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                  {getFullName(conversation.contact).split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {getFullName(conversation.contact)}
                        </h3>
                        {conversation.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-500 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-1">
                        {conversation.contact.phone}
                      </p>
                      
                      {conversation.lastMessage ? (
                        <p className="text-sm text-gray-600 truncate">
                          <span className="text-gray-500">
                            {conversation.lastMessage.sender === 'user' ? 'You: ' : ''}
                          </span>
                          {conversation.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic truncate">
                          No messages yet
                        </p>
                      )}
                    </div>
                    
                    {/* Timestamp */}
                    <div className="text-right ml-2 flex-shrink-0">
                      {conversation.lastMessage && (
                        <span className="text-xs text-gray-400">
                          {format(new Date(conversation.lastMessage.sent_at), 'h:mm a')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
