
import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Filter, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Avatar from '@/components/dashboard/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

type BulkAction = {
  id: string;
  label: string;
  operation: string;
  status: 'completed' | 'failed' | 'in_progress';
  user: {
    name: string;
    email?: string;
  };
  createdAt: string;
  completedAt?: string;
  affectedCount?: number;
};

const SAMPLE_BULK_ACTIONS: BulkAction[] = [
  {
    id: '1',
    label: 'June Newsletter Send',
    operation: 'Email Campaign',
    status: 'completed',
    user: {
      name: 'Alex Brown',
      email: 'alex@example.com'
    },
    createdAt: '2023-06-15T10:30:00',
    completedAt: '2023-06-15T10:35:00',
    affectedCount: 247
  },
  {
    id: '2',
    label: 'Tag Update - Enterprise',
    operation: 'Update Tags',
    status: 'completed',
    user: {
      name: 'Sarah Johnson',
      email: 'sarah@example.com'
    },
    createdAt: '2023-06-14T15:20:00',
    completedAt: '2023-06-14T15:21:00',
    affectedCount: 53
  },
  {
    id: '3',
    label: 'Customer Sync',
    operation: 'Import Contacts',
    status: 'in_progress',
    user: {
      name: 'Trang Nguyen',
      email: 'trang@example.com'
    },
    createdAt: '2023-06-16T09:15:00',
    affectedCount: 189
  },
  {
    id: '4',
    label: 'Inactive Contacts Clean-up',
    operation: 'Delete Contacts',
    status: 'failed',
    user: {
      name: 'John Smith',
      email: 'john@example.com'
    },
    createdAt: '2023-06-13T11:45:00',
    completedAt: '2023-06-13T11:47:00',
    affectedCount: 0
  },
  {
    id: '5',
    label: 'Product Interest Survey',
    operation: 'SMS Campaign',
    status: 'completed',
    user: {
      name: 'Vicky Lu',
      email: 'vicky@example.com'
    },
    createdAt: '2023-06-12T16:30:00',
    completedAt: '2023-06-12T16:40:00',
    affectedCount: 156
  }
];

const BulkActionsTable: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all');
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div className="flex items-center">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Filter size={15} />
            <span>Filter</span>
            <ChevronDown size={15} />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-2">
                <Calendar size={15} className="mr-1" />
                <span>Date Range</span>
                <ChevronDown size={15} className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Today</DropdownMenuItem>
              <DropdownMenuItem>Last 7 days</DropdownMenuItem>
              <DropdownMenuItem>Last 30 days</DropdownMenuItem>
              <DropdownMenuItem>Custom range</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Button variant="link" size="sm" className="text-primary flex items-center">
          <BarChart size={15} className="mr-1" />
          <span>Show Stats</span>
        </Button>
      </div>
      
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action Label
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operation
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {SAMPLE_BULK_ACTIONS.map((action) => (
                <tr key={action.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {action.label}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {action.operation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline" className={`${getStatusColor(action.status)}`}>
                      {action.status === 'in_progress' ? 'In Progress' : action.status.charAt(0).toUpperCase() + action.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar name={action.user.name} size="sm" />
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">{action.user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(action.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {action.completedAt ? formatDateTime(action.completedAt) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">5</span> of <span className="font-medium">12</span> bulk actions
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled={currentPage === 1}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="sm">
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsTable;
