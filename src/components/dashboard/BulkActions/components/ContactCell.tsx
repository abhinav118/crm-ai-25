
import React from 'react';
import { LogEntry } from '../hooks/useBulkActionsData';
import Avatar from '@/components/dashboard/Avatar';

const ContactCell = ({ log }: { log: LogEntry }) => {
  // Add defensive code to handle potentially undefined contact
  if (!log || !log.contact) {
    return (
      <div className="flex items-center space-x-2">
        <Avatar name="Unknown" status="inactive" />
        <div>
          <p className="text-sm font-medium">Unknown Contact</p>
          <p className="text-xs text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  const { contact } = log;
  
  return (
    <div className="flex items-center space-x-2">
      <Avatar 
        name={contact.name || 'Unknown'} 
        status={contact.status || 'inactive'} 
      />
      <div>
        <p className="text-sm font-medium">{contact.name || 'Unknown Contact'}</p>
        <p className="text-xs text-gray-500">{contact.email || 'No email'}</p>
      </div>
    </div>
  );
};

export default ContactCell;
