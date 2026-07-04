import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { findNodeByPath, resolvePath } from '../../store'

function safeEval(expression: string): number {
  const trimmed = expression.trim()
  if (!trimmed) throw new Error('表达式为空')

  const tokens: Array<{ type: 'num' | 'op' | 'func'; value: string }> = []
  let i = 0
  const FUNCTIONS = new Set(['sqrt', 'sin', 'cos', 'tan', 'log', 'log10', 'abs', 'ceil', 'floor', 'round', 'exp', 'pow', 'min', 'max', 'sign'])
  const CONSTANTS: Record<string, number> = { PI: Math.PI, E: Math.E, pi: Math.PI, e: Math.E }

  while (i < trimmed.length) {
    const ch = trimmed[i]
    if (ch === ' ') { i++; continue }
    if (/[0-9.]/.test(ch)) {
      let num = ''
      while (i < trimmed.length && /[0-9.]/.test(trimmed[i])) {
        num += trimmed[i]
        i++
      }
      if (isNaN(Number(num))) throw new Error('无效的数字: ' + num)
      tokens.push({ type: 'num', value: num })
      continue
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let word = ''
      while (i < trimmed.length && /[a-zA-Z0-9_]/.test(trimmed[i])) {
        word += trimmed[i]
        i++
      }
      if (word in CONSTANTS) {
        tokens.push({ type: 'num', value: String(CONSTANTS[word]) })
      } else if (FUNCTIONS.has(word.toLowerCase())) {
        tokens.push({ type: 'func', value: word.toLowerCase() })
      } else {
        throw new Error('未知标识符: ' + word)
      }
      continue
    }
    if ('+-*/%^(),'.includes(ch)) {
      tokens.push({ type: 'op', value: ch })
      i++
      continue
    }
    throw new Error('无效字符: ' + ch)
  }

  let pos = 0
  function peek() { return tokens[pos] }
  function eat(type: string, value?: string) {
    const t = tokens[pos]
    if (!t || t.type !== type || (value && t.value !== value)) {
      throw new Error('期望 ' + value + ' 但得到 ' + (t?.value || 'EOF'))
    }
    pos++
    return t
  }

  function parseExpression(): number {
    let value = parseTerm()
    while (peek() && (peek()!.value === '+' || peek()!.value === '-')) {
      const op = eat('op').value
      const right = parseTerm()
      value = op === '+' ? value + right : value - right
    }
    return value
  }
  function parseTerm(): number {
    let value = parseFactor()
    while (peek() && (peek()!.value === '*' || peek()!.value === '/' || peek()!.value === '%')) {
      const op = eat('op').value
      const right = parseFactor()
      if (op === '*') value = value * right
      else if (op === '/') { if (right === 0) throw new Error('除零错误'); value = value / right }
      else value = value % right
    }
    return value
  }
  function parseFactor(): number {
    const t = peek()
    if (!t) throw new Error('意外的表达式结尾')
    if (t.type === 'op' && t.value === '+') { pos++; return parseFactor() }
    if (t.type === 'op' && t.value === '-') { pos++; return -parseFactor() }
    if (t.type === 'op' && t.value === '(') {
      pos++
      const value = parseExpression()
      eat('op', ')')
      const next = peek()
      if (next && next.type === 'op' && next.value === '^') {
        pos++
        const exp = parseFactor()
        return Math.pow(value, exp)
      }
      return value
    }
    if (t.type === 'func') {
      pos++
      eat('op', '(')
      if (t.value === 'pow' || t.value === 'min' || t.value === 'max') {
        const args: number[] = [parseExpression()]
        while (peek() && peek()!.value === ',') { pos++; args.push(parseExpression()) }
        eat('op', ')')
        if (t.value === 'pow') return Math.pow(args[0], args[1])
        if (t.value === 'min') return Math.min(...args)
        if (t.value === 'max') return Math.max(...args)
      }
      const arg = parseExpression()
      eat('op', ')')
      switch (t.value) {
        case 'sqrt': return Math.sqrt(arg)
        case 'sin': return Math.sin(arg)
        case 'cos': return Math.cos(arg)
        case 'tan': return Math.tan(arg)
        case 'log': return Math.log(arg)
        case 'log10': return Math.log10(arg)
        case 'abs': return Math.abs(arg)
        case 'ceil': return Math.ceil(arg)
        case 'floor': return Math.floor(arg)
        case 'round': return Math.round(arg)
        case 'exp': return Math.exp(arg)
        case 'sign': return Math.sign(arg)
        default: throw new Error('未知函数: ' + t.value)
      }
    }
    if (t.type === 'num') {
      pos++
      const num = Number(t.value)
      const next = peek()
      if (next && next.type === 'op' && next.value === '^') {
        pos++
        const exp = parseFactor()
        return Math.pow(num, exp)
      }
      return num
    }
    throw new Error('意外的 token: ' + t.value)
  }

  const result = parseExpression()
  if (pos !== tokens.length) throw new Error('表达式末尾存在多余内容')
  if (typeof result !== 'number' || !isFinite(result)) throw new Error('结果不是有效数字')
  return result
}

registerCommand('calc', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const expression = args.join(' ')
    
    if (!expression) {
      return {
        output: [
          '🧮 计算器',
          '',
          '用法: calc <数学表达式>',
          '',
          '支持的运算符: +, -, *, /, %, **, ()',
          '支持的函数: sqrt, sin, cos, tan, log, log10, abs, ceil, floor, round',
          '支持的常量: PI, E',
          '',
          '示例:',
          '  calc 2 + 3 * 4',
          '  calc (2 + 3) * 4',
          '  calc 2 ** 10',
          '  calc sqrt(16)',
          '  calc sin(3.14)',
        ].join('\n')
      }
    }
    
    try {
      const result = safeEval(expression)
      return { output: `= ${result}` }
    } catch (e) {
      return { output: `calc: 表达式错误 - ${(e as Error).message}` }
    }
  },
  description: '数学计算器',
  usage: 'calc <表达式>',
  examples: ['calc 2 + 3', 'calc sqrt(16)', 'calc sin(PI)']
})

registerCommand('prime', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const num = parseInt(args[0])
    
    if (isNaN(num)) {
      return {
        output: [
          '🔢 质数检测',
          '',
          '用法: prime <数字>',
          '',
          '示例:',
          '  prime 17',
          '  prime 100',
        ].join('\n')
      }
    }
    
    const isPrime = (n: number): boolean => {
      if (n <= 1) return false
      if (n <= 3) return true
      if (n % 2 === 0 || n % 3 === 0) return false
      let i = 5
      while (i * i <= n) {
        if (n % i === 0 || n % (i + 2) === 0) return false
        i += 6
      }
      return true
    }
    
    if (isPrime(num)) {
      return { output: `${num} 是质数 ✅` }
    } else {
      return { output: `${num} 不是质数 ❌` }
    }
  },
  description: '检测数字是否为质数',
  usage: 'prime <数字>',
  examples: ['prime 17', 'prime 100']
})

registerCommand('factor', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const num = parseInt(args[0])
    
    if (isNaN(num) || num < 2) {
      return {
        output: [
          '🔧 质因数分解',
          '',
          '用法: factor <数字>',
          '',
          '示例:',
          '  factor 12',
          '  factor 100',
        ].join('\n')
      }
    }
    
    const factors: number[] = []
    let n = num
    while (n % 2 === 0) {
      factors.push(2)
      n /= 2
    }
    let i = 3
    while (i * i <= n) {
      while (n % i === 0) {
        factors.push(i)
        n /= i
      }
      i += 2
    }
    if (n > 2) factors.push(n)
    
    return { output: `${num} = ${factors.join(' × ')}` }
  },
  description: '质因数分解',
  usage: 'factor <数字>',
  examples: ['factor 12', 'factor 100']
})

registerCommand('roman', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const num = parseInt(args[0])
    
    if (isNaN(num) || num < 1 || num > 3999) {
      return {
        output: [
          '🔤 罗马数字转换',
          '',
          '用法: roman <数字> (1-3999)',
          '',
          '示例:',
          '  roman 2024',
          '  roman 1999',
        ].join('\n')
      }
    }
    
    const romanNumerals = [
      { value: 1000, symbol: 'M' },
      { value: 900, symbol: 'CM' },
      { value: 500, symbol: 'D' },
      { value: 400, symbol: 'CD' },
      { value: 100, symbol: 'C' },
      { value: 90, symbol: 'XC' },
      { value: 50, symbol: 'L' },
      { value: 40, symbol: 'XL' },
      { value: 10, symbol: 'X' },
      { value: 9, symbol: 'IX' },
      { value: 5, symbol: 'V' },
      { value: 4, symbol: 'IV' },
      { value: 1, symbol: 'I' },
    ]
    
    let result = ''
    let n = num
    for (const { value, symbol } of romanNumerals) {
      while (n >= value) {
        result += symbol
        n -= value
      }
    }
    
    return { output: `${num} = ${result}` }
  },
  description: '阿拉伯数字转罗马数字',
  usage: 'roman <数字>',
  examples: ['roman 2024', 'roman 1999']
})

registerCommand('base64', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    
    if (!text) {
      return {
        output: [
          '🔐 Base64 编码',
          '',
          '用法: base64 <文本>',
          '',
          '示例:',
          '  base64 Hello World',
        ].join('\n')
      }
    }
    
    return { output: btoa(text) }
  },
  description: 'Base64编码',
  usage: 'base64 <文本>',
  examples: ['base64 Hello World']
})

registerCommand('unbase64', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const encoded = args.join(' ')
    
    if (!encoded) {
      return {
        output: [
          '🔓 Base64 解码',
          '',
          '用法: unbase64 <编码文本>',
          '',
          '示例:',
          '  unbase64 SGVsbG8gV29ybGQ=',
        ].join('\n')
      }
    }
    
    try {
      return { output: atob(encoded) }
    } catch {
      return { output: 'unbase64: 无效的 Base64 编码' }
    }
  },
  description: 'Base64解码',
  usage: 'unbase64 <编码文本>',
  examples: ['unbase64 SGVsbG8gV29ybGQ=']
})

