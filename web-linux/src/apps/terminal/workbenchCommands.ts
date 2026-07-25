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


