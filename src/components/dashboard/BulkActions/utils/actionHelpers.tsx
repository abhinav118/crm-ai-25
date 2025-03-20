
import React from 'react';
import { User, Pencil, Trash, MessageSquare, CalendarIcon } from 'lucide-react';

// Helper function to get icon based on action
export const getActionIcon = (action: string) => {
  switch (action) {
    case 'add':
      return User;
    case 'update':
      return Pencil;
    case 'delete':
      return Trash;
    case 'message_sent':
      return MessageSquare;
    case 'message_received':
      return MessageSquare;
    default:
      return CalendarIcon;
  }
};

// Get badge color based on action
export const getActionColor = (action: string) => {
  switch (action) {
    case 'add':
      return 'text-green-500 border-green-200';
    case 'update':
      return 'text-blue-500 border-blue-200';
    case 'delete':
      return 'text-red-500 border-red-200';
    case 'message_sent':
      return 'text-indigo-500 border-indigo-200';
    case 'message_received':
      return 'text-purple-500 border-purple-200';
    default:
      return 'text-gray-500 border-gray-200';
  }
};

// Renamed from getActionBadgeColor to avoid confusion
export const getActionBadgeStyle = (action: string) => {
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
