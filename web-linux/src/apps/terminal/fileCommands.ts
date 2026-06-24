import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { findNodeByPath, resolvePath } from '../../store'
import type { FileNode } from '../../types'

registerCommand('ls', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    const target = args[0] ? resolvePath(cwd, args[0]) : cwd
    const showAll = args.includes('-a') || args.includes('-l')
    
    const node = findNodeByPath(files, target)
    if (!node || node.type !== 'folder') {
      return { output: `ls: 无法访问'${target}': 没有那个文件或目录` }
    }
    if (!node.children || node.children.length === 0) {
      return { output: '' }
    }
    
    const escapeChar = String.fromCharCode(27)
    const items = node.children.map((child) => {
      const color = child.type === 'folder' ? `${escapeChar}[34m` : `${escapeChar}[0m`
      return `${color}${child.name}${escapeChar}[0m`
    })
    
    let output = items.join('  ')
    if (showAll) {
      output = `${escapeChar}[34m.\n${escapeChar}[34m..\n` + output
    }
    
    return { output }
  },
  description: '列出目录内容',
  usage: 'ls [-a] [-l] [路径]',
  examples: ['ls', 'ls -la', 'ls /home/user/documents']
})

registerCommand('cd', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, prevCwd, files } = context
    
    if (args.length === 0) {
      return { output: '', cwd: '/home/user', prevCwd: cwd }
    }
    
    const target = args[0]
    let resolved: string
    
    if (target === '~') {
      resolved = '/home/user'
    } else if (target === '-') {
      if (prevCwd) {
        resolved = prevCwd
      } else {
        return { output: 'cd: OLDPWD not set' }
      }
    } else {
      resolved = resolvePath(cwd, target)
    }
    
    const node = findNodeByPath(files, resolved)
    if (node && node.type === 'folder') {
      return { output: '', cwd: resolved, prevCwd: cwd }
    }
    
    return { output: `cd: ${args[0]}: 没有那个文件或目录` }
  },
  description: '切换当前工作目录',
  usage: 'cd [路径]',
  examples: ['cd ..', 'cd /home/user', 'cd ~', 'cd -']
})

registerCommand('pwd', {
  handler: (context: CommandContext): CommandResult => {
    return { output: context.cwd }
  },
  description: '显示当前工作目录',
  usage: 'pwd',
  examples: ['pwd']
})

registerCommand('cat', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'cat: 缺少操作数' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (node && node.type === 'file') {
      return { output: node.content || '' }
    }
    
    return { output: `cat: ${args[0]}: 没有那个文件或目录` }
  },
  description: '显示文件内容',
  usage: 'cat <文件>',
  examples: ['cat README.md', 'cat /etc/hosts']
})

registerCommand('head', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'head: 缺少操作数' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (node && node.type === 'file') {
      const lines = (node.content || '').split('\n')
      return { output: lines.slice(0, 10).join('\n') }
    }
    
    return { output: `head: ${args[0]}: 没有那个文件或目录` }
  },
  description: '显示文件开头部分',
  usage: 'head <文件>',
  examples: ['head README.md']
})

registerCommand('tail', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'tail: 缺少操作数' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (node && node.type === 'file') {
      const lines = (node.content || '').split('\n')
      return { output: lines.slice(-10).join('\n') }
    }
    
    return { output: `tail: ${args[0]}: 没有那个文件或目录` }
  },
  description: '显示文件末尾部分',
  usage: 'tail <文件>',
  examples: ['tail log.txt']
})

registerCommand('mkdir', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'mkdir: 缺少操作数' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const parts = resolved.split('/').filter(Boolean)
    const parentPath = '/' + parts.slice(0, -1).join('/') || '/'
    const parentNode = findNodeByPath(files, parentPath)
    
    if (parentNode) {
      return { output: '', cwd }
    }
    
    return { output: `mkdir: 无法创建目录'${args[0]}': 没有那个文件或目录` }
  },
  description: '创建目录',
  usage: 'mkdir <目录名>',
  examples: ['mkdir projects', 'mkdir /home/user/docs']
})

registerCommand('touch', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'touch: 缺少操作数' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const parts = resolved.split('/').filter(Boolean)
    const parentPath = '/' + parts.slice(0, -1).join('/') || '/'
    const parentNode = findNodeByPath(files, parentPath)
    const existing = findNodeByPath(files, resolved)
    
    if (existing || parentNode) {
      return { output: '' }
    }
    
    return { output: `touch: 无法创建'${args[0]}': 没有那个文件或目录` }
  },
  description: '创建空文件或更新时间戳',
  usage: 'touch <文件名>',
  examples: ['touch newfile.txt', 'touch /home/user/note.md']
})

registerCommand('rm', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'rm: 缺少操作数' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (node) {
      return { output: '' }
    }
    
    return { output: `rm: 无法删除'${args[0]}': 没有那个文件或目录` }
  },
  description: '删除文件或目录',
  usage: 'rm <文件或目录>',
  examples: ['rm oldfile.txt', 'rm -rf temp/']
})

registerCommand('tree', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    const target = args[0] ? resolvePath(cwd, args[0]) : cwd
    const node = findNodeByPath(files, target)
    
    if (node && node.type === 'folder') {
      const buildTree = (n: FileNode, prefix = '', isLast = true): string => {
        const connector = isLast ? '└── ' : '├── '
        let result = prefix + connector + n.name + (n.type === 'folder' ? '/' : '') + '\n'
        if (n.children) {
          const newPrefix = prefix + (isLast ? '    ' : '│   ')
          n.children.forEach((child: FileNode, idx: number) => {
            result += buildTree(child, newPrefix, idx === n.children!.length - 1)
          })
        }
        return result
      }
      
      const treeOutput = target + '/\n' + (node.children || []).map((child: FileNode, idx: number) => 
        buildTree(child, '', idx === (node.children?.length || 0) - 1)
      ).join('')
      
      return { output: treeOutput }
    }
    
    return { output: `tree: ${args[0] || target}: 没有那个文件或目录` }
  },
  description: '显示目录树结构',
  usage: 'tree [路径]',
  examples: ['tree', 'tree /home/user']
})

registerCommand('wc', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'wc: 缺少操作数' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (node && node.type === 'file') {
      const lines = (node.content || '').split('\n').length
      const words = (node.content || '').split(/\s+/).filter(w => w).length
      const chars = (node.content || '').length
      return { output: `  ${lines}  ${words}  ${chars} ${node.name}` }
    }
    
    return { output: `wc: ${args[0]}: 没有那个文件或目录` }
  },
  description: '统计文件行数、字数、字符数',
  usage: 'wc <文件>',
  examples: ['wc README.md']
})