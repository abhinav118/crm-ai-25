
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

export interface AllResponsesData {
  id: string;
  sent_at: string;
  contact_name: string;
  phone: string;
  content: string;
  campaign_name?: string;
}

export interface CampaignResponsesData {
  campaign_name: string;
  contact_name: string;
  phone: string;
  sent_time: string;
  first_reply_time: string;
  message: string;
}

export interface ResponseRateData {
  campaign_name: string;
  total_recipients: number;
  unique_respondents: number;
  response_rate: number;
}

const getAllResponses = (dateRange: DateRange | undefined, page: number, pageSize: number) => {
  return useQuery({
    queryKey: ['response-reports', 'all-responses', dateRange, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('messages')
        .select(`
          id,
          sent_at,
          content,
          contacts!inner(
            first_name,
            last_name,
            phone
          )
        `)
        .eq('direction', 'inbound')
        .order('sent_at', { ascending: false });

      if (dateRange?.from) {
        query = query.gte('sent_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('sent_at', dateRange.to.toISOString());
      }

      // Get total count for pagination
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('direction', 'inbound');

      // Get paginated data
      const { data, error } = await query
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;

      const formattedData: AllResponsesData[] = (data || []).map(msg => ({
        id: msg.id,
        sent_at: msg.sent_at,
        contact_name: `${msg.contacts.first_name} ${msg.contacts.last_name || ''}`.trim(),
        phone: msg.contacts.phone || '',
        content: msg.content,
        campaign_name: undefined // TODO: Add campaign matching logic
      }));

      return { data: formattedData, totalCount: count || 0 };
    },
  });
};

const getCampaignResponses = (dateRange: DateRange | undefined, page: number, pageSize: number) => {
  return useQuery({
    queryKey: ['response-reports', 'campaign-responses', dateRange, page, pageSize],
    queryFn: async () => {
      // First, get completed campaigns within date range
      let campaignsQuery = supabase
        .from('telnyx_campaigns')
        .select('*')
        .eq('status', 'completed');

      if (dateRange?.from) {
        campaignsQuery = campaignsQuery.gte('schedule_time', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        campaignsQuery = campaignsQuery.lte('schedule_time', dateRange.to.toISOString());
      }

      const { data: campaigns, error: campaignsError } = await campaignsQuery;
      if (campaignsError) throw campaignsError;

      const responses: CampaignResponsesData[] = [];

      // For each campaign, find first replies
      for (const campaign of campaigns || []) {
        const campaignTime = campaign.schedule_time || campaign.created_at;
        if (!campaignTime) continue;

        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select(`
            *,
            contacts!inner(
              first_name,
              last_name,
              phone
            )
          `)
          .eq('direction', 'inbound')
          .gte('sent_at', campaignTime)
          .order('sent_at', { ascending: true });

        if (messagesError) continue;

        // Group by contact and get first reply
        const contactReplies = new Map();
        for (const msg of messages || []) {
          const contactId = msg.contact_id;
          if (!contactReplies.has(contactId)) {
            contactReplies.set(contactId, {
              campaign_name: campaign.campaign_name,
              contact_name: `${msg.contacts.first_name} ${msg.contacts.last_name || ''}`.trim(),
              phone: msg.contacts.phone || '',
              sent_time: campaignTime,
              first_reply_time: msg.sent_at,
              message: msg.content,
            });
          }
        }

        responses.push(...Array.from(contactReplies.values()));
      }

      // Sort by first reply time
      responses.sort((a, b) => new Date(b.first_reply_time).getTime() - new Date(a.first_reply_time).getTime());

      // Paginate
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = responses.slice(startIndex, endIndex);

      return { data: paginatedData, totalCount: responses.length };
    },
  });
};

const getResponseRateChart = (dateRange: DateRange | undefined) => {
  return useQuery({
    queryKey: ['response-reports', 'response-rate-chart', dateRange],
    queryFn: async () => {
      // Get completed campaigns within date range
      let campaignsQuery = supabase
        .from('telnyx_campaigns')
        .select('*')
        .eq('status', 'completed');

      if (dateRange?.from) {
        campaignsQuery = campaignsQuery.gte('schedule_time', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        campaignsQuery = campaignsQuery.lte('schedule_time', dateRange.to.toISOString());
      }

      const { data: campaigns, error: campaignsError } = await campaignsQuery;
      if (campaignsError) throw campaignsError;

      const chartData: ResponseRateData[] = [];

      for (const campaign of campaigns || []) {
        const totalRecipients = campaign.total_count || 0;
        
        // Skip campaigns with no recipients
        if (totalRecipients === 0) continue;
        
        // Use schedule_time or created_at as fallback
        const campaignTime = campaign.schedule_time || campaign.created_at;
        if (!campaignTime) continue;
        
        // Count unique respondents after campaign
        const { data: responses, error: responsesError } = await supabase
          .from('messages')
          .select('contact_id')
          .eq('direction', 'inbound')
          .gte('sent_at', campaignTime);

        if (responsesError) continue;

        const uniqueRespondents = new Set(responses?.map(r => r.contact_id) || []).size;
        
        // Calculate response rate with proper validation
        let responseRate = 0;
        if (totalRecipients > 0 && !isNaN(uniqueRespondents)) {
          responseRate = (uniqueRespondents / totalRecipients) * 100;
        }
        
        // Ensure response rate is a valid number
        if (isNaN(responseRate) || !isFinite(responseRate)) {
          responseRate = 0;
        }

        chartData.push({
          campaign_name: campaign.campaign_name || 'Unnamed Campaign',
          total_recipients: totalRecipients,
          unique_respondents: uniqueRespondents,
          response_rate: Math.round(responseRate * 100) / 100, // Round to 2 decimal places
        });
      }

      return chartData;
    },
  });
};

export const useResponseReports = {
  getAllResponses,
  getCampaignResponses,
  getResponseRateChart,
};
