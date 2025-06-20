
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit2, Trash2, Phone, Mail, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import UserProfile from './UserProfile';
import UserProfileModal from './UserProfileModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Pagination from './Pagination';
import SearchBar from './SearchBar';
import FilterDialog, { FilterState } from './Filters/FilterDialog';
import { logContactAction } from '@/utils/contactLogger';
import BulkActionsTab from './BulkActions/BulkActionsTab';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getFullName } from '@/utils/contactHelpers';

export interface Contact {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: 'active' | 'inactive';
  last_activity: string | null;
  tags: string[] | null;
  createdAt: string;
  segment_name?: string | null;
}

interface DataTableProps {
  initialContacts: Contact[];
}

interface UpdateContact {
  id: string;
  first_name?: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  status?: string;
  tags?: string[] | null;
  updated_at?: string;
}

const ContactsTable: React.FC<DataTableProps> = ({ initialContacts }) => {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [openProfile, setOpenProfile] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
  const [availableSegments, setAvailableSegments] = useState<string[]>([]);
  const [segmentFilter, setSegmentFilter] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});

  useEffect(() => {
    const fetchSegments = async () => {
      const { data, error } = await supabase
        .from('contacts_segments')
        .select('segment_name');

      if (error) {
        console.error('Error fetching segments:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch segments. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      const segmentNames = data.map(segment => segment.segment_name);
      setAvailableSegments(segmentNames);
    };

    fetchSegments();
  }, []);

  useEffect(() => {
    const fetchContacts = async () => {
      let query = supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('first_name', `%${searchTerm}%`);
      }

      if (segmentFilter) {
        query = query.eq('segment_name', segmentFilter);
      }

      // Apply FilterState filters
      if (filters.phone) {
        const { operator, value } = filters.phone;
        if (operator === 'isEmpty') {
          query = query.is('phone', null);
        } else if (operator === 'isNotEmpty') {
          query = query.not('phone', 'is', null);
        } else if (operator === 'is' && value) {
          query = query.eq('phone', value);
        } else if (operator === 'isNot' && value) {
          query = query.neq('phone', value);
        }
      }

      if (filters.email) {
        const { operator, value } = filters.email;
        if (operator === 'isEmpty') {
          query = query.is('email', null);
        } else if (operator === 'isNotEmpty') {
          query = query.not('email', 'is', null);
        } else if (operator === 'is' && value) {
          query = query.eq('email', value);
        } else if (operator === 'isNot' && value) {
          query = query.neq('email', value);
        }
      }

      if (filters.tag) {
        const { operator, value } = filters.tag;
        if (operator === 'isEmpty') {
          query = query.or('tags.is.null,tags.eq.{}');
        } else if (operator === 'isNotEmpty') {
          query = query.not('tags', 'is', null).not('tags', 'eq', '{}');
        } else if (operator === 'is' && value) {
          query = query.contains('tags', [value]);
        } else if (operator === 'isNot' && value) {
          query = query.not('tags', 'cs', [value]);
        } else if (operator === 'anyOf' && Array.isArray(value)) {
          query = query.overlaps('tags', value);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching contacts:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch contacts. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      setContacts(data as Contact[]);
    };

    fetchContacts();
  }, [searchTerm, segmentFilter, filters]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setPage(1);
  };

  const toggleContactSelection = (contact: Contact) => {
    const isSelected = selectedContacts.some((c) => c.id === contact.id);

    if (isSelected) {
      setSelectedContacts(selectedContacts.filter((c) => c.id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const isContactSelected = (contact: Contact) => {
    return selectedContacts.some((c) => c.id === contact.id);
  };

  const selectAllContacts = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts([...contacts]);
    }
  };

  const paginatedContacts = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return contacts.slice(startIndex, endIndex);
  }, [contacts, page, itemsPerPage]);

  const totalPages = Math.ceil(contacts.length / itemsPerPage);

  const handleViewProfile = (contact: Contact) => {
    setSelectedContact(contact);
    setOpenProfile(true);
  };

  const handleUpdateContact = (updatedContact: Contact) => {
    setContacts(prevContacts =>
      prevContacts.map(contact =>
        contact.id === updatedContact.id ? updatedContact : contact
      )
    );
    setSelectedContact(updatedContact);
  };

  const handleDeleteContacts = async () => {
    if (selectedContacts.length === 0) {
      toast({
        title: 'No contacts selected',
        description: 'Please select at least one contact to delete.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', selectedContacts.map(contact => contact.id));

      if (error) {
        console.error('Error deleting contacts:', error);
        throw error;
      }

      setContacts(prevContacts =>
        prevContacts.filter(contact => !selectedContacts.some(selected => selected.id === contact.id))
      );
      setSelectedContacts([]);

      toast({
        title: 'Success',
        description: 'Contacts deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete contacts. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddContact = () => {
    toast({
      title: 'Add Contact',
      description: 'Navigating to add contact form...',
    });
  };

  const handleSendMessage = () => {
    toast({
      title: 'Send Message',
      description: 'Opening message composer...',
    });
  };

  const clearSelection = () => {
    setSelectedContacts([]);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const renderContactRow = (contact: Contact) => (
    <TableRow key={contact.id}>
      <TableCell>
        <Checkbox
          checked={isContactSelected(contact)}
          onCheckedChange={() => toggleContactSelection(contact)}
        />
      </TableCell>
      <TableCell className="font-medium">{getFullName(contact)}</TableCell>
      <TableCell>{contact.email}</TableCell>
      <TableCell>{contact.phone}</TableCell>
      <TableCell>{contact.company}</TableCell>
      <TableCell>
        <Badge variant={contact.status === 'active' ? 'success' : 'secondary'}>
          {contact.status}
        </Badge>
      </TableCell>
      <TableCell>
        {contact.tags && contact.tags.length > 0 ? (
          contact.tags.map(tag => (
            <Badge key={tag} variant="outline" className="mr-1">
              {tag}
            </Badge>
          ))
        ) : (
          <span className="text-gray-500">No tags</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => handleViewProfile(contact)}>
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <SearchBar 
          onSearch={setSearchTerm} 
          onFilterChange={handleFiltersChange}
          totalCount={contacts.length}
        />
        <div className="flex items-center space-x-2">
          <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Items per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <FilterDialog
            open={isFiltersOpen}
            onOpenChange={setIsFiltersOpen}
            onApplyFilters={handleFiltersChange}
            currentFilters={filters}
            totalCount={contacts.length}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedContacts.length === contacts.length}
                  onCheckedChange={selectAllContacts}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedContacts.map(renderContactRow)}
            {paginatedContacts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No contacts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mt-4">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalRecords={contacts.length}
          pageSize={itemsPerPage}
          onPageSizeChange={(size: number) => {
            setItemsPerPage(size);
            setPage(1);
          }}
        />
        <Select onValueChange={setSegmentFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Segment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Segments</SelectItem>
            {availableSegments.map(segment => (
              <SelectItem key={segment} value={segment}>
                {segment}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={openProfile} onOpenChange={setOpenProfile}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Contact Profile</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <UserProfileModal
              contact={selectedContact}
              onSave={handleUpdateContact}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactsTable;
