
import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/CustomAuthContext";
import { Loader2 } from "lucide-react";

interface CustomProtectedRouteProps {
  children: React.ReactNode;
}

const CustomProtectedRoute = ({ children }: CustomProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default CustomProtectedRoute;
