/**
 * 实用终端命令集 - 提供真实世界功能
 * 包括：代码片段生成、数据可视化、JSON处理、编码工具等
 */

import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

// 代码片段生成命令
registerCommand('snippet', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const escapeChar = String.fromCharCode(27)
    const blue = `${escapeChar}[34m`
    const green = `${escapeChar}[32m`
    const yellow = `${escapeChar}[33m`
    const reset = `${escapeChar}[0m`
    
    if (args.length === 0) {
      return {
        output: `${blue}代码片段生成器${reset}
用法: snippet <类型> [选项]

可用类型:
  for          生成for循环
  while        生成while循环
  function     生成函数模板
  class        生成类模板
  react        生成React组件
  fetch        生成fetch请求
  express      生成Express路由
  python       生成Python脚本模板

示例:
  snippet for
  snippet react MyComponent
  snippet fetch https://api.example.com`
      }
    }
    
    const type = args[0]?.toLowerCase()
    const name = args[1] || 'Example'
    
    const snippets: Record<string, string> = {
      'for': `for (let i = 0; i < array.length; i++) {
  const item = array[i];
  // 处理item
}`,
      'while': `while (condition) {
  // 循环体
  if (shouldBreak) break;
}`,
      'function': `function ${name}(params) {
  // 函数逻辑
  return result;
}`,
      'class': `class ${name} {
  constructor(props) {
    this.props = props;
  }

  method() {
    // 方法逻辑
  }
}`,
      'react': `import React from 'react';

interface ${name}Props {
  // 定义props
}

export const ${name}: React.FC<${name}Props> = (props) => {
  return (
    <div className="${name.toLowerCase()}">
      {/* 组件内容 */}
    </div>
  );
};`,
      'fetch': `const fetchData = async () => {
  try {
    const response = await fetch('${name}');
    if (!response.ok) throw new Error('Network error');
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Fetch error:', error);
  }
};`,
      'express': `app.get('/api/${name.toLowerCase()}', async (req, res) => {
  try {
    const data = await getData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});`,
      'python': `#!/usr/bin/env python3
"""
${name} - 描述
"""

import sys
import json

def main():
    """主函数"""
    # 你的代码
    pass

if __name__ == '__main__':
    main()
`
    }
    
    const snippet = snippets[type]
    if (!snippet) {
      return { output: `未知的片段类型: ${type}\n输入 'snippet' 查看可用类型` }
    }
    
    return {
      output: `${green}生成的代码片段:${reset}\n\n${snippet}\n\n${yellow}提示: 复制代码到编辑器中使用${reset}`
    }
  },
  description: '生成常用代码片段',
  usage: 'snippet <类型> [名称]',
  examples: ['snippet react MyComponent', 'snippet fetch https://api.example.com', 'snippet python']
})

