
import React, { useState } from 'react';
import { EmailBuilderCanvas, EmailSectionData } from '@/components/campaigns/EmailBuilderCanvas';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Mail, ArrowLeft, Save } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface EmailCampaignEditorProps {
  onBack?: () => void;
}

export const EmailCampaignEditor: React.FC<EmailCampaignEditorProps> = ({ 
  onBack
}) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignTags, setCampaignTags] = useState('');
  
  // Handle save dialog open
  const handleOpenSaveDialog = () => {
    setIsSaveDialogOpen(true);
  };
  
  // Handle save campaign
  const handleSaveCampaign = async (sections: EmailSectionData[]) => {
    if (!campaignName) {
      toast({
        title: 'Campaign name required',
        description: 'Please enter a name for your campaign.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Prepare the data to be saved
      const emailData = {
        name: campaignName,
        tags: campaignTags.split(',').map(tag => tag.trim()),
        subject: sections.find(s => s.type === 'subject')?.content || '',
        content: sections.find(s => s.type === 'copy')?.content || '',
        image: sections.find(s => s.type === 'image')?.imageUrl || '',
        ctaButtons: sections.find(s => s.type === 'button')?.buttons || {
          primary: { text: 'Order Now', url: '#' },
          secondary: { text: 'View Menu', url: '#' }
        },
        footer: sections.find(s => s.type === 'footer')?.content || '',
        structure: sections.map(s => ({
          id: s.id,
          type: s.type,
          order: sections.findIndex(section => section.id === s.id)
        }))
      };
      
      console.log('Saving campaign:', emailData);
      
      // In a real application, you would save this to your database
      // const { data, error } = await supabase.from('campaigns').insert([emailData]);
      
      toast({
        title: 'Campaign saved successfully',
        description: 'Your email campaign has been saved and is ready to send.',
        duration: 5000,
      });
      
      setIsSaving(false);
      setIsSaveDialogOpen(false);
      
      // Optional: Redirect or perform other actions after saving
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: 'Error saving campaign',
        description: 'There was a problem saving your campaign. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
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
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Mail className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Email Builder</h1>
        </div>
        
        <Button onClick={handleOpenSaveDialog} className="flex items-center gap-2">
          <Save size={16} />
          Save Campaign
        </Button>
      </div>
      
      <EmailBuilderCanvas />
      
      {/* Save Campaign Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Campaign</DialogTitle>
            <DialogDescription>
              Enter the details to save your email campaign.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                placeholder="Summer Promotion 2025"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                placeholder="promotion, summer, discount"
                value={campaignTags}
                onChange={(e) => setCampaignTags(e.target.value)}
              />
              <p className="text-xs text-gray-500">Separate tags with commas</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const sections = document.querySelectorAll('[data-section-id]');
                // This is just a placeholder since we can't directly access the EmailBuilderCanvas state
                // In a real implementation, you'd pass a callback to the EmailBuilderCanvas component
                handleSaveCampaign([]);
              }} 
              disabled={isSaving || !campaignName}
            >
              {isSaving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Saving...
                </>
              ) : (
                'Save Campaign'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
