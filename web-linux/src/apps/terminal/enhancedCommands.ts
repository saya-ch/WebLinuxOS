import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { findNodeByPath, resolvePath } from '../../store'

registerCommand('grep', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length < 2) {
      return { output: 'grep: 缺少操作数\n用法: grep <模式> <文件>' }
    }
    
    const pattern = args[0]
    const resolved = resolvePath(cwd, args[1])
    const node = findNodeByPath(files, resolved)
    
    if (node && node.type === 'file') {
      const content = node.content || ''
      const lines = content.split('\n')
      const matches = lines.map((line, idx) => {
        if (line.includes(pattern)) {
          return `${idx + 1}: ${line}`
        }
        return null
      }).filter(Boolean)
      
      return { output: matches.join('\n') || '没有找到匹配' }
    }
    
    return { output: `grep: ${args[1]}: 没有那个文件或目录` }
  },
  description: '在文件中搜索模式',
  usage: 'grep <模式> <文件>',
  examples: ['grep hello file.txt', 'grep TODO notes.md']
})

registerCommand('find', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'find: 缺少操作数\n用法: find [路径] -name <模式>' }
    }
    
    let targetPath = cwd
    let pattern = ''
    
    const nameIdx = args.indexOf('-name')
    if (nameIdx !== -1 && nameIdx + 1 < args.length) {
      pattern = args[nameIdx + 1]
      if (nameIdx > 0) {
        targetPath = resolvePath(cwd, args[0])
      }
    } else {
      pattern = args[args.length - 1]
      if (args.length > 1) {
        targetPath = resolvePath(cwd, args[0])
      }
    }
    
    const results: string[] = []
    const node = findNodeByPath(files, targetPath)
    
    if (!node || node.type !== 'folder') {
      return { output: `find: ${targetPath}: 不是目录` }
    }
    
    const searchTree = (n: typeof node, currentPath: string) => {
      const fullPath = currentPath + '/' + n.name
      
      if (n.name.includes(pattern)) {
        results.push(fullPath)
      }
      
      if (n.children) {
        n.children.forEach(child => {
          searchTree(child, fullPath)
        })
      }
    }
    
    node.children?.forEach(child => {
      searchTree(child, targetPath)
    })
    
    return { output: results.join('\n') || '没有找到匹配的文件' }
  },
  description: '查找文件',
  usage: 'find [路径] -name <模式>',
  examples: ['find -name *.txt', 'find /home/user -name *.md']
})

registerCommand('chmod', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length < 2) {
      return { output: 'chmod: 缺少操作数\n用法: chmod <权限> <文件>' }
    }
    
    const resolved = resolvePath(cwd, args[1])
    const node = findNodeByPath(files, resolved)
    
    if (!node) {
      return { output: `chmod: ${args[1]}: 没有那个文件或目录` }
    }
    
    return { output: `chmod: 将 '${node.name}' 的权限改为 ${args[0]}` }
  },
  description: '修改文件权限（模拟）',
  usage: 'chmod <权限> <文件>',
  examples: ['chmod 755 script.sh']
})

registerCommand('gzip', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'gzip: 缺少操作数\n用法: gzip <文件>' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (!node || node.type !== 'file') {
      return { output: `gzip: ${args[0]}: 没有那个文件或目录` }
    }
    
    return { output: `gzip: 压缩 '${node.name}' 为 '${node.name}.gz'` }
  },
  description: '压缩文件（模拟）',
  usage: 'gzip <文件>',
  examples: ['gzip largefile.txt']
})

registerCommand('gunzip', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'gunzip: 缺少操作数\n用法: gunzip <文件.gz>' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (!node || node.type !== 'file') {
      return { output: `gunzip: ${args[0]}: 没有那个文件或目录` }
    }
    
    return { output: `gunzip: 解压 '${node.name}'` }
  },
  description: '解压文件（模拟）',
  usage: 'gunzip <文件.gz>',
  examples: ['gunzip archive.gz']
})

