import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { findNodeByPath, resolvePath, useStore } from '../../store'

const BACKUP_STORAGE_KEY = 'weblinux-backups'

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

interface BackupRecord {
  id: string
  timestamp: string
  name: string
  size: number
  fileCount: number
  data: {
    files: unknown[]
    localStorage: Record<string, unknown>
  }
}

function getBackups(): BackupRecord[] {
  try {
    const raw = localStorage.getItem(BACKUP_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveBackups(backups: BackupRecord[]): void {
  localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backups))
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function countFileNodes(nodes: unknown[]): { files: number; folders: number; size: number } {
  let files = 0
  let folders = 0
  let size = 0
  for (const node of nodes) {
    const n = node as { type: string; children?: unknown[]; content?: string }
    if (n.type === 'folder') {
      folders++
      if (n.children) {
        const child = countFileNodes(n.children)
        files += child.files
        folders += child.folders
        size += child.size
      }
    } else {
      files++
      size += (n.content?.length || 0) * 2
    }
  }
  return { files, folders, size }
}

function buildHelpText(): string {
  return [
    `${c.bold}${c.cyan}╔══════════════════════════════════════════╗${c.reset}`,
    `${c.bold}${c.cyan}║      系统备份管理 (backup)               ║${c.reset}`,
    `${c.bold}${c.cyan}╚══════════════════════════════════════════╝${c.reset}`,
    '',
    `${c.bold}用法:${c.reset} backup <子命令>`,
    '',
    `${c.bold}子命令:${c.reset}`,
    `  ${c.green}create${c.reset}   创建新的系统备份（保存到localStorage）`,
    `  ${c.green}list${c.reset}    列出所有备份记录`,
    `  ${c.green}info${c.reset}    显示当前备份信息`,
    `  ${c.green}export${c.reset}  导出系统备份到文件系统`,
    `  ${c.green}import${c.reset}  从文件系统导入备份`,
    `  ${c.green}restore${c.reset} 恢复指定备份`,
    `  ${c.green}clear${c.reset}   清除所有备份记录`,
    '',
    `${c.bold}示例:${c.reset}`,
    `  backup create`,
    `  backup list`,
    `  backup export`,
    `  backup export my-backup.json`,
    `  backup import ./my-backup.json`,
    `  backup restore backup-1234567890`,
    `  backup clear`,
  ].join('\n')
}

registerCommand('backup', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const subcommand = args[0]?.toLowerCase()

    if (!subcommand || subcommand === 'help' || subcommand === '--help' || subcommand === '-h') {
      return { output: buildHelpText() }
    }

    switch (subcommand) {
      case 'create':
        return handleCreate(context)
      case 'list':
        return handleList()
      case 'info':
        return handleInfo(context)
      case 'export':
        return handleExport(context, args.slice(1))
      case 'import':
        return handleImport(context, args.slice(1))
      case 'restore':
        return handleRestore(context, args.slice(1))
      case 'clear':
        return handleClear()
      default:
        return {
          output: [
            `${c.red}错误: 未知的备份子命令 '${subcommand}'${c.reset}`,
            '',
            `使用 ${c.yellow}backup help${c.reset} 查看所有可用子命令`,
          ].join('\n')
        }
    }
  },
  description: '系统备份管理',
  usage: 'backup <子命令>',
  examples: ['backup create', 'backup list', 'backup export', 'backup restore <id>']
}, { force: true, source: 'systemBackupCommands' })

