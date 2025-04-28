
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader } from 'lucide-react';

interface ImagePreviewProps {
  src?: string;
  isLoading?: boolean;
  alt?: string;
  className?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  isLoading = false,
  alt = "Generated image",
  className = ""
}) => {
  if (isLoading) {
    return (
      <div className={`relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-2">
          <Loader className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-xs text-gray-500">Generating image...</p>
        </div>
      </div>
    );
  }

  if (!src) {
    return null;
  }

  return (
    <div className={`relative aspect-square w-full overflow-hidden rounded-lg ${className}`}>
      <img 
        src={src} 
        alt={alt}
        className="w-full h-full object-cover"
      />
    </div>
  );
};
