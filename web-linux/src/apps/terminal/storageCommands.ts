import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { saveToStorage, clearAllStorage } from '../../store/storageUtils'

registerCommand('backup', {
  handler: (): CommandResult => {
    try {
      const allData: Record<string, unknown> = {}
      const keys = Object.keys(localStorage)
      
      keys.forEach(key => {
        try {
          allData[key] = JSON.parse(localStorage.getItem(key) || 'null')
        } catch {
          allData[key] = localStorage.getItem(key)
        }
      })
      
      const backupId = `backup-${Date.now()}`
      const timestamp = new Date().toLocaleString('zh-CN')
      
      const backupData = {
        id: backupId,
        timestamp,
        data: allData,
        version: '2.0',
        entryCount: keys.length,
      }
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const output = [
        '💾 系统备份已创建',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `备份ID: ${backupId}`,
        `时间: ${timestamp}`,
        `条目数: ${keys.length}`,
        `版本: 2.0`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '备份内容:',
        ...keys.map(key => `  • ${key}`),
        '',
        '下载链接（点击或复制到浏览器）:',
        url,
        '',
        '提示: 将此文件保存到安全位置，可用于恢复系统配置',
      ].join('\n')
      
      return { output }
    } catch (e) {
      return {
        output: [
          '✗ 备份失败',
          '',
          `错误: ${(e as Error).message}`,
        ].join('\n'),
      }
    }
  },
  description: '创建系统配置备份',
  usage: 'backup',
  examples: ['backup'],
})

registerCommand('restore', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔄 系统恢复',
          '',
          '用法: restore <备份内容>',
          '',
          '示例:',
          '  restore {"id":"backup-xxx","data":{...}}',
          '',
          '提示: 将备份文件的内容粘贴到命令后',
          '注意: 此操作将覆盖当前所有配置',
        ].join('\n'),
      }
    }
    
    try {
      const backupJson = args.join(' ')
      const backupData = JSON.parse(backupJson)
      
      if (!backupData.data || typeof backupData.data !== 'object') {
        return { output: '✗ 无效的备份数据格式' }
      }
      
      clearAllStorage()
      
      Object.entries(backupData.data).forEach(([key, value]) => {
        if (typeof value === 'string') {
          localStorage.setItem(key, value)
        } else {
          localStorage.setItem(key, JSON.stringify(value))
        }
      })
      
      return {
        output: [
          '✅ 系统恢复成功',
          '',
          `备份ID: ${backupData.id || '未知'}`,
          `备份时间: ${backupData.timestamp || '未知'}`,
          `恢复条目: ${Object.keys(backupData.data).length}`,
          '',
          '提示: 刷新页面以应用恢复的配置',
        ].join('\n'),
      }
    } catch (e) {
      return {
        output: [
          '✗ 恢复失败',
          '',
          `错误: ${(e as Error).message}`,
          '',
          '提示: 请确保备份数据格式正确',
        ].join('\n'),
      }
    }
  },
  description: '从备份恢复系统配置',
  usage: 'restore <备份内容>',
  examples: ['restore {"id":"backup-xxx","data":{...}}'],
})

