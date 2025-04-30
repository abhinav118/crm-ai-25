
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';

import { EmailSection } from './EmailSection';
import { useAiGeneration } from '@/hooks/useAiGeneration';
import { useToast } from '@/hooks/use-toast';

export type SectionType = 'subject' | 'image' | 'copy' | 'button' | 'footer';

export interface EmailSectionData {
  id: string;
  type: SectionType;
  content: string;
  imageUrl?: string;
  buttons?: {
    primary: { text: string; url: string };
    secondary: { text: string; url: string };
  };
  prompt?: string;
  isEditing?: boolean;
  isGenerating?: boolean;
}

interface EmailBuilderCanvasProps {
  initialSections?: EmailSectionData[];
  onSave?: (sections: EmailSectionData[]) => void;
}

export const EmailBuilderCanvas: React.FC<EmailBuilderCanvasProps> = ({
  initialSections,
  onSave
}) => {
  // Default email sections
  const defaultSections: EmailSectionData[] = [
    {
      id: "email-subject",
      type: "subject",
      content: "🌮 Dive Into Taco Tuesday!",
      prompt: ""
    },
    {
      id: "email-image",
      type: "image",
      content: "",
      imageUrl: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?q=80&w=1000",
      prompt: ""
    },
    {
      id: "email-copy",
      type: "copy",
      content: "<p>Join us for 2-for-1 Al Pastor tacos every Tuesday! Our chef has prepared a special menu featuring authentic Mexican flavors that will transport you straight to the streets of Mexico City.</p><p>We're also introducing our new house-made salsas and fresh guacamole prepared tableside!</p>",
      prompt: ""
    },
    {
      id: "email-cta",
      type: "button",
      content: "",
      buttons: {
        primary: { text: "Order Now", url: "#" },
        secondary: { text: "View Menu", url: "#" }
      },
      prompt: ""
    },
    {
      id: "email-footer",
      type: "footer",
      content: "Taco Fiesta 🌮 | 123 Flavor Street, Tastyville | <a href='#'>Unsubscribe</a>",
      prompt: ""
    }
  ];

  const [sections, setSections] = useState<EmailSectionData[]>(initialSections || defaultSections);
  const { generateContent, isLoading } = useAiGeneration();
  const { toast } = useToast();

  // Set up DnD sensors for drag interactions
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Toggle editing state for a section
  const toggleEditing = (id: string) => {
    setSections(sections.map(section => 
      section.id === id ? { ...section, isEditing: !section.isEditing, prompt: "" } : section
    ));
  };

  // Update prompt for a section
  const updatePrompt = (id: string, prompt: string) => {
    setSections(sections.map(section => 
      section.id === id ? { ...section, prompt } : section
    ));
  };

  // Delete a section
  const deleteSection = (id: string) => {
    setSections(sections.filter(section => section.id !== id));
  };

  // Reset a section to its default state
  const resetSection = (id: string) => {
    const defaultSection = defaultSections.find(section => section.id === id);
    if (defaultSection) {
      setSections(sections.map(section => 
        section.id === id ? { ...defaultSection, isEditing: false } : section
      ));
    }
  };

  // Regenerate content for a section using AI
  const regenerateSection = async (id: string) => {
    const section = sections.find(s => s.id === id);
    
    if (!section || !section.prompt) {
      toast({
        title: "Empty prompt",
        description: "Please enter a prompt to regenerate content.",
        variant: "destructive"
      });
      return;
    }
    
    // Mark the section as generating
    setSections(sections.map(s => 
      s.id === id ? { ...s, isGenerating: true } : s
    ));
    
    try {
      // Construct the prompt based on the section type
      const sectionType = section.type === 'subject' ? 'email_subject' : 
                          section.type === 'image' ? 'image' : 'email';
      
      // Create a tailored prompt based on section type
      let enhancedPrompt = '';
      switch(section.type) {
        case 'subject':
          enhancedPrompt = `Generate an email subject line based on this guidance: ${section.prompt}. Make it catchy and under 70 characters.`;
          break;
        case 'image':
          enhancedPrompt = `Generate a restaurant marketing image for ${section.prompt} with a 1080x1080 aspect ratio`;
          break;
        case 'copy':
          enhancedPrompt = `Generate an email body paragraph for a restaurant marketing email with these requirements: ${section.prompt}. Format with HTML paragraphs (<p> tags).`;
          break;
        case 'button':
          enhancedPrompt = `Generate two call-to-action button labels for a restaurant email with this context: ${section.prompt}. Format as JSON with "primary" and "secondary" properties, each with "text" and "url" fields.`;
          break;
        case 'footer':
          enhancedPrompt = `Generate a short restaurant email footer text based on this guidance: ${section.prompt}. Include an unsubscribe link.`;
          break;
      }
      
      // Generate the content
      const result = await generateContent(enhancedPrompt, sectionType as any);
      
      if (result) {
        // Parse and update the section based on its type
        if (section.type === 'button') {
          try {
            // Try to parse as JSON for button content
            const jsonResult = JSON.parse(result);
            if (jsonResult.primary && jsonResult.secondary) {
              setSections(sections.map(s => 
                s.id === id ? { 
                  ...s, 
                  buttons: jsonResult,
                  isGenerating: false,
                  isEditing: false 
                } : s
              ));
            } else {
              throw new Error("Invalid button format");
            }
          } catch (e) {
            // If not valid JSON, make best effort to extract button text
            const buttonMatches = result.match(/["']([^"']+)["']/g);
            if (buttonMatches && buttonMatches.length >= 2) {
              setSections(sections.map(s => 
                s.id === id ? { 
                  ...s, 
                  buttons: {
                    primary: { text: buttonMatches[0].replace(/["']/g, ''), url: "#" },
                    secondary: { text: buttonMatches[1].replace(/["']/g, ''), url: "#" }
                  },
                  isGenerating: false,
                  isEditing: false 
                } : s
              ));
            } else {
              throw new Error("Could not extract button text");
            }
          }
        } else if (section.type === 'image') {
          setSections(sections.map(s => 
            s.id === id ? { 
              ...s, 
              imageUrl: result,
              isGenerating: false,
              isEditing: false 
            } : s
          ));
        } else {
          // For all other text-based content
          setSections(sections.map(s => 
            s.id === id ? { 
              ...s, 
              content: result,
              isGenerating: false,
              isEditing: false 
            } : s
          ));
        }
        
        toast({
          title: "Content updated",
          description: `Successfully regenerated the ${section.type} section.`,
        });
      }
    } catch (error: any) {
      console.error("Error regenerating content:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate content. Please try again.",
        variant: "destructive"
      });
      
      // Reset the generating state
      setSections(sections.map(s => 
        s.id === id ? { ...s, isGenerating: false } : s
      ));
    }
  };

  // Save the current sections configuration
  const handleSave = () => {
    if (onSave) {
      onSave(sections);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="w-full max-w-[768px] mx-auto bg-white border rounded-lg p-6 shadow-sm">
          <SortableContext 
            items={sections.map(section => section.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {sections.map(section => (
                <EmailSection
                  key={section.id}
                  section={section}
                  onToggleEdit={toggleEditing}
                  onUpdatePrompt={updatePrompt}
                  onDelete={deleteSection}
                  onReset={resetSection}
                  onRegenerate={regenerateSection}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
};
