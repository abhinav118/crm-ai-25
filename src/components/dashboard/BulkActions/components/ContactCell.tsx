
import React from 'react';
import Avatar from '../../Avatar';
import { LogEntry } from '../hooks/useBulkActionsData';

type ContactCellProps = {
  log: LogEntry;
};

const ContactCell: React.FC<ContactCellProps> = ({ log }) => {
  const contact = log.contact || {};
  
  return (
    <div className="flex items-center gap-2">
      {contact.name && <Avatar name={contact.name} size="sm" />}
      <div>
        <div className="font-medium">{contact.name || 'Unknown Contact'}</div>
        {contact.email && <div className="text-xs text-gray-500">{contact.email}</div>}
      </div>
    </div>
  );
};

export default ContactCell;
