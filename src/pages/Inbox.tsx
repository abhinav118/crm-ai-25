
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
        <div className="flex flex-1 overflow-hidden bg-gray-50">
          {/* Left Panel - Conversations List */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold text-gray-900">Conversations</h1>
                <div className="flex items-center gap-2">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7H4l5-5v5z" />
                    </svg>
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Conversations count and New button */}
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-600">4 conversations</span>
                <button className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New
                </button>
              </div>
            </div>
            
            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              <ConversationsList
                selectedContactId={selectedContactId}
                onSelectContact={setSelectedContactId}
                filterStatus={filterStatus}
                onFilterChange={setFilterStatus}
                sortOrder={sortOrder}
                onSortChange={setSortOrder}
              />
            </div>
          </div>

          {/* Right Panel - Chat View */}
          <div className="flex-1 bg-white">
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
