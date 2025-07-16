
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Grid, 
  User, 
  MessageSquare,
  Archive, 
  List, 
  Settings,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed = false, 
  onToggle 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profileData } = useProfile();
  const { logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDisplayName = () => {
    if (!profileData) return 'User';
    const firstName = profileData.firstName || '';
    const lastName = profileData.lastName || '';
    return firstName && lastName ? `${firstName} ${lastName}` : profileData.email || 'User';
  };

  const getInitials = () => {
    if (!profileData) return 'U';
    const firstName = profileData.firstName || '';
    const lastName = profileData.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    } else if (profileData.email) {
      return profileData.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (collapsed) {
    return (
      <aside className="h-screen fixed top-0 left-0 z-30 flex flex-col w-[63px] bg-[#0F172A] text-white">
        <div className="flex items-center justify-center h-16 px-3">
          <img 
            src="/lovable-uploads/9cf20fca-a0fb-4424-9cbe-76647a5a5e70.png" 
            alt="Angel Flight Marketing Services"
            className="h-14 w-auto"
          />
        </div>
        
        <nav className="flex-1 px-3 space-y-2">
          <SidebarLink 
            icon={<User size={20} />} 
            label="Contacts" 
            to="/contacts" 
            collapsed={true}
            active={isActive('/contacts')}
          />
          <SidebarLink 
            icon={<MessageSquare size={20} />} 
            label="Conversations" 
            to="/inbox" 
            collapsed={true}
            active={isActive('/inbox')}
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="bg-purple-600 h-8 w-8 rounded-full flex items-center justify-center text-white font-medium text-sm cursor-pointer hover:bg-purple-700 transition-colors">
                  {getInitials()}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-48">
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="h-screen fixed top-0 left-0 z-30 flex flex-col w-[234px] bg-[#0F172A] text-white justify-between">
      {/* Logo */}
      <div>
        <div className="p-4 flex items-center justify-center">
          <img 
            src="/lovable-uploads/9cf20fca-a0fb-4424-9cbe-76647a5a5e70.png" 
            alt="Angel Flight Marketing Services"
            className="h-14 w-auto"
          />
        </div>

        {/* Main Nav */}
        <nav className="px-3 space-y-2 text-sm">
          <SidebarLink 
            icon={<User size={20} />} 
            label="Contacts" 
            to="/contacts" 
            active={isActive('/contacts')}
          />
          <SidebarLink 
            icon={<MessageSquare size={20} />} 
            label="Conversations" 
            to="/inbox" 
            active={isActive('/inbox')}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 px-2 py-2 text-sm cursor-pointer hover:bg-slate-800 rounded-md transition-colors">
              <div className="bg-purple-600 h-8 w-8 rounded-full flex items-center justify-center text-white font-medium">
                {getInitials()}
              </div>
              <div className="flex flex-col text-white flex-1">
                <span className="font-medium">{getDisplayName()}</span>
                <span className="text-xs text-slate-400">
                  {profileData?.company || 'User'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-48">
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
