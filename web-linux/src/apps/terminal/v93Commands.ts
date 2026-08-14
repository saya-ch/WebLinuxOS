import { registerCommand } from './commands'

// === v93 增强命令集 — HTTP请求/文本分析/二维码生成/颜色工具 ===

// http - 发送HTTP请求（真实fetch API）
registerCommand('http', {
  handler: async (context) => {
    const url = context.args[0]
    if (!url) {
      return { output: '用法: http <url> [method] [headers] [body]\n\n示例:\n  http https://api.github.com/repos/saya-ch/WebLinuxOS\n  http https://httpbin.org/post POST \'{"Content-Type": "application/json"}\' \'{"name": "test"}\'' }
    }

    const method = (context.args[1] || 'GET').toUpperCase()
    let headers: Record<string, string> = {}
    let body: string | undefined

    const jsonStart = context.args.findIndex(a => a.startsWith('{') || a.startsWith('['))
    if (jsonStart > 0) {
      const headerStr = context.args.slice(2, jsonStart).join(' ')
      try {
        headers = JSON.parse(headerStr)
      } catch {
        const parts = headerStr.split(',').map(p => p.trim())
        parts.forEach(part => {
          const [k, v] = part.split(':').map(s => s.trim())
          if (k && v) headers[k] = v
        })
      }
      body = context.args.slice(jsonStart).join(' ')
    } else if (context.args.length > 2) {
      const headerStr = context.args.slice(2).join(' ')
      try {
        headers = JSON.parse(headerStr)
      } catch {}
    }

    const startTime = Date.now()
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
      })

      const text = await response.text()
      const responseTime = Date.now() - startTime

      let formattedBody = text
      try {
        formattedBody = JSON.stringify(JSON.parse(text), null, 2)
      } catch {}

      const headerLines = Array.from(response.headers.entries())
        .map(([k, v]) => `  ${k}: ${v}`)
        .join('\n')

      return {
        output: [
          `[HTTP ${response.status} ${response.statusText}] ${responseTime}ms`,
          `[Content-Type: ${response.headers.get('content-type') || 'unknown'}]`,
          `[Size: ${new Blob([text]).size} bytes]`,
          '',
          '--- Response Headers ---',
          headerLines,
          '',
          '--- Response Body ---',
          formattedBody,
        ].join('\n')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return { output: `错误: ${message}` }
    }
  },
  description: '发送HTTP请求并显示响应（支持所有方法和自定义Headers）',
  usage: 'http <url> [method] [headers] [body]',
  examples: [
    'http https://api.github.com/repos/saya-ch/WebLinuxOS',
    'http https://httpbin.org/post POST \'{"Content-Type": "application/json"}\' \'{"name":"test"}\'',
  ]
})

// text-analyze - 文本分析命令
registerCommand('text-analyze', {
  handler: (context) => {
    const text = context.args.join(' ')
    if (!text) {
      return { output: '用法: text-analyze <文本内容>\n\n示例:\n  text-analyze Hello World\n  text-analyze "这是一段测试文本"' }
    }

    const words = text.trim().split(/\s+/)
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || []
    const totalWords = chineseChars.length > 0 ? chineseChars.length : words.filter(w => w.length > 0).length
    const charCount = text.length
    const sentences = text.split(/[。.!?！？]+/).filter(s => s.trim().length > 0)
    const readingTime = chineseChars.length > 0
      ? Math.ceil(charCount / 300)
      : Math.ceil(totalWords / 200)

    const wordFreq: Record<string, number> = {}
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1 })

    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w, c]) => `  ${w}: ${c}次`)
      .join('\n')

    const avgSentenceLen = totalWords / Math.max(sentences.length, 1)
    let readability = '中等'
    if (avgSentenceLen < 15) readability = '简单'
    else if (avgSentenceLen > 30) readability = '较难'

    return {
      output: [
        '📊 文本分析报告',
        '===============',
        `总字数: ${totalWords}`,
        `字符数: ${charCount}`,
        `句子数: ${sentences.length}`,
        `平均句长: ${avgSentenceLen.toFixed(1)} 字`,
        `阅读时间: ${readingTime} 分钟`,
        `可读性: ${readability}`,
        '',
        '高频词汇 TOP 5:',
        topWords || '  (无)',
      ].join('\n')
    }
  },
  description: '分析文本统计信息：字数、可读性、关键词提取',
  usage: 'text-analyze <文本>',
  examples: [
    'text-analyze Hello World',
    'text-analyze "This is a test paragraph with several sentences. It contains enough text to analyze."',
  ]
})

