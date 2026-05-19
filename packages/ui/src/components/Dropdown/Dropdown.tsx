import React, { createContext, useContext, useState, useRef, useEffect } from 'react'

interface DropdownContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  toggle: () => void
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined)

interface DropdownProps {
  children: React.ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const Dropdown: React.FC<DropdownProps> = ({
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isOpen = controlledOpen ?? internalOpen
  
  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open)
    } else {
      setInternalOpen(open)
    }
  }
  
  const toggle = () => setIsOpen(!isOpen)
  
  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, toggle }}>
      <div className="relative">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

interface DropdownTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

export const DropdownTrigger: React.FC<DropdownTriggerProps> = ({
  children,
  asChild = false
}) => {
  const context = useContext(DropdownContext)
  if (!context) {
    throw new Error('DropdownTrigger must be used within a Dropdown component')
  }
  
  const { toggle } = context
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        toggle()
        ;(children.props as any).onClick?.(e)
      }
    })
  }
  
  return (
    <button onClick={(e) => { e.stopPropagation(); toggle() }}>
      {children}
    </button>
  )
}

interface DropdownContentProps {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}

export const DropdownContent: React.FC<DropdownContentProps> = ({
  children,
  align = 'start',
  className
}) => {
  const context = useContext(DropdownContext)
  if (!context) {
    throw new Error('DropdownContent must be used within a Dropdown component')
  }
  
  const { isOpen, setIsOpen } = context
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, setIsOpen])
  
  if (!isOpen) return null
  
  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0'
  }
  
  return (
    <div
      ref={ref}
      className={`absolute z-50 mt-2 min-w-[180px] bg-bg-secondary border border-border rounded-md shadow-lg ${alignClasses[align]} ${className || ''}`}
    >
      {children}
    </div>
  )
}

interface DropdownItemProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  onClick,
  disabled = false,
  className
}) => {
  const context = useContext(DropdownContext)
  if (!context) {
    throw new Error('DropdownItem must be used within a Dropdown component')
  }
  
  const { setIsOpen } = context
  
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick()
      setIsOpen(false)
    }
  }
  
  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
        disabled
          ? 'text-text-secondary opacity-50 cursor-not-allowed'
          : 'text-text-primary hover:bg-bg-tertiary'
      } ${className || ''}`}
    >
      {children}
    </button>
  )
}

interface DropdownSeparatorProps {
  className?: string
}

export const DropdownSeparator: React.FC<DropdownSeparatorProps> = ({
  className
}) => {
  return (
    <div className={`h-px bg-border my-1 ${className || ''}`} />
  )
}
