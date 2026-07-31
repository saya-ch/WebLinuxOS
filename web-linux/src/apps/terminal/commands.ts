import type { FileNode } from '../../types'

export type CommandContext = {
  cwd: string
  files: FileNode[]
  username: string
  hostname: string
  theme: 'dark' | 'light'
  args: string[]
  prevCwd: string | null
  stdin?: string
  addFile?: (parentId: string, name: string, type: 'file' | 'folder') => void
  deleteFile?: (id: string) => void
  updateFileContent?: (id: string, content: string) => void
  renameFile?: (id: string, name: string) => void
  copyFile?: (sourceId: string, targetParentId: string) => void
  moveFile?: (sourceId: string, targetParentId: string) => void
}

export type CommandResult = {
  output: string
  cwd?: string
  prevCwd?: string | null
}

export type CommandHandler = (context: CommandContext) => CommandResult | Promise<CommandResult>

export interface CommandDefinition {
  handler: CommandHandler
  description: string
  usage?: string
  examples?: string[]
}

export const COMMANDS: Record<string, CommandDefinition> = {}

// 已注册命令的来源记录，用于在开发模式下定位重复注册问题
const COMMAND_SOURCES: Record<string, string> = {}
// 全局初始化守卫：防止 React StrictMode 或多终端组件实例导致的重复注册
// 使用 globalThis 跨模块共享状态，确保整个页面生命周期内只做一次警告汇总
const INIT_GUARD_KEY = '__WebLinuxOS_TERMINAL_COMMANDS_INIT_GUARD__' as const
function getGlobalGuard(): { warned: Set<string> } {
  if (typeof globalThis === 'undefined') return { warned: new Set() }
  const g = globalThis as unknown as Record<string, unknown>
  if (!g[INIT_GUARD_KEY]) {
    g[INIT_GUARD_KEY] = { warned: new Set<string>() }
  }
  return g[INIT_GUARD_KEY] as { warned: Set<string> }
}

interface RegisterOptions {
  /** 强制覆盖已存在的同名命令。默认 false：遇到重复时跳过并保留首次注册的实现。 */
  force?: boolean
  /** 来源标识，便于排查重复注册。通常传入模块文件名。 */
  source?: string
}

export function registerCommand(name: string, definition: CommandDefinition, options?: RegisterOptions) {
  const normalizedName = name.toLowerCase()
  if (COMMANDS[normalizedName]) {
    if (options?.force) {
      COMMANDS[normalizedName] = definition
      COMMAND_SOURCES[normalizedName] = options.source || 'unknown (forced)'
      return
    }
    // 静默跳过：保留首次注册的实现，避免被后续加载的旧版本覆盖
    // 开发模式下只针对第一次重复发出一条警告，避免StrictMode双执行时刷屏
    if (import.meta.env.DEV) {
      const guard = getGlobalGuard()
      if (!guard.warned.has(normalizedName)) {
        guard.warned.add(normalizedName)
        // 只有来源不同时才警告，同来源（完全一样的重复完全静默
        const prev = COMMAND_SOURCES[normalizedName] || 'unknown'
        const next = options?.source || 'unknown'
        if (prev !== next) {
          console.warn(`[terminal] 命令 "${normalizedName}" 重复注册被跳过 (已注册于 ${prev}, 重复来源 ${next})`)
        }
      }
    }
    return
  }
  COMMANDS[normalizedName] = definition
  COMMAND_SOURCES[normalizedName] = options?.source || 'unknown'
}

export function getCommand(name: string): CommandDefinition | undefined {
  return COMMANDS[name.toLowerCase()]
}

export function listCommands(): string[] {
  return Object.keys(COMMANDS)
}

export function getCommandSuggestions(prefix: string): string[] {
  return Object.keys(COMMANDS).filter(cmd => cmd.startsWith(prefix))
}

export function getSuggestions(input: string, cwd: string, files: FileNode[]): string[] {
  const parts = input.split(' ')
  const lastPart = parts[parts.length - 1]
  
  if (parts.length === 1) {
    return getCommandSuggestions(lastPart)
  }
  
  const resolved = lastPart.startsWith('/') ? lastPart : (lastPart.startsWith('~') ? lastPart.replace('~', '/home/user') : `${cwd}/${lastPart}`)
  const dirPath = resolved.lastIndexOf('/') !== -1 ? resolved.substring(0, resolved.lastIndexOf('/')) : '/'
  const searchPrefix = resolved.lastIndexOf('/') !== -1 ? resolved.substring(resolved.lastIndexOf('/') + 1) : resolved
  
  const findNodeByPath = (nodes: FileNode[], path: string): FileNode | undefined => {
    if (path === '/') return nodes[0]
    const parts = path.split('/').filter(Boolean)
    let current: FileNode | undefined = nodes[0]
    for (const part of parts) {
      if (!current || current.type !== 'folder') return undefined
      current = current.children?.find(child => child.name === part)
    }
    return current
  }
  
  const targetDir = findNodeByPath(files, dirPath)
  
  if (!targetDir || targetDir.type !== 'folder' || !targetDir.children) {
    return []
  }
  
  return targetDir.children
    .filter(child => child.name.startsWith(searchPrefix))
    .map(child => {
      const fullPath = dirPath === '/' ? `/${child.name}` : `${dirPath}/${child.name}`
      return child.type === 'folder' ? `${fullPath}/` : fullPath
    })
}