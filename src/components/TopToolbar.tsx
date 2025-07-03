
import { Bell, User, ChevronDown } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

type TopToolbarProps = {
  pageTitle?: string;
};

const TopToolbar: React.FC<TopToolbarProps> = ({ pageTitle = "Dashboard" }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // TODO: Implement actual logout logic
    console.log("Logging out...");
  };

  return (
    <div className="flex items-center justify-between w-full px-6 py-3 border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-6">
        <Bell className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
        
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md transition-colors">
            <User className="h-5 w-5 text-muted-foreground" />
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-white border shadow-lg">
            <DropdownMenuLabel className="px-4 py-3 border-b">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-gray-900">John Doe</p>
                <p className="text-xs text-gray-500">john.doe@example.com</p>
              </div>
            </DropdownMenuLabel>
            
            <div className="p-4 border-b bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Textable Number</span>
                <button 
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => navigate('/settings/numbers')}
                >
                  Manage Numbers
                </button>
              </div>
              <p className="text-sm text-gray-600">(718) 406-1667</p>
            </div>

            <div className="py-1">
              <DropdownMenuItem 
                className="cursor-pointer px-4 py-2 text-sm"
                onClick={() => navigate('/settings/profile')}
              >
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer px-4 py-2 text-sm"
                onClick={() => navigate('/settings')}
              >
                Account Settings
              </DropdownMenuItem>
            </div>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              className="cursor-pointer px-4 py-2 text-sm text-red-600 hover:text-red-700"
              onClick={handleLogout}
            >
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TopToolbar;
