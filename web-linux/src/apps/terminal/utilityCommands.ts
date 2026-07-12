import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

registerCommand('clear', {
  handler: (): CommandResult => {
    return { output: '' }
  },
  description: '清屏',
  usage: 'clear',
  examples: ['clear']
})

registerCommand('echo', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const output = args.join(' ')
    return { output }
  },
  description: '显示文本',
  usage: 'echo <文本>',
  examples: ['echo Hello World', 'echo $PATH']
})

registerCommand('date', {
  handler: (): CommandResult => {
    const now = new Date()
    return { output: now.toLocaleString('zh-CN') }
  },
  description: '显示当前日期和时间',
  usage: 'date',
  examples: ['date']
})

registerCommand('whoami', {
  handler: (context: CommandContext): CommandResult => {
    return { output: context.username }
  },
  description: '显示当前用户',
  usage: 'whoami',
  examples: ['whoami']
})

registerCommand('hostname', {
  handler: (context: CommandContext): CommandResult => {
    return { output: context.hostname }
  },
  description: '显示主机名',
  usage: 'hostname',
  examples: ['hostname']
})

registerCommand('uname', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.includes('-a')) {
      return { output: `Linux ${context.hostname} 6.15.0-web #1 SMP PREEMPT_DYNAMIC WebLinuxOS x86_64 GNU/Linux` }
    }
    
    if (args.includes('-s')) {
      return { output: 'Linux' }
    }
    
    if (args.includes('-r')) {
      return { output: '6.15.0-web' }
    }
    
    if (args.includes('-v')) {
      return { output: '#1 SMP PREEMPT_DYNAMIC WebLinuxOS' }
    }
    
    if (args.includes('-m')) {
      return { output: 'x86_64' }
    }
    
    if (args.includes('-p')) {
      return { output: 'unknown' }
    }
    
    if (args.includes('-i')) {
      return { output: 'unknown' }
    }
    
    if (args.includes('-o')) {
      return { output: 'GNU/Linux' }
    }
    
    return { output: 'Linux' }
  },
  description: '显示系统信息',
  usage: 'uname [-a] [-s] [-r] [-v] [-m] [-p] [-i] [-o]',
  examples: ['uname', 'uname -a']
})

registerCommand('uptime', {
  handler: (): CommandResult => {
    const now = new Date()
    const uptime = '2 hours'
    
    return {
      output: `${now.toLocaleTimeString('zh-CN')} up ${uptime},  1 user,  load average: 0.00, 0.01, 0.05`
    }
  },
  description: '显示系统运行时间',
  usage: 'uptime',
  examples: ['uptime']
})

registerCommand('free', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const showHuman = args.includes('-h')
    
    const formatSize = (bytes: number): string => {
      if (!showHuman) return bytes.toString()
      if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}Mi`
      if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}Ki`
      return bytes.toString()
    }
    
    const total = 4 * 1024 * 1024
    const used = Math.floor(total * 0.3)
    const free = total - used
    const cached = Math.floor(total * 0.15)
    const available = free + cached
    
    return {
      output: `              total        used        free      shared  buff/cache   available
Mem:       ${formatSize(total)}   ${formatSize(used)}   ${formatSize(free)}           0   ${formatSize(cached)}   ${formatSize(available)}
Swap:             0           0           0`
    }
  },
  description: '显示内存使用情况',
  usage: 'free [-h]',
  examples: ['free', 'free -h']
})

registerCommand('df', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const showHuman = args.includes('-h')
    
    const formatSize = (bytes: number): string => {
      if (!showHuman) return bytes.toString()
      if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}M`
      if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}K`
      return bytes.toString()
    }
    
    const output = [
      `Filesystem     ${showHuman ? 'Size' : '1K-blocks'}  Used ${showHuman ? 'Avail' : 'Available'} Use% Mounted on`,
      `rootfs         ${formatSize(100 * 1024 * 1024)} ${formatSize(25 * 1024 * 1024)} ${formatSize(75 * 1024 * 1024)}  25% /`,
      `tmpfs          ${formatSize(50 * 1024 * 1024)} ${formatSize(10 * 1024 * 1024)} ${formatSize(40 * 1024 * 1024)}  20% /tmp`,
      `localstorage   ${formatSize(50 * 1024 * 1024)} ${formatSize(15 * 1024 * 1024)} ${formatSize(35 * 1024 * 1024)}  30% /home/user`,
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示磁盘使用情况',
  usage: 'df [-h]',
  examples: ['df', 'df -h']
})