// JSON处理命令
registerCommand('json', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const escapeChar = String.fromCharCode(27)
    const blue = `${escapeChar}[34m`
    const green = `${escapeChar}[32m`
    const red = `${escapeChar}[31m`
    const reset = `${escapeChar}[0m`
    
    if (args.length < 2) {
      return {
        output: `${blue}JSON处理工具${reset}
用法: json <操作> <数据>

操作:
  format    格式化JSON
  minify    压缩JSON
  validate  验证JSON
  keys      显示所有键
  get       获取值 (需要路径参数)

示例:
  json format '{"name":"test","value":123}'
  json validate '{"invalid": json}'
  json keys '{"user":{"name":"John","age":30}}'
  json get '{"user":{"name":"John"}}' user.name`
      }
    }
    
    const operation = args[0]
    let jsonString = args.slice(1).join(' ')
    
    try {
      switch (operation) {
        case 'format': {
          const parsed = JSON.parse(jsonString)
          return { output: JSON.stringify(parsed, null, 2) }
        }
        
        case 'minify': {
          const parsed = JSON.parse(jsonString)
          return { output: JSON.stringify(parsed) }
        }
        
        case 'validate': {
          try {
            JSON.parse(jsonString)
            return { output: `${green}✓ 有效的JSON${reset}` }
          } catch {
            return { output: `${red}✗ 无效的JSON${reset}` }
          }
        }
        
        case 'keys': {
          const parsed = JSON.parse(jsonString)
          const getKeys = (obj: any, prefix = ''): string[] => {
            if (typeof obj !== 'object' || obj === null) return []
            return Object.keys(obj).flatMap(key => {
              const path = prefix ? `${prefix}.${key}` : key
              const value = obj[key]
              if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                return [path, ...getKeys(value, path)]
              }
              return [path]
            })
          }
          const keys = getKeys(parsed)
          return { output: `${green}所有键:${reset}\n${keys.join('\n')}` }
        }
        
        case 'get': {
          const path = args[args.length - 1]
          const parsed = JSON.parse(jsonString.replace(path, '').trim())
          const value = path.split('.').reduce((obj: any, key) => obj?.[key], parsed)
          return { output: JSON.stringify(value, null, 2) }
        }
        
        default:
          return { output: `未知操作: ${operation}` }
      }
    } catch (error) {
      return { output: `${red}错误: ${(error as Error).message}${reset}` }
    }
  },
  description: 'JSON处理工具',
  usage: 'json <操作> <数据>',
  examples: ['json format \'{"name":"test"}\'', 'json validate \'{"test":1}\'']
})

// 编码工具命令
registerCommand('encode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const escapeChar = String.fromCharCode(27)
    const blue = `${escapeChar}[34m`
    const green = `${escapeChar}[32m`
    const reset = `${escapeChar}[0m`
    
    if (args.length < 2) {
      return {
        output: `${blue}编码/解码工具${reset}
用法: encode <操作> <文本>

操作:
  base64     Base64编码
  base64d    Base64解码
  url        URL编码
  urld       URL解码
  html       HTML实体编码
  htmld      HTML实体解码
  hex        转十六进制
  hexd       十六进制转文本
  binary     转二进制
  binaryd    二进制转文本

示例:
  encode base64 "Hello World"
  encode base64d "SGVsbG8gV29ybGQ="
  encode url "hello world"`
      }
    }
    
    const operation = args[0]
    const text = args.slice(1).join(' ')
    
    try {
      let result = ''
      
      switch (operation) {
        case 'base64':
          result = btoa(unescape(encodeURIComponent(text)))
          break
        case 'base64d':
          result = decodeURIComponent(escape(atob(text)))
          break
        case 'url':
          result = encodeURIComponent(text)
          break
        case 'urld':
          result = decodeURIComponent(text)
          break
        case 'html':
          result = text.replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
          }[char] || char))
          break
        case 'htmld':
          result = text.replace(/&[^;]+;/g, entity => {
            const entities: Record<string, string> = {
              '&amp;': '&',
              '&lt;': '<',
              '&gt;': '>',
              '&quot;': '"',
              '&#39;': "'"
            }
            return entities[entity] || entity
          })
          break
        case 'hex':
          result = text.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ')
          break
        case 'hexd':
          result = text.split(' ').map(h => String.fromCharCode(parseInt(h, 16))).join('')
          break
        case 'binary':
          result = text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')
          break
        case 'binaryd':
          result = text.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join('')
          break
        default:
          return { output: `未知操作: ${operation}` }
      }
      
      return { output: `${green}结果:${reset} ${result}` }
    } catch (error) {
      return { output: `错误: ${(error as Error).message}` }
    }
  },
  description: '编码/解码工具',
  usage: 'encode <操作> <文本>',
  examples: ['encode base64 "Hello"', 'encode url "test value"']
})

