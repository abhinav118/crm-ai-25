
import React from 'react';
import { LogEntry } from '../hooks/useBulkActionsData';

const DescriptionCell = ({ log }: { log: LogEntry }) => {
  // Check if log is undefined before accessing its properties
  if (!log || !log.description) {
    return <span className="text-muted-foreground text-sm">No description available</span>;
  }
  
  return <span className="text-sm">{log.description}</span>;
};

export default DescriptionCell;
