
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Battery, Signal, Wifi, Smartphone, Tablet, Pencil, X, ArrowUp, Image as ImageIcon } from 'lucide-react';
import { ImageGenerationProgress } from '@/components/ui/image-generation-progress';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAiGeneration } from '@/hooks/useAiGeneration';
import { useToast } from '@/hooks/use-toast';

interface GeneratedPreviewProps {
  channel: 'SMS' | 'Email';
  smsText?: string;
  emailSubject?: string;
  emailBody?: string;
  imageUrl?: string;
  isLoading?: boolean;
  onUpdate?: (field: 'smsText' | 'emailSubject' | 'emailBody' | 'imageUrl', value: string) => void;
}

export const GeneratedPreview: React.FC<GeneratedPreviewProps> = ({
  channel,
  smsText = '',
  emailSubject = '',
  emailBody = '',
  imageUrl = '',
  isLoading = false,
  onUpdate
}) => {
  // State for showing/hiding edit prompts
  const [editSections, setEditSections] = useState<{
    smsText: boolean;
    emailSubject: boolean;
    emailBody: boolean;
    image: boolean;
  }>({
    smsText: false,
    emailSubject: false,
    emailBody: false,
    image: false
  });

  // State for prompt inputs
  const [prompts, setPrompts] = useState({
    smsText: '',
    emailSubject: '',
    emailBody: '',
    image: ''
  });

  // State for individual section loading
  const [sectionLoading, setSectionLoading] = useState<{
    smsText: boolean;
    emailSubject: boolean;
    emailBody: boolean;
    image: boolean;
  }>({
    smsText: false,
    emailSubject: false,
    emailBody: false,
    image: false
  });

  const { generateContent } = useAiGeneration();
  const { toast } = useToast();

  const toggleEditSection = (section: keyof typeof editSections) => {
    setEditSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePromptChange = (section: keyof typeof prompts, value: string) => {
    setPrompts(prev => ({
      ...prev,
      [section]: value
    }));
  };

  const regenerateContent = async (section: keyof typeof prompts) => {
    if (!prompts[section]) {
      toast({
        title: 'Empty prompt',
        description: 'Please enter a prompt before generating content.',
        variant: 'destructive'
      });
      return;
    }

    // Set loading state for this section
    setSectionLoading(prev => ({
      ...prev,
      [section]: true
    }));

    try {
      let type: 'sms' | 'email_subject' | 'email' | 'image';
      let prompt = prompts[section];

      switch (section) {
        case 'smsText':
          type = 'sms';
          break;
        case 'emailSubject':
          type = 'email_subject';
          break;
        case 'emailBody':
          type = 'email';
          break;
        case 'image':
          type = 'image';
          // Add specific image generation guidance
          prompt = `Generate a restaurant marketing image for ${prompt} with a 1080x1080 aspect ratio`;
          break;
      }

      const result = await generateContent(prompt, type);
      if (result) {
        // Map the response to the correct field
        let field: 'smsText' | 'emailSubject' | 'emailBody' | 'imageUrl';
        switch (section) {
          case 'smsText':
            field = 'smsText';
            break;
          case 'emailSubject':
            field = 'emailSubject';
            break;
          case 'emailBody':
            field = 'emailBody';
            break;
          case 'image':
            field = 'imageUrl';
            break;
        }

        // Call the parent's update function
        onUpdate?.(field, result);
        
        // Hide the edit section after successful generation
        toggleEditSection(section);
        
        toast({
          title: 'Generation successful',
          description: `Your ${section} has been updated.`,
        });
      }
    } catch (error) {
      console.error('Error regenerating content:', error);
      toast({
        title: 'Generation failed',
        description: 'Failed to generate content. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSectionLoading(prev => ({
        ...prev,
        [section]: false
      }));
    }
  };

  const renderSMSPreview = () => {
    return (
      <div className="mx-auto w-[320px] border-8 border-gray-800 rounded-3xl p-4 bg-white shadow-xl">
        <div className="flex items-center justify-between mb-2 px-4">
          <div className="flex items-center space-x-1">
            <Signal size={12} />
            <span className="text-xs">Carrier</span>
          </div>
          <div className="flex items-center space-x-2">
            <Wifi size={12} />
            <Battery size={12} />
          </div>
        </div>
        
        <div className="w-16 h-1 bg-gray-800 rounded-full mx-auto mb-4"></div>
        
        <div className="space-y-4 min-h-[400px] bg-gray-50 rounded-xl p-4">
          {isLoading ? (
            <>
              <div className="relative">
                <div className="aspect-square w-full bg-gray-200 rounded-lg"></div>
                <ImageGenerationProgress isGenerating={true} className="absolute bottom-2 left-2 right-2" />
              </div>
              <div className="animate-pulse bg-gray-200 w-full h-20 rounded-lg"></div>
            </>
          ) : (
            <>
              {/* Image Section */}
              <div className="relative mb-4">
                {imageUrl ? (
                  <>
                    <img 
                      src={imageUrl} 
                      alt="Generated marketing image" 
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <ImageGenerationProgress isGenerating={sectionLoading.image} className="absolute bottom-2 left-2 right-2" />
                  </>
                ) : (
                  <div className="flex items-center justify-center w-full aspect-square bg-gray-100 text-gray-400 rounded-lg">
                    <Smartphone className="mr-2" size={24} />
                    <span>Image Placeholder</span>
                  </div>
                )}
                
                {/* Edit Image button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute top-2 right-2 bg-white opacity-80 hover:opacity-100"
                  onClick={() => toggleEditSection('image')}
                >
                  <Pencil size={14} />
                </Button>
              </div>
              
              {/* Image Edit Section */}
              {editSections.image && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Edit Image</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleEditSection('image')}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                  
                  <Textarea
                    placeholder="Describe the image you want to generate"
                    value={prompts.image}
                    onChange={(e) => handlePromptChange('image', e.target.value)}
                    className="w-full text-xs mb-2"
                    rows={2}
                  />
                  
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => regenerateContent('image')}
                    disabled={sectionLoading.image}
                  >
                    {sectionLoading.image ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                    ) : (
                      <ImageIcon size={14} className="mr-1" />
                    )}
                    Regenerate Image
                  </Button>
                </div>
              )}
              
              {/* SMS Text Section */}
              <div className="relative bg-blue-100 p-3 rounded-lg rounded-tl-none text-left text-sm">
                {smsText || "Your generated SMS content will appear here"}
                
                {/* Edit SMS button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute top-2 right-2 bg-white opacity-80 hover:opacity-100"
                  onClick={() => toggleEditSection('smsText')}
                >
                  <Pencil size={14} />
                </Button>
              </div>
              
              {/* SMS Edit Section */}
              {editSections.smsText && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Edit SMS Text</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleEditSection('smsText')}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                  
                  <Textarea
                    placeholder="What kind of SMS would you like?"
                    value={prompts.smsText}
                    onChange={(e) => handlePromptChange('smsText', e.target.value)}
                    className="w-full text-xs mb-2"
                    rows={2}
                  />
                  
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => regenerateContent('smsText')}
                    disabled={sectionLoading.smsText}
                  >
                    {sectionLoading.smsText ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                    ) : (
                      <Pencil size={14} className="mr-1" />
                    )}
                    Regenerate SMS
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };
  
  const renderEmailPreview = () => {
    return (
      <div className="mx-auto w-full max-w-[480px] border-8 border-gray-800 rounded-3xl p-4 bg-white shadow-xl">
        <div className="flex items-center justify-between mb-2 px-4">
          <div className="flex items-center space-x-1">
            <Signal size={12} />
            <span className="text-xs">Carrier</span>
          </div>
          <div className="flex items-center space-x-2">
            <Wifi size={12} />
            <Battery size={12} />
          </div>
        </div>
        
        <div className="w-16 h-1 bg-gray-800 rounded-full mx-auto mb-4"></div>
        
        <div className="space-y-4 min-h-[500px] bg-gray-50 rounded-xl p-4">
          {isLoading ? (
            <>
              <div className="animate-pulse bg-gray-200 w-full h-8 rounded-lg mb-4"></div>
              <div className="relative">
                <div className="aspect-square w-full bg-gray-200 rounded-lg mb-4"></div>
                <ImageGenerationProgress isGenerating={true} className="absolute bottom-2 left-2 right-2" />
              </div>
              <div className="animate-pulse bg-gray-200 w-full h-60 rounded-lg"></div>
            </>
          ) : (
            <>
              {/* Email Subject Section */}
              <div className="relative border-b pb-2 mb-4">
                <h2 className="text-xl font-semibold pr-8">
                  {emailSubject || "Email Subject"}
                </h2>
                
                {/* Edit Subject button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute top-0 right-0 bg-white opacity-80 hover:opacity-100"
                  onClick={() => toggleEditSection('emailSubject')}
                >
                  <Pencil size={14} />
                </Button>
              </div>
              
              {/* Email Subject Edit Section */}
              {editSections.emailSubject && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Edit Subject Line</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleEditSection('emailSubject')}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                  
                  <Input
                    placeholder="Describe subject line you'd like"
                    value={prompts.emailSubject}
                    onChange={(e) => handlePromptChange('emailSubject', e.target.value)}
                    className="w-full text-xs mb-2"
                  />
                  
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => regenerateContent('emailSubject')}
                    disabled={sectionLoading.emailSubject}
                  >
                    {sectionLoading.emailSubject ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                    ) : (
                      <Pencil size={14} className="mr-1" />
                    )}
                    Regenerate Subject
                  </Button>
                </div>
              )}
              
              {/* Email Image Section */}
              <div className="relative mb-4">
                {imageUrl ? (
                  <>
                    <img 
                      src={imageUrl} 
                      alt="Generated marketing image" 
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <ImageGenerationProgress isGenerating={sectionLoading.image} className="absolute bottom-2 left-2 right-2" />
                  </>
                ) : (
                  <div className="flex items-center justify-center w-full aspect-square bg-gray-100 text-gray-400 rounded-lg">
                    <Tablet className="mr-2" size={24} />
                    <span>Image Placeholder</span>
                  </div>
                )}
                
                {/* Edit Image button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute top-2 right-2 bg-white opacity-80 hover:opacity-100"
                  onClick={() => toggleEditSection('image')}
                >
                  <Pencil size={14} />
                </Button>
              </div>
              
              {/* Image Edit Section */}
              {editSections.image && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Edit Image</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleEditSection('image')}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                  
                  <Textarea
                    placeholder="Describe the image you want to generate"
                    value={prompts.image}
                    onChange={(e) => handlePromptChange('image', e.target.value)}
                    className="w-full text-xs mb-2"
                    rows={2}
                  />
                  
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => regenerateContent('image')}
                    disabled={sectionLoading.image}
                  >
                    {sectionLoading.image ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                    ) : (
                      <ImageIcon size={14} className="mr-1" />
                    )}
                    Regenerate Image
                  </Button>
                </div>
              )}
              
              {/* Email Body Section */}
              <div className="relative prose max-w-none bg-white p-4 rounded-lg border border-gray-100">
                {emailBody ? (
                  <div dangerouslySetInnerHTML={{ __html: emailBody }} />
                ) : (
                  <p className="text-gray-500">Your generated email content will appear here</p>
                )}
                
                {/* Edit Email Body button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute top-2 right-2 bg-white opacity-80 hover:opacity-100"
                  onClick={() => toggleEditSection('emailBody')}
                >
                  <Pencil size={14} />
                </Button>
              </div>
              
              {/* Email Body Edit Section */}
              {editSections.emailBody && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Edit Email Body</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleEditSection('emailBody')}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                  
                  <Textarea
                    placeholder="What do you want the email to say?"
                    value={prompts.emailBody}
                    onChange={(e) => handlePromptChange('emailBody', e.target.value)}
                    className="w-full text-xs mb-2"
                    rows={3}
                  />
                  
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => regenerateContent('emailBody')}
                    disabled={sectionLoading.emailBody}
                  >
                    {sectionLoading.emailBody ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                    ) : (
                      <Pencil size={14} className="mr-1" />
                    )}
                    Regenerate Email Copy
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <Card className="p-6 relative">
      <h3 className="text-lg font-semibold mb-4">{channel} Preview</h3>
      
      <div className="mt-4">
        {channel === 'SMS' ? renderSMSPreview() : renderEmailPreview()}
      </div>
    </Card>
  );
};
