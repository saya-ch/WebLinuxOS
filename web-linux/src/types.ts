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
  /** 标记新增/推荐应用，用于在启动面板上添加视觉提示 */
  isNew?: boolean
  /** 应用简介，用于工具提示和详情面板 */
  description?: string
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
  // 创建时间（ISO 字符串，可选）
  createdAt?: string
  // 最后修改时间（ISO 字符串，可选）
  modifiedAt?: string
  // 标签数组，用于分类与搜索（可选）
  tags?: string[]
}

// 系统运行指标（CPU、内存、磁盘、网络），用于监控面板
export interface SystemMetrics {
  // CPU 使用率（0-100）
  cpu: number
  // 内存相关指标
  memory: {
    used: number
    total: number
    percent: number
  }
  // 磁盘相关指标
  disk: {
    used: number
    total: number
    percent: number
  }
  // 网络相关指标（上传/下载速率，单位 KB/s）
  network: {
    upload: number
    download: number
  }
  // 采集时间戳（ISO 字符串，可选）
  timestamp?: string
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