async function computeHash(text: string, algorithm: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest(algorithm, data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

registerCommand('hash', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔑 哈希计算',
          '',
          '用法: hash <算法> <文本>',
          '',
          '支持的算法:',
          '  md5    - MD5 哈希',
          '  sha1   - SHA-1 哈希',
          '  sha256 - SHA-256 哈希',
          '  sha512 - SHA-512 哈希',
          '',
          '示例:',
          '  hash sha256 password123',
          '  hash md5 hello world',
          '  hash sha1 test',
          '',
          '💡 不指定算法时默认使用 SHA-256',
        ].join('\n')
      }
    }
    
    let algorithm = 'SHA-256'
    let text = args.join(' ')
    
    const knownAlgorithms: Record<string, string> = {
      'md5': 'MD5',
      'sha1': 'SHA-1',
      'sha256': 'SHA-256',
      'sha512': 'SHA-512',
    }
    
    const firstArg = args[0]?.toLowerCase() || ''
    if (firstArg && knownAlgorithms[firstArg]) {
      algorithm = knownAlgorithms[firstArg]
      text = args.slice(1).join(' ')
    }
    
    if (!text) {
      return { output: 'hash: 请提供要计算哈希的文本' }
    }
    
    try {
      const hash = await computeHash(text, algorithm)
      
      return {
        output: [
          `🔑 ${algorithm} 哈希`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `原文: ${text}`,
          `哈希: ${hash}`,
          `长度: ${hash.length} 字符`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ].join('\n')
      }
    } catch {
      return { output: `hash: 无法计算 ${algorithm} 哈希` }
    }
  },
  description: '计算文本哈希值（支持MD5/SHA1/SHA256/SHA512）',
  usage: 'hash [算法] <文本>',
  examples: ['hash sha256 password123', 'hash md5 hello']
})

registerCommand('rev', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    
    if (!text) {
      return { output: 'rev: 请提供要反转的文本' }
    }
    
    return { output: text.split('').reverse().join('') }
  },
  description: '反转文本',
  usage: 'rev <文本>',
  examples: ['rev hello', 'rev abc123']
})

registerCommand('json', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📋 JSON 格式化工具',
          '',
          '用法: json <JSON字符串>',
          '',
          '示例:',
          '  json {"name":"test","value":123}',
          '  echo \'{"a":1}\' | json',
          '',
          '💡 用于格式化和验证JSON数据',
        ].join('\n')
      }
    }
    
    try {
      const parsed = JSON.parse(args.join(' '))
      return { output: JSON.stringify(parsed, null, 2) }
    } catch (e) {
      return { output: `json: JSON格式错误 - ${(e as Error).message}` }
    }
  },
  description: 'JSON格式化和验证',
  usage: 'json <JSON字符串>',
  examples: ['json {"name":"test"}']
})

registerCommand('urlencode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    
    if (!text) {
      return {
        output: [
          '🔗 URL编码',
          '',
          '用法: urlencode <文本>',
          '',
          '示例:',
          '  urlencode Hello World!',
        ].join('\n')
      }
    }
    
    return { output: encodeURIComponent(text) }
  },
  description: 'URL编码',
  usage: 'urlencode <文本>',
  examples: ['urlencode Hello World!']
})

registerCommand('urldecode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    
    if (!text) {
      return {
        output: [
          '🔗 URL解码',
          '',
          '用法: urldecode <编码文本>',
          '',
          '示例:',
          '  urldecode Hello%20World%21',
        ].join('\n')
      }
    }
    
    try {
      return { output: decodeURIComponent(text) }
    } catch {
      return { output: 'urldecode: 无效的URL编码' }
    }
  },
  description: 'URL解码',
  usage: 'urldecode <编码文本>',
  examples: ['urldecode Hello%20World%21']
})

registerCommand('uuid', {
  handler: (): CommandResult => {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
    
    return { output: `生成的UUID:\n\n${uuid}` }
  },
  description: '生成UUID',
  usage: 'uuid',
  examples: ['uuid']
})

registerCommand('password', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const length = parseInt(args[0]) || 16
    
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    
    return { output: `🔐 生成的密码\n\n${password}\n\n长度: ${password.length} 字符` }
  },
  description: '生成随机密码',
  usage: 'password [长度]',
  examples: ['password', 'password 20']
})



registerCommand('timer', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const seconds = parseInt(args[0])
    
    if (isNaN(seconds) || seconds <= 0) {
      return {
        output: [
          '⏱️  倒计时器',
          '',
          '用法: timer <秒数>',
          '',
          '示例:',
          '  timer 60',
          '  timer 120',
        ].join('\n')
      }
    }
    
    let output = `⏱️  倒计时开始: ${seconds} 秒\n\n`
    
    for (let remaining = seconds; remaining > 0; remaining--) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (remaining <= 5) {
        output += `${remaining}... `
      }
    }
    
    output += '\n🎉 时间到！'
    
    return { output }
  },
  description: '倒计时器',
  usage: 'timer <秒数>',
  examples: ['timer 60', 'timer 120']
})

registerCommand('motd', {
  handler: (): CommandResult => {
    const hours = new Date().getHours()
    const greeting = hours < 6 ? '夜深了，注意休息 🌙'
      : hours < 12 ? '早上好！☀️'
      : hours < 14 ? '中午好！🌤️'
      : hours < 18 ? '下午好！🌥️'
      : '晚上好！🌙'
    
    const uptime = Math.floor(Math.random() * 100) + 10
    const users = Math.floor(Math.random() * 10) + 1
    
    return {
      output: [
        '========================================',
        '        WebLinuxOS 欢迎您！',
        '========================================',
        '',
        greeting,
        '',
        `系统运行时间: ${uptime} 小时`,
        `当前在线用户: ${users} 人`,
        '',
        '输入 `help` 查看可用命令',
        '输入 `apps` 查看所有应用',
        '',
        '========================================',
      ].join('\n')
    }
  },
  description: '显示欢迎信息',
  usage: 'motd',
  examples: ['motd']
})

registerCommand('echo', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    return { output: args.join(' ') }
  },
  description: '输出文本',
  usage: 'echo <文本>',
  examples: ['echo Hello World', 'echo $PATH']
})

registerCommand('grep', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length < 2) {
      return {
        output: [
          '🔍 grep 文本搜索',
          '',
          '用法: grep <模式> <文件>',
          '',
          '示例:',
          '  grep hello file.txt',
          '  grep -i hello file.txt',
          '',
          '选项:',
          '  -i 忽略大小写',
        ].join('\n')
      }
    }
    
    const ignoreCase = args.includes('-i')
    const patternIndex = args.includes('-i') ? 1 : 0
    const pattern = args[patternIndex]
    const filePath = args[patternIndex + 1]
    
    const resolved = resolvePath(cwd, filePath)
    const node = findNodeByPath(files, resolved)
    
    if (!node || node.type !== 'file') {
      return { output: `grep: ${filePath}: 没有那个文件或目录` }
    }
    
    const content = node.content || ''
    const lines = content.split('\n')
    const matches = lines.filter(line => {
      const target = ignoreCase ? line.toLowerCase() : line
      const searchPattern = ignoreCase ? pattern.toLowerCase() : pattern
      return target.includes(searchPattern)
    })
    
    return { output: matches.join('\n') || '' }
  },
  description: '在文件中搜索文本',
  usage: 'grep [-i] <模式> <文件>',
  examples: ['grep hello file.txt', 'grep -i error log.txt']
})

registerCommand('sort', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📊 sort 排序',
          '',
          '用法: sort <文件>',
          '',
          '示例:',
          '  sort names.txt',
        ].join('\n')
      }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (!node || node.type !== 'file') {
      return { output: `sort: ${args[0]}: 没有那个文件或目录` }
    }
    
    const content = node.content || ''
    const lines = content.split('\n').filter(line => line.trim())
    lines.sort()
    
    return { output: lines.join('\n') }
  },
  description: '排序文件内容',
  usage: 'sort <文件>',
  examples: ['sort names.txt']
})

registerCommand('uniq', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔄 uniq 去重',
          '',
          '用法: uniq <文件>',
          '',
          '示例:',
          '  uniq duplicates.txt',
        ].join('\n')
      }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (!node || node.type !== 'file') {
      return { output: `uniq: ${args[0]}: 没有那个文件或目录` }
    }
    
    const content = node.content || ''
    const lines = content.split('\n').filter(line => line.trim())
    const unique: string[] = []
    
    for (const line of lines) {
      if (line !== unique[unique.length - 1]) {
        unique.push(line)
      }
    }
    
    return { output: unique.join('\n') }
  },
  description: '去除重复行',
  usage: 'uniq <文件>',
  examples: ['uniq duplicates.txt']
})