function handleCreate(context: CommandContext): CommandResult {
  try {
    const { files } = context
    const fsStats = countFileNodes(files)
    const timestamp = new Date().toLocaleString('zh-CN')
    const backupId = `backup-${Date.now()}`

    const localStorageData: Record<string, unknown> = {}
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      try {
        localStorageData[key] = JSON.parse(localStorage.getItem(key) || 'null')
      } catch {
        localStorageData[key] = localStorage.getItem(key)
      }
    })

    const record: BackupRecord = {
      id: backupId,
      timestamp,
      name: `系统备份 ${new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
      size: fsStats.size + keys.reduce((sum, k) => sum + (localStorage.getItem(k)?.length || 0), 0),
      fileCount: fsStats.files,
      data: {
        files: JSON.parse(JSON.stringify(files)),
        localStorage: localStorageData,
      }
    }

    const backups = getBackups()
    backups.unshift(record)
    saveBackups(backups)

    return {
      output: [
        `${c.bold}${c.green}✅ 系统备份已创建${c.reset}`,
        '',
        `${c.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`,
        '',
        `${c.bold}备份ID:${c.reset}  ${c.cyan}${backupId}${c.reset}`,
        `${c.bold}备份名称:${c.reset} ${record.name}`,
        `${c.bold}创建时间:${c.reset} ${timestamp}`,
        `${c.bold}文件数量:${c.reset} ${fsStats.files} 个文件 / ${fsStats.folders} 个文件夹`,
        `${c.bold}存储大小:${c.reset} ${formatBytes(record.size)}`,
        `${c.bold}localStorage:${c.reset} ${keys.length} 条记录`,
        '',
        `${c.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`,
        '',
        `提示: 使用 ${c.yellow}backup list${c.reset} 查看所有备份`,
        `提示: 使用 ${c.yellow}backup export${c.reset} 导出为文件`,
      ].join('\n')
    }
  } catch (e) {
    return {
      output: [
        `${c.red}❌ 备份失败${c.reset}`,
        '',
        `错误: ${(e as Error).message}`,
      ].join('\n')
    }
  }
}

function handleList(): CommandResult {
  const backups = getBackups()

  if (backups.length === 0) {
    return {
      output: [
        `${c.bold}${c.yellow}⚠️  暂无备份记录${c.reset}`,
        '',
        `使用 ${c.cyan}backup create${c.reset} 创建第一个备份`,
      ].join('\n')
    }
  }

  const output: string[] = [
    `${c.bold}${c.cyan}╔══════════════════════════════════════════════════════════════╗${c.reset}`,
    `${c.bold}${c.cyan}║              备份记录列表 (共 ${backups.length} 条)                    ║${c.reset}`,
    `${c.bold}${c.cyan}╚══════════════════════════════════════════════════════════════╝${c.reset}`,
    '',
  ]

  backups.forEach((b, i) => {
    output.push(`${c.bold}${c.magenta}${'─'.repeat(60)}${c.reset}`)
    output.push(`${c.bold} #${i + 1} ${b.name}${c.reset}`)
    output.push(`${c.bold}${c.magenta}${'─'.repeat(60)}${c.reset}`)
    output.push(`  ${c.bold}ID:${c.reset}     ${c.cyan}${b.id}${c.reset}`)
    output.push(`  ${c.bold}时间:${c.reset}   ${b.timestamp}`)
    output.push(`  ${c.bold}文件数:${c.reset} ${b.fileCount} 个`)
    output.push(`  ${c.bold}大小:${c.reset}   ${formatBytes(b.size)}`)
    output.push('')
  })

  output.push(`${c.bold}${c.magenta}${'─'.repeat(60)}${c.reset}`)
  output.push(`使用 ${c.yellow}backup restore <id>${c.reset} 恢复指定备份`)
  output.push(`使用 ${c.yellow}backup export <filename>${c.reset} 导出到文件系统`)

  return { output: output.join('\n') }
}

function handleInfo(context: CommandContext): CommandResult {
  const { files } = context
  const backups = getBackups()
  const fsStats = countFileNodes(files)

  const totalSize = backups.reduce((sum, b) => sum + b.size, 0)
  const lastBackup = backups[0]

  const output: string[] = [
    `${c.bold}${c.cyan}╔══════════════════════════════════════════╗${c.reset}`,
    `${c.bold}${c.cyan}║         备份系统信息 (info)              ║${c.reset}`,
    `${c.bold}${c.cyan}╚══════════════════════════════════════════╝${c.reset}`,
    '',
    `${c.bold}${c.magenta}【文件系统统计】${c.reset}`,
    `  文件数量:     ${c.green}${fsStats.files}${c.reset}`,
    `  文件夹数量:   ${c.green}${fsStats.folders}${c.reset}`,
    `  存储使用:     ${c.yellow}${formatBytes(fsStats.size)}${c.reset}`,
    '',
    `${c.bold}${c.magenta}【备份存储统计】${c.reset}`,
    `  备份数量:     ${c.green}${backups.length}${c.reset}`,
    `  总占用空间:   ${c.yellow}${formatBytes(totalSize)}${c.reset}`,
    `  存储位置:     ${c.gray}localStorage (${BACKUP_STORAGE_KEY})${c.reset}`,
    '',
  ]

  if (lastBackup) {
    output.push(`${c.bold}${c.magenta}【最近备份】${c.reset}`)
    output.push(`  备份ID:       ${c.cyan}${lastBackup.id}${c.reset}`)
    output.push(`  备份名称:     ${lastBackup.name}`)
    output.push(`  创建时间:     ${lastBackup.timestamp}`)
    output.push(`  文件数:       ${lastBackup.fileCount}`)
    output.push(`  大小:         ${formatBytes(lastBackup.size)}`)
  } else {
    output.push(`${c.bold}${c.magenta}【最近备份】${c.reset}`)
    output.push(`  ${c.yellow}暂无备份记录${c.reset}`)
    output.push(`  使用 ${c.cyan}backup create${c.reset} 创建首次备份`)
  }

  output.push('')
  output.push(`${c.bold}${c.magenta}【操作提示】${c.reset}`)
  output.push(`  ${c.cyan}backup create${c.reset}   创建新备份`)
  output.push(`  ${c.cyan}backup list${c.reset}    查看所有备份`)
  output.push(`  ${c.cyan}backup clear${c.reset}   清除所有备份`)

  return { output: output.join('\n') }
}

