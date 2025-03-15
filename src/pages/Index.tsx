
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import TopBar from '@/components/dashboard/TopBar';
import SearchBar from '@/components/dashboard/SearchBar';
import ActionButtons from '@/components/dashboard/ActionButtons';
import ContactsTable, { Contact } from '@/components/dashboard/ContactsTable';
import Pagination from '@/components/dashboard/Pagination';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Sample data
const SAMPLE_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Alex Brown',
    email: 'alex.brown@example.com',
    phone: '(415) 439-0377',
    company: 'Acme Inc',
    status: 'active',
    lastActivity: '2023-06-15T14:30:00',
    tags: ['Customer', 'Enterprise'],
    createdAt: '2023-01-15T09:30:00',
  },
  {
    id: '2',
    name: 'Traniece Naira',
    email: 'traniece.n@example.com',
    company: 'Global Tech',
    status: 'active',
    lastActivity: '2023-06-14T11:20:00',
    tags: ['Prospect'],
    createdAt: '2023-02-10T15:45:00',
  },
  {
    id: '3',
    name: 'Vicky Lu',
    email: 'vicky.lu@highland-hospital.org',
    phone: '(510) 304-5259',
    company: 'Highland Hospital',
    status: 'inactive',
    lastActivity: '2023-06-10T09:15:00',
    tags: ['Healthcare', 'Lead'],
    createdAt: '2023-03-05T10:20:00',
  },
  {
    id: '4',
    name: 'Vicky Low',
    email: 'vicky.low@example.com',
    company: 'Tech Solutions',
    status: 'inactive',
    createdAt: '2023-03-22T14:10:00',
  },
  {
    id: '5',
    name: 'Trang Nguyen',
    email: 'trang.nguyen@example.com',
    phone: '(650) 555-1234',
    company: 'Startup XYZ',
    status: 'active',
    lastActivity: '2023-06-16T16:45:00',
    tags: ['Partner', 'Tech'],
    createdAt: '2023-04-12T11:30:00',
  },
  {
    id: '6',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '(408) 555-6789',
    company: 'ABC Corporation',
    status: 'active',
    lastActivity: '2023-06-15T10:15:00',
    tags: ['Customer', 'Finance'],
    createdAt: '2023-01-20T13:45:00',
  },
  {
    id: '7',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    company: 'Design Studio',
    status: 'active',
    lastActivity: '2023-06-14T15:30:00',
    tags: ['Creative', 'Lead'],
    createdAt: '2023-02-15T09:20:00',
  },
];

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>(SAMPLE_CONTACTS);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>(SAMPLE_CONTACTS);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  
  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Filter contacts based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = contacts.filter(
        contact =>
          contact.name.toLowerCase().includes(query) ||
          contact.email.toLowerCase().includes(query) ||
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
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredContacts.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayedContacts = filteredContacts.slice(startIndex, endIndex);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
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
        
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Contacts</h1>
            <p className="text-gray-500">Manage and organize your contacts efficiently</p>
          </div>
          
          <div className="mb-6 flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <SearchBar onSearch={handleSearch} className="md:max-w-md" />
            <ActionButtons selectedCount={0} />
          </div>
          
          <Tabs defaultValue="all" className="w-full mb-6">
            <TabsList>
              <TabsTrigger value="all">All Contacts</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="pt-4">
              <ContactsTable contacts={displayedContacts} />
              
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalRecords={filteredContacts.length}
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
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Index;
