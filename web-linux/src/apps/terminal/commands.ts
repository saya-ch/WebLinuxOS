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
  COMMANDS[name] = definition
}

export function getCommand(name: string): CommandDefinition | undefined {
  return COMMANDS[name.toLowerCase()]
}

export function listCommands(): string[] {
  return Object.keys(COMMANDS)
}