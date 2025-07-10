
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Inbox,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useToast } from '@/hooks/use-toast';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useCustomAuth();
  const { toast } = useToast();

  const handleSignOut = () => {
    signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate('/auth');
  };

  const menuItems = [
    { path: '/contacts', icon: Users, label: 'Contacts' },
    { path: '/inbox', icon: Inbox, label: 'Inbox' },
    { path: '/campaigns', icon: Send, label: 'Campaigns' },
    { path: '/reporting', icon: BarChart3, label: 'Reporting' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold text-gray-900">TextFlow</h1>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="ml-auto"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </Button>
          </div>
        </div>

        {/* User Info */}
        {!collapsed && user && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-medium">
                  {user.first_name[0]}{user.last_name[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.login_email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && <span className="ml-3">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start"
          >
            <LogOut size={16} />
            {!collapsed && <span className="ml-3">Sign Out</span>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
