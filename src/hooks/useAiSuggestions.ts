
import { useState, useEffect, useRef } from 'react';
import { useAiGeneration } from '@/hooks/useAiGeneration';
import { useToast } from '@/hooks/use-toast';

type SuggestionType = 'sms' | 'image' | 'email' | 'email_subject';

export const useAiSuggestions = (type: SuggestionType, prompt: string, defaultSuggestions: string[] = []) => {
  const [suggestions, setSuggestions] = useState<string[]>(defaultSuggestions);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const { generateContent } = useAiGeneration();
  const { toast } = useToast();
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout when prompt or type changes
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    const fetchSuggestions = async () => {
      if (!prompt) return;
      
      setIsLoading(true);
      setHasAttemptedFetch(true);
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
      } catch (error: any) {
        console.error('Error fetching suggestions:', error);
        
        // Only show toast on first attempt
        if (!hasAttemptedFetch) {
          toast({
            title: 'Using default suggestions',
            description: 'AI suggestions are currently unavailable. Using default suggestions instead.',
            variant: 'default',
          });
        }
        
        // If error includes rate limit message, we'll retry after a delay
        if (error.message && (
            error.message.includes('rate limit') || 
            error.message.includes('Rate limit') ||
            error.message.includes('Edge Function')
          )) {
          console.log('Rate limit error detected, will retry in 5s');
          retryTimeoutRef.current = setTimeout(() => {
            console.log('Retrying AI suggestion fetch');
            fetchSuggestions();
          }, 5000); // Retry after 5 seconds
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
    
    // Clean up timeout on component unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [prompt, type, generateContent, toast, hasAttemptedFetch]);

  return { suggestions, isLoading };
};
