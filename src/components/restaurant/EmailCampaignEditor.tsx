
import React, { useState } from 'react';
import { EmailPreviewEditor } from '@/components/campaigns/EmailPreviewEditor';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Mail, ArrowLeft } from 'lucide-react';

interface EmailCampaignEditorProps {
  onBack?: () => void;
}

export const EmailCampaignEditor: React.FC<EmailCampaignEditorProps> = ({ 
  onBack
}) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async (emailData: {
    subject: string;
    content: string;
    image: string;
    ctaButtons: {
      primary: { text: string; url: string };
      secondary: { text: string; url: string };
    };
  }) => {
    setIsSaving(true);
    
    try {
      // You would save this to your database in a real application
      console.log('Saving campaign:', emailData);
      
      toast({
        title: 'Campaign saved successfully',
        description: 'Your email campaign has been saved and is ready to send.',
        duration: 5000,
      });
      
      // Optional: Redirect or perform other actions after saving
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: 'Error saving campaign',
        description: 'There was a problem saving your campaign. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Card className="p-6">
      {onBack && (
        <Button
          variant="ghost"
          className="mb-4 flex items-center space-x-2"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          <span>Back to campaigns</span>
        </Button>
      )}
      
      <div className="flex items-center space-x-2 mb-6">
        <Mail className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Email Campaign Editor</h1>
      </div>
      
      <EmailPreviewEditor onSave={handleSave} />
    </Card>
  );
};
