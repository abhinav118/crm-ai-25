
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Contact } from '@/types';

interface BulkActionsTabProps {
  selectedContacts: Contact[];
  availableSegments: string[];
  segmentFilter: string;
  onSegmentFilterChange: (segment: string) => void;
  onActionComplete: () => void;
  onSelectionClear: () => void;
  onClearSelection: () => void;
}

const BulkActionsTab: React.FC<BulkActionsTabProps> = ({
  selectedContacts,
  availableSegments,
  segmentFilter,
  onSegmentFilterChange,
  onActionComplete,
  onSelectionClear,
  onClearSelection
}) => {
  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-lg font-semibold">Bulk Actions</h2>
        <p className="text-sm text-gray-500">
          Perform actions on multiple contacts at once.
        </p>
      </div>
      
      <Tabs defaultValue="actions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="actions">Bulk Actions</TabsTrigger>
          <TabsTrigger value="tags">Tag Management</TabsTrigger>
          <TabsTrigger value="segments">Segment Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="actions">
          <p>Bulk Actions Content</p>
        </TabsContent>
        
        <TabsContent value="tags">
          <p>Tag Management Content</p>
        </TabsContent>
        
        <TabsContent value="segments">
          <p>Segment Management Content</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkActionsTab;
