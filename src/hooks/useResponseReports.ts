
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
      
      // Build date filter for campaigns
      let campaignsQuery = supabase
        .from('telnyx_campaigns')
        .select('*')
        .eq('status', 'completed');

      if (dateRange?.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setUTCHours(0, 0, 0, 0);
        campaignsQuery = campaignsQuery.gte('schedule_time', fromDate.toISOString());
      }
      if (dateRange?.to) {
        const toDate = new Date(dateRange.to);
        toDate.setUTCHours(23, 59, 59, 999);
        campaignsQuery = campaignsQuery.lte('schedule_time', toDate.toISOString());
      }

      const { data: campaigns, error: campaignsError } = await campaignsQuery;
      
      if (campaignsError) {
        console.error('Error fetching campaigns:', campaignsError);
        throw campaignsError;
      }

      if (!campaigns || campaigns.length === 0) {
        return { responses: [], chartData: [], totalCount: 0 };
      }

      const responses: ResponseReportData[] = [];
      const chartData: ResponseRateChartData[] = [];

      for (const campaign of campaigns) {
        // Use schedule_time if available, otherwise fall back to created_at
        const campaignSentTime = campaign.schedule_time || campaign.created_at;
        const recipients = campaign.recipients || [];
        
        if (recipients.length === 0) {
          // Add to chart data with 0 responses
          chartData.push({
            campaignName: campaign.campaign_name,
            totalRecipients: 0,
            uniqueRespondents: 0,
            responseRate: 0,
          });
          continue;
        }

        console.log(`Processing campaign: ${campaign.campaign_name} with ${recipients.length} recipients`);

        // Get all contacts for this campaign's recipients
        const { data: contacts, error: contactsError } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, phone')
          .in('phone', recipients);

        if (contactsError) {
          console.error('Error fetching contacts:', contactsError);
          continue;
        }

        const totalRecipients = recipients.length;
        const uniqueRespondents = new Set<string>();

        // For each contact, find their first inbound message after campaign sent time
        if (contacts && contacts.length > 0) {
          for (const contact of contacts) {
            const { data: firstReply, error: messageError } = await supabase
              .from('messages')
              .select('content, sent_at, contact_id')
              .eq('contact_id', contact.id)
              .eq('direction', 'inbound')
              .gte('sent_at', campaignSentTime)
              .order('sent_at', { ascending: true })
              .limit(1)
              .maybeSingle();

            if (messageError) {
              console.error('Error fetching messages for contact:', contact.id, messageError);
              continue;
            }

            if (firstReply) {
              uniqueRespondents.add(contact.id);
              responses.push({
                campaignName: campaign.campaign_name,
                contactName: `${contact.first_name} ${contact.last_name || ''}`.trim(),
                phone: contact.phone || '',
                sentTime: new Date(campaignSentTime).toLocaleString(),
                firstReplyTime: new Date(firstReply.sent_at).toLocaleString(),
                message: firstReply.content,
                campaignId: campaign.id,
                contactId: contact.id,
              });
            }
          }
        }

        // Also check for messages where phone matches directly (fallback for contacts not in contacts table)
        const { data: directMessages, error: directMessagesError } = await supabase
          .from('messages')
          .select(`
            content, 
            sent_at, 
            sender,
            contact_id,
            contacts!inner(first_name, last_name, phone)
          `)
          .eq('direction', 'inbound')
          .gte('sent_at', campaignSentTime)
          .in('contacts.phone', recipients);

        if (!directMessagesError && directMessages && directMessages.length > 0) {
          // Group by contact and get first message for each
          const messagesByContact = directMessages.reduce((acc, msg) => {
            const contactId = msg.contact_id;
            if (!acc[contactId] || new Date(msg.sent_at) < new Date(acc[contactId].sent_at)) {
              acc[contactId] = msg;
            }
            return acc;
          }, {} as Record<string, any>);

          // Add any new responses not already captured
          Object.values(messagesByContact).forEach((msg: any) => {
            if (!uniqueRespondents.has(msg.contact_id)) {
              uniqueRespondents.add(msg.contact_id);
              const contact = msg.contacts;
              if (!responses.find(r => r.contactId === msg.contact_id && r.campaignId === campaign.id)) {
                responses.push({
                  campaignName: campaign.campaign_name,
                  contactName: `${contact.first_name} ${contact.last_name || ''}`.trim(),
                  phone: contact.phone || '',
                  sentTime: new Date(campaignSentTime).toLocaleString(),
                  firstReplyTime: new Date(msg.sent_at).toLocaleString(),
                  message: msg.content,
                  campaignId: campaign.id,
                  contactId: msg.contact_id,
                });
              }
            }
          });
        }

        const responseRate = totalRecipients > 0 ? (uniqueRespondents.size / totalRecipients) * 100 : 0;

        chartData.push({
          campaignName: campaign.campaign_name,
          totalRecipients,
          uniqueRespondents: uniqueRespondents.size,
          responseRate: Math.round(responseRate * 100) / 100, // Round to 2 decimal places
        });

        console.log(`Campaign ${campaign.campaign_name}: ${uniqueRespondents.size}/${totalRecipients} responses (${responseRate.toFixed(2)}%)`);
      }

      // Sort responses by reply time (most recent first)
      responses.sort((a, b) => new Date(b.firstReplyTime).getTime() - new Date(a.firstReplyTime).getTime());

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const paginatedResponses = responses.slice(startIndex, startIndex + pageSize);

      console.log(`Total responses found: ${responses.length}, showing ${paginatedResponses.length} on page ${page}`);

      return {
        responses: paginatedResponses,
        chartData,
        totalCount: responses.length,
      };
    },
    refetchInterval: 30000,
  });
}
