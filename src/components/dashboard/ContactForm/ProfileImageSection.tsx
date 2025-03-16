
import React from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus } from 'lucide-react';

const ProfileImageSection: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-lg">
      <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center">
        <ImagePlus className="w-8 h-8 text-gray-400" />
      </div>
      <Button type="button" variant="outline" size="sm">
        Upload Image
      </Button>
      <p className="text-xs text-gray-500">
        Recommended: 512x512px (Max 2MB)
      </p>
    </div>
  );
};

export default ProfileImageSection;
