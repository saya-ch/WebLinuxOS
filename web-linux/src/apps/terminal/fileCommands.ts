import { registerCommand, getCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { findNodeByPath, resolvePath } from '../../store'

registerCommand('ls', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    const targetArg = args.find(arg => !arg.startsWith('-'))
    const target = targetArg ? resolvePath(cwd, targetArg) : cwd
    const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al')
    const showLong = args.includes('-l') || args.includes('-la') || args.includes('-al')
    const showRecursive = args.includes('-R')
    const showHuman = args.includes('-h') || args.includes('-lh') || args.includes('-hl')
    const sortBySize = args.includes('-S')
    const sortByTime = args.includes('-t')
    const reverseSort = args.includes('-r')
    
    const node = findNodeByPath(files, target)
    if (!node || node.type !== 'folder') {
      return { output: `ls: 无法访问'${target}': 没有那个文件或目录` }
    }
    if (!node.children || node.children.length === 0) {
      return { output: '' }
    }
    
    const escapeChar = String.fromCharCode(27)
    let children = node.children
    
    if (!showAll) {
      children = children.filter(c => !c.name.startsWith('.'))
    }
    
    children = [...children].sort((a, b) => {
      if (sortBySize) {
        const sizeA = a.type === 'folder' ? 4096 : (a.content?.length || 0)
        const sizeB = b.type === 'folder' ? 4096 : (b.content?.length || 0)
        return reverseSort ? sizeA - sizeB : sizeB - sizeA
      }
      if (sortByTime) {
        const timeA = a.modifiedAt ? new Date(a.modifiedAt).getTime() : 0
        const timeB = b.modifiedAt ? new Date(b.modifiedAt).getTime() : 0
        return reverseSort ? timeA - timeB : timeB - timeA
      }
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return reverseSort ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
    })
    
    const formatSize = (bytes: number): string => {
      if (!showHuman) return bytes.toString()
      if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}M`
      if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}K`
      return bytes.toString()
    }
    
    const getFileColor = (name: string, type: string): string => {
      if (type === 'folder') return `${escapeChar}[34m`
      if (name.endsWith('.sh') || name.endsWith('.bash') || name.endsWith('.py')) return `${escapeChar}[32m`
      if (name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.tsx')) return `${escapeChar}[33m`
      if (name.endsWith('.md') || name.endsWith('.txt')) return `${escapeChar}[37m`
      if (name.endsWith('.json')) return `${escapeChar}[36m`
      if (name.endsWith('.html') || name.endsWith('.css')) return `${escapeChar}[35m`
      if (name.endsWith('.zip') || name.endsWith('.tar') || name.endsWith('.gz')) return `${escapeChar}[31m`
      return `${escapeChar}[0m`
    }
    
    if (showLong) {
      const output = []
      const totalBlocks = children.reduce((sum, c) => {
        const size = c.type === 'folder' ? 4096 : (c.content?.length || 0)
        return sum + Math.ceil(size / 1024)
      }, 0)
      output.push(`总用量 ${showHuman ? formatSize(totalBlocks * 1024) : totalBlocks}`)
      
      children.forEach((child) => {
        const permissions = child.type === 'folder' ? 'drwxr-xr-x' : '-rw-r--r--'
        const links = 1
        const owner = 'user'
        const group = 'user'
        const size = child.type === 'folder' ? 4096 : (child.content?.length || 0)
        const date = child.modifiedAt 
          ? new Date(child.modifiedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        
        const color = getFileColor(child.name, child.type)
        const name = `${color}${child.name}${escapeChar}[0m`
        
        output.push(
          `${permissions} ${links.toString().padStart(3)} ${owner.padEnd(6)} ${group.padEnd(6)} ${formatSize(size).padStart(8)} ${date.padEnd(15)} ${name}`
        )
      })
      
      if (showRecursive) {
        children.filter(c => c.type === 'folder').forEach(folder => {
          output.push('')
          output.push(`${target === '/' ? '' : target}/${folder.name}:`)
          const lsCmd = getCommand('ls')
          if (lsCmd) {
            const subResult = lsCmd.handler({ ...context, args: ['-l'], cwd: (target === '/' ? '' : target) + '/' + folder.name })
            if (subResult && typeof subResult === 'object' && 'output' in subResult && typeof (subResult as CommandResult).output === 'string') {
              output.push((subResult as CommandResult).output)
            }
          }
        })
      }
      
      return { output: output.join('\n') }
    } else {
      const items = children.map((child) => {
        const color = getFileColor(child.name, child.type)
        return `${color}${child.name}${escapeChar}[0m`
      })
      
      return { output: items.join('  ') }
    }
  },
  description: '列出目录内容',
  usage: 'ls [-a] [-l] [-h] [-R] [-S] [-t] [-r] [路径]',
  examples: ['ls', 'ls -la', 'ls -lh', 'ls -R /home/user', 'ls -S /home/user', 'ls -t /home/user']
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
      return { output: 'cat: 缺少操作数\n用法: cat <文件>...' }
    }
    
    const showNumbers = args.includes('-n') || args.includes('--number')
    const showNonBlank = args.includes('-b') || args.includes('--number-nonblank')
    const squeezeBlank = args.includes('-s') || args.includes('--squeeze-blank')
    
    const fileArgs = args.filter(arg => !arg.startsWith('-'))
    
    if (fileArgs.length === 0) {
      return { output: 'cat: 缺少操作数\n用法: cat <文件>...' }
    }
    
    let output = ''
    
    for (const fileArg of fileArgs) {
      const resolved = resolvePath(cwd, fileArg)
      const node = findNodeByPath(files, resolved)
      
      if (!node) {
        output += `cat: ${fileArg}: 没有那个文件或目录\n`
        continue
      }
      
      if (node.type === 'folder') {
        output += `cat: ${fileArg}: 是一个目录\n`
        continue
      }
      
      let content = node.content || ''
      
      if (squeezeBlank) {
        content = content.replace(/\n{3,}/g, '\n\n')
      }
      
      const lines = content.split('\n')
      let lineNum = 1
      
      lines.forEach((line) => {
        if (showNonBlank && line.trim() === '') {
          output += '\n'
        } else if (showNumbers || (showNonBlank && line.trim() !== '')) {
          output += `${lineNum.toString().padStart(6)}  ${line}\n`
          lineNum++
        } else {
          output += `${line}\n`
        }
      })
      
      if (fileArgs.length > 1 && fileArg !== fileArgs[fileArgs.length - 1]) {
        output += '\n'
      }
    }
    
    return { output: output.trimEnd() }
  },
  description: '显示文件内容',
  usage: 'cat [-n] [-b] [-s] <文件>...',
  examples: ['cat README.md', 'cat -n file.txt', 'cat file1.txt file2.txt']
})

