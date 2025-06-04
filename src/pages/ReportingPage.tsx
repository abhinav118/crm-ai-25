
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from '@/components/dashboard/Sidebar';
import DeliveryReports from './DeliveryReports';
import CampaignPerformance from './CampaignPerformance';
import ContactsOverview from './ContactsOverview';
import MessagesOverview from './MessagesOverview';

const ReportingPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />
      
      <div className="flex-1 space-y-6 p-4 sm:p-6 ml-0 sm:ml-[240px]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Reporting</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Comprehensive analytics and reports for your SMS campaigns and performance
            </p>
          </div>
        </div>

        <Tabs defaultValue="messages" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="messages" className="text-xs sm:text-sm">Messages Overview</TabsTrigger>
            <TabsTrigger value="delivery" className="text-xs sm:text-sm">Delivery Reports</TabsTrigger>
            <TabsTrigger value="campaign" className="text-xs sm:text-sm">Campaign Performance</TabsTrigger>
            <TabsTrigger value="contacts" className="text-xs sm:text-sm">Contacts Overview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="messages" className="space-y-4">
            <MessagesOverview />
          </TabsContent>
          
          <TabsContent value="delivery" className="space-y-4">
            <DeliveryReports />
          </TabsContent>
          
          <TabsContent value="campaign" className="space-y-4">
            <CampaignPerformance />
          </TabsContent>
          
          <TabsContent value="contacts" className="space-y-4">
            <ContactsOverview />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReportingPage;
