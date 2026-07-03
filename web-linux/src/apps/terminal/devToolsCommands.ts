import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

registerCommand('json', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '📋 JSON 工具',
          '═'.repeat(40),
          '',
          '用法:',
          '  json format <JSON字符串> - 格式化JSON',
          '  json minify <JSON字符串> - 压缩JSON',
          '  json validate <JSON字符串> - 验证JSON',
          '',
          '示例:',
          '  json format {"name":"test"}',
          '  json validate {"name":"test"}',
          '',
        ].join('\n')
      }
    }
    
    const action = args[0].toLowerCase()
    const jsonString = args.slice(1).join(' ')
    
    if (!jsonString) {
      return { output: '错误: 请提供JSON字符串' }
    }
    
    try {
      const parsed = JSON.parse(jsonString)
      
      if (action === 'format') {
        return { output: JSON.stringify(parsed, null, 2) }
      }
      
      if (action === 'minify') {
        return { output: JSON.stringify(parsed) }
      }
      
      if (action === 'validate') {
        return { output: '✅ JSON格式有效' }
      }
      
      return { output: `未知操作: ${action}` }
    } catch (error) {
      return { output: `❌ JSON无效: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: 'JSON格式化、压缩和验证',
  usage: 'json <format|minify|validate> <JSON>',
  examples: ['json format {"a":1}', 'json validate {"a":1}']
})

registerCommand('base64', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔐 Base64 工具',
          '═'.repeat(40),
          '',
          '用法:',
          '  base64 encode <文本> - 编码为Base64',
          '  base64 decode <Base64> - 解码Base64',
          '',
          '示例:',
          '  base64 encode Hello World',
          '  base64 decode SGVsbG8gV29ybGQ=',
          '',
        ].join('\n')
      }
    }
    
    const action = args[0].toLowerCase()
    const text = args.slice(1).join(' ')
    
    if (!text) {
      return { output: '错误: 请提供要处理的文本' }
    }
    
    try {
      if (action === 'encode') {
        const encoded = btoa(unescape(encodeURIComponent(text)))
        return { output: encoded }
      }
      
      if (action === 'decode') {
        const decoded = decodeURIComponent(escape(atob(text)))
        return { output: decoded }
      }
      
      return { output: `未知操作: ${action}` }
    } catch (error) {
      return { output: `❌ 操作失败: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: 'Base64编码和解码',
  usage: 'base64 <encode|decode> <文本>',
  examples: ['base64 encode Hello', 'base64 decode SGVsbG8=']
})

registerCommand('hash', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔑 哈希工具',
          '═'.repeat(40),
          '',
          '用法:',
          '  hash md5 <文本> - MD5哈希',
          '  hash sha1 <文本> - SHA-1哈希',
          '  hash sha256 <文本> - SHA-256哈希',
          '',
          '示例:',
          '  hash sha256 Hello World',
          '  hash md5 test',
          '',
        ].join('\n')
      }
    }
    
    const algorithm = args[0].toLowerCase()
    const text = args.slice(1).join(' ')
    
    if (!text) {
      return { output: '错误: 请提供要哈希的文本' }
    }
    
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(text)
      const hashBuffer = await crypto.subtle.digest(algorithm.toUpperCase(), data)
      
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      
      return { output: hashHex }
    } catch (error) {
      return { output: `❌ 哈希失败: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: '计算文本哈希值',
  usage: 'hash <md5|sha1|sha256> <文本>',
  examples: ['hash sha256 test', 'hash md5 hello']
})

registerCommand('uuid', {
  handler: (): CommandResult => {
    const uuid = crypto.randomUUID()
    return {
      output: [
        '🆔 UUID 生成器',
        '═'.repeat(40),
        '',
        `UUID: ${uuid}`,
        '',
        '已复制到剪贴板',
        '',
      ].join('\n')
    }
  },
  description: '生成随机UUID',
  usage: 'uuid',
  examples: ['uuid']
})

registerCommand('regex', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '🔍 正则表达式测试',
          '═'.repeat(40),
          '',
          '用法: regex <模式> <文本>',
          '',
          '示例:',
          '  regex ^[a-z]+$ hello',
          '  regex \\d+ 123abc',
          '',
        ].join('\n')
      }
    }
    
    const pattern = args[0]
    const text = args.slice(1).join(' ')
    
    try {
      const regex = new RegExp(pattern)
      const matches = text.match(regex)
      
      const output: string[] = []
      output.push('🔍 正则表达式测试')
      output.push('═'.repeat(40))
      output.push('')
      output.push(`模式: ${pattern}`)
      output.push(`文本: ${text}`)
      output.push('')
      
      if (matches) {
        output.push(`✅ 匹配成功!`)
        output.push(`匹配结果: ${matches.join(', ')}`)
        output.push(`匹配次数: ${matches.length}`)
      } else {
        output.push(`❌ 未找到匹配`)
      }
      
      output.push('')
      
      return { output: output.join('\n') }
    } catch (error) {
      return { output: `❌ 正则表达式无效: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: '测试正则表达式',
  usage: 'regex <模式> <文本>',
  examples: ['regex \\d+ 123abc', 'regex ^[a-z]+$ hello']
})

