import React, { useState } from 'react'

export interface TreeItem {
  id: string
  label: string
  children?: TreeItem[]
  isFolder?: boolean
  icon?: React.ReactNode
}

interface TreeProps {
  data: TreeItem[]
  defaultExpanded?: string[]
  expanded?: string[]
  onExpandedChange?: (expanded: string[]) => void
  onSelect?: (item: TreeItem) => void
  selectedId?: string
  className?: string
}

const TreeItemComponent: React.FC<{
  item: TreeItem
  expanded: Set<string>
  onToggle: (id: string) => void
  onSelect: (item: TreeItem) => void
  selectedId?: string
  level: number
}> = ({ item, expanded, onToggle, onSelect, selectedId, level }) => {
  const hasChildren = item.children && item.children.length > 0
  const isExpanded = expanded.has(item.id)
  const isSelected = selectedId === item.id
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggle(item.id)
  }
  
  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 cursor-pointer rounded transition-colors ${
          isSelected ? 'bg-accent-primary/20 text-accent-primary' : 'text-text-primary hover:bg-bg-tertiary'
        }`}
        style={{ paddingLeft: `${level * 16 + 4}px` }}
        onClick={() => onSelect(item)}
      >
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="mr-1 p-0.5 rounded hover:bg-bg-tertiary text-text-secondary hover:text-text-primary"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
        {!hasChildren && <span className="w-5" />}
        {item.icon && <span className="mr-2">{item.icon}</span>}
        {!item.icon && (
          <span className="mr-2">
            {item.isFolder ? (
              <svg className="w-4 h-4 text-accent-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </span>
        )}
        <span className="text-sm">{item.label}</span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {item.children!.map((child) => (
            <TreeItemComponent
              key={child.id}
              item={child}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedId={selectedId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const Tree: React.FC<TreeProps> = ({
  data,
  defaultExpanded = [],
  expanded: controlledExpanded,
  onExpandedChange,
  onSelect,
  selectedId,
  className
}) => {
  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(new Set(defaultExpanded))
  const expanded = controlledExpanded ? new Set(controlledExpanded) : internalExpanded
  
  const handleToggle = (id: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    
    if (onExpandedChange) {
      onExpandedChange(Array.from(newExpanded))
    } else {
      setInternalExpanded(newExpanded)
    }
  }
  
  const handleSelect = (item: TreeItem) => {
    onSelect?.(item)
  }
  
  return (
    <div className={`${className || ''}`}>
      {data.map((item) => (
        <TreeItemComponent
          key={item.id}
          item={item}
          expanded={expanded}
          onToggle={handleToggle}
          onSelect={handleSelect}
          selectedId={selectedId}
          level={0}
        />
      ))}
    </div>
  )
}
