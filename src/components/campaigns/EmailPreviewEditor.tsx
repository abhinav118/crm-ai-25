
import React, { useState } from 'react';
import { useAiGeneration } from '@/hooks/useAiGeneration';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Edit,
  ImageIcon, 
  Type, 
  MousePointerClick, 
  Info, 
  RefreshCw, 
  Save,
  Check
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface EmailPreviewEditorProps {
  initialSubject?: string;
  initialContent?: string;
  initialImage?: string;
  onSave?: (emailData: {
    subject: string;
    content: string;
    image: string;
    ctaButtons: {
      primary: { text: string; url: string };
      secondary: { text: string; url: string };
    };
  }) => void;
}

export const EmailPreviewEditor: React.FC<EmailPreviewEditorProps> = ({
  initialSubject = 'Welcome to Taco Fiesta!',
  initialContent = '<p>We\'re excited to share our latest deals and menu items with you. Come visit us soon!</p>',
  initialImage = '',
  onSave
}) => {
  // Email content state
  const [subject, setSubject] = useState(initialSubject);
  const [content, setContent] = useState(initialContent);
  const [image, setImage] = useState(initialImage);
  const [ctaButtons, setCtaButtons] = useState({
    primary: { text: 'Order Now', url: '#order' },
    secondary: { text: 'View Menu', url: '#menu' }
  });
  
  // Save campaign state
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignTags, setCampaignTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  const handleSaveCampaign = () => {
    if (!campaignName) {
      toast({
        title: 'Campaign name required',
        description: 'Please enter a name for your campaign.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    
    // Simulate saving with a delay
    setTimeout(() => {
      if (onSave) {
        onSave({
          subject,
          content,
          image,
          ctaButtons
        });
      }
      
      toast({
        title: 'Campaign saved',
        description: 'Your email campaign has been saved successfully.',
      });
      
      setIsSaving(false);
      setIsSaveDialogOpen(false);
    }, 1000);
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Email Campaign Editor</h2>
        <Button 
          onClick={() => setIsSaveDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Save size={16} />
          Save Campaign
        </Button>
      </div>
      
      <div className="text-center py-12 text-gray-500">
        <p>Email preview functionality has been removed.</p>
        <p>Use the dedicated campaign creation flow instead.</p>
      </div>
      
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
            <Button onClick={handleSaveCampaign} disabled={isSaving || !campaignName}>
              {isSaving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} className="mr-2" />
                  Save Campaign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
