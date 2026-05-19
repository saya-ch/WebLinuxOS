import React, { createContext, useContext, useState } from 'react'

interface TabsContextType {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

interface TabsProps {
  defaultValue?: string
  value?: string
  onChange?: (value: string) => void
  children: React.ReactNode
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onChange,
  children
}) => {
  const [internalTab, setInternalTab] = useState(defaultValue || '')
  const activeTab = value ?? internalTab
  
  const setActiveTab = (tab: string) => {
    if (onChange) {
      onChange(tab)
    } else {
      setInternalTab(tab)
    }
  }
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="w-full">
        {children}
      </div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

export const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
  return (
    <div className={`flex border-b border-border ${className || ''}`}>
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  className
}) => {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component')
  }
  
  const { activeTab, setActiveTab } = context
  const isActive = activeTab === value
  
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'text-accent-primary border-b-2 border-accent-primary'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
      } ${className || ''}`}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  children,
  className
}) => {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component')
  }
  
  const { activeTab } = context
  
  if (activeTab !== value) return null
  
  return (
    <div className={`pt-4 ${className || ''}`}>
      {children}
    </div>
  )
}
