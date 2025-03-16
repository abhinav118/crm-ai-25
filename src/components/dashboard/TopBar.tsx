
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, 
  Upload, 
  Download, 
  Bell, 
  Menu,
  UserCircle,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';

type TopBarProps = {
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
};

const TopBar: React.FC<TopBarProps> = ({ 
  sidebarCollapsed,
  onMenuClick
}) => {
  return (
    <header className={cn(
      "h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-20 transition-all duration-300"
    )}>
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        
        <div className="flex space-x-1 overflow-x-auto hide-scrollbar">
          <NavItem to="/contacts" active label="Contacts" icon={<UserCircle size={16} />} />
          <NavItem to="/conversations" label="Conversations" icon={<MessageSquare size={16} />} />
          <NavItem to="/calendar" label="Calendar" icon={<Calendar size={16} />} />
        </div>
      </div>
      
      <div className="flex items-center space-x-2 sm:space-x-3">
        <Button size="sm" variant="outline" className="text-xs h-8 flex items-center gap-1.5">
          <UserPlus size={16} />
          <span className="hidden sm:inline">Add Contact</span>
        </Button>
        
        <Button size="sm" variant="outline" className="text-xs h-8 flex items-center gap-1.5">
          <Upload size={16} />
          <span className="hidden sm:inline">Import</span>
        </Button>
        
        <Button size="sm" variant="outline" className="text-xs h-8 flex items-center gap-1.5">
          <Download size={16} />
          <span className="hidden sm:inline">Export</span>
        </Button>
        
        <div className="flex items-center pl-2 border-l border-gray-200">
          <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors relative">
            <Bell size={18} />
            <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full"></span>
          </button>
          
          <button className="ml-2 w-8 h-8 flex items-center justify-center rounded-full bg-avatar-purple text-white font-medium text-sm">
            JD
          </button>
        </div>
      </div>
    </header>
  );
};

type NavItemProps = {
  label: string;
  active?: boolean;
  icon?: React.ReactNode;
  to: string;
};

const NavItem: React.FC<NavItemProps> = ({ label, active = false, icon, to }) => {
  return (
    <Link 
      to={to}
      className={cn(
        "px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 transition-colors",
        active 
          ? "bg-primary/10 text-primary" 
          : "text-gray-600 hover:bg-gray-100"
      )}
    >
      {icon}
      {label}
    </Link>
  );
};

export default TopBar;