function handleExport(context: CommandContext, args: string[]): CommandResult {
  try {
    const { files, cwd, addFile, updateFileContent } = context
    const fsStats = countFileNodes(files)
    const timestamp = Date.now()
    const filename = args[0] || `system-backup-${timestamp}.json`

    const localStorageData: Record<string, unknown> = {}
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      try {
        localStorageData[key] = JSON.parse(localStorage.getItem(key) || 'null')
      } catch {
        localStorageData[key] = localStorage.getItem(key)
      }
    })

    const exportData = {
      type: 'weblinux-system-backup',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0',
      fileCount: fsStats.files,
      files,
      localStorage: localStorageData,
    }

    const jsonContent = JSON.stringify(exportData, null, 2)
    const targetPath = resolvePath(cwd, filename)
    const existingNode = findNodeByPath(files, targetPath)

    if (existingNode) {
      if (existingNode.type === 'file' && updateFileContent) {
        updateFileContent(existingNode.id, jsonContent)
      } else if (existingNode.type === 'folder') {
        return {
          output: [
            `${c.red}❌ 导出失败${c.reset}`,
            '',
            `目标路径 ${c.yellow}${targetPath}${c.reset} 是一个目录`,
            `请指定一个文件名`,
          ].join('\n')
        }
      }
    } else {
      if (addFile) {
        const parentPath = targetPath.substring(0, targetPath.lastIndexOf('/')) || '/'
        const fileName = targetPath.substring(targetPath.lastIndexOf('/') + 1)
        const parentNode = findNodeByPath(files, parentPath)
        if (parentNode && parentNode.type === 'folder') {
          addFile(parentNode.id, fileName, 'file')
          if (updateFileContent) {
            setTimeout(() => {
              const updatedFiles = useStore.getState().files
              const newNode = findNodeByPath(updatedFiles, targetPath)
              if (newNode && newNode.type === 'file') {
                updateFileContent(newNode.id, jsonContent)
              }
            }, 0)
          }
        }
      }
    }

    const output: string[] = [
      `${c.bold}${c.green}✅ 系统备份已导出到文件系统${c.reset}`,
      '',
      `${c.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`,
      '',
      `${c.bold}文件名:${c.reset}   ${c.cyan}${filename}${c.reset}`,
      `${c.bold}路径:${c.reset}     ${c.cyan}${targetPath}${c.reset}`,
      `${c.bold}时间:${c.reset}     ${new Date().toLocaleString('zh-CN')}`,
      `${c.bold}版本:${c.reset}     ${exportData.version}`,
      `${c.bold}文件数:${c.reset}   ${fsStats.files} 个`,
      `${c.bold}大小:${c.reset}     ${formatBytes(jsonContent.length)}`,
      `${c.bold}存储条目:${c.reset} ${keys.length} 条 localStorage`,
      '',
      `${c.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`,
      '',
      `使用 ${c.yellow}backup import ${filename}${c.reset} 可重新导入`,
    ]

    return { output: output.join('\n') }
  } catch (e) {
    return {
      output: [
        `${c.red}❌ 导出失败${c.reset}`,
        '',
        `错误: ${(e as Error).message}`,
      ].join('\n')
    }
  }
}

function handleImport(context: CommandContext, args: string[]): CommandResult {
  const { files, cwd } = context

  if (args.length === 0) {
    return {
      output: [
        `${c.red}❌ 导入失败${c.reset}`,
        '',
        `用法: ${c.yellow}backup import <filename>${c.reset}`,
        '',
        `示例:`,
        `  backup import ./system-backup-1234567890.json`,
      ].join('\n')
    }
  }

  try {
    const filepath = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, filepath)

    if (!node || node.type !== 'file') {
      return {
        output: [
          `${c.red}❌ 导入失败${c.reset}`,
          '',
          `文件 ${c.yellow}${args[0]}${c.reset} 不存在`,
          `请确认文件路径是否正确`,
        ].join('\n')
      }
    }

    const content = node.content || ''
    const importData = JSON.parse(content)

    if (importData.type !== 'weblinux-system-backup') {
      return {
        output: [
          `${c.red}❌ 无效的备份格式${c.reset}`,
          '',
          `文件类型: ${c.yellow}${importData.type || '未知'}${c.reset}`,
          `此文件不是有效的 WebLinuxOS 系统备份`,
        ].join('\n')
      }
    }

    const localData = importData.localStorage || {}
    Object.entries(localData).forEach(([key, value]) => {
      if (typeof value === 'string') {
        localStorage.setItem(key, value)
      } else {
        localStorage.setItem(key, JSON.stringify(value))
      }
    })

    const fileCount = importData.files ? countFileNodes(importData.files).files : 0

    const output: string[] = [
      `${c.bold}${c.green}✅ 系统备份导入成功${c.reset}`,
      '',
      `${c.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`,
      '',
      `${c.bold}源文件:${c.reset}   ${c.cyan}${args[0]}${c.reset}`,
      `${c.bold}导出时间:${c.reset} ${importData.exportedAt ? new Date(importData.exportedAt).toLocaleString('zh-CN') : '未知'}`,
      `${c.bold}版本:${c.reset}     ${importData.version}`,
      `${c.bold}恢复文件:${c.reset} ${fileCount} 个`,
      `${c.bold}恢复存储:${c.reset} ${Object.keys(localData).length} 条 localStorage`,
      '',
      `${c.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`,
      '',
      `${c.yellow}⚠️  注意: 刷新页面后文件系统更改将完全生效`,
    ]

    return { output: output.join('\n') }
  } catch (e) {
    return {
      output: [
        `${c.red}❌ 导入失败${c.reset}`,
        '',
        `错误: ${(e as Error).message}`,
        '',
        `请确认文件是有效的 JSON 备份文件`,
      ].join('\n')
    }
  }
}

