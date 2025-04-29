
import React, { useState } from 'react';
import { ImagePreview } from './ImagePreview';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, TextCursor, Instagram, Facebook, Mail, Share } from 'lucide-react';
import { ImageGenerationProgress } from '@/components/ui/image-generation-progress';
import { useToast } from '@/hooks/use-toast';

interface EmailPreviewProps {
  subject?: string;
  content?: string;
  image?: string;
  isGeneratingImage?: boolean;
  onSubjectChange?: (value: string) => void;
  onContentChange?: (value: string) => void;
  onRegenerate?: (section: 'subject' | 'content', prompt: string) => Promise<void>;
  ctaButtons?: {
    primary: { text: string; url: string };
    secondary: { text: string; url: string };
  };
  footerAddress?: string;
  footerAdditionalText?: string;
}

export const EmailPreview: React.FC<EmailPreviewProps> = ({
  subject,
  content,
  image,
  isGeneratingImage,
  onSubjectChange,
  onContentChange,
  onRegenerate,
  ctaButtons = {
    primary: { text: 'Order Now', url: '#' },
    secondary: { text: 'View Menu', url: '#' }
  },
  footerAddress = '123 Flavor Street, Tastyville',
  footerAdditionalText = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [editingSection, setEditingSection] = useState<'subject' | 'content' | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  // Format the email content to ensure proper rendering
  const formatEmailContent = (content: string | undefined): string => {
    if (!content) return 'Your email content will appear here';
    
    // Ensure proper paragraph formatting
    let formatted = content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br />');
    
    // Wrap in paragraph tags if not already
    if (!formatted.startsWith('<p>')) {
      formatted = `<p>${formatted}</p>`;
    }
    
    // Style headings and important text
    formatted = formatted
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/#{2}\s(.*?)(?:\n|$)/g, '<h2 class="text-xl font-bold my-3">$1</h2>')
      .replace(/#{1}\s(.*?)(?:\n|$)/g, '<h1 class="text-2xl font-bold my-4">$1</h1>');
      
    return formatted;
  };

  const handleRegenerateClick = async (section: 'subject' | 'content') => {
    if (!editPrompt || !onRegenerate) return;
    
    setIsRegenerating(true);
    
    try {
      await onRegenerate(section, editPrompt);
      toast({
        title: 'Content updated',
        description: `Successfully regenerated the ${section === 'subject' ? 'subject line' : 'email content'}.`,
      });
    } catch (error: any) {
      console.error('Error regenerating content:', error);
      toast({
        title: 'Generation failed',
        description: error.message || 'There was a problem generating the content. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsRegenerating(false);
      setEditingSection(null);
    }
  };

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
                placeholder="Subject Line"
                className="font-medium pr-12"
              />
              <div 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => {
                  setEditingSection('subject');
                  setEditPrompt('');
                }}
              >
                <TextCursor size={16} />
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6 overflow-y-auto" style={{maxHeight: 'calc(100% - 56px)'}}>
            {/* Edit Subject Prompt Section */}
            {editingSection === 'subject' && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <h4 className="text-sm font-medium mb-2">Regenerate Subject Line</h4>
                <div className="space-y-3">
                  <Input
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Describe the subject line you want (e.g., 'Make it more exciting')"
                    className="w-full"
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingSection(null)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleRegenerateClick('subject')}
                      disabled={!editPrompt || isRegenerating}
                      className="relative"
                    >
                      {isRegenerating ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                          Regenerating...
                        </>
                      ) : (
                        'Regenerate'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Email Header Branding */}
            <div className="text-center mb-6 py-3 border-b border-gray-200">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mx-auto flex items-center justify-center mb-3">
                <span className="text-3xl">🌮</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Taco Fiesta</h1>
              <p className="text-sm text-gray-500">Authentic Mexican Flavors</p>
            </div>
            
            {/* Image Display */}
            {(image || isGeneratingImage) && (
              <div className="flex justify-center">
                <div className="relative w-full">
                  <ImagePreview 
                    src={image}
                    isLoading={isGeneratingImage}
                    className="w-full aspect-square object-cover max-h-[400px] rounded-lg shadow-md"
                  />
                  {isGeneratingImage && (
                    <ImageGenerationProgress 
                      isGenerating={true} 
                      className="absolute bottom-2 left-2 right-2" 
                    />
                  )}
                </div>
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
                dangerouslySetInnerHTML={{ __html: formatEmailContent(content) }}
              />
              
              {/* Edit indicator */}
              <button 
                className={`absolute right-2 top-2 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors ${isEditing ? 'text-blue-500' : 'text-gray-500'}`}
                onClick={() => {
                  if (!isEditing) {
                    const contentElement = document.querySelector('.email-content .prose');
                    if (contentElement) {
                      // Cast to HTMLElement to use the focus() method
                      (contentElement as HTMLElement).focus();
                    }
                  } else {
                    setEditingSection('content');
                    setEditPrompt('');
                  }
                }}
              >
                <Edit size={16} />
              </button>
            </div>
            
            {/* Edit Body Prompt Section */}
            {editingSection === 'content' && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <h4 className="text-sm font-medium mb-2">Regenerate Email Content</h4>
                <div className="space-y-3">
                  <Input
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Describe what you want (e.g., 'Focus on weekend specials')"
                    className="w-full"
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingSection(null)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleRegenerateClick('content')}
                      disabled={!editPrompt || isRegenerating}
                      className="relative"
                    >
                      {isRegenerating ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                          Regenerating...
                        </>
                      ) : (
                        'Regenerate'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Call To Action Buttons */}
            <div className="flex flex-wrap gap-4 mt-6 justify-center">
              <a href={ctaButtons.primary.url} className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition-colors">
                {ctaButtons.primary.text}
              </a>
              <a href={ctaButtons.secondary.url} className="border border-gray-400 px-6 py-3 rounded-md text-gray-800 hover:bg-gray-50 transition-colors">
                {ctaButtons.secondary.text}
              </a>
            </div>
            
            {/* Email Footer */}
            <div className="mt-8 text-xs text-gray-500 border-t pt-4">
              <div className="flex justify-between items-center">
                <div>
                  🌮 Taco Fiesta | {footerAddress}<br />
                  {footerAdditionalText && <div className="mb-1">{footerAdditionalText}</div>}
                  <a href="#" className="underline text-blue-500">Unsubscribe</a> | 
                  <a href="#" className="underline text-blue-500 ml-1">Privacy Policy</a>
                </div>
                <div className="flex space-x-2">
                  <a href="#" className="p-1 rounded-full hover:bg-gray-100">
                    <Instagram size={16} />
                  </a>
                  <a href="#" className="p-1 rounded-full hover:bg-gray-100">
                    <Facebook size={16} />
                  </a>
                </div>
              </div>
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