registerCommand('ps', {
  handler: (): CommandResult => {
    const output = [
      'PID TTY          TIME CMD',
      '1 pts/0    00:00:01 init',
      '2 pts/0    00:00:00 kthreadd',
      '3 pts/0    00:00:00 kworker/0:0',
      '4 pts/0    00:00:00 kworker/0:1',
      '5 pts/0    00:00:02 bash',
      '6 pts/0    00:00:00 ps',
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示当前进程',
  usage: 'ps',
  examples: ['ps']
})

registerCommand('top', {
  handler: (): CommandResult => {
    const now = new Date()
    
    const output = [
      `top - ${now.toLocaleTimeString('zh-CN')} up 2 hours,  1 user,  load average: 0.00, 0.01, 0.05`,
      '',
      'Tasks:   5 total,   1 running,   4 sleeping,   0 stopped,   0 zombie',
      '%Cpu(s):  0.0 us,  0.0 sy,  0.0 ni,100.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st',
      'MiB Mem :   4096.0 total,   3000.0 free,   1096.0 used,      0.0 buff/cache',
      'MiB Swap:      0.0 total,      0.0 free,      0.0 used.   3000.0 avail Mem',
      '',
      'PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND',
      '   1 root      20   0    4.0g    1.1g    0.0 S   0.0   0.0   0:01.23 init',
      '   2 root      20   0    0.0m    0.0m    0.0 S   0.0   0.0   0:00.00 kthreadd',
      '   3 root      20   0    0.0m    0.0m    0.0 S   0.0   0.0   0:00.00 kworker/0:0',
      '   4 root      20   0    0.0m    0.0m    0.0 S   0.0   0.0   0:00.00 kworker/0:1',
      '   5 user      20   0    1.0g  256.0m    0.0 S   0.0   6.2   0:02.34 bash',
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示系统进程和资源使用',
  usage: 'top',
  examples: ['top']
})

registerCommand('history', {
  handler: (): CommandResult => {
    const history = [
      '  1  ls',
      '  2  cd /home/user',
      '  3  cat README.md',
      '  4  weather Beijing',
      '  5  crypto',
      '  6  help',
      '  7  history',
    ]
    
    return { output: history.join('\n') }
  },
  description: '显示命令历史',
  usage: 'history',
  examples: ['history']
})

registerCommand('cal', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const now = new Date()
    const year = args.length > 1 ? parseInt(args[1]) || now.getFullYear() : now.getFullYear()
    const month = args.length > 0 ? parseInt(args[0]) || now.getMonth() + 1 : now.getMonth() + 1
    
    const firstDay = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const output = [`${year}年${month}月`]
    output.push(weekDays.join('  '))
    
    let line = '   '.repeat(firstDay)
    
    for (let i = 1; i <= daysInMonth; i++) {
      line += `${i.toString().padStart(2, ' ')} `
      if ((i + firstDay) % 7 === 0) {
        output.push(line.trim())
        line = ''
      }
    }
    
    if (line) {
      output.push(line.trim())
    }
    
    return { output: output.join('\n') }
  },
  description: '显示日历',
  usage: 'cal [月份] [年份]',
  examples: ['cal', 'cal 12 2024']
})

registerCommand('bc', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const expression = args.join(' ')
    
    if (!expression) {
      return { output: 'bc: 缺少表达式\n用法: bc <表达式>' }
    }
    
    // 安全验证：仅允许数字、运算符、括号、小数点和数学函数
    const sanitized = expression.replace(/\s/g, '')
    if (!/^[\d+\-*/%.()eE,]+$/.test(sanitized)) {
      return { output: 'bc: 表达式包含不支持的字符' }
    }
    
    try {
      // 使用 Function 构造器替代直接 eval（间接调用，作用域更安全）
      const result = Function(`"use strict"; return (${sanitized})`)()
      if (typeof result !== 'number' || !isFinite(result)) {
        return { output: 'bc: 计算结果无效' }
      }
      return { output: result.toString() }
    } catch {
      return { output: 'bc: 表达式错误' }
    }
  },
  description: '计算器',
  usage: 'bc <表达式>',
  examples: ['bc 1+2', 'bc "10*(5+3)"']
})

