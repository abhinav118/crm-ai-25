
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { 
  User, 
  CreditCard, 
  Phone
} from 'lucide-react';
import TopToolbar from '@/components/TopToolbar';

const settingsNavItems = [
  { href: '/settings/plan-details', label: 'Plan Details', icon: CreditCard },
  { href: '/settings/profile', label: 'Profile', icon: User },
  { href: '/settings/numbers', label: 'Textable Numbers', icon: Phone },
];

type SettingsLayoutProps = {
  children: React.ReactNode;
};

function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      <TopToolbar pageTitle="Settings" />
      <SidebarProvider>
        <div className="flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <SidebarTrigger className="mb-4 md:hidden" />
            {children}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default SettingsLayout;
