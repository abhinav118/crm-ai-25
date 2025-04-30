
import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, GripVertical, RotateCcw } from 'lucide-react';
import { ImageGenerationProgress } from '@/components/ui/image-generation-progress';
import { EmailSectionData } from './EmailBuilderCanvas';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmailSectionProps {
  section: EmailSectionData;
  onToggleEdit: (id: string) => void;
  onUpdatePrompt: (id: string, prompt: string) => void;
  onDelete: (id: string) => void;
  onReset: (id: string) => void;
  onRegenerate: (id: string) => void;
}

export const EmailSection: React.FC<EmailSectionProps> = ({
  section,
  onToggleEdit,
  onUpdatePrompt,
  onDelete,
  onReset,
  onRegenerate
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 9999 : 1,
  };

  const renderSectionContent = () => {
    switch (section.type) {
      case 'subject':
        return (
          <div className="font-bold text-lg">
            {section.content || 'Email Subject Line'}
          </div>
        );
      case 'image':
        return (
          <div className="relative">
            {section.imageUrl ? (
              <>
                <img 
                  src={section.imageUrl} 
                  alt="Email content" 
                  className="w-full rounded-md object-cover"
                  style={{ maxHeight: '300px' }}
                />
                {section.isGenerating && (
                  <div className="absolute inset-0 bg-black bg-opacity-30 rounded-md flex items-center justify-center">
                    <ImageGenerationProgress isGenerating={true} className="w-full" />
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-40 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                No image available
              </div>
            )}
          </div>
        );
      case 'copy':
        return (
          <div 
            className="prose prose-sm max-w-none" 
            dangerouslySetInnerHTML={{ __html: section.content || '<p>Email content goes here</p>' }}
          />
        );
      case 'button':
        return (
          <div className="flex flex-wrap gap-4 justify-center">
            {section.buttons && (
              <>
                <Button className="bg-green-600 hover:bg-green-700">
                  {section.buttons.primary.text}
                </Button>
                <Button variant="outline">
                  {section.buttons.secondary.text}
                </Button>
              </>
            )}
          </div>
        );
      case 'footer':
        return (
          <div 
            className="text-xs text-gray-500 text-center"
            dangerouslySetInnerHTML={{ __html: section.content || 'Email footer' }}
          />
        );
      default:
        return <div>Unknown section type</div>;
    }
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className={`relative ${section.isEditing ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-gray-200'}`}
    >
      {/* Drag handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab p-1 text-gray-400 hover:text-gray-600"
      >
        <GripVertical size={16} />
      </div>

      <CardContent className="p-4 pl-10">
        {/* Section content */}
        <div className="mb-2">
          {renderSectionContent()}
        </div>

        {/* Edit prompt section */}
        {section.isEditing && (
          <div className="mt-4 bg-blue-50 p-3 rounded-md">
            <div className="mb-2">
              <label className="text-sm font-medium block mb-1">
                Prompt for regenerating {section.type}:
              </label>
              {section.type === 'copy' ? (
                <Textarea
                  value={section.prompt || ''}
                  onChange={(e) => onUpdatePrompt(section.id, e.target.value)}
                  placeholder={`Describe how you want the ${section.type} to look...`}
                  className="w-full"
                  rows={2}
                />
              ) : (
                <Input
                  value={section.prompt || ''}
                  onChange={(e) => onUpdatePrompt(section.id, e.target.value)}
                  placeholder={`Describe how you want the ${section.type} to look...`}
                  className="w-full"
                />
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReset(section.id)}
              >
                <RotateCcw size={14} className="mr-1" /> Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleEdit(section.id)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => onRegenerate(section.id)}
                disabled={section.isGenerating || !section.prompt}
              >
                {section.isGenerating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                    <span>Generating...</span>
                  </>
                ) : (
                  'Regenerate'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Section controls */}
        <div className="absolute top-2 right-2 flex space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onToggleEdit(section.id)}
          >
            <Edit size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(section.id)}
          >
            <Trash2 size={14} />
          </Button>
        </div>

        {/* Section type indicator */}
        <div className="absolute top-2 left-10 text-xs text-gray-400 capitalize">
          {section.type}
        </div>
      </CardContent>
    </Card>
  );
};