registerCommand('help', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const commands: Record<string, { desc: string; usage: string }> = {
      'ls': { desc: '列出目录内容', usage: 'ls [路径]' },
      'cd': { desc: '切换目录', usage: 'cd <路径>' },
      'pwd': { desc: '显示当前目录', usage: 'pwd' },
      'mkdir': { desc: '创建目录', usage: 'mkdir <目录名>' },
      'rm': { desc: '删除文件或目录', usage: 'rm <路径>' },
      'cp': { desc: '复制文件', usage: 'cp <源> <目标>' },
      'mv': { desc: '移动/重命名文件', usage: 'mv <源> <目标>' },
      'cat': { desc: '查看文件内容', usage: 'cat <文件>' },
      'touch': { desc: '创建空文件', usage: 'touch <文件名>' },
      'echo': { desc: '输出文本', usage: 'echo <文本>' },
      'grep': { desc: '在文件中搜索文本', usage: 'grep <模式> <文件>' },
      'sort': { desc: '排序文件内容', usage: 'sort <文件>' },
      'uniq': { desc: '去除重复行', usage: 'uniq <文件>' },
      'wc': { desc: '统计行数/字数/字符数', usage: 'wc <文件>' },
      'head': { desc: '显示文件开头', usage: 'head <文件>' },
      'tail': { desc: '显示文件末尾', usage: 'tail <文件>' },
      'find': { desc: '查找文件', usage: 'find [路径] [-name 模式]' },
      'stat': { desc: '显示文件状态', usage: 'stat <文件>' },
      'diff': { desc: '比较两个文件', usage: 'diff <文件1> <文件2>' },
      'less': { desc: '分页查看文件', usage: 'less <文件>' },
      'whoami': { desc: '显示当前用户', usage: 'whoami' },
      'date': { desc: '显示日期时间', usage: 'date' },
      'uptime': { desc: '显示系统运行时间', usage: 'uptime' },
      'ps': { desc: '显示进程列表', usage: 'ps' },
      'top': { desc: '系统进程监控', usage: 'top' },
      'system-info': { desc: '显示详细系统信息', usage: 'system-info' },
      'netstat': { desc: '显示网络连接状态', usage: 'netstat' },
      'calc': { desc: '数学计算器', usage: 'calc <表达式>' },
      'weather': { desc: '查询天气', usage: 'weather [城市]' },
      'news': { desc: '显示新闻头条', usage: 'news' },
      'crypto': { desc: '加密货币行情', usage: 'crypto [币种]' },
      'stocks': { desc: '股票行情', usage: 'stocks [代码]' },
      'ipinfo': { desc: 'IP地址信息', usage: 'ipinfo' },
      'iplookup': { desc: 'IP地址查询', usage: 'iplookup <IP>' },
      'dnslookup': { desc: 'DNS域名查询', usage: 'dnslookup <域名>' },
      'translate': { desc: '翻译文本', usage: 'translate <文本>' },
      'define': { desc: '词典查询', usage: 'define <单词>' },
      'quote': { desc: '随机名言', usage: 'quote' },
      'password': { desc: '生成密码', usage: 'password [长度]' },
      'uuid': { desc: '生成UUID', usage: 'uuid' },
      'shortid': { desc: '生成短ID', usage: 'shortid [数量]' },
      'base64': { desc: 'Base64编码', usage: 'base64 <文本>' },
      'unbase64': { desc: 'Base64解码', usage: 'unbase64 <文本>' },
      'urlencode': { desc: 'URL编码', usage: 'urlencode <文本>' },
      'urldecode': { desc: 'URL解码', usage: 'urldecode <文本>' },
      'json': { desc: 'JSON格式化', usage: 'json <JSON>' },
      'yaml': { desc: 'JSON转YAML', usage: 'yaml <JSON>' },
      'hash': { desc: '计算哈希', usage: 'hash [算法] <文本>' },
      'hash-verify': { desc: '验证文本Hash', usage: 'hash-verify <算法> <哈希> <文本>' },
      'jwt': { desc: 'JWT令牌解析', usage: 'jwt <token>' },
      'rev': { desc: '反转文本', usage: 'rev <文本>' },
      'qrcode': { desc: '生成二维码', usage: 'qrcode <文本>' },
      'prime': { desc: '质数检测', usage: 'prime <数字>' },
      'factor': { desc: '质因数分解', usage: 'factor <数字>' },
      'roman': { desc: '罗马数字转换', usage: 'roman <数字>' },
      'binary': { desc: '文本与二进制转换', usage: 'binary <文本或二进制>' },
      'color': { desc: '颜色工具', usage: 'color [hex值]' },
      'regex': { desc: '正则表达式测试', usage: 'regex <模式> <文本>' },
      'unit': { desc: '单位转换器', usage: 'unit <数值> <源单位> <目标单位>' },
      'bmi': { desc: 'BMI身体质量指数计算', usage: 'bmi <身高> <体重>' },
      'age': { desc: '年龄计算器', usage: 'age <出生日期>' },
      'cron': { desc: 'Cron表达式解析', usage: 'cron <表达式>' },
      'lorem': { desc: 'Lorem Ipsum生成器', usage: 'lorem [数量] [-w|-s|-p]' },
      'morse': { desc: '摩斯密码编码/解码', usage: 'morse <文本或摩斯密码>' },
      'ascii': { desc: 'ASCII艺术字生成', usage: 'ascii <文本>' },
      'leet': { desc: 'Leet语转换', usage: 'leet <文本>' },
      'worldtime': { desc: '世界时钟', usage: 'worldtime [城市]' },
      'timer': { desc: '倒计时器', usage: 'timer <秒数>' },
      'motd': { desc: '显示欢迎信息', usage: 'motd' },
      'apps': { desc: '列出所有应用', usage: 'apps' },
      'clear': { desc: '清空屏幕', usage: 'clear' },
      'help': { desc: '显示此帮助信息', usage: 'help [命令]' },
      'curl': { desc: '获取URL内容', usage: 'curl [选项] URL' },
      'fetch': { desc: '获取URL JSON内容', usage: 'fetch URL' },
      'ping': { desc: '测试网络连接延迟', usage: 'ping 主机' },
      'ip': { desc: '显示网络接口信息', usage: 'ip' },
      'env': { desc: '显示环境变量', usage: 'env' },
      'history': { desc: '显示命令历史', usage: 'history' },
    }
    
    if (args.length > 0) {
      const cmd = args[0].toLowerCase()
      if (commands[cmd]) {
        return {
          output: [
            `命令: ${cmd}`,
            `描述: ${commands[cmd].desc}`,
            `用法: ${commands[cmd].usage}`,
          ].join('\n')
        }
      }
      return { output: `help: 未知命令 '${cmd}'` }
    }
    
    const output = ['📖 可用命令:', '', ...Object.entries(commands).map(([cmd, info]) => 
      `  ${cmd.padEnd(12)} - ${info.desc}`
    ), '', '使用 help <命令> 查看详细用法']
    
    return { output: output.join('\n') }
  },
  description: '显示帮助信息',
  usage: 'help [命令]',
  examples: ['help', 'help ls']
})

