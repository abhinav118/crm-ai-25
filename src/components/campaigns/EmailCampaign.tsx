
import React from 'react';
import { AiGenerationSection } from './AiGenerationSection';

export const EmailCampaign: React.FC = () => {
  return (
    <div className="space-y-6">
      <AiGenerationSection
        title="AI EMAIL SUBJECT"
        description="Generate catchy email subject lines"
        type="email_subject"
        placeholder="Enter a prompt for your email subject line (e.g., 'Summer special menu launch at our Mexican restaurant')"
      />
      
      <AiGenerationSection
        title="AI EMAIL"
        description="Generate complete marketing email content"
        type="email"
        placeholder="Enter a prompt for your marketing email (e.g., 'Promote our new summer menu with focus on fresh ingredients and special margaritas')"
      />
      
      <AiGenerationSection
        title="AI IMAGE"
        description="Generate marketing images for your email campaigns"
        type="image"
        placeholder="Enter a prompt for your marketing image (e.g., 'A colorful spread of Mexican dishes with summer cocktails')"
      />
    </div>
  );
};
