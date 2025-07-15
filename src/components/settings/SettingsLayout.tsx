
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  User, 
  Phone
} from 'lucide-react';

const settingsNavItems = [
  { href: '/settings/profile', label: 'Profile', icon: User },
  { href: '/settings/numbers', label: 'Textable Numbers', icon: Phone },
];

type SettingsLayoutProps = {
  children: React.ReactNode;
};

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Settings Sidebar */}
      <aside className="h-screen fixed top-0 left-0 z-30 flex flex-col w-[234px] bg-[#0F172A] text-white">
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 text-white font-semibold text-lg">
          <div className="bg-purple-600 text-white h-8 w-8 rounded-full flex items-center justify-center font-bold">
            T
          </div>
          <span>TextFlow</span>
        </div>

        {/* Settings Navigation */}
        <div className="flex-1 px-3 space-y-2">
          <div className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
            Settings
          </div>
          {settingsNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium",
                  isActive 
                    ? "bg-indigo-600 text-white" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Back to Dashboard */}
        <div className="px-3 py-4 border-t border-slate-700">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <span>← Back to Dashboard</span>
          </Link>
        </div>
      </aside>

      {/* Settings Content */}
      <div className="flex-1 ml-[234px]">
        {children}
      </div>
    </div>
  );
};

export default SettingsLayout;