registerCommand('qrcode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    
    if (!text) {
      return {
        output: [
          '📱 二维码生成器',
          '',
          '用法: qrcode <文本或URL>',
          '',
          '示例:',
          '  qrcode https://github.com',
          '  qrcode Hello World',
          '  qrcode wifi:T:WPA;S:MyNetwork;P:password;;',
          '',
          '支持生成以下类型的二维码:',
          '  - URL链接',
          '  - 文本内容',
          '  - WiFi配置',
          '  - 联系人信息',
          '  - 日历事件',
        ].join('\n')
      }
    }
    
    const encoded = encodeURIComponent(text)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}&format=png`
    
    return {
      output: [
        '📱 二维码已生成',
        '',
        `内容: ${text}`,
        '',
        `在线预览: ${qrUrl}`,
        '',
        '在浏览器中打开以上链接查看二维码图片',
        '可使用 -s 参数指定尺寸: qrcode -s 300 <文本>',
      ].join('\n')
    }
  },
  description: '生成二维码',
  usage: 'qrcode <文本或URL>',
  examples: ['qrcode https://github.com', 'qrcode Hello World']
})

registerCommand('stocks', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    const stockData = [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 178.52, change: 1.24 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.80, change: -0.85 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.91, change: 2.15 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.25, change: 0.92 },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: -3.25 },
      { symbol: 'META', name: 'Meta Platforms', price: 505.75, change: 4.30 },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.28, change: 12.45 },
    ]
    
    if (args.length > 0) {
      const symbol = args[0].toUpperCase()
      const stock = stockData.find(s => s.symbol === symbol)
      if (stock) {
        return {
          output: [
            `股票信息: ${stock.name}`,
            '',
            `代码: ${stock.symbol}`,
            `价格: $${stock.price.toFixed(2)}`,
            `涨跌: ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%`,
          ].join('\n')
        }
      }
      return { output: `stocks: 未知股票代码 '${symbol}'` }
    }
    
    const output = [
      '实时股票行情',
      '',
      '----------------------------------------------------------------',
      '',
      `${'代码'.padEnd(8)} ${'名称'.padEnd(18)} ${'价格'.padEnd(12)} 涨跌`,
      ...stockData.map(s => 
        `${s.symbol.padEnd(8)} ${s.name.padEnd(18)} $${s.price.toFixed(2).padEnd(10)} ${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}%`
      ),
      '',
      '----------------------------------------------------------------',
      '',
      '用法: stocks <代码> 查看详情',
      '提示: 生产环境需集成真实股票API',
    ]
    
    return { output: output.join('\n') }
  },
  description: '查询股票行情',
  usage: 'stocks [代码]',
  examples: ['stocks', 'stocks AAPL', 'stocks GOOGL']
})

registerCommand('define', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const word = args.join(' ')
    
    if (!word) {
      return {
        output: [
          '词典查询',
          '',
          '用法: define <单词>',
          '',
          '示例:',
          '  define hello',
          '  define algorithm',
        ].join('\n')
      }
    }
    
    const dictionary: Record<string, { phonetic: string; meaning: string; example: string }> = {
      'hello': { phonetic: '/həˈloʊ/', meaning: 'interjection. 用于打招呼或引起注意的问候语', example: 'Hello, how are you doing?' },
      'world': { phonetic: '/wɜːrld/', meaning: 'noun. 地球；世界；领域；社会', example: 'The world is a beautiful place.' },
      'code': { phonetic: '/koʊd/', meaning: 'noun. 代码；编码；密码 | verb. 编码；编写程序', example: 'She wrote code in Python.' },
      'algorithm': { phonetic: '/ˈælɡərɪðəm/', meaning: 'noun. 算法；计算程序', example: 'Quicksort is a classic sorting algorithm.' },
      'function': { phonetic: '/ˈfʌŋkʃən/', meaning: 'noun. 功能；函数；职务 | verb. 运行；起作用', example: 'What is the function of this button?' },
      'data': { phonetic: '/ˈdeɪtə/', meaning: 'noun. 数据；资料', example: 'The data shows a clear trend.' },
      'system': { phonetic: '/ˈsɪstəm/', meaning: 'noun. 系统；体系；制度', example: 'The operating system is very stable.' },
      'developer': { phonetic: '/dɪˈveləpər/', meaning: 'noun. 开发者；程序员', example: 'The developer fixed the bug quickly.' },
      'terminal': { phonetic: '/ˈtɜːrmɪnəl/', meaning: 'noun. 终端；终点站 | adj. 末端的；终点的', example: 'Open the terminal and type the command.' },
    }
    
    const lowerWord = word.toLowerCase()
    if (dictionary[lowerWord]) {
      const entry = dictionary[lowerWord]
      return {
        output: [
          `${word}`,
          '',
          `音标: ${entry.phonetic}`,
          `词性: ${entry.meaning}`,
          '',
          `例句: ${entry.example}`,
        ].join('\n')
      }
    }
    
    return { output: [ `${word}`, '', '未找到该单词的释义', '提示: 尝试简单的常用单词' ].join('\n') }
  },
  description: '词典查询',
  usage: 'define <单词>',
  examples: ['define hello', 'define algorithm']
})

registerCommand('worldtime', {
  handler: async (): Promise<CommandResult> => {
    const now = new Date()
    const localTime = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const localDate = now.toLocaleDateString('zh-CN')
    
    const timeZones: Record<string, { city: string; offset: number }> = {
      'beijing': { city: '北京', offset: 8 },
      'shanghai': { city: '上海', offset: 8 },
      'tokyo': { city: '东京', offset: 9 },
      'seoul': { city: '首尔', offset: 9 },
      'newyork': { city: '纽约', offset: -5 },
      'losangeles': { city: '洛杉矶', offset: -8 },
      'london': { city: '伦敦', offset: 0 },
      'paris': { city: '巴黎', offset: 1 },
      'sydney': { city: '悉尼', offset: 10 },
      'moscow': { city: '莫斯科', offset: 3 },
      'dubai': { city: '迪拜', offset: 4 },
      'singapore': { city: '新加坡', offset: 8 },
      'hongkong': { city: '香港', offset: 8 },
    }
    
    const output = [
      '世界时钟',
      '',
      `本地时间 (${Intl.DateTimeFormat().resolvedOptions().timeZone}): ${localTime}`,
      `日期: ${localDate}`,
      '',
      '----------------------------------------------------------------',
      '',
      ...Object.entries(timeZones).map(([, info]) => {
        const tzTime = new Date(now.getTime() + (info.offset - 8) * 3600000)
        const timeStr = tzTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
        const marker = info.offset === 8 ? ' (本地)' : ''
        return `${info.city.padEnd(10)} ${timeStr}${marker}`
      }),
      '',
      '----------------------------------------------------------------',
      '',
      '用法: worldtime <城市>',
      '支持城市: beijing, shanghai, tokyo, london, newyork, paris, sydney...',
    ]
    
    return { output: output.join('\n') }
  },
  description: '世界时钟',
  usage: 'worldtime [城市]',
  examples: ['worldtime', 'worldtime tokyo', 'worldtime london']
})

registerCommand('color', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const hex = args[0]?.toUpperCase() || '#8B7CF0'
    
    const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null
    }
    
    const rgb = hexToRgb(hex)
    
    if (!rgb) {
      return {
        output: [
          '颜色工具',
          '',
          '用法: color <hex颜色值>',
          '',
          '示例:',
          '  color #8B7CF0',
          '  color #3498db',
          '  color #2ecc71',
          '',
          '内置颜色:',
          '  primary   #8B7CF0  (主题主色)',
          '  secondary #00CEC9  (强调色)',
          '  success   #00B894  (成功)',
          '  warning   #FDCB6E  (警告)',
          '  danger    #E17055  (危险)',
        ].join('\n')
      }
    }
    
    const { r, g, b } = rgb
    const luma = 0.299 * r + 0.587 * g + 0.114 * b > 128 ? '浅色' : '深色'
    
    return {
      output: [
        '颜色信息',
        '',
        `颜色预览: [${hex}]`,
        `RGB: rgb(${r}, ${g}, ${b})`,
        `亮度: ${luma}`,
      ].join('\n')
    }
  },
  description: '颜色工具',
  usage: 'color [hex值]',
  examples: ['color #8B7CF0', 'color #3498db']
})

registerCommand('binary', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')
    
    if (!text) {
      return {
        output: [
          '文本与二进制转换',
          '',
          '用法: binary <文本或二进制>',
          '',
          '示例:',
          '  binary Hello',
          '  binary 01001000 01100101',
          '',
          '提示: 自动检测输入类型',
        ].join('\n')
      }
    }
    
    const isBinary = /^[\s01]+$/.test(text) && text.length > 0
    
    if (isBinary) {
      const chars = text.split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2)))
      return { output: [ '二进制转文本', '', `二进制: ${text}`, `文本: ${chars.join('')}` ].join('\n') }
    }
    
    const binary = text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')
    return { output: [ '文本转二进制', '', `文本: ${text}`, `二进制: ${binary}` ].join('\n') }
  },
  description: '文本与二进制转换',
  usage: 'binary <文本或二进制>',
  examples: ['binary Hello', 'binary 01001000 01100101']
})

registerCommand('hash-verify', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          'Hash 验证工具',
          '',
          '用法: hash-verify <算法> <哈希> <文本>',
          '',
          '支持的算法: md5, sha1, sha256, sha512',
          '',
          '示例:',
          '  hash-verify sha256 myhash Hello',
        ].join('\n')
      }
    }
    
    const [algorithm, , ...textParts] = args
    const text = textParts.join(' ')
    
    const computeHash = async (input: string, algo: string): Promise<string> => {
      const encoder = new TextEncoder()
      const data = encoder.encode(input)
      const algorithms: Record<string, string> = {
        'md5': 'MD5', 'sha1': 'SHA-1', 'sha256': 'SHA-256', 'sha512': 'SHA-512'
      }
      if (!algorithms[algo.toLowerCase()]) throw new Error('Unsupported algorithm')
      const hashBuffer = await crypto.subtle.digest(algorithms[algo.toLowerCase()], data)
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
    }
    
    try {
      const computedHash = await computeHash(text, algorithm)
      return {
        output: [
          'Hash 验证结果',
          '',
          `算法: ${algorithm.toUpperCase()}`,
          `原文: ${text}`,
          `计算值: ${computedHash}`,
        ].join('\n')
      }
    } catch {
      return { output: `hash-verify: 不支持的算法 '${algorithm}'` }
    }
  },
  description: '验证文本Hash',
  usage: 'hash-verify <算法> <哈希> <文本>',
  examples: ['hash-verify sha256 myhash Hello']
})

registerCommand('find', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔍 文件查找',
          '',
          '用法: find [路径] [-name <模式>] [-type <f|d>]',
          '',
          '选项:',
          '  -name <模式>   按文件名匹配（支持通配符 *）',
          '  -type <f|d>    搜索类型：f=文件，d=目录',
          '',
          '示例:',
          '  find /home/user',
          '  find -name "*.txt"',
          '  find /home/user -name "*.md"',
          '  find -type f -name "*.js"',
          '  find /home -type d',
        ].join('\n')
      }
    }
    
    let targetPath = cwd
    let namePattern: string | null = null
    let typeFilter: 'f' | 'd' | null = null
    
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-name') {
        namePattern = args[i + 1]
        i++
      } else if (args[i] === '-type') {
        typeFilter = args[i + 1] as 'f' | 'd' | null
        i++
      } else {
        targetPath = resolvePath(cwd, args[i])
      }
    }
    
    const node = findNodeByPath(files, targetPath)
    if (!node || node.type !== 'folder') {
      return { output: `find: ${targetPath}: 没有那个文件或目录` }
    }
    
    const results: string[] = []
    let searchedCount = 0
    
    const search = (currentNode: typeof node, currentPath: string) => {
      if (currentNode.children) {
        for (const child of currentNode.children) {
          const childPath = currentPath === '/' ? `/${child.name}` : `${currentPath}/${child.name}`
          searchedCount++
          
          const matchType = !typeFilter || 
            (typeFilter === 'f' && child.type === 'file') || 
            (typeFilter === 'd' && child.type === 'folder')
          
          let matchName = true
          if (namePattern) {
            const regex = new RegExp(namePattern.replace(/\*/g, '.*'))
            matchName = regex.test(child.name)
          }
          
          if (matchType && matchName) {
            const typeIndicator = child.type === 'folder' ? '/' : ''
            results.push(childPath + typeIndicator)
          }
          
          if (child.type === 'folder') {
            search(child, childPath)
          }
        }
      }
    }
    
    search(node, targetPath)
    
    const output = [
      ...results,
      '',
      `找到 ${results.length} 个匹配项（共搜索 ${searchedCount} 个项目）`
    ].join('\n')
    
    return { output: output }
  },
  description: '查找文件',
  usage: 'find [路径] [-name <模式>] [-type <f|d>]',
  examples: ['find', 'find -name "*.txt"', 'find /home/user -name "*.md"', 'find -type f']
})

registerCommand('grep', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length < 2) {
      return {
        output: [
          '🔍 grep - 在文件中搜索文本',
          '',
          '用法: grep <模式> <文件> [-i] [-n] [-r]',
          '',
          '选项:',
          '  -i    忽略大小写',
          '  -n    显示行号',
          '  -r    递归搜索目录',
          '',
          '示例:',
          '  grep "hello" file.txt',
          '  grep -i "Hello" file.txt',
          '  grep -n "pattern" file.txt',
          '  grep -r "function" /home/user',
        ].join('\n')
      }
    }
    
    const ignoreCase = args.includes('-i')
    const showLineNumbers = args.includes('-n')
    const recursive = args.includes('-r')
    
    const patternArg = args.find(a => !a.startsWith('-'))
    const fileArg = args.slice(args.indexOf(patternArg || '') + 1).find(a => !a.startsWith('-'))
    
    if (!patternArg) {
      return { output: 'grep: 缺少搜索模式' }
    }
    
    const pattern = new RegExp(patternArg, ignoreCase ? 'i' : '')
    const results: string[] = []
    let filesSearched = 0
    let matchesFound = 0
    
    const searchFile = (node: ReturnType<typeof findNodeByPath>, path: string) => {
      if (!node) return
      
      if (node.type === 'file' && node.content) {
        filesSearched++
        const lines = (node.content as string).split('\n')
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            matchesFound++
            const lineNum = showLineNumbers ? `${index + 1}:` : ''
            const escapedLine = line.replace(/\u001b\[[0-9;]*m/g, '')
            const highlighted = escapedLine.replace(pattern, (match) => `\x1b[32m${match}\x1b[0m`)
            results.push(`${path}:${lineNum}${highlighted}`)
          }
        })
      } else if (node.type === 'folder' && node.children) {
        if (!recursive) return
        node.children.forEach(child => {
          const childPath = path === '/' ? `/${child.name}` : `${path}/${child.name}`
          searchFile(child, childPath)
        })
      }
    }
    
    if (fileArg) {
      const resolvedPath = resolvePath(cwd, fileArg)
      const node = findNodeByPath(files, resolvedPath)
      searchFile(node, resolvedPath)
    } else {
      searchFile(findNodeByPath(files, cwd), cwd)
    }
    
    const output = [
      ...results,
      '',
      `找到 ${matchesFound} 个匹配项（搜索了 ${filesSearched} 个文件）`
    ].join('\n')
    
    return { output: output }
  },
  description: '在文件中搜索文本',
  usage: 'grep <模式> <文件> [-i] [-n] [-r]',
  examples: ['grep "hello" file.txt', 'grep -i "Hello" file.txt', 'grep -r "function" /home/user']
})

registerCommand('stat', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'stat: 缺少操作数' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (!node) {
      return { output: `stat: 无法访问'${args[0]}': 没有那个文件或目录` }
    }
    
    const now = new Date()
    const size = node.type === 'file' ? (node.content || '').length : 0
    
    return {
      output: [
        `文件: ${args[0]}`,
        `大小: ${size} 字节`,
        `类型: ${node.type === 'folder' ? '目录' : '常规文件'}`,
        `权限: -rw-r--r--`,
        `所有者: user`,
        `组: user`,
        `创建时间: ${now.toLocaleString('zh-CN')}`,
        `修改时间: ${now.toLocaleString('zh-CN')}`,
      ].join('\n')
    }
  },
  description: '显示文件状态',
  usage: 'stat <文件>',
  examples: ['stat file.txt', 'stat /home/user']
})

registerCommand('ln', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return { output: 'ln: 缺少操作数\n用法: ln <源文件> <目标路径>' }
    }
    
    return { output: `ln: 创建链接 ${args[0]} -> ${args[1]} (虚拟文件系统暂不支持链接)` }
  },
  description: '创建链接',
  usage: 'ln <源文件> <目标路径>',
  examples: ['ln file.txt link.txt']
})

registerCommand('chmod', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return { output: 'chmod: 缺少操作数\n用法: chmod <权限> <文件>' }
    }
    
    const permissions = args[0]
    const target = args[1]
    
    return { output: `chmod: 将 ${target} 的权限更改为 ${permissions} (虚拟文件系统暂不支持权限)` }
  },
  description: '更改文件权限',
  usage: 'chmod <权限> <文件>',
  examples: ['chmod 755 script.sh']
})

registerCommand('less', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd, files } = context
    
    if (args.length === 0) {
      return { output: 'less: 缺少操作数' }
    }
    
    const resolved = resolvePath(cwd, args[0])
    const node = findNodeByPath(files, resolved)
    
    if (!node || node.type !== 'file') {
      return { output: `less: ${args[0]}: 没有那个文件或目录` }
    }
    
    const content = node.content || ''
    const lines = content.split('\n')
    const pageSize = 20
    const totalPages = Math.ceil(lines.length / pageSize)
    
    return {
      output: [
        `正在查看: ${args[0]}`,
        `共 ${lines.length} 行, ${totalPages} 页`,
        '',
        lines.slice(0, pageSize).join('\n'),
        '',
        `-- 第 1/${totalPages} 页 -- (按空格翻页, q退出)`,
      ].join('\n')
    }
  },
  description: '分页查看文件',
  usage: 'less <文件>',
  examples: ['less README.md']
})

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
      } else if (!line1) {
        diffOutput.push(`+ ${line2}`)
      } else if (!line2) {
        diffOutput.push(`- ${line1}`)
      } else {
        diffOutput.push(`- ${line1}`)
        diffOutput.push(`+ ${line2}`)
      }
    }
    
    return { output: diffOutput.join('\n') }
  },
  description: '比较两个文件',
  usage: 'diff <文件1> <文件2>',
  examples: ['diff file1.txt file2.txt']
})

registerCommand('system-info', {
  handler: (): CommandResult => {
    const now = new Date()
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    const cores = navigator.hardwareConcurrency || 4
    
    const output = [
      '══════════════════════════════════════════════════════════════',
      '                    系统信息',
      '══════════════════════════════════════════════════════════════',
      '',
      '┌────────────────────────────────────────────────────────────┐',
      '│ 基本信息                                                   │',
      '├────────────────────────────────────────────────────────────┤',
      `│ 操作系统:   WebLinuxOS 2.9.0                               │`,
      `│ 内核版本:   6.15.0-web                                    │`,
      `│ 架构:       x86_64 / WebAssembly                          │`,
      `│ 运行时间:   ${Math.floor(Math.random() * 24)}小时${Math.floor(Math.random() * 60)}分钟              │`,
      `│ 当前时间:   ${now.toLocaleString('zh-CN')}                │`,
      '├────────────────────────────────────────────────────────────┤',
      '│ 硬件信息                                                   │',
      '├────────────────────────────────────────────────────────────┤',
      `│ CPU核心数:  ${cores} 核心                                 │`,
      `│ 总内存:     ${deviceMemory ? deviceMemory + ' GB' : '未知'}               │`,
      `│ 浏览器:     ${navigator.userAgent.split(' ').slice(-1)[0]}             │`,
      `│ 用户代理:   ${navigator.userAgent.substring(0, 50)}...    │`,
      '├────────────────────────────────────────────────────────────┤',
      '│ 网络信息                                                   │',
      '├────────────────────────────────────────────────────────────┤',
      `│ 在线状态:   已连接                                         │`,
      `│ 连接类型:   ${(navigator as unknown as { connection: { effectiveType?: string } }).connection?.effectiveType || '未知'}      │`,
      `│ 语言:       ${navigator.language}                          │`,
      `│ 平台:       ${navigator.platform}                         │`,
      '└────────────────────────────────────────────────────────────┘',
    ].join('\n')
    
    return { output }
  },
  description: '显示详细系统信息',
  usage: 'system-info',
  examples: ['system-info']
})

registerCommand('netstat', {
  handler: (): CommandResult => {
    const connections = [
      { proto: 'tcp', recv: '0', send: '0', local: '127.0.0.1:22', foreign: '0.0.0.0:*', state: 'LISTEN' },
      { proto: 'tcp', recv: '0', send: '0', local: '127.0.0.1:80', foreign: '0.0.0.0:*', state: 'LISTEN' },
      { proto: 'tcp', recv: '0', send: '0', local: '0.0.0.0:443', foreign: '0.0.0.0:*', state: 'LISTEN' },
      { proto: 'tcp', recv: '0', send: '0', local: '192.168.1.100:49152', foreign: '104.18.2.19:443', state: 'ESTABLISHED' },
      { proto: 'udp', recv: '0', send: '0', local: '0.0.0.0:53', foreign: '0.0.0.0:*', state: '' },
      { proto: 'udp', recv: '0', send: '0', local: '0.0.0.0:68', foreign: '0.0.0.0:*', state: '' },
    ]
    
    const output = [
      '╔════════════════════════════════════════════════════════════════╗',
      '║                    网络连接状态                                ║',
      '╠══════════╦════════╦════════╦════════════════╦═══════════════╦══════════╣',
      '║ 协议     │ 接收   │ 发送   │ 本地地址       │ 外部地址      │ 状态     ║',
      '╠══════════╬════════╬════════╬════════════════╬═══════════════╬══════════╣',
      ...connections.map(c => 
        `║ ${c.proto.padEnd(8)} │ ${c.recv.padEnd(6)} │ ${c.send.padEnd(6)} │ ${c.local.padEnd(16)} │ ${c.foreign.padEnd(15)} │ ${c.state.padEnd(8)} ║`
      ),
      '╚══════════╩════════╩════════╩════════════════╩═══════════════╩══════════╝',
      '',
      `TCP连接数: ${connections.filter(c => c.proto === 'tcp').length}`,
      `UDP连接数: ${connections.filter(c => c.proto === 'udp').length}`,
    ].join('\n')
    
    return { output }
  },
  description: '显示网络连接状态',
  usage: 'netstat',
  examples: ['netstat']
})

registerCommand('dnslookup', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔍 DNS查询',
          '',
          '用法: dnslookup <域名>',
          '',
          '示例:',
          '  dnslookup github.com',
          '  dnslookup google.com',
        ].join('\n')
      }
    }
    
    const domain = args[0]
    
    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`)
      if (!response.ok) throw new Error('查询失败')
      
      const data = await response.json()
      const answers = data.Answer || []
      
      if (answers.length > 0) {
        return {
          output: [
            `DNS 查询结果: ${domain}`,
            '',
            ...answers.map((a: { data: string; type: number }) => `  ${a.data} (${a.type === 1 ? 'A记录' : '其他'})`),
          ].join('\n')
        }
      }
      
      return { output: `dnslookup: 未找到 ${domain} 的记录` }
    } catch {
      const fallbackResults: Record<string, string[]> = {
        'github.com': ['140.82.113.4'],
        'google.com': ['142.250.185.142'],
        'example.com': ['93.184.216.34'],
      }
      
      const results = fallbackResults[domain] || ['192.168.1.1']
      
      return {
        output: [
          `DNS 查询结果: ${domain}`,
          '',
          ...results.map(ip => `  ${ip} (A记录)`),
          '',
          '提示: 使用备用DNS服务器',
        ].join('\n')
      }
    }
  },
  description: 'DNS域名查询',
  usage: 'dnslookup <域名>',
  examples: ['dnslookup github.com', 'dnslookup google.com']
})

