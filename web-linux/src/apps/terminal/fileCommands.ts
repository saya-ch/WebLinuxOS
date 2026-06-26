import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { findNodeByPath, resolvePath } from '../../store'

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
    const { args, cwd, files, addFile } = context
    
    if (args.length === 0) {
      return { output: 'mkdir: 缺少操作数' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const parts = resolved.split('/').filter(Boolean)
    const parentPath = '/' + parts.slice(0, -1).join('/') || '/'
    const dirName = parts[parts.length - 1]
    const parentNode = findNodeByPath(files, parentPath)
    const existing = findNodeByPath(files, resolved)
    
    if (existing) {
      return { output: `mkdir: 无法创建目录'${args[0]}': 文件已存在` }
    }
    
    if (parentNode && parentNode.type === 'folder' && addFile) {
      addFile(parentNode.id, dirName, 'folder')
      return { output: '' }
    }
    
    return { output: `mkdir: 无法创建目录'${args[0]}': 没有那个文件或目录` }
  },
  description: '创建目录',
  usage: 'mkdir <目录名>',
  examples: ['mkdir projects', 'mkdir /home/user/docs']
})

registerCommand('touch', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, addFile } = context
    
    if (args.length === 0) {
      return { output: 'touch: 缺少操作数' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const parts = resolved.split('/').filter(Boolean)
    const parentPath = '/' + parts.slice(0, -1).join('/') || '/'
    const fileName = parts[parts.length - 1]
    const parentNode = findNodeByPath(files, parentPath)
    const existing = findNodeByPath(files, resolved)
    
    if (existing) {
      return { output: '' }
    }
    
    if (parentNode && parentNode.type === 'folder' && addFile) {
      addFile(parentNode.id, fileName, 'file')
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
    const { args, cwd, files, deleteFile } = context
    
    if (args.length === 0) {
      return { output: 'rm: 缺少操作数' }
    }
    
    const recursive = args.includes('-r') || args.includes('-rf')
    
    const targetArg = args.find(arg => !arg.startsWith('-'))
    if (!targetArg) {
      return { output: 'rm: 缺少操作数' }
    }
    
    const resolved = resolvePath(cwd, targetArg)
    const node = findNodeByPath(files, resolved)
    
    if (!node) {
      return { output: `rm: 无法删除'${targetArg}': 没有那个文件或目录` }
    }
    
    if (node.type === 'folder' && !recursive) {
      return { output: `rm: 无法删除'${targetArg}': 是一个目录 (使用 -r 参数递归删除)` }
    }
    
    if (deleteFile) {
      deleteFile(node.id)
      return { output: '' }
    }
    
    return { output: `rm: 无法删除'${targetArg}': 权限不够` }
  },
  description: '删除文件或目录',
  usage: 'rm [-r] <文件或目录>',
  examples: ['rm oldfile.txt', 'rm -rf temp/']
})

registerCommand('tree', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    const target = args[0] ? resolvePath(cwd, args[0]) : cwd
    const node = findNodeByPath(files, target)
    
    if (node && node.type === 'folder') {
      const buildTree = (n: typeof node, prefix = '', isLast = true): string => {
        const connector = isLast ? '└── ' : '├── '
        let result = prefix + connector + n.name + (n.type === 'folder' ? '/' : '') + '\n'
        if (n.children) {
          const newPrefix = prefix + (isLast ? '    ' : '│   ')
          n.children.forEach((child: typeof node, idx: number) => {
            result += buildTree(child, newPrefix, idx === n.children!.length - 1)
          })
        }
        return result
      }
      
      const treeOutput = target + '/\n' + (node.children || []).map((child: typeof node, idx: number) => 
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

registerCommand('cp', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, copyFile, renameFile } = context
    
    if (args.length < 2) {
      return { output: 'cp: 缺少操作数\n用法: cp 源文件 目标路径' }
    }
    
    const source = resolvePath(cwd, args[0])
    const target = resolvePath(cwd, args[1])
    const sourceNode = findNodeByPath(files, source)
    const targetNode = findNodeByPath(files, target)
    
    if (!sourceNode) {
      return { output: `cp: 无法访问'${args[0]}': 没有那个文件或目录` }
    }
    
    if (!copyFile) {
      return { output: 'cp: 权限不足' }
    }
    
    if (targetNode && targetNode.type === 'folder') {
      copyFile(sourceNode.id, targetNode.id)
      return { output: '' }
    }
    
    if (sourceNode.type === 'file' && !targetNode) {
      const parts = target.split('/').filter(Boolean)
      const parentPath = '/' + parts.slice(0, -1).join('/') || '/'
      const fileName = parts[parts.length - 1]
      const parentNode = findNodeByPath(files, parentPath)
      
      if (parentNode && parentNode.type === 'folder') {
        copyFile(sourceNode.id, parentNode.id)
        if (fileName !== sourceNode.name && renameFile) {
          setTimeout(() => {
            const updatedFiles = files
            const parent = findNodeByPath(updatedFiles, parentPath)
            if (parent?.children) {
              const newFile = parent.children.find(c => c.name === sourceNode.name)
              if (newFile) renameFile(newFile.id, fileName)
            }
          }, 50)
        }
        return { output: '' }
      }
      return { output: `cp: 无法创建'${args[1]}': 没有那个文件或目录` }
    }
    
    return { output: `cp: 无法复制'${args[0]}': 无效的目标` }
  },
  description: '复制文件或目录',
  usage: 'cp <源> <目标>',
  examples: ['cp file.txt backup/', 'cp src.txt dest.txt']
})

