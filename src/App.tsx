
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CreateCampaignPage from "./pages/CreateCampaignPage";
import CampaignsPage from "./pages/CampaignsPage";
import ReportingPage from "./pages/ReportingPage";
import Settings from "./pages/Settings";
import SettingsLayout from "./components/settings/SettingsLayout";
import NotFound from "./pages/NotFound";
import Inbox from "./pages/Inbox";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/create-campaign" element={<CreateCampaignPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/reporting" element={<ReportingPage />} />
          <Route path="/settings" element={<SettingsLayout><Settings /></SettingsLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
