import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { findNodeByPath } from '../../store'

registerCommand('sort', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: '用法: sort <file>' }
    }
    
    const filename = args[0]
    const filePath = filename.startsWith('/') ? filename : `${cwd}/${filename}`
    const file = findNodeByPath(files, filePath)
    
    if (!file || file.type !== 'file') {
      return { output: `sort: ${filename}: 没有那个文件或目录` }
    }
    
    const content = file.content || ''
    const lines = content.split('\n').filter(l => l.trim()).sort()
    
    return { output: lines.join('\n') }
  },
  description: '对文件内容排序',
  usage: 'sort <file>',
  examples: ['sort names.txt']
})

registerCommand('uniq', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: '用法: uniq <file>' }
    }
    
    const filename = args[0]
    const filePath = filename.startsWith('/') ? filename : `${cwd}/${filename}`
    const file = findNodeByPath(files, filePath)
    
    if (!file || file.type !== 'file') {
      return { output: `uniq: ${filename}: 没有那个文件或目录` }
    }
    
    const content = file.content || ''
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
  },
  description: '删除重复行',
  usage: 'uniq <file>',
  examples: ['uniq log.txt']
})

registerCommand('cut', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length < 2) {
      return { output: '用法: cut -f <field> <file>' }
    }
    
    const fieldIndex = parseInt(args[1]) - 1
    const filename = args[2]
    const filePath = filename.startsWith('/') ? filename : `${cwd}/${filename}`
    const file = findNodeByPath(files, filePath)
    
    if (!file || file.type !== 'file') {
      return { output: `cut: ${filename}: 没有那个文件或目录` }
    }
    
    const content = file.content || ''
    const lines = content.split('\n')
    const result: string[] = []
    
    lines.forEach(line => {
      const fields = line.split('\t')
      if (fields[fieldIndex] !== undefined) {
        result.push(fields[fieldIndex])
      }
    })
    
    return { output: result.join('\n') }
  },
  description: '提取字段',
  usage: 'cut -f <field> <file>',
  examples: ['cut -f 2 data.tsv']
})

registerCommand('paste', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length < 2) {
      return { output: '用法: paste <file1> <file2>' }
    }
    
    const file1Path = args[0].startsWith('/') ? args[0] : `${cwd}/${args[0]}`
    const file2Path = args[1].startsWith('/') ? args[1] : `${cwd}/${args[1]}`
    
    const file1 = findNodeByPath(files, file1Path)
    const file2 = findNodeByPath(files, file2Path)
    
    if (!file1 || file1.type !== 'file') {
      return { output: `paste: ${args[0]}: 没有那个文件或目录` }
    }
    
    if (!file2 || file2.type !== 'file') {
      return { output: `paste: ${args[1]}: 没有那个文件或目录` }
    }
    
    const lines1 = (file1.content || '').split('\n')
    const lines2 = (file2.content || '').split('\n')
    const result: string[] = []
    
    const maxLen = Math.max(lines1.length, lines2.length)
    for (let i = 0; i < maxLen; i++) {
      result.push(`${lines1[i] || ''}\t${lines2[i] || ''}`)
    }
    
    return { output: result.join('\n') }
  },
  description: '合并文件',
  usage: 'paste <file1> <file2>',
  examples: ['paste names.txt emails.txt']
})

registerCommand('nl', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: '用法: nl <file>' }
    }
    
    const filename = args[0]
    const filePath = filename.startsWith('/') ? filename : `${cwd}/${filename}`
    const file = findNodeByPath(files, filePath)
    
    if (!file || file.type !== 'file') {
      return { output: `nl: ${filename}: 没有那个文件或目录` }
    }
    
    const content = file.content || ''
    const lines = content.split('\n')
    const result: string[] = []
    
    lines.forEach((line, index) => {
      result.push(`${(index + 1).toString().padStart(6)} ${line}`)
    })
    
    return { output: result.join('\n') }
  },
  description: '显示行号',
  usage: 'nl <file>',
  examples: ['nl script.py']
})

