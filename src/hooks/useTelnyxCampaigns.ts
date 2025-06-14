import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// TypeScript interface for campaign (based on db)
export interface TelnyxCampaign {
  id: string;
  campaign_name: string;
  message: string;
  recipients: string[];
  schedule_type: 'now' | 'later';
  schedule_time?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  media_url?: string | null;
  [key: string]: any;
}

// Query all campaigns (for calendar)
export function useAllTelnyxCampaigns() {
  return useQuery({
    queryKey: ['telnyx_campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telnyx_campaigns')
        .select('*')
        .order('schedule_time', { ascending: true });
      if (error) throw error;
      return data as TelnyxCampaign[];
    },
    refetchInterval: 30000,
  });
}

// Query scheduled campaigns (future only)
export function useScheduledTelnyxCampaigns() {
  return useQuery({
    queryKey: ['telnyx_campaigns', 'scheduled'],
    queryFn: async () => {
      const nowISO = new Date().toISOString();
      const { data, error } = await supabase
        .from('telnyx_campaigns')
        .select('*')
        .eq('schedule_type', 'later')
        .gte('schedule_time', nowISO)
        .order('schedule_time', { ascending: true });
      if (error) throw error;
      return data as TelnyxCampaign[];
    },
    refetchInterval: 30000,
  });
}

// Query sent/failed campaigns (past)
export function useSentTelnyxCampaigns() {
  return useQuery({
    queryKey: ['telnyx_campaigns', 'sent'],
    queryFn: async () => {
      const nowISO = new Date().toISOString();
      const { data, error } = await supabase
        .from('telnyx_campaigns')
        .select('*')
        .or("status.eq.sent,status.eq.failed")
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TelnyxCampaign[];
    },
    refetchInterval: 30000,
  });
}

// Query single campaign by id
export function useTelnyxCampaignById(id: string | null) {
  return useQuery({
    queryKey: ['telnyx_campaigns', 'by_id', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('telnyx_campaigns')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as TelnyxCampaign | null;
    },
    enabled: !!id,
  });
}

// Mutation for deleting a campaign
export function useDeleteTelnyxCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('telnyx_campaigns').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telnyx_campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['telnyx_campaigns', 'scheduled'] });
      queryClient.invalidateQueries({ queryKey: ['telnyx_campaigns', 'sent'] });
    }
  });
}
