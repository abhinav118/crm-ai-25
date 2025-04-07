
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChatMessageListProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
  ({ className, children, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const mergedRef = React.useMemo(
      () => (ref ? ref : containerRef),
      [ref, containerRef]
    );

    React.useEffect(() => {
      if (containerRef.current) {
        const element = containerRef.current;
        element.scrollTop = element.scrollHeight;
      }
    }, [children]);

    return (
      <div
        ref={mergedRef}
        className={cn("flex flex-1 flex-col overflow-y-auto p-4", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ChatMessageList.displayName = "ChatMessageList";

export { ChatMessageList };
