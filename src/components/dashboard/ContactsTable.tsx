
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import Avatar from './Avatar';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Phone, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  lastActivity?: string;
  status: 'active' | 'inactive';
  tags?: string[];
  createdAt: string;
};

type ContactsTableProps = {
  contacts: Contact[];
  className?: string;
};

const ContactsTable: React.FC<ContactsTableProps> = ({ 
  contacts,
  className
}) => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  const handleSelectRow = (id: string, isSelected: boolean) => {
    const newSelectedRows = new Set(selectedRows);
    if (isSelected) {
      newSelectedRows.add(id);
    } else {
      newSelectedRows.delete(id);
    }
    setSelectedRows(newSelectedRows);
  };
  
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const allIds = contacts.map(contact => contact.id);
      setSelectedRows(new Set(allIds));
    } else {
      setSelectedRows(new Set());
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  const columns: ColumnDef<Contact>[] = [
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar 
            name={row.name} 
            status={row.status} 
          />
          <div>
            <div className="font-medium">{row.name}</div>
            {row.company && (
              <div className="text-xs text-gray-500">{row.company}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'phone',
      header: 'Phone',
      accessorKey: 'phone',
      cell: ({ row }) => (
        row.phone ? (
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-gray-400" />
            <span>{row.phone}</span>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )
      ),
    },
    {
      id: 'email',
      header: 'Email',
      accessorKey: 'email',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail size={14} className="text-gray-400" />
          <span>{row.email}</span>
        </div>
      ),
    },
    {
      id: 'lastActivity',
      header: 'Last Activity',
      accessorKey: 'lastActivity',
      cell: ({ row }) => (
        row.lastActivity ? (
          <div className="flex flex-col">
            <span className="font-medium">{formatDate(row.lastActivity)}</span>
            <span className="text-xs text-gray-500">{formatTime(row.lastActivity)}</span>
          </div>
        ) : (
          <span className="text-gray-400">No activity</span>
        )
      ),
    },
    {
      id: 'tags',
      header: 'Tags',
      accessorKey: 'tags',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.tags && row.tags.length > 0 ? (
            row.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="px-2 py-0.5 text-xs">
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      ),
    },
  ];
  
  return (
    <div className={cn("glass-card", className)}>
      <DataTable
        data={contacts}
        columns={columns}
        isSelectable={true}
        selectedRows={selectedRows}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        onRowClick={(row) => console.log('Clicked row:', row)}
      />
    </div>
  );
};

export default ContactsTable;
