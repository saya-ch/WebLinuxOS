import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

// === v90 创新命令集 ===

// fortune - 随机名言/激励
const FORTUNES = [
  '代码如诗，简洁为美。',
  '每一个伟大的程序，都始于一个小小的函数。',
  '调试是理解代码的过程，编写是创造的过程。',
  '最好的代码，是你永远不需要写的代码。',
  '先让它能跑，再让它跑得快，最后让它跑得优雅。',
  '过早优化是万恶之源。——Donald Knuth',
  '代码是写给人看的，顺便让机器执行。——Harold Abelson',
  '简单胜于复杂，复杂胜于精妙。',
  '如果你不能用简单的话解释它，说明你还没有真正理解它。',
  '完美不是无可添加，而是无可删除。——Antoine de Saint-Exupéry',
  '第一次就写对代码，不如第二次写对。——Kent Beck',
  '快速失败，频繁失败，以便更快地成功。',
  '测试不是可选的，它是必需的。',
  '代码审查不是找错，而是一起学习。',
  '命名是计算机科学中最难的两件事之一。',
]

registerCommand('fortune', {
  handler: (_ctx: CommandContext): CommandResult => {
    const idx = Math.floor(Math.random() * FORTUNES.length)
    return { output: `\n╭─ WebLinuxOS 箴言 ─────────────────────╮\n│  ${FORTUNES[idx]}\n╰──────────────────────────────────────────╯\n` }
  },
  description: '显示随机编程名言或激励语句',
  examples: ['fortune'],
})

// 补充 Battery API 的类型定义，避免 @ts-ignore
interface BatteryManager extends EventTarget {
  charging: boolean
  chargingTime: number
  dischargingTime: number
  level: number
}
interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>
}

// battery - 显示电池状态
registerCommand('battery', {
  handler: async (_ctx: CommandContext): Promise<CommandResult> => {
    try {
      const nav = navigator as NavigatorWithBattery
      if (!nav.getBattery) {
        return { output: '  ⚠ 当前浏览器不支持电池 API\n' }
      }
      const battery = await nav.getBattery()
      const level = Math.round(battery.level * 100)
      const status = battery.charging ? '充电中' : level < 20 ? '低电量' : '正常'
      const bars = Math.round(level / 5)
      const bar = '█'.repeat(bars) + '░'.repeat(20 - bars)
      const timeInfo = battery.charging
        ? battery.chargingTime === Infinity ? '' : `\n  充满约: ${Math.round(battery.chargingTime / 60)} 分钟`
        : battery.dischargingTime === Infinity ? '' : `\n  剩余约: ${Math.round(battery.dischargingTime / 60)} 分钟`
      return {
        output: `\n  电池状态\n  ─────────────────────\n  ${bar} ${level}%\n  状态: ${status}\n  充电: ${battery.charging ? '是' : '否'}${timeInfo}\n  ─────────────────────\n`
      }
    } catch {
      return { output: '  ⚠ 电池 API 不可用\n' }
    }
  },
  description: '显示设备电池状态（电量百分比、充电状态、剩余/充满时间）',
  examples: ['battery'],
})

// sysinfo - 显示系统信息
registerCommand('sysinfo', {
  handler: (_ctx: CommandContext): CommandResult => {
    const nav = navigator
    const screen = window.screen
    const memory = (performance as any).memory
    const cores = nav.hardwareConcurrency || '未知'
    const lang = nav.language
    const online = nav.onLine ? '在线' : '离线'
    const cookieEnabled = nav.cookieEnabled ? '启用' : '禁用'
    
    const memInfo = memory 
      ? `\n  JS 堆: ${(memory.usedJSHeapSize / 1048576).toFixed(1)} MB / ${(memory.jsHeapSizeLimit / 1048576).toFixed(1)} MB`
      : ''
    
    return {
      output: `
  ╔══════════════════════════════════════════╗
  ║          WebLinuxOS 系统信息              ║
  ╠══════════════════════════════════════════╣
  ║  浏览器: ${nav.userAgent.split(') ').slice(-1)[0] || '未知'}
  ║  平台: ${nav.platform || '未知'}
  ║  CPU核心: ${cores}
  ║  语言: ${lang}
  ║  在线状态: ${online}
  ║  Cookie: ${cookieEnabled}
  ║  屏幕: ${screen.width}x${screen.height} (${screen.colorDepth}-bit)
  ║  DPR: ${window.devicePixelRatio}${memInfo}
  ╚══════════════════════════════════════════╝
`
    }
  },
  description: '显示详细的系统和浏览器信息',
  examples: ['sysinfo'],
})

