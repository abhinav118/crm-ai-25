import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, Filter, Users, Plus, MessageSquare, Edit2, Eye, Calendar, Mail, Phone, Building, Tag, Trash2, MoreHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Pagination from './Pagination';
import BulkActionsTab from './BulkActions/BulkActionsTab';
import BulkActions from './BulkActions/BulkActions';
import { getFullName, getInitials } from '@/utils/contactHelpers';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/database.types';

type ContactSegment = Database['public']['Tables']['contacts_segments']['Row'];

export interface Contact {
  id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status: 'active' | 'inactive';
  tags?: string[];
  createdAt?: string;
  lastActivity?: string;
  segment_name?: string;
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
  totalRecords?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  showCompanyColumn?: boolean;
  showBulkActionsTab?: boolean;
  showTabsHeader?: boolean;
  segmentFilter?: string;
  onSegmentFilterChange?: (segment: string) => void;
  availableSegments?: string[];
  onSegmentsLoad?: (segments: string[]) => void;
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
  totalRecords = 0,
  pageSize = 100,
  onPageChange,
  onPageSizeChange,
  showCompanyColumn = true,
  showTabsHeader = true,
  showBulkActionsTab = true,
  segmentFilter = 'all',
  onSegmentFilterChange,
  availableSegments = [],
  onSegmentsLoad,
}) => {
  const [selectAll, setSelectAll] = useState(false);
  const [localSegments, setLocalSegments] = useState<string[]>([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);

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

  React.useEffect(() => {
    setSelectAll(contacts.length > 0 && selectedContacts.length === contacts.length);
  }, [selectedContacts, contacts]);

  const loadSegments = async () => {
    if (isLoadingSegments) return;
    
    setIsLoadingSegments(true);
    try {
      const { data, error } = await supabase
        .from('contacts_segments')
        .select('*')
        .order('segment_name');

      if (error) {
        console.error('Error loading segments:', error);
        return;
      }

      console.log('---segments data:', data?.length, 'segments found');
      
      // Extract segment names, excluding 'unassigned'
      const uniqueSegments = (data || [])
        .map(row => row.segment_name)
        .filter(name => name !== 'unassigned' && name.trim() !== '')
        .sort((a, b) => a.localeCompare(b));

      setLocalSegments(uniqueSegments);
      if (onSegmentsLoad) {
        onSegmentsLoad(uniqueSegments);
      }

      // Reset to 'all' if current segment is not in the list
      if (segmentFilter !== 'all' && !uniqueSegments.includes(segmentFilter)) {
        handleSegmentChange('all');
      }
    } catch (error) {
      console.error('Error loading segments:', error);
    } finally {
      setIsLoadingSegments(false);
    }
  };

  // Load segments on mount
  useEffect(() => {
    loadSegments();
  }, []); // Only on mount

  const handleSegmentChange = (value: string) => {
    if (onSegmentFilterChange) {
      onSegmentFilterChange(value);
    }
  };

  const clearSegmentFilter = () => {
    handleSegmentChange('all');
  };

  // Memoize the segments list
  const segmentOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All Segments' },
      ...localSegments.map(segment => ({
        value: segment,
        label: segment
      }))
    ];
  }, [localSegments]);

  const renderContactsTable = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={segmentFilter} 
              onValueChange={handleSegmentChange}
              disabled={isLoadingSegments}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={isLoadingSegments ? "Loading..." : "Filter by segment"} />
              </SelectTrigger>
              <SelectContent>
                {segmentOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
                {showCompanyColumn && <TableHead>Company</TableHead>}
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Segment</TableHead>
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
                    {showCompanyColumn && <TableCell><div className="w-24 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>}
                    <TableCell><div className="w-20 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="w-16 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="w-20 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="w-20 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="w-20 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="w-8 h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : contacts.length > 0 ? (
                contacts.map((contact) => (
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
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(contact)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{getFullName(contact)}</div>
                          <div className="text-sm text-gray-500">{contact.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    {showCompanyColumn && (
                      <TableCell>{contact.company || '—'}</TableCell>
                    )}
                    <TableCell>{contact.phone || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={contact.status === 'active' ? 'default' : 'secondary'}>
                        {contact.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {contact.tags?.map((tag) => (
                          <Badge key={tag} variant="outline" className="px-2 py-0.5 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{contact.segment_name || '—'}</TableCell>
                    <TableCell>{formatDate(contact.lastActivity)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditContact(contact)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={showCompanyColumn ? 9 : 8} className="h-24 text-center">
                    No contacts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {contacts.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {selectedContacts.length > 0 && (
                <span>{selectedContacts.length} selected</span>
              )}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              totalRecords={totalRecords}
              pageSize={pageSize}
              onPageSizeChange={onPageSizeChange}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {showTabsHeader && (
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className="grid grid-cols-4 w-fit">
              <TabsTrigger value="all">All Contacts</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="bulk-actions">Bulk Actions</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-8 w-64"
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
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>

              <Select value={segmentFilter} onValueChange={onSegmentFilterChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Segment..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Segments</SelectItem>
                  {availableSegments.map((segment) => (
                    <SelectItem key={segment} value={segment}>
                      {segment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Current Filter Display */}
          {segmentFilter && segmentFilter !== 'all' && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-500">Showing:</span>
              <Badge variant="secondary" className="gap-1">
                Segment → {segmentFilter}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={clearSegmentFilter}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          )}

          <TabsContent value="all" className="mt-6">
            {renderContactsTable()}
          </TabsContent>
          
          <TabsContent value="active" className="mt-6">
            {renderContactsTable()}
          </TabsContent>
          
          <TabsContent value="inactive" className="mt-6">
            {renderContactsTable()}
          </TabsContent>

          <TabsContent value="bulk-actions" className="mt-6">
            <BulkActionsTab
              selectedContacts={selectedContacts}
              onActionComplete={() => {
                // This will be handled by the parent component
                if (window.location.reload) {
                  console.log('Action completed, refreshing data...');
                }
              }}
              onSelectionClear={() => onContactSelect([])}
              segmentFilter={segmentFilter}
              availableSegments={availableSegments}
              onSegmentFilterChange={onSegmentFilterChange}
            />
          </TabsContent>
        </Tabs>
      )}

      {!showTabsHeader && renderContactsTable()}

      {showBulkActionsTab && selectedContacts.length > 0 && (
        <BulkActions
          selectedContacts={selectedContacts}
          onContactsUpdated={() => {
            if (window.location.reload) {
              console.log('Contacts updated, refreshing data...');
            }
          }}
          onSelectionClear={() => onContactSelect([])}
        />
      )}
    </div>
  );
};

export default ContactsTable;
