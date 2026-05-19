import React from 'react'
import * as LucideIcons from 'lucide-react'

type IconName = keyof typeof LucideIcons

interface IconProps {
  name: IconName
  size?: number | string
  color?: string
  className?: string
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color,
  className
}) => {
  const IconComponent = LucideIcons[name] as React.ElementType
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in lucide-react`)
    return null
  }
  
  return (
    <IconComponent
      size={size}
      color={color}
      className={className}
    />
  )
}

export * from 'lucide-react'
