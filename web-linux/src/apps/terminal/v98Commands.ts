import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

// === v98 新功能命令集 ===

const APP_CATALOG: Array<{ id: string; name: string; category: string; description: string }> = [
  { id: 'file-manager', name: '文件管理器', category: 'system', description: '浏览和管理文件系统' },
  { id: 'terminal', name: '终端', category: 'system', description: 'Linux 风格命令行终端' },
  { id: 'settings', name: '设置', category: 'system', description: '系统偏好与配置' },
  { id: 'calculator', name: '计算器', category: 'utilities', description: '科学计算器' },
  { id: 'text-editor', name: '文本编辑器', category: 'utilities', description: '轻量级代码/文本编辑器' },
  { id: 'image-viewer', name: '图片查看器', category: 'utilities', description: '浏览和查看图片' },
  { id: 'weather', name: '天气', category: 'utilities', description: '实时天气信息' },
  { id: 'clock', name: '时钟', category: 'utilities', description: '世界时钟与计时器' },
  { id: 'browser', name: '浏览器', category: 'internet', description: '内置网页浏览器' },
  { id: 'mail', name: '邮件', category: 'internet', description: '电子邮件客户端' },
  { id: 'chat', name: '聊天', category: 'internet', description: '即时通讯工具' },
  { id: 'code', name: '代码编辑器', category: 'development', description: '专业代码开发环境' },
  { id: 'git', name: 'Git 终端', category: 'development', description: '版本控制工具' },
  { id: 'devtools', name: '开发者工具', category: 'development', description: 'Web 调试与分析' },
  { id: 'music', name: '音乐播放器', category: 'multimedia', description: '播放本地与在线音乐' },
  { id: 'video', name: '视频播放器', category: 'multimedia', description: '播放视频文件' },
  { id: 'paint', name: '画图', category: 'multimedia', description: '简单的图像绘制工具' },
  { id: ' Minesweeper', name: '扫雷', category: 'games', description: '经典扫雷游戏' },
  { id: 'snake', name: '贪吃蛇', category: 'games', description: '经典贪吃蛇游戏' },
  { id: 'tetris', name: '俄罗斯方块', category: 'games', description: '经典俄罗斯方块' },
  { id: 'chess', name: '国际象棋', category: 'games', description: '国际象棋对弈' },
  { id: 'ai-assistant', name: 'AI 助手', category: 'ai', description: '智能对话助手' },
  { id: 'ai-image', name: 'AI 绘画', category: 'ai', description: 'AI 图像生成' },
  { id: 'ai-code', name: 'AI 编程', category: 'ai', description: 'AI 辅助编程' },
  { id: 'ai-translate', name: 'AI 翻译', category: 'ai', description: '智能多语言翻译' },
]

const CATEGORY_NAMES: Record<string, string> = {
  system: '系统',
  internet: '网络',
  utilities: '实用工具',
  development: '开发',
  multimedia: '多媒体',
  games: '游戏',
  ai: '人工智能',
}

const MOTIVATIONAL_QUOTES = [
  '代码千行始于一字，程序万象起于一念。',
  '每一个 bug 都是通往优秀程序员的阶梯。',
  '简洁是智慧的灵魂，冗余是平庸的外衣。',
  '最好的程序员不是写最多代码的人，而是删最多代码的人。',
  '当你想放弃时，想想当初为什么开始。',
  '编程不仅是技术，更是一种艺术。',
  '先让它工作，再让它正确，最后让它优雅。',
  '一个好的抽象胜过千言万语。',
  '程序如诗，简洁为美；代码如画，清晰为魂。',
  '不怕慢，只怕站；每天进步一点点。',
  '今天的努力，是明天的实力。',
  '没有糟糕的代码，只有还没重构的代码。',
  '编译通过只是开始，运行正确才是目标。',
  '思考胜于编码，设计胜于实现。',
  '优秀的工程师写代码解决问题，伟大的工程师写代码创造可能。',
  '键盘即武器，屏幕即战场；代码是诗，程序是歌。',
  '在 bug 的世界里，每一次修复都是一次进化。',
  '保持好奇，保持热爱，保持编码。',
  '代码的优雅源自思考的深度。',
  '每一行代码背后，都有一个值得讲述的故事。',
]

