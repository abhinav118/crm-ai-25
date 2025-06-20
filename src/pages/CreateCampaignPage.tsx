import React, { useState, useRef } from 'react';
import { Paperclip, ArrowUp, MessageSquare, Mail, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GeneratedPreview } from '@/components/restaurant/GeneratedPreview';
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
import { useAiSuggestions } from '@/hooks/useAiSuggestions';
import { EmailCampaignEditor } from '@/components/restaurant/EmailCampaignEditor';
import { Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

type MarketingChannel = 'SMS Marketing' | 'Email Marketing';

const CreateCampaignPage = () => {
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
  const [attachment, setAttachment] = useState<File | null>(null);
  const [showEmailEditor, setShowEmailEditor] = useState(false);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { generateContent } = useAiGeneration();
  const { toast } = useToast();

  // Use AI suggestions hook for prompt inspiration
  const { 
    suggestions: promptSuggestions, 
    isLoading: isLoadingSuggestions 
  } = useAiSuggestions(
    channel === 'SMS Marketing' ? 'sms_text' : 'email_content', 
    []
  );

  // Add console logging to debug the suggestions
  console.log('CreateCampaignPage - Prompt suggestions:', promptSuggestions);
  console.log('CreateCampaignPage - Channel value:', channel);

  const handleChannelChange = (value: MarketingChannel) => {
    console.log('CreateCampaignPage - Channel changed to:', value);
    // Ensure the value is valid and not empty before setting
    if (value && (value === 'SMS Marketing' || value === 'Email Marketing')) {
      setChannel(value);
    } else {
      console.error('CreateCampaignPage - Invalid channel value:', value);
    }
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
      
      // Build a more detailed prompt that incorporates the attachment if it exists
      let enhancedPrompt = prompt;
      if (attachment) {
        enhancedPrompt = `Using the attached reference image as inspiration, ${prompt}`;
      }
      
      // Generate image based on the prompt
      const imagePrompt = `Generate a restaurant marketing image for ${enhancedPrompt} with a 1080x1080 aspect ratio`;
      
      // Generate main content
      const content = await generateContent(enhancedPrompt, type);
      
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
        const subject = await generateContent(enhancedPrompt, 'email_subject');
        const body = await generateContent(enhancedPrompt, 'email');
        
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

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
      toast({
        title: 'File attached',
        description: `${file.name} will be used as a reference for your generation.`
      });
    }
  };

  // Handle individual section updates from GeneratedPreview
  const handleSectionUpdate = (field: 'smsText' | 'emailSubject' | 'emailBody' | 'imageUrl', value: string) => {
    setGeneratedContent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSendCampaign = async () => {
    // If not confirmed yet, show the confirmation modal
    if (!isConfirmed) {
      setShowBulkConfirmModal(true);
      return;
    }

    // User has confirmed, proceed with sending
    setIsSending(true);
    setShowBulkConfirmModal(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to send campaigns',
          variant: 'destructive'
        });
        return;
      }

      const campaignData = {
        campaign_name: prompt.substring(0, 50),
        user_id: user.id,
        status: 'sent',
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
        title: 'Campaign sent',
        description: 'Your campaign has been sent successfully to all contacts',
      });

      // Reset states
      setIsConfirmed(false);
      setPrompt('');
      setGeneratedContent({
        smsText: '',
        emailSubject: '',
        emailBody: '',
        imageUrl: ''
      });
      
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      toast({
        title: 'Send failed',
        description: error.message || 'Failed to send campaign',
        variant: 'destructive'
      });
      setIsConfirmed(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmSend = () => {
    setIsConfirmed(true);
    handleSendCampaign();
  };

  const handleCancelSend = () => {
    setShowBulkConfirmModal(false);
    setIsConfirmed(false);
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

  // If showing the email editor, render that instead
  if (showEmailEditor) {
    return <EmailCampaignEditor onBack={() => setShowEmailEditor(false)} />;
  }

  // Filter suggestions to ensure they are valid and not empty
  const validSuggestions = promptSuggestions.filter(suggestion => 
    suggestion && 
    typeof suggestion === 'string' && 
    suggestion.trim().length > 0
  );

  return (
    <div className="max-w-5xl mx-auto px-4">
      <h1 className="text-4xl font-bold mb-8">Create Campaign</h1>
      
      {/* Advanced Editor Option */}
      {channel === 'Email Marketing' && (
        <div className="mb-4 flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => setShowEmailEditor(true)}
            className="flex items-center gap-2"
          >
            <Pencil size={16} />
            Advanced Email Editor
          </Button>
        </div>
      )}
      
      <div className="mb-6">
        {isLoadingSuggestions ? (
          <div className="animate-pulse flex space-x-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ) : validSuggestions.length > 0 ? (
          <div className="text-gray-600 mb-2 flex flex-wrap gap-2">
            {validSuggestions.map((suggestion, index) => (
              <Button 
                key={index} 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => setPrompt(suggestion)}
              >
                {suggestion.length > 30 ? `${suggestion.substring(0, 30)}...` : suggestion}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 mb-2">
            You have {remainingGenerations} free generations remaining today.
            <Button variant="outline" size="sm" className="ml-2">
              Upgrade Plan
            </Button>
          </p>
        )}
      </div>
      
      <Card className="p-2 mb-6">
        <div className="flex items-center gap-2">
          <Input 
            placeholder="Ask AI to build your campaign..."
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
          
          <Button 
            variant="ghost" 
            size="icon" 
            title={attachment ? "Attachment added" : "Attach file"}
            onClick={handleAttachmentClick}
            className={attachment ? "bg-gray-100" : ""}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />
            {attachment ? (
              <Image className="h-5 w-5 text-green-500" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
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
      
      <GeneratedPreview
        channel={channel === 'SMS Marketing' ? 'SMS' : 'Email'}
        smsText={generatedContent.smsText}
        emailSubject={generatedContent.emailSubject}
        emailBody={generatedContent.emailBody}
        imageUrl={generatedContent.imageUrl}
        isLoading={isGenerating}
        onUpdate={handleSectionUpdate}
      />
      
      <div className="flex gap-4 mt-6 mb-8">
        <Button 
          className="flex-1" 
          size="lg"
          onClick={saveCampaign}
          disabled={isGenerating || (!generatedContent.smsText && !generatedContent.emailBody)}
          variant="outline"
        >
          Save Campaign
        </Button>
        
        <Button 
          className="flex-1" 
          size="lg"
          onClick={handleSendCampaign}
          disabled={isGenerating || isSending || (!generatedContent.smsText && !generatedContent.emailBody)}
        >
          {isSending ? 'Sending...' : 'Send to Contacts'}
        </Button>
      </div>

      {/* Bulk Campaign Confirmation Modal */}
      <Dialog open={showBulkConfirmModal} onOpenChange={setShowBulkConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Campaign</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to send this campaign to all contacts? This action cannot be undone.
            </p>
            {channel === 'SMS Marketing' && generatedContent.smsText && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">SMS Preview:</p>
                <p className="text-sm text-gray-600 mt-1">{generatedContent.smsText}</p>
              </div>
            )}
            {channel === 'Email Marketing' && generatedContent.emailSubject && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Email Subject:</p>
                <p className="text-sm text-gray-600 mt-1">{generatedContent.emailSubject}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelSend}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSend} disabled={isSending}>
              {isSending ? 'Sending...' : 'Send to Contacts'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateCampaignPage;
