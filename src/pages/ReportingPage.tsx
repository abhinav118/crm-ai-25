
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from '@/components/dashboard/Sidebar';
import DeliveryReports from './DeliveryReports';
import CampaignPerformance from './CampaignPerformance';
import ContactsOverview from './ContactsOverview';

const ReportingPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />
      
      <div className="flex-1 space-y-6 p-6 ml-[240px]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Reporting</h1>
            <p className="text-muted-foreground">
              Comprehensive analytics and reports for your SMS campaigns and performance
            </p>
          </div>
        </div>

        <Tabs defaultValue="delivery" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="delivery">Delivery Reports</TabsTrigger>
            <TabsTrigger value="campaign">Campaign Performance</TabsTrigger>
            <TabsTrigger value="contacts">Contacts Overview</TabsTrigger>
          </TabsList>
          
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
