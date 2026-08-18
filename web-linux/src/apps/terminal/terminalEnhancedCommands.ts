/**
 * 终端增强命令集 — v109
 *
 * 提供文件编辑、内容统计、脚本执行等实用终端命令，
 * 让 WebLinuxOS 的终端更接近真实 Linux 终端体验。
 */

import { registerCommand, getCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { findNodeByPath, resolvePath } from '../../store'
import { formatBytes } from './terminalApiService'

// ─── 1. edit 命令 ─── 基于文件系统的文本编辑器命令
registerCommand('edit', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, addFile, updateFileContent } = context

    if (args.length === 0) {
      return {
        output: [
          'edit — 终端文本编辑器',
          '',
          '用法:',
          '  edit <文件名>              查看文件内容并提示编辑方式',
          '  edit -n <文件名>           创建新文件（等同 touch）',
          '  edit <文件名> --set "内容"  直接设置文件内容',
          '',
          '提示: 使用 write <文件名> <内容> 保存修改',
          '      使用 write -a <文件名> <内容> 追加内容',
        ].join('\n')
      }
    }

    const isNew = args[0] === '-n'
    const filteredArgs = isNew ? args.slice(1) : args
    const fileName = filteredArgs[0]

    if (!fileName) {
      return { output: 'edit: 缺少文件名参数' }
    }

    const resolved = resolvePath(cwd, fileName)
    const parts = resolved.split('/').filter(Boolean)
    const parentPath = '/' + parts.slice(0, -1).join('/') || '/'
    const baseName = parts[parts.length - 1]
    const existing = findNodeByPath(files, resolved)

    // --set 模式：直接设置文件内容
    const setIdx = filteredArgs.indexOf('--set')
    if (setIdx !== -1) {
      const content = filteredArgs.slice(setIdx + 1).join(' ')
      if (existing && existing.type === 'file' && updateFileContent) {
        updateFileContent(existing.id, content)
        return { output: `✔ 已更新: ${fileName} (${content.length} 字节)` }
      }
      const parentNode = findNodeByPath(files, parentPath)
      if (parentNode && parentNode.type === 'folder' && addFile) {
        addFile(parentNode.id, baseName, 'file')
        setTimeout(() => {
          const newNode = findNodeByPath(files, resolved)
          if (newNode && updateFileContent) {
            updateFileContent(newNode.id, content)
          }
        }, 50)
        return { output: `✔ 已创建并写入: ${fileName} (${content.length} 字节)` }
      }
      return { output: `edit: 无法创建 '${fileName}': 没有那个文件或目录` }
    }

    // -n 模式：创建新文件
    if (isNew) {
      if (existing) {
        return { output: `edit: 文件 '${fileName}' 已存在` }
      }
      const parentNode = findNodeByPath(files, parentPath)
      if (parentNode && parentNode.type === 'folder' && addFile) {
        addFile(parentNode.id, baseName, 'file')
        return { output: `✔ 已创建新文件: ${fileName}` }
      }
      return { output: `edit: 无法创建 '${fileName}': 没有那个文件或目录` }
    }

    // 普通模式：查看文件内容
    if (!existing) {
      return {
        output: [
          `edit: '${fileName}' 不存在`,
          '',
          `使用 edit -n ${fileName} 创建新文件`,
          `使用 edit ${fileName} --set "内容" 直接创建并写入`,
        ].join('\n')
      }
    }

    if (existing.type === 'folder') {
      return { output: `edit: '${fileName}' 是一个目录` }
    }

    const content = existing.content || ''
    const lines = content.split('\n')
    const numberedLines = lines.map((line, i) => `${(i + 1).toString().padStart(4)} │ ${line}`).join('\n')

    return {
      output: [
        `── 编辑: ${fileName} (${lines.length} 行, ${content.length} 字节) ──`,
        '',
        numberedLines,
        '',
        '─'.repeat(40),
        '使用 write 命令保存修改:',
        `  write ${fileName} <新内容>          覆盖写入`,
        `  write -a ${fileName} <追加内容>     追加到末尾`,
        `  edit ${fileName} --set "新内容"     直接设置`,
      ].join('\n')
    }
  },
  description: '终端文本编辑器 — 查看/创建/编辑文件',
  usage: 'edit <文件名> | edit -n <文件名> | edit <文件名> --set "内容"',
  examples: ['edit readme.txt', 'edit -n newfile.txt', 'edit config.json --set "hello world"'],
}, { source: 'terminalEnhancedCommands' })

