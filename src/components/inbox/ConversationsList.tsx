
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Conversation } from '@/hooks/useConversations';
import { formatDistanceToNow } from 'date-fns';
import { getFullName } from '@/utils/contactHelpers';

interface ConversationsListProps {
  conversations: Conversation[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  statusFilter: 'open' | 'closed';
  onStatusFilterChange: (status: 'open' | 'closed') => void;
  sortOrder: 'newest' | 'oldest';
  onSortOrderChange: (order: 'newest' | 'oldest') => void;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  isLoading,
  selectedId,
  onSelect,
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onSortOrderChange,
}) => {
  const formatPhone = (phone?: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getInitials = (contact: Conversation['contact']) => {
    const name = getFullName(contact);
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Conversations</h2>
        
        {/* Status Filter */}
        <Tabs value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as 'open' | 'closed')}>
          <TabsList className="mb-4">
            <TabsTrigger value="open">OPEN</TabsTrigger>
            <TabsTrigger value="closed">CLOSED</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Sort Dropdown */}
        <Select value={sortOrder} onValueChange={(value) => onSortOrderChange(value as 'newest' | 'oldest')}>
          <SelectTrigger>
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
          <div className="p-4 text-center text-gray-500">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No conversations found</div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedId === conversation.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => onSelect(conversation.id)}
            >
              <div className="flex items-start space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gray-200 text-gray-600">
                    {getInitials(conversation.contact)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 truncate">
                        {getFullName(conversation.contact)}
                      </span>
                      {conversation.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    {conversation.last_message_at && (
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    {formatPhone(conversation.contact.phone)}
                  </div>
                  
                  {conversation.last_message && (
                    <div className="text-sm text-gray-700 truncate">
                      {conversation.last_message.content}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-gray-500">
                      {conversation.assigned_to ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          You
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          Unassigned
                        </span>
                      )}
                    </div>
                    
                    {!conversation.assigned_to && (
                      <Button size="sm" variant="outline" className="text-xs">
                        Take
                      </Button>
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

export default ConversationsList;
