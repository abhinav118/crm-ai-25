
import React from 'react';
import { LogEntry } from '../hooks/useBulkActionsData';
import { Badge } from '@/components/ui/badge';
import { getActionColor, getActionIcon } from '../utils/actionHelpers';

const ActionCell = ({ log }: { log: LogEntry }) => {
  // Make sure log.action exists with a fallback
  const action = log.action || 'unknown';
  const ActionIcon = getActionIcon(action);
  const colorClass = getActionColor(action);

  return (
    <Badge className={`gap-1 ${colorClass}`} variant="outline">
      {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
      <span className="capitalize">{action.replace('_', ' ')}</span>
    </Badge>
  );
};

export default ActionCell;
