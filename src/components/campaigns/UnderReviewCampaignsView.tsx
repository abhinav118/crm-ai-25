import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UnderReviewCampaignsView: React.FC = () => {
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState('sending-next');
  
  const navigate = useNavigate();

  const handleCreateCampaign = () => {
    navigate('/campaigns/create');
  };

  const handleSelectMessage = (messageId: string, checked: boolean) => {
    const newSelected = new Set(selectedMessages);
    if (checked) {
      newSelected.add(messageId);
    } else {
      newSelected.delete(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMessages(new Set(['msg-1']));
    } else {
      setSelectedMessages(new Set());
    }
  };

  const sampleMessage = {
    id: 'msg-1',
    to: '(718) 406-1667',
    preview: "(test) EZ Texting: Don't miss out! Get your PRODUCT now at COMPANY NAME and enjoy a 15% discount with...",
    status: 'In Review'
  };

  return (
    <div>
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Under Review</h1>
          <p className="text-gray-600 max-w-4xl">
            These messages are under review from our Compliance team to ensure they adhere to wireless carrier rules and regulations. Once a message has been approved, you may send it at any time. You can{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700">learn more here</a>.
          </p>
        </div>
        <Button onClick={handleCreateCampaign} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2">
          CREATE CAMPAIGN
        </Button>
      </div>

      {/* Table Header */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <Checkbox
              checked={selectedMessages.size > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-gray-600">Select</span>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sending-next">Sending Next</SelectItem>
                <SelectItem value="created-date">Created Date</SelectItem>
                <SelectItem value="recipient">Recipient</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Message Row */}
        <div className="p-4 border-b border-gray-200 last:border-b-0">
          <div className="flex items-start space-x-4">
            <Checkbox
              checked={selectedMessages.has(sampleMessage.id)}
              onCheckedChange={(checked) => handleSelectMessage(sampleMessage.id, checked as boolean)}
            />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-1">
                    To: {sampleMessage.to}
                  </p>
                  <p className="text-gray-600 text-sm mb-2">
                    {sampleMessage.preview}
                  </p>
                  <span className="inline-block px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded">
                    {sampleMessage.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button variant="link" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    VIEW MESSAGE
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" disabled>
              <ChevronLeft className="h-4 w-4 mr-1" />
              PREV
            </Button>
            <span className="text-sm text-gray-600">1-1</span>
            <Button variant="ghost" size="sm" disabled>
              NEXT
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Select defaultValue="50">
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">Items per page</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnderReviewCampaignsView;
