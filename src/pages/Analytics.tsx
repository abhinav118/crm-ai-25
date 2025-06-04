
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TopToolbar from '@/components/TopToolbar';
import Sidebar from '@/components/dashboard/Sidebar';
import { LinksAnalytics } from '@/components/analytics/LinksAnalytics';
import { SMSAnalytics } from '@/components/analytics/SMSAnalytics';
import { ConversationsAnalytics } from '@/components/analytics/ConversationsAnalytics';

const Analytics = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-[70px]' : 'ml-[240px]'}`}>
        <TopToolbar />
        <div className="p-6 h-full overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Track performance metrics across your platform</p>
          </div>
          
          <Tabs defaultValue="links" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="conversations">Conversations</TabsTrigger>
              <TabsTrigger value="traffic">Traffic</TabsTrigger>
              <TabsTrigger value="conversions">Conversions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="links">
              <LinksAnalytics />
            </TabsContent>
            
            <TabsContent value="sms">
              <SMSAnalytics />
            </TabsContent>
            
            <TabsContent value="conversations">
              <ConversationsAnalytics />
            </TabsContent>
            
            <TabsContent value="traffic">
              <div className="p-8 text-center text-muted-foreground">
                Traffic analytics will be available soon
              </div>
            </TabsContent>
            
            <TabsContent value="conversions">
              <div className="p-8 text-center text-muted-foreground">
                Conversion analytics will be available soon
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