// color - 颜色转换工具
registerCommand('color', {
  handler: (context) => {
    const input = context.args[0]
    if (!input) {
      return { output: '用法: color <颜色值>\n\n支持格式:\n  HEX: #FF6B6B 或 FF6B6B\n  RGB: rgb(255, 107, 107)\n  名称: red, blue, coral\n\n示例:\n  color #FF6B6B\n  color rgb(255, 107, 107)\n  color coral' }
    }

    const namedColors: Record<string, string> = {
      red: '#FF0000', green: '#00FF00', blue: '#0000FF',
      white: '#FFFFFF', black: '#000000', yellow: '#FFFF00',
      cyan: '#00FFFF', magenta: '#FF00FF', gray: '#808080',
      coral: '#FF6B6B', ocean: '#0077B6', sunset: '#FB8500',
    }

    let r = 0, g = 0, b = 0
    let inputHex = input.trim().replace('#', '')

    if (input.toLowerCase() in namedColors) {
      inputHex = namedColors[input.toLowerCase()].replace('#', '')
    } else if (input.startsWith('rgb(')) {
      const match = input.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (match) {
        r = parseInt(match[1])
        g = parseInt(match[2])
        b = parseInt(match[3])
        inputHex = `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      }
    } else if (/^[0-9a-fA-F]{6}$/.test(inputHex)) {
      r = parseInt(inputHex.slice(0, 2), 16)
      g = parseInt(inputHex.slice(2, 4), 16)
      b = parseInt(inputHex.slice(4, 6), 16)
    } else {
      return { output: `无法解析的颜色格式: ${input}` }
    }

    const toHsl = (r: number, g: number, b: number) => {
      const rn = r / 255, gn = g / 255, bn = b / 255
      const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
      let h = 0, s = 0
      const l = (max + min) / 2
      if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break
          case gn: h = (bn - rn) / d + 2; break
          case bn: h = (rn - gn) / d + 4; break
        }
        h /= 6
      }
      return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
    }

    const hsl = toHsl(r, g, b)

    return {
      output: [
        '🎨 颜色转换',
        '==========',
        `HEX: #${inputHex.toUpperCase()}`,
        `RGB: rgb(${r}, ${g}, ${b})`,
        `HSL: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
        '',
        'CSS 变量:',
        `  --color: #${inputHex.toUpperCase()};`,
        `  --color-rgb: ${r}, ${g}, ${b};`,
        '',
        '预览:',
        `  ████████████████████  #${inputHex.toUpperCase()}`,
      ].join('\n')
    }
  },
  description: '颜色格式转换：HEX/RGB/HSL互转',
  usage: 'color <颜色值>',
  examples: [
    'color #FF6B6B',
    'color rgb(255, 107, 107)',
    'color coral',
  ]
})

// json-validate - JSON验证和格式化
registerCommand('json-validate', {
  handler: (context) => {
    const input = context.args.join(' ')
    if (!input) {
      return { output: '用法: json-validate <JSON字符串>\n\n示例:\n  json-validate {"name": "WebLinuxOS", "version": 91}\n  json-validate \'{"items": [1, 2, 3]}\'' }
    }

    try {
      const parsed = JSON.parse(input)
      const formatted = JSON.stringify(parsed, null, 2)
      const size = new Blob([formatted]).size
      const minified = JSON.stringify(parsed)
      const minSize = new Blob([minified]).size

      return {
        output: [
          '✅ JSON 验证通过',
          '==============',
          `类型: ${Array.isArray(parsed) ? '数组' : typeof parsed}`,
          `大小: ${size} 字节 (格式化) / ${minSize} 字节 (压缩)`,
          `压缩率: ${Math.round((1 - minSize / size) * 100)}%`,
          '',
          '格式化输出:',
          formatted,
        ].join('\n')
      }
    } catch (e) {
      const err = e as Error
      return {
        output: [
          '❌ JSON 验证失败',
          '==============',
          `错误: ${err.message}`,
          '',
          '提示: 请检查引号、逗号和括号是否正确配对',
        ].join('\n')
      }
    }
  },
  description: '验证和格式化JSON字符串',
  usage: 'json-validate <JSON>',
  examples: [
    'json-validate {"name": "test", "version": 1}',
  ]
})