// ─── 2. write 命令增强 ─── 支持 -a 追加模式
registerCommand('write', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, addFile, updateFileContent } = context

    if (args.length === 0) {
      return {
        output: [
          'write — 写入文件内容',
          '',
          '用法:',
          '  write <文件名> <内容>       覆盖写入文件',
          '  write -a <文件名> <内容>    追加内容到文件末尾',
        ].join('\n')
      }
    }

    const isAppend = args[0] === '-a'
    const effectiveArgs = isAppend ? args.slice(1) : args

    if (effectiveArgs.length < 2) {
      return { output: 'write: 缺少操作数\n用法: write [-a] <文件名> <内容...>' }
    }

    const resolved = resolvePath(cwd, effectiveArgs[0])
    const parts = resolved.split('/').filter(Boolean)
    const parentPath = '/' + parts.slice(0, -1).join('/') || '/'
    const fileName = parts[parts.length - 1]
    const parentNode = findNodeByPath(files, parentPath)
    const existing = findNodeByPath(files, resolved)
    const content = effectiveArgs.slice(1).join(' ')

    if (existing && existing.type === 'file' && updateFileContent) {
      const newContent = isAppend
        ? (existing.content || '') + '\n' + content
        : content
      updateFileContent(existing.id, newContent)
      return { output: isAppend ? `✔ 已追加到 ${fileName}` : '' }
    }

    if (parentNode && parentNode.type === 'folder' && addFile) {
      addFile(parentNode.id, fileName, 'file')
      setTimeout(() => {
        const newNode = findNodeByPath(files, resolved)
        if (newNode && updateFileContent) {
          updateFileContent(newNode.id, content)
        }
      }, 50)
      return { output: '' }
    }

    return { output: `write: 无法创建 '${effectiveArgs[0]}': 没有那个文件或目录` }
  },
  description: '写入文件内容（支持 -a 追加模式）',
  usage: 'write [-a] <文件名> <内容>',
  examples: ['write hello.txt Hello World', 'write -a log.txt 新的日志条目'],
}, { force: true, source: 'terminalEnhancedCommands' })

// ─── 3. head 命令增强 ─── 如果不存在则注册
if (!getCommand('head')) {
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
    examples: ['head README.md', 'head -n 5 file.txt', 'head -20 log.txt'],
  }, { source: 'terminalEnhancedCommands' })
}

// ─── 4. tail 命令增强 ─── 如果不存在则注册
if (!getCommand('tail')) {
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
    examples: ['tail log.txt', 'tail -n 5 file.txt', 'tail -20 output.txt'],
  }, { source: 'terminalEnhancedCommands' })
}

// ─── 5. wc 命令增强 ─── 支持 -l/-w/-c 选项
registerCommand('wc', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context

    if (args.length === 0) {
      return {
        output: [
          'wc — 统计文件行数、字数、字符数',
          '',
          '用法:',
          '  wc <文件名>       统计行数/字数/字符数',
          '  wc -l <文件名>    只统计行数',
          '  wc -w <文件名>    只统计字数',
          '  wc -c <文件名>    只统计字符数',
        ].join('\n')
      }
    }

    const flags: string[] = []
    const fileArgs: string[] = []
    for (const arg of args) {
      if (arg.startsWith('-') && arg.length > 1 && !arg.includes('.')) {
        for (const ch of arg.slice(1)) {
          flags.push(ch)
        }
      } else {
        fileArgs.push(arg)
      }
    }

    if (fileArgs.length === 0) {
      return { output: 'wc: 缺少操作数' }
    }

    const showLines = flags.length === 0 || flags.includes('l')
    const showWords = flags.length === 0 || flags.includes('w')
    const showChars = flags.length === 0 || flags.includes('c')

    const results: string[] = []

    for (const fileArg of fileArgs) {
      const resolved = resolvePath(cwd, fileArg)
      const node = findNodeByPath(files, resolved)

      if (!node || node.type !== 'file') {
        results.push(`wc: ${fileArg}: 没有那个文件或目录`)
        continue
      }

      const content = node.content || ''
      const lineCount = content.split('\n').length
      const wordCount = content.split(/\s+/).filter(w => w).length
      const charCount = content.length

      const parts: string[] = []
      if (showLines) parts.push(lineCount.toString().padStart(7))
      if (showWords) parts.push(wordCount.toString().padStart(7))
      if (showChars) parts.push(charCount.toString().padStart(7))
      parts.push(node.name)

      results.push(parts.join(' '))
    }

    return { output: results.join('\n') }
  },
  description: '统计文件行数、字数、字符数（支持 -l/-w/-c）',
  usage: 'wc [-l] [-w] [-c] <文件>...',
  examples: ['wc README.md', 'wc -l script.sh', 'wc -w notes.txt', 'wc -c data.bin'],
}, { force: true, source: 'terminalEnhancedCommands' })