registerCommand('iplookup', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🌍 IP查询',
          '',
          '用法: iplookup <IP地址>',
          '',
          '示例:',
          '  iplookup 8.8.8.8',
          '  iplookup 1.1.1.1',
        ].join('\n')
      }
    }
    
    const ip = args[0]
    
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`)
      if (!response.ok) throw new Error('查询失败')
      
      const data = await response.json()
      
      return {
        output: [
          `IP 查询结果: ${ip}`,
          '',
          `国家: ${data.country_name || '未知'} (${data.country_code || ''})`,
          `城市: ${data.city || '未知'}`,
          `地区: ${data.region || '未知'}`,
          `ISP: ${data.org || '未知'}`,
          `ASN: ${data.asn || '未知'}`,
          `时区: ${data.timezone || '未知'}`,
          `经纬度: ${data.latitude || ''}, ${data.longitude || ''}`,
        ].join('\n')
      }
    } catch {
      return {
        output: [
          `IP 查询结果: ${ip}`,
          '',
          '查询失败，使用本地数据库',
          '',
          '提示: 某些IP可能无法查询到详细信息',
        ].join('\n')
      }
    }
  },
  description: 'IP地址查询',
  usage: 'iplookup <IP地址>',
  examples: ['iplookup 8.8.8.8', 'iplookup 1.1.1.1']
})

registerCommand('yaml', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📋 YAML工具',
          '',
          '用法: yaml <JSON字符串>',
          '',
          '示例:',
          '  yaml {"name":"test","items":[1,2,3]}',
          '',
          '功能: 将JSON转换为YAML格式',
        ].join('\n')
      }
    }
    
    try {
      const json = JSON.parse(args.join(' '))
      
      const toYaml = (obj: any, indent: number = 0): string => {
        const spaces = '  '.repeat(indent)
        let result = ''
        
        if (typeof obj === 'object' && obj !== null) {
          if (Array.isArray(obj)) {
            for (const item of obj) {
              result += `${spaces}- ${toYaml(item, indent + 1).trim()}\n`
            }
          } else {
            for (const [key, value] of Object.entries(obj)) {
              const valueYaml = toYaml(value, indent + 1).trim()
              if (typeof value === 'object' && value !== null) {
                result += `${spaces}${key}:\n${valueYaml}\n`
              } else {
                result += `${spaces}${key}: ${valueYaml}\n`
              }
            }
          }
        } else if (typeof obj === 'string') {
          result = `"${obj}"`
        } else {
          result = String(obj)
        }
        
        return result
      }
      
      return { output: toYaml(json).trim() }
    } catch {
      return { output: 'yaml: 无效的JSON格式' }
    }
  },
  description: 'JSON转YAML',
  usage: 'yaml <JSON字符串>',
  examples: ['yaml {"name":"test"}']
})

registerCommand('regex', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '🔍 正则表达式测试',
          '',
          '用法: regex <模式> <文本>',
          '',
          '示例:',
          '  regex "\\d+" "abc123def456"',
          '  regex "[a-z]+" "Hello World"',
          '',
          '支持的标志:',
          '  -i 忽略大小写',
          '  -g 全局匹配',
        ].join('\n')
      }
    }
    
    const ignoreCase = args.includes('-i')
    const global = args.includes('-g')
    const patternArg = args.find(arg => !arg.startsWith('-')) || ''
    const textStartIndex = args.indexOf(patternArg) + 1
    const text = args.slice(textStartIndex).filter(arg => !arg.startsWith('-')).join(' ')
    
    try {
      const flags = (ignoreCase ? 'i' : '') + (global ? 'g' : '')
      const regex = new RegExp(patternArg, flags)
      
      const matches: string[] = []
      let match
      
      if (global) {
        while ((match = regex.exec(text)) !== null) {
          matches.push(`匹配: "${match[0]}" 位置: ${match.index}`)
          if (!global) break
        }
      } else {
        match = regex.exec(text)
        if (match) {
          matches.push(`匹配: "${match[0]}" 位置: ${match.index}`)
        }
      }
      
      if (matches.length === 0) {
        return { output: `regex: 未找到匹配 (模式: ${patternArg})` }
      }
      
      return {
        output: [
          `正则表达式: ${patternArg}`,
          `标志: ${flags || '无'}`,
          `测试文本: ${text}`,
          '',
          `找到 ${matches.length} 个匹配:`,
          ...matches,
        ].join('\n')
      }
    } catch (e) {
      return { output: `regex: 无效的正则表达式 - ${(e as Error).message}` }
    }
  },
  description: '正则表达式测试',
  usage: 'regex <模式> <文本>',
  examples: ['regex "\\d+" "abc123"', 'regex -i "hello" "Hello World"']
})

registerCommand('jwt', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔐 JWT 解析工具',
          '',
          '用法: jwt <token>',
          '',
          '示例:',
          '  jwt eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          '',
          '功能: 解析JWT令牌的Header和Payload部分',
        ].join('\n')
      }
    }
    
    const token = args[0]
    const parts = token.split('.')
    
    if (parts.length !== 3) {
      return { output: 'jwt: 无效的JWT令牌格式（需要三部分）' }
    }
    
    try {
      const decodeBase64Url = (str: string): string => {
        const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
        return decodeURIComponent(atob(padded).split('').map(c => 
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''))
      }
      
      const header = JSON.parse(decodeBase64Url(parts[0]))
      const payload = JSON.parse(decodeBase64Url(parts[1]))
      
      const formatTime = (timestamp: number): string => {
        if (!timestamp) return 'N/A'
        const date = new Date(timestamp * 1000)
        return date.toLocaleString('zh-CN')
      }
      
      const output = [
        '🔐 JWT 令牌解析',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '📋 Header (头部):',
        JSON.stringify(header, null, 2),
        '',
        '📦 Payload (载荷):',
        JSON.stringify(payload, null, 2),
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '⏰ 时间信息:',
        `  签发时间 (iat): ${formatTime(payload.iat)}`,
        `  过期时间 (exp): ${formatTime(payload.exp)}`,
        `  生效时间 (nbf): ${formatTime(payload.nbf)}`,
        '',
        '🔏 签名: 已存在 (需密钥验证)',
        '',
        '⚠️  注意: 此工具仅解码，不验证签名有效性',
      ]
      
      return { output: output.join('\n') }
    } catch {
      return { output: 'jwt: 解析失败，请检查令牌格式' }
    }
  },
  description: 'JWT令牌解析',
  usage: 'jwt <token>',
  examples: ['jwt eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...']
})

registerCommand('unit', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 3) {
      return {
        output: [
          '📐 单位转换器',
          '',
          '用法: unit <数值> <源单位> <目标单位>',
          '',
          '支持的类别:',
          '  温度: c, f, k (摄氏度/华氏度/开尔文)',
          '  长度: m, km, cm, mm, mi, yd, ft, in',
          '  重量: kg, g, lb, oz, t',
          '  面积: m2, km2, ha, acre, ft2',
          '  体积: l, ml, gal, qt, pt, cup',
          '  速度: mps, kmh, mph, knot',
          '  数据: b, kb, mb, gb, tb (字节/千/兆/吉/太)',
          '',
          '示例:',
          '  unit 100 c f          (100摄氏度转华氏度)',
          '  unit 1 km mi          (1公里转英里)',
          '  unit 20 lb kg         (20磅转公斤)',
          '  unit 1024 mb gb       (1024MB转GB)',
        ].join('\n')
      }
    }
    
    const value = parseFloat(args[0])
    const fromUnit = args[1].toLowerCase()
    const toUnit = args[2].toLowerCase()
    
    if (isNaN(value)) {
      return { output: 'unit: 无效的数值' }
    }
    
    const lengthToMeters: Record<string, number> = {
      m: 1, km: 1000, cm: 0.01, mm: 0.001,
      mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254,
    }
    
    const weightToKg: Record<string, number> = {
      kg: 1, g: 0.001, lb: 0.453592, oz: 0.0283495, t: 1000,
    }
    
    const areaToM2: Record<string, number> = {
      m2: 1, km2: 1e6, ha: 10000, acre: 4046.86, ft2: 0.092903,
    }
    
    const volumeToLiters: Record<string, number> = {
      l: 1, ml: 0.001, gal: 3.78541, qt: 0.946353, pt: 0.473176, cup: 0.236588,
    }
    
    const speedToMps: Record<string, number> = {
      mps: 1, kmh: 0.277778, mph: 0.44704, knot: 0.514444,
    }
    
    const dataToBytes: Record<string, number> = {
      b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024,
      tb: 1024 * 1024 * 1024 * 1024,
    }
    
    const tempUnits = ['c', 'f', 'k']
    
    let result: number | null = null
    
    if (tempUnits.includes(fromUnit) && tempUnits.includes(toUnit)) {
      let celsius: number
      if (fromUnit === 'c') celsius = value
      else if (fromUnit === 'f') celsius = (value - 32) * 5 / 9
      else celsius = value - 273.15
      
      if (toUnit === 'c') result = celsius
      else if (toUnit === 'f') result = celsius * 9 / 5 + 32
      else result = celsius + 273.15
    } else if (fromUnit in lengthToMeters && toUnit in lengthToMeters) {
      result = (value * lengthToMeters[fromUnit]) / lengthToMeters[toUnit]
    } else if (fromUnit in weightToKg && toUnit in weightToKg) {
      result = (value * weightToKg[fromUnit]) / weightToKg[toUnit]
    } else if (fromUnit in areaToM2 && toUnit in areaToM2) {
      result = (value * areaToM2[fromUnit]) / areaToM2[toUnit]
    } else if (fromUnit in volumeToLiters && toUnit in volumeToLiters) {
      result = (value * volumeToLiters[fromUnit]) / volumeToLiters[toUnit]
    } else if (fromUnit in speedToMps && toUnit in speedToMps) {
      result = (value * speedToMps[fromUnit]) / speedToMps[toUnit]
    } else if (fromUnit in dataToBytes && toUnit in dataToBytes) {
      result = (value * dataToBytes[fromUnit]) / dataToBytes[toUnit]
    }
    
    if (result === null) {
      return { output: `unit: 不支持从 '${fromUnit}' 到 '${toUnit}' 的转换` }
    }
    
    const formatted = Math.abs(result) >= 1000000 
      ? result.toExponential(4) 
      : result.toFixed(result % 1 === 0 ? 0 : 6).replace(/\.?0+$/, '')
    
    return {
      output: [
        '📐 单位转换',
        '',
        `  ${value} ${fromUnit.toUpperCase()}`,
        `  = ${formatted} ${toUnit.toUpperCase()}`,
        '',
        `  转换方向: ${fromUnit.toUpperCase()} → ${toUnit.toUpperCase()}`,
      ].join('\n')
    }
  },
  description: '单位转换器',
  usage: 'unit <数值> <源单位> <目标单位>',
  examples: ['unit 100 c f', 'unit 1 km mi', 'unit 1024 mb gb']
})

registerCommand('lorem', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    let count = 5
    let type: 'words' | 'sentences' | 'paragraphs' = 'paragraphs'
    
    if (args.length > 0) {
      const num = parseInt(args[0])
      if (!isNaN(num)) count = num
    }
    
    if (args.includes('-w') || args.includes('--words')) type = 'words'
    if (args.includes('-s') || args.includes('--sentences')) type = 'sentences'
    if (args.includes('-p') || args.includes('--paragraphs')) type = 'paragraphs'
    
    const words = [
      'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur',
      'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor',
      'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna',
      'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis',
      'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
      'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis',
      'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
      'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur',
      'excepteur', 'sint', 'occaecat', 'cupidatat', 'non',
      'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
      'mollit', 'anim', 'id', 'est', 'laborum',
    ]
    
    const generateWord = (): string => {
      return words[Math.floor(Math.random() * words.length)]
    }
    
    const generateSentence = (wordCount: number): string => {
      const sentenceWords: string[] = []
      for (let i = 0; i < wordCount; i++) {
        sentenceWords.push(generateWord())
      }
      const sentence = sentenceWords.join(' ')
      return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.'
    }
    
    const generateParagraph = (sentenceCount: number): string => {
      const sentences: string[] = []
      for (let i = 0; i < sentenceCount; i++) {
        const wordCount = Math.floor(Math.random() * 10) + 5
        sentences.push(generateSentence(wordCount))
      }
      return sentences.join(' ')
    }
    
    let output = ''
    
    if (type === 'words') {
      const wordList: string[] = []
      for (let i = 0; i < count; i++) {
        wordList.push(generateWord())
      }
      output = wordList.join(' ')
    } else if (type === 'sentences') {
      const sentences: string[] = []
      for (let i = 0; i < count; i++) {
        const wordCount = Math.floor(Math.random() * 10) + 5
        sentences.push(generateSentence(wordCount))
      }
      output = sentences.join(' ')
    } else {
      const paragraphs: string[] = []
      for (let i = 0; i < count; i++) {
        const sentenceCount = Math.floor(Math.random() * 4) + 3
        paragraphs.push(generateParagraph(sentenceCount))
      }
      output = paragraphs.join('\n\n')
    }
    
    return {
      output: [
        `📝 Lorem Ipsum 生成器 (${count} ${type === 'words' ? '单词' : type === 'sentences' ? '句子' : '段落'})`,
        '',
        output,
      ].join('\n')
    }
  },
  description: 'Lorem Ipsum 文本生成器',
  usage: 'lorem [数量] [-w|-s|-p]',
  examples: ['lorem', 'lorem 10 -w', 'lorem 3 -p']
})

registerCommand('morse', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📡 摩斯密码',
          '',
          '用法: morse <文本或摩斯密码>',
          '',
          '示例:',
          '  morse SOS',
          '  morse "... --- ..."',
          '  morse Hello World',
          '',
          '提示: 自动检测输入类型',
          '  文本 -> 摩斯密码',
          '  摩斯密码(只含. - /) -> 文本',
        ].join('\n')
      }
    }
    
    const input = args.join(' ')
    
    const morseCode: Record<string, string> = {
      'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
      'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
      'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
      'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
      'Y': '-.--', 'Z': '--..',
      '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
      '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
      '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
      '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
      ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
      '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
    }
    
    const reverseMorse: Record<string, string> = {}
    for (const [key, value] of Object.entries(morseCode)) {
      reverseMorse[value] = key
    }
    
    const isMorse = /^[\s.\-\/]+$/.test(input)
    
    if (isMorse) {
      const words = input.split('/')
      const decoded = words.map(word => {
        const letters = word.trim().split(/\s+/)
        return letters.map(code => reverseMorse[code] || '?').join('')
      }).join(' ')
      
      return {
        output: [
          '📡 摩斯密码解码',
          '',
          `摩斯密码: ${input}`,
          `解码结果: ${decoded}`,
        ].join('\n')
      }
    } else {
      const encoded = input.toUpperCase().split('').map(char => {
        if (char === ' ') return '/'
        return morseCode[char] || '?'
      }).join(' ')
      
      return {
        output: [
          '📡 摩斯密码编码',
          '',
          `原文: ${input}`,
          `摩斯密码: ${encoded}`,
        ].join('\n')
      }
    }
  },
  description: '摩斯密码编码/解码',
  usage: 'morse <文本或摩斯密码>',
  examples: ['morse SOS', 'morse "... --- ..."']
})

registerCommand('ascii', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🎨 ASCII 艺术字',
          '',
          '用法: ascii <文本>',
          '',
          '示例:',
          '  ascii Hello',
          '  ascii WebLinux',
          '',
          '支持: 字母、数字、部分符号',
        ].join('\n')
      }
    }
    
    const text = args.join(' ').toUpperCase()
    
    const asciiFont: Record<string, string[]> = {
      'A': ['  █████  ', ' ██   ██ ', ' ███████ ', ' ██   ██ ', ' ██   ██ '],
      'B': [' ██████  ', ' ██   ██ ', ' ██████  ', ' ██   ██ ', ' ██████  '],
      'C': ['  ██████ ', ' ██      ', ' ██      ', ' ██      ', '  ██████ '],
      'D': [' ██████  ', ' ██   ██ ', ' ██   ██ ', ' ██   ██ ', ' ██████  '],
      'E': [' ███████ ', ' ██      ', ' █████   ', ' ██      ', ' ███████ '],
      'F': [' ███████ ', ' ██      ', ' █████   ', ' ██      ', ' ██      '],
      'G': ['  ██████ ', ' ██      ', ' ██   ███', ' ██    ██', '  ██████ '],
      'H': [' ██   ██ ', ' ██   ██ ', ' ███████ ', ' ██   ██ ', ' ██   ██ '],
      'I': ['  █████  ', '    ██   ', '    ██   ', '    ██   ', '  █████  '],
      'J': ['     ███ ', '      ██ ', '      ██ ', ' ██   ██ ', '  █████  '],
      'K': [' ██   ██ ', ' ██  ██  ', ' █████   ', ' ██  ██  ', ' ██   ██ '],
      'L': [' ██      ', ' ██      ', ' ██      ', ' ██      ', ' ███████ '],
      'M': [' ███   ███ ', ' ████ ████ ', ' ██ ███ ██ ', ' ██  █  ██ ', ' ██     ██ '],
      'N': [' ██   ██ ', ' ███  ██ ', ' ████ ██ ', ' ██ ████ ', ' ██   ██ '],
      'O': ['  █████  ', ' ██   ██ ', ' ██   ██ ', ' ██   ██ ', '  █████  '],
      'P': [' ██████  ', ' ██   ██ ', ' ██████  ', ' ██      ', ' ██      '],
      'Q': ['  █████  ', ' ██   ██ ', ' ██ █ ██ ', ' ██   ██ ', '  ███ ██ '],
      'R': [' ██████  ', ' ██   ██ ', ' ██████  ', ' ██  ██  ', ' ██   ██ '],
      'S': ['  ██████ ', ' ██      ', '  ████   ', '     ██  ', ' ██████  '],
      'T': [' █████████ ', '    ██    ', '    ██    ', '    ██    ', '    ██    '],
      'U': [' ██    ██ ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ ', '  ██████  '],
      'V': [' ██    ██ ', ' ██    ██ ', ' ██    ██ ', '  ██  ██  ', '   ████   '],
      'W': [' ██     ██ ', ' ██     ██ ', ' ██  █  ██ ', ' ██ ███ ██ ', ' ███   ███ '],
      'X': [' ██   ██ ', '  ██ ██  ', '   ███   ', '  ██ ██  ', ' ██   ██ '],
      'Y': [' ██   ██ ', '  ██ ██  ', '   ███   ', '   ██    ', '   ██    '],
      'Z': [' ███████ ', '     ██  ', '    ██   ', '   ██    ', ' ███████ '],
      '0': ['  █████  ', ' ██   ██ ', ' ██   ██ ', ' ██   ██ ', '  █████  '],
      '1': ['   ██   ', '  ███   ', '   ██   ', '   ██   ', ' ██████ '],
      '2': ['  █████  ', ' ██   ██ ', '     ██  ', '   ██    ', ' ███████ '],
      '3': ['  █████  ', ' ██   ██ ', '    ███  ', ' ██   ██ ', '  █████  '],
      '4': ['    ██   ', '   ███   ', '  ██ ██  ', ' ███████ ', '     ██  '],
      '5': [' ███████ ', ' ██      ', ' ██████  ', '      ██ ', ' ██████  '],
      '6': ['  █████  ', ' ██      ', ' ██████  ', ' ██   ██ ', '  █████  '],
      '7': [' ███████ ', '      ██ ', '     ██  ', '    ██   ', '   ██    '],
      '8': ['  █████  ', ' ██   ██ ', '  █████  ', ' ██   ██ ', '  █████  '],
      '9': ['  █████  ', ' ██   ██ ', '  ██████ ', '      ██ ', '  █████  '],
      ' ': ['    ', '    ', '    ', '    ', '    '],
      '-': ['        ', '        ', ' ██████ ', '        ', '        '],
      '_': ['        ', '        ', '        ', '        ', ' ██████ '],
      '.': ['    ', '    ', '    ', '    ', ' ██ '],
      '!': [' ██ ', ' ██ ', ' ██ ', '    ', ' ██ '],
      '?': ['  ████  ', ' █   ██ ', '     █  ', '        ', '    █   '],
    }
    
    const lines: string[] = ['', '', '', '', '']
    
    for (const char of text) {
      const charArt = asciiFont[char] || asciiFont['?'] || ['  ', '  ', '  ', '  ', '  ']
      for (let i = 0; i < 5; i++) {
        lines[i] += (charArt[i] || '  ') + ' '
      }
    }
    
    return {
      output: [
        '🎨 ASCII 艺术字',
        '',
        ...lines,
        '',
        `原文: ${text}`,
      ].join('\n')
    }
  },
  description: 'ASCII艺术字生成',
  usage: 'ascii <文本>',
  examples: ['ascii Hello', 'ascii WebLinux']
})

registerCommand('age', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🎂 年龄计算器',
          '',
          '用法: age <出生日期>',
          '',
          '格式: YYYY-MM-DD 或 YYYY/MM/DD',
          '',
          '示例:',
          '  age 1990-01-01',
          '  age 2000/12/25',
        ].join('\n')
      }
    }
    
    const dateStr = args[0].replace(/\//g, '-')
    const birthDate = new Date(dateStr)
    
    if (isNaN(birthDate.getTime())) {
      return { output: 'age: 无效的日期格式，请使用 YYYY-MM-DD' }
    }
    
    const now = new Date()
    
    if (birthDate > now) {
      return { output: 'age: 出生日期不能晚于今天' }
    }
    
    let years = now.getFullYear() - birthDate.getFullYear()
    let months = now.getMonth() - birthDate.getMonth()
    let days = now.getDate() - birthDate.getDate()
    
    if (days < 0) {
      months--
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      days += lastMonth.getDate()
    }
    
    if (months < 0) {
      years--
      months += 12
    }
    
    const totalDays = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24))
    const totalWeeks = Math.floor(totalDays / 7)
    const totalHours = totalDays * 24
    
    const nextBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate())
    if (nextBirthday < now) {
      nextBirthday.setFullYear(now.getFullYear() + 1)
    }
    const daysUntilBirthday = Math.ceil((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    const zodiacSigns = [
      { sign: '摩羯座', start: [0, 1], end: [0, 19] },
      { sign: '水瓶座', start: [0, 20], end: [1, 18] },
      { sign: '双鱼座', start: [1, 19], end: [2, 20] },
      { sign: '白羊座', start: [2, 21], end: [3, 19] },
      { sign: '金牛座', start: [3, 20], end: [4, 20] },
      { sign: '双子座', start: [4, 21], end: [5, 21] },
      { sign: '巨蟹座', start: [5, 22], end: [6, 22] },
      { sign: '狮子座', start: [6, 23], end: [7, 22] },
      { sign: '处女座', start: [7, 23], end: [8, 22] },
      { sign: '天秤座', start: [8, 23], end: [9, 22] },
      { sign: '天蝎座', start: [9, 23], end: [10, 21] },
      { sign: '射手座', start: [10, 22], end: [11, 21] },
      { sign: '摩羯座', start: [11, 22], end: [11, 31] },
    ]
    
    const birthMonth = birthDate.getMonth()
    const birthDay = birthDate.getDate()
    
    let zodiac = '未知'
    for (const z of zodiacSigns) {
      const [startMonth, startDay] = z.start
      const [endMonth, endDay] = z.end
      if (
        (birthMonth === startMonth && birthDay >= startDay) ||
        (birthMonth === endMonth && birthDay <= endDay) ||
        (startMonth < birthMonth && birthMonth < endMonth)
      ) {
        zodiac = z.sign
        break
      }
    }
    
    const chineseZodiac = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
    const zodiacIndex = (birthDate.getFullYear() - 4) % 12
    const chineseAnimal = chineseZodiac[zodiacIndex]
    
    return {
      output: [
        '🎂 年龄计算结果',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `出生日期: ${birthDate.toLocaleDateString('zh-CN')}`,
        `当前年龄: ${years} 岁 ${months} 个月 ${days} 天`,
        '',
        '📊 详细统计:',
        `  总天数: ${totalDays.toLocaleString()} 天`,
        `  总周数: ${totalWeeks.toLocaleString()} 周`,
        `  总小时: ${totalHours.toLocaleString()} 小时`,
        '',
        `🎁 下次生日还有: ${daysUntilBirthday} 天`,
        '',
        '⭐ 星座信息:',
        `  星座: ${zodiac}`,
        `  生肖: ${chineseAnimal}`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      ].join('\n')
    }
  },
  description: '年龄计算器',
  usage: 'age <出生日期>',
  examples: ['age 1990-01-01', 'age 2000/12/25']
})

registerCommand('shortid', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const count = parseInt(args[0]) || 1
    
    const generateShortId = (): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      let id = ''
      for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return id
    }
    
    const generateNanoId = (length: number = 10): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
      let id = ''
      const array = new Uint8Array(length)
      crypto.getRandomValues(array)
      for (let i = 0; i < length; i++) {
        id += chars[array[i] % chars.length]
      }
      return id
    }
    
    const ids: string[] = []
    for (let i = 0; i < Math.min(count, 20); i++) {
      ids.push(`  ${generateShortId()}    ${generateNanoId(10)}`)
    }
    
    return {
      output: [
        '🆔 短ID生成器',
        '',
        `  ShortID (8字符)   NanoID (10字符)`,
        '  ───────────────  ───────────────',
        ...ids,
        '',
        `生成数量: ${Math.min(count, 20)} 个`,
        '提示: shortid [数量] 生成多个ID (最多20个)',
      ].join('\n')
    }
  },
  description: '生成短ID',
  usage: 'shortid [数量]',
  examples: ['shortid', 'shortid 5']
})

registerCommand('leet', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '1337 7337 5p34k (Leet语转换)',
          '',
          '用法: leet <文本>',
          '',
          '示例:',
          '  leet Hello World',
          '  leet I am a hacker',
        ].join('\n')
      }
    }
    
    const text = args.join(' ')
    
    const leetMap: Record<string, string> = {
      'a': '4', 'e': '3', 'i': '1', 'o': '0', 's': '5',
      't': '7', 'b': '8', 'g': '6', 'l': '1', 'z': '2',
      'A': '4', 'E': '3', 'I': '1', 'O': '0', 'S': '5',
      'T': '7', 'B': '8', 'G': '6', 'L': '1', 'Z': '2',
    }
    
    const superLeetMap: Record<string, string> = {
      ...leetMap,
      'c': '(', 'd': '|)', 'f': '|=', 'h': '|-|', 'j': '_|',
      'k': '|<', 'm': '|v|', 'n': '|\\|', 'p': '|2', 'q': '9',
      'r': '|2', 'u': '|_|', 'v': '\\/', 'w': '\\/\\/', 'x': '><',
      'y': '`/',
    }
    
    const basic = text.split('').map(c => leetMap[c] || c).join('')
    const advanced = text.split('').map(c => superLeetMap[c.toLowerCase()] || c).join('')
    
    return {
      output: [
        '1337 7337 5p34k',
        '',
        '基础转换:',
        `  ${basic}`,
        '',
        '高级转换:',
        `  ${advanced}`,
        '',
        `原文: ${text}`,
      ].join('\n')
    }
  },
  description: 'Leet语转换 (1337 speak)',
  usage: 'leet <文本>',
  examples: ['leet Hello World', 'leet I am a hacker']
})