// speedtest - 网络速度测试（使用免费API）
registerCommand('speedtest', {
  handler: async () => {
    const results: string[] = ['🌐 网络速度测试', '================']

    // Test 1: Latency
    const startLatency = Date.now()
    try {
      await fetch('https://api.github.com', { method: 'HEAD', mode: 'no-cors' })
      results.push(`延迟: ${Date.now() - startLatency}ms`)
    } catch {
      results.push('延迟: 测试失败')
    }

    // Test 2: Download speed (small file)
    const startDownload = Date.now()
    try {
      const response = await fetch('https://api.github.com/repos/saya-ch/WebLinuxOS')
      const text = await response.text()
      const duration = (Date.now() - startDownload) / 1000
      const sizeKB = new Blob([text]).size / 1024
      const speed = sizeKB / duration
      results.push(`下载速度: ${speed.toFixed(2)} KB/s (${sizeKB.toFixed(1)}KB in ${duration.toFixed(2)}s)`)
    } catch {
      results.push('下载速度: 测试失败')
    }

    // Test 3: API availability
    const apis = [
      { name: 'GitHub API', url: 'https://api.github.com' },
      { name: 'Open-Meteo', url: 'https://api.open-meteo.com' },
      { name: 'CoinGecko', url: 'https://api.coingecko.com' },
      { name: 'Wikipedia', url: 'https://en.wikipedia.org' },
      { name: 'ipapi', url: 'https://ipapi.co/json/' },
    ]

    results.push('')
    results.push('API 可达性检测:')
    for (const api of apis) {
      const start = Date.now()
      try {
        await fetch(api.url, { method: 'HEAD', mode: 'no-cors' })
        results.push(`  ${api.name}: ✅ (${Date.now() - start}ms)`)
      } catch {
        results.push(`  ${api.name}: ❌`)
      }
    }

    return { output: results.join('\n') }
  },
  description: '网络速度测试和API可达性检测',
  usage: 'speedtest',
  examples: ['speedtest']
})

// hash-types - 哈希类型识别
registerCommand('hash-types', {
  handler: (context) => {
    const hash = context.args[0]
    if (!hash) {
      return { output: '用法: hash-types <哈希值>\n\n示例:\n  hash-types 5d41402abc4b2a76b9719d911017c592\n  hash-types e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }
    }

    const types: string[] = []
    const len = hash.length

    if (/^[0-9a-fA-F]+$/.test(hash)) {
      if (len === 32) types.push('MD5')
      if (len === 40) types.push('SHA-1', 'HMAC-SHA1')
      if (len === 56) types.push('SHA-224')
      if (len === 64) types.push('SHA-256')
      if (len === 96) types.push('SHA-384')
      if (len === 128) types.push('SHA-512', 'SHA-512-256')
    }

    return {
      output: [
        '🔍 哈希类型识别',
        '==============',
        `哈希值: ${hash}`,
        `长度: ${len} 字符`,
        `十六进制: ${/^[0-9a-fA-F]+$/.test(hash) ? '是' : '否'}`,
        '',
        '可能的类型:',
        types.length > 0 ? types.map(t => `  • ${t}`).join('\n') : '  无法识别',
      ].join('\n')
    }
  },
  description: '根据哈希值长度识别可能的哈希类型',
  usage: 'hash-types <哈希值>',
  examples: [
    'hash-types 5d41402abc4b2a76b9719d911017c592',
    'hash-types e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  ]
})

// crypto-info - 加密货币信息（实时数据）
registerCommand('crypto-info', {
  handler: async (context) => {
    const coin = (context.args[0] || 'bitcoin').toLowerCase()
    const currency = (context.args[1] || 'usd').toLowerCase()

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=${currency}&include_24hr_change=true&include_market_cap=true`
      )
      if (!response.ok) {
        return { output: `API错误: HTTP ${response.status}` }
      }

      const data = await response.json()
      const coinData = data[coin]

      if (!coinData) {
        return {
          output: [
            `未找到加密货币: ${coin}`,
            '',
            '支持的加密货币 (ID):',
            '  bitcoin, ethereum, binancecoin, solana, ripple,',
            '  cardano, dogecoin, polkadot, chainlink, polygon,',
            '  avalanche-2, litecoin, tether, usd-coin, cosmos',
          ].join('\n')
        }
      }

      return {
        output: [
          `💰 ${coin.toUpperCase()} 实时行情`,
          '=========================',
          `价格: ${coinData[currency] ? coinData[currency].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'} ${currency.toUpperCase()}`,
          `24h变动: ${coinData[`${currency}_24h_change`] ? coinData[`${currency}_24h_change`].toFixed(2) + '%' : 'N/A'}`,
          `市值: ${coinData[`${currency}_market_cap`] ? '$' + (coinData[`${currency}_market_cap`] / 1e9).toFixed(2) + 'B' : 'N/A'}`,
          '',
          `数据来源: CoinGecko API`,
          `时间: ${new Date().toLocaleString()}`,
        ].join('\n')
      }
    } catch (err) {
      return { output: `错误: ${err instanceof Error ? err.message : '请求失败'}` }
    }
  },
  description: '查询加密货币实时行情（CoinGecko API）',
  usage: 'crypto-info <coin_id> [currency]',
  examples: [
    'crypto-info bitcoin',
    'crypto-info ethereum usd',
    'crypto-info dogecoin',
  ]
})
