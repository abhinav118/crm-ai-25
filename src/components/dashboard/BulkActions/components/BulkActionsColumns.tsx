
import React from 'react';
import ContactCell from './ContactCell';
import ActionCell from './ActionCell';
import DescriptionCell from './DescriptionCell';
import { LogEntry } from '../hooks/useBulkActionsData';

export const getBulkActionsColumns = () => {
  return [
    {
      id: 'contact',
      header: 'Contact',
      cell: ({ row }: { row: any }) => {
        const log = row.original as unknown as LogEntry;
        return <ContactCell log={log} />;
      },
    },
    {
      id: 'action',
      header: 'Action',
      cell: ({ row }: { row: any }) => {
        const log = row.original as unknown as LogEntry;
        return <ActionCell log={log} />;
      },
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      cell: ({ row }: { row: any }) => {
        const log = row.original as unknown as LogEntry;
        return <DescriptionCell log={log} />;
      },
    },
    {
      id: 'date',
      header: 'Date',
      accessorKey: 'date',
    },
  ];
};
