
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Contact } from '@/types';

interface ContactDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
}

const ContactDetailsDialog: React.FC<ContactDetailsDialogProps> = ({
  isOpen,
  onClose,
  contact
}) => {
  if (!contact) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Contact Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">First Name</label>
              <p className="text-sm">{contact.first_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Name</label>
              <p className="text-sm">{contact.last_name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="text-sm">{contact.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-sm">{contact.email || 'N/A'}</p>
            </div>
          </div>
          {contact.company && (
            <div>
              <label className="text-sm font-medium text-gray-500">Company</label>
              <p className="text-sm">{contact.company}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <p className="text-sm">{contact.status || 'N/A'}</p>
          </div>
          {contact.tags && contact.tags.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-500">Tags</label>
              <div className="flex flex-wrap gap-1">
                {contact.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactDetailsDialog;