function handleRestore(_context: CommandContext, args: string[]): CommandResult {
  if (args.length === 0) {
    const backups = getBackups()
    if (backups.length === 0) {
      return {
        output: [
          `${c.red}❌ 恢复失败${c.reset}`,
          '',
          `没有可用的备份记录`,
          `使用 ${c.yellow}backup create${c.reset} 创建备份`,
        ].join('\n')
      }
    }
    return {
      output: [
        `${c.red}❌ 恢复失败${c.reset}`,
        '',
        `用法: ${c.yellow}backup restore <id>${c.reset}`,
        '',
        `${c.bold}可用的备份ID:${c.reset}`,
        ...backups.map(b => `  ${c.cyan}${b.id}${c.reset}  ${b.name}  (${b.timestamp})`),
      ].join('\n')
    }
  }

  try {
    const targetId = args[0]
    const backups = getBackups()
    const index = backups.findIndex(b => b.id === targetId)

    if (index === -1) {
      return {
        output: [
          `${c.red}❌ 恢复失败${c.reset}`,
          '',
          `未找到备份ID: ${c.yellow}${targetId}${c.reset}`,
          '',
          `使用 ${c.yellow}backup list${c.reset} 查看所有可用备份`,
        ].join('\n')
      }
    }

    const backup = backups[index]
    const localData = backup.data.localStorage || {}
    Object.entries(localData).forEach(([key, value]) => {
      if (typeof value === 'string') {
        localStorage.setItem(key, value)
      } else {
        localStorage.setItem(key, JSON.stringify(value))
      }
    })

    const fsStats = countFileNodes(backup.data.files as unknown[])

    return {
      output: [
        `${c.bold}${c.green}✅ 系统恢复成功${c.reset}`,
        '',
        `${c.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`,
        '',
        `${c.bold}恢复来源:${c.reset} ${c.cyan}${backup.id}${c.reset}`,
        `${c.bold}备份名称:${c.reset} ${backup.name}`,
        `${c.bold}备份时间:${c.reset} ${backup.timestamp}`,
        `${c.bold}恢复文件:${c.reset} ${fsStats.files} 个 / ${fsStats.folders} 个文件夹`,
        `${c.bold}恢复存储:${c.reset} ${Object.keys(localData).length} 条 localStorage`,
        `${c.bold}恢复大小:${c.reset} ${formatBytes(backup.size)}`,
        '',
        `${c.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`,
        '',
        `${c.yellow}⚠️  注意: 刷新页面后所有更改将完全生效`,
      ].join('\n')
    }
  } catch (e) {
    return {
      output: [
        `${c.red}❌ 恢复失败${c.reset}`,
        '',
        `错误: ${(e as Error).message}`,
      ].join('\n')
    }
  }
}

function handleClear(): CommandResult {
  const backups = getBackups()

  if (backups.length === 0) {
    return {
      output: [
        `${c.yellow}⚠️  没有可清除的备份记录${c.reset}`,
      ].join('\n')
    }
  }

  const count = backups.length
  const totalSize = backups.reduce((sum, b) => sum + b.size, 0)
  saveBackups([])

  return {
    output: [
      `${c.bold}${c.green}🗑️ 所有备份已清除${c.reset}`,
      '',
      `${c.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`,
      '',
      `${c.bold}已清除:${c.reset} ${c.red}${count}${c.reset} 条备份记录`,
      `${c.bold}释放空间:${c.reset} ${formatBytes(totalSize)}`,
      '',
      `${c.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`,
      '',
      `${c.yellow}⚠️  此操作不可恢复${c.reset}`,
    ].join('\n')
  }
}