import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import Avatar from './Avatar';
import { getFullName } from '@/utils/contactHelpers';

export interface Contact {
  id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  lastActivity?: string;
  status: 'active' | 'inactive';
  tags?: string[];
  createdAt?: string;
}

interface ContactsTableProps {
  contacts: Contact[];
  onContactSelect: (contacts: Contact[]) => void;
  onEditContact: (contact: Contact) => void;
  onContactClick: (contact: Contact) => void;
  selectedContacts: Contact[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  showPagination?: boolean;
}

const ContactsTable: React.FC<ContactsTableProps> = ({
  contacts,
  onContactSelect,
  onEditContact,
  onContactClick,
  selectedContacts,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  activeTab,
  onTabChange,
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  showPagination = false
}) => {
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      onContactSelect(contacts);
    } else {
      onContactSelect([]);
    }
  };

  const handleSelectContact = (contact: Contact, checked: boolean) => {
    if (checked) {
      onContactSelect([...selectedContacts, contact]);
    } else {
      onContactSelect(selectedContacts.filter(c => c.id !== contact.id));
    }
  };

  const isContactSelected = (contact: Contact) => {
    return selectedContacts.some(c => c.id === contact.id);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  const displayedContacts = useMemo(() => {
    return contacts;
  }, [contacts]);

  React.useEffect(() => {
    setSelectAll(contacts.length > 0 && selectedContacts.length === contacts.length);
  }, [selectedContacts, contacts]);

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Contacts</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><div className="w-4 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-32 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-24 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-20 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-16 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-20 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-20 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-8 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : displayedContacts.length > 0 ? (
                  displayedContacts.map((contact) => (
                    <TableRow key={contact.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={isContactSelected(contact)}
                          onCheckedChange={(checked: boolean) => handleSelectContact(contact, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div 
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => onContactClick(contact)}
                        >
                          <Avatar name={getFullName(contact)} status={contact.status} />
                          <div>
                            <div className="font-medium">{getFullName(contact)}</div>
                            <div className="text-sm text-gray-500">{contact.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {contact.company || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {contact.phone || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={contact.status === 'active' ? 'success' : 'secondary'}
                        >
                          {contact.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {contact.tags?.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {contact.tags && contact.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{contact.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(contact.lastActivity) || 'Never'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditContact(contact);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No contacts found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {showPagination && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContactsTable;
