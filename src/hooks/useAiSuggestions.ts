
import { useState, useEffect } from 'react';
import { useAiGeneration } from '@/hooks/useAiGeneration';
import { useToast } from '@/hooks/use-toast';

type SuggestionType = 'sms' | 'image' | 'email' | 'email_subject';

export const useAiSuggestions = (type: SuggestionType, prompt: string) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { generateContent } = useAiGeneration();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!prompt) return;
      
      setIsLoading(true);
      try {
        const result = await generateContent(prompt, type);
        if (result) {
          // Parse the result - expecting a JSON array or newline separated suggestions
          try {
            // First try to parse as JSON
            const parsedSuggestions = JSON.parse(result);
            if (Array.isArray(parsedSuggestions)) {
              setSuggestions(parsedSuggestions);
            } else if (typeof parsedSuggestions === 'object') {
              // If it's an object with suggestions property
              setSuggestions(parsedSuggestions.suggestions || []);
            }
          } catch (parseError) {
            // If not valid JSON, try to split by newlines
            const lines = result.split('\n').filter(line => line.trim() !== '');
            
            // Further clean up the lines (remove numbering, dashes, etc.)
            const cleanedLines = lines.map(line => {
              return line.replace(/^\d+[\.\)\-]\s*/, '').trim();
            }).filter(line => line);
            
            setSuggestions(cleanedLines);
          }
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        toast({
          title: 'Error fetching suggestions',
          description: 'Could not load AI suggestions. Using default suggestions instead.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [prompt, type, generateContent, toast]);

  return { suggestions, isLoading };
};
