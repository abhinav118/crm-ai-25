
import React, { useState, useEffect } from 'react';
import { Wand } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAiGeneration } from '@/hooks/useAiGeneration';
import { useAiSuggestions } from '@/hooks/useAiSuggestions';
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
  suggestionPrompt?: string;
  suggestions?: string[];
  onGenerated?: (content: string) => void;
  onGenerating?: () => void;
}

export const AiGenerationSection: React.FC<AiGenerationSectionProps> = ({
  title,
  description,
  type,
  placeholder,
  suggestionPrompt,
  suggestions: defaultSuggestions = [],
  onGenerated,
  onGenerating
}) => {
  const [prompt, setPrompt] = useState('');
  const { generateContent, isLoading } = useAiGeneration();
  
  // Get dynamic suggestions if a suggestionPrompt is provided
  const { suggestions: aiSuggestions, isLoading: isSuggestionsLoading } = 
    suggestionPrompt ? useAiSuggestions(type, suggestionPrompt, defaultSuggestions) : { suggestions: defaultSuggestions, isLoading: false };
  
  // Use AI-generated suggestions if available, otherwise use default suggestions
  const displayedSuggestions = aiSuggestions.length > 0 ? aiSuggestions : defaultSuggestions;

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
          
          {displayedSuggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {isSuggestionsLoading ? (
                  // Show skeleton UI while loading suggestions
                  Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton 
                      key={index}
                      className="h-8 w-40 rounded-full"
                    />
                  ))
                ) : (
                  displayedSuggestions.slice(0, 3).map((suggestion, index) => (
                    <PromptSuggestion
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setPrompt(suggestion)}
                      className="text-xs px-3 py-2 rounded-full text-left hover:bg-gray-100"
                    >
                      {suggestion}
                    </PromptSuggestion>
                  ))
                )}
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