// ─── 6. diff 命令 ─── 如果不存在则注册
if (!getCommand('diff')) {
  registerCommand('diff', {
    handler: (context: CommandContext): CommandResult => {
      const { args, cwd, files } = context

      if (args.length < 2) {
        return { output: 'diff: 缺少操作数\n用法: diff <文件1> <文件2>' }
      }

      const resolved1 = resolvePath(cwd, args[0])
      const resolved2 = resolvePath(cwd, args[1])
      const node1 = findNodeByPath(files, resolved1)
      const node2 = findNodeByPath(files, resolved2)

      if (!node1 || node1.type !== 'file') {
        return { output: `diff: ${args[0]}: 没有那个文件或目录` }
      }
      if (!node2 || node2.type !== 'file') {
        return { output: `diff: ${args[1]}: 没有那个文件或目录` }
      }

      const lines1 = (node1.content || '').split('\n')
      const lines2 = (node2.content || '').split('\n')

      const maxLines = Math.max(lines1.length, lines2.length)
      const diffOutput: string[] = [`--- ${args[0]}`, `+++ ${args[1]}`]

      for (let i = 0; i < maxLines; i++) {
        const line1 = lines1[i] || ''
        const line2 = lines2[i] || ''

        if (line1 === line2) {
          diffOutput.push(`  ${line1}`)
        } else if (!lines1[i] && lines2[i] !== undefined) {
          diffOutput.push(`+ ${line2}`)
        } else if (lines1[i] !== undefined && !lines2[i]) {
          diffOutput.push(`- ${line1}`)
        } else {
          diffOutput.push(`- ${line1}`)
          diffOutput.push(`+ ${line2}`)
        }
      }

      if (lines1.length === lines2.length && diffOutput.length === 2) {
        return { output: '文件内容相同，无差异' }
      }

      return { output: diffOutput.join('\n') }
    },
    description: '比较两个文件内容差异',
    usage: 'diff <文件1> <文件2>',
    examples: ['diff old.txt new.txt', 'diff config.yaml backup.yaml'],
  }, { source: 'terminalEnhancedCommands' })
}

