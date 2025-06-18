
import React, { useState, useMemo } from 'react';
import { Plus, MessageSquare, UserPlus, Search, Settings, X, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ContactsTable, { Contact } from '@/components/dashboard/ContactsTable';
import ContactForm from '@/components/dashboard/ContactForm';
import ActionButtons from '@/components/dashboard/ActionButtons';
import UserProfile from '@/components/dashboard/UserProfile';
import ChatInterface from '@/components/dashboard/ChatInterface';
import BulkActions from '@/components/dashboard/BulkActions/BulkActions';
import Sidebar from '@/components/dashboard/Sidebar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logContactAction } from '@/utils/contactLogger';
import { getFullName } from '@/utils/contactHelpers';

interface ContactData {
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  tags: string[];
  last_activity?: string | null;
  updated_at: string;
  id?: string;
  notes?: string | null;
}

const Index = () => {
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pageSize = 20;

  const queryClient = useQueryClient();

  // Fetch contacts with pagination
  const { data: contactsData, isLoading: isLoadingContacts, error: contactsError } = useQuery({
    queryKey: ['contacts', activeTab, currentPage, searchQuery, statusFilter],
    queryFn: async () => {
      console.log('Fetching contacts from Supabase...');
      
      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply search filter
      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`);
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Apply pagination for "all" tab
      if (activeTab === 'all') {
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;
      
      if (error) {
        console.error('Error fetching contacts:', error);
        throw error;
      }

      console.log('Fetched contacts:', data?.length, 'Total count:', count);
      
      // Transform the data to match our Contact interface
      const transformedContacts: Contact[] = (data || []).map(contact => ({
        id: contact.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        lastActivity: contact.last_activity || '',
        status: contact.status as 'active' | 'inactive',
        tags: contact.tags || [],
        createdAt: contact.created_at
      }));

      return {
        contacts: transformedContacts,
        totalCount: count || 0
      };
    },
  });

  const contacts = useMemo(() => contactsData?.contacts || [], [contactsData]);
  const totalContacts = contactsData?.totalCount || 0;
  const totalPages = Math.ceil(totalContacts / pageSize);

  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    if (activeTab === 'active') {
      filtered = filtered.filter(contact => contact.status === 'active');
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter(contact => contact.status === 'inactive');
    }

    return filtered;
  }, [contacts, activeTab]);

  const handleContactSelect = (contacts: Contact[]) => {
    setSelectedContacts(contacts);
  };

  const handleAddContact = () => {
    setIsContactFormOpen(true);
    setSelectedContact(null);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsContactFormOpen(true);
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setShowContactDetails(true);
  };

  const handleDeleteContacts = async () => {
    if (selectedContacts.length === 0) return;
    
    try {
      const contactIds = selectedContacts.map(contact => contact.id);
      
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', contactIds);
      
      if (error) throw error;
      
      // Log deletion for each contact
      for (const contact of selectedContacts) {
        await logContactAction('delete', {
          id: contact.id,
          first_name: contact.first_name,
          last_name: contact.last_name
        });
      }
      
      toast({
        title: 'Success',
        description: `${selectedContacts.length} contact${selectedContacts.length > 1 ? 's' : ''} deleted successfully`,
      });
      
      setSelectedContacts([]);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    } catch (error) {
      console.error('Error deleting contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete contacts. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleSubmitContact = async (contactData: ContactData) => {
    try {
      if (selectedContact) {
        // Update existing contact
        const { data, error } = await supabase
          .from('contacts')
          .update(contactData)
          .eq('id', selectedContact.id)
          .select();
        
        if (error) throw error;
        
        await logContactAction('update', {
          id: selectedContact.id,
          ...contactData
        });
        
        toast({
          title: 'Success',
          description: 'Contact updated successfully',
        });
      } else {
        // Create new contact - use 'add' instead of 'create'
        const { data, error } = await supabase
          .from('contacts')
          .insert([contactData])
          .select();
        
        if (error) throw error;
        
        if (data && data[0]) {
          await logContactAction('add', {
            id: data[0].id,
            ...contactData
          });
        }
        
        toast({
          title: 'Success',
          description: 'Contact added successfully',
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setIsContactFormOpen(false);
      setSelectedContact(null);
    } catch (error) {
      console.error('Error submitting contact:', error);
      throw error;
    }
  };

  const handleSaveProfile = (updatedContact: Contact) => {
    setSelectedContact(updatedContact);
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  const handleContactsImported = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  const handleTagsAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  };

  const handleBulkContactsUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    setSelectedContacts([]);
  };

  const handleBulkSelectionClear = () => {
    setSelectedContacts([]);
  };

  const toggleChatInterface = () => {
    if (!selectedContact) {
      toast({
        title: 'No contact selected',
        description: 'Please select a contact first',
        variant: 'destructive'
      });
      return;
    }
    setShowChatInterface(!showChatInterface);
  };

  const handleCloseContactDetails = () => {
    setShowContactDetails(false);
    setSelectedContact(null);
  };

  const handleCloseChatInterface = () => {
    setShowChatInterface(false);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-[63px]' : 'ml-[234px]'} ${showContactDetails ? 'mr-80' : ''} ${showChatInterface ? 'mr-96' : ''}`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="text-gray-500"
              >
                <Menu size={16} />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCompactMode(!isCompactMode)}
                  className="text-gray-500"
                >
                  <Settings size={16} />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ActionButtons
                selectedCount={selectedContacts.length}
                onAddContact={handleAddContact}
                onDeleteContacts={handleDeleteContacts}
                selectedContacts={selectedContacts}
                onTagsAdded={handleTagsAdded}
                onContactsImported={handleContactsImported}
                compactMode={isCompactMode}
              />
              
              {selectedContact && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleChatInterface}
                  className="gap-2"
                >
                  <MessageSquare size={16} />
                  {showChatInterface ? 'Close Chat' : 'Chat'}
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          <ContactsTable
            contacts={filteredContacts}
            onContactSelect={handleContactSelect}
            onEditContact={handleEditContact}
            onContactClick={handleContactClick}
            selectedContacts={selectedContacts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isLoading={isLoadingContacts}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            showPagination={activeTab === 'all'}
          />
        </main>
      </div>

      {/* Contact Details Sidebar */}
      {showContactDetails && selectedContact && (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-lg border-l z-40">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Contact Details</h2>
            <Button variant="ghost" size="sm" onClick={handleCloseContactDetails}>
              <X size={16} />
            </Button>
          </div>
          <UserProfile contact={selectedContact} onSave={handleSaveProfile} />
        </div>
      )}

      {/* Chat Interface Sidebar */}
      {showChatInterface && selectedContact && (
        <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-lg border-l z-50">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Chat - {getFullName(selectedContact)}</h2>
            <Button variant="ghost" size="sm" onClick={handleCloseChatInterface}>
              <X size={16} />
            </Button>
          </div>
          <ChatInterface contact={selectedContact} onClose={handleCloseChatInterface} />
        </div>
      )}

      {/* Contact Form Modal */}
      {isContactFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <ContactForm
              onSubmit={handleSubmitContact}
              onClose={() => {
                setIsContactFormOpen(false);
                setSelectedContact(null);
              }}
              initialData={selectedContact ? {
                id: selectedContact.id,
                first_name: selectedContact.first_name,
                last_name: selectedContact.last_name,
                email: selectedContact.email,
                phone: selectedContact.phone,
                company: selectedContact.company,
                status: selectedContact.status,
                tags: selectedContact.tags,
                updated_at: new Date().toISOString()
              } : undefined}
            />
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      <BulkActions
        selectedContacts={selectedContacts}
        onContactsUpdated={handleBulkContactsUpdated}
        onSelectionClear={handleBulkSelectionClear}
      />
    </div>
  );
};

export default Index;
