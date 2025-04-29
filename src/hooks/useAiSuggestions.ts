
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type SuggestionType = 
  | 'sms_text' 
  | 'sms_image' 
  | 'email_subject' 
  | 'email_content' 
  | 'email_image';

interface UseAiSuggestionsOptions {
  initialLoad?: boolean;
  brandType?: string;
}

export const useAiSuggestions = (
  type: SuggestionType,
  defaultSuggestions: string[] = [],
  options: UseAiSuggestionsOptions = {}
) => {
  const { initialLoad = true, brandType = "Mexican Fast Casual" } = options;
  
  const [suggestions, setSuggestions] = useState<string[]>(defaultSuggestions);
  const [isLoading, setIsLoading] = useState<boolean>(initialLoad);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Load suggestions function with retry logic
  const loadSuggestions = async (retryCount = 0, maxRetries = 3) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching ${type} suggestions for ${brandType}...`);
      const { data, error: apiError } = await supabase.functions.invoke('ai-suggestions', {
        body: { type, brand: brandType }
      });
      
      if (apiError) {
        console.error(`API Error:`, apiError);
        throw new Error(apiError.message || 'Failed to load suggestions');
      }
      
      console.log(`Received suggestions for ${type}:`, data);
      
      if (data?.suggestions?.length > 0) {
        setSuggestions(data.suggestions);
      } else {
        // Fall back to default suggestions if API returns empty array
        console.log(`Empty suggestions received, using defaults for ${type}`);
        setSuggestions(defaultSuggestions);
      }
      
      setIsLoading(false);
    } catch (err: any) {
      console.error(`Error loading ${type} suggestions:`, err);
      
      // Implement retry logic with exponential backoff
      if (retryCount < maxRetries) {
        const backoffTime = Math.pow(2, retryCount) * 1000; // exponential backoff
        console.log(`Retrying in ${backoffTime}ms... (Attempt ${retryCount + 1} of ${maxRetries})`);
        
        setTimeout(() => {
          loadSuggestions(retryCount + 1, maxRetries);
        }, backoffTime);
      } else {
        // After all retries failed
        setError(err.message || 'Failed to load suggestions');
        setSuggestions(defaultSuggestions); // Fall back to default suggestions
        
        toast({
          title: "Couldn't load AI suggestions",
          description: "Using default suggestions instead. You can try again later.",
          variant: "destructive",
        });
        
        setIsLoading(false);
      }
    }
  };
  
  // Load suggestions on mount if initialLoad is true
  useEffect(() => {
    if (initialLoad) {
      loadSuggestions();
    }
  }, [type, brandType]); // Reload if type or brandType changes
  
  return {
    suggestions,
    isLoading,
    error,
    loadSuggestions,
    setSuggestions
  };
};
