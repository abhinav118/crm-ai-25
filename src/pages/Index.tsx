import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import TopBar from '@/components/dashboard/TopBar';
import Sidebar from '@/components/dashboard/Sidebar';
import ContactsTable, { Contact } from '@/components/dashboard/ContactsTable';
import ContactDetailsDialog from '@/components/dashboard/ContactDetailsDialog';
import SendMessageDialog from '@/components/dashboard/SendMessageDialog';
import EditContactDialog from '@/components/dashboard/EditContactDialog';
import DeleteContactDialog from '@/components/dashboard/DeleteContactDialog';
import BulkActionsTab from '@/components/dashboard/BulkActions/BulkActionsTab';
import { toast } from '@/hooks/use-toast';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from 'lucide-react';

const Index = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableSegments, setAvailableSegments] = useState<string[]>([]);
  const [segmentFilter, setSegmentFilter] = useState('all');

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const { data, error } = await supabase
          .from('segments')
          .select('name');

        if (error) {
          console.error('Error fetching segments:', error);
          toast({
            title: "Error",
            description: "Failed to load segments",
            variant: "destructive",
          });
          return;
        }

        if (data) {
          const segmentNames = data.map(segment => segment.name);
          setAvailableSegments(segmentNames);
        }
      } catch (error) {
        console.error('Error fetching segments:', error);
        toast({
          title: "Error",
          description: "Failed to load segments",
          variant: "destructive",
        });
      }
    };

    fetchSegments();
  }, []);

  useEffect(() => {
    const fetchContacts = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('contacts')
          .select('*', { count: 'exact' })
          .ilike('first_name', `%${searchQuery}%`)
          .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)
          .order(sortBy.replace('-', ''), { ascending: sortOrder === 'asc' });

        if (sortBy.startsWith('-')) {
          query = query.order(sortBy.slice(1), { ascending: false });
        }

        const { data, error, count } = await query;

        if (error) {
          console.error('Error fetching contacts:', error);
          toast({
            title: "Error",
            description: "Failed to load contacts",
            variant: "destructive",
          });
          return;
        }

        if (data) {
          setContacts(data);
          setTotalPages(Math.ceil((count || 0) / itemsPerPage));
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
        toast({
          title: "Error",
          description: "Failed to load contacts",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, [currentPage, itemsPerPage, sortBy, sortOrder, searchQuery]);

  const handleContactSelect = (contactId: string) => {
    setSelectedContacts((prevSelected) =>
      prevSelected.includes(contactId)
        ? prevSelected.filter((id) => id !== contactId)
        : [...prevSelected, contactId]
    );
  };

  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedContacts(contacts.map((contact) => contact.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDetailsOpen(true);
  };

  const handleSendMessage = (contact: Contact) => {
    setSelectedContact(contact);
    setIsMessageOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsEditOpen(true);
  };

  const handleDeleteContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDeleteOpen(true);
  };

  const confirmDeleteContact = async () => {
    if (!selectedContact) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', selectedContact.id);

      if (error) {
        console.error('Error deleting contact:', error);
        toast({
          title: "Error",
          description: "Failed to delete contact",
          variant: "destructive",
        });
        return;
      }

      setContacts(contacts.filter((contact) => contact.id !== selectedContact.id));
      setIsDeleteOpen(false);
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', selectedContacts);

      if (error) {
        console.error('Error deleting contacts:', error);
        toast({
          title: "Error",
          description: "Failed to delete contacts",
          variant: "destructive",
        });
        return;
      }

      setContacts(contacts.filter((contact) => !selectedContacts.includes(contact.id)));
      setSelectedContacts([]);
      setIsBulkActionsOpen(false);
      toast({
        title: "Success",
        description: "Contacts deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting contacts:', error);
      toast({
        title: "Error",
        description: "Failed to delete contacts",
        variant: "destructive",
      });
    }
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const paginatedContacts = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * itemsPerPage;
    const lastPageIndex = firstPageIndex + itemsPerPage;
    return contacts.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, itemsPerPage, contacts]);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Contacts</h1>
            <Button onClick={() => setIsBulkActionsOpen(true)}>Bulk Actions</Button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="search"
              placeholder="Search contacts..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>
          
          <ContactsTable
            contacts={paginatedContacts}
            isLoading={isLoading}
            selectedContacts={selectedContacts}
            onContactSelect={handleContactSelect}
            onSelectAll={handleSelectAll}
            onContactClick={handleContactClick}
            onSendMessage={handleSendMessage}
            onEditContact={handleEditContact}
            onDeleteContact={handleDeleteContact}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          
          <ContactDetailsDialog
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            contact={selectedContact}
          />
          <SendMessageDialog
            isOpen={isMessageOpen}
            onClose={() => setIsMessageOpen(false)}
            contact={selectedContact}
          />
          <EditContactDialog
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            contact={selectedContact}
            onContactUpdate={(updatedContact) => {
              setContacts(
                contacts.map((contact) =>
                  contact.id === updatedContact.id ? updatedContact : contact
                )
              );
            }}
          />
          <DeleteContactDialog
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            contact={selectedContact}
            onConfirm={confirmDeleteContact}
          />

          {isBulkActionsOpen && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-bold mb-4">Bulk Actions</h3>
                <BulkActionsTab
                  selectedContacts={contacts.filter(contact => selectedContacts.includes(contact.id))}
                  availableSegments={availableSegments}
                  segmentFilter={segmentFilter}
                  onSegmentFilterChange={setSegmentFilter}
                />
                <div className="mt-6 flex justify-end">
                  <Button variant="ghost" onClick={() => setIsBulkActionsOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="ml-2" onClick={handleBulkDelete}>
                    Delete Selected
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
