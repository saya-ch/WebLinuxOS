import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

function getTimeInfo(): string {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false })
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
  const timestamp = Math.floor(now.getTime() / 1000)

  return `现在时间: ${timeStr}
日期: ${dateStr}
Unix 时间戳: ${timestamp}
时区: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
`
}

registerCommand('workbench', {
  handler: (): CommandResult => {
    const output = `
╔══════════════════════════════════════════════════════════════╗
║                   🚀 智能工作台 Quick Start                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  打开智能工作台:  在启动器搜索 "智能工作台" 或点击桌面图标    ║
║                                                              ║
║  功能概览:                                                   ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │  快捷工具区    8个常用应用一键直达                        │  ║
║  │  系统状态      CPU/内存/网络/存储实时监控                │  ║
║  │  专注计时器    番茄工作法，提升效率                      │  ║
║  │  分类导航      6大分类，36+精选应用                      │  ║
║  │  全局搜索      快速定位应用、命令、文件                  │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
║  快捷键:                                                     ║
║    Ctrl+K  全局搜索                                          ║
║    Ctrl+P  命令面板                                          ║
║    Ctrl+A  快捷操作中心                                      ║
║    Ctrl+T  打开终端                                          ║
║    Ctrl+E  打开文件管理器                                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

提示: 输入 "help" 查看所有命令，输入 "apps" 浏览应用列表
`
    return { output }
  },
  description: '显示智能工作台使用指南',
  usage: 'workbench',
  examples: ['workbench'],
}, { source: 'workbenchCommands' })

registerCommand('now', {
  handler: (): CommandResult => {
    return { output: getTimeInfo() }
  },
  description: '显示当前时间、日期和时间戳',
  usage: 'now',
  examples: ['now'],
}, { source: 'workbenchCommands' })

registerCommand('focus', {
  handler: (ctx: CommandContext): CommandResult => {
    const minutes = ctx.args[0] ? parseInt(ctx.args[0]) : 25
    if (isNaN(minutes) || minutes <= 0 || minutes > 120) {
      return { output: `错误: 请输入 1-120 之间的分钟数\n用法: focus [分钟数]` }
    }

    const endTime = new Date(Date.now() + minutes * 60 * 1000)
    const endTimeStr = endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

    const output = `
🍅 专注模式已启动
━━━━━━━━━━━━━━━━━━━━━━━━━━
  专注时长: ${minutes} 分钟
  结束时间: ${endTimeStr}
━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 专注小技巧:
  • 关闭无关的浏览器标签页
  • 将手机调至静音
  • 准备好所需的资料
  • 深呼吸，开始工作

提示: 专注结束后可输入 "break" 休息一下
`
    return { output }
  },
  description: '启动专注计时器（番茄工作法）',
  usage: 'focus [分钟数]',
  examples: ['focus', 'focus 45', 'focus 60'],
}, { source: 'workbenchCommands' })

registerCommand('break', {
  handler: (ctx: CommandContext): CommandResult => {
    const minutes = ctx.args[0] ? parseInt(ctx.args[0]) : 5
    if (isNaN(minutes) || minutes <= 0 || minutes > 60) {
      return { output: `错误: 请输入 1-60 之间的分钟数\n用法: break [分钟数]` }
    }

    const tips = [
      '站起来活动一下身体',
      '喝杯水，补充水分',
      '看看远处，放松眼睛',
      '做几个深呼吸',
      '伸展一下肩膀和脖子',
      '听一首喜欢的歌',
    ]
    const tip = tips[Math.floor(Math.random() * tips.length)]

    const output = `
☕ 休息时间到！
━━━━━━━━━━━━━━━━━━━━━━━━━━
  休息时长: ${minutes} 分钟
  建议: ${tip}
━━━━━━━━━━━━━━━━━━━━━━━━━━

记住: 适当的休息能提高整体效率
`
    return { output }
  },
  description: '休息计时器',
  usage: 'break [分钟数]',
  examples: ['break', 'break 10'],
}, { source: 'workbenchCommands' })

