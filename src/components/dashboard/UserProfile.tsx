
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useAuthContext } from "@/contexts/CustomAuthContext";
import { useNavigate } from "react-router-dom";

const UserProfile = () => {
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="flex items-center space-x-3 p-4 border-t border-gray-200">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {user?.login_email || "User"}
        </p>
        <p className="text-xs text-gray-500">
          TextFlow CRM User
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="flex-shrink-0"
      >
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default UserProfile;