registerCommand('mv', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, moveFile, renameFile } = context
    
    if (args.length < 2) {
      return { output: 'mv: 缺少操作数\n用法: mv 源文件 目标路径' }
    }
    
    const source = resolvePath(cwd, args[0])
    const target = resolvePath(cwd, args[1])
    const sourceNode = findNodeByPath(files, source)
    const targetNode = findNodeByPath(files, target)
    
    if (!sourceNode) {
      return { output: `mv: 无法访问'${args[0]}': 没有那个文件或目录` }
    }
    
    if (!moveFile) {
      return { output: 'mv: 权限不足' }
    }
    
    if (targetNode && targetNode.type === 'folder') {
      moveFile(sourceNode.id, targetNode.id)
      return { output: '' }
    }
    
    if (sourceNode.type === 'file' && !targetNode) {
      const parts = target.split('/').filter(Boolean)
      const parentPath = '/' + parts.slice(0, -1).join('/') || '/'
      const fileName = parts[parts.length - 1]
      const parentNode = findNodeByPath(files, parentPath)
      
      if (parentNode && parentNode.type === 'folder') {
        moveFile(sourceNode.id, parentNode.id)
        if (fileName !== sourceNode.name && renameFile) {
          setTimeout(() => {
            const updatedFiles = files
            const parent = findNodeByPath(updatedFiles, parentPath)
            if (parent?.children) {
              const movedFile = parent.children.find(c => c.name === sourceNode.name)
              if (movedFile) renameFile(movedFile.id, fileName)
            }
          }, 50)
        }
        return { output: '' }
      }
      return { output: `mv: 无法移动'${args[1]}': 没有那个文件或目录` }
    }
    
    return { output: `mv: 无法移动'${args[0]}': 无效的目标` }
  },
  description: '移动或重命名文件',
  usage: 'mv <源> <目标>',
  examples: ['mv old.txt new.txt', 'mv file.txt /home/user/']
})

registerCommand('write', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, addFile, updateFileContent } = context
    
    if (args.length < 2) {
      return { output: 'write: 缺少操作数\n用法: write <文件名> <内容...>' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const parts = resolved.split('/').filter(Boolean)
    const parentPath = '/' + parts.slice(0, -1).join('/') || '/'
    const fileName = parts[parts.length - 1]
    const parentNode = findNodeByPath(files, parentPath)
    const existing = findNodeByPath(files, resolved)
    const content = args.slice(1).join(' ')
    
    if (existing && existing.type === 'file' && updateFileContent) {
      updateFileContent(existing.id, content)
      return { output: '' }
    }
    
    if (parentNode && parentNode.type === 'folder' && addFile) {
      addFile(parentNode.id, fileName, 'file')
      setTimeout(() => {
        const newFile = findNodeByPath(files, resolved)
        if (newFile && updateFileContent) {
          updateFileContent(newFile.id, content)
        }
      }, 50)
      return { output: '' }
    }
    
    return { output: `write: 无法创建 '${args[0]}': 没有那个文件或目录` }
  },
  description: '写入文件内容',
  usage: 'write <文件名> <内容>',
  examples: ['write hello.txt Hello World', 'write notes.md 今天天气很好']
})

registerCommand('tee', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, addFile, updateFileContent } = context
    
    if (args.length < 2) {
      return { output: 'tee: 缺少操作数\n用法: tee <文件名> <内容...>' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const parts = resolved.split('/').filter(Boolean)
    const parentPath = '/' + parts.slice(0, -1).join('/') || '/'
    const fileName = parts[parts.length - 1]
    const parentNode = findNodeByPath(files, parentPath)
    const existing = findNodeByPath(files, resolved)
    const content = args.slice(1).join(' ')
    
    if (existing && existing.type === 'file' && updateFileContent) {
      updateFileContent(existing.id, content)
      return { output: content }
    }
    
    if (parentNode && parentNode.type === 'folder' && addFile) {
      addFile(parentNode.id, fileName, 'file')
      setTimeout(() => {
        const newFile = findNodeByPath(files, resolved)
        if (newFile && updateFileContent) {
          updateFileContent(newFile.id, content)
        }
      }, 50)
      return { output: content }
    }
    
    return { output: `tee: 无法创建 '${args[0]}': 没有那个文件或目录` }
  },
  description: '写入文件内容并显示',
  usage: 'tee <文件名> <内容>',
  examples: ['tee output.txt 输出内容']
})

registerCommand('append', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, updateFileContent } = context
    
    if (args.length < 2) {
      return { output: 'append: 缺少操作数\n用法: append <文件名> <内容...>' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const existing = findNodeByPath(files, resolved)
    const content = args.slice(1).join(' ')
    
    if (existing && existing.type === 'file' && updateFileContent) {
      updateFileContent(existing.id, (existing.content || '') + content)
      return { output: '' }
    }
    
    return { output: `append: ${args[0]}: 没有那个文件或目录` }
  },
  description: '追加内容到文件',
  usage: 'append <文件名> <内容>',
  examples: ['append log.txt 新日志条目']
})