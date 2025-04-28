
import React from 'react';
import { AiGenerationSection } from './AiGenerationSection';
import { Card } from '@/components/ui/card';
import { Smartphone } from 'lucide-react';

export const SMSCampaign: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-6">
        <AiGenerationSection
          title="AI SMS"
          description="Generate engaging SMS marketing messages"
          type="sms"
          placeholder="Enter your SMS marketing message prompt"
          suggestions={[
            "20% off summer sale for our Mexican restaurant this weekend",
            "Buy one get one free lunch special today",
            "Join us for happy hour, 2-for-1 margaritas"
          ]}
        />
        
        <AiGenerationSection
          title="AI IMAGE"
          description="Generate marketing images for your SMS campaigns"
          type="image"
          placeholder="Enter your marketing image prompt"
          suggestions={[
            "A delicious taco platter with summer themed decorations",
            "Colorful Mexican street food display",
            "Fresh guacamole and chips presentation"
          ]}
        />
      </div>

      <div className="sticky top-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">SMS Preview</h3>
          <div className="mx-auto w-[320px] border-8 border-gray-800 rounded-3xl p-4 bg-white shadow-xl">
            <div className="w-16 h-1 bg-gray-800 rounded-full mx-auto mb-4"></div>
            <div id="sms-preview" className="min-h-[400px] bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Generated content will appear here</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
