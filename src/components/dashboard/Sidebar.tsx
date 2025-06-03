
import React from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Calendar, 
  BarChart3, 
  CreditCard, 
  Settings, 
  PanelLeft,
  ChevronRight,
  Megaphone,
  Brain,
  FileText
} from 'lucide-react';

type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed = false, 
  onToggle 
}) => {
  return (
    <aside className={cn(
      "h-screen fixed top-0 left-0 z-30 flex flex-col transition-all duration-300 ease-in-out bg-[#69e2c7] text-white",
      collapsed ? "w-[70px]" : "w-[240px]"
    )}>
      <div className="flex items-center h-16 px-3 border-b border-white/20">
        <div className={cn(
          "flex items-center transition-all duration-300",
          collapsed ? "justify-center w-full" : "justify-between w-full"
        )}>
          {!collapsed && (
            <div className="flex items-center">
              <div className="text-white font-semibold tracking-tight text-xl">Lumen CRM</div>
            </div>
          )}
          {collapsed && (
            <div className="flex items-center justify-center">
              <div className="text-white text-xl font-bold">L</div>
            </div>
          )}
          <button 
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white rounded-md hover:bg-white/10 transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <PanelLeft size={18} />}
          </button>
        </div>
      </div>
      
      <div className="flex flex-col flex-1 py-4 overflow-y-auto">
        <nav className="px-2 space-y-1">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" to="/" collapsed={collapsed} />
          <SidebarItem icon={<Users size={20} />} label="Contacts" to="/contacts" collapsed={collapsed} />
          <SidebarItem icon={<MessageSquare size={20} />} label="Conversations" to="/conversations" collapsed={collapsed} />
          <SidebarItem icon={<Brain size={20} />} label="AI CRM" to="/ai-crm" collapsed={collapsed} />
          <SidebarItem icon={<Calendar size={20} />} label="Calendar" to="/calendar" collapsed={collapsed} />
          <SidebarItem icon={<BarChart3 size={20} />} label="Analytics" to="/analytics" collapsed={collapsed} />
          <SidebarItem icon={<Megaphone size={20} />} label="Campaigns" to="/campaigns" collapsed={collapsed} />
          <SidebarItem icon={<FileText size={20} />} label="Reporting" to="/reporting" collapsed={collapsed} />
          <SidebarItem icon={<CreditCard size={20} />} label="Payments" to="/payments" collapsed={collapsed} />
        </nav>
        
        <div className="mt-auto px-2">
          <SidebarItem icon={<Settings size={20} />} label="Settings" to="/settings" collapsed={collapsed} />
        </div>
      </div>
      
      <div className="p-4 border-t border-white/20">
        <div className={cn(
          "flex items-center",
          collapsed ? "justify-center" : "space-x-3"
        )}>
          <div className="avatar-base bg-white/20 text-white">
            JD
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-white text-sm font-medium">John Doe</span>
              <span className="text-white/70 text-xs">Admin</span>
            </div>
          )}
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

const SidebarItem: React.FC<SidebarItemProps> = ({ 
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
        "flex items-center px-3 py-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors",
        active && "bg-white/20 text-white font-medium",
        collapsed ? "justify-center" : "space-x-3"
      )}
    >
      <span className="text-xl">{icon}</span>
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
};

export default Sidebar;
