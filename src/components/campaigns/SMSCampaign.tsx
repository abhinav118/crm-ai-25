
import React, { useState } from 'react';
import { AiGenerationSection } from './AiGenerationSection';
import { Card } from '@/components/ui/card';
import { Smartphone, Signal, Battery, Wifi } from 'lucide-react';
import { ImagePreview } from './ImagePreview';
import { useAiSuggestions, SuggestionType } from '@/hooks/useAiSuggestions';

interface PreviewContent {
  text?: string;
  image?: string;
}

// Default suggestions as fallbacks
const DEFAULT_SMS_TEXT_SUGGESTIONS = [
  "20% off summer sale for our Mexican restaurant this weekend",
  "Buy one get one free lunch special today",
  "Join us for happy hour, 2-for-1 margaritas"
];

const DEFAULT_SMS_IMAGE_SUGGESTIONS = [
  "A delicious taco platter with summer themed decorations",
  "Colorful Mexican street food display",
  "Fresh guacamole and chips presentation"
];

export const SMSCampaign: React.FC = () => {
  const [previewContent, setPreviewContent] = useState<PreviewContent>({});
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Use custom hook for AI suggestions
  const { 
    suggestions: textSuggestions, 
    isLoading: isLoadingTextSuggestions 
  } = useAiSuggestions('sms_text', DEFAULT_SMS_TEXT_SUGGESTIONS);
  
  const { 
    suggestions: imageSuggestions, 
    isLoading: isLoadingImageSuggestions 
  } = useAiSuggestions('sms_image', DEFAULT_SMS_IMAGE_SUGGESTIONS);

  const handleGenerated = (type: string, content: string) => {
    setPreviewContent(prev => ({ ...prev, [type === 'sms' ? 'text' : 'image']: content }));
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
          title="AI SMS"
          description="Generate engaging SMS marketing messages"
          type="sms"
          placeholder="Enter your SMS marketing message prompt"
          onGenerated={(content) => handleGenerated('sms', content)}
          onGenerating={() => handleGenerating('sms')}
          suggestions={textSuggestions}
          loadingSuggestions={isLoadingTextSuggestions}
        />
        
        <AiGenerationSection
          title="AI IMAGE"
          description="Generate marketing images for your SMS campaigns"
          type="image"
          placeholder="Enter your marketing image prompt"
          onGenerated={(content) => handleGenerated('image', content)}
          onGenerating={() => handleGenerating('image')}
          suggestions={imageSuggestions}
          loadingSuggestions={isLoadingImageSuggestions}
        />
      </div>

      <div className="sticky top-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">SMS Preview</h3>
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
              <ImagePreview 
                src={previewContent.image}
                isLoading={isGeneratingImage}
                className="mb-4"
              />
              
              <div className="text-sm">
                {previewContent.text || (
                  <p className="text-sm text-gray-500">Generated content will appear here</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