// speedtest - 简单网速测试
registerCommand('speedtest', {
  handler: async (): Promise<CommandResult> => {
    const start = performance.now()
    try {
      await fetch('https://httpbin.org/bytes/10000', {
        method: 'GET',
        cache: 'no-store',
      })
      const elapsed = performance.now() - start
      const speed = (10000 / 1024) / (elapsed / 1000)
      return {
        output: `
  ╔══════════════════════════════════════════╗
  ║          网速测试结果                      ║
  ╠══════════════════════════════════════════╣
  ║  下载数据: 10 KB
  ║  耗时: ${elapsed.toFixed(0)} ms
  ║  速度: ${speed.toFixed(2)} KB/s
  ║  估算: ${(speed * 8).toFixed(2)} Kbps
  ╚══════════════════════════════════════════╝
`
      }
    } catch {
      return { output: '  ⚠ 测试失败（可能是网络问题或CORS限制）\n' }
    }
  },
  description: '简单的网速测试',
  examples: ['speedtest'],
})

// weather-cli - 命令行天气查询
registerCommand('weather-cli', {
  handler: async (ctx: CommandContext): Promise<CommandResult> => {
    const city = ctx.args.join(' ') || '北京'
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=39.9042&longitude=116.4074&current=temperature_2m,weather_code,wind_speed_10m&timezone=Asia%2FShanghai`
      )
      const data = await response.json()
      const current = data.current
      const weatherMap: Record<number, string> = {
        0: '晴', 1: '大部分晴', 2: '多云', 3: '阴',
        45: '雾', 48: '雾凇', 51: '小毛毛雨', 53: '毛毛雨',
        55: '大毛毛雨', 61: '小雨', 63: '中雨', 65: '大雨',
        71: '小雪', 73: '中雪', 75: '大雪', 80: '阵雨',
        81: '中阵雨', 82: '强阵雨',
      }
      const desc = weatherMap[current.weather_code] || '未知'
      return {
        output: `
  ╔══════════════════════════════════════════╗
  ║          天气报告 - ${city}                ║
  ╠══════════════════════════════════════════╣
  ║  天气: ${desc}
  ║  温度: ${current.temperature_2m}°C
  ║  风速: ${current.wind_speed_10m} km/h
  ║  更新: ${new Date().toLocaleString('zh-CN')}
  ╚══════════════════════════════════════════╝
`
      }
    } catch {
      return { output: `  ⚠ 天气查询失败: ${city}\n` }
    }
  },
  description: '命令行天气查询',
  usage: 'weather-cli [城市名]',
  examples: ['weather-cli 北京', 'weather-cli 上海'],
})

// hash - 哈希计算器
registerCommand('hash', {
  handler: async (ctx: CommandContext): Promise<CommandResult> => {
    const input = ctx.args.join(' ')
    if (!input) {
      return { output: '用法: hash <文本>\n示例: hash hello world\n' }
    }
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(input)
      const [sha1, sha256, sha384, sha512] = await Promise.all([
        crypto.subtle.digest('SHA-1', data),
        crypto.subtle.digest('SHA-256', data),
        crypto.subtle.digest('SHA-384', data),
        crypto.subtle.digest('SHA-512', data),
      ])
      const toHex = (buf: ArrayBuffer) => 
        Array.from(new Uint8Array(buf))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
      
      return {
        output: `
  输入: ${input}
  ────────────────────────────────────────
  SHA-1:   ${toHex(sha1)}
  SHA-256: ${toHex(sha256)}
  SHA-384: ${toHex(sha384).slice(0, 32)}...
  SHA-512: ${toHex(sha512).slice(0, 32)}...
  ────────────────────────────────────────
`
      }
    } catch {
      return { output: '  ⚠ 哈希计算失败\n' }
    }
  },
  description: '计算文本的SHA哈希值',
  usage: 'hash <文本>',
  examples: ['hash hello world'],
})

// joke - 获取编程笑话
registerCommand('joke', {
  handler: async (): Promise<CommandResult> => {
    const jokes = [
      '为什么程序员喜欢暗模式？因为吸引 bug。',
      '世界上只有10种人：懂二进制的和不懂二进制的。',
      '程序员的三大谎言：这很简单、马上就好、不会有 bug。',
      '你知道为什么 Java 开发者戴眼镜吗？因为他们不能 C#。',
      '世界上最遥远的距离，是你写的代码和你期望的代码之间。',
      '前端程序员看到 `undefined` 的反应：\n  console.log(undefined); // undefined\n  console.log(typeof undefined); // "undefined"',
      'SQL 查询：`SELECT * FROM users WHERE age >= 18`\n程序员：这不就是我吗？',
      '当你终于找到 bug 的那一刻，你会发现它在你五分钟前改过的代码里。',
      '代码注释就像马桶：每个人都觉得别人需要它。',
      '我有一个很好的 UDP 笑话，但你可能收不到。',
    ]
    const idx = Math.floor(Math.random() * jokes.length)
    return {
      output: `
  ┌─────────────────────────────────────────┐
  │  💻 编程笑话                                │
  ├─────────────────────────────────────────┤
  │  ${jokes[idx]}
  └─────────────────────────────────────────┘
`
    }
  },
  description: '显示一个编程笑话',
  examples: ['joke'],
})

// cpu - CPU压力测试
registerCommand('cpu', {
  handler: (ctx: CommandContext): CommandResult => {
    const duration = parseInt(ctx.args[0]) || 2
    const start = performance.now()
    let count = 0
    
    // CPU 压力测试
    while (performance.now() - start < duration * 1000) {
      for (let i = 0; i < 100000; i++) {
        Math.sqrt(Math.random() * 1000000)
      }
      count++
    }
    
    const elapsed = (performance.now() - start) / 1000
    const ops = count * 100000
    const opsPerSec = Math.round(ops / elapsed)
    
    return {
      output: `
  ╔══════════════════════════════════════════╗
  ║          CPU 压力测试                     ║
  ╠══════════════════════════════════════════╣
  ║  时长: ${duration}秒
  ║  运算: ${ops.toLocaleString()} 次
  ║  频率: ${(opsPerSec / 1000000).toFixed(2)}M ops/s
  ║  CPU核心: ${navigator.hardwareConcurrency || '未知'}
  ╚══════════════════════════════════════════╝
`
    }
  },
  description: '执行CPU压力测试',
  usage: 'cpu [秒数]',
  examples: ['cpu', 'cpu 3'],
})

// nproc - 显示CPU核心数
registerCommand('nproc', {
  handler: (): CommandResult => {
    const cores = navigator.hardwareConcurrency || '8'
    return { output: `${cores}\n` }
  },
  description: '显示CPU核心数',
  examples: ['nproc'],
})

// free - 显示内存信息
registerCommand('free', {
  handler: (): CommandResult => {
    const memory = (performance as any).memory
    if (!memory) {
      return {
        output: `
  ╔══════════════════════════════════════════╗
  ║          内存信息 (部分浏览器不支持)        ║
  ╠══════════════════════════════════════════╣
  ║  浏览器: ${navigator.userAgent.split(') ').slice(-1)[0]}
  ║  注: 仅 Chrome/Edge 支持 performance.memory
  ╚══════════════════════════════════════════╝
`
      }
    }
    
    const used = (memory.usedJSHeapSize / 1048576).toFixed(1)
    const total = (memory.jsHeapSizeLimit / 1048576).toFixed(1)
    const available = (memory.totalJSHeapSize / 1048576).toFixed(1)
    const percent = ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1)
    
    const barLen = 20
    const filled = Math.round(barLen * memory.usedJSHeapSize / memory.jsHeapSizeLimit)
    const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled)
    
    return {
      output: `
  ╔══════════════════════════════════════════╗
  ║          内存信息                          ║
  ╠══════════════════════════════════════════╣
  ║  已用: ${used} MB
  ║  限制: ${total} MB
  ║  总量: ${available} MB
  ║  占用: ${bar} ${percent}%
  ╚══════════════════════════════════════════╝
`
    }
  },
  description: '显示内存使用情况',
  examples: ['free'],
})

// neofetch-style system display
registerCommand('system', {
  handler: (ctx: CommandContext): CommandResult => {
    const osInfo = `WebLinuxOS 90.0.0`
    const kernel = `${navigator.platform || 'Web'}-Kernel-${navigator.hardwareConcurrency || 4}cores`
    const shell = `bash 5.2`
    const terminal = `weblinux-terminal`
    const cpuInfo = `${navigator.hardwareConcurrency || 4} cores @ 3.0GHz`
    const memInfo = (performance as any).memory 
      ? `${Math.round((performance as any).memory.usedJSHeapSize / 1048576)}MB / ${Math.round((performance as any).memory.jsHeapSizeLimit / 1048576)}MB`
      : 'N/A'
    
    const asciiArt = `
       ╔════════════╗
       ║  ╔══════╗  ║
       ║  ║  WL  ║  ║
       ║  ╚══════╝  ║
       ║            ║
       ╚════════════╝
`
    
    return {
      output: `
${asciiArt}
  ┌─────────────────────────────────────────┐
  │  ${ctx.username}@${ctx.hostname}
  │  ─────────────────────────────────
  │  OS:        ${osInfo}
  │  Kernel:    ${kernel}
  │  Shell:     ${shell}
  │  Terminal:  ${terminal}
  │  CPU:       ${cpuInfo}
  │  Memory:    ${memInfo}
  │  Browser:   Chrome
  │  Uptime:    ${Math.floor(performance.now() / 1000)}s
  └─────────────────────────────────────────┘
`
    }
  },
  description: '显示系统信息（neofetch风格）',
  examples: ['system'],
})
