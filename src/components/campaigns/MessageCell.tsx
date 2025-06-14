
import React from 'react';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon } from 'lucide-react';

export interface MessageCellProps {
  message: string;
  mediaUrl?: string | null;
  onView: () => void;
  className?: string;
}

export const MessageCell: React.FC<MessageCellProps> = ({
  mediaUrl,
  onView,
  className = ""
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {mediaUrl ? (
        <div className="relative group">
          <img
            src={mediaUrl}
            alt="MMS"
            className="w-8 h-8 rounded object-cover border border-gray-200 bg-gray-50"
            style={{ minWidth: 32, minHeight: 32, maxWidth: 32, maxHeight: 32 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="absolute -top-1 -left-1 bg-white rounded-full shadow p-0.5">
            <ImageIcon className="w-3 h-3 text-blue-400" />
          </span>
        </div>
      ) : null}
      <Button
        variant="link"
        size="sm"
        onClick={e => { e.stopPropagation(); onView(); }}
        className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 p-0"
        tabIndex={0}
      >
        View Message
      </Button>
    </div>
  );
};

export default MessageCell;