registerCommand('file', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'file: 缺少操作数\n用法: file <文件>' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (!node) {
      return { output: `file: ${args[0]}: 没有那个文件或目录` }
    }
    
    if (node.type === 'folder') {
      return { output: `${node.name}: directory` }
    }
    
    const name = node.name.toLowerCase()
    let type = 'text/plain'
    
    if (name.endsWith('.md')) type = 'text/markdown'
    else if (name.endsWith('.js') || name.endsWith('.ts')) type = 'text/javascript'
    else if (name.endsWith('.html') || name.endsWith('.htm')) type = 'text/html'
    else if (name.endsWith('.css')) type = 'text/css'
    else if (name.endsWith('.json')) type = 'application/json'
    else if (name.endsWith('.txt')) type = 'text/plain'
    else if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) type = 'image'
    else if (name.endsWith('.pdf')) type = 'application/pdf'
    else if (name.endsWith('.zip') || name.endsWith('.gz')) type = 'archive'
    
    return { output: `${node.name}: ${type}` }
  },
  description: '识别文件类型',
  usage: 'file <文件>',
  examples: ['file README.md', 'file image.png']
})

registerCommand('sort', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'sort: 缺少操作数\n用法: sort <文件>' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (node && node.type === 'file') {
      const content = node.content || ''
      const lines = content.split('\n').filter(line => line.trim()).sort()
      return { output: lines.join('\n') }
    }
    
    return { output: `sort: ${args[0]}: 没有那个文件或目录` }
  },
  description: '排序文件内容',
  usage: 'sort <文件>',
  examples: ['sort list.txt']
})

registerCommand('uniq', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'uniq: 缺少操作数\n用法: uniq <文件>' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (node && node.type === 'file') {
      const content = node.content || ''
      const lines = content.split('\n')
      const uniqueLines: string[] = []
      let prevLine = ''
      
      lines.forEach(line => {
        if (line !== prevLine) {
          uniqueLines.push(line)
          prevLine = line
        }
      })
      
      return { output: uniqueLines.join('\n') }
    }
    
    return { output: `uniq: ${args[0]}: 没有那个文件或目录` }
  },
  description: '去除重复行',
  usage: 'uniq <文件>',
  examples: ['uniq duplicates.txt']
})

registerCommand('cut', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length < 3) {
      return { output: 'cut: 缺少操作数\n用法: cut -d <分隔符> -f <字段> <文件>' }
    }
    
    const delimiterIdx = args.indexOf('-d')
    const fieldIdx = args.indexOf('-f')
    
    if (delimiterIdx === -1 || fieldIdx === -1) {
      return { output: 'cut: 需要 -d 和 -f 参数' }
    }
    
    const delimiter = args[delimiterIdx + 1]
    const fieldNum = parseInt(args[fieldIdx + 1])
    const fileName = args[args.length - 1]
    const resolved = resolvePath(cwd, fileName)
    const node = findNodeByPath(files, resolved)
    
    if (node && node.type === 'file') {
      const content = node.content || ''
      const lines = content.split('\n').map(line => {
        const fields = line.split(delimiter)
        return fields[fieldNum - 1] || ''
      })
      return { output: lines.join('\n') }
    }
    
    return { output: `cut: ${fileName}: 没有那个文件或目录` }
  },
  description: '提取文件中的字段',
  usage: 'cut -d <分隔符> -f <字段> <文件>',
  examples: ['cut -d , -f 1 data.csv']
})

