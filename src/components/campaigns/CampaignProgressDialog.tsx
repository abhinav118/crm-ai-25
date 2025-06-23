
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { useTelnyxCampaignById } from '@/hooks/useTelnyxCampaigns';

interface CampaignProgressDialogProps {
  campaignId: string;
  open: boolean;
  onClose: () => void;
}

type TelnyxCampaign = {
  id: string;
  campaign_name: string;
  message: string;
  recipients: string[];
  schedule_type: 'now' | 'later';
  schedule_time?: string;
  repeat_frequency?: string;
  repeat_days?: string[];
  status: string;
  media_url?: string;
  total_count: number;
  sent_count: number;
  error_count: number;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  segment_name?: string;
};

const CampaignProgressDialog: React.FC<CampaignProgressDialogProps> = ({
  campaignId,
  open,
  onClose
}) => {
  const { data: campaign, isLoading, error } = useTelnyxCampaignById(campaignId);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !campaign) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Error Loading Campaign
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-gray-600">Failed to load campaign details.</p>
            <Button onClick={onClose} className="mt-4 w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isCompleted = campaign.status === 'completed' || campaign.status === 'sent';
  const isFailed = campaign.status === 'failed';
  const progressPercentage = campaign.progress_percentage || 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Campaign Progress</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 p-4">
          <div>
            <h3 className="font-medium text-gray-900">{campaign.campaign_name}</h3>
            <p className="text-sm text-gray-500 mt-1">{campaign.message}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total:</span>
              <span className="ml-2 font-medium">{campaign.total_count}</span>
            </div>
            <div>
              <span className="text-gray-500">Sent:</span>
              <span className="ml-2 font-medium text-green-600">{campaign.sent_count}</span>
            </div>
            <div>
              <span className="text-gray-500">Failed:</span>
              <span className="ml-2 font-medium text-red-600">{campaign.error_count}</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className={`ml-2 font-medium ${
                isCompleted ? 'text-green-600' : 
                isFailed ? 'text-red-600' : 
                'text-blue-600'
              }`}>
                {campaign.status}
              </span>
            </div>
          </div>

          {isCompleted && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Campaign completed successfully!</span>
            </div>
          )}

          {isFailed && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Campaign failed to send</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignProgressDialog;
