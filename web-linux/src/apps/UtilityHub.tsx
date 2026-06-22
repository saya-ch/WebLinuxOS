import { useState, memo } from 'react'
import { useStore } from '../store'

// 实用工具聚合中心 - 集成多种实用在线工具

interface ToolCategory {
  id: string
  name: string
  icon: string
  tools: Tool[]
}

interface Tool {
  id: string
  name: string
  description: string
  icon: string
  action: () => void
}

function UtilityHub() {
  const [activeCategory, setActiveCategory] = useState<string>('converter')
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const addNotification = useStore((s) => s.addNotification)

  const categories: ToolCategory[] = [
    {
      id: 'converter',
      name: '转换工具',
      icon: '🔄',
      tools: [
        { id: 'json-yaml', name: 'JSON ↔ YAML', description: 'JSON与YAML格式互转', icon: '📋', action: () => convertJsonYaml() },
        { id: 'base64', name: 'Base64 编解码', description: 'Base64编码与解码', icon: '🔐', action: () => convertBase64() },
        { id: 'url-encode', name: 'URL 编解码', description: 'URL编码与解码', icon: '🔗', action: () => convertUrlEncode() },
        { id: 'timestamp', name: '时间戳转换', description: '时间戳与日期转换', icon: '⏰', action: () => convertTimestamp() },
        { id: 'unit', name: '单位转换', description: '长度、重量、温度转换', icon: '📏', action: () => convertUnit() },
        { id: 'color', name: '颜色转换', description: 'RGB/HEX/HSL转换', icon: '🎨', action: () => convertColor() },
      ]
    },
    {
      id: 'generator',
      name: '生成工具',
      icon: '✨',
      tools: [
        { id: 'uuid', name: 'UUID生成', description: '生成唯一标识符', icon: '🔑', action: () => generateUuid() },
        { id: 'password', name: '密码生成', description: '生成安全密码', icon: '🔒', action: () => generatePassword() },
        { id: 'qr', name: '二维码生成', description: '生成二维码', icon: '📱', action: () => generateQr() },
        { id: 'hash', name: 'Hash生成', description: 'MD5/SHA哈希', icon: '#️⃣', action: () => generateHash() },
        { id: 'random', name: '随机数生成', description: '生成随机数', icon: '🎲', action: () => generateRandom() },
        { id: 'lorem', name: 'Lorem生成', description: '生成测试文本', icon: '📝', action: () => generateLorem() },
      ]
    },
    {
      id: 'formatter',
      name: '格式化工具',
      icon: '📝',
      tools: [
        { id: 'json-format', name: 'JSON格式化', description: 'JSON美化与压缩', icon: '📋', action: () => formatJson() },
        { id: 'sql-format', name: 'SQL格式化', description: 'SQL语句美化', icon: '💾', action: () => formatSql() },
        { id: 'xml-format', name: 'XML格式化', description: 'XML美化与压缩', icon: '📄', action: () => formatXml() },
        { id: 'css-format', name: 'CSS格式化', description: 'CSS美化', icon: '🎨', action: () => formatCss() },
        { id: 'number-format', name: '数字格式化', description: '数字格式转换', icon: '🔢', action: () => formatNumber() },
        { id: 'text-format', name: '文本格式化', description: '文本大小写转换', icon: '🔤', action: () => formatText() },
      ]
    },
    {
      id: 'validator',
      name: '验证工具',
      icon: '✅',
      tools: [
        { id: 'json-validate', name: 'JSON验证', description: '验证JSON格式', icon: '📋', action: () => validateJson() },
        { id: 'email-validate', name: '邮箱验证', description: '验证邮箱格式', icon: '📧', action: () => validateEmail() },
        { id: 'url-validate', name: 'URL验证', description: '验证URL格式', icon: '🔗', action: () => validateUrl() },
        { id: 'regex-test', name: '正则测试', description: '测试正则表达式', icon: '🔍', action: () => testRegex() },
        { id: 'credit-card', name: '信用卡验证', description: '验证信用卡号', icon: '💳', action: () => validateCreditCard() },
        { id: 'ip-validate', name: 'IP验证', description: '验证IP地址', icon: '🌐', action: () => validateIp() },
      ]
    },
    {
      id: 'encoder',
      name: '编码工具',
      icon: '🔐',
      tools: [
        { id: 'html-entity', name: 'HTML实体', description: 'HTML实体编解码', icon: '📄', action: () => encodeHtmlEntity() },
        { id: 'unicode', name: 'Unicode转换', description: 'Unicode编解码', icon: '🔤', action: () => encodeUnicode() },
        { id: 'jwt-decode', name: 'JWT解码', description: 'JWT令牌解析', icon: '🎫', action: () => decodeJwt() },
        { id: 'hex', name: 'HEX转换', description: '十六进制转换', icon: '🔢', action: () => encodeHex() },
        { id: 'binary', name: '二进制转换', description: '二进制转换', icon: '0️⃣', action: () => encodeBinary() },
        { id: 'morse', name: '摩斯密码', description: '摩斯密码转换', icon: '📡', action: () => encodeMorse() },
      ]
    }
  ]

  // 工具实现函数
  function convertJsonYaml() {
    try {
      if (!input.trim()) {
        setOutput('请输入JSON或YAML内容')
        return
      }
      
      // 简单的JSON转YAML
      if (input.trim().startsWith('{') || input.trim().startsWith('[')) {
        const json = JSON.parse(input)
        const yaml = jsonToYaml(json)
        setOutput(yaml)
        addNotification({ title: '转换成功', message: 'JSON已转换为YAML', type: 'success', duration: 2000 })
      } else {
        // YAML转JSON
        const json = yamlToJson(input)
        setOutput(JSON.stringify(json, null, 2))
        addNotification({ title: '转换成功', message: 'YAML已转换为JSON', type: 'success', duration: 2000 })
      }
    } catch (e) {
      setOutput(`转换失败: ${e instanceof Error ? e.message : '未知错误'}`)
      addNotification({ title: '转换失败', message: '请检查输入格式', type: 'error', duration: 3000 })
    }
  }

  function jsonToYaml(obj: any, indent = 0): string {
    const spaces = '  '.repeat(indent)
    if (typeof obj !== 'object' || obj === null) {
      return String(obj)
    }
    if (Array.isArray(obj)) {
      return obj.map(item => `${spaces}- ${jsonToYaml(item, indent + 1)}`).join('\n')
    }
    return Object.entries(obj)
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`
        }
        return `${spaces}${key}: ${value}`
      })
      .join('\n')
  }

  function yamlToJson(yaml: string): any {
    const lines = yaml.split('\n').filter(l => l.trim())
    const result: any = {}
    for (const line of lines) {
      const match = line.match(/^(\s*)([^:]+):\s*(.*)$/)
      if (match) {
        const [, , key, value] = match
        if (value) {
          result[key.trim()] = value.trim()
        }
      }
    }
    return result
  }

  function convertBase64() {
    try {
      if (!input.trim()) {
        setOutput('请输入需要编码或解码的内容')
        return
      }
      
      // 判断是编码还是解码
      if (/^[A-Za-z0-9+/=]+$/.test(input.trim())) {
        // 解码
        const decoded = atob(input.trim())
        setOutput(decoded)
        addNotification({ title: '解码成功', message: 'Base64已解码', type: 'success', duration: 2000 })
      } else {
        // 编码
        const encoded = btoa(input)
        setOutput(encoded)
        addNotification({ title: '编码成功', message: '已转换为Base64', type: 'success', duration: 2000 })
      }
    } catch (e) {
      setOutput(`转换失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  function convertUrlEncode() {
    if (!input.trim()) {
      setOutput('请输入需要编码或解码的URL')
      return
    }
    
    try {
      if (input.includes('%')) {
        // 解码
        const decoded = decodeURIComponent(input)
        setOutput(decoded)
        addNotification({ title: '解码成功', message: 'URL已解码', type: 'success', duration: 2000 })
      } else {
        // 编码
        const encoded = encodeURIComponent(input)
        setOutput(encoded)
        addNotification({ title: '编码成功', message: 'URL已编码', type: 'success', duration: 2000 })
      }
    } catch (e) {
      setOutput(`转换失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  function convertTimestamp() {
    if (!input.trim()) {
      setOutput('请输入时间戳或日期')
      return
    }
    
    try {
      const num = Number(input.trim())
      if (!isNaN(num) && num > 0) {
        // 时间戳转日期
        const date = new Date(num * (num < 1e12 ? 1000 : 1))
        setOutput(`日期: ${date.toLocaleString('zh-CN')}\nISO: ${date.toISOString()}\nUTC: ${date.toUTCString()}`)
        addNotification({ title: '转换成功', message: '时间戳已转换为日期', type: 'success', duration: 2000 })
      } else {
        // 日期转时间戳
        const date = new Date(input)
        if (!isNaN(date.getTime())) {
          setOutput(`时间戳(秒): ${Math.floor(date.getTime() / 1000)}\n时间戳(毫秒): ${date.getTime()}`)
          addNotification({ title: '转换成功', message: '日期已转换为时间戳', type: 'success', duration: 2000 })
        } else {
          setOutput('无法解析日期格式')
        }
      }
    } catch (e) {
      setOutput(`转换失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  function convertUnit() {
    if (!input.trim()) {
      setOutput('请输入数值和单位，例如：100 km')
      return
    }
    
    const match = input.match(/^([\d.]+)\s*(\w+)$/)
    if (!match) {
      setOutput('格式错误，请使用: 数值 单位')
      return
    }
    
    const [, value, unit] = match
    const num = parseFloat(value)
    
    const conversions: Record<string, Record<string, number>> = {
      'km': { 'm': num * 1000, 'mile': num * 0.621371, 'ft': num * 3280.84 },
      'm': { 'km': num / 1000, 'cm': num * 100, 'ft': num * 3.28084 },
      'kg': { 'g': num * 1000, 'lb': num * 2.20462, 'oz': num * 35.274 },
      'g': { 'kg': num / 1000, 'mg': num * 1000, 'lb': num / 453.592 },
      'c': { 'f': num * 9/5 + 32, 'k': num + 273.15 },
      'f': { 'c': (num - 32) * 5/9, 'k': (num - 32) * 5/9 + 273.15 },
    }
    
    const lowerUnit = unit.toLowerCase()
    if (conversions[lowerUnit]) {
      const results = Object.entries(conversions[lowerUnit])
        .map(([u, v]) => `${v.toFixed(4)} ${u}`)
        .join('\n')
      setOutput(results)
      addNotification({ title: '转换成功', message: '单位已转换', type: 'success', duration: 2000 })
    } else {
      setOutput('不支持该单位转换')
    }
  }

  function convertColor() {
    if (!input.trim()) {
      setOutput('请输入颜色值，例如：#FF5733 或 rgb(255,87,51)')
      return
    }
    
    try {
      let r = 0, g = 0, b = 0
      
      if (input.startsWith('#')) {
        const hex = input.slice(1)
        if (hex.length === 3) {
          r = parseInt(hex[0] + hex[0], 16)
          g = parseInt(hex[1] + hex[1], 16)
          b = parseInt(hex[2] + hex[2], 16)
        } else if (hex.length === 6) {
          r = parseInt(hex.slice(0, 2), 16)
          g = parseInt(hex.slice(2, 4), 16)
          b = parseInt(hex.slice(4, 6), 16)
        }
      } else if (input.startsWith('rgb')) {
        const match = input.match(/rgb\?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
        if (match) {
          r = parseInt(match[1])
          g = parseInt(match[2])
          b = parseInt(match[3])
        }
      }
      
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      const hsl = rgbToHsl(r, g, b)
      
      setOutput(`HEX: ${hex}\nRGB: rgb(${r}, ${g}, ${b})\nHSL: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)\nCSS变量: --color: ${hex}`)
      addNotification({ title: '转换成功', message: '颜色已转换', type: 'success', duration: 2000 })
    } catch (e) {
      setOutput('无法解析颜色值')
    }
  }

  function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255; g /= 255; b /= 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2
    
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }
    
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
  }

  function generateUuid() {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
    setOutput(`UUID: ${uuid}\n短格式: ${uuid.replace(/-/g, '')}\nURN: urn:uuid:${uuid}`)
    addNotification({ title: '生成成功', message: 'UUID已生成', type: 'success', duration: 2000 })
  }

  function generatePassword() {
    const length = input ? parseInt(input) || 16 : 16
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setOutput(`密码: ${password}\n长度: ${length}位\n包含: 大小写字母、数字、特殊符号`)
    addNotification({ title: '生成成功', message: '安全密码已生成', type: 'success', duration: 2000 })
  }

  function generateQr() {
    if (!input.trim()) {
      setOutput('请输入要生成二维码的内容')
      return
    }
    // 生成二维码URL（使用第三方API）
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(input)}`
    setOutput(`二维码已生成\n\n链接: ${qrUrl}\n\n右键复制链接可在浏览器中打开查看二维码图片`)
    addNotification({ title: '生成成功', message: '二维码链接已生成', type: 'success', duration: 2000 })
  }

  function generateHash() {
    if (!input.trim()) {
      setOutput('请输入要计算哈希的内容')
      return
    }
    // 简单的哈希计算（实际应用中应使用crypto API）
    const simpleHash = (str: string, _algorithm: string) => {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return Math.abs(hash).toString(16).padStart(8, '0')
    }
    
    setOutput(`内容: ${input}\n\nMD5(模拟): ${simpleHash(input, 'md5')}\nSHA1(模拟): ${simpleHash(input, 'sha1')}\nSHA256(模拟): ${simpleHash(input, 'sha256')}`)
    addNotification({ title: '生成成功', message: '哈希值已计算', type: 'success', duration: 2000 })
  }

  function generateRandom() {
    const params = input.split(',').map(p => parseInt(p.trim()))
    const min = params[0] || 0
    const max = params[1] || 100
    const count = params[2] || 1
    
    const numbers = []
    for (let i = 0; i < count; i++) {
      numbers.push(Math.floor(Math.random() * (max - min + 1)) + min)
    }
    
    setOutput(`随机数:\n${numbers.join('\n')}\n\n范围: ${min} - ${max}\n数量: ${count}`)
    addNotification({ title: '生成成功', message: '随机数已生成', type: 'success', duration: 2000 })
  }

  function generateLorem() {
    const words = ['Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua']
    const count = input ? parseInt(input) || 50 : 50
    const result = []
    
    for (let i = 0; i < count; i++) {
      result.push(words[Math.floor(Math.random() * words.length)])
    }
    
    const text = result.join(' ')
    setOutput(`${text}\n\n字数: ${count}`)
    addNotification({ title: '生成成功', message: 'Lorem文本已生成', type: 'success', duration: 2000 })
  }

  function formatJson() {
    if (!input.trim()) {
      setOutput('请输入JSON内容')
      return
    }
    
    try {
      const json = JSON.parse(input)
      setOutput(JSON.stringify(json, null, 2))
      addNotification({ title: '格式化成功', message: 'JSON已美化', type: 'success', duration: 2000 })
    } catch (e) {
      setOutput(`JSON格式错误: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  function formatSql() {
    if (!input.trim()) {
      setOutput('请输入SQL语句')
      return
    }
    
    // 简单的SQL格式化
    const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER', 'BY', 'GROUP', 'HAVING', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'JOIN', 'ON', 'LEFT', 'RIGHT', 'INNER', 'OUTER']
    let formatted = input.toUpperCase()
    
    keywords.forEach(kw => {
      formatted = formatted.replace(new RegExp(`\\b${kw}\\b`, 'g'), `\n${kw}`)
    })
    
    setOutput(formatted.trim())
    addNotification({ title: '格式化成功', message: 'SQL已美化', type: 'success', duration: 2000 })
  }

  function formatXml() {
    if (!input.trim()) {
      setOutput('请输入XML内容')
      return
    }
    
    // 简单的XML格式化
    let formatted = input.replace(/></g, '>\n<')
    const lines = formatted.split('\n')
    let indent = 0
    const result = lines.map(line => {
      if (line.match(/<\//)) indent--
      const spaces = '  '.repeat(Math.max(0, indent))
      if (line.match(/<[^/]/) && !line.match(/<[^/].*\/>/)) indent++
      return spaces + line
    })
    
    setOutput(result.join('\n'))
    addNotification({ title: '格式化成功', message: 'XML已美化', type: 'success', duration: 2000 })
  }

  function formatCss() {
    if (!input.trim()) {
      setOutput('请输入CSS内容')
      return
    }
    
    // 简单的CSS格式化
    let formatted = input.replace(/\{/g, ' {\n  ').replace(/;/g, ';\n  ').replace(/\}/g, '\n}\n')
    formatted = formatted.replace(/\n\s*\n/g, '\n')
    
    setOutput(formatted)
    addNotification({ title: '格式化成功', message: 'CSS已美化', type: 'success', duration: 2000 })
  }

  function formatNumber() {
    if (!input.trim()) {
      setOutput('请输入数字')
      return
    }
    
    const num = parseFloat(input)
    if (isNaN(num)) {
      setOutput('请输入有效的数字')
      return
    }
    
    setOutput(`原始: ${input}\n科学计数: ${num.toExponential(2)}\n千分位: ${num.toLocaleString('zh-CN')}\n二进制: ${Math.floor(num).toString(2)}\n十六进制: ${Math.floor(num).toString(16)}\n八进制: ${Math.floor(num).toString(8)}`)
    addNotification({ title: '格式化成功', message: '数字已转换', type: 'success', duration: 2000 })
  }

  function formatText() {
    if (!input.trim()) {
      setOutput('请输入文本')
      return
    }
    
    setOutput(`原始: ${input}\n大写: ${input.toUpperCase()}\n小写: ${input.toLowerCase()}\n首字母大写: ${input.charAt(0).toUpperCase() + input.slice(1)}\n驼峰: ${input.split(' ').map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)).join('')}\n反转: ${input.split('').reverse().join('')}`)
    addNotification({ title: '格式化成功', message: '文本已转换', type: 'success', duration: 2000 })
  }

  function validateJson() {
    if (!input.trim()) {
      setOutput('请输入JSON内容')
      return
    }
    
    try {
      JSON.parse(input)
      setOutput('✅ JSON格式正确\n\n解析成功，数据结构有效。')
      addNotification({ title: '验证通过', message: 'JSON格式正确', type: 'success', duration: 2000 })
    } catch (e) {
      setOutput(`❌ JSON格式错误\n\n错误位置: ${e instanceof Error ? e.message : '未知错误'}`)
      addNotification({ title: '验证失败', message: 'JSON格式错误', type: 'error', duration: 3000 })
    }
  }

  function validateEmail() {
    if (!input.trim()) {
      setOutput('请输入邮箱地址')
      return
    }
    
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const valid = regex.test(input)
    
    setOutput(valid 
      ? `✅ 邮箱格式正确\n\n${input}\n\n域名: ${input.split('@')[1]}` 
      : `❌ 邮箱格式错误\n\n${input}\n\n请检查格式是否正确`)
    
    addNotification({ 
      title: valid ? '验证通过' : '验证失败', 
      message: valid ? '邮箱格式正确' : '邮箱格式错误', 
      type: valid ? 'success' : 'error', 
      duration: 2000 
    })
  }

  function validateUrl() {
    if (!input.trim()) {
      setOutput('请输入URL')
      return
    }
    
    try {
      const url = new URL(input)
      setOutput(`✅ URL格式正确\n\n协议: ${url.protocol}\n域名: ${url.hostname}\n路径: ${url.pathname}\n查询: ${url.search}`)
      addNotification({ title: '验证通过', message: 'URL格式正确', type: 'success', duration: 2000 })
    } catch {
      setOutput(`❌ URL格式错误\n\n${input}\n\n请检查URL格式`)
      addNotification({ title: '验证失败', message: 'URL格式错误', type: 'error', duration: 3000 })
    }
  }

  function testRegex() {
    const parts = input.split('|||')
    if (parts.length < 2) {
      setOutput('请输入: 正则表达式|||测试文本')
      return
    }
    
    const [pattern, text] = parts
    try {
      const regex = new RegExp(pattern)
      const matches = text.match(regex)
      
      setOutput(matches 
        ? `✅ 匹配成功\n\n匹配结果: ${matches.join(', ')}\n匹配数量: ${matches.length}` 
        : `❌ 无匹配\n\n正则: ${pattern}\n文本: ${text}`)
      
      addNotification({ 
        title: matches ? '匹配成功' : '无匹配', 
        message: matches ? `找到${matches.length}个匹配` : '未找到匹配', 
        type: matches ? 'success' : 'warning', 
        duration: 2000 
      })
    } catch (e) {
      setOutput(`❌ 正则表达式错误\n\n${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  function validateCreditCard() {
    if (!input.trim()) {
      setOutput('请输入信用卡号')
      return
    }
    
    const num = input.replace(/\D/g, '')
    const valid = num.length >= 13 && num.length <= 19
    
    // 简单的Luhn算法验证
    let sum = 0
    for (let i = 0; i < num.length; i++) {
      let digit = parseInt(num[i])
      if ((num.length - i) % 2 === 0) {
        digit *= 2
        if (digit > 9) digit -= 9
      }
      sum += digit
    }
    const luhnValid = sum % 10 === 0
    
    const type = num.startsWith('4') ? 'Visa' : num.startsWith('5') ? 'MasterCard' : num.startsWith('3') ? 'Amex' : '未知'
    
    setOutput(`${valid && luhnValid ? '✅' : '❌'} 信用卡验证\n\n卡号: ${num}\n类型: ${type}\n长度: ${num.length}\nLuhn验证: ${luhnValid ? '通过' : '失败'}`)
    
    addNotification({ 
      title: luhnValid ? '验证通过' : '验证失败', 
      message: luhnValid ? '卡号格式正确' : '卡号格式错误', 
      type: luhnValid ? 'success' : 'error', 
      duration: 2000 
    })
  }

  function validateIp() {
    if (!input.trim()) {
      setOutput('请输入IP地址')
      return
    }
    
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    
    if (ipv4Regex.test(input)) {
      const parts = input.split('.')
      const valid = parts.every(p => parseInt(p) <= 255)
      setOutput(`${valid ? '✅' : '❌'} IPv4地址\n\n${input}\n\n各段数值: ${parts.join(', ')}`)
      addNotification({ title: valid ? '验证通过' : '验证失败', message: valid ? 'IPv4格式正确' : 'IPv4格式错误', type: valid ? 'success' : 'error', duration: 2000 })
    } else if (ipv6Regex.test(input)) {
      setOutput(`✅ IPv6地址\n\n${input}\n\n格式正确`)
      addNotification({ title: '验证通过', message: 'IPv6格式正确', type: 'success', duration: 2000 })
    } else {
      setOutput(`❌ IP地址格式错误\n\n${input}\n\n请输入有效的IPv4或IPv6地址`)
      addNotification({ title: '验证失败', message: 'IP格式错误', type: 'error', duration: 3000 })
    }
  }

  function encodeHtmlEntity() {
    if (!input.trim()) {
      setOutput('请输入HTML内容')
      return
    }
    
    const encoded = input.replace(/[<>&"']/g, c => {
      const entities: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }
      return entities[c] || c
    })
    
    const decoded = encoded.replace(/&[^;]+;/g, c => {
      const entities: Record<string, string> = { '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&apos;': "'" }
      return entities[c] || c
    })
    
    setOutput(`原始: ${input}\n编码: ${encoded}\n解码: ${decoded}`)
    addNotification({ title: '转换成功', message: 'HTML实体已转换', type: 'success', duration: 2000 })
  }

  function encodeUnicode() {
    if (!input.trim()) {
      setOutput('请输入文本')
      return
    }
    
    const encoded = input.split('').map(c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`).join('')
    const decoded = encoded.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    
    setOutput(`原始: ${input}\nUnicode: ${encoded}\n解码: ${decoded}`)
    addNotification({ title: '转换成功', message: 'Unicode已转换', type: 'success', duration: 2000 })
  }

  function decodeJwt() {
    if (!input.trim()) {
      setOutput('请输入JWT令牌')
      return
    }
    
    try {
      const parts = input.split('.')
      if (parts.length !== 3) {
        setOutput('JWT格式错误，应包含三部分')
        return
      }
      
      const header = JSON.parse(atob(parts[0]))
      const payload = JSON.parse(atob(parts[1]))
      
      setOutput(`Header:\n${JSON.stringify(header, null, 2)}\n\nPayload:\n${JSON.stringify(payload, null, 2)}\n\nSignature: ${parts[2]}`)
      addNotification({ title: '解码成功', message: 'JWT已解析', type: 'success', duration: 2000 })
    } catch (e) {
      setOutput(`解码失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  function encodeHex() {
    if (!input.trim()) {
      setOutput('请输入文本或十六进制')
      return
    }
    
    if (/^[0-9a-fA-F]+$/.test(input)) {
      // 解码
      const decoded = input.match(/.{1,2}/g)?.map(hex => String.fromCharCode(parseInt(hex, 16))).join('') || ''
      setOutput(`十六进制: ${input}\n解码: ${decoded}`)
    } else {
      // 编码
      const encoded = input.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
      setOutput(`原始: ${input}\n十六进制: ${encoded}`)
    }
    addNotification({ title: '转换成功', message: 'HEX已转换', type: 'success', duration: 2000 })
  }

  function encodeBinary() {
    if (!input.trim()) {
      setOutput('请输入文本或二进制')
      return
    }
    
    if (/^[01]+$/.test(input)) {
      // 解码
      const decoded = input.match(/.{8}/g)?.map(bin => String.fromCharCode(parseInt(bin, 2))).join('') || ''
      setOutput(`二进制: ${input}\n解码: ${decoded}`)
    } else {
      // 编码
      const encoded = input.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join('')
      setOutput(`原始: ${input}\n二进制: ${encoded}`)
    }
    addNotification({ title: '转换成功', message: '二进制已转换', type: 'success', duration: 2000 })
  }

  function encodeMorse() {
    if (!input.trim()) {
      setOutput('请输入文本或摩斯密码')
      return
    }
    
    const morseCode: Record<string, string> = {
      'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....',
      'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.',
      'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
      'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
      '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', ' ': '/'
    }
    
    if (/^[.\-\/]+$/.test(input)) {
      // 解码
      const reverseMorse: Record<string, string> = {}
      Object.entries(morseCode).forEach(([k, v]) => { reverseMorse[v] = k })
      const decoded = input.split(' ').map(c => reverseMorse[c] || '').join('')
      setOutput(`摩斯密码: ${input}\n解码: ${decoded}`)
    } else {
      // 编码
      const encoded = input.toUpperCase().split('').map(c => morseCode[c] || '').join(' ')
      setOutput(`原始: ${input}\n摩斯密码: ${encoded}`)
    }
    addNotification({ title: '转换成功', message: '摩斯密码已转换', type: 'success', duration: 2000 })
  }

  const currentCategory = categories.find(c => c.id === activeCategory)
  const currentTool = currentCategory?.tools.find(t => t.id === activeTool)

  return (
    <div className="utility-hub" style={{
      display: 'flex',
      height: '100%',
      gap: '16px',
      padding: '16px',
      background: 'var(--window-bg)'
    }}>
      {/* 左侧：工具分类 */}
      <div style={{
        width: '200px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{
          padding: '12px',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-primary)'
        }}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" style={{marginRight: '8px', verticalAlign: 'middle'}}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          实用工具聚合中心
        </div>
        
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id)
              setActiveTool(null)
              setInput('')
              setOutput('')
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: activeCategory === cat.id ? 'var(--accent-bg)' : 'var(--glass-bg)',
              border: activeCategory === cat.id ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: activeCategory === cat.id ? 'var(--accent)' : 'var(--text-primary)',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '18px' }}>{cat.icon}</span>
            <span style={{ fontSize: '13px' }}>{cat.name}</span>
          </button>
        ))}
      </div>
      
      {/* 中间：工具列表 */}
      <div style={{
        width: '250px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        overflow: 'auto'
      }}>
        {currentCategory?.tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => {
              setActiveTool(tool.id)
              setInput('')
              setOutput('')
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: activeTool === tool.id ? 'var(--accent-bg)' : 'var(--glass-bg)',
              border: activeTool === tool.id ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: 'var(--text-primary)',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '16px' }}>{tool.icon}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>{tool.name}</div>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>{tool.description}</div>
            </div>
          </button>
        ))}
      </div>
      
      {/* 右侧：工具操作 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {currentTool ? (
          <>
            <div style={{
              padding: '16px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {currentTool.icon} {currentTool.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {currentTool.description}
              </div>
            </div>
            
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{
                padding: '12px',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>输入</span>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="请输入内容..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    background: 'var(--window-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
                <button
                  onClick={currentTool.action}
                  style={{
                    padding: '10px 24px',
                    background: 'var(--accent-gradient)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  执行
                </button>
              </div>
              
              <div style={{
                flex: 1,
                padding: '12px',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>输出</span>
                  <button
                    onClick={() => {
                      if (output) {
                        navigator.clipboard.writeText(output)
                        addNotification({ title: '已复制', message: '结果已复制', type: 'success', duration: 2000 })
                      }
                    }}
                    disabled={!output}
                    style={{
                      fontSize: '10px',
                      padding: '4px 12px',
                      background: 'var(--window-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      cursor: output ? 'pointer' : 'not-allowed',
                      color: 'var(--text-secondary)',
                      opacity: output ? 1 : 0.5
                    }}
                  >
                    复制
                  </button>
                </div>
                <div style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--window-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  overflow: 'auto',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit'
                }}>
                  {output || '等待执行...'}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            color: 'var(--text-secondary)'
          }}>
            请从左侧选择一个工具
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(UtilityHub)