registerCommand('head', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'head: 缺少操作数\n用法: head [-n <行数>] <文件>' }
    }
    
    let linesCount = 10
    let fileArg = args[0]
    
    if (args[0] === '-n') {
      linesCount = parseInt(args[1]) || 10
      fileArg = args[2]
    } else if (args[0].startsWith('-n')) {
      linesCount = parseInt(args[0].slice(2)) || 10
      fileArg = args[1]
    } else if (args[0].startsWith('-')) {
      linesCount = parseInt(args[0].slice(1)) || 10
      fileArg = args[1]
    }
    
    if (!fileArg) {
      return { output: 'head: 缺少操作数\n用法: head [-n <行数>] <文件>' }
    }
    
    const resolved = resolvePath(cwd, fileArg)
    const node = findNodeByPath(files, resolved)
    
    if (!node) {
      return { output: `head: ${fileArg}: 没有那个文件或目录` }
    }
    
    if (node.type === 'folder') {
      return { output: `head: ${fileArg}: 是一个目录` }
    }
    
    const lines = (node.content || '').split('\n')
    return { output: lines.slice(0, linesCount).join('\n') }
  },
  description: '显示文件开头部分',
  usage: 'head [-n <行数>] <文件>',
  examples: ['head README.md', 'head -n 5 file.txt', 'head -20 log.txt']
})

registerCommand('tail', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'tail: 缺少操作数\n用法: tail [-n <行数>] <文件>' }
    }
    
    let linesCount = 10
    let fileArg = args[0]
    
    if (args[0] === '-n') {
      linesCount = parseInt(args[1]) || 10
      fileArg = args[2]
    } else if (args[0].startsWith('-n')) {
      linesCount = parseInt(args[0].slice(2)) || 10
      fileArg = args[1]
    } else if (args[0].startsWith('-')) {
      linesCount = parseInt(args[0].slice(1)) || 10
      fileArg = args[1]
    }
    
    if (!fileArg) {
      return { output: 'tail: 缺少操作数\n用法: tail [-n <行数>] <文件>' }
    }
    
    const resolved = resolvePath(cwd, fileArg)
    const node = findNodeByPath(files, resolved)
    
    if (!node) {
      return { output: `tail: ${fileArg}: 没有那个文件或目录` }
    }
    
    if (node.type === 'folder') {
      return { output: `tail: ${fileArg}: 是一个目录` }
    }
    
    const lines = (node.content || '').split('\n')
    return { output: lines.slice(-linesCount).join('\n') }
  },
  description: '显示文件末尾部分',
  usage: 'tail [-n <行数>] <文件>',
  examples: ['tail log.txt', 'tail -n 5 file.txt', 'tail -20 output.txt']
})

