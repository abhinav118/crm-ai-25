
import React from 'react';
import { AiGenerationSection } from './AiGenerationSection';
import { Card } from '@/components/ui/card';
import { Smartphone } from 'lucide-react';

export const EmailCampaign: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-6">
        <AiGenerationSection
          title="AI EMAIL SUBJECT"
          description="Generate catchy email subject lines"
          type="email_subject"
          placeholder="Enter your email subject prompt"
          suggestions={[
            "Summer special menu launch at our Mexican restaurant",
            "Exclusive weekend dining experience",
            "New seasonal menu reveal"
          ]}
        />
        
        <AiGenerationSection
          title="AI EMAIL"
          description="Generate complete marketing email content"
          type="email"
          placeholder="Enter your email content prompt"
          suggestions={[
            "Promote our new summer menu with focus on fresh ingredients",
            "Special weekend brunch announcement",
            "Family dinner package promotion"
          ]}
        />
        
        <AiGenerationSection
          title="AI IMAGE"
          description="Generate marketing images for your email campaigns"
          type="image"
          placeholder="Enter your image prompt"
          suggestions={[
            "A colorful spread of Mexican dishes with summer cocktails",
            "Restaurant interior with happy diners",
            "Chef preparing signature dishes"
          ]}
        />
      </div>

      <div className="sticky top-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Email Preview</h3>
          <div className="mx-auto w-[320px] border-8 border-gray-800 rounded-3xl p-4 bg-white shadow-xl">
            <div className="w-16 h-1 bg-gray-800 rounded-full mx-auto mb-4"></div>
            <div id="email-preview" className="min-h-[600px] bg-gray-50 rounded-xl p-4">
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <p className="text-sm font-medium">Subject:</p>
                  <p className="text-sm text-gray-500">Generated subject will appear here</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Generated content will appear here</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
