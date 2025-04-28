
import React from 'react';
import { ImagePreview } from './ImagePreview';
import { Input } from '@/components/ui/input';

interface EmailPreviewProps {
  subject?: string;
  content?: string;
  image?: string;
  isGeneratingImage?: boolean;
  onSubjectChange?: (value: string) => void;
  onContentChange?: (value: string) => void;
}

export const EmailPreview: React.FC<EmailPreviewProps> = ({
  subject,
  content,
  image,
  isGeneratingImage,
  onSubjectChange,
  onContentChange
}) => {
  return (
    <div className="relative w-[768px] h-[1024px] bg-[#1C1C1E] rounded-[40px] p-[20px] shadow-2xl mx-auto">
      {/* iPad Camera */}
      <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[10px] h-[10px] bg-gray-800 rounded-full"></div>
      
      {/* iPad Screen */}
      <div className="w-full h-full bg-white rounded-[20px] overflow-hidden">
        {/* Email Client UI */}
        <div className="bg-gray-100 p-4 border-b">
          <Input
            value={subject || ''}
            onChange={(e) => onSubjectChange?.(e.target.value)}
            placeholder="Subject"
            className="font-medium mb-2"
          />
        </div>
        
        <div className="p-6 space-y-4">
          <ImagePreview 
            src={image}
            isLoading={isGeneratingImage}
            className="w-full max-w-[600px] mx-auto"
          />
          
          <div 
            className="prose prose-lg max-w-none"
            contentEditable
            onBlur={(e) => onContentChange?.(e.currentTarget.textContent || '')}
            dangerouslySetInnerHTML={{ __html: content || 'Your email content will appear here' }}
          />
        </div>
      </div>
    </div>
  );
};