registerCommand('grep', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd } = context
    
    if (args.length < 2) {
      return { output: 'grep: 缺少模式或文件\n用法: grep <模式> <文件>' }
    }
    
    const pattern = args[0]
    const filePath = args[1]
    const resolved = filePath.startsWith('/') ? filePath : `${cwd}/${filePath}`
    
    return { output: `grep: 正在搜索 '${pattern}' in '${resolved}'` }
  },
  description: '在文件中搜索模式',
  usage: 'grep <模式> <文件>',
  examples: ['grep "hello" file.txt']
})

registerCommand('sed', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return { output: 'sed: 缺少表达式或文件\n用法: sed <表达式> <文件>' }
    }
    
    return { output: `sed: 应用表达式 '${args[0]}' 到文件 '${args[1]}'` }
  },
  description: '流编辑器',
  usage: 'sed <表达式> <文件>',
  examples: ['sed "s/old/new/g" file.txt']
})

registerCommand('awk', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return { output: 'awk: 缺少脚本或文件\n用法: awk <脚本> <文件>' }
    }
    
    return { output: `awk: 执行脚本 '${args[0]}' 到文件 '${args[1]}'` }
  },
  description: '模式扫描和处理语言',
  usage: 'awk <脚本> <文件>',
  examples: ['awk "{print $1}" file.txt']
})

registerCommand('sort', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'sort: 缺少文件\n用法: sort <文件>' }
    }
    
    return { output: `sort: 排序文件 '${args[0]}'` }
  },
  description: '排序文件内容',
  usage: 'sort <文件>',
  examples: ['sort file.txt']
})

registerCommand('uniq', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'uniq: 缺少文件\n用法: uniq <文件>' }
    }
    
    return { output: `uniq: 去除重复行 '${args[0]}'` }
  },
  description: '去除重复行',
  usage: 'uniq <文件>',
  examples: ['uniq file.txt']
})

registerCommand('wc', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'wc: 缺少文件\n用法: wc <文件>' }
    }
    
    const showLines = args.includes('-l')
    const showWords = args.includes('-w')
    const showChars = args.includes('-c')
    
    if (!showLines && !showWords && !showChars) {
      return { output: '  10   100  1000 file.txt' }
    }
    
    let output = ''
    if (showLines) output += '  10 '
    if (showWords) output += ' 100 '
    if (showChars) output += '1000 '
    output += args[args.length - 1]
    
    return { output: output.trim() }
  },
  description: '统计行数、单词数、字符数',
  usage: 'wc [-l] [-w] [-c] <文件>',
  examples: ['wc file.txt', 'wc -l file.txt']
})

registerCommand('head', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'head: 缺少文件\n用法: head <文件>' }
    }
    
    const lines = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1]) || 10 : 10
    
    return { output: `head: 显示文件 '${args[args.length - 1]}' 的前 ${lines} 行` }
  },
  description: '显示文件开头',
  usage: 'head [-n <行数>] <文件>',
  examples: ['head file.txt', 'head -n 5 file.txt']
})

registerCommand('tail', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: 'tail: 缺少文件\n用法: tail <文件>' }
    }
    
    const lines = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1]) || 10 : 10
    
    return { output: `tail: 显示文件 '${args[args.length - 1]}' 的后 ${lines} 行` }
  },
  description: '显示文件结尾',
  usage: 'tail [-n <行数>] <文件>',
  examples: ['tail file.txt', 'tail -n 5 file.txt']
})
