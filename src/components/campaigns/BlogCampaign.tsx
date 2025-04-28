
import React from 'react';
import { AiGenerationSection } from './AiGenerationSection';

export const BlogCampaign: React.FC = () => {
  return (
    <div className="space-y-6">
      <AiGenerationSection
        title="AI CONTENT HEADER"
        description="Generate catchy blog headlines"
        type="blog_header"
        placeholder="Enter a prompt for your blog headline (e.g., 'The authentic flavors of Mexico in our summer menu')"
      />
      
      <AiGenerationSection
        title="AI LAYOUT"
        description="Generate a suggested blog structure and layout"
        type="blog_layout"
        placeholder="Enter a prompt for your blog layout (e.g., 'A blog post about the history of tacos and our restaurant's authentic approach')"
      />
      
      <AiGenerationSection
        title="AI CONTENT"
        description="Generate complete blog content"
        type="blog"
        placeholder="Enter a prompt for your blog content (e.g., 'Write a blog about the health benefits of fresh ingredients in Mexican cuisine')"
      />
      
      <AiGenerationSection
        title="AI IMAGES"
        description="Generate images for your blog posts"
        type="image"
        placeholder="Enter a prompt for your blog image (e.g., 'A chef preparing authentic Mexican tacos in a restaurant kitchen')"
      />
    </div>
  );
};
