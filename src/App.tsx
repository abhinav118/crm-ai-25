
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoginPage } from "@/components/auth/LoginPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Analytics from "./pages/Analytics";
import CampaignsPage from "./pages/CampaignsPage";
import CreateCampaignPage from "./pages/CreateCampaignPage";
import AiCrm from "./pages/AiCrm";
import ReportingPage from "./pages/ReportingPage";
import Settings from "./pages/Settings";
import Inbox from "./pages/Inbox";
import Footer from "./components/layout/Footer";

// Configure QueryClient with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
      }
    }
  }
});

// Protected Route wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  console.log('ProtectedRoute: isAuthenticated:', isAuthenticated, 'loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Login Route wrapper - redirects to dashboard if already authenticated
const LoginRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  console.log('LoginRoute: isAuthenticated:', isAuthenticated, 'loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    console.log('LoginRoute: User already authenticated, redirecting to dashboard');
    return <Navigate to="/" replace />;
  }

  return <LoginPage />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <div className="min-h-screen w-full flex flex-col">
            <div className="flex-1">
              <Routes>
                <Route path="/login" element={<LoginRoute />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                <Route path="/contacts" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                <Route path="/conversations" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                <Route path="/inbox" element={
                  <ProtectedRoute>
                    <Inbox />
                  </ProtectedRoute>
                } />
                <Route path="/campaigns" element={
                  <ProtectedRoute>
                    <CampaignsPage />
                  </ProtectedRoute>
                } />
                <Route path="/campaigns/create" element={
                  <ProtectedRoute>
                    <CreateCampaignPage />
                  </ProtectedRoute>
                } />
                <Route path="/reporting" element={
                  <ProtectedRoute>
                    <ReportingPage />
                  </ProtectedRoute>
                } />
                <Route path="/reporting/messages-overview" element={
                  <ProtectedRoute>
                    <ReportingPage />
                  </ProtectedRoute>
                } />
                <Route path="/reporting/delivery-reports" element={
                  <ProtectedRoute>
                    <ReportingPage />
                  </ProtectedRoute>
                } />
                <Route path="/reporting/contacts-overview" element={
                  <ProtectedRoute>
                    <ReportingPage />
                  </ProtectedRoute>
                } />
                <Route path="/reporting/conversations" element={
                  <ProtectedRoute>
                    <ReportingPage />
                  </ProtectedRoute>
                } />
                <Route path="/settings/*" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </div>
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
