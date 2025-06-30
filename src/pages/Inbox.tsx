
import React, { useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import TopToolbar from '@/components/TopToolbar';
import { ConversationsList } from '@/components/inbox/ConversationsList';
import { ChatThread } from '@/components/inbox/ChatThread';

export interface Contact {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  contact_id: string;
  content: string;
  sender: 'user' | 'contact';
  sent_at: string;
  channel: string;
}

export interface Conversation {
  contact: Contact;
  lastMessage: Message | null;
  unreadCount: number;
  assignedTo: string | null;
}

const Inbox = () => {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'open' | 'closed'>('open');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-[63px]' : 'ml-[234px]'}`}>
        {/* Top Toolbar */}
        <TopToolbar pageTitle="Conversations" />
        
        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Conversations List */}
          <div className="w-1/3 min-w-[400px] bg-white border-r border-gray-200">
            <ConversationsList
              selectedContactId={selectedContactId}
              onSelectContact={setSelectedContactId}
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
            />
          </div>

          {/* Right Panel - Chat View */}
          <div className="flex-1">
            {selectedContactId ? (
              <ChatThread contactId={selectedContactId} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                  <p>Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inbox;
