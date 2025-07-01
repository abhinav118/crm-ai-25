
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
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  selectedContactId,
  onSelectContact,
  filterStatus,
  onFilterChange,
  sortOrder,
  onSortChange,
}) => {
  const { data: conversations = [], isLoading, error, isError } = useConversations(filterStatus, sortOrder);
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
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Conversations</h2>
        
        {/* Filters */}
        {/* <div className="flex gap-2 mb-4">
          <Button
            variant={filterStatus === 'open' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('open')}
          >
            OPEN
          </Button>
          <Button
            variant={filterStatus === 'closed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('closed')}
          >
            CLOSED
          </Button>
        </div> */}

        {/* Sort */}
        <Select value={sortOrder} onValueChange={(value: 'newest' | 'oldest') => onSortChange(value)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
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
          <>
            <div className="p-2 text-xs text-gray-500 border-b">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </div>
            {conversations.map((conversation) => (
              <div
                key={conversation.contact.id}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedContactId === conversation.contact.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => handleSelectContact(conversation.contact.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm truncate">
                        {getFullName(conversation.contact)}
                      </h3>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-1">
                      {conversation.contact.phone}
                    </p>
                    
                    {conversation.lastMessage ? (
                      <p className="text-sm text-gray-700 truncate mb-2">
                        <span className="text-xs text-gray-500 mr-1">
                          {conversation.lastMessage.sender === 'user' ? 'You:' : ''}
                        </span>
                        {conversation.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic truncate mb-2">
                        No messages yet
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      {/* <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {conversation.assignedTo || 'Unassigned'}
                        </span>
                        {!conversation.assignedTo && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => handleTakeConversation(conversation.contact.id, e)}
                          >
                            TAKE
                          </Button>
                        )}
                      </div> */}
                      
                      {conversation.lastMessage && (
                        <span className="text-xs text-gray-400">
                          {format(new Date(conversation.lastMessage.sent_at), 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
