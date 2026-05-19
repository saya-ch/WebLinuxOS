import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    const baseClasses = 'w-full px-3 py-2 rounded-md bg-bg-tertiary border border-border text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors'
    const errorClasses = error ? 'border-error focus:ring-error' : ''
    
    return (
      <input
        ref={ref}
        className={`${baseClasses} ${errorClasses} ${className || ''}`}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
