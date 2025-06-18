
import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Edit, Phone, Mail, Building, Clock, Calendar, Tag } from 'lucide-react';
import { getFullName, getInitials } from '@/utils/contactHelpers';

interface Contact {
  id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status: 'active' | 'inactive';
  tags?: string[];
  lastActivity?: string;
  createdAt?: string;
}

interface ContactInfoPanelProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
}

const ContactInfoPanel: React.FC<ContactInfoPanelProps> = ({ contact, onEdit }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    try {
      return format(new Date(dateString), 'M/d/yyyy, h:mm:ss a');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return 'Not provided';
    // Simple phone formatting - you can enhance this
    return phone;
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-teal-100 text-teal-700 font-medium">
              {getInitials(contact)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {getFullName(contact)}
            </h3>
            <p className="text-sm text-gray-500">
              {formatPhone(contact.phone)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(contact)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </Button>
        </div>
      </div>

      {/* Contact Information */}
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Contact Information</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(contact)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 flex items-center justify-center mt-0.5">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500">Name</div>
              <div className="font-medium text-gray-900">
                {getFullName(contact)}
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start space-x-3">
            <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-gray-500">Phone</div>
              <div className="font-medium text-gray-900">
                {formatPhone(contact.phone)}
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start space-x-3">
            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-gray-500">Email</div>
              <div className="font-medium text-gray-900">
                {contact.email || 'Not provided'}
              </div>
            </div>
          </div>

          {/* Company */}
          <div className="flex items-start space-x-3">
            <Building className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-gray-500">Company</div>
              <div className="font-medium text-gray-900">
                {contact.company || 'Not provided'}
              </div>
            </div>
          </div>

          {/* Last Activity */}
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-gray-500">Last Activity</div>
              <div className="font-medium text-gray-900">
                {formatDate(contact.lastActivity)}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 flex items-center justify-center mt-0.5">
              <div className={`w-2 h-2 rounded-full ${
                contact.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-500">Status</div>
              <Badge 
                variant={contact.status === 'active' ? 'success' : 'secondary'}
                className={contact.status === 'active' ? 'bg-green-100 text-green-800' : ''}
              >
                {contact.status}
              </Badge>
            </div>
          </div>

          {/* Created */}
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-gray-500">Created</div>
              <div className="font-medium text-gray-900">
                {formatDate(contact.createdAt)}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-start space-x-3">
            <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-gray-500">Tags</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {contact.tags && contact.tags.length > 0 ? (
                  contact.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">No tags</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfoPanel;
