
import React, { useState } from 'react';
import { EmailPreview } from './EmailPreview';
import { useAiGeneration } from '@/hooks/useAiGeneration';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Edit,
  ImageIcon, 
  Type, 
  MousePointerClick, 
  Info, 
  RefreshCw, 
  Save,
  Check
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface EmailPreviewEditorProps {
  initialSubject?: string;
  initialContent?: string;
  initialImage?: string;
  onSave?: (emailData: {
    subject: string;
    content: string;
    image: string;
    ctaButtons: {
      primary: { text: string; url: string };
      secondary: { text: string; url: string };
    };
  }) => void;
}

export const EmailPreviewEditor: React.FC<EmailPreviewEditorProps> = ({
  initialSubject = 'Welcome to Taco Fiesta!',
  initialContent = '<p>We\'re excited to share our latest deals and menu items with you. Come visit us soon!</p>',
  initialImage = '',
  onSave
}) => {
  // Email content state
  const [subject, setSubject] = useState(initialSubject);
  const [content, setContent] = useState(initialContent);
  const [image, setImage] = useState(initialImage);
  const [ctaButtons, setCtaButtons] = useState({
    primary: { text: 'Order Now', url: '#order' },
    secondary: { text: 'View Menu', url: '#menu' }
  });
  const [footer, setFooter] = useState({
    address: '123 Flavor Street, Tastyville',
    socialLinks: true,
    additionalText: ''
  });
  
  // Editing state
  const [activeEditSection, setActiveEditSection] = useState<null | 'subject' | 'image' | 'content' | 'cta' | 'footer'>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Save campaign state
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignTags, setCampaignTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { generateContent } = useAiGeneration();
  const { toast } = useToast();

  const handleEditClick = (section: 'subject' | 'image' | 'content' | 'cta' | 'footer') => {
    setActiveEditSection(section);
    setEditPrompt('');
  };

  const cancelEditing = () => {
    setActiveEditSection(null);
    setEditPrompt('');
  };

  const handleRegenerateSection = async () => {
    if (!editPrompt || !activeEditSection) return;
    
    setIsGenerating(true);
    
    try {
      let result: string | null = null;
      let aiType: 'email_subject' | 'email' | 'image' = 'email';
      
      // Construct the prompt based on the section
      let enhancedPrompt = '';
      
      switch(activeEditSection) {
        case 'subject':
          enhancedPrompt = `Generate an email subject line based on this guidance: ${editPrompt}. The subject should be catchy and under 70 characters.`;
          aiType = 'email_subject';
          break;
        case 'image':
          enhancedPrompt = `Generate a restaurant marketing image for ${editPrompt} with a 1080x1080 aspect ratio`;
          aiType = 'image';
          break;
        case 'content':
          enhancedPrompt = `Generate an email body for a restaurant marketing email with these requirements: ${editPrompt}. Use HTML formatting with paragraphs (<p>), headings (<h2>), and bold text for emphasis.`;
          aiType = 'email';
          break;
        case 'cta':
          enhancedPrompt = `Generate two call-to-action button labels for a restaurant email with this context: ${editPrompt}. Format as JSON with "primary" and "secondary" properties, each with "text" and "url" fields.`;
          aiType = 'email';
          break;
        case 'footer':
          enhancedPrompt = `Generate a short restaurant email footer text based on this guidance: ${editPrompt}. Keep it professional and include any required legal text.`;
          aiType = 'email';
          break;
      }
      
      result = await generateContent(enhancedPrompt, aiType);
      
      if (result) {
        // Update the appropriate section
        switch(activeEditSection) {
          case 'subject':
            setSubject(result);
            break;
          case 'image':
            setImage(result);
            break;
          case 'content':
            // Ensure proper HTML formatting for content
            setContent(result);
            break;
          case 'cta':
            // Try to parse as JSON if it's the CTA section
            try {
              const jsonResult = JSON.parse(result);
              if (jsonResult.primary && jsonResult.secondary) {
                setCtaButtons(jsonResult);
              } else {
                // If JSON doesn't have the expected structure, make a best effort
                const lines = result.split('\n').filter(line => line.trim());
                if (lines.length >= 2) {
                  setCtaButtons({
                    primary: { text: lines[0].replace(/^[^a-zA-Z0-9]+/, ''), url: '#order' },
                    secondary: { text: lines[1].replace(/^[^a-zA-Z0-9]+/, ''), url: '#menu' }
                  });
                }
              }
            } catch (e) {
              // If not valid JSON, extract text that looks like button text
              const buttonMatches = result.match(/["']([^"']+)["']/g);
              if (buttonMatches && buttonMatches.length >= 2) {
                setCtaButtons({
                  primary: { 
                    text: buttonMatches[0].replace(/["']/g, ''), 
                    url: '#order' 
                  },
                  secondary: { 
                    text: buttonMatches[1].replace(/["']/g, ''), 
                    url: '#menu' 
                  }
                });
              }
            }
            break;
          case 'footer':
            setFooter({
              ...footer,
              additionalText: result
            });
            break;
        }
        
        // Close the edit section and show success toast
        setActiveEditSection(null);
        
        toast({
          title: 'Content updated',
          description: `Successfully regenerated the ${activeEditSection} content.`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Generation failed',
        description: error.message || 'Failed to generate content. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCampaign = () => {
    if (!campaignName) {
      toast({
        title: 'Campaign name required',
        description: 'Please enter a name for your campaign.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    
    // Simulate saving with a delay
    setTimeout(() => {
      if (onSave) {
        onSave({
          subject,
          content,
          image,
          ctaButtons
        });
      }
      
      toast({
        title: 'Campaign saved',
        description: 'Your email campaign has been saved successfully.',
      });
      
      setIsSaving(false);
      setIsSaveDialogOpen(false);
    }, 1000);
  };

  const renderEditPrompt = () => {
    if (!activeEditSection) return null;
    
    let title = '';
    let placeholder = '';
    
    switch(activeEditSection) {
      case 'subject':
        title = 'Edit Subject Line';
        placeholder = 'Describe the subject line you want (e.g. "Make it more exciting")';
        break;
      case 'image':
        title = 'Edit Image';
        placeholder = 'Describe what the image should look like (e.g. "tacos on a table with colorful decorations")';
        break;
      case 'content':
        title = 'Edit Email Body';
        placeholder = 'What should the email say? (e.g. "Focus more on the limited-time deal")';
        break;
      case 'cta':
        title = 'Edit Call-to-Action Buttons';
        placeholder = 'Describe the call to action (e.g. "Invite to RSVP" or "Make it playful")';
        break;
      case 'footer':
        title = 'Edit Footer';
        placeholder = 'How should the footer be styled or phrased? (e.g. "Make it shorter and friendly")';
        break;
    }
    
    return (
      <Card className="mb-4 bg-blue-50 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="w-full resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={cancelEditing}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRegenerateSection}
              disabled={!editPrompt || isGenerating}
              className="flex items-center gap-1"
            >
              {isGenerating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  <span>Regenerate</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Email Campaign Editor</h2>
        <Button 
          onClick={() => setIsSaveDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Save size={16} />
          Save Campaign
        </Button>
      </div>
      
      {activeEditSection === 'subject' && renderEditPrompt()}
      
      <Card className="mb-4">
        <CardHeader className="pb-2 pt-3 flex flex-row justify-between items-center">
          <div className="flex-1">
            <CardTitle className="text-md font-medium flex items-center gap-2">
              <Type size={14} />
              Subject Line
            </CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => handleEditClick('subject')}
          >
            <Edit size={14} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="font-medium text-md">{subject}</div>
        </CardContent>
      </Card>
      
      {activeEditSection === 'image' && renderEditPrompt()}
      
      <Card className="mb-4">
        <CardHeader className="pb-2 pt-3 flex flex-row justify-between items-center">
          <div className="flex-1">
            <CardTitle className="text-md font-medium flex items-center gap-2">
              <ImageIcon size={14} />
              Email Image
            </CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => handleEditClick('image')}
          >
            <Edit size={14} />
          </Button>
        </CardHeader>
        <CardContent>
          {image ? (
            <div className="aspect-video relative rounded-md overflow-hidden bg-gray-100">
              <img 
                src={image} 
                alt="Email header" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video flex items-center justify-center bg-gray-100 rounded-md text-gray-400">
              <div className="text-center">
                <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                <p>No image added yet</p>
                <p className="text-xs">Click edit to generate an image</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {activeEditSection === 'content' && renderEditPrompt()}
      
      <Card className="mb-4">
        <CardHeader className="pb-2 pt-3 flex flex-row justify-between items-center">
          <div className="flex-1">
            <CardTitle className="text-md font-medium flex items-center gap-2">
              <Info size={14} />
              Email Content
            </CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => handleEditClick('content')}
          >
            <Edit size={14} />
          </Button>
        </CardHeader>
        <CardContent>
          <div 
            className="prose prose-sm max-w-none p-4 border border-gray-200 rounded-md bg-white min-h-[150px]"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </CardContent>
      </Card>
      
      {activeEditSection === 'cta' && renderEditPrompt()}
      
      <Card className="mb-4">
        <CardHeader className="pb-2 pt-3 flex flex-row justify-between items-center">
          <div className="flex-1">
            <CardTitle className="text-md font-medium flex items-center gap-2">
              <MousePointerClick size={14} />
              Call-to-Action Buttons
            </CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => handleEditClick('cta')}
          >
            <Edit size={14} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="p-4 border border-gray-200 rounded-md bg-gray-50 flex-1">
              <div className="font-medium mb-1 text-sm text-gray-600">Primary Button</div>
              <div className="flex flex-col gap-1">
                <Button className="bg-green-600 hover:bg-green-700">
                  {ctaButtons.primary.text}
                </Button>
                <span className="text-xs text-gray-500 mt-1">URL: {ctaButtons.primary.url}</span>
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-md bg-gray-50 flex-1">
              <div className="font-medium mb-1 text-sm text-gray-600">Secondary Button</div>
              <div className="flex flex-col gap-1">
                <Button variant="outline">
                  {ctaButtons.secondary.text}
                </Button>
                <span className="text-xs text-gray-500 mt-1">URL: {ctaButtons.secondary.url}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {activeEditSection === 'footer' && renderEditPrompt()}
      
      <Card className="mb-4">
        <CardHeader className="pb-2 pt-3 flex flex-row justify-between items-center">
          <div className="flex-1">
            <CardTitle className="text-md font-medium flex items-center gap-2">
              <Info size={14} />
              Email Footer
            </CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => handleEditClick('footer')}
          >
            <Edit size={14} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-gray-500 border-t pt-3 pb-2 px-3 bg-gray-50 rounded-md">
            <p className="mb-2">🌮 Taco Fiesta | {footer.address}</p>
            {footer.additionalText && <p className="mb-2">{footer.additionalText}</p>}
            <p>
              <a href="#" className="underline text-blue-500">Unsubscribe</a> | 
              <a href="#" className="underline text-blue-500 ml-1">Privacy Policy</a>
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-6 mb-8">
        <h3 className="text-lg font-medium mb-3">Preview</h3>
        <div className="border rounded-md p-4 bg-gray-50">
          <EmailPreview 
            subject={subject}
            content={content}
            image={image}
            isGeneratingImage={false}
            onSubjectChange={setSubject}
            onContentChange={setContent}
            onRegenerate={async (section, prompt) => {
              handleEditClick(section);
              setEditPrompt(prompt);
              await handleRegenerateSection();
            }}
          />
        </div>
      </div>
      
      {/* Save Campaign Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Campaign</DialogTitle>
            <DialogDescription>
              Enter the details to save your email campaign.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                placeholder="Summer Promotion 2025"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                placeholder="promotion, summer, discount"
                value={campaignTags}
                onChange={(e) => setCampaignTags(e.target.value)}
              />
              <p className="text-xs text-gray-500">Separate tags with commas</p>
            </div>
            
            <div className="space-y-2">
              <Label>Email Preview</Label>
              <div className="border rounded-md p-3 bg-gray-50 text-sm">
                <p><strong>Subject:</strong> {subject}</p>
                <p><strong>Content Length:</strong> {content.length} characters</p>
                <p><strong>CTA Buttons:</strong> {ctaButtons.primary.text}, {ctaButtons.secondary.text}</p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCampaign} disabled={isSaving || !campaignName}>
              {isSaving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} className="mr-2" />
                  Save Campaign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
