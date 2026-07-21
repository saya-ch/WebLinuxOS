import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { findNodeByPath, resolvePath } from '../../store'

let commandHistory: string[] = []
const MAX_HISTORY = 100

export function addToHistory(command: string) {
  if (command.trim()) {
    commandHistory = [command, ...commandHistory.filter(c => c !== command)].slice(0, MAX_HISTORY)
  }
}

export function getHistory(): string[] {
  return commandHistory
}

registerCommand('history', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const clearFlag = args.includes('-c')
    
    if (clearFlag) {
      commandHistory = []
      return { output: '' }
    }
    
    const count = parseInt(args[0]) || commandHistory.length
    
    const output = [
      '命令历史',
      '',
      ...commandHistory.slice(0, count).map((cmd, index) => 
        `${(commandHistory.length - index).toString().padStart(4)}  ${cmd}`
      ),
      '',
      `共 ${commandHistory.length} 条记录`,
    ]
    
    return { output: output.join('\n') }
  },
  description: '查看命令历史',
  usage: 'history [数量] [-c]',
  examples: ['history', 'history 20', 'history -c']
})

registerCommand('grep', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length < 2) {
      return { output: 'grep: 缺少操作数\n用法: grep <搜索词> <文件...>' }
    }
    
    const pattern = args[0]
    const fileArgs = args.slice(1).filter(arg => !arg.startsWith('-'))
    const caseInsensitive = args.includes('-i') || args.includes('--ignore-case')
    const showLineNumbers = args.includes('-n') || args.includes('--line-number')
    const invertMatch = args.includes('-v') || args.includes('--invert-match')
    
    if (fileArgs.length === 0) {
      return { output: 'grep: 缺少文件参数' }
    }
    
    let output = ''
    
    for (const fileArg of fileArgs) {
      const resolved = resolvePath(cwd, fileArg)
      const node = findNodeByPath(files, resolved)
      
      if (!node) {
        output += `grep: ${fileArg}: 没有那个文件或目录\n`
        continue
      }
      
      if (node.type === 'folder') {
        output += `grep: ${fileArg}: 是一个目录\n`
        continue
      }
      
      const content = node.content || ''
      const lines = content.split('\n')
      let matched = false
      
      lines.forEach((line, index) => {
        let matches = false
        if (caseInsensitive) {
          matches = line.toLowerCase().includes(pattern.toLowerCase())
        } else {
          matches = line.includes(pattern)
        }
        
        if (invertMatch) {
          matches = !matches
        }
        
        if (matches) {
          matched = true
          const lineNum = showLineNumbers ? `${(index + 1).toString().padStart(4)}:` : ''
          output += `${fileArg}:${lineNum}${line}\n`
        }
      })
      
      if (!matched && fileArgs.length > 1) {
        output += `${fileArg}: 无匹配\n`
      }
    }
    
    return { output: output.trimEnd() }
  },
  description: '在文件中搜索文本',
  usage: 'grep [-i] [-n] [-v] <搜索词> <文件...>',
  examples: ['grep "hello" file.txt', 'grep -i "test" *.txt', 'grep -n "error" log.txt']
})

registerCommand('find', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'find: 缺少路径参数\n用法: find [路径] [-name <模式>] [-type <f|d>]' }
    }
    
    const startPath = args.find(arg => !arg.startsWith('-')) || cwd
    const namePattern = args.find(arg => arg === '-name') ? args[args.indexOf('-name') + 1] : undefined
    const fileType = args.find(arg => arg === '-type') ? args[args.indexOf('-type') + 1] : undefined
    
    const resolvedStart = resolvePath(cwd, startPath)
    const startNode = findNodeByPath(files, resolvedStart)
    
    if (!startNode) {
      return { output: `find: ${startPath}: 没有那个文件或目录` }
    }
    
    const results: string[] = []
    
    const traverse = (node: typeof startNode, currentPath: string) => {
      const fullPath = currentPath === '/' ? `/${node.name}` : `${currentPath}/${node.name}`
      
      let match = true
      
      if (namePattern) {
        const pattern = new RegExp(namePattern.replace('*', '.*').replace('?', '.'))
        match = pattern.test(node.name)
      }
      
      if (fileType && match) {
        if (fileType === 'f' && node.type !== 'file') match = false
        if (fileType === 'd' && node.type !== 'folder') match = false
      }
      
      if (match) {
        results.push(fullPath)
      }
      
      if (node.type === 'folder' && node.children) {
        node.children.forEach(child => traverse(child, fullPath))
      }
    }
    
    if (startNode.type === 'folder') {
      const pathWithoutName = resolvedStart === '/' ? '' : resolvedStart.substring(0, resolvedStart.lastIndexOf('/'))
      traverse(startNode, pathWithoutName)
    } else {
      results.push(resolvedStart)
    }
    
    return { output: results.join('\n') || '无匹配结果' }
  },
  description: '查找文件',
  usage: 'find [路径] [-name <模式>] [-type <f|d>]',
  examples: ['find /home/user', 'find -name "*.txt"', 'find -type f', 'find /home/user -name "*.md"']
})

