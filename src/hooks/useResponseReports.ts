
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from "react-day-picker";

export interface ResponseReportData {
  campaignName: string;
  contactName: string;
  phone: string;
  sentTime: string;
  firstReplyTime: string;
  message: string;
  campaignId: string;
  contactId: string;
}

export interface ResponseRateChartData {
  campaignName: string;
  totalRecipients: number;
  uniqueRespondents: number;
  responseRate: number;
}

export interface ResponseReportsResult {
  responses: ResponseReportData[];
  chartData: ResponseRateChartData[];
  totalCount: number;
}

export function useResponseReports(dateRange?: DateRange, page: number = 1, pageSize: number = 25) {
  return useQuery({
    queryKey: ['response_reports', dateRange, page, pageSize],
    queryFn: async (): Promise<ResponseReportsResult> => {
      console.log('Fetching response reports with params:', { dateRange, page, pageSize });
      
      // Get completed campaigns within date range
      let campaignsQuery = supabase
        .from('telnyx_campaigns')
        .select('*')
        .eq('status', 'completed');

      if (dateRange?.from) {
        campaignsQuery = campaignsQuery.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        campaignsQuery = campaignsQuery.lte('created_at', dateRange.to.toISOString());
      }

      const { data: campaigns, error: campaignsError } = await campaignsQuery;
      
      if (campaignsError) {
        console.error('Error fetching campaigns:', campaignsError);
        throw campaignsError;
      }

      if (!campaigns || campaigns.length === 0) {
        return { responses: [], chartData: [], totalCount: 0 };
      }

      // Get responses for each campaign
      const responses: ResponseReportData[] = [];
      const chartData: ResponseRateChartData[] = [];

      for (const campaign of campaigns) {
        const campaignTime = campaign.schedule_time || campaign.created_at;
        
        // Get all contacts who received this campaign
        const { data: contacts, error: contactsError } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, phone')
          .in('phone', campaign.recipients || []);

        if (contactsError) {
          console.error('Error fetching contacts:', contactsError);
          continue;
        }

        const totalRecipients = contacts?.length || 0;
        let uniqueRespondents = 0;

        if (contacts && contacts.length > 0) {
          // Get first inbound message from each contact after campaign was sent
          for (const contact of contacts) {
            const { data: firstReply, error: messageError } = await supabase
              .from('messages')
              .select('content, sent_at')
              .eq('contact_id', contact.id)
              .eq('direction', 'inbound')
              .gte('sent_at', campaignTime)
              .order('sent_at', { ascending: true })
              .limit(1)
              .maybeSingle();

            if (messageError) {
              console.error('Error fetching messages:', messageError);
              continue;
            }

            if (firstReply) {
              uniqueRespondents++;
              responses.push({
                campaignName: campaign.campaign_name,
                contactName: `${contact.first_name} ${contact.last_name || ''}`.trim(),
                phone: contact.phone || '',
                sentTime: new Date(campaignTime).toLocaleString(),
                firstReplyTime: new Date(firstReply.sent_at).toLocaleString(),
                message: firstReply.content,
                campaignId: campaign.id,
                contactId: contact.id,
              });
            }
          }
        }

        const responseRate = totalRecipients > 0 ? (uniqueRespondents / totalRecipients) * 100 : 0;

        chartData.push({
          campaignName: campaign.campaign_name,
          totalRecipients,
          uniqueRespondents,
          responseRate: Math.round(responseRate * 100) / 100, // Round to 2 decimal places
        });
      }

      // Sort responses by reply time (most recent first)
      responses.sort((a, b) => new Date(b.firstReplyTime).getTime() - new Date(a.firstReplyTime).getTime());

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const paginatedResponses = responses.slice(startIndex, startIndex + pageSize);

      return {
        responses: paginatedResponses,
        chartData,
        totalCount: responses.length,
      };
    },
    refetchInterval: 30000,
  });
}
