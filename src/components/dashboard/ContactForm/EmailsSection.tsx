
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash } from 'lucide-react';

interface EmailsSectionProps {
  emails: string[];
  onEmailChange: (index: number, value: string) => void;
  onAddEmail: () => void;
  onRemoveEmail: (index: number) => void;
}

const EmailsSection: React.FC<EmailsSectionProps> = ({
  emails,
  onEmailChange,
  onAddEmail,
  onRemoveEmail
}) => {
  return (
    <div className="space-y-2">
      <Label>Email Addresses</Label>
      {emails.map((email, index) => (
        <div key={index} className="flex gap-2">
          <Input
            placeholder="Email address"
            value={email}
            onChange={(e) => onEmailChange(index, e.target.value)}
          />
          {emails.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemoveEmail(index)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAddEmail}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" /> Add Another Email
      </Button>
    </div>
  );
};

export default EmailsSection;
