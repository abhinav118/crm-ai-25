
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getFullName } from '@/utils/contactHelpers';

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
}

export const useDeliveryReportMetrics = () => {
  return useQuery({
    queryKey: ['delivery-metrics'],
    queryFn: async (): Promise<DeliveryMetrics> => {
      // For now, we'll return mock data since we don't have a delivery reports table
      // In a real app, you would fetch from your SMS delivery tracking table
      
      // Fetch some contacts to show in recent activity
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, phone')
        .limit(5);

      if (error) {
        console.error('Error fetching contacts for delivery metrics:', error);
        throw error;
      }

      // Mock delivery data
      const mockMetrics: DeliveryMetrics = {
        totalSent: 1250,
        delivered: 1180,
        failed: 35,
        pending: 35,
        deliveryRate: 94.4,
        recentActivity: (contacts || []).map(contact => ({
          id: contact.id,
          contact: getFullName(contact),
          phone: contact.phone || 'No phone',
          status: Math.random() > 0.1 ? 'delivered' : 'failed',
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
        }))
      };

      return mockMetrics;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
