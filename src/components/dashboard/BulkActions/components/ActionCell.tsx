
import React from 'react';
import { LogEntry } from '../hooks/useBulkActionsData';
import { Badge } from '@/components/ui/badge';
import { getActionColor, getActionIcon } from '../utils/actionHelpers';

const ActionCell = ({ log }: { log: LogEntry }) => {
  // Check if log is undefined before accessing its properties
  if (!log) {
    return <Badge variant="outline" className="text-gray-500 border-gray-200">Unknown</Badge>;
  }
  
  // Make sure log.action exists with a fallback
  const action = log.action || 'unknown';
  const Icon = getActionIcon(action);
  const colorClass = getActionColor(action);

  return (
    <Badge className={`gap-1 ${colorClass}`} variant="outline">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      <span className="capitalize">{action.replace('_', ' ')}</span>
    </Badge>
  );
};

export default ActionCell;
