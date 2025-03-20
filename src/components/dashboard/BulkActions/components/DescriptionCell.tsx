
import React from 'react';
import { LogEntry } from '../hooks/useBulkActionsData';

const DescriptionCell = ({ log }: { log: LogEntry }) => {
  // Make sure description exists with a fallback
  const description = log.description || 'No description available';
  
  return (
    <p className="text-sm text-gray-600">{description}</p>
  );
};

export default DescriptionCell;