registerCommand('export-files', {
  handler: (context: CommandContext): CommandResult => {
    const { files } = context
    
    try {
      const timestamp = new Date().toLocaleString('zh-CN')
      
      const exportData = {
        type: 'weblinux-files',
        version: '2.0',
        timestamp,
        files,
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      let totalFiles = 0
      let totalFolders = 0
      
      const countNodes = (nodes: unknown[]): void => {
        nodes.forEach((node: unknown) => {
          const n = node as { type: string; children?: unknown[] }
          if (n.type === 'file') {
            totalFiles++
          } else if (n.type === 'folder') {
            totalFolders++
            if (n.children) {
              countNodes(n.children)
            }
          }
        })
      }
      
      countNodes(files)
      
      return {
        output: [
          '📤 文件系统导出',
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          `时间: ${timestamp}`,
          `版本: 2.0`,
          `文件数: ${totalFiles}`,
          `文件夹数: ${totalFolders}`,
          '',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          '下载链接:',
          url,
          '',
          '提示: 导出的文件可在其他 WebLinuxOS 实例中导入',
        ].join('\n'),
      }
    } catch (e) {
      return {
        output: [
          '✗ 导出失败',
          '',
          `错误: ${(e as Error).message}`,
        ].join('\n'),
      }
    }
  },
  description: '导出文件系统',
  usage: 'export-files',
  examples: ['export-files'],
})

registerCommand('import-files', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📥 文件系统导入',
          '',
          '用法: import-files <导出内容>',
          '',
          '示例:',
          '  import-files {"type":"weblinux-files","files":[...]}',
          '',
          '提示: 将导出文件的内容粘贴到命令后',
          '注意: 此操作将覆盖当前文件系统',
        ].join('\n'),
      }
    }
    
    try {
      const importJson = args.join(' ')
      const importData = JSON.parse(importJson)
      
      if (importData.type !== 'weblinux-files' || !importData.files) {
        return { output: '✗ 无效的导入数据格式' }
      }
      
      saveToStorage('weblinux-files', importData.files)
      
      return {
        output: [
          '✅ 文件系统导入成功',
          '',
          `导入时间: ${importData.timestamp || '未知'}`,
          `版本: ${importData.version || '未知'}`,
          '',
          '提示: 刷新页面以应用导入的文件系统',
        ].join('\n'),
      }
    } catch (e) {
      return {
        output: [
          '✗ 导入失败',
          '',
          `错误: ${(e as Error).message}`,
          '',
          '提示: 请确保导入数据格式正确',
        ].join('\n'),
      }
    }
  },
  description: '导入文件系统',
  usage: 'import-files <导出内容>',
  examples: ['import-files {"type":"weblinux-files","files":[...]}'],
})

registerCommand('storage-info', {
  handler: (): CommandResult => {
    try {
      const keys = Object.keys(localStorage)
      const totalSize = keys.reduce((sum, key) => {
        const value = localStorage.getItem(key) || ''
        return sum + key.length + value.length
      }, 0)
      
      const getSizeString = (bytes: number): string => {
        if (bytes >= 1024 * 1024) {
          return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
        }
        if (bytes >= 1024) {
          return `${(bytes / 1024).toFixed(2)} KB`
        }
        return `${bytes} B`
      }
      
      const output = [
        '📊 本地存储信息',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `存储条目: ${keys.length}`,
        `已使用空间: ${getSizeString(totalSize)}`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '存储键值:',
        '',
        ...keys.map(key => {
          const value = localStorage.getItem(key) || ''
          const size = getSizeString(key.length + value.length)
          return `  ${key.padEnd(30)} ${size}`
        }),
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '提示: 使用 backup 命令创建完整备份',
        '提示: 使用 clear-storage 命令清空所有存储',
      ].join('\n')
      
      return { output }
    } catch (e) {
      return {
        output: [
          '✗ 获取存储信息失败',
          '',
          `错误: ${(e as Error).message}`,
        ].join('\n'),
      }
    }
  },
  description: '显示本地存储信息',
  usage: 'storage-info',
  examples: ['storage-info'],
})

registerCommand('clear-storage', {
  handler: (): CommandResult => {
    try {
      const count = Object.keys(localStorage).length
      clearAllStorage()
      
      return {
        output: [
          '🗑️ 存储已清空',
          '',
          `已删除 ${count} 条存储记录`,
          '',
          '提示: 刷新页面以应用更改',
        ].join('\n'),
      }
    } catch (e) {
      return {
        output: [
          '✗ 清空存储失败',
          '',
          `错误: ${(e as Error).message}`,
        ].join('\n'),
      }
    }
  },
  description: '清空所有本地存储',
  usage: 'clear-storage',
  examples: ['clear-storage'],
})