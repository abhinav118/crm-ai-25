import React, { useState, useMemo } from 'react';
import { Plus, MessageSquare, UserPlus, Search, Settings, X, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ContactsTable, { Contact } from '@/components/dashboard/ContactsTable';
import Sidebar from '@/components/dashboard/Sidebar';
import ContactForm from '@/components/dashboard/ContactForm';
import ActionButtons from '@/components/dashboard/ActionButtons';
import UserProfile from '@/components/dashboard/UserProfile';
import ChatInterface from '@/components/dashboard/ChatInterface';
import Conversations from '@/components/dashboard/Conversations';
import { supabase } from '@/integrations/supabase/client';
import { logContactAction } from '@/utils/contactLogger';
import { getFullName } from '@/utils/contactHelpers';
import { ContactData } from '@/components/dashboard/ContactForm/types';

const Index = () => {
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [showConversationsModal, setShowConversationsModal] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [availableSegments, setAvailableSegments] = useState<string[]>([]);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  console.log('Index page - Current states:', {
    activeTab,
    statusFilter,
    segmentFilter,
    searchQuery
  });

  // Load filters from localStorage on mount
  React.useEffect(() => {
    const savedSegmentFilter = localStorage.getItem('contactsSegmentFilter');
    const savedPageSize = localStorage.getItem('contactsPageSize');
    
    if (savedSegmentFilter && savedSegmentFilter !== 'all') {
      console.log('Index - Loading saved segment filter:', savedSegmentFilter);
      setSegmentFilter(savedSegmentFilter);
    }
    if (savedPageSize) {
      setPageSize(parseInt(savedPageSize, 10));
    }
  }, []);

  // Save filters to localStorage when they change
  const handleSegmentFilterChange = (segment: string) => {
    console.log('Index - Segment filter changing to:', segment);
    // Ensure the segment value is valid and not empty
    if (segment && typeof segment === 'string') {
      setSegmentFilter(segment);
      setCurrentPage(1); // Reset to first page when changing filters
      localStorage.setItem('contactsSegmentFilter', segment);
    } else {
      console.error('Index - Invalid segment filter value:', segment);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
    localStorage.setItem('contactsPageSize', newPageSize.toString());
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  const handleStatusFilterChange = (status: string) => {
    console.log('Index - Status filter changing to:', status);
    // Ensure the status value is valid and not empty
    if (status && typeof status === 'string') {
      setStatusFilter(status);
      setCurrentPage(1); // Reset to first page when changing filters
    } else {
      console.error('Index - Invalid status filter value:', status);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Fetch available segments
  const { data: segmentsData } = useQuery({
    queryKey: ['contact-segments'],
    queryFn: async () => {
      console.log('Index - Fetching available segments...');
      
      const { data, error } = await supabase
        .from('contacts')
        .select('segment_name')
        .not('segment_name', 'is', null)
        .order('segment_name');
      
      if (error) {
        console.error('Index - Error fetching segments:', error);
        throw error;
      }

      // Get unique segments and filter out empty values
      const uniqueSegments = [...new Set(data?.map(item => item.segment_name).filter(segment => 
        segment && 
        typeof segment === 'string' && 
        segment.trim().length > 0
      ))] as string[];
      console.log('Index - Available segments:', uniqueSegments);
      
      return uniqueSegments;
    },
  });

  // Fetch contacts with pagination and filtering
  const { data: contactsData, isLoading: isLoadingContacts, error: contactsError } = useQuery({
    queryKey: ['contacts', activeTab, currentPage, pageSize, searchQuery, statusFilter, segmentFilter],
    queryFn: async () => {
      console.log('Index - Fetching contacts from Supabase...');
      
      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      // Apply status filter (for status-specific tabs and status filter)
      let effectiveStatusFilter = statusFilter;
      if (activeTab === 'active') {
        effectiveStatusFilter = 'active';
      } else if (activeTab === 'inactive') {
        effectiveStatusFilter = 'inactive';
      }

      if (effectiveStatusFilter !== 'all') {
        query = query.eq('status', effectiveStatusFilter);
      }

      // Apply segment filter
      if (segmentFilter !== 'all') {
        query = query.eq('segment_name', segmentFilter);
      }

      // Apply pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      
      if (error) {
        console.error('Index - Error fetching contacts:', error);
        throw error;
      }

      console.log('Index - Fetched contacts:', data?.length, 'Total count:', count);
      
      // Transform the data to match our Contact interface
      const transformedContacts: Contact[] = (data || []).map(contact => ({
        id: contact.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email || null,
        phone: contact.phone || null,
        company: contact.company || null,
        last_activity: contact.last_activity || null,
        status: contact.status as 'active' | 'inactive',
        tags: contact.tags || null,
        createdAt: contact.created_at,
        segment_name: contact.segment_name
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
    if (activeTab === 'bulk-actions') {
      // In bulk actions tab, just select the contact
      const isSelected = selectedContacts.some(c => c.id === contact.id);
      if (isSelected) {
        setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
      } else {
        setSelectedContacts([...selectedContacts, contact]);
      }
    } else if (activeTab === 'all') {
      // In all contacts tab, open chat interface with user profile
      setSelectedContact(contact);
      setShowChatInterface(true);
    } else {
      // In other tabs, open conversations modal
      setSelectedContact(contact);
      setShowConversationsModal(true);
    }
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
        await logContactAction('delete', contact);
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

  const handleSubmitContact = async (data: ContactData) => {
    try {
      if (selectedContact) {
        // Update existing contact
        const { error } = await supabase
          .from('contacts')
          .update({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            status: data.status,
            tags: data.tags,
            segment_name: data.segment_name || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedContact.id);

        if (error) throw error;

        toast({
          title: 'Contact updated',
          description: 'The contact has been successfully updated.',
        });

        // Log the update action
        await logContactAction('update', { ...data, id: selectedContact.id });
      } else {
        // Create new contact
        const { data: newContact, error } = await supabase
          .from('contacts')
          .insert([{
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            status: data.status,
            tags: data.tags,
            segment_name: data.segment_name || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;

        toast({
          title: 'Contact created',
          description: 'The new contact has been successfully created.',
        });

        // Log the create action
        if (newContact) {
          await logContactAction('add', newContact);
        }
      }

      // Invalidate and refetch contacts
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      
      // Close the form
      setIsContactFormOpen(false);
      setSelectedContact(null);
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: 'Error',
        description: 'There was an error saving the contact. Please try again.',
        variant: 'destructive',
      });
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
    queryClient.invalidateQueries({ queryKey: ['contact-segments'] });
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
    setSelectedContact(null);
  };

  const handleCloseConversationsModal = () => {
    setShowConversationsModal(false);
    setSelectedContact(null);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Handle segments load
  const handleSegmentsLoad = (segments: string[]) => {
    setAvailableSegments(segments);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-[63px]' : 'ml-[234px]'} ${showContactDetails ? 'mr-80' : ''}`}>
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
              {activeTab !== 'bulk-actions' && (
                <ActionButtons
                  selectedCount={selectedContacts.length}
                  onAddContact={handleAddContact}
                  onDeleteContacts={handleDeleteContacts}
                  selectedContacts={selectedContacts}
                  onTagsAdded={handleTagsAdded}
                  onContactsImported={handleContactsImported}
                  compactMode={isCompactMode}
                />
              )}
              
              {selectedContact && activeTab !== 'bulk-actions' && (
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
            initialContacts={contacts}
          />
        </main>
      </div>

      {/* Contact Details Sidebar */}
      {showContactDetails && selectedContact && activeTab !== 'bulk-actions' && (
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

      {/* Chat Interface Modal */}
      {showChatInterface && selectedContact && (
        <ChatInterface 
          contact={selectedContact} 
          onClose={handleCloseChatInterface} 
        />
      )}

      {/* Conversations Modal */}
      {showConversationsModal && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                Conversation - {getFullName(selectedContact)}
              </h2>
              <Button variant="ghost" size="sm" onClick={handleCloseConversationsModal}>
                <X size={16} />
              </Button>
            </div>
            <div className="h-[calc(80vh-4rem)]">
              <Conversations 
                selectedContactId={selectedContact.id}
                onClose={handleCloseConversationsModal}
              />
            </div>
          </div>
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
                last_name: selectedContact.last_name || '',
                email: selectedContact.email,
                phone: selectedContact.phone,
                company: selectedContact.company,
                status: selectedContact.status,
                tags: selectedContact.tags || [],
                updated_at: new Date().toISOString()
              } : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
