
import React from 'react';
import { LogEntry } from '../hooks/useBulkActionsData';
import { Avatar } from '@/components/ui/avatar';
import { AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

const ContactCell = ({ log }: { log: LogEntry }) => {
  // Check if log or log.contact is undefined
  if (!log || !log.contact) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8 bg-gray-100">
          <AvatarFallback className="text-xs">?</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">Unknown</p>
          <p className="text-xs text-muted-foreground">No data</p>
        </div>
      </div>
    );
  }
  
  const { name, status, email } = log.contact;
  
  return (
    <div className="flex items-center gap-2">
      <Avatar className={`h-8 w-8 ${status === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>
        <AvatarFallback className="text-xs">{getInitials(name || '')}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium">{name || 'Unknown'}</p>
        <p className="text-xs text-muted-foreground">{email || 'No email'}</p>
      </div>
    </div>
  );
};

export default ContactCell;
