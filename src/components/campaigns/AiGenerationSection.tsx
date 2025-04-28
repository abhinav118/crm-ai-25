
import React, { useState } from 'react';
import { Wand } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAiGeneration } from '@/hooks/useAiGeneration';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type AiGenerationType = 
  | 'sms' 
  | 'email' 
  | 'email_subject' 
  | 'blog' 
  | 'blog_header' 
  | 'blog_layout' 
  | 'image';

interface AiGenerationSectionProps {
  title: string;
  description: string;
  type: AiGenerationType;
  placeholder: string;
}

export const AiGenerationSection: React.FC<AiGenerationSectionProps> = ({
  title,
  description,
  type,
  placeholder,
}) => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const { generateContent, isLoading } = useAiGeneration();

  const handleGenerateContent = async () => {
    if (!prompt.trim()) return;
    
    const generatedContent = await generateContent(prompt, type);
    if (generatedContent) {
      setResult(generatedContent);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
    }
  };

  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            placeholder={placeholder}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          <Button
            onClick={handleGenerateContent}
            disabled={isLoading || !prompt.trim()}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <Wand size={16} />
                Generate
              </>
            )}
          </Button>
          
          {result && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-sm">Generated Content</h4>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  Copy
                </Button>
              </div>
              
              {type === 'image' ? (
                <div className="border rounded-md overflow-hidden">
                  <img 
                    src={result} 
                    alt="Generated image" 
                    className="w-full h-auto max-h-[300px] object-contain"
                  />
                </div>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md whitespace-pre-wrap">
                  {result}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