registerCommand('mkdir', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, addFile } = context
    
    const createParents = args.includes('-p') || args.includes('--parents')
    const verbose = args.includes('-v') || args.includes('--verbose')
    
    const dirArgs = args.filter(arg => !arg.startsWith('-'))
    
    if (dirArgs.length === 0) {
      return { output: 'mkdir: 缺少操作数\n用法: mkdir [-p] [-v] <目录名>...' }
    }
    
    let output = ''
    
    for (const dirArg of dirArgs) {
      const resolved = resolvePath(cwd, dirArg)
      const parts = resolved.split('/').filter(Boolean)
      const parentPath = '/' + parts.slice(0, -1).join('/') || '/'
      const dirName = parts[parts.length - 1]
      const existing = findNodeByPath(files, resolved)
      
      if (existing) {
        if (existing.type === 'folder') {
          if (verbose) {
            output += `mkdir: 已存在目录 '${dirArg}'\n`
          }
        } else {
          output += `mkdir: 无法创建目录'${dirArg}': 文件已存在\n`
        }
        continue
      }
      
      if (createParents) {
        let currentPath = '/'
        for (let i = 0; i < parts.length; i++) {
          currentPath = currentPath === '/' ? `/${parts[i]}` : `${currentPath}/${parts[i]}`
          const currentNode = findNodeByPath(files, currentPath)
          if (!currentNode) {
            const parent = findNodeByPath(files, currentPath === '/' ? '/' : currentPath.substring(0, currentPath.lastIndexOf('/')))
            if (parent && parent.type === 'folder' && addFile) {
              addFile(parent.id, parts[i], 'folder')
              if (verbose) {
                output += `mkdir: 创建目录 '${currentPath}'\n`
              }
            }
          }
        }
      } else {
        const parentNode = findNodeByPath(files, parentPath)
        
        if (!parentNode) {
          output += `mkdir: 无法创建目录'${dirArg}': 没有那个文件或目录\n`
          continue
        }
        
        if (parentNode.type !== 'folder') {
          output += `mkdir: 无法创建目录'${dirArg}': 不是目录\n`
          continue
        }
        
        if (addFile) {
          addFile(parentNode.id, dirName, 'folder')
          if (verbose) {
            output += `mkdir: 创建目录 '${dirArg}'\n`
          }
        }
      }
    }
    
    return { output: output.trimEnd() }
  },
  description: '创建目录',
  usage: 'mkdir [-p] [-v] <目录名>...',
  examples: ['mkdir projects', 'mkdir -p /home/user/docs/subdir', 'mkdir -v newdir']
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
    
    const recursive = args.includes('-r') || args.includes('-rf') || args.includes('-fr')
    const force = args.includes('-f') || args.includes('-rf') || args.includes('-fr')
    const verbose = args.includes('-v') || args.includes('--verbose')
    const interactive = args.includes('-i') || args.includes('--interactive')
    
    const targetArgs = args.filter(arg => !arg.startsWith('-'))
    
    if (targetArgs.length === 0) {
      return { output: 'rm: 缺少操作数\n用法: rm [-f] [-i] [-r] [-v] <文件或目录>...' }
    }
    
    let output = ''
    
    for (const targetArg of targetArgs) {
      const resolved = resolvePath(cwd, targetArg)
      const node = findNodeByPath(files, resolved)
      
      if (!node) {
        if (!force) {
          output += `rm: 无法删除'${targetArg}': 没有那个文件或目录\n`
        }
        continue
      }
      
      if (node.type === 'folder' && !recursive) {
        output += `rm: 无法删除'${targetArg}': 是一个目录 (使用 -r 参数递归删除)\n`
        continue
      }
      
      if (interactive) {
        output += `rm: 是否删除 ${node.type === 'folder' ? '目录' : '文件'} '${targetArg}'? y/N\n`
        continue
      }
      
      if (deleteFile) {
        deleteFile(node.id)
        if (verbose) {
          output += `rm: 删除 '${targetArg}'\n`
        }
      } else {
        output += `rm: 无法删除'${targetArg}': 权限不够\n`
      }
    }
    
    return { output: output.trimEnd() }
  },
  description: '删除文件或目录',
  usage: 'rm [-f] [-i] [-r] [-v] <文件或目录>...',
  examples: ['rm oldfile.txt', 'rm -rf temp/', 'rm -i important.txt', 'rm -v file1.txt file2.txt']
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