const ASCII_ART_PATTERNS: Record<string, string[]> = {
  hello: [
    ' _   _      _ _        __        __         _     _ ',
    '| | | | ___| | | ___   \\ \\      / /__  _ __| | __| |',
    '| |_| |/ _ \\ | |/ _ \\   \\ \\ /\\ / / _ \\|  __| |/ _` |',
    '|  _  |  __/ | | (_) |   \\ V  V / (_) | |  | | (_| |',
    '|_| |_|\\___|_|_|\\___/     \\_/\\_/ \\___/|_|  |_|\\__,_|',
  ],
  welcome: [
    '██╗    ██╗███████╗██████╗ ██╗     ██████╗ ',
    '██║    ██║██╔════╝██╔══██╗██║     ██╔══██╗',
    '██║    ██║█████╗  ██████╔╝██║     ██║  ██║',
    '██║    ██║██╔══╝  ██╔══██╗██║     ██║  ██║',
    '╚██████╔╝███████╗██████╔╝███████╗██████╔╝',
    ' ╚═════╝ ╚══════╝╚═════╝ ╚══════╝╚═════╝ ',
  ],
  love: [
    '██╗  ██╗ ██████╗ ██╗  ██╗███████╗',
    '██║  ██║██╔═══██╗██║  ██║██╔════╝',
    '███████║██║   ██║███████║█████╗  ',
    '██╔══██║██║   ██║██╔══██║██╔══╝  ',
    '██║  ██║╚██████╔╝██║  ██║███████╗',
    '╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝',
  ],
  code: [
    '  ██████╗ ██████╗ ██████╗ ███████╗',
    ' ██╔════╝██╔═══██╗██╔══██╗██╔════╝',
    ' ██║     ██║   ██║██████╔╝█████╗  ',
    ' ██║     ██║   ██║██╔══██╗██╔══╝  ',
    ' ╚██████╗╚██████╔╝██║  ██║███████╗',
    '  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝',
  ],
  v98: [
    '██╗   ██╗ █████╗ ██████╗ ████████╗',
    '██║   ██║██╔══██╗██╔══██╗╚══██╔══╝',
    '██║   ██║███████║██████╔╝   ██║   ',
    '██║   ██║██╔══██║██╔══██╗   ██║   ',
    '╚██████╔╝██║  ██║██║  ██║   ██║   ',
    ' ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ',
  ],
}

const SHORTCUT_BINDINGS: Array<{ keys: string; action: string; context: string }> = [
  { keys: 'Ctrl + Alt + T', action: '打开终端', context: '全局' },
  { keys: 'Ctrl + Alt + D', action: '显示桌面', context: '全局' },
  { keys: 'Ctrl + Alt + S', action: '打开设置', context: '全局' },
  { keys: 'Ctrl + Alt + B', action: '打开浏览器', context: '全局' },
  { keys: 'Ctrl + Alt + E', action: '打开文件管理器', context: '全局' },
  { keys: 'Super + 点击', action: '强制关闭窗口', context: '窗口管理' },
  { keys: 'Ctrl + Tab', action: '切换窗口', context: '窗口管理' },
  { keys: 'Ctrl + Shift + ←/→', action: '调整窗口大小', context: '窗口管理' },
  { keys: 'Ctrl + Shift + T', action: '新建标签页', context: '应用内' },
  { keys: 'Ctrl + /', action: '显示命令面板', context: '应用内' },
  { keys: 'F11', action: '全屏切换', context: '应用内' },
  { keys: 'Ctrl + C', action: '复制', context: '编辑' },
  { keys: 'Ctrl + V', action: '粘贴', context: '编辑' },
  { keys: 'Ctrl + X', action: '剪切', context: '编辑' },
  { keys: 'Ctrl + Z', action: '撤销', context: '编辑' },
  { keys: 'Ctrl + Shift + Z', action: '重做', context: '编辑' },
  { keys: 'Ctrl + S', action: '保存', context: '编辑' },
  { keys: 'Ctrl + F', action: '查找', context: '编辑' },
]

