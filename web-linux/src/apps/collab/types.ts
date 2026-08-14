export type ToolType = 'pen' | 'highlighter' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'text'
export type TabType = 'whiteboard' | 'code' | 'notes'

export interface Point {
  x: number
  y: number
}

export interface DrawAction {
  id: string
  tool: ToolType
  color: string
  size: number
  points: Point[]
  text?: string
  userId: string
  userName: string
}

export interface CollabUser {
  id: string
  name: string
  color: string
  cursor?: Point
  activeTab?: TabType
  joinedAt: number
}

export interface BCMessage {
  type: 'join' | 'leave' | 'draw' | 'clear' | 'undo' | 'redo' | 'sync' | 'code' | 'note' | 'cursor' | 'request-sync'
  userId: string
  userName: string
  roomId: string
  payload?: any
  timestamp: number
}

export const PRESET_COLORS = [
  '#000000', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#ffffff',
]

export const USER_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4',
]

export const PALETTE_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
]

export const genId = () => Math.random().toString(36).substring(2, 10)
export const genRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase()
