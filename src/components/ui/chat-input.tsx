
import * as React from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

export interface ChatInputProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ className, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const form = e.currentTarget.form;
        if (form) {
          form.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
          );
        }
      }
    };

    React.useEffect(() => {
      // Safe check if ref is an object with current property
      if (ref && typeof ref === 'object' && ref.current) {
        const textarea = ref.current;
        textarea.style.height = "inherit";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [props.value, ref]);

    return (
      <Textarea
        ref={ref}
        onKeyDown={handleKeyDown}
        rows={1}
        className={cn(
          "min-h-[40px] w-full resize-none rounded-md border-0 p-3 shadow-none focus-visible:ring-0",
          className
        )}
        {...props}
      />
    );
  }
);

ChatInput.displayName = "ChatInput";

export { ChatInput };