// whatsnew - 显示 v98 更新日志
registerCommand('whatsnew', {
  handler: (_ctx: CommandContext): CommandResult => {
    const output = [
      '╔══════════════════════════════════════════════════╗',
      '║        WebLinuxOS v98 更新日志                    ║',
      '╠══════════════════════════════════════════════════╣',
      '║                                                  ║',
      '║  🆕 新增命令:                                    ║',
      '║    • whatsnew    - 查看版本更新日志               ║',
      '║    • apps        - 列出所有可用应用               ║',
      '║    • open        - 快速打开指定应用               ║',
      '║    • theme       - 从终端切换主题                 ║',
      '║    • shortcut    - 查看快捷键绑定                 ║',
      '║    • analytics   - 系统分析器摘要                 ║',
      '║    • ascii       - ASCII 艺术字生成               ║',
      '║    • motivate    - 随机激励语句                   ║',
      '║    • system-analytics - 详细系统分析              ║',
      '║    • version     - 增强版版本信息                 ║',
      '║                                                  ║',
      '║  🛠 改进:                                        ║',
      '║    • 终端命令系统优化                             ║',
      '║    • 应用分类体系完善                             ║',
      '║    • 主题切换支持 dark/light/auto                 ║',
      '║                                                  ║',
      '║  📊 数据:                                        ║',
      '║    • 25+ 应用程序支持                             ║',
      '║    • 7 大应用分类                                 ║',
      '║    • 18 项快捷键绑定                              ║',
      '║                                                  ║',
      '╚══════════════════════════════════════════════════╝',
      '',
      '提示: 输入 help 查看所有可用命令',
    ].join('\n')
    return { output }
  },
  description: '显示当前版本的更新日志（v98 新功能）',
  usage: 'whatsnew',
  examples: ['whatsnew'],
})

// apps - 列出可用应用
registerCommand('apps', {
  handler: (ctx: CommandContext): CommandResult => {
    const category = (ctx.args[0] || '').toLowerCase()

    if (category && !CATEGORY_NAMES[category]) {
      const validCategories = Object.keys(CATEGORY_NAMES).join(', ')
      return {
        output: [
          `❌ 未知的应用类别: ${category}`,
          '',
          `有效的类别: ${validCategories}`,
          '',
          '用法: apps [类别]',
          '示例: apps',
          '      apps system',
          '      apps ai',
        ].join('\n'),
      }
    }

    const filtered = category
      ? APP_CATALOG.filter(app => app.category === category)
      : APP_CATALOG

    const header = category
      ? `📱 应用列表 — ${CATEGORY_NAMES[category]} (${filtered.length} 个应用)`
      : `📱 全部应用列表 (${filtered.length} 个应用)`

    const grouped: Record<string, typeof APP_CATALOG> = {}
    for (const app of filtered) {
      if (!grouped[app.category]) grouped[app.category] = []
      grouped[app.category].push(app)
    }

    const lines: string[] = [header, '='.repeat(header.length), '']

    for (const [cat, apps] of Object.entries(grouped)) {
      lines.push(`【${CATEGORY_NAMES[cat] || cat}】`)
      for (const app of apps) {
        lines.push(`  ${app.id.padEnd(20)} ${app.description}`)
      }
      lines.push('')
    }

    lines.push(`共 ${filtered.length} 个应用`)
    lines.push('使用 "open <app-id>" 快速打开应用')

    return { output: lines.join('\n') }
  },
  description: '列出所有可用应用，支持按类别筛选',
  usage: 'apps [类别]',
  examples: ['apps', 'apps system', 'apps ai'],
})

// open - 快速打开应用
registerCommand('open', {
  handler: (ctx: CommandContext): CommandResult => {
    const appId = (ctx.args[0] || '').toLowerCase().trim()

    if (!appId) {
      return {
        output: [
          '❌ 请提供应用 ID',
          '',
          '用法: open <app-id>',
          '',
          '可用应用:',
          '  使用 "apps" 命令查看所有可用应用',
          '',
          '示例: open terminal',
          '      open browser',
          '      open ai-assistant',
        ].join('\n'),
      }
    }

    const app = APP_CATALOG.find(a => a.id === appId)
    if (!app) {
      return {
        output: [
          `❌ 未找到应用: ${appId}`,
          '',
          '使用 "apps" 命令查看所有可用应用',
        ].join('\n'),
      }
    }

    if (!ctx.openApp) {
      return {
        output: `❌ 应用打开功能不可用 (openApp 未初始化)`,
      }
    }

    try {
      ctx.openApp(app.id)
      return {
        output: [
          `✅ 正在打开: ${app.name}`,
          `   ID: ${app.id}`,
          `   类别: ${CATEGORY_NAMES[app.category] || app.category}`,
        ].join('\n'),
      }
    } catch (err) {
      return {
        output: `❌ 打开应用失败: ${err instanceof Error ? err.message : String(err)}`,
      }
    }
  },
  description: '通过命令快速打开指定应用',
  usage: 'open <app-id>',
  examples: ['open terminal', 'open browser', 'open ai-assistant'],
})