// 时间戳转换命令
registerCommand('timestamp', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const escapeChar = String.fromCharCode(27)
    const blue = `${escapeChar}[34m`
    const green = `${escapeChar}[32m`
    const cyan = `${escapeChar}[36m`
    const reset = `${escapeChar}[0m`
    
    const now = Date.now()
    const nowDate = new Date()
    
    if (args.length === 0) {
      return {
        output: `${blue}时间戳工具${reset}

${green}当前时间:${reset}
  时间戳:     ${cyan}${now}${reset}
  ISO格式:    ${cyan}${nowDate.toISOString()}${reset}
  本地时间:   ${cyan}${nowDate.toLocaleString('zh-CN')}${reset}
  UTC时间:    ${cyan}${nowDate.toUTCString()}${reset}

用法:
  timestamp now          显示当前时间戳
  timestamp <时间戳>     时间戳转日期
  timestamp -d <日期>    日期转时间戳
  
示例:
  timestamp 1609459200000
  timestamp -d "2024-01-01"
  timestamp -d "2024-01-01 12:30:00"`
      }
    }
    
    const arg = args[0]
    
    if (arg === 'now') {
      return {
        output: `时间戳: ${cyan}${now}${reset}\nISO: ${nowDate.toISOString()}\n本地: ${nowDate.toLocaleString('zh-CN')}`
      }
    }
    
    if (arg === '-d' && args.length > 1) {
      try {
        const dateStr = args.slice(1).join(' ')
        const date = new Date(dateStr)
        return {
          output: `${green}时间戳:${reset} ${cyan}${date.getTime()}${reset}\n验证: ${date.toLocaleString('zh-CN')}`
        }
      } catch {
        return { output: '无效的日期格式' }
      }
    }
    
    // 尝试解析为时间戳
    try {
      const timestamp = parseInt(arg)
      const date = new Date(timestamp)
      return {
        output: `${green}日期:${reset}
  本地时间: ${cyan}${date.toLocaleString('zh-CN')}${reset}
  UTC时间:  ${cyan}${date.toUTCString()}${reset}
  ISO格式:  ${cyan}${date.toISOString()}${reset}
  相对时间: ${cyan}${getRelativeTime(date)}${reset}`
      }
    } catch {
      return { output: '无效的时间戳' }
    }
  },
  description: '时间戳转换工具',
  usage: 'timestamp [时间戳|now|-d 日期]',
  examples: ['timestamp', 'timestamp 1609459200000', 'timestamp -d "2024-01-01"']
})

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(Math.abs(diff) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  const isPast = diff > 0
  
  if (days > 365) {
    const years = Math.floor(days / 365)
    return `${isPast ? '' : '还有 '}${years} 年${isPast ? '前' : ''}`
  }
  if (days > 30) {
    const months = Math.floor(days / 30)
    return `${isPast ? '' : '还有 '}${months} 个月${isPast ? '前' : ''}`
  }
  if (days > 0) {
    return `${isPast ? '' : '还有 '}${days} 天${isPast ? '前' : ''}`
  }
  if (hours > 0) {
    return `${isPast ? '' : '还有 '}${hours} 小时${isPast ? '前' : ''}`
  }
  if (minutes > 0) {
    return `${isPast ? '' : '还有 '}${minutes} 分钟${isPast ? '前' : ''}`
  }
  return '刚刚'
}