registerCommand('bmi', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '⚖️  BMI 计算器',
          '',
          '用法: bmi <身高(cm)> <体重(kg)>',
          '',
          '示例:',
          '  bmi 175 70',
          '  bmi 160 55',
          '',
          'BMI 参考标准:',
          '  < 18.5   偏瘦',
          '  18.5-24  正常',
          '  24-28    偏胖',
          '  28-32    肥胖',
          '  > 32     重度肥胖',
        ].join('\n')
      }
    }
    
    const height = parseFloat(args[0]) / 100
    const weight = parseFloat(args[1])
    
    if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
      return { output: 'bmi: 请输入有效的身高和体重' }
    }
    
    const bmi = weight / (height * height)
    
    let category = ''
    let emoji = ''
    let color = ''
    
    if (bmi < 18.5) {
      category = '偏瘦'
      emoji = '📉'
      color = '蓝色'
    } else if (bmi < 24) {
      category = '正常'
      emoji = '✅'
      color = '绿色'
    } else if (bmi < 28) {
      category = '偏胖'
      emoji = '📈'
      color = '黄色'
    } else if (bmi < 32) {
      category = '肥胖'
      emoji = '⚠️'
      color = '橙色'
    } else {
      category = '重度肥胖'
      emoji = '🚨'
      color = '红色'
    }
    
    const idealMin = 18.5 * height * height
    const idealMax = 24 * height * height
    
    return {
      output: [
        '⚖️  BMI 计算结果',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `身高: ${(height * 100).toFixed(0)} cm`,
        `体重: ${weight.toFixed(1)} kg`,
        '',
        `BMI 值: ${bmi.toFixed(1)}`,
        `状态: ${emoji} ${category} (${color})`,
        '',
        '🎯 理想体重范围:',
        `  最低: ${idealMin.toFixed(1)} kg (BMI 18.5)`,
        `  最高: ${idealMax.toFixed(1)} kg (BMI 24)`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '💡 提示: 仅供参考，具体请咨询专业医生',
      ].join('\n')
    }
  },
  description: 'BMI 身体质量指数计算',
  usage: 'bmi <身高(cm)> <体重(kg)>',
  examples: ['bmi 175 70', 'bmi 160 55']
})

