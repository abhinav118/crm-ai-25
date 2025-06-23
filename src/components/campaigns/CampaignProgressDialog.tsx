
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TelnyxCampaign } from '@/hooks/useTelnyxCampaigns';

interface CampaignProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string | null;
  campaignName?: string;
}

export const CampaignProgressDialog: React.FC<CampaignProgressDialogProps> = ({
  isOpen,
  onClose,
  campaignId,
  campaignName
}) => {
  const [campaign, setCampaign] = useState<TelnyxCampaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!campaignId || !isOpen) return;

    // Initial fetch
    const fetchCampaign = async () => {
      const { data, error } = await supabase
        .from('telnyx_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) {
        console.error('Error fetching campaign:', error);
      } else {
        setCampaign(data);
      }
      setIsLoading(false);
    };

    fetchCampaign();

    // Set up real-time subscription
    const channel = supabase
      .channel('campaign-progress')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'telnyx_campaigns',
          filter: `id=eq.${campaignId}`
        },
        (payload) => {
          console.log('Campaign progress update:', payload);
          setCampaign(payload.new as TelnyxCampaign);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, isOpen]);

  const getStatusIcon = () => {
    if (!campaign) return <Clock className="w-5 h-5 text-gray-400" />;
    
    switch (campaign.status) {
      case 'sending':
        return <Send className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (!campaign) return 'Loading...';
    
    switch (campaign.status) {
      case 'sending':
        return 'Sending messages...';
      case 'completed':
        return 'Campaign completed successfully!';
      case 'failed':
        return 'Campaign failed';
      default:
        return 'Preparing campaign...';
    }
  };

  const getProgressColor = () => {
    if (!campaign) return '';
    
    switch (campaign.status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Campaign Progress</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Campaign Progress
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-sm text-gray-700 mb-1">Campaign Name</h3>
            <p className="text-sm">{campaignName || 'Unnamed Campaign'}</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{getStatusText()}</span>
              <span className="text-sm text-gray-500">
                {campaign?.progress_percentage || 0}%
              </span>
            </div>
            <Progress 
              value={campaign?.progress_percentage || 0} 
              className="h-2"
            />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-600">
                {campaign?.sent_count || 0}
              </div>
              <div className="text-xs text-gray-500">Sent</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-600">
                {campaign?.error_count || 0}
              </div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-600">
                {campaign?.total_count || 0}
              </div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>

          {campaign?.status === 'completed' || campaign?.status === 'failed' ? (
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          ) : (
            <div className="text-center">
              <p className="text-xs text-gray-500">
                This dialog will update automatically as messages are sent
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
