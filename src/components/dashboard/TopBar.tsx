
import React from 'react';
import { cn } from '@/lib/utils';
import { Menu, UserCircle, Bell } from 'lucide-react';

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
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-md hover:bg-gray-100 transition-colors">
          <Bell size={20} />
        </button>
        <button className="p-2 rounded-md hover:bg-gray-100 transition-colors">
          <UserCircle size={20} />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
