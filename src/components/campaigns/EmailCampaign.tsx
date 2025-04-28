
import React, { useState, useEffect } from 'react';
import { AiGenerationSection } from './AiGenerationSection';
import { Card } from '@/components/ui/card';
import { EmailPreview } from './EmailPreview';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';

export const EmailCampaign: React.FC = () => {
  const [previewContent, setPreviewContent] = useState({
    subject: '',
    email: '',
    image: ''
  });
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const { toast } = useToast();
  const debouncedContent = useDebounce(previewContent, 1000);

  // Save draft when content changes
  useEffect(() => {
    const saveDraft = async () => {
      try {
        // Create the data object for database operations
        const data = {
          campaign_name: 'Email Draft',
          email_subject: debouncedContent.subject,
          email_content: debouncedContent.email,
          image_url: debouncedContent.image,
          status: 'draft'
        };

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log("No authenticated user found, skipping draft save");
          return;
        }
        
        // Add user_id to data
        const dataWithUserId = {
          ...data,
          user_id: user.id
        };

        if (campaignId) {
          const { error } = await supabase
            .from('campaigns')
            .update(dataWithUserId)
            .eq('id', campaignId);
          
          if (error) throw error;
        } else {
          const { data: newCampaign, error } = await supabase
            .from('campaigns')
            .insert([dataWithUserId])
            .select()
            .single();
          
          if (error) throw error;
          if (newCampaign) setCampaignId(newCampaign.id);
        }
      } catch (error: any) {
        console.error('Error saving draft:', error);
        toast({
          title: 'Error saving draft',
          description: error.message,
          variant: 'destructive'
        });
      }
    };

    if (Object.values(debouncedContent).some(value => value)) {
      saveDraft();
    }
  }, [debouncedContent, campaignId, toast]);

  const handleGenerated = (type: string, content: string) => {
    setPreviewContent(prev => ({
      ...prev,
      [type === 'email_subject' ? 'subject' : type === 'image' ? 'image' : 'email']: content
    }));
    if (type === 'image') {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerating = (type: string) => {
    if (type === 'image') {
      setIsGeneratingImage(true);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-6">
        <AiGenerationSection
          title="AI EMAIL SUBJECT"
          description="Generate catchy email subject lines"
          type="email_subject"
          placeholder="Enter your email subject prompt"
          onGenerated={(content) => handleGenerated('email_subject', content)}
          suggestions={[
            "Summer special menu launch at our Mexican restaurant",
            "Exclusive weekend dining experience",
            "New seasonal menu reveal"
          ]}
        />
        
        <AiGenerationSection
          title="AI EMAIL"
          description="Generate complete marketing email content"
          type="email"
          placeholder="Enter your email content prompt"
          onGenerated={(content) => handleGenerated('email', content)}
          suggestions={[
            "Promote our new summer menu with focus on fresh ingredients",
            "Special weekend brunch announcement",
            "Family dinner package promotion"
          ]}
        />
        
        <AiGenerationSection
          title="AI IMAGE"
          description="Generate marketing images for your email campaigns"
          type="image"
          placeholder="Enter your image prompt"
          onGenerated={(content) => handleGenerated('image', content)}
          onGenerating={() => handleGenerating('image')}
          suggestions={[
            "A colorful spread of Mexican dishes with summer cocktails",
            "Restaurant interior with happy diners",
            "Chef preparing signature dishes"
          ]}
        />
      </div>

      <div className="sticky top-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Email Preview</h3>
          <div className="overflow-auto max-h-[800px]">
            <EmailPreview
              subject={previewContent.subject}
              content={previewContent.email}
              image={previewContent.image}
              isGeneratingImage={isGeneratingImage}
              onSubjectChange={(value) => handleGenerated('email_subject', value)}
              onContentChange={(value) => handleGenerated('email', value)}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};
