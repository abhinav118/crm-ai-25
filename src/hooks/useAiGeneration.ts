
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type GenerationType = 
  | 'sms' 
  | 'email' 
  | 'email_subject' 
  | 'blog' 
  | 'blog_header' 
  | 'blog_layout' 
  | 'image';

export const useAiGeneration = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateContent = async (prompt: string, type: GenerationType) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: apiError } = await supabase.functions.invoke('ai-generation', {
        body: { prompt, type }
      });

      if (apiError) {
        throw new Error(apiError.message || 'Failed to generate content');
      }

      if (data.error) {
        // Check if it's an OpenAI quota error
        if (data.error.includes("quota") || data.error.includes("exceeded")) {
          throw new Error("OpenAI API quota exceeded. Please try again later or check your API key limits.");
        }
        throw new Error(data.error);
      }

      setIsLoading(false);
      return data.result;
    } catch (err: any) {
      console.error('AI Generation error:', err);
      
      // Format the error message to be more user-friendly
      let errorMessage = err.message || 'An unexpected error occurred';
      
      // Special handling for quota errors
      if (errorMessage.includes("quota") || errorMessage.includes("exceeded")) {
        errorMessage = "AI Generation quota exceeded. Please try again later.";
      }
      
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      return null;
    }
  };

  return { generateContent, isLoading, error };
};
