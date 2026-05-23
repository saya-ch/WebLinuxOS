import type { ReactNode } from 'react'

export interface AppDefinition {
  id: string
  name: string
  icon: ReactNode
  component: string
  category: 'system' | 'office' | 'internet' | 'multimedia' | 'utilities' | 'development' | 'games'
  defaultWidth: number
  defaultHeight: number
  minWidth: number
  minHeight: number
  resizable: boolean
  multiple: boolean
}

export interface WindowState {
  id: string
  appId: string
  title: string
  x: number
  y: number
  width: number
  height: number
  minWidth: number
  minHeight: number
  maxWidth?: number
  maxHeight?: number
  minimized: boolean
  maximized: boolean
  focused: boolean
  zIndex: number
  resizable: boolean
  prevX?: number
  prevY?: number
  prevWidth?: number
  prevHeight?: number
}

export interface DesktopIcon {
  id: string
  appId: string
  name: string
  icon: ReactNode
  x: number
  y: number
}

export interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  content?: string
  children?: FileNode[]
  parentId: string | null
}

export interface Notification {
  id: string
  title: string
  message: string
  icon?: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  timestamp?: Date
}