registerCommand('expand', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: '用法: expand <file>' }
    }
    
    const filename = args[0]
    const filePath = filename.startsWith('/') ? filename : `${cwd}/${filename}`
    const file = findNodeByPath(files, filePath)
    
    if (!file || file.type !== 'file') {
      return { output: `expand: ${filename}: 没有那个文件或目录` }
    }
    
    const content = file.content || ''
    const result = content.replace(/\t/g, '    ')
    
    return { output: result }
  },
  description: '将制表符转换为空格',
  usage: 'expand <file>',
  examples: ['expand Makefile']
})

registerCommand('tr', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length < 3) {
      return { output: '用法: tr <from> <to> <file>' }
    }
    
    const from = args[0]
    const to = args[1]
    const filename = args[2]
    const filePath = filename.startsWith('/') ? filename : `${cwd}/${filename}`
    const file = findNodeByPath(files, filePath)
    
    if (!file || file.type !== 'file') {
      return { output: `tr: ${filename}: 没有那个文件或目录` }
    }
    
    const content = file.content || ''
    const mapping: Record<string, string> = {}
    for (let i = 0; i < from.length; i++) {
      mapping[from[i]] = to[i] || from[i]
    }
    
    const result = content.split('').map(char => mapping[char] || char).join('')
    
    return { output: result }
  },
  description: '字符转换',
  usage: 'tr <from> <to> <file>',
  examples: ['tr abc ABC file.txt']
})

registerCommand('split', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, addFile } = context
    
    if (args.length < 2) {
      return { output: '用法: split <file> <prefix>' }
    }
    
    const filename = args[0]
    const prefix = args[1]
    const linesPerFile = args.length > 2 ? parseInt(args[2]) : 10
    
    const filePath = filename.startsWith('/') ? filename : `${cwd}/${filename}`
    const file = findNodeByPath(files, filePath)
    
    if (!file || file.type !== 'file') {
      return { output: `split: ${filename}: 没有那个文件或目录` }
    }
    
    const content = file.content || ''
    const lines = content.split('\n')
    const parts: string[][] = []
    
    for (let i = 0; i < lines.length; i += linesPerFile) {
      parts.push(lines.slice(i, i + linesPerFile))
    }
    
    if (addFile && parts.length > 0) {
      const parentPath = filePath.lastIndexOf('/') !== -1 ? filePath.substring(0, filePath.lastIndexOf('/')) : '/'
      const parentNode = findNodeByPath(files, parentPath)
      
      if (parentNode && parentNode.type === 'folder') {
        parts.forEach((_, index) => {
          const suffix = String.fromCharCode(97 + index)
          addFile(parentNode.id, `${prefix}${suffix}`, 'file')
        })
      }
    }
    
    return { output: `文件已分割为 ${parts.length} 个部分` }
  },
  description: '分割文件',
  usage: 'split <file> <prefix> [lines]',
  examples: ['split large.txt part']
})

registerCommand('diff', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length < 2) {
      return { output: '用法: diff <file1> <file2>' }
    }
    
    const file1Path = args[0].startsWith('/') ? args[0] : `${cwd}/${args[0]}`
    const file2Path = args[1].startsWith('/') ? args[1] : `${cwd}/${args[1]}`
    
    const file1 = findNodeByPath(files, file1Path)
    const file2 = findNodeByPath(files, file2Path)
    
    if (!file1 || file1.type !== 'file') {
      return { output: `diff: ${args[0]}: 没有那个文件或目录` }
    }
    
    if (!file2 || file2.type !== 'file') {
      return { output: `diff: ${args[1]}: 没有那个文件或目录` }
    }
    
    const lines1 = (file1.content || '').split('\n')
    const lines2 = (file2.content || '').split('\n')
    const result: string[] = []
    
    result.push(`--- ${args[0]}`)
    result.push(`+++ ${args[1]}`)
    result.push('')
    
    const maxLen = Math.max(lines1.length, lines2.length)
    for (let i = 0; i < maxLen; i++) {
      const line1 = lines1[i]
      const line2 = lines2[i]
      
      if (line1 === line2) {
        result.push(`  ${line1}`)
      } else if (line1 === undefined) {
        result.push(`+ ${line2}`)
      } else if (line2 === undefined) {
        result.push(`- ${line1}`)
      } else {
        result.push(`- ${line1}`)
        result.push(`+ ${line2}`)
      }
    }
    
    return { output: result.join('\n') }
  },
  description: '比较文件差异',
  usage: 'diff <file1> <file2>',
  examples: ['diff old.txt new.txt']
})

