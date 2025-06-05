
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  User, 
  CreditCard, 
  Bell, 
  Key, 
  Users, 
  Phone,
  Receipt
} from 'lucide-react';

const settingsNavItems = [
  { href: '/settings/plan-details', label: 'Plan Details', icon: CreditCard },
  { href: '/settings/billing', label: 'Billing', icon: Receipt },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings/profile', label: 'Profile', icon: User },
  { href: '/settings/api', label: 'API', icon: Key },
  { href: '/settings/teammates', label: 'Teammates', icon: Users },
  { href: '/settings/textable-numbers', label: 'Textable Numbers', icon: Phone },
];

type SettingsLayoutProps = {
  children: React.ReactNode;
};

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Settings Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Account</h2>
            <nav className="space-y-1">
              {settingsNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive 
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