registerCommand('urlencode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🔗 URL编码工具',
          '═'.repeat(40),
          '',
          '用法:',
          '  urlencode encode <文本> - URL编码',
          '  urlencode decode <文本> - URL解码',
          '',
          '示例:',
          '  urlencode encode https://example.com?a=1',
          '  urlencode decode https%3A%2F%2Fexample.com',
          '',
        ].join('\n')
      }
    }
    
    const action = args[0].toLowerCase()
    const text = args.slice(1).join(' ')
    
    if (!text) {
      return { output: '错误: 请提供要处理的文本' }
    }
    
    try {
      if (action === 'encode') {
        const encoded = encodeURIComponent(text)
        return { output: encoded }
      }
      
      if (action === 'decode') {
        const decoded = decodeURIComponent(text)
        return { output: decoded }
      }
      
      return { output: `未知操作: ${action}` }
    } catch (error) {
      return { output: `❌ 操作失败: ${error instanceof Error ? error.message : '未知错误'}` }
    }
  },
  description: 'URL编码和解码',
  usage: 'urlencode <encode|decode> <文本>',
  examples: ['urlencode encode test query', 'urlencode decode test%20query']
})

registerCommand('converter', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '🔢 单位转换器',
          '═'.repeat(40),
          '',
          '用法:',
          '  converter <from> <to> <value>',
          '',
          '支持的单位:',
          '  长度: m, km, cm, mm, mi, yd, ft, in',
          '  重量: kg, g, lb, oz',
          '  温度: c, f, k',
          '',
          '示例:',
          '  converter km mi 10',
          '  converter c f 25',
          '  converter kg lb 100',
          '',
        ].join('\n')
      }
    }
    
    const from = args[0].toLowerCase()
    const to = args[1].toLowerCase()
    const value = parseFloat(args[2])
    
    if (isNaN(value)) {
      return { output: '错误: 请提供有效的数值' }
    }
    
    let result: number | null = null
    
    if (['m', 'km', 'cm', 'mm', 'mi', 'yd', 'ft', 'in'].includes(from) && ['m', 'km', 'cm', 'mm', 'mi', 'yd', 'ft', 'in'].includes(to)) {
      const toMeters: Record<string, number> = {
        m: 1, km: 1000, cm: 0.01, mm: 0.001,
        mi: 1609.34, yd: 0.9144, ft: 0.3048, in: 0.0254
      }
      const meters = value * toMeters[from]
      result = meters / toMeters[to]
    }
    
    else if (['kg', 'g', 'lb', 'oz'].includes(from) && ['kg', 'g', 'lb', 'oz'].includes(to)) {
      const toKg: Record<string, number> = {
        kg: 1, g: 0.001, lb: 0.453592, oz: 0.0283495
      }
      const kg = value * toKg[from]
      result = kg / toKg[to]
    }
    
    else if (['c', 'f', 'k'].includes(from) && ['c', 'f', 'k'].includes(to)) {
      let celsius = value
      if (from === 'f') celsius = (value - 32) * 5 / 9
      if (from === 'k') celsius = value - 273.15
      
      if (to === 'c') result = celsius
      if (to === 'f') result = celsius * 9 / 5 + 32
      if (to === 'k') result = celsius + 273.15
    }
    
    if (result === null) {
      return { output: `错误: 不支持从 ${from} 转换到 ${to}` }
    }
    
    return {
      output: [
        '🔢 单位转换结果',
        '═'.repeat(40),
        '',
        `${value} ${from} = ${result.toFixed(4)} ${to}`,
        '',
      ].join('\n')
    }
  },
  description: '单位转换器',
  usage: 'converter <from> <to> <value>',
  examples: ['converter km mi 10', 'converter c f 25']
})