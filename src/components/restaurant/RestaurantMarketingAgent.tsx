
import React, { useState } from 'react';
import { Paperclip, ArrowUp, MessageSquare, Mail, FileText, Globe, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GeneratedPreview } from './GeneratedPreview';
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useAiGeneration } from '@/hooks/useAiGeneration';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type MarketingChannel = 'SMS Marketing' | 'Email Marketing';

export const RestaurantMarketingAgent = () => {
  const [prompt, setPrompt] = useState('');
  const [channel, setChannel] = useState<MarketingChannel>('SMS Marketing');
  const [remainingGenerations, setRemainingGenerations] = useState(5);
  const [generatedContent, setGeneratedContent] = useState({
    smsText: '',
    emailSubject: '',
    emailBody: '',
    imageUrl: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { generateContent } = useAiGeneration();
  const { toast } = useToast();

  const handleChannelChange = (value: MarketingChannel) => {
    setChannel(value);
  };

  const handleGenerateClick = async () => {
    if (!prompt || remainingGenerations <= 0) {
      if (remainingGenerations <= 0) {
        toast({
          title: 'Generation limit reached',
          description: 'You have used all your free generations for today.',
          variant: 'destructive'
        });
      }
      return;
    }

    setIsGenerating(true);
    
    try {
      const type = channel === 'SMS Marketing' ? 'sms' : 'email';
      const imagePrompt = `Generate a marketing image for ${prompt} for a restaurant`;
      
      // Generate main content
      const content = await generateContent(prompt, type);
      
      // Generate image separately
      const image = await generateContent(imagePrompt, 'image');

      if (channel === 'SMS Marketing') {
        setGeneratedContent({
          smsText: content || '',
          emailSubject: '',
          emailBody: '',
          imageUrl: image || ''
        });
      } else {
        // For email, we assume the content has subject and body
        // In a real implementation, you might want to generate these separately
        const subject = await generateContent(prompt, 'email_subject');
        const body = await generateContent(prompt, 'email');
        
        setGeneratedContent({
          smsText: '',
          emailSubject: subject || 'Generated Email Subject',
          emailBody: body || '',
          imageUrl: image || ''
        });
      }
      
      // Decrease remaining generations
      setRemainingGenerations(prev => prev - 1);
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: 'Generation failed',
        description: 'Failed to generate content. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTemplateClick = (template: string) => {
    let newPrompt = '';
    
    switch (template) {
      case 'sms':
        setChannel('SMS Marketing');
        newPrompt = 'Create a promotional SMS for a special discount offer';
        break;
      case 'email':
        setChannel('Email Marketing');
        newPrompt = 'Create a weekly newsletter email with our latest menu items';
        break;
      case 'blog':
        newPrompt = 'Write a blog post about our latest seasonal ingredients';
        break;
      case 'landing':
        newPrompt = 'Create content for a landing page promoting our catering services';
        break;
      case 'ad':
        newPrompt = 'Create an ad campaign for our new happy hour specials';
        break;
    }
    
    setPrompt(newPrompt);
  };

  const saveCampaign = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to save campaigns',
          variant: 'destructive'
        });
        return;
      }

      const campaignData = {
        campaign_name: prompt.substring(0, 50),
        user_id: user.id,
        status: 'draft',
        created_at: new Date().toISOString(),
        image_url: generatedContent.imageUrl,
      };
      
      // Add channel-specific data
      if (channel === 'SMS Marketing') {
        Object.assign(campaignData, {
          sms_content: generatedContent.smsText
        });
      } else {
        Object.assign(campaignData, {
          email_subject: generatedContent.emailSubject,
          email_content: generatedContent.emailBody
        });
      }
      
      const { error } = await supabase.from('campaigns').insert([campaignData]);
      
      if (error) throw error;
      
      toast({
        title: 'Campaign saved',
        description: 'Your campaign has been saved successfully',
      });
    } catch (error: any) {
      console.error('Error saving campaign:', error);
      toast({
        title: 'Save failed',
        description: error.message || 'Failed to save campaign',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4">
      <h1 className="text-4xl font-bold mb-8">Your Restaurant Marketing Agent:</h1>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-2">
          You have {remainingGenerations} free generations remaining today.
          <Button variant="outline" size="sm" className="ml-2">
            Upgrade Plan
          </Button>
        </p>
      </div>
      
      <Card className="p-2 mb-6">
        <div className="flex items-center gap-2">
          <Input 
            placeholder="Ask Restaurant AI to build..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1"
          />
          
          <Select value={channel} onValueChange={handleChannelChange}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SMS Marketing">
                <div className="flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  SMS Marketing
                </div>
              </SelectItem>
              <SelectItem value="Email Marketing">
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Marketing
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="ghost" size="icon" title="Attach file">
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <Button 
            onClick={handleGenerateClick}
            disabled={isGenerating || !prompt || remainingGenerations <= 0}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full p-2"
            size="icon"
          >
            {isGenerating ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <ArrowUp className="h-5 w-5" />
            )}
          </Button>
        </div>
      </Card>
      
      <div className="flex flex-wrap gap-3 mb-8">
        <Button 
          variant="outline" 
          onClick={() => handleTemplateClick('sms')}
          className="flex items-center gap-2"
        >
          <MessageSquare size={16} />
          SMS Template
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => handleTemplateClick('email')}
          className="flex items-center gap-2"
        >
          <Mail size={16} />
          Email Template
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => handleTemplateClick('blog')}
          className="flex items-center gap-2"
        >
          <FileText size={16} />
          Blog Post
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => handleTemplateClick('landing')}
          className="flex items-center gap-2"
        >
          <Globe size={16} />
          Landing Page
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => handleTemplateClick('ad')}
          className="flex items-center gap-2"
        >
          <Megaphone size={16} />
          Ad Campaign
        </Button>
      </div>
      
      <GeneratedPreview
        channel={channel === 'SMS Marketing' ? 'SMS' : 'Email'}
        smsText={generatedContent.smsText}
        emailSubject={generatedContent.emailSubject}
        emailBody={generatedContent.emailBody}
        imageUrl={generatedContent.imageUrl}
        isLoading={isGenerating}
      />
      
      <Button 
        className="w-full mt-6 mb-8" 
        size="lg"
        onClick={saveCampaign}
        disabled={isGenerating || (!generatedContent.smsText && !generatedContent.emailBody)}
      >
        Save Campaign
      </Button>
    </div>
  );
};
