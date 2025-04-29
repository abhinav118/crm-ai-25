
import React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ImageGenerationProgressProps {
  isGenerating: boolean;
  className?: string;
}

export const ImageGenerationProgress: React.FC<ImageGenerationProgressProps> = ({ 
  isGenerating,
  className
}) => {
  const [progress, setProgress] = React.useState(0);
  
  React.useEffect(() => {
    if (isGenerating) {
      // Reset progress when generation starts
      setProgress(0);
      
      // Simulate progress in stages (doesn't reflect actual generation process but gives visual feedback)
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90; // Stay at 90% until generation completes
          }
          return prev + Math.random() * 15; // Random increments for natural look
        });
      }, 800);
      
      return () => clearInterval(interval);
    } else if (progress > 0) {
      // When generation completes, fill to 100%
      setProgress(100);
      
      // Then reset after animation completes
      const timeout = setTimeout(() => {
        setProgress(0);
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [isGenerating]);
  
  if (progress === 0 && !isGenerating) return null;
  
  return (
    <div className={cn("w-full transition-opacity duration-500", className)}>
      <Progress 
        value={progress} 
        className="h-1.5 bg-gray-100"
      />
      <p className="text-xs text-gray-500 text-right mt-1">
        {isGenerating ? 'Generating image...' : 'Complete!'}
      </p>
    </div>
  );
};
