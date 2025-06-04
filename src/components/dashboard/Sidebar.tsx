
import React from 'react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { 
  Grid, 
  User, 
  Clock, 
  Archive, 
  List, 
  Settings,
  ChevronDown
} from 'lucide-react';

type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed = false, 
  onToggle 
}) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  if (collapsed) {
    return (
      <aside className="h-screen fixed top-0 left-0 z-30 flex flex-col w-[63px] bg-[#0F172A] text-white">
        <div className="flex items-center justify-center h-16 px-3">
          <div className="bg-purple-600 text-white h-8 w-8 rounded-full flex items-center justify-center font-bold text-lg">
            T
          </div>
        </div>
        
        <nav className="flex-1 px-3 space-y-2">
          <SidebarLink 
            icon={<Grid size={20} />} 
            label="Dashboard" 
            to="/" 
            collapsed={true}
            active={isActive('/')}
          />
          <SidebarLink 
            icon={<User size={20} />} 
            label="Contacts" 
            to="/contacts" 
            collapsed={true}
            active={isActive('/contacts')}
          />
          <SidebarLink 
            icon={<Clock size={20} />} 
            label="Conversations" 
            to="/conversations" 
            collapsed={true}
            active={isActive('/conversations')}
          />
          <SidebarLink 
            icon={<Archive size={20} />} 
            label="Campaigns" 
            to="/campaigns" 
            collapsed={true}
            active={isActive('/campaigns')}
          />
          <SidebarLink 
            icon={<List size={20} />} 
            label="Reporting" 
            to="/reporting" 
            collapsed={true}
            active={isActive('/reporting')}
          />
        </nav>
        
        <div className="px-3 py-4 border-t border-slate-700">
          <SidebarLink 
            icon={<Settings size={20} />} 
            label="Settings" 
            to="/settings" 
            collapsed={true}
            active={isActive('/settings')}
          />
          <div className="flex items-center justify-center mt-4">
            <div className="bg-purple-600 h-8 w-8 rounded-full flex items-center justify-center text-white font-medium text-sm">
              JD
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="h-screen fixed top-0 left-0 z-30 flex flex-col w-[234px] bg-[#0F172A] text-white justify-between">
      {/* Logo */}
      <div>
        <div className="p-4 flex items-center gap-3 text-white font-semibold text-lg">
          <div className="bg-purple-600 text-white h-8 w-8 rounded-full flex items-center justify-center font-bold">
            T
          </div>
          <span>TextFlow</span>
        </div>

        {/* Main Nav */}
        <nav className="px-3 space-y-2 text-sm">
          <SidebarLink 
            icon={<Grid size={20} />} 
            label="Dashboard" 
            to="/" 
            active={isActive('/')}
          />
          <SidebarLink 
            icon={<User size={20} />} 
            label="Contacts" 
            to="/contacts" 
            active={isActive('/contacts')}
          />
          <SidebarLink 
            icon={<Clock size={20} />} 
            label="Conversations" 
            to="/conversations" 
            active={isActive('/conversations')}
          />
          <SidebarLink 
            icon={<Archive size={20} />} 
            label="Campaigns" 
            to="/campaigns" 
            active={isActive('/campaigns')}
          />
          <SidebarLink 
            icon={<List size={20} />} 
            label="Reporting" 
            to="/reporting" 
            active={isActive('/reporting')}
          />
        </nav>
      </div>

      {/* Bottom Nav */}
      <div className="px-3 py-4 space-y-4 border-t border-slate-700">
        <SidebarLink 
          icon={<Settings size={20} />} 
          label="Settings" 
          to="/settings" 
          active={isActive('/settings')}
        />
        <div className="flex items-center gap-3 px-2 py-2 text-sm cursor-pointer hover:bg-slate-800 rounded-md transition-colors">
          <div className="bg-purple-600 h-8 w-8 rounded-full flex items-center justify-center text-white font-medium">
            JD
          </div>
          <div className="flex flex-col text-white flex-1">
            <span className="font-medium">John Doe</span>
            <span className="text-xs text-slate-400">Admin</span>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </aside>
  );
};

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  to: string;
  active?: boolean;
  collapsed?: boolean;
};

const SidebarLink: React.FC<SidebarItemProps> = ({ 
  icon, 
  label, 
  to, 
  active = false,
  collapsed = false
}) => {
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center px-3 py-2.5 rounded-md transition-colors text-sm font-medium",
        collapsed ? "justify-center" : "gap-3",
        active 
          ? "bg-indigo-600 text-white" 
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      )}
      title={collapsed ? label : undefined}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </Link>
  );
};

export default Sidebar;
