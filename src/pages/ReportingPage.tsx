
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/dashboard/Sidebar";
import TopToolbar from "@/components/TopToolbar";
import SMSAnalytics from "@/components/analytics/SMSAnalytics";
import ConversationsAnalytics from "@/components/analytics/ConversationsAnalytics";
import LinksAnalytics from "@/components/analytics/LinksAnalytics";

const ReportingPage: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-[63px]' : 'ml-[234px]'}`}>
        <TopToolbar pageTitle="Reporting" />
        
        <div className="p-6">
          <Tabs defaultValue="sms" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="sms">SMS Analytics</TabsTrigger>
              <TabsTrigger value="conversations">Conversations</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sms">
              <SMSAnalytics />
            </TabsContent>
            
            <TabsContent value="conversations">
              <ConversationsAnalytics />
            </TabsContent>
            
            <TabsContent value="links">
              <LinksAnalytics />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ReportingPage;
