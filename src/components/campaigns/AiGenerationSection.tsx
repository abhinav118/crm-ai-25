
import React, { useState } from 'react';
import { Wand } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAiGeneration } from '@/hooks/useAiGeneration';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PromptSuggestion } from '@/components/ui/prompt-suggestion';

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
  loadingSuggestions?: boolean;
  onGenerated?: (content: string) => void;
  onGenerating?: () => void;
}

export const AiGenerationSection: React.FC<AiGenerationSectionProps> = ({
  title,
  description,
  type,
  placeholder,
  suggestions = [],
  loadingSuggestions = false,
  onGenerated,
  onGenerating
}) => {
  const [prompt, setPrompt] = useState('');
  const { generateContent, isLoading } = useAiGeneration();

  const handleGenerateContent = async () => {
    if (!prompt.trim()) return;
    
    // Notify that generation is starting
    onGenerating?.();
    
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
          
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Suggestions:</p>
            {loadingSuggestions ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : suggestions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <PromptSuggestion
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setPrompt(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </PromptSuggestion>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">
                No suggestions available
              </div>
            )}
          </div>
          
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
