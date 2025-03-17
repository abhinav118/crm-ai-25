
import React from 'react';
import { User, Pencil, Trash, MessageSquare, CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Helper function to get icon based on action
export const getActionIcon = (action: string) => {
  switch (action) {
    case 'add':
      return <User className="h-4 w-4 text-green-500" />;
    case 'update':
      return <Pencil className="h-4 w-4 text-blue-500" />;
    case 'delete':
      return <Trash className="h-4 w-4 text-red-500" />;
    case 'message_sent':
      return <MessageSquare className="h-4 w-4 text-indigo-500" />;
    case 'message_received':
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    default:
      return <CalendarIcon className="h-4 w-4 text-gray-500" />;
  }
};

// Get badge color based on action
export const getActionBadgeColor = (action: string) => {
  switch (action) {
    case 'add':
      return 'bg-green-100 text-green-800';
    case 'update':
      return 'bg-blue-100 text-blue-800';
    case 'delete':
      return 'bg-red-100 text-red-800';
    case 'message_sent':
      return 'bg-indigo-100 text-indigo-800';
    case 'message_received':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const formatActionType = (action: string) => {
  switch (action) {
    case 'add':
      return 'Add';
    case 'update':
      return 'Update';
    case 'delete':
      return 'Delete';
    case 'message_sent':
      return 'Sent';
    case 'message_received':
      return 'Received';
    default:
      return action.replace('_', ' ');
  }
};