registerCommand('motivate', {
  handler: (): CommandResult => {
    const quotes = [
      '"每一行代码都是通往未来的阶梯"',
      '"今天的努力，是明天的底气"',
      '"保持好奇心，世界因你而不同"',
      '"专注当下，未来可期"',
      '"代码改变世界，你改变代码"',
      '"每一次调试，都是成长的机会"',
      '"简单的事情重复做，重复的事情用心做"',
      '"优秀是一种习惯，不是一次行动"',
      '"种一棵树最好的时间是十年前，其次是现在"',
      '"你的潜力，远比你想象的更大"',
      '"慢慢来，比较快"',
      '"每一个不曾起舞的日子，都是对生命的辜负"',
    ]
    const quote = quotes[Math.floor(Math.random() * quotes.length)]

    const output = `
✨ 今日激励
━━━━━━━━━━━━━━━━━━━━━━━━━━

  ${quote}

━━━━━━━━━━━━━━━━━━━━━━━━━━
  继续加油！你做得很棒 💪
`
    return { output }
  },
  description: '显示一句励志名言',
  usage: 'motivate',
  examples: ['motivate'],
}, { source: 'workbenchCommands' })

registerCommand('sysinfo', {
  handler: (): CommandResult => {
    const nav = navigator
    const perf = performance
    const memory = (perf as any).memory

    const cpuCores = nav.hardwareConcurrency || '未知'
    const platform = nav.platform || '未知'
    const language = nav.language
    const online = nav.onLine ? '在线 ✓' : '离线 ✗'
    const userAgent = nav.userAgent.split(' ').slice(-2).join(' ')

    let memoryInfo = '不可用'
    if (memory) {
      const used = (memory.usedJSHeapSize / 1024 / 1024).toFixed(1)
      const total = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1)
      memoryInfo = `${used} MB / ${total} MB`
    }

    const screenW = window.screen.width
    const screenH = window.screen.height
    const colorDepth = window.screen.colorDepth

    const output = `
🖥️  系统信息
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  浏览器:        ${userAgent}
  平台:          ${platform}
  CPU 核心数:    ${cpuCores}
  语言:          ${language}
  网络状态:      ${online}
  内存使用:      ${memoryInfo}
  屏幕分辨率:    ${screenW} x ${screenH}
  颜色深度:      ${colorDepth} bit
  WebGL 支持:    ${typeof WebGLRenderingContext !== 'undefined' ? '是 ✓' : '否 ✗'}
  Service Worker:${'serviceWorker' in navigator ? '支持 ✓' : '不支持 ✗'}
  本地存储:      ${typeof Storage !== 'undefined' ? '可用 ✓' : '不可用 ✗'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
    return { output }
  },
  description: '显示详细的系统和浏览器信息',
  usage: 'sysinfo',
  examples: ['sysinfo'],
}, { source: 'workbenchCommands' })

registerCommand('infopulse', {
  handler: (): CommandResult => {
    const output = `
╔══════════════════════════════════════════════════════════════╗
║                ⚡ InfoPulse 信息脉搏中心                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  打开方式:  在启动器搜索 "InfoPulse" 或 "信息脉搏"            ║
║                                                              ║
║  功能模块:                                                   ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │  系统健康度    评分环+CPU/内存/存储/网络状态             │  ║
║  │  技术动态      实时技术新闻聚合                          │  ║
║  │  天气状况      温度/湿度/空气质量指数                    │  ║
║  │  世界时钟      6个主要城市实时时间                       │  ║
║  │  GitHub热门     趋势仓库追踪                             │  ║
║  │  加密货币      BTC/ETH/SOL实时行情                       │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
║  特性:                                                       ║
║    • 卡片化布局，响应式设计                                  ║
║    • 自动刷新（每分钟）+ 手动刷新                            ║
║    • 玻璃拟态 + 赛博朋克美学                                 ║
║    • 个性化配置，可启用/禁用卡片                             ║
║                                                              ║
║  快捷键: Ctrl+Shift+I  快速打开                              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

提示: 输入 "help" 查看所有命令
`
    return { output }
  },
  description: '显示 InfoPulse 信息脉搏中心使用指南',
  usage: 'infopulse',
  examples: ['infopulse'],
}, { source: 'workbenchCommands' })

registerCommand('studio', {
  handler: (): CommandResult => {
    const output = `
╔══════════════════════════════════════════════════════════════╗
║              ✨ Studio Suite 创意工作室                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  设计师与前端开发者的一站式创意工具箱                        ║
║                                                              ║
║  六大模块:                                                   ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │  🎨 调色板生成   从基础色生成 11 级色阶 + 4 种配色方案   │  ║
║  │  🌈 渐变编辑器   线性/径向渐变，多色节点，角度调节       │  ║
║  │  🌓 阴影生成器   多层阴影，柔/硬阴影，实时预览            │  ║
║  │  🔤 字体预览     8 款精选字体，中英文对照展示            │  ║
║  │  ◐  对比度检查   WCAG 2.1 标准，AA/AAA 可访问性          │  ║
║  │  📐 单位转换     px / rem / em / vw / % 互换             │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
║  打开方式:  在启动器搜索 "Studio Suite" 或 "创意工作室"      ║
║                                                              ║
║  特性:                                                       ║
║    • 一键复制 CSS 代码                                       ║
║    • 实时预览，所见即所得                                    ║
║    • 深色主题，护眼设计                                      ║
║    • 无需联网，纯本地计算                                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

提示: 输入 "help" 查看所有命令，输入 "apps" 浏览应用列表
`
    return { output }
  },
  description: '显示 Studio Suite 创意工作室使用指南',
  usage: 'studio',
  examples: ['studio'],
}, { source: 'workbenchCommands' })

registerCommand('color', {
  handler: (ctx: CommandContext): CommandResult => {
    const hex = ctx.args[0]
    if (!hex) {
      return {
        output: `用法: color <hex颜色值>

示例:
  color #7c6cf0
  color ff6b6b

功能: 显示颜色的 HSL、RGB 信息，并生成配色建议`
      }
    }

    let cleanHex = hex.startsWith('#') ? hex.slice(1) : hex
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('')
    }
    if (!/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
      return { output: `错误: "${hex}" 不是有效的 HEX 颜色值` }
    }
    cleanHex = '#' + cleanHex.toLowerCase()

    const r = parseInt(cleanHex.slice(1, 3), 16)
    const g = parseInt(cleanHex.slice(3, 5), 16)
    const b = parseInt(cleanHex.slice(5, 7), 16)

    const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255
    const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm)
    let h = 0, s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break
        case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break
        case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break
      }
    }

    const output = `
颜色信息: ${cleanHex.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  HEX:   ${cleanHex.toUpperCase()}
  RGB:   rgb(${r}, ${g}, ${b})
  HSL:   hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)

配色建议:
  邻近色:  ${shiftHue(cleanHex, -30)}  ${cleanHex}  ${shiftHue(cleanHex, 30)}
  互补色:  ${cleanHex}  ${shiftHue(cleanHex, 180)}
  三元色:  ${cleanHex}  ${shiftHue(cleanHex, 120)}  ${shiftHue(cleanHex, 240)}

提示: 打开 "Studio Suite" 获取完整的调色板功能
`
    return { output }
  },
  description: '分析颜色并生成配色建议',
  usage: 'color <hex>',
  examples: ['color #7c6cf0', 'color ff6b6b'],
}, { source: 'workbenchCommands', force: true })

function shiftHue(hex: string, degrees: number): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  h = ((h * 360 + degrees) % 360 + 360) % 360 / 360

  let r2: number, g2: number, b2: number
  if (s === 0) {
    r2 = g2 = b2 = l
  } else {
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
    r2 = hue2rgb(p, q, h + 1/3)
    g2 = hue2rgb(p, q, h)
    b2 = hue2rgb(p, q, h - 1/3)
  }
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0')
  return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`
}

registerCommand('wiki', {
  handler: (ctx: CommandContext): CommandResult => {
    const query = ctx.args.join(' ')
    if (!query) {
      return {
        output: `
WikiExplorer 维基探索
━━━━━━━━━━━━━━━━━━━━━━━━━━
  基于 Wikipedia API 的交互式百科探索工具

  功能:
    - 搜索维基百科文章
    - 阅读文章摘要
    - 随机发现知识
    - 中英双语支持
    - 阅读历史与收藏

  用法:
    wiki <关键词>    在 Wikipedia 搜索并打开应用
    wiki             打开 WikiExplorer 应用

  示例:
    wiki artificial intelligence
    wiki 人工智能
`
      }
    }
    ctx.openApp?.('wiki-explorer')
    return { output: `正在打开 WikiExplorer，搜索 "${query}"...` }
  },
  description: '打开 WikiExplorer 维基百科探索工具',
  usage: 'wiki [关键词]',
  examples: ['wiki', 'wiki React', 'wiki 量子计算'],
}, { source: 'workbenchCommands' })

registerCommand('geo', {
  handler: (ctx: CommandContext): CommandResult => {
    const query = ctx.args.join(' ')
    if (!query) {
      return {
        output: `
GeoAtlas 地理图鉴
━━━━━━━━━━━━━━━━━━━━━━━━━━
  基于 REST Countries API 的交互式地理探索工具

  功能:
    - 浏览全球 250+ 国家和地区
    - 国家详情（国旗/首都/人口/面积/语言/货币）
    - 2-3 国对比模式
    - 地理测验
    - 区域统计
    - 收藏与地图预览

  用法:
    geo <国家名>    打开 GeoAtlas 搜索国家
    geo             打开 GeoAtlas 应用

  示例:
    geo Japan
    geo 中国
`
      }
    }
    ctx.openApp?.('geo-atlas')
    return { output: `正在打开 GeoAtlas，查找 "${query}"...` }
  },
  description: '打开 GeoAtlas 地理图鉴',
  usage: 'geo [国家名]',
  examples: ['geo', 'geo France', 'geo 巴西'],
}, { source: 'workbenchCommands' })

registerCommand('snippets', {
  handler: (ctx: CommandContext): CommandResult => {
    const query = ctx.args.join(' ')
    if (!query) {
      return {
        output: `
SnippetVault 代码片段保险库
━━━━━━━━━━━━━━━━━━━━━━━━━━
  开发者代码片段管理与模板库

  功能:
    - 代码片段 CRUD
    - 智能搜索（标题/描述/代码/标签）
    - 语言筛选 + 标签系统
    - 语法高亮
    - 导入/导出 JSON
    - 一键复制
    - 16 个内置模板

  用法:
    snippets <关键词>  打开 SnippetVault 搜索
    snippets           打开 SnippetVault 应用

  示例:
    snippets react hooks
    snippets python decorator
`
      }
    }
    ctx.openApp?.('snippet-vault')
    return { output: `正在打开 SnippetVault，搜索 "${query}"...` }
  },
  description: '打开 SnippetVault 代码片段保险库',
  usage: 'snippets [关键词]',
  examples: ['snippets', 'snippets react hooks'],
}, { source: 'workbenchCommands' })

registerCommand('recipe', {
  handler: (ctx: CommandContext): CommandResult => {
    const query = ctx.args.join(' ')
    if (!query) {
      return {
        output: `
RecipeLab 食谱实验室
━━━━━━━━━━━━━━━━━━━━━━━━━━
  基于 TheMealDB API 的美食发现工具

  功能:
    - 搜索全球食谱
    - 分类浏览
    - 随机发现美食
    - 食材筛选
    - 每周膳食计划
    - 购物清单
    - 收藏夹

  用法:
    recipe <菜名>    搜索食谱
    recipe           打开 RecipeLab 应用

  示例:
    recipe pasta
    recipe chicken
`
      }
    }
    ctx.openApp?.('recipe-lab')
    return { output: `正在打开 RecipeLab，搜索 "${query}"...` }
  },
  description: '打开 RecipeLab 食谱实验室',
  usage: 'recipe [菜名]',
  examples: ['recipe', 'recipe pasta', 'recipe salad'],
}, { source: 'workbenchCommands' })

registerCommand('qr', {
  handler: (ctx: CommandContext): CommandResult => {
    const text = ctx.args.join(' ')
    if (!text) {
      return {
        output: `用法: qr <文本>
生成二维码

示例:
  qr https://github.com
  qr Hello World

提示: 也可使用 "qrgen" 命令打开完整的二维码生成器应用`
      }
    }
    ctx.openApp?.('qr-generator')
    return { output: `正在打开二维码生成器...` }
  },
  description: '生成二维码',
  usage: 'qr <文本>',
  examples: ['qr https://example.com', 'qr Hello'],
}, { source: 'workbenchCommands' })

registerCommand('cve', {
  handler: (ctx: CommandContext): CommandResult => {
    const id = ctx.args[0]
    if (!id) {
      return {
        output: `用法: cve <CVE编号>
查询 CVE 漏洞信息（基于 NVD 公开 API）

示例:
  cve CVE-2024-3094
  cve CVE-2023-44487

提示: 此命令需要网络连接`
      }
    }

    const cveId = id.toUpperCase().startsWith('CVE-') ? id.toUpperCase() : `CVE-${id}`
    return {
      output: `正在查询 ${cveId}...

可访问以下链接查看详情:
  https://nvd.nist.gov/vuln/detail/${cveId}
  https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cveId}

提示: 在浏览器中打开 WebBrowser 应用访问上述链接`
    }
  },
  description: '查询 CVE 安全漏洞信息',
  usage: 'cve <CVE编号>',
  examples: ['cve CVE-2024-3094', 'cve 2023-44487'],
}, { source: 'workbenchCommands' })

registerCommand('localfiles', {
  handler: (ctx: CommandContext): CommandResult => {
    ctx.openApp?.('local-file-explorer')
    return { output: '正在打开 LocalFileExplorer 本地文件浏览器...' }
  },
  description: '打开 LocalFileExplorer 本地文件浏览器',
  usage: 'localfiles',
  examples: ['localfiles'],
}, { source: 'workbenchCommands' })

registerCommand('lfiles', {
  handler: (ctx: CommandContext): CommandResult => {
    ctx.openApp?.('local-file-explorer')
    return { output: '正在打开 LocalFileExplorer 本地文件浏览器...' }
  },
  description: '打开 LocalFileExplorer 本地文件浏览器（别名）',
  usage: 'lfiles',
  examples: ['lfiles'],
}, { source: 'workbenchCommands' })

registerCommand('wasm', {
  handler: (ctx: CommandContext): CommandResult => {
    ctx.openApp?.('wasm-playground')
    return { output: '正在打开 WasmPlayground WASM实验场...' }
  },
  description: '打开 WasmPlayground WASM实验场',
  usage: 'wasm',
  examples: ['wasm'],
}, { source: 'workbenchCommands' })

registerCommand('regexgolf', {
  handler: (ctx: CommandContext): CommandResult => {
    ctx.openApp?.('regex-golf')
    return { output: '正在打开 RegexGolf 正则挑战...' }
  },
  description: '打开 RegexGolf 正则挑战',
  usage: 'regexgolf',
  examples: ['regexgolf'],
}, { source: 'workbenchCommands' })

registerCommand('rgolf', {
  handler: (ctx: CommandContext): CommandResult => {
    ctx.openApp?.('regex-golf')
    return { output: '正在打开 RegexGolf 正则挑战...' }
  },
  description: '打开 RegexGolf 正则挑战（别名）',
  usage: 'rgolf',
  examples: ['rgolf'],
}, { source: 'workbenchCommands' })


