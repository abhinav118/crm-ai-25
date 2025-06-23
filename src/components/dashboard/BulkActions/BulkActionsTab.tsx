import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Contact } from '@/types';
import ManageSegmentMembership from './components/ManageSegmentMembership';

interface BulkActionsTabProps {
  selectedContacts: Contact[];
  segmentFilter: string;
  availableSegments: string[];
  onSegmentFilterChange: (segment: string) => void;
}

const BulkActionsTab: React.FC<BulkActionsTabProps> = ({
  selectedContacts,
  segmentFilter,
  availableSegments,
  onSegmentFilterChange
}) => {
  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-lg font-semibold">Bulk Actions</h2>
        <p className="text-sm text-gray-500">
          Perform actions on multiple contacts at once.
        </p>
      </div>
      
      <Tabs defaultValue="segments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="segments">Segment Management</TabsTrigger>
          <TabsTrigger value="tags">Tag Management</TabsTrigger>
          <TabsTrigger value="actions">Bulk Actions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="segments" className="space-y-4">
          <ManageSegmentMembership
            selectedContacts={selectedContacts}
            segmentFilter={segmentFilter}
            availableSegments={availableSegments}
            onSegmentFilterChange={onSegmentFilterChange}
          />
        </TabsContent>
        
        <TabsContent value="tags">
          <p>Tag Management Content</p>
        </TabsContent>
        
        <TabsContent value="actions">
          <p>Bulk Actions Content</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkActionsTab;
