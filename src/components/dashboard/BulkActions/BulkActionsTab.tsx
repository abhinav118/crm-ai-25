
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Contact } from '../ContactsTable';
import ManageSegmentTags from './components/ManageSegmentTags';
import ManageSegmentMembership from './components/ManageSegmentMembership';
import BulkActionsTable from './BulkActionsTable';

interface BulkActionsTabProps {
  selectedContacts: Contact[];
  onActionComplete: () => void;
  onSelectionClear: () => void;
  segmentFilter?: string;
  availableSegments?: string[];
  onSegmentFilterChange?: (segment: string) => void;
}

const BulkActionsTab: React.FC<BulkActionsTabProps> = ({
  selectedContacts,
  onActionComplete,
  onSelectionClear,
  segmentFilter = 'all',
  availableSegments = [],
  onSegmentFilterChange
}) => {
  const [activeSubTab, setActiveSubTab] = useState('segment-tags');

  return (
    <div className="space-y-6">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-fit">
          <TabsTrigger value="segment-tags">Manage Segment Tags</TabsTrigger>
          <TabsTrigger value="segment-membership">Manage Segment Membership</TabsTrigger>
          <TabsTrigger value="activity-log">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="segment-tags" className="mt-6">
          <ManageSegmentTags 
            onActionComplete={onActionComplete}
            segmentFilter={segmentFilter}
            availableSegments={availableSegments}
            onSegmentFilterChange={onSegmentFilterChange}
          />
        </TabsContent>

        <TabsContent value="segment-membership" className="mt-6">
          <ManageSegmentMembership 
            onActionComplete={onActionComplete}
            segmentFilter={segmentFilter}
            availableSegments={availableSegments}
            onSegmentFilterChange={onSegmentFilterChange}
          />
        </TabsContent>

        <TabsContent value="activity-log" className="mt-6">
          <BulkActionsTable 
            segmentFilter={segmentFilter}
            availableSegments={availableSegments}
            onSegmentFilterChange={onSegmentFilterChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkActionsTab;
