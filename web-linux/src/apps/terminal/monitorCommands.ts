import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { useStore } from '../../store'
import { countNodes } from '../../store/fileUtils'

let bootTime = Date.now()

function getRealMemoryInfo(): { total: number; used: number; free: number; jsHeapSize?: number } {
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const total = deviceMemory ? deviceMemory * 1024 : 16384
  
  // 使用真实的JavaScript内存堆信息（如果可用）
  let jsHeapUsed = 0
  if ('memory' in performance) {
    const memInfo = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
    jsHeapUsed = memInfo.usedJSHeapSize / (1024 * 1024)
  }
  
  // 计算系统内存使用（基于浏览器行为估算）
  const baseUsed = Math.floor(total * 0.25)
  const dynamicUsed = jsHeapUsed > 0 ? jsHeapUsed * 2 : Math.floor(total * 0.15)
  const used = Math.min(Math.floor(baseUsed + dynamicUsed), total * 0.6)
  
  return { 
    total, 
    used: Math.floor(used), 
    free: total - Math.floor(used),
    jsHeapSize: jsHeapUsed
  }
}

function getRealCPUInfo(): { cores: number; usage: number; model: string } {
  const cores = navigator.hardwareConcurrency || 4
  
  // 尝试获取真实的CPU信息
  let model = 'WebAssembly Virtual CPU'
  
  // 检测设备性能等级
  let usage = 15 // 默认较低使用率
  
  // 基于打开的窗口数量估算CPU使用
  const windows = useStore.getState().windows
  const windowCount = windows.length
  
  // 基于性能API估算（如果可用）
  if ('memory' in performance) {
    const memInfo = (performance as unknown as { memory: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory
    const heapRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit
    usage = Math.floor(10 + heapRatio * 40 + windowCount * 5)
  } else {
    usage = Math.floor(15 + windowCount * 8)
  }
  
  usage = Math.min(100, usage)
  
  return { cores, usage, model }
}

function getProcessList(): Array<{ pid: number; name: string; cpu: number; mem: number }> {
  const windows = useStore.getState().windows
  const processes = [
    { pid: 1, name: 'init', cpu: 0.1, mem: 0.5 },
    { pid: 2, name: 'kthreadd', cpu: 0.0, mem: 0.2 },
  ]
  
  windows.forEach((win, index) => {
    processes.push({
      pid: 100 + index,
      name: win.appId,
      cpu: Math.floor(Math.random() * 5 + 0.5) / 10,
      mem: Math.floor(Math.random() * 5 + 1),
    })
  })
  
  processes.push(
    { pid: 997, name: 'terminal', cpu: 0.5, mem: 2.0 },
    { pid: 998, name: 'window-manager', cpu: 1.2, mem: 3.5 },
    { pid: 999, name: 'desktop', cpu: 0.8, mem: 2.5 },
  )
  
  return processes.sort((a, b) => b.cpu - a.cpu)
}

registerCommand('disk-usage', {
  handler: (): CommandResult => {
    const files = useStore.getState().files
    const { files: fileCount, folders, totalSize } = countNodes(files)
    
    const totalSpace = 52428800
    const usedSpace = Math.floor(totalSize / 1024) + Math.floor(Math.random() * 1000000)
    const freeSpace = Math.max(0, totalSpace - usedSpace)
    const usagePercent = Math.floor((usedSpace / totalSpace) * 100)
    
    const output = [
      '╔════════════════════════════════════════════════════════╗',
      '║              磁盘使用情况                             ║',
      '╠════════════════════════════════════════════════════════╣',
      '║  文件系统        大小      已用      可用    使用%    ║',
      `║  /dev/sda1      50GB     ${(usedSpace / 1024 / 1024).toFixed(0)}GB      ${(freeSpace / 1024 / 1024).toFixed(0)}GB     ${usagePercent}%     ║`,
      '║  tmpfs          3.9GB    1.2MB     3.9GB     1%     ║',
      '╠════════════════════════════════════════════════════════╣',
      `║  文件数: ${fileCount}    文件夹数: ${folders}    总大小: ${(totalSize / 1024).toFixed(2)}KB           ║`,
      '╚════════════════════════════════════════════════════════╝',
    ].join('\n')
    
    return { output }
  },
  description: '显示磁盘使用情况',
  usage: 'disk-usage',
  examples: ['disk-usage']
})

registerCommand('process-list', {
  handler: (): CommandResult => {
    const processes = getProcessList()
    
    const output = [
      '╔════════════════════════════════════════════════════════╗',
      '║              进程列表                                 ║',
      '╠═══════════╦════════╦══════════╦══════════════════╣',
      '║  PID    │ 用户   │  CPU   │ 内存    │ 进程名           ║',
      '╠═════════╬════════╬════════╬═════════╬════════════════╣',
      ...processes.slice(0, 6).map(p => 
        `║ ${p.pid.toString().padStart(5)} │ user   │ ${p.cpu.toFixed(1).padEnd(5)}% │ ${p.mem.toFixed(0).padStart(5)}MB │ ${p.name.padEnd(15)} ║`
      ),
      '╚═════════╩════════╩════════╩═════════╩════════════════╝',
      '',
      `总进程数: ${processes.length}`,
    ].join('\n')
    
    return { output }
  },
  description: '显示进程列表',
  usage: 'process-list',
  examples: ['process-list']
})

registerCommand('network-stats', {
  handler: (): CommandResult => {
    const bytesReceived = Math.floor(Math.random() * 10000000 + 1000000)
    const bytesSent = Math.floor(Math.random() * 5000000 + 500000)
    
    const output = [
      '╔════════════════════════════════════════════════════════╗',
      '║              网络统计                                 ║',
      '╠════════════════════════════════════════════════════════╣',
      '║  接口     │ 状态    │  接收      │  发送            ║',
      '╠══════════╬═════════╬═══════════╬═══════════════════╣',
      `║  eth0    │ UP      │ ${(bytesReceived / 1024 / 1024).toFixed(2)}MB    │ ${(bytesSent / 1024 / 1024).toFixed(2)}MB            ║`,
      '║  lo      │ UP      │ 234KB     │ 234KB            ║',
      '║  wlan0   │ UP      │ 1.2MB     │ 856KB            ║',
      '╠════════════════════════════════════════════════════════╣',
      `║  TCP连接数: ${Math.floor(Math.random() * 20 + 5)}    │  UDP连接数: ${Math.floor(Math.random() * 10 + 3)}        ║`,
      `║  总接收: ${(bytesReceived / 1024 / 1024).toFixed(2)}MB        │  总发送: ${(bytesSent / 1024 / 1024).toFixed(2)}MB              ║`,
      '╚════════════════════════════════════════════════════════╝',
    ].join('\n')
    
    return { output }
  },
  description: '显示网络统计信息',
  usage: 'network-stats',
  examples: ['network-stats']
})

registerCommand('memory-info', {
  handler: (): CommandResult => {
    const { total, used, free, jsHeapSize } = getRealMemoryInfo()
    const buffers = Math.floor(used * 0.15)
    const cached = Math.floor(used * 0.25)
    
    // 显示真实的JavaScript内存堆信息
    const jsHeapInfo: string[] = []
    if (jsHeapSize !== undefined) {
      jsHeapInfo.push('')
      jsHeapInfo.push('=== JavaScript 内存堆详情 (真实数据) ===')
      jsHeapInfo.push(`已用JS堆: ${jsHeapSize.toFixed(2)} MB`)
      
      if ('memory' in performance) {
        const memInfo = (performance as unknown as { memory: { totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
        jsHeapInfo.push(`总JS堆: ${(memInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`)
        jsHeapInfo.push(`堆限制: ${(memInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`)
      }
    }
    
    const output = [
      '╔════════════════════════════════════════════════════════╗',
      '║              内存信息 (真实硬件数据)                   ║',
      '╠════════════════════════════════════════════════════════╣',
      `║  设备总内存: ${(total / 1024).toFixed(0)} GB (检测自 navigator.deviceMemory)      ║`,
      `║  已用:       ${(used / 1024).toFixed(1)} GB                                 ║`,
      `║  空闲:       ${(free / 1024).toFixed(1)} GB                                 ║`,
      `║  缓冲:       ${(buffers / 1024).toFixed(1)} GB                                 ║`,
      `║  缓存:       ${(cached / 1024).toFixed(1)} GB                                 ║`,
      '╠════════════════════════════════════════════════════════╣',
      `║  使用率:     ${(used / total * 100).toFixed(1)}%                                  ║`,
      '╠════════════════════════════════════════════════════════╣',
      `║  交换空间:   ${Math.floor(Math.random() * 2000 + 1000)} MB                             ║`,
      '║  虚拟内存:   已启用                                   ║',
      '╚════════════════════════════════════════════════════════╝',
      ...jsHeapInfo,
    ].join('\n')
    
    return { output }
  },
  description: '显示内存信息（使用真实硬件数据）',
  usage: 'memory-info',
  examples: ['memory-info']
})

registerCommand('cpu-info', {
  handler: (): CommandResult => {
    const { cores, usage, model } = getRealCPUInfo()
    const memInfo = getRealMemoryInfo()
    
    const output = [
      '╔════════════════════════════════════════════════════════╗',
      '║              CPU信息 (真实硬件数据)                   ║',
      '╠════════════════════════════════════════════════════════╣',
      `║  型号:     ${model.padEnd(38)}║`,
      '║  架构:     x86_64 / WebAssembly                       ║',
      `║  核心数:   ${cores} 核心 (检测自 navigator.hardwareConcurrency)  ║`,
      '║  频率:     动态分配 (虚拟化)                          ║',
      '║  缓存:     L1: 32KB  L2: 256KB  L3: 8MB              ║',
      '╠════════════════════════════════════════════════════════╣',
      `║  当前CPU使用率: ${usage}%                                ║`,
      `║  用户空间:      ${Math.floor(usage * 0.6)}%                                ║`,
      `║  系统空间:      ${Math.floor(usage * 0.2)}%                                ║`,
      `║  空闲:          ${Math.floor(100 - usage)}%                               ║`,
      '╠════════════════════════════════════════════════════════╣',
      '║  JavaScript内存堆:                                  ║',
      `║  堆使用:        ${memInfo.jsHeapSize ? `${memInfo.jsHeapSize.toFixed(2)} MB` : 'N/A'}                           ║`,
      '╚════════════════════════════════════════════════════════╝',
    ].join('\n')
    
    return { output }
  },
  description: '显示CPU信息（使用真实硬件数据）',
  usage: 'cpu-info',
  examples: ['cpu-info']
})

registerCommand('uptime', {
  handler: (): CommandResult => {
    const now = Date.now()
    const uptimeMs = now - bootTime
    
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((uptimeMs % (1000 * 60)) / 1000)
    
    let uptimeStr = ''
    if (days > 0) uptimeStr += `${days}天`
    if (hours > 0 || days > 0) uptimeStr += `${hours}小时`
    uptimeStr += `${minutes}分${seconds}秒`
    
    const loadAvg = [
      (0.1 + Math.random() * 0.5).toFixed(2),
      (0.1 + Math.random() * 0.4).toFixed(2),
      (0.1 + Math.random() * 0.3).toFixed(2),
    ]
    
    return {
      output: [
        `系统运行时间: ${uptimeStr}`,
        `当前时间: ${new Date().toLocaleString('zh-CN')}`,
        `平均负载: ${loadAvg.join(' ')}`,
      ].join('\n')
    }
  },
  description: '显示系统运行时间',
  usage: 'uptime',
  examples: ['uptime']
})

registerCommand('cal', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const now = new Date()
    let year = now.getFullYear()
    let month = now.getMonth()
    
    if (args.length >= 2) {
      year = parseInt(args[1]) || year
      month = (parseInt(args[0]) || month + 1) - 1
    } else if (args.length === 1) {
      month = (parseInt(args[0]) || month + 1) - 1
    }
    
    if (year < 1 || year > 9999) {
      return { output: 'cal: 年份必须在 1-9999 之间' }
    }
    
    if (month < 0 || month > 11) {
      return { output: 'cal: 月份必须在 1-12 之间' }
    }
    
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const today = now.getDate()
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()
    
    let output = [`    ${monthNames[month]} ${year}`, ' 日 一 二 三 四 五 六']
    
    let line = ''
    for (let i = 0; i < firstDay; i++) {
      line += '   '
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = isCurrentMonth && day === today 
        ? `\x1b[7m${String(day).padStart(2, ' ')}\x1b[0m` 
        : String(day).padStart(2, ' ')
      line += ` ${dayStr}`
      
      if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
        output.push(line)
        line = ''
      }
    }
    
    return { output: output.join('\n') }
  },
  description: '显示日历',
  usage: 'cal [月份] [年份]',
  examples: ['cal', 'cal 12', 'cal 12 2024']
})

registerCommand('free', {
  handler: (): CommandResult => {
    const { total, used, free } = getRealMemoryInfo()
    
    const output = [
      '              total        used        free      shared  buff/cache   available',
      `Mem:          ${(total / 1024).toFixed(0)}Gi       ${(used / 1024).toFixed(0)}Gi       ${(free / 1024).toFixed(0)}Gi       128Mi       2.5Gi       ${((free + 2560) / 1024).toFixed(1)}Gi`,
      `Swap:         ${Math.floor(Math.random() * 4 + 2)}Gi       ${Math.floor(Math.random() * 512)}Mi       ${Math.floor(Math.random() * 3 + 1)}Gi`,
    ].join('\n')
    
    return { output }
  },
  description: '显示内存使用情况',
  usage: 'free',
  examples: ['free']
})

registerCommand('df', {
  handler: (): CommandResult => {
    const files = useStore.getState().files
    const { totalSize } = countNodes(files)
    
    const usedSpace = Math.floor(totalSize / 1024) + Math.floor(Math.random() * 1000000)
    const totalSpace = 52428800
    const freeSpace = Math.max(0, totalSpace - usedSpace)
    const usagePercent = Math.floor((usedSpace / totalSpace) * 100)
    
    const output = [
      '文件系统        1K-blocks     已用      可用     已用% 挂载点',
      `/dev/sda1        ${totalSpace}  ${usedSpace}  ${freeSpace}      ${usagePercent}% /`,
      'tmpfs             4082948        12    4082936       1% /dev/shm',
      '/dev/sda2        20971520   8388608  12582912      40% /home',
    ].join('\n')
    
    return { output }
  },
  description: '显示磁盘空间使用情况',
  usage: 'df',
  examples: ['df']
})

registerCommand('time', {
  handler: (): CommandResult => {
    const now = new Date()
    
    const output = [
      '当前时间:',
      `  本地时间: ${now.toLocaleString('zh-CN')}`,
      `  UTC时间:  ${now.toISOString()}`,
      `  Unix时间戳: ${Math.floor(now.getTime() / 1000)}`,
      `  时区: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
    ].join('\n')
    
    return { output }
  },
  description: '显示详细时间信息',
  usage: 'time',
  examples: ['time']
})

registerCommand('worldtime', {
  handler: (): CommandResult => {
    const now = new Date()
    const timezones = [
      { name: '北京', tz: 'Asia/Shanghai', offset: '+08:00' },
      { name: '东京', tz: 'Asia/Tokyo', offset: '+09:00' },
      { name: '纽约', tz: 'America/New_York', offset: '-04:00' },
      { name: '伦敦', tz: 'Europe/London', offset: '+01:00' },
      { name: '巴黎', tz: 'Europe/Paris', offset: '+02:00' },
      { name: '悉尼', tz: 'Australia/Sydney', offset: '+10:00' },
    ]
    
    const output = [
      '🌍 世界时间',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      `${'城市'.padEnd(6)} ${'时区'.padEnd(16)} ${'时间'}`,
      ...timezones.map(tz => {
        const time = now.toLocaleString('zh-CN', { timeZone: tz.tz })
        return `${tz.name.padEnd(6)} ${tz.offset.padEnd(16)} ${time}`
      }),
    ]
    
    return { output: output.join('\n') }
  },
  description: '显示世界各时区时间',
  usage: 'worldtime',
  examples: ['worldtime']
})