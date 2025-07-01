
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getFullName } from '@/utils/contactHelpers';
import { format, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface DeliveryMetrics {
  totalSent: number;
  delivered: number;
  failed: number;
  pending: number;
  deliveryRate: number;
  recentActivity: Array<{
    id: string;
    contact: string;
    phone: string;
    status: string;
    timestamp: string;
  }>;
  campaignData: Array<{
    campaignName: string;
    totalSent: number;
    delivered: number;
    failed: number;
    pending: number;
    deliveryRate: number;
    sentDate: string;
    status: string;
  }>;
}

export const useDeliveryReportMetrics = (dateRange?: DateRange) => {
  return useQuery({
    queryKey: ['delivery-metrics', dateRange],
    queryFn: async (): Promise<DeliveryMetrics> => {
      console.log('Fetching delivery metrics from real data');
      
      const startDate = dateRange?.from ? startOfDay(dateRange.from) : new Date('2024-01-01');
      const endDate = dateRange?.to ? endOfDay(dateRange.to) : new Date();

      // Fetch campaigns within date range
      const { data: campaigns, error: campaignsError } = await supabase
        .from('telnyx_campaigns')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (campaignsError) {
        console.error('Error fetching campaigns:', campaignsError);
        throw campaignsError;
      }

      // Fetch recent delivered messages from messages table
      const { data: recentMessages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sent_at,
          contact_id,
          contacts!inner(first_name, last_name, phone)
        `)
        .eq('sender', 'user')
        .order('sent_at', { ascending: false })
        .limit(10);

      if (messagesError) {
        console.error('Error fetching recent messages:', messagesError);
        throw messagesError;
      }

      console.log('Real campaign data:', campaigns);
      console.log('Recent delivered messages:', recentMessages);

      // Calculate metrics from real campaign data
      let totalSent = 0;
      let delivered = 0;
      let failed = 0;
      let pending = 0;

      const campaignData = (campaigns || []).map(campaign => {
        const sentCount = campaign.sent_count || 0;
        const errorCount = campaign.error_count || 0;
        const totalCount = campaign.total_count || campaign.recipients?.length || 0;
        
        totalSent += totalCount;
        
        if (campaign.status === 'completed' || campaign.status === 'sent') {
          delivered += sentCount;
          failed += errorCount;
        } else if (campaign.status === 'sending' || campaign.status === 'pending') {
          pending += totalCount - sentCount - errorCount;
          delivered += sentCount;
          failed += errorCount;
        } else {
          pending += totalCount;
        }

        const campaignDelivered = campaign.status === 'completed' ? sentCount : Math.max(0, sentCount);
        const campaignFailed = errorCount;
        const campaignPending = Math.max(0, totalCount - campaignDelivered - campaignFailed);
        const deliveryRate = totalCount > 0 ? ((campaignDelivered / totalCount) * 100) : 0;

        return {
          campaignName: campaign.campaign_name,
          totalSent: totalCount,
          delivered: campaignDelivered,
          failed: campaignFailed,
          pending: campaignPending,
          deliveryRate: Math.round(deliveryRate * 10) / 10,
          sentDate: format(new Date(campaign.created_at), 'MMM d, yyyy, h:mm a'),
          status: campaign.status
        };
      });

      const overallDeliveryRate = totalSent > 0 ? ((delivered / totalSent) * 100) : 0;

      // Format recent activity from real delivered messages
      const recentActivity = (recentMessages || []).map(message => ({
        id: message.id,
        contact: getFullName(message.contacts),
        phone: message.contacts.phone || 'No phone',
        status: 'delivered',
        timestamp: new Date(message.sent_at).toISOString()
      }));

      const metrics: DeliveryMetrics = {
        totalSent,
        delivered,
        failed,
        pending,
        deliveryRate: Math.round(overallDeliveryRate * 10) / 10,
        recentActivity,
        campaignData
      };

      console.log('Calculated delivery metrics:', metrics);
      return metrics;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
};