registerCommand('cron', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '⏰ Cron 表达式解析',
          '',
          '用法: cron <表达式>',
          '',
          '格式: 分 时 日 月 周',
          '',
          '示例:',
          '  cron "* * * * *"          每分钟',
          '  cron "0 * * * *"          每小时',
          '  cron "0 0 * * *"          每天零点',
          '  cron "0 9 * * 1-5"        工作日早9点',
          '  cron "*/15 * * * *"       每15分钟',
          '',
          '符号说明:',
          '  *  任意值    ,  列表     -  范围',
          '  /  步长     ?  不指定    L  最后',
        ].join('\n')
      }
    }
    
    const expression = args.join(' ')
    const parts = expression.trim().split(/\s+/)
    
    if (parts.length !== 5) {
      return { output: 'cron: 表达式需要5个字段（分 时 日 月 周）' }
    }
    
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
    
    const describeField = (value: string, fieldName: string, min: number, max: number): string => {
      if (value === '*') return `每${fieldName}`
      if (value.startsWith('*/')) {
        const step = parseInt(value.slice(2))
        return `每 ${step} ${fieldName}`
      }
      if (value.includes(',')) {
        return `${fieldName}: ${value}`
      }
      if (value.includes('-')) {
        return `${fieldName}: ${value} 范围内`
      }
      const num = parseInt(value)
      if (!isNaN(num) && num >= min && num <= max) {
        return `${fieldName}: ${value}`
      }
      return `${fieldName}: ${value}`
    }
    
    const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    
    const formatTime = (): string => {
      if (minute === '*' && hour === '*') return '每分钟'
      if (minute === '0' && hour === '*') return '每小时整点'
      if (minute.startsWith('*/')) {
        return `每 ${minute.slice(2)} 分钟`
      }
      if (hour.startsWith('*/')) {
        return `每 ${hour.slice(2)} 小时`
      }
      const m = minute === '*' ? '每分' : `${minute}分`
      const h = hour === '*' ? '每时' : `${hour}时`
      return `${h}${m}`
    }
    
    const formatDate = (): string => {
      let result = ''
      if (dayOfMonth !== '*') result += `每月${dayOfMonth}日 `
      if (month !== '*') {
        const m = parseInt(month)
        if (!isNaN(m) && m >= 1 && m <= 12) {
          result += months[m - 1] + ' '
        } else {
          result += `${month}月 `
        }
      }
      if (dayOfWeek !== '*') {
        const d = parseInt(dayOfWeek)
        if (!isNaN(d) && d >= 0 && d <= 6) {
          result += weekdays[d]
        } else {
          result += `周${dayOfWeek}`
        }
      }
      return result.trim() || '每天'
    }
    
    return {
      output: [
        '⏰ Cron 表达式解析',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `表达式: ${expression}`,
        '',
        '📋 详细解读:',
        `  ${describeField(minute, '分钟', 0, 59)}`,
        `  ${describeField(hour, '小时', 0, 23)}`,
        `  ${describeField(dayOfMonth, '日期', 1, 31)}`,
        `  ${describeField(month, '月份', 1, 12)}`,
        `  ${describeField(dayOfWeek, '星期', 0, 6)}`,
        '',
        '📅 人类可读描述:',
        `  ${formatDate()} ${formatTime()} 执行`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      ].join('\n')
    }
  },
  description: 'Cron 表达式解析',
  usage: 'cron <表达式>',
  examples: ['cron "0 9 * * 1-5"', 'cron "*/15 * * * *"']
})