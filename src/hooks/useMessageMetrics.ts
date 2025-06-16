
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface MessageMetrics {
  total_sent: number;
  delivered_count: number;
  bounced_count: number;
  not_sent_count: number;
  clicked_count: number;
  replied_count: number;
  opt_out_count: number;
  time_series: Array<{
    date: string;
    delivered: number;
    bounced: number;
    not_sent: number;
  }>;
}

export function useMessageMetrics(dateRange: DateRange | undefined) {
  return useQuery({
    queryKey: ['message-metrics', dateRange],
    queryFn: async (): Promise<MessageMetrics> => {
      console.log('Fetching message metrics from Supabase');
      
      const startDate = dateRange?.from ? startOfDay(dateRange.from) : new Date('2024-01-01');
      const endDate = dateRange?.to ? endOfDay(dateRange.to) : new Date();

      // Fetch sent campaigns in date range
      const { data: campaigns, error: campaignsError } = await supabase
        .from('telnyx_campaigns')
        .select('*')
        .eq('status', 'sent')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (campaignsError) {
        console.error('Error fetching campaigns:', campaignsError);
        throw campaignsError;
      }

      // Fetch SMS analytics for clicks
      const { data: analytics, error: analyticsError } = await supabase
        .from('sms_analytics')
        .select('clicks, last_clicked');

      if (analyticsError) {
        console.error('Error fetching analytics:', analyticsError);
        throw analyticsError;
      }

      // Fetch inbound messages (replies) in date range
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('sender', 'contact')
        .gte('sent_at', startDate.toISOString())
        .lte('sent_at', endDate.toISOString());

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        throw messagesError;
      }

      console.log('Raw data:', { campaigns, analytics, messages });

      // Calculate metrics
      const totalSent = campaigns?.reduce((sum, campaign) => {
        return sum + (campaign.recipients?.length || 0);
      }, 0) || 0;

      // Estimate delivery rate at 95% (industry standard)
      const deliveredCount = Math.round(totalSent * 0.95);
      const bouncedCount = totalSent - deliveredCount;

      // Calculate clicks from analytics
      const clickedCount = analytics?.reduce((sum, item) => sum + (item.clicks || 0), 0) || 0;

      // Count replies
      const repliedCount = messages?.length || 0;

      // Estimate opt-outs (typically 1-2% of delivered)
      const optOutCount = Math.round(deliveredCount * 0.015);

      // Generate time series data
      const timeSeriesMap = new Map<string, { delivered: number; bounced: number; not_sent: number }>();
      
      campaigns?.forEach(campaign => {
        const date = format(new Date(campaign.created_at), 'yyyy-MM-dd');
        const recipientCount = campaign.recipients?.length || 0;
        const delivered = Math.round(recipientCount * 0.95);
        const bounced = recipientCount - delivered;
        
        if (timeSeriesMap.has(date)) {
          const existing = timeSeriesMap.get(date)!;
          timeSeriesMap.set(date, {
            delivered: existing.delivered + delivered,
            bounced: existing.bounced + bounced,
            not_sent: existing.not_sent
          });
        } else {
          timeSeriesMap.set(date, {
            delivered,
            bounced,
            not_sent: 0
          });
        }
      });

      const timeSeries = Array.from(timeSeriesMap.entries()).map(([date, data]) => ({
        date,
        ...data
      })).sort((a, b) => a.date.localeCompare(b.date));

      const metrics: MessageMetrics = {
        total_sent: totalSent,
        delivered_count: deliveredCount,
        bounced_count: bouncedCount,
        not_sent_count: 0, // We don't track this currently
        clicked_count: clickedCount,
        replied_count: repliedCount,
        opt_out_count: optOutCount,
        time_series: timeSeries
      };

      console.log('Calculated metrics:', metrics);
      return metrics;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}
