
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/dashboard/Sidebar";
import TopToolbar from "@/components/TopToolbar";
import ScheduledCampaignsView from "@/components/campaigns/ScheduledCampaignsView";
import SentCampaignsView from "@/components/campaigns/SentCampaignsView";
import UnderReviewCampaignsView from "@/components/campaigns/UnderReviewCampaignsView";

const CampaignsPage: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-[63px]' : 'ml-[234px]'}`}>
        <TopToolbar pageTitle="Campaigns" />
        
        <div className="p-6">
          <Tabs defaultValue="scheduled" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="under-review">Under Review</TabsTrigger>
            </TabsList>
            
            <TabsContent value="scheduled">
              <ScheduledCampaignsView />
            </TabsContent>
            
            <TabsContent value="sent">
              <SentCampaignsView />
            </TabsContent>
            
            <TabsContent value="under-review">
              <UnderReviewCampaignsView />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CampaignsPage;
