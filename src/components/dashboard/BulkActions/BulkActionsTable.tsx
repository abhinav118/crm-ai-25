
import React from 'react';
import { DataTable } from '@/components/ui/data-table';
import LoadingSkeleton from './components/LoadingSkeleton';
import { useBulkActionsData } from './hooks/useBulkActionsData';
import { getBulkActionsColumns } from './components/BulkActionsColumns';

const BulkActionsTable = () => {
  const { logs, isLoading } = useBulkActionsData();
  const columns = getBulkActionsColumns();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="glass-card">
      <DataTable
        data={logs}
        columns={columns}
      />
    </div>
  );
};

export default BulkActionsTable;
