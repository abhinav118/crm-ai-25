
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MessagesOverview from './MessagesOverview';
import DeliveryReports from './DeliveryReports';
import CampaignPerformance from './CampaignPerformance';
import ContactsOverview from './ContactsOverview';

const ReportingPage = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="flex-1 space-y-6 p-6 ml-[240px]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reporting</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and reports for your SMS campaigns and performance
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Messages Overview</TabsTrigger>
          <TabsTrigger value="delivery">Delivery Reports</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
          <TabsTrigger value="contacts">Contacts Overview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <MessagesOverview />
        </TabsContent>
        
        <TabsContent value="delivery" className="space-y-4">
          <DeliveryReports />
        </TabsContent>
        
        <TabsContent value="campaigns" className="space-y-4">
          <CampaignPerformance />
        </TabsContent>
        
        <TabsContent value="contacts" className="space-y-4">
          <ContactsOverview />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportingPage;
