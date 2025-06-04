
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TopToolbar from '@/components/TopToolbar';
import Sidebar from '@/components/dashboard/Sidebar';
import SentCampaignsView from '@/components/campaigns/SentCampaignsView';
import ScheduledCampaignsView from '@/components/campaigns/ScheduledCampaignsView';
import UnderReviewCampaignsView from '@/components/campaigns/UnderReviewCampaignsView';
import CampaignCalendarView from '@/components/campaigns/CampaignCalendarView';

const CampaignsPage: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-[70px]' : 'ml-[240px]'}`}>
        <TopToolbar />
        <div className="p-8">
          <Tabs defaultValue="sent" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="under-review">Under Review</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>

            <TabsContent value="sent">
              <SentCampaignsView />
            </TabsContent>

            <TabsContent value="scheduled">
              <ScheduledCampaignsView />
            </TabsContent>

            <TabsContent value="under-review">
              <UnderReviewCampaignsView />
            </TabsContent>

            <TabsContent value="calendar">
              <CampaignCalendarView />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CampaignsPage;
