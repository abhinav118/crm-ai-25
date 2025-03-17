
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';
import { LogEntry } from '../hooks/useBulkActionsData';

type DescriptionCellProps = {
  log: LogEntry;
};

const DescriptionCell: React.FC<DescriptionCellProps> = ({ log }) => {
  // Show message content if available
  if ((log.action === 'message_sent' || log.action === 'message_received') && log.contact?.message) {
    return (
      <div>
        <div>{log.description}</div>
        <div className="text-sm text-gray-500 mt-1 italic">"{log.contact.message}"</div>
      </div>
    );
  }
  
  // Show tags if this was a tag update
  if (log.action === 'update' && log.contact?.tags && log.contact.tags.length > 0) {
    return (
      <div>
        <div>{log.description}</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {log.contact.tags.map((tag: string) => (
            <Badge key={tag} variant="outline" className="px-2 py-0.5 text-xs flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    );
  }
  
  return <div>{log.description}</div>;
};

export default DescriptionCell;
