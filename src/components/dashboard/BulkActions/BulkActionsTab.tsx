import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Contact } from '../ContactsTable';
import ManageSegmentTags from './components/ManageSegmentTags';
import ManageSegmentMembership from './components/ManageSegmentMembership';
import BulkActionsTable from './BulkActionsTable';
import { Button } from '@/components/ui/button';

interface BulkActionsTabProps {
  selectedContacts: Contact[];
  onActionComplete?: () => void;
  onClearSelection?: () => void;
}

const BulkActionsTab: React.FC<BulkActionsTabProps> = ({
  selectedContacts,
  onActionComplete,
  onClearSelection,
}) => {
  const [activeSubTab, setActiveSubTab] = useState('segment-tags');

  const handleClearSelection = () => {
    if (onClearSelection) {
      onClearSelection();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedContacts.length} contacts selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
          >
            Clear selection
          </Button>
        </div>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-fit">
          <TabsTrigger value="segment-tags">Manage Segment Tags</TabsTrigger>
          <TabsTrigger value="segment-membership">Manage Segment Membership</TabsTrigger>
          <TabsTrigger value="activity-log">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="segment-tags" className="mt-6">
          <ManageSegmentTags onActionComplete={onActionComplete} />
        </TabsContent>

        <TabsContent value="segment-membership" className="mt-6">
          <ManageSegmentMembership onActionComplete={onActionComplete} />
        </TabsContent>

        <TabsContent value="activity-log" className="mt-6">
          <BulkActionsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkActionsTab;
