
import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SMSCampaign } from '@/components/campaigns/SMSCampaign';
import { EmailCampaign } from '@/components/campaigns/EmailCampaign';
import Sidebar from '@/components/dashboard/Sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RestaurantMarketingAgent } from '@/components/restaurant/RestaurantMarketingAgent';

type TabValue = 'restaurant' | 'sms' | 'email';

const Campaigns: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabValue>('restaurant');
  const [brandType, setBrandType] = useState<string>("Mexican Fast Casual");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // This would be replaced with actual settings fetch from Supabase
        // For now, we'll just use a placeholder
        // const { data, error } = await supabase.from('settings').select('brand_type').single();
        // if (error) throw error;
        // setBrandType(data.brand_type);
        
        console.log("Setting brand type to Mexican Fast Casual");
        setBrandType("Mexican Fast Casual");
      } catch (error: any) {
        console.error('Error fetching settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load brand settings',
          variant: 'destructive',
        });
      }
    };

    fetchSettings();
  }, [toast]);

  return (
    <div className="flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`flex-1 p-8 transition-all duration-300 ${sidebarCollapsed ? 'ml-[70px]' : 'ml-[240px]'}`}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <div className="mt-2 text-gray-600 bg-gray-50 p-3 border border-gray-200 rounded-md inline-block">
            <span className="font-medium">Current Brand:</span> {brandType}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="restaurant">Restaurant Agent</TabsTrigger>
            <TabsTrigger value="sms">SMS Marketing</TabsTrigger>
            <TabsTrigger value="email">Email Marketing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="restaurant" className="mt-6">
            <RestaurantMarketingAgent />
          </TabsContent>
          
          <TabsContent value="sms" className="mt-6">
            <SMSCampaign />
          </TabsContent>
          
          <TabsContent value="email" className="mt-6">
            <EmailCampaign />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Campaigns;
