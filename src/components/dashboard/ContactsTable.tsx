
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Contact } from '@/types';
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { MoreVertical, Edit, MessageSquare, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Re-export Contact type for backward compatibility
export type { Contact };

interface ContactsTableProps {
  contacts: Contact[];
  isLoading: boolean;
  selectedContacts: string[];
  onContactSelect: (contactId: string) => void;
  onSelectAll: (selectAll: boolean) => void;
  onContactClick: (contact: Contact) => void;
  onSendMessage: (contact: Contact) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contact: Contact) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (sortBy: string) => void;
}

const visibleColumns = [
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
  { key: 'tags', label: 'Tags' },
  { key: 'createdAt', label: 'Created At' },
  { key: 'updatedAt', label: 'Updated At' },
  { key: 'lastActivity', label: 'Last Activity' },
];

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatPhoneNumber = (phoneNumberString: string): string => {
  const cleaned = phoneNumberString.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phoneNumberString;
};

const formatEmail = (email: string): string => {
  const maxLength = 20;
  if (email.length > maxLength) {
    return email.substring(0, maxLength) + '...';
  }
  return email;
};

const ContactsTable: React.FC<ContactsTableProps> = ({
  contacts = [], // Add default value to prevent undefined
  isLoading,
  selectedContacts,
  onContactSelect,
  onSelectAll,
  onContactClick,
  onSendMessage,
  onEditContact,
  onDeleteContact,
  currentPage,
  totalPages,
  onPageChange,
  sortBy,
  sortOrder,
  onSort
}) => {
  const isAllSelected = contacts.length > 0 && contacts.every(contact => selectedContacts.includes(contact.id));

  const handleSort = (key: string) => {
    if (sortBy === key) {
      onSort(sortOrder === 'asc' ? `-${key}` : key);
    } else {
      onSort(key);
    }
  };

  const renderSortArrow = (key: string) => {
    if (sortBy === key) {
      return sortOrder === 'asc' ? '▲' : '▼';
    }
    return null;
  };

  const renderCellContent = (contact: Contact, key: string) => {
    const value = contact[key as keyof Contact];
    
    if (key === 'tags' && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {(value as string[]).slice(0, 2).map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              {tag}
            </span>
          ))}
          {(value as string[]).length > 2 && (
            <span className="text-xs text-gray-500">+{(value as string[]).length - 2} more</span>
          )}
        </div>
      );
    }
    
    if (key === 'phone' && value) {
      return formatPhoneNumber(String(value));
    }
    
    if (key === 'email' && value) {
      return formatEmail(String(value));
    }
    
    if ((key === 'createdAt' || key === 'updatedAt' || key === 'lastActivity') && value) {
      return formatDate(String(value));
    }
    
    return String(value || '');
  };

  const getCellValue = (contact: Contact, key: string) => {
    const value = contact[key as keyof Contact];
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value || '');
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <Checkbox
            id="select-all"
            checked={isAllSelected}
            disabled={isLoading || contacts.length === 0}
            onCheckedChange={(checked) => onSelectAll(!!checked)}
          />
          <label
            htmlFor="select-all"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            Select All
          </label>
        </div>
        <div>
          {/* Add bulk actions here if needed */}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {/* Placeholder for checkbox column */}
              </th>
              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort(column.key)}
                >
                  {column.label} {renderSortArrow(column.key)}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" colSpan={visibleColumns.length + 2}>
                  Loading contacts...
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" colSpan={visibleColumns.length + 2}>
                  No contacts found.
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onContactClick(contact)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        onContactSelect(contact.id);
                      }}
                    />
                  </td>
                  
                  {visibleColumns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {renderCellContent(contact, column.key)}
                    </td>
                  ))}
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onSendMessage(contact);
                        }}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onEditContact(contact);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onDeleteContact(contact);
                        }}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Showing page {currentPage} of {totalPages}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContactsTable;