// theme - 切换主题
registerCommand('theme', {
  handler: (ctx: CommandContext): CommandResult => {
    const arg = (ctx.args[0] || '').toLowerCase().trim()

    if (!arg) {
      const themeNames: Record<string, string> = { dark: '深色', light: '浅色', auto: '自动' }
      return {
        output: [
          `🎨 当前主题: ${themeNames[ctx.theme] || ctx.theme}`,
          '',
          '用法: theme <dark|light|auto>',
          '',
          '示例: theme dark',
          '      theme light',
          '      theme auto',
        ].join('\n'),
      }
    }

    const validThemes = ['dark', 'light', 'auto'] as const
    type ThemeValue = (typeof validThemes)[number]

    if (!validThemes.includes(arg as ThemeValue)) {
      return {
        output: [
          `❌ 无效的主题: ${arg}`,
          '',
          '可选主题: dark (深色), light (浅色), auto (自动)',
          '',
          '用法: theme <dark|light|auto>',
        ].join('\n'),
      }
    }

    try {
      const root = document.documentElement
      const themeAttr = 'data-theme'

      if (arg === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.setAttribute(themeAttr, prefersDark ? 'dark' : 'light')
        root.classList.remove('theme-dark', 'theme-light')
        root.classList.add(prefersDark ? 'theme-dark' : 'theme-light')
      } else {
        root.setAttribute(themeAttr, arg)
        root.classList.remove('theme-dark', 'theme-light')
        root.classList.add(`theme-${arg}`)
      }

      const themeNames: Record<string, string> = { dark: '深色 🌙', light: '浅色 ☀️', auto: '自动 🎯' }
      return {
        output: [
          `✅ 主题已切换为: ${themeNames[arg]}`,
          '',
          '提示: 刷新页面后主题将保持不变',
        ].join('\n'),
      }
    } catch (err) {
      return {
        output: `❌ 主题切换失败: ${err instanceof Error ? err.message : String(err)}`,
      }
    }
  },
  description: '从终端切换主题 (dark/light/auto)',
  usage: 'theme <dark|light|auto>',
  examples: ['theme', 'theme dark', 'theme light', 'theme auto'],
})

// shortcut - 快捷键绑定
registerCommand('shortcut', {
  handler: (ctx: CommandContext): CommandResult => {
    const subCmd = (ctx.args[0] || '').toLowerCase().trim()

    if (subCmd !== 'list') {
      return {
        output: [
          '快捷键命令',
          '',
          '用法: shortcut list',
          '',
          '显示当前所有快捷键绑定',
        ].join('\n'),
      }
    }

    const grouped: Record<string, typeof SHORTCUT_BINDINGS> = {}
    for (const binding of SHORTCUT_BINDINGS) {
      if (!grouped[binding.context]) grouped[binding.context] = []
      grouped[binding.context].push(binding)
    }

    const lines: string[] = [
      '⌨️  快捷键绑定列表',
      '='.repeat(30),
      '',
    ]

    for (const [context, bindings] of Object.entries(grouped)) {
      lines.push(`【${context}】`)
      for (const b of bindings) {
        lines.push(`  ${b.keys.padEnd(22)} ${b.action}`)
      }
      lines.push('')
    }

    lines.push(`共 ${SHORTCUT_BINDINGS.length} 项快捷键绑定`)

    return { output: lines.join('\n') }
  },
  description: '显示当前所有快捷键绑定',
  usage: 'shortcut list',
  examples: ['shortcut list'],
})

