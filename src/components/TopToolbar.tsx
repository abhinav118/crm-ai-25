
import { Bell, User } from "lucide-react";

type TopToolbarProps = {
  pageTitle?: string;
};

const TopToolbar: React.FC<TopToolbarProps> = ({ pageTitle = "Dashboard" }) => {
  return (
    <div className="flex items-center justify-between w-full px-6 py-3 border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-6">
        <Bell className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
        <User className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
      </div>
    </div>
  );
};

export default TopToolbar;