registerCommand('curl', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          'curl - HTTP 请求工具',
          '',
          '用法: curl <URL>',
          '',
          '示例:',
          '  curl https://api.github.com/users/octocat',
          '  curl https://jsonplaceholder.typicode.com/posts/1',
          '',
          '支持的方法: GET',
          '提示: 仅支持 GET 请求，用于测试 API 端点',
        ].join('\n')
      }
    }
    
    const url = args[0]
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      })
      
      if (!response.ok) {
        return { output: `curl: HTTP ${response.status} - ${response.statusText}` }
      }
      
      const contentType = response.headers.get('content-type') || ''
      
      if (contentType.includes('json')) {
        const data = await response.json()
        return { output: JSON.stringify(data, null, 2) }
      } else {
        const text = await response.text()
        const truncated = text.length > 5000 ? text.substring(0, 5000) + '\n...(内容已截断)' : text
        return { output: truncated }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { output: 'curl: 请求超时' }
      }
      return { output: `curl: ${(error as Error).message || '请求失败'}` }
    }
  },
  description: 'HTTP 请求工具',
  usage: 'curl <URL>',
  examples: ['curl https://api.github.com/users/octocat', 'curl https://jsonplaceholder.typicode.com/posts/1']
})

registerCommand('ping', {
  handler: async (): Promise<CommandResult> => {
    const target = 'https://www.google.com'
    
    const output = [
      `PING ${target}`,
      '',
    ]
    
    let successes = 0
    const totalPings = 4
    
    for (let i = 1; i <= totalPings; i++) {
      const start = performance.now()
      try {
        const response = await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          signal: AbortSignal.timeout(3000),
        })
        const latency = Math.round(performance.now() - start)
        
        if (response.ok) {
          successes++
          output.push(`回复来自 ${target}: 时间=${latency}ms`)
        } else {
          output.push(`请求失败: HTTP ${response.status}`)
        }
      } catch {
        output.push(`请求超时`)
      }
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    output.push('')
    output.push(`--- ${target} ping 统计 ---`)
    output.push(`${totalPings} 个数据包已发送，${successes} 个数据包已接收`)
    output.push(`成功率: ${Math.round((successes / totalPings) * 100)}%`)
    
    return { output: output.join('\n') }
  },
  description: '网络连通性测试',
  usage: 'ping',
  examples: ['ping']
})

registerCommand('clear', {
  handler: (): CommandResult => {
    return { output: '\x1b[2J\x1b[H' }
  },
  description: '清空终端屏幕',
  usage: 'clear',
  examples: ['clear']
})

registerCommand('which', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'which: 缺少参数\n用法: which <命令>' }
    }
    
    const commandName = args[0]
    
    const builtins = ['ls', 'cd', 'pwd', 'cat', 'mkdir', 'rm', 'cp', 'mv', 'clear', 'history', 'grep', 'find', 'curl', 'ping', 'which', 'help']
    
    if (builtins.includes(commandName)) {
      return { output: `/bin/${commandName}` }
    }
    
    return { output: `which: ${commandName}: 未找到命令` }
  },
  description: '查找命令位置',
  usage: 'which <命令>',
  examples: ['which ls', 'which cat']
})

registerCommand('chmod', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return { output: 'chmod: 缺少操作数\n用法: chmod <权限> <文件>' }
    }
    
    const permissions = args[0]
    const file = args[1]
    
    const modeMap: Record<string, string> = {
      '755': 'rwxr-xr-x',
      '644': 'rw-r--r--',
      '777': 'rwxrwxrwx',
      '600': 'rw-------',
    }
    
    const modeDesc = modeMap[permissions] || permissions
    
    return {
      output: [
        `chmod: 将 '${file}' 的权限设置为 ${modeDesc}`,
        '',
        '提示: 虚拟文件系统不真正支持权限控制',
      ].join('\n')
    }
  },
  description: '修改文件权限',
  usage: 'chmod <权限> <文件>',
  examples: ['chmod 755 script.sh', 'chmod 644 document.txt']
})

registerCommand('diff', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length < 2) {
      return { output: 'diff: 缺少操作数\n用法: diff <文件1> <文件2>' }
    }
    
    const file1 = resolvePath(cwd, args[0])
    const file2 = resolvePath(cwd, args[1])
    
    const node1 = findNodeByPath(files, file1)
    const node2 = findNodeByPath(files, file2)
    
    if (!node1) return { output: `diff: ${args[0]}: 没有那个文件或目录` }
    if (!node2) return { output: `diff: ${args[1]}: 没有那个文件或目录` }
    if (node1.type !== 'file') return { output: `diff: ${args[0]}: 不是普通文件` }
    if (node2.type !== 'file') return { output: `diff: ${args[1]}: 不是普通文件` }
    
    const content1 = (node1.content || '').split('\n')
    const content2 = (node2.content || '').split('\n')
    
    const output: string[] = []
    output.push(`--- ${args[0]}`)
    output.push(`+++ ${args[1]}`)
    output.push('')
    
    const maxLen = Math.max(content1.length, content2.length)
    
    for (let i = 0; i < maxLen; i++) {
      const line1 = content1[i] || ''
      const line2 = content2[i] || ''
      
      if (line1 !== line2) {
        if (line1) output.push(`-${line1}`)
        if (line2) output.push(`+${line2}`)
        output.push('')
      }
    }
    
    if (output.length === 3) {
      return { output: '' }
    }
    
    return { output: output.join('\n') }
  },
  description: '比较两个文件的差异',
  usage: 'diff <文件1> <文件2>',
  examples: ['diff file1.txt file2.txt', 'diff original.md modified.md']
})