// ─── 7. run 命令 ─── 执行脚本文件
registerCommand('run', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context

    if (args.length === 0) {
      return {
        output: [
          'run — 执行脚本文件',
          '',
          '用法: run <脚本文件>',
          '',
          '脚本格式:',
          '  每行一个终端命令',
          '  以 # 开头的行为注释，将被忽略',
          '  空行将被跳过',
          '',
          '示例脚本 (deploy.sh):',
          '  #!/bin/bash',
          '  # 部署脚本',
          '  mkdir -p /home/user/deploy',
          '  write /home/user/deploy/version.txt v1.0.0',
        ].join('\n')
      }
    }

    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)

    if (!node) {
      return { output: `run: ${args[0]}: 没有那个文件或目录` }
    }

    if (node.type === 'folder') {
      return { output: `run: ${args[0]}: 是一个目录` }
    }

    const content = node.content || ''
    const scriptLines = content.split('\n')

    const commandsToRun: string[] = []
    for (const line of scriptLines) {
      const trimmed = line.trim()
      // 跳过空行、注释行、shebang
      if (!trimmed || trimmed.startsWith('#')) continue
      commandsToRun.push(trimmed)
    }

    if (commandsToRun.length === 0) {
      return { output: `run: ${args[0]}: 脚本为空或只包含注释` }
    }

    const outputLines: string[] = []
    outputLines.push(`▶ 执行脚本: ${args[0]} (${commandsToRun.length} 条命令)`)
    outputLines.push('─'.repeat(40))

    for (let i = 0; i < commandsToRun.length; i++) {
      const cmd = commandsToRun[i]
      const cmdName = cmd.split(/\s+/)[0].toLowerCase()
      const cmdDef = getCommand(cmdName)

      outputLines.push(``)
      outputLines.push(`[${i + 1}/${commandsToRun.length}] $ ${cmd}`)

      if (!cmdDef) {
        outputLines.push(`  ⚠ 命令未找到: ${cmdName}`)
        continue
      }

      try {
        const cmdArgs = cmd.split(/\s+/).slice(1)
        const subContext: CommandContext = {
          ...context,
          args: cmdArgs,
        }
        const result = cmdDef.handler(subContext)
        if (result && typeof result === 'object' && 'output' in result) {
          const output = (result as CommandResult).output
          if (output) {
            outputLines.push(output)
          }
          // 如果命令改变了 cwd，更新后续命令的 cwd
          if ((result as CommandResult).cwd) {
            (subContext as { cwd: string }).cwd = (result as CommandResult).cwd!
          }
        }
      } catch (err) {
        outputLines.push(`  ✌ 执行错误: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    outputLines.push('')
    outputLines.push('─'.repeat(40))
    outputLines.push(`✔ 脚本执行完毕 (${commandsToRun.length} 条命令)`)

    return { output: outputLines.join('\n') }
  },
  description: '执行脚本文件（解析简单 shell 命令序列）',
  usage: 'run <脚本文件>',
  examples: ['run deploy.sh', 'run setup.sh', 'run /home/user/scripts/init.sh'],
}, { source: 'terminalEnhancedCommands' })

// ─── 8. tree 命令 ─── 如果不存在则注册
if (!getCommand('tree')) {
  registerCommand('tree', {
    handler: (context: CommandContext): CommandResult => {
      const { args, cwd, files } = context
      const target = args[0] ? resolvePath(cwd, args[0]) : cwd
      const node = findNodeByPath(files, target)

      if (!node || node.type !== 'folder') {
        return { output: `tree: ${args[0] || target}: 没有那个文件或目录` }
      }

      let dirCount = 0
      let fileCount = 0

      const buildTree = (n: typeof node, prefix = '', isLast = true): string => {
        const connector = isLast ? '└── ' : '├── '
        let result = prefix + connector + n.name + (n.type === 'folder' ? '/' : '') + '\n'
        if (n.type === 'folder') dirCount++
        else fileCount++
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

      return { output: treeOutput + `\n${dirCount} 个目录, ${fileCount} 个文件` }
    },
    description: '树形显示目录结构',
    usage: 'tree [路径]',
    examples: ['tree', 'tree /home/user', 'tree documents/'],
  }, { source: 'terminalEnhancedCommands' })
}

// ─── 9. which 命令 ─── 如果不存在则注册
if (!getCommand('which')) {
  registerCommand('which', {
    handler: (context: CommandContext): CommandResult => {
      const { args } = context

      if (args.length === 0) {
        return { output: 'which: 缺少参数\n用法: which <命令>' }
      }

      const results: string[] = []
      for (const arg of args) {
        const command = arg.toLowerCase()
        const cmdDef = getCommand(command)
        if (cmdDef) {
          results.push(`/usr/bin/${command}`)
        } else {
          results.push(`which: ${command}: 未找到`)
        }
      }

      return { output: results.join('\n') }
    },
    description: '查找命令位置',
    usage: 'which <命令>...',
    examples: ['which ls', 'which python', 'which neofetch'],
  }, { source: 'terminalEnhancedCommands' })
}

// ─── 10. whereis 命令 ─── 查找命令位置及相关文件
registerCommand('whereis', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context

    if (args.length === 0) {
      return { output: 'whereis: 缺少参数\n用法: whereis <命令>' }
    }

    const results: string[] = []
    for (const arg of args) {
      const command = arg.toLowerCase()
      const cmdDef = getCommand(command)

      if (cmdDef) {
        const locations: string[] = []
        locations.push(`/usr/bin/${command}`)

        // 模拟常见命令的额外位置
        if (['ls', 'cat', 'cp', 'mv', 'rm', 'mkdir', 'rmdir'].includes(command)) {
          locations.push(`/bin/${command}`)
        }
        if (['bash', 'sh'].includes(command)) {
          locations.push(`/bin/${command}`)
        }

        const manPath = `/usr/share/man/man1/${command}.1.gz`
        const srcPath = `/usr/src/${command}`

        results.push(`${command}: ${locations.join(' ')} ${manPath} ${srcPath}`)
      } else {
        results.push(`${command}:`)
      }
    }

    return { output: results.join('\n') }
  },
  description: '查找命令位置及相关文件（二进制/源码/手册）',
  usage: 'whereis <命令>...',
  examples: ['whereis ls', 'whereis python', 'whereis bash'],
}, { source: 'terminalEnhancedCommands' })

// ─── 11. env 命令 ─── 如果不存在则注册
if (!getCommand('env')) {
  registerCommand('env', {
    handler: (context: CommandContext): CommandResult => {
      const envVars: Record<string, string> = {
        HOME: '/home/user',
        PATH: '/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games',
        SHELL: '/bin/bash',
        USER: context.username,
        LOGNAME: context.username,
        HOSTNAME: context.hostname,
        TERM: 'xterm-256color',
        LANG: 'zh_CN.UTF-8',
        LC_ALL: 'zh_CN.UTF-8',
        PWD: context.cwd,
        OLDPWD: context.prevCwd || '',
        EDITOR: 'nano',
        BROWSER: 'browser',
        DISPLAY: ':0',
        COLORTERM: 'truecolor',
        XDG_SESSION_TYPE: 'web',
        XDG_SEAT: 'seat0',
        WEB_LINUX_VERSION: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0',
      }

      const output = Object.entries(envVars)
        .filter(([_, v]) => v)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n')

      return { output }
    },
    description: '显示环境变量',
    usage: 'env',
    examples: ['env'],
  }, { source: 'terminalEnhancedCommands' })
}

// ─── 12. tee 命令增强 ─── 支持 -a 追加和 stdin
registerCommand('tee', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files, addFile, updateFileContent, stdin } = context

    if (args.length === 0) {
      return { output: 'tee: 缺少操作数\n用法: tee [-a] <文件名> [内容...]' }
    }

    const isAppend = args[0] === '-a'
    const effectiveArgs = isAppend ? args.slice(1) : args

    if (effectiveArgs.length === 0) {
      return { output: 'tee: 缺少操作数\n用法: tee [-a] <文件名> [内容...]' }
    }

    const resolved = resolvePath(cwd, effectiveArgs[0])
    const parts = resolved.split('/').filter(Boolean)
    const parentPath = '/' + parts.slice(0, -1).join('/') || '/'
    const fileName = parts[parts.length - 1]
    const parentNode = findNodeByPath(files, parentPath)
    const existing = findNodeByPath(files, resolved)
    // 优先使用 stdin，其次使用命令行参数中的内容
    const content = stdin || effectiveArgs.slice(1).join(' ') || ''

    if (existing && existing.type === 'file' && updateFileContent) {
      const newContent = isAppend
        ? (existing.content || '') + '\n' + content
        : content
      updateFileContent(existing.id, newContent)
      return { output: content }
    }

    if (parentNode && parentNode.type === 'folder' && addFile) {
      addFile(parentNode.id, fileName, 'file')
      setTimeout(() => {
        const newNode = findNodeByPath(files, resolved)
        if (newNode && updateFileContent) {
          updateFileContent(newNode.id, content)
        }
      }, 50)
      return { output: content }
    }

    return { output: `tee: 无法创建 '${effectiveArgs[0]}': 没有那个文件或目录` }
  },
  description: '从标准输入读取并写入文件（支持 -a 追加）',
  usage: 'tee [-a] <文件名> [内容...]',
  examples: ['tee output.txt 写入内容', 'tee -a log.txt 追加日志', 'echo hello | tee output.txt'],
}, { force: true, source: 'terminalEnhancedCommands' })
