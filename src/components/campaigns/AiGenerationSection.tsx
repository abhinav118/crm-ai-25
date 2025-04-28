
import React, { useState } from 'react';
import { Wand } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAiGeneration } from '@/hooks/useAiGeneration';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type AiGenerationType = 
  | 'sms' 
  | 'email' 
  | 'email_subject' 
  | 'image';

interface AiGenerationSectionProps {
  title: string;
  description: string;
  type: AiGenerationType;
  placeholder: string;
  suggestions?: string[];
  onGenerated?: (content: string) => void;
}

export const AiGenerationSection: React.FC<AiGenerationSectionProps> = ({
  title,
  description,
  type,
  placeholder,
  suggestions = [],
  onGenerated
}) => {
  const [prompt, setPrompt] = useState('');
  const { generateContent, isLoading } = useAiGeneration();

  const handleGenerateContent = async () => {
    if (!prompt.trim()) return;
    
    const generatedContent = await generateContent(prompt, type);
    if (generatedContent) {
      onGenerated?.(generatedContent);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            placeholder={placeholder}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={1}
            className="resize-none"
          />
          
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setPrompt(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          <Button
            onClick={handleGenerateContent}
            disabled={isLoading || !prompt.trim()}
            className="w-full flex items-center gap-2"
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
        </div>
      </CardContent>
    </Card>
  );
};