registerCommand('chmod', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length < 2) {
      return { output: '用法: chmod <permissions> <file>' }
    }
    
    const permissions = args[0]
    const filename = args[1]
    const filePath = filename.startsWith('/') ? filename : `${cwd}/${filename}`
    const file = findNodeByPath(files, filePath)
    
    if (!file) {
      return { output: `chmod: ${filename}: 没有那个文件或目录` }
    }
    
    return { output: `权限已设置为 ${permissions}` }
  },
  description: '修改文件权限',
  usage: 'chmod <permissions> <file>',
  examples: ['chmod 755 script.sh']
})

registerCommand('gzip', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, addFile, deleteFile } = context
    
    if (args.length === 0) {
      return { output: '用法: gzip <file>' }
    }
    
    const filename = args[0]
    const filePath = filename.startsWith('/') ? filename : `${cwd}/${filename}`
    const file = findNodeByPath(files, filePath)
    
    if (!file || file.type !== 'file') {
      return { output: `gzip: ${filename}: 没有那个文件或目录` }
    }
    
    const parentPath = filePath.lastIndexOf('/') !== -1 ? filePath.substring(0, filePath.lastIndexOf('/')) : '/'
    const parentNode = findNodeByPath(files, parentPath)
    
    if (parentNode && parentNode.type === 'folder' && addFile && deleteFile) {
      deleteFile(file.id)
      addFile(parentNode.id, `${filename}.gz`, 'file')
    }
    
    return { output: '' }
  },
  description: '压缩文件',
  usage: 'gzip <file>',
  examples: ['gzip log.txt']
})

registerCommand('gunzip', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, addFile, deleteFile } = context
    
    if (args.length === 0) {
      return { output: '用法: gunzip <file.gz>' }
    }
    
    const filename = args[0]
    if (!filename.endsWith('.gz')) {
      return { output: 'gunzip: 文件必须以 .gz 结尾' }
    }
    
    const filePath = filename.startsWith('/') ? filename : `${cwd}/${filename}`
    const file = findNodeByPath(files, filePath)
    
    if (!file || file.type !== 'file') {
      return { output: `gunzip: ${filename}: 没有那个文件或目录` }
    }
    
    const parentPath = filePath.lastIndexOf('/') !== -1 ? filePath.substring(0, filePath.lastIndexOf('/')) : '/'
    const parentNode = findNodeByPath(files, parentPath)
    const newName = filename.slice(0, -3)
    
    if (parentNode && parentNode.type === 'folder' && addFile && deleteFile) {
      deleteFile(file.id)
      addFile(parentNode.id, newName, 'file')
    }
    
    return { output: '' }
  },
  description: '解压文件',
  usage: 'gunzip <file.gz>',
  examples: ['gunzip log.txt.gz']
})

registerCommand('file', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: '用法: file <file>' }
    }
    
    const filename = args[0]
    const filePath = filename.startsWith('/') ? filename : `${cwd}/${filename}`
    const file = findNodeByPath(files, filePath)
    
    if (!file) {
      return { output: `file: ${filename}: 没有那个文件或目录` }
    }
    
    const extensions: Record<string, string> = {
      '.txt': '文本文件',
      '.md': 'Markdown 文件',
      '.py': 'Python 脚本',
      '.js': 'JavaScript 文件',
      '.ts': 'TypeScript 文件',
      '.json': 'JSON 数据文件',
      '.html': 'HTML 文档',
      '.css': 'CSS 样式文件',
      '.xml': 'XML 文件',
      '.yaml': 'YAML 文件',
      '.yml': 'YAML 文件',
      '.csv': 'CSV 数据文件',
      '.tsv': 'TSV 数据文件',
      '.log': '日志文件',
      '.sh': 'Shell 脚本',
      '.sql': 'SQL 脚本',
      '.gitignore': 'Git 忽略配置',
      '.env': '环境变量配置',
      '.config': '配置文件',
      '.cfg': '配置文件',
    }
    
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
    const fileType = extensions[ext] || '未知文件类型'
    
    return { output: `${filename}: ${fileType}` }
  },
  description: '识别文件类型',
  usage: 'file <file>',
  examples: ['file README.md']
})

