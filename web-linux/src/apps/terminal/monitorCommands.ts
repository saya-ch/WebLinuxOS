import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

registerCommand('disk-usage', {
  handler: (): CommandResult => {
    const output = [
      '╔════════════════════════════════════════════════════════╗',
      '║              磁盘使用情况                             ║',
      '╠════════════════════════════════════════════════════════╣',
      '║  文件系统        大小      已用      可用    使用%    ║',
      '║  /dev/sda1      50GB     12GB      38GB     24%     ║',
      '║  tmpfs          3.9GB    1.2MB     3.9GB     1%     ║',
      '║  /dev/sda2      20GB     8GB       12GB     40%     ║',
      '╠════════════════════════════════════════════════════════╣',
      '║  总计: 73.9GB    已用: 20GB    可用: 53.9GB           ║',
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
    const output = [
      '╔════════════════════════════════════════════════════════╗',
      '║              进程列表                                 ║',
      '╠═══════════╦════════╦══════════╦══════════════════╣',
      '║  PID    │ 用户   │  CPU   │ 内存    │ 进程名           ║',
      '╠═════════╬════════╬════════╬═════════╬════════════════╣',
      '║    1    │ root   │  0.0%  │  12MB   │ systemd          ║',
      '║  234    │ user   │  0.1%  │  45MB   │ terminal         ║',
      '║  567    │ user   │  1.2%  │ 156MB   │ browser          ║',
      '║  890    │ user   │  0.3%  │  89MB   │ file-manager     ║',
      '║ 1023    │ user   │  0.5%  │  67MB   │ code-editor      ║',
      '║ 1156    │ user   │  0.2%  │  34MB   │ music-player     ║',
      '╚═════════╩════════╩════════╩═════════╩════════════════╝',
      '',
      `总进程数: ${Math.floor(Math.random() * 50 + 100)}`,
    ].join('\n')
    
    return { output }
  },
  description: '显示进程列表',
  usage: 'process-list',
  examples: ['process-list']
})

registerCommand('network-stats', {
  handler: (): CommandResult => {
    const output = [
      '╔════════════════════════════════════════════════════════╗',
      '║              网络统计                                 ║',
      '╠════════════════════════════════════════════════════════╣',
      '║  接口     │ 状态    │  接收      │  发送            ║',
      '╠══════════╬═════════╬═══════════╬═══════════════════╣',
      '║  eth0    │ UP      │ 12.3MB    │ 4.5MB            ║',
      '║  lo      │ UP      │ 234KB     │ 234KB            ║',
      '║  wlan0   │ DOWN    │   -       │   -              ║',
      '╠════════════════════════════════════════════════════════╣',
      `║  TCP连接数: ${Math.floor(Math.random() * 50 + 10)}    │  UDP连接数: ${Math.floor(Math.random() * 30 + 5)}        ║`,
      '║  总接收: 12.5MB        │  总发送: 4.7MB              ║',
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
    const memTotal = 16384
    const memUsed = Math.floor(memTotal * (0.3 + Math.random() * 0.3))
    const memFree = memTotal - memUsed
    const memBuffers = Math.floor(memUsed * 0.3)
    const memCached = Math.floor(memUsed * 0.4)
    
    const output = [
      '╔════════════════════════════════════════════════════════╗',
      '║              内存信息                                 ║',
      '╠════════════════════════════════════════════════════════╣',
      `║  总内存:    ${(memTotal / 1024).toFixed(0).padEnd(35)}MB║`,
      `║  已用:     ${(memUsed / 1024).toFixed(0).padEnd(35)}MB║`,
      `║  空闲:     ${(memFree / 1024).toFixed(0).padEnd(35)}MB║`,
      `║  缓冲:     ${(memBuffers / 1024).toFixed(0).padEnd(35)}MB║`,
      `║  缓存:     ${(memCached / 1024).toFixed(0).padEnd(35)}MB║`,
      '╠════════════════════════════════════════════════════════╣',
      `║  交换空间:  ${Math.floor(Math.random() * 2000 + 1000).toString().padEnd(35)}MB║`,
      '║  虚拟内存:  已启用                                   ║',
      '╚════════════════════════════════════════════════════════╝',
    ].join('\n')
    
    return { output }
  },
  description: '显示内存信息',
  usage: 'memory-info',
  examples: ['memory-info']
})

registerCommand('cpu-info', {
  handler: (): CommandResult => {
    const output = [
      '╔════════════════════════════════════════════════════════╗',
      '║              CPU信息                                  ║',
      '╠════════════════════════════════════════════════════════╣',
      '║  型号:     WebAssembly Virtual CPU                     ║',
      '║  架构:     x86_64                                     ║',
      `║  核心数:   ${Math.floor(Math.random() * 4 + 4)} 核心                              ║`,
      `║  频率:     ${Math.floor(Math.random() * 1000 + 2000)} MHz (动态)                    ║`,
      '║  缓存:     L1: 32KB  L2: 256KB  L3: 8MB              ║',
      '╠════════════════════════════════════════════════════════╣',
      `║  CPU使用率: ${Math.floor(Math.random() * 30 + 10)}%                              ║`,
      `║  用户空间:  ${Math.floor(Math.random() * 15 + 5)}%                              ║`,
      `║  系统空间:  ${Math.floor(Math.random() * 5 + 1)}%                               ║`,
      `║  空闲:     ${Math.floor(Math.random() * 60 + 30)}%                              ║`,
      '╚════════════════════════════════════════════════════════╝',
    ].join('\n')
    
    return { output }
  },
  description: '显示CPU信息',
  usage: 'cpu-info',
  examples: ['cpu-info']
})

let bootTime = Date.now()

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
    const memTotal = 16384
    const memUsed = Math.floor(memTotal * (0.3 + Math.random() * 0.3))
    const memFree = memTotal - memUsed
    
    const output = [
      '              total        used        free      shared  buff/cache   available',
      `Mem:          ${(memTotal / 1024).toFixed(0)}Gi       ${(memUsed / 1024).toFixed(0)}Gi       ${(memFree / 1024).toFixed(0)}Gi       128Mi       2.5Gi       ${((memFree + 2560) / 1024).toFixed(1)}Gi`,
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
    const output = [
      '文件系统        1K-blocks     已用      可用     已用% 挂载点',
      '/dev/sda1        52428800  12582912  39845888      24% /',
      'tmpfs             4082948        12    4082936       1% /dev/shm',
      '/dev/sda2        20971520   8388608  12582912      40% /home',
    ].join('\n')
    
    return { output }
  },
  description: '显示磁盘空间使用情况',
  usage: 'df',
  examples: ['df']
})