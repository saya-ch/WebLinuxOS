import type { FileNode } from '../../types'

export type CommandContext = {
  cwd: string
  files: FileNode[]
  username: string
  hostname: string
  theme: 'dark' | 'light'
  args: string[]
  prevCwd: string | null
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

export function registerCommand(name: string, definition: CommandDefinition) {
  const normalizedName = name.toLowerCase()
  // 重复注册保护：开发环境输出警告，避免静默覆盖造成功能丢失
  if (import.meta.env.DEV && COMMANDS[normalizedName]) {
    console.warn(`[terminal] 命令 "${normalizedName}" 被重复注册，将覆盖旧实现`)
  }
  COMMANDS[normalizedName] = definition
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