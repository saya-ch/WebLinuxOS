import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { findNodeByPath } from '../../store'
import type { FileNode } from '../../types'

registerCommand('grep', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: '用法: grep <pattern> <file>' }
    }
    
    const pattern = args[0]
    const filename = args[1]
    
    if (!filename) {
      return { output: '请指定要搜索的文件' }
    }
    
    const filePath = filename.startsWith('/') ? filename : `${cwd}/${filename}`
    const file = findNodeByPath(files, filePath)
    
    if (!file || file.type !== 'file') {
      return { output: `文件 ${filename} 不存在` }
    }
    
    const content = file.content || ''
    const lines = content.split('\n')
    const matches: string[] = []
    
    lines.forEach((line, index) => {
      if (line.includes(pattern)) {
        matches.push(`${index + 1}: ${line}`)
      }
    })
    
    if (matches.length === 0) {
      return { output: '没有找到匹配项' }
    }
    
    return { output: matches.join('\n') }
  },
  description: '在文件中搜索内容',
  usage: 'grep <pattern> <file>',
  examples: ['grep hello test.txt', 'grep "function" app.ts']
})

registerCommand('find', {
  handler: (context: CommandContext): CommandResult => {
    const { args, files } = context
    
    const pattern = args[0] || ''
    
    const findFiles = (nodes: FileNode[], currentPath: string, results: string[]): void => {
      nodes.forEach(node => {
        const nodePath = currentPath === '/' ? `/${node.name}` : `${currentPath}/${node.name}`
        
        if (node.type === 'folder' && node.children) {
          findFiles(node.children, nodePath, results)
        }
        
        const name = node.name.toLowerCase()
        const searchPattern = pattern.toLowerCase()
        if (searchPattern === '' || name.includes(searchPattern)) {
          results.push(nodePath)
        }
      })
    }
    
    const results: string[] = []
    findFiles(files, '', results)
    
    if (results.length === 0) {
      return { output: '没有找到匹配的文件' }
    }
    
    const output: string[] = []
    output.push(`找到 ${results.length} 个文件:`)
    output.push('═'.repeat(50))
    
    results.slice(0, 20).forEach(path => {
      output.push(`${path}`)
    })
    
    if (results.length > 20) {
      output.push(`还有 ${results.length - 20} 个文件...`)
    }
    
    return { output: output.join('\n') }
  },
  description: '查找文件',
  usage: 'find [pattern]',
  examples: ['find', 'find .txt', 'find README']
})

registerCommand('du', {
  handler: (context: CommandContext): CommandResult => {
    const { cwd, files } = context
    
    const targetDir = findNodeByPath(files, cwd)
    
    if (!targetDir || targetDir.type !== 'folder') {
      return { output: `目录 ${cwd} 不存在` }
    }
    
    const countFiles = (node: FileNode): { count: number; size: number } => {
      if (node.type === 'file') {
        return { count: 1, size: (node.content?.length || 0) }
      }
      if (node.type === 'folder' && node.children) {
        return node.children.reduce((acc: { count: number; size: number }, child: FileNode) => {
          const result = countFiles(child)
          return {
            count: acc.count + result.count,
            size: acc.size + result.size
          }
        }, { count: 0, size: 0 })
      }
      return { count: 0, size: 0 }
    }
    
    const stats = countFiles(targetDir)
    
    const formatSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    }
    
    const output: string[] = []
    output.push(`目录: ${cwd}`)
    output.push('═'.repeat(50))
    output.push(`文件数量: ${stats.count}`)
    output.push(`总大小: ${formatSize(stats.size)}`)
    
    return { output: output.join('\n') }
  },
  description: '显示目录大小',
  usage: 'du',
  examples: ['du']
})

registerCommand('clear', {
  handler: (): CommandResult => {
    return { output: '\u001b[2J\u001b[0;0H' }
  },
  description: '清屏',
  usage: 'clear',
  examples: ['clear']
})

registerCommand('echo', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    return { output: args.join(' ') }
  },
  description: '显示文本',
  usage: 'echo [text]',
  examples: ['echo Hello World', 'echo $PATH']
})

registerCommand('head', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: '用法: head <file> [n]' }
    }
    
    const filename = args[0]
    const lines = args.length > 1 ? parseInt(args[1]) : 10
    
    const filePath = filename.startsWith('/') ? filename : `${cwd}/${filename}`
    const file = findNodeByPath(files, filePath)
    
    if (!file || file.type !== 'file') {
      return { output: `head: ${filename}: 没有那个文件或目录` }
    }
    
    const content = file.content || ''
    const fileLines = content.split('\n')
    
    return { output: fileLines.slice(0, lines).join('\n') }
  },
  description: '显示文件开头',
  usage: 'head <file> [n]',
  examples: ['head README.md', 'head log.txt 5']
})

registerCommand('tail', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: '用法: tail <file> [n]' }
    }
    
    const filename = args[0]
    const lines = args.length > 1 ? parseInt(args[1]) : 10
    
    const filePath = filename.startsWith('/') ? filename : `${cwd}/${filename}`
    const file = findNodeByPath(files, filePath)
    
    if (!file || file.type !== 'file') {
      return { output: `tail: ${filename}: 没有那个文件或目录` }
    }
    
    const content = file.content || ''
    const fileLines = content.split('\n')
    
    return { output: fileLines.slice(-lines).join('\n') }
  },
  description: '显示文件末尾',
  usage: 'tail <file> [n]',
  examples: ['tail log.txt', 'tail -f log.txt']
})

