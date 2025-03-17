import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import TopBar from '@/components/dashboard/TopBar';
import SearchBar from '@/components/dashboard/SearchBar';
import ActionButtons from '@/components/dashboard/ActionButtons';
import ContactsTable, { Contact } from '@/components/dashboard/ContactsTable';
import BulkActionsTable from '@/components/dashboard/BulkActionsTable';
import ChatInterface from '@/components/dashboard/ChatInterface';
import Pagination from '@/components/dashboard/Pagination';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AddContactForm from '@/components/dashboard/AddContactForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { ContactData } from '@/components/dashboard/ContactForm/types';
import { logContactAction } from '@/utils/contactLogger';

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
  
  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching contacts from Supabase...');
      
      const { count: existingCount, error: countError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      if (existingCount === 0) {
        console.log('No contacts found. Seeding sample data...');
        await seedSampleContacts();
      }
      
      const { count, error: totalCountError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });
      
      if (totalCountError) throw totalCountError;
      setTotalCount(count || 0);
      
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      console.log('Contacts data received:', data);
      
      if (data && data.length > 0) {
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
      } else {
        console.log('No contacts data returned from Supabase');
        setContacts([]);
        setFilteredContacts([]);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contacts',
        variant: 'destructive'
      });
      setContacts([]);
      setFilteredContacts([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const seedSampleContacts = async () => {
    try {
      const sampleNames = [
        'John Smith', 'Emma Johnson', 'Michael Williams', 'Olivia Brown', 'William Jones',
        'Sophia Miller', 'James Davis', 'Charlotte Wilson', 'Benjamin Moore', 'Amelia Taylor',
        'Alexander Anderson', 'Harper Thomas', 'Daniel Jackson', 'Abigail White', 'Matthew Harris',
        'Emily Martin', 'Joseph Thompson', 'Elizabeth Garcia', 'David Martinez', 'Sofia Robinson'
      ];
      
      const sampleEmails = [
        'john@example.com', 'emma@example.com', 'michael@example.com', 'olivia@example.com', 'william@example.com',
        'sophia@example.com', 'james@example.com', 'charlotte@example.com', 'benjamin@example.com', 'amelia@example.com',
        'alexander@example.com', 'harper@example.com', 'daniel@example.com', 'abigail@example.com', 'matthew@example.com',
        'emily@example.com', 'joseph@example.com', 'elizabeth@example.com', 'david@example.com', 'sofia@example.com'
      ];
      
      const sampleCompanies = [
        'Tech Solutions', 'Global Innovations', 'Digital Dynamics', 'Modern Systems', 'Future Technologies',
        'Smart Enterprises', 'Peak Performance', 'Bright Ideas', 'Strategic Solutions', 'Advanced Technologies',
        'Creative Concepts', 'Innovative Designs', 'Premium Products', 'Elite Services', 'Precise Engineering',
        'Quality Assurance', 'Infinite Possibilities', 'Prime Solutions', 'Universal Systems', 'Progressive Innovations'
      ];
      
      const samplePhones = [
        '+1 (555) 123-4567', '+1 (555) 234-5678', '+1 (555) 345-6789', '+1 (555) 456-7890', '+1 (555) 567-8901',
        '+1 (555) 678-9012', '+1 (555) 789-0123', '+1 (555) 890-1234', '+1 (555) 901-2345', '+1 (555) 012-3456',
        '+1 (555) 112-2334', '+1 (555) 223-3445', '+1 (555) 334-4556', '+1 (555) 445-5667', '+1 (555) 556-6778',
        '+1 (555) 667-7889', '+1 (555) 778-8990', '+1 (555) 889-9001', '+1 (555) 990-0112', '+1 (555) 001-1223'
      ];
      
      const sampleTags = [
        ['client', 'active'], ['prospect', 'interested'], ['client', 'premium'], ['lead', 'new'], ['client', 'inactive'],
        ['partner', 'active'], ['vendor', 'regular'], ['client', 'vip'], ['lead', 'warm'], ['client', 'standard'],
        ['prospect', 'cold'], ['client', 'priority'], ['vendor', 'preferred'], ['lead', 'hot'], ['client', 'potential'],
        ['partner', 'new'], ['prospect', 'qualified'], ['client', 'returning'], ['lead', 'unqualified'], ['partner', 'strategic']
      ];
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const sampleContacts = [];
      
      for (let i = 0; i < 20; i++) {
        sampleContacts.push({
          name: sampleNames[i],
          email: sampleEmails[i],
          phone: samplePhones[i],
          company: sampleCompanies[i],
          status: i % 5 === 0 ? 'inactive' : 'active',
          tags: sampleTags[i]
        });
      }
      
      const { error } = await supabase.from('contacts').insert(sampleContacts);
      
      if (error) throw error;
      
      console.log('Sample contacts seeded successfully');
    } catch (error) {
      console.error('Error seeding sample contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to seed sample contacts',
        variant: 'destructive'
      });
    }
  };
  
  useEffect(() => {
    fetchContacts();
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchContacts();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPage, pageSize]);
  
  useEffect(() => {
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

  const handleSendMessage = () => {
    if (selectedRows.size > 0) {
      const firstSelectedId = Array.from(selectedRows)[0];
      const contact = contacts.find(c => c.id === firstSelectedId);
      if (contact) {
        setSelectedContact(contact);
      }
    }
  };

  const handleDeleteContacts = async () => {
    if (selectedRows.size === 0) return;
    
    try {
      const selectedIds = Array.from(selectedRows);
      
      const contactsToDelete = contacts.filter(c => selectedIds.includes(c.id));
      
      console.log(`Deleting ${selectedIds.length} contacts with IDs:`, selectedIds);
      
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', selectedIds);
      
      if (error) throw error;
      
      for (const contact of contactsToDelete) {
        await logContactAction('delete', contact);
      }
      
      setContacts(prevContacts => prevContacts.filter(c => !selectedIds.includes(c.id)));
      setFilteredContacts(prevContacts => prevContacts.filter(c => !selectedIds.includes(c.id)));
      setSelectedRows(new Set());
      setSelectedCount(0);
      
      toast({
        title: 'Success',
        description: `${selectedIds.length} contact${selectedIds.length > 1 ? 's' : ''} deleted successfully`,
      });
      
      fetchContacts();
      
    } catch (error) {
      console.error('Error deleting contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete contacts',
        variant: 'destructive'
      });
    }
  };

  const handleAddContact = async (formData: ContactData): Promise<void> => {
    try {
      console.log('Submitting contact with data:', formData);
      
      const contact = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        status: 'active',
        tags: formData.tags || []
      };

      console.log('Inserting contact with data:', contact);

      const { data, error } = await supabase
        .from('contacts')
        .insert(contact)
        .select()
        .single();

      if (error) {
        console.error('Supabase error during contact creation:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from insert operation');
      }

      console.log('Contact added successfully:', data);

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

      setContacts(prevContacts => [newContact, ...prevContacts]);
      setFilteredContacts(prevContacts => [newContact, ...prevContacts]);
      
      toast({
        title: 'Success',
        description: 'Contact added successfully',
      });
      
      setIsAddContactModalOpen(false);
      
      fetchContacts();
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: 'Error',
        description: `Failed to add contact: ${(error as Error).message}`,
        variant: 'destructive'
      });
      throw error;
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
                onSendMessage={handleSendMessage}
                onDeleteContacts={handleDeleteContacts}
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
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-60 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-500 mb-4">No contacts found</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddContactModalOpen(true)}
                    className="gap-2"
                  >
                    <UserPlus size={16} />
                    Add your first contact
                  </Button>
                </div>
              ) : (
                <ContactsTable 
                  contacts={filteredContacts} 
                  onRowClick={handleRowClick}
                  isSelectable={true}
                  selectedRows={selectedRows}
                  onSelectRow={handleSelectRow}
                  onSelectAll={handleSelectAll}
                />
              )}
              
              {contacts.length > 0 && (
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
              )}
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
