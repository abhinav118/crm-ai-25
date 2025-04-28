
import React, { useState } from 'react';
import { ImagePreview } from './ImagePreview';
import { Input } from '@/components/ui/input';
import { Edit, TextCursor } from 'lucide-react';

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
  const [isEditing, setIsEditing] = useState(false);

  // Process the content to add proper styling if it exists
  const formattedContent = content ? content : 'Your email content will appear here';

  return (
    <div className="relative w-full max-w-[768px] mx-auto">
      {/* iPad Frame */}
      <div className="relative w-full bg-gray-800 rounded-[38px] p-3 pb-4 shadow-xl border-8 border-gray-800">
        {/* iPad Camera & Home Button */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-gray-900 rounded-full ring-1 ring-gray-700"></div>
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 bg-gray-900 rounded-full ring-1 ring-gray-700 flex items-center justify-center">
          <div className="w-3 h-3 border border-gray-700 rounded-sm"></div>
        </div>
        
        {/* iPad Screen */}
        <div className="w-full h-full bg-white rounded-[30px] overflow-hidden shadow-inner">
          {/* Email Client UI */}
          <div className="bg-gray-100 p-4 border-b flex items-center justify-between">
            <div className="relative w-full">
              <Input
                value={subject || ''}
                onChange={(e) => onSubjectChange?.(e.target.value)}
                placeholder="Subject"
                className="font-medium pr-12"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                <TextCursor size={16} />
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Image Display */}
            {(image || isGeneratingImage) && (
              <div className="flex justify-center">
                <ImagePreview 
                  src={image}
                  isLoading={isGeneratingImage}
                  className="max-h-[300px] w-auto max-w-full rounded-lg shadow-md"
                />
              </div>
            )}
            
            {/* Email Content */}
            <div className="relative email-content bg-white p-4 rounded-md border border-gray-200">
              <div 
                className={`prose prose-lg max-w-none ${isEditing ? 'border-2 border-blue-300 bg-blue-50 rounded-md p-2' : ''}`}
                contentEditable={true}
                suppressContentEditableWarning={true}
                onFocus={() => setIsEditing(true)}
                onBlur={(e) => {
                  setIsEditing(false);
                  onContentChange?.(e.currentTarget.innerHTML);
                }}
                dangerouslySetInnerHTML={{ __html: formattedContent }}
              />
              
              {/* Edit indicator */}
              <button 
                className={`absolute right-2 top-2 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors ${isEditing ? 'text-blue-500' : 'text-gray-500'}`}
                onClick={() => {
                  const contentElement = document.querySelector('.email-content .prose');
                  if (contentElement) {
                    contentElement.focus();
                  }
                }}
              >
                <Edit size={16} />
              </button>
            </div>
            
            {/* Email styling note */}
            <div className="text-xs text-gray-500 text-center mt-4">
              Click on the text to edit the content directly
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
