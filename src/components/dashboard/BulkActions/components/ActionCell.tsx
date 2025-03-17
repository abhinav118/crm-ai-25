
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getActionIcon, getActionBadgeColor, formatActionType } from '../utils/actionHelpers';
import { LogEntry } from '../hooks/useBulkActionsData';

type ActionCellProps = {
  log: LogEntry;
};

const ActionCell: React.FC<ActionCellProps> = ({ log }) => {
  return (
    <div className="flex items-center gap-2">
      {getActionIcon(log.action)}
      <Badge variant="outline" className={`${getActionBadgeColor(log.action)} border-0`}>
        {formatActionType(log.action)}
      </Badge>
    </div>
  );
};

export default ActionCell;