// analytics - 系统分析器摘要
registerCommand('analytics', {
  handler: (ctx: CommandContext): CommandResult => {
    try {
      const nav = navigator
      const perf = performance as Performance & {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number }
      }
      const memory = perf.memory
      const uptime = Math.floor(performance.now() / 1000)
      const windowCount = window.length || 1

      const formatBytes = (bytes: number): string => {
        if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
        if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
        if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`
        return `${bytes} B`
      }

      const formatUptime = (seconds: number): string => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        if (h > 0) return `${h}小时 ${m}分 ${s}秒`
        if (m > 0) return `${m}分 ${s}秒`
        return `${s}秒`
      }

      const appCount = APP_CATALOG.length
      const categoryCount = Object.keys(CATEGORY_NAMES).length

      const memLines: string[] = []
      if (memory) {
        const usedPercent = ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1)
        const barLen = 20
        const filled = Math.round(barLen * memory.usedJSHeapSize / memory.jsHeapSizeLimit)
        const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled)
        memLines.push(`  内存使用: ${bar} ${usedPercent}%`)
        memLines.push(`  已用: ${formatBytes(memory.usedJSHeapSize)} / 限制: ${formatBytes(memory.jsHeapSizeLimit)}`)
      } else {
        memLines.push('  内存信息: 不可用 (需 HTTPS 或 localhost)')
      }

      const lines: string[] = [
        '📊 系统分析器摘要',
        '='.repeat(40),
        '',
        `⏱  运行时长: ${formatUptime(uptime)}`,
        `🖥  窗口数: ${windowCount}`,
        `📦  应用总数: ${appCount} (${categoryCount} 个类别)`,
        '',
        '── 系统资源 ──',
        `  CPU 核心: ${nav.hardwareConcurrency || '未知'}`,
        `  在线状态: ${nav.onLine ? '✅ 在线' : '⚠️ 离线'}`,
        `  语言: ${nav.language}`,
        `  时区: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
        '',
        '── 内存 ──',
        ...memLines,
        '',
        '── 会话 ──',
        `  用户: ${ctx.username}@${ctx.hostname}`,
        `  主题: ${ctx.theme}`,
        `  工作目录: ${ctx.cwd}`,
        '',
        `采集时间: ${new Date().toLocaleString('zh-CN')}`,
      ]

      return { output: lines.join('\n') }
    } catch (err) {
      return {
        output: `❌ 分析器错误: ${err instanceof Error ? err.message : String(err)}`,
      }
    }
  },
  description: '显示系统分析器摘要（运行时长、窗口数、应用统计）',
  usage: 'analytics',
  examples: ['analytics'],
})

// ascii - ASCII 艺术字
registerCommand('ascii', {
  handler: (ctx: CommandContext): CommandResult => {
    const text = ctx.args.join(' ').trim()

    if (!text) {
      const available = Object.keys(ASCII_ART_PATTERNS).join(', ')
      return {
        output: [
          '🎨 ASCII 艺术字生成器',
          '',
          '用法: ascii <文本>',
          '',
          '预定义模板:',
          `  ${available}`,
          '',
          '示例: ascii hello',
          '      ascii welcome',
          '      ascii love',
          '      ascii code',
          '      ascii v98',
          '',
          '自定义文本将使用简单字符映射生成',
        ].join('\n'),
      }
    }

    const lowerText = text.toLowerCase()
    if (ASCII_ART_PATTERNS[lowerText]) {
      const art = ASCII_ART_PATTERNS[lowerText]
      return { output: art.join('\n') }
    }

    const charMap: Record<string, string> = {
      a: '████', b: '███▒', c: '██▒▒', d: '███▒', e: '████',
      f: '████', g: '███▓', h: '████', i: '██', j: '██▓',
      k: '██ █', l: '██  ', m: '████', n: '████', o: '████',
      p: '████', q: '███▓', r: '████', s: '████', t: '████',
      u: '████', v: '████', w: '████', x: '████', y: '████',
      z: '████', ' ': '    ', '0': '████', '1': '██ ',
      '2': '████', '3': '████', '4': '█ ██', '5': '████',
      '6': '████', '7': '████', '8': '████', '9': '████',
    }

    const result: string[] = ['', `  🎨 ASCII 艺术: ${text}`, '  ' + '─'.repeat(40)]

    const lines = ['', '', '']
    for (const ch of lowerText) {
      const pattern = charMap[ch] || '▓▓▓▓'
      for (let i = 0; i < 3; i++) {
        lines[i] += pattern[i] !== undefined ? (pattern[i] === ' ' ? '  ' : pattern[i] + ' ') : '  '
      }
    }

    result.push(lines.map(l => '  ' + l).join('\n'))
    result.push('')

    return { output: result.join('\n') }
  },
  description: '将文本转为 ASCII 艺术字',
  usage: 'ascii <文本>',
  examples: ['ascii hello', 'ascii welcome', 'ascii v98'],
})

