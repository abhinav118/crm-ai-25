
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import TopBar from '@/components/dashboard/TopBar';
import SearchBar from '@/components/dashboard/SearchBar';
import ActionButtons from '@/components/dashboard/ActionButtons';
import ContactsTable, { Contact } from '@/components/dashboard/ContactsTable';
import BulkActionsTable from '@/components/dashboard/BulkActionsTable';
import ChatInterface from '@/components/dashboard/ChatInterface';
import Pagination from '@/components/dashboard/Pagination';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AddContactForm from '@/components/dashboard/AddContactForm';

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('all');
  const [totalCount, setTotalCount] = useState(0);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Fetch contacts from Supabase
  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      // Get the total count first
      const { count, error: countError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      setTotalCount(count || 0);
      
      // Then fetch the paginated data
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      // Format the data to match our Contact type
      const formattedContacts = data.map(contact => ({
        id: contact.id,
        name: contact.name,
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        status: contact.status as 'active' | 'inactive',
        tags: contact.tags || [],
        lastActivity: contact.last_activity || '',
        createdAt: contact.created_at,
      }));
      
      setContacts(formattedContacts);
      setFilteredContacts(formattedContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contacts',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchContacts();
  }, [currentPage, pageSize, toast]);
  
  useEffect(() => {
    // Check if the URL has a hash for tabs
    const hash = location.hash.replace('#', '');
    if (hash && ['all', 'recent', 'active', 'inactive', 'bulk-actions'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location]);
  
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = contacts.filter(
        contact =>
          contact.name.toLowerCase().includes(query) ||
          (contact.email && contact.email.toLowerCase().includes(query)) ||
          (contact.phone && contact.phone.includes(query)) ||
          (contact.company && contact.company.toLowerCase().includes(query))
      );
      setFilteredContacts(filtered);
    }
    setCurrentPage(1);
  }, [searchQuery, contacts]);
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };
  
  const handleRowClick = (contact: Contact) => {
    setSelectedContact(contact);
  };
  
  const handleSelectRow = (id: string, isSelected: boolean) => {
    const newSelectedRows = new Set(selectedRows);
    
    if (isSelected) {
      newSelectedRows.add(id);
    } else {
      newSelectedRows.delete(id);
    }
    
    setSelectedRows(newSelectedRows);
    setSelectedCount(newSelectedRows.size);
  };
  
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const allIds = new Set(filteredContacts.map(contact => contact.id));
      setSelectedRows(allIds);
      setSelectedCount(allIds.size);
    } else {
      setSelectedRows(new Set());
      setSelectedCount(0);
    }
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/#${value}`);
  };
  
  const totalPages = Math.ceil(totalCount / pageSize);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleAddContact = async (formData: any) => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to add contacts');
      }

      // Format the data for insertion
      const contact = {
        user_id: user.id,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email || null,
        phone: formData.phone || null,
        company: formData.company || null,
        status: 'active',
        tags: formData.tags || []
      };

      // Insert the new contact
      const { data, error } = await supabase
        .from('contacts')
        .insert(contact)
        .select()
        .single();

      if (error) throw error;

      // Format the new contact for the UI
      const newContact: Contact = {
        id: data.id,
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        company: data.company || '',
        status: data.status as 'active' | 'inactive',
        tags: data.tags || [],
        lastActivity: data.last_activity || '',
        createdAt: data.created_at,
      };

      // Add the new contact to the beginning of the contacts list
      setContacts([newContact, ...contacts]);
      
      toast({
        title: 'Success',
        description: 'Contact added successfully',
      });
      
      // Close the modal
      setIsAddContactModalOpen(false);
      
      // Refresh the contacts list to show the new contact
      fetchContacts();
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to add contact',
        variant: 'destructive'
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      
      <div 
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "ml-[70px]" : "ml-[240px]"
        }`}
      >
        <TopBar 
          sidebarCollapsed={sidebarCollapsed} 
          onMenuClick={toggleSidebar} 
        />
        
        <main className="p-4 sm:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Contacts</h1>
            <p className="text-gray-500">Manage and organize your contacts efficiently</p>
          </div>
          
          <div className="mb-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <SearchBar onSearch={handleSearch} className="md:max-w-md" />
            <div className="flex gap-2">
              <ActionButtons 
                selectedCount={selectedCount} 
                onAddContact={() => setIsAddContactModalOpen(true)}
              />
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mb-6">
            <TabsList className="mb-2 w-full sm:w-auto overflow-x-auto hide-scrollbar">
              <TabsTrigger value="all">All Contacts</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="bulk-actions">Bulk Actions</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="pt-4">
              <ContactsTable 
                contacts={filteredContacts} 
                onRowClick={handleRowClick}
                isSelectable={true}
                selectedRows={selectedRows}
                onSelectRow={handleSelectRow}
                onSelectAll={handleSelectAll}
              />
              
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalRecords={totalCount}
                  pageSize={pageSize}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            </TabsContent>
            <TabsContent value="recent">
              <div className="flex items-center justify-center h-60 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">Recent contacts view coming soon</p>
              </div>
            </TabsContent>
            <TabsContent value="active">
              <div className="flex items-center justify-center h-60 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">Active contacts view coming soon</p>
              </div>
            </TabsContent>
            <TabsContent value="inactive">
              <div className="flex items-center justify-center h-60 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">Inactive contacts view coming soon</p>
              </div>
            </TabsContent>
            <TabsContent value="bulk-actions" className="pt-4">
              <BulkActionsTable />
            </TabsContent>
          </Tabs>
        </main>
      </div>
      
      {selectedContact && (
        <ChatInterface 
          contact={selectedContact} 
          onClose={() => setSelectedContact(null)}
        />
      )}

      <AddContactForm 
        open={isAddContactModalOpen} 
        onClose={() => setIsAddContactModalOpen(false)} 
        onSubmit={handleAddContact}
      />
    </div>
  );
};

export default Index;
