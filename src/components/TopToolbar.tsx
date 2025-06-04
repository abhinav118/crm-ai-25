
import { Bell, User } from "lucide-react";

const TopToolbar = () => {
  return (
    <div className="flex items-center justify-end w-full px-6 py-3 border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <Bell className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
        <User className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
      </div>
    </div>
  );
};

export default TopToolbar;
