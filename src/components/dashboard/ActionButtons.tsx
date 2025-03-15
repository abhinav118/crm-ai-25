
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

type ActionButtonsProps = {
  selectedCount: number;
};

const ActionButtons: React.FC<ActionButtonsProps> = ({ selectedCount }) => {
  const hasSelection = selectedCount > 0;
  
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
      <ActionButton icon={<Plus size={18} />} label="New" />
      <ActionButton icon={<Filter size={18} />} label="Filter" />
      <ActionButton icon={<UserPlus size={18} />} label="Add Contact" primary />
      
      <div className="h-6 w-px bg-gray-300 mx-1"></div>
      
      <ActionButton 
        icon={<Mail size={18} />} 
        label="Email" 
        disabled={!hasSelection} 
      />
      <ActionButton 
        icon={<Tag size={18} />} 
        label="Tag" 
        disabled={!hasSelection} 
      />
      <ActionButton 
        icon={<Trash size={18} />} 
        label="Delete" 
        disabled={!hasSelection} 
        danger 
      />
      
      <div className="h-6 w-px bg-gray-300 mx-1"></div>
      
      <ActionButton icon={<Upload size={18} />} label="Import" />
      <ActionButton icon={<Download size={18} />} label="Export" />
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
    if (danger) return "text-white bg-danger hover:bg-danger/90";
    return "text-gray-700 bg-white hover:bg-gray-50 border border-gray-200";
  }, [disabled, primary, danger]);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            disabled={disabled}
            className={`action-button ${className} transition-all duration-200`}
          >
            {icon}
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
