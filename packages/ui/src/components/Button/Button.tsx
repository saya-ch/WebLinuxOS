import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:pointer-events-none'
    
    const variantClasses = {
      primary: 'bg-accent-primary text-white hover:bg-accent-secondary',
      secondary: 'bg-bg-tertiary text-text-primary hover:bg-border',
      outline: 'border border-border text-text-primary hover:bg-bg-tertiary',
      ghost: 'text-text-primary hover:bg-bg-tertiary',
      danger: 'bg-error text-white hover:opacity-90'
    }
    
    const sizeClasses = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base'
    }
    
    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