// motivate - 随机激励语句
registerCommand('motivate', {
  handler: (_ctx: CommandContext): CommandResult => {
    const idx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
    const quote = MOTIVATIONAL_QUOTES[idx]
    const asciiBox = [
      '╔══════════════════════════════════════════════════════╗',
      '║                                                      ║',
      `  ${quote}`,
      '║                                                      ║',
      '╚══════════════════════════════════════════════════════╝',
    ].join('\n')

    return {
      output: [
        '',
        '✨ 每日一激励 ✨',
        '',
        asciiBox,
        '',
      ].join('\n'),
    }
  },
  description: '随机显示激励语句（内置中文激励语句集合）',
  usage: 'motivate',
  examples: ['motivate'],
})

// system-analytics - 详细系统分析
registerCommand('system-analytics', {
  handler: (ctx: CommandContext): CommandResult => {
    try {
      const nav = navigator
      const screen = window.screen
      const perf = performance as Performance & {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number }
      }
      const memory = perf.memory
      const uptime = Math.floor(performance.now() / 1000)

      const formatBytes = (bytes: number): string => {
        if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
        if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
        if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`
        return `${bytes} B`
      }

      const formatUptime = (seconds: number): string => {
        const days = Math.floor(seconds / 86400)
        const hours = Math.floor((seconds % 86400) / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        const parts: string[] = []
        if (days > 0) parts.push(`${days}天`)
        if (hours > 0) parts.push(`${hours}小时`)
        if (mins > 0) parts.push(`${mins}分`)
        parts.push(`${secs}秒`)
        return parts.join(' ')
      }

      const parseBrowser = (ua: string): string => {
        if (/Edg\/([\d.]+)/.test(ua)) return `Microsoft Edge ${RegExp.$1}`
        if (/OPR\/([\d.]+)/.test(ua)) return `Opera ${RegExp.$1}`
        if (/Firefox\/([\d.]+)/.test(ua)) return `Mozilla Firefox ${RegExp.$1}`
        if (/Chrome\/([\d.]+)/.test(ua)) return `Google Chrome ${RegExp.$1}`
        if (/Version\/([\d.]+).*Safari/.test(ua)) return `Safari ${RegExp.$1}`
        return '未知浏览器'
      }

      const parseOS = (ua: string): string => {
        if (/Windows NT ([\d.]+)/.test(ua)) return `Windows NT ${RegExp.$1}`
        if (/iPhone OS ([\d_]+)/.test(ua)) return `iOS ${RegExp.$1.replace(/_/g, '.')}`
        if (/Android ([\d.]+)/.test(ua)) return `Android ${RegExp.$1}`
        if (/Mac OS X ([\d_]+)/.test(ua)) return `macOS ${RegExp.$1.replace(/_/g, '.')}`
        if (/Linux/.test(ua)) return 'Linux'
        return '未知'
      }

      const browser = parseBrowser(nav.userAgent)
      const os = parseOS(nav.userAgent)
      const languages = nav.languages?.join(', ') || nav.language

      const lines: string[] = [
        '╔══════════════════════════════════════════════════════╗',
        '║          🔬 详细系统分析报告                          ║',
        '╠══════════════════════════════════════════════════════╣',
        '',
        '━━━━ 基本信息 ━━━━',
        `  系统:       WebLinuxOS v98`,
        `  内核:       6.15.0-web`,
        `  架构:       x86_64 (WebAssembly)`,
        `  运行时长:   ${formatUptime(uptime)}`,
        `  当前时间:   ${new Date().toLocaleString('zh-CN')}`,
        '',
        '━━━━ 浏览器 ━━━━',
        `  名称:       ${browser}`,
        `  操作系统:   ${os}`,
        `  平台:       ${nav.platform || '未知'}`,
        `  语言:       ${languages}`,
        `  Cookie:     ${nav.cookieEnabled ? '✅ 启用' : '❌ 禁用'}`,
        `  在线:       ${nav.onLine ? '✅ 在线' : '❌ 离线'}`,
        '',
        '━━━━ 硬件 ━━━━',
        `  CPU 核心:   ${nav.hardwareConcurrency || '未知'}`,
        `  屏幕:       ${screen.width} × ${screen.height}`,
        `  色深:       ${screen.colorDepth}-bit`,
        `  视口:       ${window.innerWidth} × ${window.innerHeight}`,
        `  像素比:     ${window.devicePixelRatio}`,
        '',
      ]

      if (memory) {
        const usedPercent = ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1)
        const barLen = 30
        const filled = Math.round(barLen * memory.usedJSHeapSize / memory.jsHeapSizeLimit)
        const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled)

        lines.push(
          '━━━━ 内存 (JS Heap) ━━━━',
          `  已用:       ${formatBytes(memory.usedJSHeapSize)}`,
          `  总量:       ${formatBytes(memory.totalJSHeapSize)}`,
          `  限制:       ${formatBytes(memory.jsHeapSizeLimit)}`,
          `  使用率:     ${bar} ${usedPercent}%`,
          '',
        )
      } else {
        lines.push(
          '━━━━ 内存 ━━━━',
          '  ⚠️  JS 堆信息不可用 (需 HTTPS 或 localhost)',
          '',
        )
      }

      lines.push(
        '━━━━ 网络 ━━━━',
        `  状态:       ${nav.onLine ? '✅ 已连接' : '❌ 已断开'}`,
        `  时区:       ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
        `  时区偏移:   ${-new Date().getTimezoneOffset() / 60 >= 0 ? '+' : ''}${-new Date().getTimezoneOffset() / 60}`,
        '',
        '━━━━ 会话 ━━━━',
        `  用户:       ${ctx.username}`,
        `  主机:       ${ctx.hostname}`,
        `  主题:       ${ctx.theme}`,
        `  工作目录:   ${ctx.cwd}`,
        '',
        '━━━━ 应用统计 ━━━━',
        `  应用总数:   ${APP_CATALOG.length}`,
        `  应用类别:   ${Object.keys(CATEGORY_NAMES).length}`,
      )

      for (const [key, name] of Object.entries(CATEGORY_NAMES)) {
        const count = APP_CATALOG.filter(a => a.category === key).length
        lines.push(`    ${name}: ${count} 个`)
      }

      lines.push(
        '',
        '━'.repeat(50),
        `报告生成: ${new Date().toLocaleString('zh-CN')}`,
      )

      return { output: lines.join('\n') }
    } catch (err) {
      return {
        output: `❌ 系统分析错误: ${err instanceof Error ? err.message : String(err)}`,
      }
    }
  },
  description: '显示详细系统分析信息',
  usage: 'system-analytics',
  examples: ['system-analytics'],
})

