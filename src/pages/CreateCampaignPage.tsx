
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/dashboard/Sidebar";
import TopToolbar from "@/components/TopToolbar";
import SMSCampaign from "@/components/campaigns/SMSCampaign";
import EmailCampaign from "@/components/campaigns/EmailCampaign";

const CreateCampaignPage: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-[63px]' : 'ml-[234px]'}`}>
        <TopToolbar pageTitle="Create Campaign" />
        
        <div className="p-6">
          <Tabs defaultValue="sms" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 max-w-md">
              <TabsTrigger value="sms">SMS Campaign</TabsTrigger>
              <TabsTrigger value="email">Email Campaign</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sms">
              <SMSCampaign />
            </TabsContent>
            
            <TabsContent value="email">
              <EmailCampaign />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignPage;