registerCommand('wc', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: '用法: wc <file>' }
    }
    
    const filename = args[0]
    
    const filePath = filename.startsWith('/') ? filename : `${cwd}/${filename}`
    const file = findNodeByPath(files, filePath)
    
    if (!file || file.type !== 'file') {
      return { output: `wc: ${filename}: 没有那个文件或目录` }
    }
    
    const content = file.content || ''
    const lines = content.split('\n').length
    const words = content.split(/\s+/).filter(w => w.length > 0).length
    const chars = content.length
    
    return {
      output: `${lines} 行 ${words} 词 ${chars} 字符 ${filename}`
    }
  },
  description: '统计文件字数',
  usage: 'wc <file>',
  examples: ['wc README.md']
})

registerCommand('touch', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, addFile } = context
    
    if (args.length === 0) {
      return { output: '用法: touch <file>' }
    }
    
    const filename = args[0]
    
    const filePath = filename.startsWith('/') ? filename : `${cwd}/${filename}`
    const parentPath = filePath.lastIndexOf('/') !== -1 ? filePath.substring(0, filePath.lastIndexOf('/')) : '/'
    
    const parentNode = findNodeByPath(files, parentPath)
    
    if (!parentNode || parentNode.type !== 'folder') {
      return { output: `touch: 无法创建文件 ${filename}` }
    }
    
    const existingFile = parentNode.children?.find((c: FileNode) => c.name === filename)
    
    if (existingFile) {
      return { output: '' }
    }
    
    if (addFile) {
      addFile(parentNode.id, filename, 'file')
    }
    
    return { output: '' }
  },
  description: '创建文件或更新时间戳',
  usage: 'touch <file>',
  examples: ['touch newfile.txt']
})

registerCommand('mkdir', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, addFile } = context
    
    if (args.length === 0) {
      return { output: '用法: mkdir <dir>' }
    }
    
    const dirname = args[0]
    
    const dirPath = dirname.startsWith('/') ? dirname : `${cwd}/${dirname}`
    const parentPath = dirPath.lastIndexOf('/') !== -1 ? dirPath.substring(0, dirPath.lastIndexOf('/')) : '/'
    
    const parentNode = findNodeByPath(files, parentPath)
    
    if (!parentNode || parentNode.type !== 'folder') {
      return { output: `mkdir: 无法创建目录 ${dirname}` }
    }
    
    if (addFile) {
      addFile(parentNode.id, dirname, 'folder')
    }
    
    return { output: '' }
  },
  description: '创建目录',
  usage: 'mkdir <dir>',
  examples: ['mkdir newdir']
})

registerCommand('rm', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, deleteFile } = context
    
    if (args.length === 0) {
      return { output: '用法: rm <file>' }
    }
    
    const filename = args[0]
    
    const filePath = filename.startsWith('/') ? filename : `${cwd}/${filename}`
    const file = findNodeByPath(files, filePath)
    
    if (!file) {
      return { output: `rm: ${filename}: 没有那个文件或目录` }
    }
    
    if (deleteFile) {
      deleteFile(file.id)
    }
    
    return { output: '' }
  },
  description: '删除文件',
  usage: 'rm <file>',
  examples: ['rm oldfile.txt']
})

registerCommand('cp', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, copyFile } = context
    
    if (args.length < 2) {
      return { output: '用法: cp <source> <dest>' }
    }
    
    const source = args[0]
    const dest = args[1]
    
    const sourcePath = source.startsWith('/') ? source : `${cwd}/${source}`
    const destPath = dest.startsWith('/') ? dest : `${cwd}/${dest}`
    
    const sourceFile = findNodeByPath(files, sourcePath)
    const destDirPath = destPath.lastIndexOf('/') !== -1 ? destPath.substring(0, destPath.lastIndexOf('/')) : '/'
    const destNode = findNodeByPath(files, destDirPath)
    
    if (!sourceFile) {
      return { output: `cp: ${source}: 没有那个文件或目录` }
    }
    
    if (!destNode || destNode.type !== 'folder') {
      return { output: `cp: ${dest}: 目标目录不存在` }
    }
    
    if (copyFile) {
      copyFile(sourceFile.id, destNode.id)
    }
    
    return { output: '' }
  },
  description: '复制文件',
  usage: 'cp <source> <dest>',
  examples: ['cp file.txt copy.txt']
})

registerCommand('mv', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, moveFile, renameFile } = context
    
    if (args.length < 2) {
      return { output: '用法: mv <source> <dest>' }
    }
    
    const source = args[0]
    const dest = args[1]
    
    const sourcePath = source.startsWith('/') ? source : `${cwd}/${source}`
    const destPath = dest.startsWith('/') ? dest : `${cwd}/${dest}`
    
    const sourceFile = findNodeByPath(files, sourcePath)
    
    if (!sourceFile) {
      return { output: `mv: ${source}: 没有那个文件或目录` }
    }
    
    const sourceParentPath = sourcePath.lastIndexOf('/') !== -1 ? sourcePath.substring(0, sourcePath.lastIndexOf('/')) : '/'
    const destDirPath = destPath.lastIndexOf('/') !== -1 ? destPath.substring(0, destPath.lastIndexOf('/')) : '/'
    
    if (sourceParentPath === destDirPath) {
      const newName = destPath.substring(destDirPath.length + 1)
      if (renameFile) {
        renameFile(sourceFile.id, newName)
      }
    } else {
      const destNode = findNodeByPath(files, destDirPath)
      if (!destNode || destNode.type !== 'folder') {
        return { output: `mv: ${dest}: 目标目录不存在` }
      }
      if (moveFile) {
        moveFile(sourceFile.id, destNode.id)
      }
    }
    
    return { output: '' }
  },
  description: '移动文件',
  usage: 'mv <source> <dest>',
  examples: ['mv old.txt new.txt']
})