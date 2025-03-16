
import React, { useState } from 'react';
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
import AddContactForm from './AddContactForm';

type ActionButtonsProps = {
  selectedCount: number;
};

const ActionButtons: React.FC<ActionButtonsProps> = ({ selectedCount }) => {
  const hasSelection = selectedCount > 0;
  const { toast } = useToast();
  const [showAddContact, setShowAddContact] = useState(false);
  
  const handleAction = (action: string) => {
    if (hasSelection) {
      toast({
        title: `${action} triggered`,
        description: `${action} action on ${selectedCount} selected contacts`,
        duration: 3000,
      });
    }
  };
  
  const handleAddContact = (data: any) => {
    toast({
      title: "Contact Added",
      description: "New contact has been created successfully",
    });
    setShowAddContact(false);
  };
  
  return (
    <>
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
        <div className="flex items-center gap-1 sm:gap-2">
          <ActionButton icon={<Plus size={16} />} label="New" />
          <ActionButton icon={<Filter size={16} />} label="Filter" />
          <ActionButton 
            icon={<UserPlus size={16} />} 
            label="Add Contact" 
            primary 
            onClick={() => setShowAddContact(true)} 
          />
        </div>
        
        <div className="hidden sm:block h-6 w-px bg-gray-300 mx-1"></div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <ActionButton 
            icon={<Mail size={16} />} 
            label="Email" 
            disabled={!hasSelection} 
            onClick={() => handleAction('Email')}
          />
          <ActionButton 
            icon={<Tag size={16} />} 
            label="Tag" 
            disabled={!hasSelection} 
            onClick={() => handleAction('Tag')}
          />
          <ActionButton 
            icon={<Trash size={16} />} 
            label="Delete" 
            disabled={!hasSelection} 
            danger 
            onClick={() => handleAction('Delete')}
          />
        </div>
        
        <div className="hidden sm:block h-6 w-px bg-gray-300 mx-1"></div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <ActionButton icon={<Upload size={16} />} label="Import" onClick={() => handleAction('Import')} />
          <ActionButton icon={<Download size={16} />} label="Export" onClick={() => handleAction('Export')} />
          <ActionButton icon={<MoreHorizontal size={16} />} label="More" />
        </div>
        
        {hasSelection && (
          <div className="ml-2 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
            {selectedCount} selected
          </div>
        )}
      </div>

      <AddContactForm 
        open={showAddContact}
        onClose={() => setShowAddContact(false)}
        onSubmit={handleAddContact}
      />
    </>
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
            className={`action-button flex items-center h-8 px-2 sm:px-2.5 rounded-md ${className} transition-all duration-200 text-xs sm:text-sm`}
          >
            {icon}
            <span className="ml-1 sm:ml-1.5 whitespace-nowrap hidden xs:inline">{label}</span>
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
