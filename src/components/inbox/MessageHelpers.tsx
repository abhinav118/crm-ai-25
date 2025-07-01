
import React, { useState, useRef } from 'react';
import { Smile, Paperclip, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import EmojiPicker from '@emoji-mart/react';
import data from '@emoji-mart/data';

interface MessageHelpersProps {
  onEmojiSelect: (emoji: string) => void;
  onImageUpload: (imageUrl: string) => void;
  onLinkInsert: (linkText: string) => void;
}

export const MessageHelpers: React.FC<MessageHelpersProps> = ({
  onEmojiSelect,
  onImageUpload,
  onLinkInsert
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleEmojiSelect = (emoji: any) => {
    onEmojiSelect(emoji.native);
    setShowEmojiPicker(false);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a JPEG or PNG image file.',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 1MB.',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Image = base64String.split(',')[1]; // Remove data:image/... part

        // Upload to Cloudinary
        const { data, error } = await supabase.functions.invoke('upload-to-cloudinary', {
          body: { base64Image }
        });

        if (error || !data?.success) {
          throw new Error(data?.error || 'Upload failed');
        }

        onImageUpload(data.media_url);
        toast({
          title: 'Image uploaded',
          description: 'Image has been attached to your message.'
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLinkSubmit = () => {
    if (!linkText.trim() || !linkUrl.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter both link text and URL.',
        variant: 'destructive'
      });
      return;
    }

    // Format the link text
    const formattedLink = `${linkText.trim()} (${linkUrl.trim()})`;
    onLinkInsert(formattedLink);
    
    // Reset form
    setLinkText('');
    setLinkUrl('');
    setLinkDialogOpen(false);
    
    toast({
      title: 'Link inserted',
      description: 'Link has been added to your message.'
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Emoji Picker */}
      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="text-gray-500 hover:text-gray-700"
        >
          <Smile className="h-4 w-4" />
        </Button>
        
        {showEmojiPicker && (
          <div className="absolute bottom-12 left-0 z-50">
            <div className="bg-white rounded-lg shadow-lg border">
              <EmojiPicker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="light"
                set="native"
                previewPosition="none"
                skinTonePosition="none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Image Upload */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleImageClick}
        disabled={isUploading}
        className="text-gray-500 hover:text-gray-700"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        className="hidden"
        onChange={handleImageSelect}
      />

      {/* Link Insertion */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            <Link className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-text">Link Text</Label>
              <Input
                id="link-text"
                placeholder="Enter link text..."
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleLinkSubmit}>
                Insert Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Overlay to close emoji picker when clicking outside */}
      {showEmojiPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
};