registerCommand('paste', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length < 2) {
      return { output: 'paste: 缺少操作数\n用法: paste <文件1> <文件2>' }
    }
    
    const resolved1 = resolvePath(cwd, args[0])
    const resolved2 = resolvePath(cwd, args[1])
    const node1 = findNodeByPath(files, resolved1)
    const node2 = findNodeByPath(files, resolved2)
    
    if (!node1 || !node2 || node1.type !== 'file' || node2.type !== 'file') {
      return { output: 'paste: 无效的文件参数' }
    }
    
    const lines1 = (node1.content || '').split('\n')
    const lines2 = (node2.content || '').split('\n')
    const maxLen = Math.max(lines1.length, lines2.length)
    const result: string[] = []
    
    for (let i = 0; i < maxLen; i++) {
      result.push(`${lines1[i] || ''}\t${lines2[i] || ''}`)
    }
    
    return { output: result.join('\n') }
  },
  description: '合并文件内容',
  usage: 'paste <文件1> <文件2>',
  examples: ['paste col1.txt col2.txt']
})

registerCommand('nl', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'nl: 缺少操作数\n用法: nl <文件>' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (node && node.type === 'file') {
      const content = node.content || ''
      const lines = content.split('\n').map((line, idx) => {
        const num = String(idx + 1).padStart(6, ' ')
        return `${num}  ${line}`
      })
      return { output: lines.join('\n') }
    }
    
    return { output: `nl: ${args[0]}: 没有那个文件或目录` }
  },
  description: '显示文件并添加行号',
  usage: 'nl <文件>',
  examples: ['nl script.py']
})

registerCommand('expand', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'expand: 缺少操作数\n用法: expand <文件>' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (node && node.type === 'file') {
      const content = node.content || ''
      const expanded = content.replace(/\t/g, '    ')
      return { output: expanded }
    }
    
    return { output: `expand: ${args[0]}: 没有那个文件或目录` }
  },
  description: '将制表符转换为空格',
  usage: 'expand <文件>',
  examples: ['expand tabbed.txt']
})

registerCommand('tr', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length < 3) {
      return { output: 'tr: 缺少操作数\n用法: tr <字符集1> <字符集2> <文件>' }
    }
    
    const fromSet = args[0]
    const toSet = args[1]
    const fileName = args[2]
    const resolved = resolvePath(cwd, fileName)
    const node = findNodeByPath(files, resolved)
    
    if (node && node.type === 'file') {
      const content = node.content || ''
      let result = ''
      for (const char of content) {
        const idx = fromSet.indexOf(char)
        result += idx !== -1 ? (toSet[idx] || char) : char
      }
      return { output: result }
    }
    
    return { output: `tr: ${fileName}: 没有那个文件或目录` }
  },
  description: '字符转换',
  usage: 'tr <字符集1> <字符集2> <文件>',
  examples: ['tr a-z A-Z file.txt']
})

registerCommand('split', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length < 2) {
      return { output: 'split: 缺少操作数\n用法: split -l <行数> <文件>' }
    }
    
    const linesIdx = args.indexOf('-l')
    if (linesIdx === -1 || linesIdx + 1 >= args.length) {
      return { output: 'split: 需要 -l 参数指定行数' }
    }
    
    const linesPerFile = parseInt(args[linesIdx + 1])
    const fileName = args[args.length - 1]
    const resolved = resolvePath(cwd, fileName)
    const node = findNodeByPath(files, resolved)
    
    if (node && node.type === 'file') {
      const content = node.content || ''
      const lines = content.split('\n')
      const chunks: string[][] = []
      
      for (let i = 0; i < lines.length; i += linesPerFile) {
        chunks.push(lines.slice(i, i + linesPerFile))
      }
      
      const result = chunks.map((chunk, idx) => {
        const prefix = 'x'
        const suffix = String.fromCharCode(97 + idx)
        return `文件 ${prefix}${suffix} (${chunk.length} 行)`
      }).join('\n')
      
      return { output: `split: 将 '${fileName}' 分割为 ${chunks.length} 个文件\n${result}` }
    }
    
    return { output: `split: ${fileName}: 没有那个文件或目录` }
  },
  description: '分割文件',
  usage: 'split -l <行数> <文件>',
  examples: ['split -l 100 largefile.txt']
})