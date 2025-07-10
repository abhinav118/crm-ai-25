
import React from "react";
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
import { CustomAuthProvider } from "./components/auth/CustomAuthProvider";
import CustomProtectedRoute from "./components/auth/CustomProtectedRoute";

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
          <CustomAuthProvider>
            <div className="min-h-screen w-full flex flex-col">
              <div className="flex-1">
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={
                    <CustomProtectedRoute>
                      <Index />
                    </CustomProtectedRoute>
                  } />
                  <Route path="/contacts" element={
                    <CustomProtectedRoute>
                      <Index />
                    </CustomProtectedRoute>
                  } />
                  <Route path="/conversations" element={
                    <CustomProtectedRoute>
                      <Index />
                    </CustomProtectedRoute>
                  } />
                  <Route path="/inbox" element={
                    <CustomProtectedRoute>
                      <Inbox />
                    </CustomProtectedRoute>
                  } />
                  <Route path="/campaigns" element={
                    <CustomProtectedRoute>
                      <CampaignsPage />
                    </CustomProtectedRoute>
                  } />
                  <Route path="/campaigns/create" element={
                    <CustomProtectedRoute>
                      <CreateCampaignPage />
                    </CustomProtectedRoute>
                  } />
                  <Route path="/reporting" element={
                    <CustomProtectedRoute>
                      <ReportingPage />
                    </CustomProtectedRoute>
                  } />
                  <Route path="/reporting/messages-overview" element={
                    <CustomProtectedRoute>
                      <ReportingPage />
                    </CustomProtectedRoute>
                  } />
                  <Route path="/reporting/delivery-reports" element={
                    <CustomProtectedRoute>
                      <ReportingPage />
                    </CustomProtectedRoute>
                  } />
                  <Route path="/reporting/contacts-overview" element={
                    <CustomProtectedRoute>
                      <ReportingPage />
                    </CustomProtectedRoute>
                  } />
                  <Route path="/reporting/conversations" element={
                    <CustomProtectedRoute>
                      <ReportingPage />
                    </CustomProtectedRoute>
                  } />
                  <Route path="/settings/*" element={
                    <CustomProtectedRoute>
                      <Settings />
                    </CustomProtectedRoute>
                  } />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <Footer />
            </div>
            <Toaster />
            <Sonner />
          </CustomAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
