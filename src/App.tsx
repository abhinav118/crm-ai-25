
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Analytics from "./pages/Analytics";
import CampaignsPage from "./pages/CampaignsPage";
import CreateCampaignPage from "./pages/CreateCampaignPage";
import AiCrm from "./pages/AiCrm";
import ReportingPage from "./pages/ReportingPage";
import Settings from "./pages/Settings";
import Inbox from "./pages/Inbox";
import Footer from "./components/layout/Footer";
import { AuthProvider } from "./components/auth/AuthProvider";
import ProtectedRoute from "./components/auth/ProtectedRoute";

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

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <div className="min-h-screen w-full flex flex-col">
              <div className="flex-1">
                <Routes>
                  <Route path="/auth" element={<Auth />} />
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
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