// 密码生成命令
registerCommand('password', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const escapeChar = String.fromCharCode(27)
    const blue = `${escapeChar}[34m`
    const green = `${escapeChar}[32m`
    const cyan = `${escapeChar}[36m`
    const reset = `${escapeChar}[0m`
    
    const length = args[0] ? parseInt(args[0]) : 16
    const count = args[1] ? parseInt(args[1]) : 5
    
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    const allChars = lowercase + uppercase + numbers + symbols
    
    const generatePassword = (len: number): string => {
      let password = ''
      // 确保包含各类字符
      password += lowercase[Math.floor(Math.random() * lowercase.length)]
      password += uppercase[Math.floor(Math.random() * uppercase.length)]
      password += numbers[Math.floor(Math.random() * numbers.length)]
      password += symbols[Math.floor(Math.random() * symbols.length)]
      
      for (let i = password.length; i < len; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)]
      }
      
      // 打乱顺序
      return password.split('').sort(() => Math.random() - 0.5).join('')
    }
    
    const passwords: string[] = []
    for (let i = 0; i < Math.min(count, 10); i++) {
      passwords.push(generatePassword(Math.max(8, Math.min(64, length))))
    }
    
    return {
      output: `${blue}生成的密码 (长度: ${length}):${reset}
${passwords.map((p, i) => `  ${i + 1}. ${cyan}${p}${reset}`).join('\n')}

${green}提示: 请妥善保管密码，建议使用密码管理器${reset}`
    }
  },
  description: '生成强密码',
  usage: 'password [长度] [数量]',
  examples: ['password', 'password 20', 'password 16 10']
})

// 颜色转换命令
registerCommand('color', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const escapeChar = String.fromCharCode(27)
    const blue = `${escapeChar}[34m`
    const green = `${escapeChar}[32m`
    const reset = `${escapeChar}[0m`
    
    if (args.length === 0) {
      return {
        output: `${blue}颜色转换工具${reset}
用法: color <颜色值>

支持格式:
  HEX:   #ff0000 或 ff0000
  RGB:   rgb(255, 0, 0) 或 255,0,0
  HSL:   hsl(0, 100%, 50%)

示例:
  color #3498db
  color 255,128,0
  color hsl(210, 50%, 60%)`
      }
    }
    
    const input = args.join(' ')
    let r = 0, g = 0, b = 0
    
    try {
      // HEX
      if (input.startsWith('#') || /^[0-9a-fA-F]{3,6}$/.test(input)) {
        let hex = input.replace('#', '')
        if (hex.length === 3) {
          hex = hex.split('').map(c => c + c).join('')
        }
        r = parseInt(hex.substring(0, 2), 16)
        g = parseInt(hex.substring(2, 4), 16)
        b = parseInt(hex.substring(4, 6), 16)
      }
      // RGB
      else if (input.includes(',') || input.startsWith('rgb')) {
        const match = input.match(/(\d+)/g)
        if (match && match.length >= 3) {
          r = parseInt(match[0])
          g = parseInt(match[1])
          b = parseInt(match[2])
        }
      }
      // HSL
      else if (input.startsWith('hsl')) {
        const match = input.match(/(\d+)/g)
        if (match && match.length >= 3) {
          const h = parseInt(match[0]) / 360
          const s = parseInt(match[1]) / 100
          const l = parseInt(match[2]) / 100
          
          const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1/6) return p + (q - p) * 6 * t
            if (t < 1/2) return q
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
            return p
          }
          
          const q = l < 0.5 ? l * (1 + s) : l + s - l * s
          const p = 2 * l - q
          r = Math.round(hue2rgb(p, q, h + 1/3) * 255)
          g = Math.round(hue2rgb(p, q, h) * 255)
          b = Math.round(hue2rgb(p, q, h - 1/3) * 255)
        }
      }
      
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b))
      
      return {
        output: `${green}颜色信息:${reset}

HEX:   ${hex}
RGB:   rgb(${r}, ${g}, ${b})
RGBA:  rgba(${r}, ${g}, ${b}, 1.0)

亮度: ${hsp > 127.5 ? '亮色' : '暗色'} (HSP: ${Math.round(hsp)})

预览: \x1b[48;2;${r};${g};${b}m            \x1b[0m`
      }
    } catch {
      return { output: '无效的颜色格式' }
    }
  },
  description: '颜色转换工具',
  usage: 'color <颜色值>',
  examples: ['color #3498db', 'color 255,0,128', 'color hsl(210,50%,60%)']
})

console.log('✓ 实用命令集已加载')