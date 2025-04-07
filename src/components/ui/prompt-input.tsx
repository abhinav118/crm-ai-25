
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PromptInputProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
  onSubmit?: () => void
}

const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  ({ className, value, onValueChange, onSubmit, children, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        onSubmit?.()
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full flex-col rounded-lg border bg-background p-2",
          className
        )}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            if (child.type === PromptInputTextarea) {
              return React.cloneElement(child as React.ReactElement<any>, {
                value,
                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  onValueChange?.(e.target.value),
              })
            }
          }
          return child
        })}
      </div>
    )
  }
)
PromptInput.displayName = "PromptInput"

const PromptInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <div className="relative w-full">
      <textarea
        ref={ref}
        className={cn(
          "resize-none w-full bg-transparent outline-none focus-visible:ring-0 px-0 py-1.5 text-base md:text-sm min-h-[60px]",
          className
        )}
        rows={1}
        {...props}
      />
    </div>
  )
})
PromptInputTextarea.displayName = "PromptInputTextarea"

const PromptInputActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div 
      ref={ref}
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
})
PromptInputActions.displayName = "PromptInputActions"

export { PromptInput, PromptInputTextarea, PromptInputActions }
