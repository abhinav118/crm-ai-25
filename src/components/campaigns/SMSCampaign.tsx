
import React from 'react';
import { AiGenerationSection } from './AiGenerationSection';

export const SMSCampaign: React.FC = () => {
  return (
    <div className="space-y-6">
      <AiGenerationSection
        title="AI SMS"
        description="Generate engaging SMS marketing messages"
        type="sms"
        placeholder="Enter a prompt for your SMS marketing message (e.g., '20% off summer sale for our Mexican restaurant this weekend')"
      />
      
      <AiGenerationSection
        title="AI IMAGE"
        description="Generate marketing images for your SMS campaigns"
        type="image"
        placeholder="Enter a prompt for your marketing image (e.g., 'A delicious taco platter with summer themed decorations')"
      />
    </div>
  );
};
