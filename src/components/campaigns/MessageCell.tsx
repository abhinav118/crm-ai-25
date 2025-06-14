
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Image as ImageIcon } from 'lucide-react';

export interface MessageCellProps {
  message: string;
  mediaUrl?: string | null;
  onView: () => void;
  // Optional: className for td
  className?: string;
}

export const MessageCell: React.FC<MessageCellProps> = ({
  message,
  mediaUrl,
  onView,
  className = ""
}) => {
  // Show up to 50 chars of message, add ... if longer
  const preview = message && message.length > 50 ? `${message.substring(0, 50)}...` : message;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {mediaUrl ? (
        // Image thumbnail for MMS
        <div className="relative group">
          <img
            src={mediaUrl}
            alt="MMS"
            className="w-10 h-10 rounded object-cover border border-gray-200 mr-2 bg-gray-50"
            style={{ minWidth: 40, minHeight: 40 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="absolute -top-1 -left-1 bg-white rounded-full shadow p-0.5">
            <ImageIcon className="w-4 h-4 text-blue-400" />
          </span>
        </div>
      ) : null}
      <span className="truncate max-w-[160px] md:max-w-[260px]">{preview}</span>
      <Button
        variant="link"
        size="sm"
        onClick={e => { e.stopPropagation(); onView(); }}
        className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 p-0"
        tabIndex={0}
      >
        <Eye className="h-4 w-4" />
        View Message
      </Button>
    </div>
  );
};

export default MessageCell;
