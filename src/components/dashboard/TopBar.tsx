
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Menu, Bell, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type TopBarProps = {
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
};

const TopBar: React.FC<TopBarProps> = ({ 
  sidebarCollapsed,
  onMenuClick
}) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out.",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className={cn(
      "h-16 bg-background border-b border-border flex items-center justify-between px-4 sticky top-0 z-20 transition-all duration-300"
    )}>
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <div className="ml-2 font-semibold text-foreground">TextFlow CRM</div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell size={20} />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-8">
              <div className="bg-primary h-8 w-8 rounded-full flex items-center justify-center text-primary-foreground font-medium text-sm">
                {user?.email ? getUserInitials(user.email) : 'U'}
              </div>
              <span className="hidden sm:inline text-sm font-medium">
                {user?.email?.split('@')[0] || 'User'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopBar;
