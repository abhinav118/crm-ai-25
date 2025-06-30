
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConversations } from '@/hooks/useConversations';
import { getFullName } from '@/utils/contactHelpers';
import { format } from 'date-fns';

interface ConversationsListProps {
  selectedContactId: string | null;
  onSelectContact: (contactId: string) => void;
  filterStatus: 'open' | 'snoozed' | 'closed';
  onFilterChange: (status: 'open' | 'snoozed' | 'closed') => void;
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
  const { data: conversations = [], isLoading } = useConversations(filterStatus, sortOrder);

  const handleTakeConversation = (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement assignment logic
    console.log('Taking conversation:', contactId);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded" />
          ))}
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
        <div className="flex gap-2 mb-4">
          <Button
            variant={filterStatus === 'open' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('open')}
          >
            OPEN
          </Button>
          <Button
            variant={filterStatus === 'snoozed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('snoozed')}
          >
            SNOOZED
          </Button>
          <Button
            variant={filterStatus === 'closed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('closed')}
          >
            CLOSED
          </Button>
        </div>

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
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No conversations found
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.contact.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedContactId === conversation.contact.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => onSelectContact(conversation.contact.id)}
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
                  
                  {conversation.lastMessage && (
                    <p className="text-sm text-gray-700 truncate mb-2">
                      {conversation.lastMessage.content}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
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
                    </div>
                    
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-400">
                        {format(new Date(conversation.lastMessage.sent_at), 'MMM d, h:mm a')}
                      </span>
                    )}
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
