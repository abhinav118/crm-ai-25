
import React, { useState, useEffect } from 'react';
import { AiGenerationSection } from './AiGenerationSection';
import { Card } from '@/components/ui/card';
import { EmailPreview } from './EmailPreview';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { useAiSuggestions, SuggestionType } from '@/hooks/useAiSuggestions';
import { EmailBuilderCanvas } from './EmailBuilderCanvas';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Palette } from 'lucide-react';

// Default suggestions as fallbacks
const DEFAULT_EMAIL_SUBJECT_SUGGESTIONS = [
  "Summer special menu launch at our Mexican restaurant",
  "Exclusive weekend dining experience",
  "New seasonal menu reveal"
];

const DEFAULT_EMAIL_CONTENT_SUGGESTIONS = [
  "Promote our new summer menu with focus on fresh ingredients",
  "Special weekend brunch announcement",
  "Family dinner package promotion"
];

const DEFAULT_EMAIL_IMAGE_SUGGESTIONS = [
  "A colorful spread of Mexican dishes with summer cocktails",
  "Restaurant interior with happy diners",
  "Chef preparing signature dishes"
];

export const EmailCampaign: React.FC = () => {
  const [previewContent, setPreviewContent] = useState({
    subject: '',
    email: '',
    image: ''
  });
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'classic' | 'builder'>('classic');
  const { toast } = useToast();
  const debouncedContent = useDebounce(previewContent, 1000);
  
  // Use custom hook for AI suggestions
  const { 
    suggestions: subjectSuggestions, 
    isLoading: isLoadingSubjectSuggestions 
  } = useAiSuggestions('email_subject', DEFAULT_EMAIL_SUBJECT_SUGGESTIONS);
  
  const { 
    suggestions: contentSuggestions, 
    isLoading: isLoadingContentSuggestions 
  } = useAiSuggestions('email_content', DEFAULT_EMAIL_CONTENT_SUGGESTIONS);
  
  const { 
    suggestions: imageSuggestions, 
    isLoading: isLoadingImageSuggestions 
  } = useAiSuggestions('email_image', DEFAULT_EMAIL_IMAGE_SUGGESTIONS);

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

    if (Object.values(debouncedContent).some(value => value) && activeView === 'classic') {
      saveDraft();
    }
  }, [debouncedContent, campaignId, toast, activeView]);

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

  const handleRegenerate = async (section: 'subject' | 'content' | 'image' | 'cta' | 'footer', prompt: string) => {
    // Just pass through to the existing handlers based on section type
    if (section === 'subject') {
      const content = await generateContent('email_subject', prompt);
      if (content) handleGenerated('email_subject', content);
    } else if (section === 'content') {
      const content = await generateContent('email', prompt);
      if (content) handleGenerated('email', content);
    } else if (section === 'image') {
      handleGenerating('image');
      const content = await generateContent('image', prompt);
      if (content) handleGenerated('image', content);
    }
  };

  // Helper function to generate content using the existing hooks
  const generateContent = async (type: string, prompt: string): Promise<string | null> => {
    try {
      // This would normally use your AI generation hook
      // For now, we're just returning placeholder content based on the type
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      if (type === 'email_subject') {
        return 'AI Generated Subject Line: ' + prompt;
      } else if (type === 'email') {
        return '<p>AI Generated Content based on: ' + prompt + '</p>';
      } else if (type === 'image') {
        // Return a placeholder image URL - in a real app this would be an AI-generated image
        return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000';
      }
      return null;
    } catch (error) {
      console.error('Error generating content:', error);
      return null;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'classic' | 'builder')}>
        <TabsList className="mb-4">
          <TabsTrigger value="classic" className="flex items-center gap-2">
            <Edit size={16} />
            Classic Editor
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Palette size={16} />
            Modular Builder
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="classic">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <AiGenerationSection
                title="AI EMAIL SUBJECT"
                description="Generate catchy email subject lines"
                type="email_subject"
                placeholder="Enter your email subject prompt"
                onGenerated={(content) => handleGenerated('email_subject', content)}
                suggestions={subjectSuggestions}
                loadingSuggestions={isLoadingSubjectSuggestions}
              />
              
              <AiGenerationSection
                title="AI EMAIL"
                description="Generate complete marketing email content"
                type="email"
                placeholder="Enter your email content prompt"
                onGenerated={(content) => handleGenerated('email', content)}
                suggestions={contentSuggestions}
                loadingSuggestions={isLoadingContentSuggestions}
              />
              
              <AiGenerationSection
                title="AI IMAGE"
                description="Generate marketing images for your email campaigns"
                type="image"
                placeholder="Enter your image prompt"
                onGenerated={(content) => handleGenerated('image', content)}
                onGenerating={() => handleGenerating('image')}
                suggestions={imageSuggestions}
                loadingSuggestions={isLoadingImageSuggestions}
              />
            </div>

            <div className="sticky top-6">
              <Card className="p-4 shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-center">Email Preview</h3>
                <div className="overflow-auto max-h-[800px]">
                  <EmailPreview
                    subject={previewContent.subject}
                    content={previewContent.email}
                    image={previewContent.image}
                    isGeneratingImage={isGeneratingImage}
                    onSubjectChange={(value) => handleGenerated('email_subject', value)}
                    onContentChange={(value) => handleGenerated('email', value)}
                    onRegenerate={handleRegenerate}
                  />
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="builder">
          <Card className="p-4 shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-center">Modular Email Builder</h3>
            <p className="text-center text-gray-500 mb-6">
              Drag and drop sections to reorder. Click the edit icon to customize each section with AI.
            </p>
            <EmailBuilderCanvas />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