// version - 增强版版本信息 (覆盖原有实现)
registerCommand('version', {
  handler: (ctx: CommandContext): CommandResult => {
    const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'
    const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'unknown'
    const uptime = Math.floor(performance.now() / 1000)

    const formatUptime = (seconds: number): string => {
      const days = Math.floor(seconds / 86400)
      const hours = Math.floor((seconds % 86400) / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      const parts: string[] = []
      if (days > 0) parts.push(`${days}天`)
      if (hours > 0) parts.push(`${hours}小时`)
      if (mins > 0) parts.push(`${mins}分`)
      parts.push(`${secs}秒`)
      return parts.join(' ')
    }

    const lines: string[] = [
      '╔══════════════════════════════════════════════════════╗',
      '║          WebLinuxOS 版本信息                          ║',
      '╠══════════════════════════════════════════════════════╣',
      '',
      '  ┌─ 版本 ─────────────────────────────────────────┐',
      `  │  版本号:     ${version}`,
      `  │  内核:       6.15.0-web`,
      `  │  架构:       x86_64`,
      `  │  平台:       WebAssembly`,
      `  │  构建日期:   ${buildTime}`,
      '  └────────────────────────────────────────────────┘',
      '',
      '  ┌─ 运行状态 ─────────────────────────────────────┐',
      `  │  运行时长:   ${formatUptime(uptime)}`,
      `  │  当前时间:   ${new Date().toLocaleString('zh-CN')}`,
      `  │  用户:       ${ctx.username}@${ctx.hostname}`,
      `  │  主题:       ${ctx.theme}`,
      '  └────────────────────────────────────────────────┘',
      '',
      '  ┌─ 功能特性 ─────────────────────────────────────┐',
      '  │  🆕 v98: 新命令集 (whatsnew/apps/open/theme...)',
      '  │  🆕 v98: 应用分类体系 (7 大类别)',
      '  │  🆕 v98: 增强版版本/分析命令',
      '  └────────────────────────────────────────────────┘',
      '',
      '  更多信息: https://github.com/saya-ch/WebLinuxOS',
      '',
    ]

    return { output: lines.join('\n') }
  },
  description: '显示版本号、构建日期、运行时长',
  usage: 'version',
  examples: ['version'],
}, { force: true, source: 'v98Commands' })