registerCommand('alias', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '当前别名:',
          '',
          '  ll → ls -la',
          '  la → ls -a',
          '  .. → cd ..',
          '  ... → cd ../..',
          '  home → cd ~',
          '  cls → clear',
          '  q → exit',
          '',
          '用法: alias <name>=<command>',
          '示例: alias myls="ls -la"',
        ].join('\n')
      }
    }
    
    const aliasDef = args.join(' ')
    const [name, command] = aliasDef.split('=').map(s => s.trim())
    
    if (!name || !command) {
      return { output: '用法: alias <name>=<command>' }
    }
    
    return { output: `别名 ${name} → ${command} 已设置` }
  },
  description: '管理命令别名',
  usage: 'alias [name=command]',
  examples: ['alias', 'alias myls="ls -la"']
})

registerCommand('history', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const history = [
      'ls -la',
      'cd /home/user',
      'cat README.md',
      'git status',
      'npm run dev',
      'weather',
      'crypto',
      'news',
    ]
    
    const n = args.length > 0 ? parseInt(args[0]) : history.length
    
    const output: string[] = []
    output.push(`最近 ${Math.min(n, history.length)} 条命令:`)
    output.push('═'.repeat(50))
    
    history.slice(-n).forEach((cmd, index) => {
      const fullIndex = history.length - n + index + 1
      output.push(`${fullIndex.toString().padStart(4)} ${cmd}`)
    })
    
    return { output: output.join('\n') }
  },
  description: '查看命令历史',
  usage: 'history [n]',
  examples: ['history', 'history 5']
})

registerCommand('export', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '当前环境变量:',
          '',
          '  PATH=/usr/local/bin:/usr/bin:/bin',
          '  HOME=/home/user',
          '  USER=user',
          '  SHELL=/bin/bash',
          '  LANG=zh_CN.UTF-8',
          '  TERM=xterm-256color',
          '',
          '用法: export <VAR>=<value>',
        ].join('\n')
      }
    }
    
    const varDef = args.join(' ')
    const [name, value] = varDef.split('=').map(s => s.trim())
    
    return { output: `环境变量 ${name}=${value} 已设置` }
  },
  description: '设置环境变量',
  usage: 'export <VAR>=<value>',
  examples: ['export', 'export EDITOR=vim']
})

registerCommand('set', {
  handler: (): CommandResult => {
    return {
      output: [
        'Shell 选项:',
        '',
        '  -e  : 命令出错时立即退出',
        '  -u  : 使用未定义变量时出错',
        '  -x  : 执行命令前显示命令',
        '',
        '当前设置:',
        '  WebLinuxOS Shell v2.3',
        '',
        '用法: set -eux',
      ].join('\n')
    }
  },
  description: '设置Shell选项',
  usage: 'set [options]',
  examples: ['set', 'set -e']
})

registerCommand('unset', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: '用法: unset <VAR>' }
    }
    
    const varName = args[0]
    
    return { output: `环境变量 ${varName} 已删除` }
  },
  description: '删除环境变量',
  usage: 'unset <VAR>',
  examples: ['unset EDITOR']
})

registerCommand('source', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: '用法: source <file>' }
    }
    
    const filename = args[0]
    const filePath = filename.startsWith('/') ? filename : `${cwd}/${filename}`
    const file = findNodeByPath(files, filePath)
    
    if (!file || file.type !== 'file') {
      return { output: `source: ${filename}: 没有那个文件或目录` }
    }
    
    const content = file.content || ''
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'))
    
    return { output: `已执行 ${lines.length} 条命令` }
  },
  description: '执行脚本文件',
  usage: 'source <file>',
  examples: ['source .bashrc']
})

registerCommand('exec', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: '用法: exec <command>' }
    }
    
    const command = args.join(' ')
    
    return { output: `执行命令: ${command}` }
  },
  description: '执行命令替换当前Shell',
  usage: 'exec <command>',
  examples: ['exec bash']
})

registerCommand('exit', {
  handler: (): CommandResult => {
    return { output: '' }
  },
  description: '退出终端',
  usage: 'exit',
  examples: ['exit']
})

registerCommand('logout', {
  handler: (): CommandResult => {
    return { output: '已退出登录' }
  },
  description: '退出登录',
  usage: 'logout',
  examples: ['logout']
})