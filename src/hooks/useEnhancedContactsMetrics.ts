import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay, subMonths, subDays, subWeeks } from "date-fns";
import { DateRange } from "react-day-picker";

interface EnhancedContactsMetrics {
  total_contacts: number;
  active_contacts: number;
  new_contacts: number;
  churn_rate: number;
  growth_data: Array<{
    month: string;
    total: number;
    active: number;
    new: number;
  }>;
  segment_data: Array<{
    name: string;
    value: number;
    color: string;
    engagement: string;
  }>;
  segment_performance: Array<{
    segment: string;
    contacts: number;
    growth: string;
    engagement: string;
    avgValue: string;
    retention: string;
    campaigns_sent: number;
    response_rate: string;
    last_campaign: string;
  }>;
}

interface Contact {
  id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface ContactsSegment {
  segment_name: string;
  contacts_membership: Contact[];
  updated_at: string;
}

// Helper function to safely parse JSONB contacts_membership
const safelyParseContacts = (contactsMembership: any): Contact[] => {
  if (!contactsMembership || !Array.isArray(contactsMembership)) {
    return [];
  }

  return contactsMembership
    .filter((contact: any) => {
      return contact && typeof contact === "object" && contact.id && contact.first_name;
    })
    .map((contact: any) => ({
      id: contact.id,
      first_name: contact.first_name,
      last_name: contact.last_name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      company: contact.company || "",
      status: contact.status || "active",
      tags: Array.isArray(contact.tags) ? contact.tags : [],
      created_at: contact.created_at || new Date().toISOString(),
      updated_at: contact.updated_at || new Date().toISOString(),
    }));
};

export function useEnhancedContactsMetrics(dateRange: DateRange | undefined) {
  return useQuery({
    queryKey: ["enhanced-contacts-metrics", dateRange],
    queryFn: async (): Promise<EnhancedContactsMetrics> => {
      console.log("Fetching enhanced contacts metrics from Supabase");

      const startDate = dateRange?.from ? startOfDay(dateRange.from) : subMonths(new Date(), 6);
      const endDate = dateRange?.to ? endOfDay(dateRange.to) : new Date();

      // Fetch all contacts
      const { data: allContacts, error: contactsError } = await supabase.from("contacts").select("*");

      if (contactsError) {
        console.error("Error fetching contacts:", contactsError);
        throw contactsError;
      }

      // Fetch contact segments
      const { data: segments, error: segmentsError } = await supabase.from("contacts_segments").select("*");

      if (segmentsError) {
        console.error("Error fetching lol segments: lol", segmentsError);
        throw segmentsError;
      }

      // Fetch campaigns data
      const { data: campaigns, error: campaignsError } = await supabase
        .from("telnyx_campaigns")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (campaignsError) {
        console.error("Error fetching campaigns:", campaignsError);
        throw campaignsError;
      }

      // Fetch contact logs for engagement metrics
      const { data: contactLogs, error: logsError } = await supabase
        .from("contact_logs")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (logsError) {
        console.error("Error fetching contact logs:", logsError);
        throw logsError;
      }

      // Fetch messages for activity tracking
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("contact_id, sent_at")
        .gte("sent_at", startDate.toISOString())
        .lte("sent_at", endDate.toISOString());

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        throw messagesError;
      }

      console.log("Raw data:", { allContacts, segments, campaigns, contactLogs, messages });

      // Calculate basic metrics
      const totalContacts = allContacts?.length || 0;

      // Active contacts (those with recent activity or messages)
      const activeContactIds = new Set(messages?.map((m) => m.contact_id) || []);
      const recentContacts =
        allContacts?.filter((contact) => {
          const createdDate = new Date(contact.created_at);
          const isRecent = createdDate >= subDays(new Date(), 30);
          return activeContactIds.has(contact.id) || isRecent;
        }) || [];
      const activeContacts = recentContacts.length;

      // New contacts in the date range
      const newContacts =
        allContacts?.filter((contact) => {
          const createdDate = new Date(contact.created_at);
          return createdDate >= startDate && createdDate <= endDate;
        }) || [];

      // Calculate churn rate based on inactive contacts
      const inactiveContacts =
        allContacts?.filter((contact) => contact.status === "inactive" || contact.status === "opted_out") || [];
      const churnRate = totalContacts > 0 ? (inactiveContacts.length / totalContacts) * 100 : 0;

      // Generate growth data for the last 6 months
      const growthData = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

        const monthContacts =
          allContacts?.filter((contact) => {
            const createdDate = new Date(contact.created_at);
            return createdDate <= monthEnd;
          }) || [];

        const monthNewContacts =
          allContacts?.filter((contact) => {
            const createdDate = new Date(contact.created_at);
            return createdDate >= monthStart && createdDate <= monthEnd;
          }) || [];

        const monthActiveContacts = Math.round(monthContacts.length * 0.77); // Estimate active percentage

        growthData.push({
          month: format(monthDate, "MMM"),
          total: monthContacts.length,
          active: monthActiveContacts,
          new: monthNewContacts.length,
        });
      }

      // Calculate real segment performance
      const segmentPerformance = [];

      if (segments && segments.length > 0) {
        for (const segment of segments) {
          // Use the helper function to safely parse contacts_membership
          const segmentContacts = safelyParseContacts(segment.contacts_membership);
          const segmentName = segment.segment_name;

          // Calculate growth rate for this segment
          const previousPeriodStart = subWeeks(startDate, 2);
          const previousPeriodEnd = startDate;

          const currentPeriodContacts = segmentContacts.filter((contact: Contact) => {
            const createdDate = new Date(contact.created_at);
            return createdDate >= startDate && createdDate <= endDate;
          });

          const previousPeriodContacts = segmentContacts.filter((contact: Contact) => {
            const createdDate = new Date(contact.created_at);
            return createdDate >= previousPeriodStart && createdDate < previousPeriodEnd;
          });

          const growthRate =
            previousPeriodContacts.length > 0
              ? ((currentPeriodContacts.length - previousPeriodContacts.length) / previousPeriodContacts.length) * 100
              : currentPeriodContacts.length > 0
                ? 100
                : 0;

          // Calculate campaigns sent for this segment
          const segmentCampaigns = campaigns?.filter((campaign) => campaign.segment_name === segmentName) || [];

          const campaignsSent = segmentCampaigns.reduce((sum, campaign) => sum + (campaign.sent_count || 0), 0);

          // Calculate response rate from contact logs
          const segmentContactIds = segmentContacts.map((contact: Contact) => contact.id);
          const segmentResponses =
            contactLogs?.filter(
              (log) =>
                log.action === "message_received" &&
                log.contact_info &&
                typeof log.contact_info === "object" &&
                "id" in log.contact_info &&
                segmentContactIds.includes(log.contact_info.id as string),
            ) || [];

          const responseRate = campaignsSent > 0 ? ((segmentResponses.length / campaignsSent) * 100).toFixed(1) : "0.0";

          // Find last campaign date
          const lastCampaign =
            segmentCampaigns.length > 0
              ? format(
                  new Date(Math.max(...segmentCampaigns.map((c) => new Date(c.created_at).getTime()))),
                  "MMM dd, yyyy",
                )
              : "No campaigns";

          // Calculate engagement rate
          const engagementRate =
            segmentContacts.length > 0 ? ((segmentResponses.length / segmentContacts.length) * 100).toFixed(0) : "0";

          // Calculate retention rate (contacts still active)
          const activeSegmentContacts = segmentContacts.filter((contact: Contact) => contact.status === "active");
          const retentionRate =
            segmentContacts.length > 0
              ? ((activeSegmentContacts.length / segmentContacts.length) * 100).toFixed(0)
              : "0";

          // Calculate average value (estimated from campaign performance)
          const avgValue =
            campaignsSent > 0 && segmentResponses.length > 0
              ? `$${Math.round(segmentResponses.length * 2.5)}` // Rough estimate
              : "$0";

          segmentPerformance.push({
            segment: segmentName,
            contacts: segmentContacts.length,
            growth: `${growthRate > 0 ? "+" : ""}${growthRate.toFixed(0)}%`,
            engagement: `${engagementRate}%`,
            avgValue,
            retention: `${retentionRate}%`,
            campaigns_sent: campaignsSent,
            response_rate: `${responseRate}%`,
            last_campaign: lastCampaign,
          });
        }
      }

      // Create segment data based on real segments
      const segmentData =
        segments?.map((segment, index) => {
          const colors = ["#f59e0b", "#3b82f6", "#22c55e", "#ef4444", "#8b5cf6"];
          const segmentContacts = safelyParseContacts(segment.contacts_membership);

          // Calculate engagement based on contact logs
          const segmentContactIds = segmentContacts.map((contact: Contact) => contact.id);
          const segmentLogs =
            contactLogs?.filter(
              (log) =>
                log.contact_info &&
                typeof log.contact_info === "object" &&
                "id" in log.contact_info &&
                segmentContactIds.includes(log.contact_info.id as string),
            ) || [];

          const engagementRate =
            segmentContacts.length > 0 ? Math.round((segmentLogs.length / segmentContacts.length) * 100) : 0;

          return {
            name: segment.segment_name,
            value: segmentContacts.length,
            color: colors[index % colors.length],
            engagement: `${engagementRate}%`,
          };
        }) || [];

      const metrics: EnhancedContactsMetrics = {
        total_contacts: totalContacts,
        active_contacts: activeContacts,
        new_contacts: newContacts.length,
        churn_rate: churnRate,
        growth_data: growthData,
        segment_data: segmentData,
        segment_performance: segmentPerformance,
      };

      console.log("Calculated enhanced contacts metrics:", metrics);
      return metrics;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
}
