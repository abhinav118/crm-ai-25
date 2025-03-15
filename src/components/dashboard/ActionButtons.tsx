
import React from 'react';
import { 
  Plus, 
  Filter, 
  UserPlus, 
  Mail, 
  Trash, 
  Download, 
  Upload,
  MoreHorizontal,
  Tag
} from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';

type ActionButtonsProps = {
  selectedCount: number;
};

const ActionButtons: React.FC<ActionButtonsProps> = ({ selectedCount }) => {
  const hasSelection = selectedCount > 0;
  const { toast } = useToast();
  
  const handleAction = (action: string) => {
    if (hasSelection) {
      toast({
        title: `${action} triggered`,
        description: `${action} action on ${selectedCount} selected contacts`,
        duration: 3000,
      });
    }
  };
  
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
      <ActionButton icon={<Plus size={18} />} label="New" />
      <ActionButton icon={<Filter size={18} />} label="Filter" />
      <ActionButton icon={<UserPlus size={18} />} label="Add Contact" primary onClick={() => handleAction('Add Contact')} />
      
      <div className="h-6 w-px bg-gray-300 mx-1"></div>
      
      <ActionButton 
        icon={<Mail size={18} />} 
        label="Email" 
        disabled={!hasSelection} 
        onClick={() => handleAction('Email')}
      />
      <ActionButton 
        icon={<Tag size={18} />} 
        label="Tag" 
        disabled={!hasSelection} 
        onClick={() => handleAction('Tag')}
      />
      <ActionButton 
        icon={<Trash size={18} />} 
        label="Delete" 
        disabled={!hasSelection} 
        danger 
        onClick={() => handleAction('Delete')}
      />
      
      <div className="h-6 w-px bg-gray-300 mx-1"></div>
      
      <ActionButton icon={<Upload size={18} />} label="Import" onClick={() => handleAction('Import')} />
      <ActionButton icon={<Download size={18} />} label="Export" onClick={() => handleAction('Export')} />
      <ActionButton icon={<MoreHorizontal size={18} />} label="More" />
      
      {hasSelection && (
        <div className="ml-4 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium">
          {selectedCount} selected
        </div>
      )}
    </div>
  );
};

type ActionButtonProps = {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
};

const ActionButton: React.FC<ActionButtonProps> = ({ 
  icon, 
  label, 
  onClick, 
  disabled = false,
  primary = false,
  danger = false
}) => {
  const className = React.useMemo(() => {
    if (disabled) return "text-gray-400 bg-gray-100 cursor-not-allowed";
    if (primary) return "text-white bg-primary hover:bg-primary/90";
    if (danger) return "text-white bg-red-500 hover:bg-red-400";
    return "text-gray-700 bg-white hover:bg-gray-50 border border-gray-200";
  }, [disabled, primary, danger]);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            disabled={disabled}
            className={`action-button flex items-center justify-center h-9 px-3 rounded-md ${className} transition-all duration-200`}
          >
            {icon}
            <span className="ml-2 text-sm whitespace-nowrap">{label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ActionButtons;
