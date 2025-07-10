
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CustomAuthProvider } from "@/contexts/CustomAuthContext";
import CustomProtectedRoute from "@/components/auth/CustomProtectedRoute";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Analytics from "./pages/Analytics";
import Campaigns from "./pages/Campaigns";
import CampaignsPage from "./pages/CampaignsPage";
import CreateCampaignPage from "./pages/CreateCampaignPage";
import CampaignPerformance from "./pages/CampaignPerformance";
import Inbox from "./pages/Inbox";
import Settings from "./pages/Settings";
import SettingsProfile from "./pages/SettingsProfile";
import SettingsNumbers from "./pages/SettingsNumbers";
import SettingsPlanDetails from "./pages/SettingsPlanDetails";
import ContactsOverview from "./pages/ContactsOverview";
import MessagesOverview from "./pages/MessagesOverview";
import DeliveryReports from "./pages/DeliveryReports";
import ResponseReports from "./pages/ResponseReports";
import ReportingPage from "./pages/ReportingPage";
import AiCrm from "./pages/AiCrm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CustomAuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/contacts" element={
              <CustomProtectedRoute>
                <Index />
              </CustomProtectedRoute>
            } />
            <Route path="/analytics" element={
              <CustomProtectedRoute>
                <Analytics />
              </CustomProtectedRoute>
            } />
            <Route path="/campaigns" element={
              <CustomProtectedRoute>
                <Campaigns />
              </CustomProtectedRoute>
            } />
            <Route path="/campaigns-page" element={
              <CustomProtectedRoute>
                <CampaignsPage />
              </CustomProtectedRoute>
            } />
            <Route path="/create-campaign" element={
              <CustomProtectedRoute>
                <CreateCampaignPage />
              </CustomProtectedRoute>
            } />
            <Route path="/campaign-performance" element={
              <CustomProtectedRoute>
                <CampaignPerformance />
              </CustomProtectedRoute>
            } />
            <Route path="/inbox" element={
              <CustomProtectedRoute>
                <Inbox />
              </CustomProtectedRoute>
            } />
            <Route path="/settings" element={
              <CustomProtectedRoute>
                <Settings />
              </CustomProtectedRoute>
            } />
            <Route path="/settings/profile" element={
              <CustomProtectedRoute>
                <SettingsProfile />
              </CustomProtectedRoute>
            } />
            <Route path="/settings/numbers" element={
              <CustomProtectedRoute>
                <SettingsNumbers />
              </CustomProtectedRoute>
            } />
            <Route path="/settings/plan-details" element={
              <CustomProtectedRoute>
                <SettingsPlanDetails />
              </CustomProtectedRoute>
            } />
            <Route path="/contacts-overview" element={
              <CustomProtectedRoute>
                <ContactsOverview />
              </CustomProtectedRoute>
            } />
            <Route path="/messages-overview" element={
              <CustomProtectedRoute>
                <MessagesOverview />
              </CustomProtectedRoute>
            } />
            <Route path="/delivery-reports" element={
              <CustomProtectedRoute>
                <DeliveryReports />
              </CustomProtectedRoute>
            } />
            <Route path="/response-reports" element={
              <CustomProtectedRoute>
                <ResponseReports />
              </CustomProtectedRoute>
            } />
            <Route path="/reporting" element={
              <CustomProtectedRoute>
                <ReportingPage />
              </CustomProtectedRoute>
            } />
            <Route path="/ai-crm" element={
              <CustomProtectedRoute>
                <AiCrm />
              </CustomProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/contacts" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CustomAuthProvider>
  </QueryClientProvider>
);

export default App;
