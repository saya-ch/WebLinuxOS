import React from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    const baseClasses = 'w-full px-3 py-2 rounded-md bg-bg-tertiary border border-border text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors resize-y min-h-[80px]'
    const errorClasses = error ? 'border-error focus:ring-error' : ''
    
    return (
      <textarea
        ref={ref}
        className={`${baseClasses} ${errorClasses} ${className || ''}`}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'
