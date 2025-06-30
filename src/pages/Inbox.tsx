
import React, { useState } from 'react';
import ConversationsList from '@/components/inbox/ConversationsList';
import ChatThread from '@/components/inbox/ChatThread';
import { useConversations } from '@/hooks/useConversations';

const Inbox: React.FC = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'open' | 'closed'>('open');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const { conversations, isLoading } = useConversations({
    status: statusFilter,
    sortOrder
  });

  const selectedConversation = conversations?.find(conv => conv.id === selectedConversationId);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Column - Conversation List */}
      <div className="w-1/3 border-r border-gray-200 bg-white">
        <ConversationsList
          conversations={conversations || []}
          isLoading={isLoading}
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />
      </div>

      {/* Right Column - Chat Thread */}
      <div className="flex-1">
        {selectedConversation ? (
          <ChatThread
            conversation={selectedConversation}
            onClose={() => setSelectedConversationId(null)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className="text-lg font-medium mb-2">Select a conversation</div>
              <div className="text-sm">Choose a conversation from the list to start chatting</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
