
import React from 'react';
import { Card } from '@/components/ui/card';
import { Battery, Signal, Wifi, Smartphone, Tablet } from 'lucide-react';
import { ImageGenerationProgress } from '@/components/ui/image-generation-progress';

interface GeneratedPreviewProps {
  channel: 'SMS' | 'Email';
  smsText?: string;
  emailSubject?: string;
  emailBody?: string;
  imageUrl?: string;
  isLoading?: boolean;
}

export const GeneratedPreview: React.FC<GeneratedPreviewProps> = ({
  channel,
  smsText = '',
  emailSubject = '',
  emailBody = '',
  imageUrl = '',
  isLoading = false
}) => {
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
              {imageUrl ? (
                <div className="relative mb-4">
                  <img 
                    src={imageUrl} 
                    alt="Generated marketing image" 
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <ImageGenerationProgress isGenerating={false} className="absolute bottom-2 left-2 right-2" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-full aspect-square bg-gray-100 text-gray-400 rounded-lg mb-4">
                  <Smartphone className="mr-2" size={24} />
                  <span>Image Placeholder</span>
                </div>
              )}
              
              <div className="bg-blue-100 p-3 rounded-lg rounded-tl-none text-left text-sm">
                {smsText || "Your generated SMS content will appear here"}
              </div>
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
              <h2 className="text-xl font-semibold border-b pb-2 mb-4">
                {emailSubject || "Email Subject"}
              </h2>
              
              {imageUrl ? (
                <div className="relative mb-4">
                  <img 
                    src={imageUrl} 
                    alt="Generated marketing image" 
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <ImageGenerationProgress isGenerating={false} className="absolute bottom-2 left-2 right-2" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-full aspect-square bg-gray-100 text-gray-400 rounded-lg mb-4">
                  <Tablet className="mr-2" size={24} />
                  <span>Image Placeholder</span>
                </div>
              )}
              
              <div className="prose max-w-none">
                {emailBody ? (
                  <div dangerouslySetInnerHTML={{ __html: emailBody }} />
                ) : (
                  <p className="text-gray-500">Your generated email content will appear here</p>
                )}
              </div>
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
