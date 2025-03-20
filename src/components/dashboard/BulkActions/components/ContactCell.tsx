
import React from 'react';
import { LogEntry } from '../hooks/useBulkActionsData';
import Avatar from '@/components/dashboard/Avatar';

const ContactCell = ({ log }: { log: LogEntry }) => {
  // Handle cases where contact information might be missing
  if (!log || !log.contact) {
    return (
      <div className="flex items-center gap-2">
        <Avatar name="Unknown" status="inactive" />
        <div>
          <p className="font-medium">Unknown Contact</p>
          <p className="text-sm text-gray-500">Contact info unavailable</p>
        </div>
      </div>
    );
  }
  
  const contactInfo = log.contact;
  const name = contactInfo.name || 'Unknown Contact';
  const status = contactInfo.status || 'inactive';

  return (
    <div className="flex items-center gap-2">
      <Avatar name={name} status={status as any} />
      <div>
        <p className="font-medium">{name}</p>
        {contactInfo.email && <p className="text-sm text-gray-500">{contactInfo.email}</p>}
      </div>
    </div>
  );
};

export default ContactCell;
