
import React, { useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import TopToolbar from '@/components/TopToolbar';
import { ConversationsList } from '@/components/inbox/ConversationsList';
import { ChatThread } from '@/components/inbox/ChatThread';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConversations } from '@/hooks/useConversations';
import { Loader2 } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get loading state for search
  const { isLoading: isSearching } = useConversations(filterStatus, sortOrder, searchTerm);

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
                {/* <h1 className="text-lg font-semibold text-gray-900">Conversations</h1> */}
                <div className="flex items-center gap-2">
                </div>
              </div>
              
              {/* Search */}
              <div className="relative">
                {isSearching && searchTerm ? (
                  <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                ) : (
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isSearching && searchTerm ? "Searching..." : "Search conversations..."}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {isSearching && searchTerm && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="text-xs text-blue-500">Searching...</div>
                  </div>
                )}
              </div>
              
              {/* Sort and New button */}
              <div className="flex items-center justify-between mt-4">
                <Select value={sortOrder} onValueChange={(value: 'newest' | 'oldest') => setSortOrder(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
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
                searchTerm={searchTerm}
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
