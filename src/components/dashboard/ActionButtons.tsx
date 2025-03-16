
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  UserPlus,
  Send,
  Download,
  Trash2,
  Tag
} from 'lucide-react';

type ActionButtonsProps = {
  selectedCount?: number;
  className?: string;
  onAddContact?: () => void;
  onSendMessage?: () => void;
};

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  selectedCount = 0,
  className = '',
  onAddContact,
  onSendMessage
}) => {
  return (
    <div className={`space-x-2 flex ${className}`}>
      <Button 
        size="sm" 
        className="gap-1"
        onClick={onAddContact}
      >
        <UserPlus size={16} />
        Add Contact
      </Button>
      
      {selectedCount > 0 && (
        <>
          <Button 
            size="sm"
            variant="outline" 
            className="gap-1"
            onClick={onSendMessage}
          >
            <Send size={16} />
            Send Message
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            className="gap-1"
          >
            <Tag size={16} />
            Add Tag
          </Button>
          
          <Button 
            size="sm"
            variant="outline"
            className="gap-1"
          >
            <Download size={16} />
            Export
          </Button>
          
          <Button 
            size="sm"
            variant="destructive"
            className="gap-1"
          >
            <Trash2 size={16} />
            Delete
          </Button>
        </>
      )}
    </div>
  );
};

export default ActionButtons;
