import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

registerCommand('system-info', {
  handler: (context: CommandContext): CommandResult => {
    const { hostname, username, theme } = context
    const now = new Date()
    
    const perf = performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }
    const memoryInfo = perf.memory
    const memoryUsed = memoryInfo ? (memoryInfo.usedJSHeapSize / (1024 * 1024)).toFixed(1) : 'N/A'
    const memoryTotal = memoryInfo ? (memoryInfo.totalJSHeapSize / (1024 * 1024)).toFixed(1) : 'N/A'
    
    const navigatorInfo = {
      platform: navigator.platform,
      vendor: navigator.vendor,
      userAgent: navigator.userAgent.substring(0, 100),
      languages: navigator.languages.join(', '),
    }
    
    return {
      output: [
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '        系统信息',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `主机名: ${hostname}`,
        `用户名: ${username}`,
        `主题: ${theme}`,
        `版本: ${typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'}`,
        `构建时间: ${typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '未知'}`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '        浏览器信息',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `平台: ${navigatorInfo.platform}`,
        `供应商: ${navigatorInfo.vendor}`,
        `语言: ${navigatorInfo.languages}`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '        内存使用',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `已使用: ${memoryUsed} MB`,
        `总容量: ${memoryTotal} MB`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '        运行时间',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `当前时间: ${now.toLocaleString('zh-CN')}`,
      ].join('\n')
    }
  },
  description: '显示详细的系统信息',
  usage: 'system-info',
  examples: ['system-info']
})

registerCommand('cpu-info', {
  handler: (): CommandResult => {
    const logicalCores = navigator.hardwareConcurrency || 'N/A'
    
    return {
      output: [
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '        CPU 信息',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `逻辑核心数: ${logicalCores}`,
        '',
        '注意: 浏览器环境无法直接获取 CPU 型号信息',
        '以上数据基于 navigator.hardwareConcurrency API',
      ].join('\n')
    }
  },
  description: '显示 CPU 信息',
  usage: 'cpu-info',
  examples: ['cpu-info']
})

registerCommand('network-info', {
  handler: (): CommandResult => {
    const nav = navigator as unknown as { connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean; type?: string } }
    const connection = nav.connection
    
    if (!connection) {
      return {
        output: [
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '        网络信息',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          '浏览器不支持网络信息 API',
          '请使用较新版本的 Chrome 或 Firefox',
        ].join('\n')
      }
    }
    
    return {
      output: [
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '        网络信息',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `连接类型: ${connection.effectiveType || '未知'}`,
        `下行速度: ${connection.downlink || '未知'} Mbps`,
        `往返时间: ${connection.rtt || '未知'} ms`,
        `是否节省数据: ${connection.saveData ? '是' : '否'}`,
        `网络类型: ${connection.type || '未知'}`,
      ].join('\n')
    }
  },
  description: '显示网络连接信息',
  usage: 'network-info',
  examples: ['network-info']
})

registerCommand('battery', {
  handler: async (): Promise<CommandResult> => {
    const nav = navigator as unknown as { getBattery?: () => Promise<{ level: number; charging: boolean; chargingTime: number; dischargingTime: number }> }
    if (!nav.getBattery) {
      return {
        output: [
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '        电池信息',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          '浏览器不支持电池信息 API',
        ].join('\n')
      }
    }
    
    try {
      const battery = await nav.getBattery()
      
      return {
        output: [
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '        电池信息',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          `电量: ${(battery.level * 100).toFixed(0)}%`,
          `充电中: ${battery.charging ? '是' : '否'}`,
          `充电时间: ${battery.chargingTime === Infinity ? '计算中' : `${battery.chargingTime} 秒`}`,
          `放电时间: ${battery.dischargingTime === Infinity ? '未知' : `${battery.dischargingTime} 秒`}`,
        ].join('\n')
      }
    } catch (e) {
      return {
        output: [
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '        电池信息',
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          '',
          '无法获取电池信息',
        ].join('\n')
      }
    }
  },
  description: '显示设备电池信息',
  usage: 'battery',
  examples: ['battery']
})

registerCommand('sensors', {
  handler: (): CommandResult => {
    const hasAccelerometer = 'DeviceOrientationEvent' in window || 'DeviceMotionEvent' in window
    const hasGeolocation = 'geolocation' in navigator
    const hasAmbientLight = 'AmbientLightSensor' in window
    const hasProximity = 'ProximitySensor' in window
    
    return {
      output: [
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '        传感器支持',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `设备方向/运动: ${hasAccelerometer ? '支持' : '不支持'}`,
        `地理位置: ${hasGeolocation ? '支持' : '不支持'}`,
        `环境光: ${hasAmbientLight ? '支持' : '不支持'}`,
        `距离传感器: ${hasProximity ? '支持' : '不支持'}`,
        '',
        '注意: 需要用户授权才能使用某些传感器',
      ].join('\n')
    }
  },
  description: '显示设备传感器支持情况',
  usage: 'sensors',
  examples: ['sensors']
})

registerCommand('env', {
  handler: (context: CommandContext): CommandResult => {
    const envVars: Record<string, string> = {
      USER: context.username,
      HOME: '/home/user',
      PATH: '/usr/bin:/bin:/usr/local/bin',
      SHELL: '/bin/bash',
      TERM: 'xterm-256color',
      LANG: 'zh_CN.UTF-8',
      HOSTNAME: context.hostname,
      PWD: context.cwd,
      OLDPWD: context.prevCwd || '',
      EDITOR: 'nano',
      BROWSER: 'browser',
      WEBLINUX_VERSION: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown',
    }
    
    const output = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
    
    return { output }
  },
  description: '显示环境变量',
  usage: 'env [变量名]',
  examples: ['env', 'env HOME']
})

registerCommand('history', {
  handler: (): CommandResult => {
    const saved = localStorage.getItem('weblinux-cmd-history')
    const history = saved ? JSON.parse(saved) : []
    
    if (history.length === 0) {
      return { output: 'history: 无历史记录' }
    }
    
    const output = history
      .slice(-20)
      .map((cmd: string, i: number) => `${i + 1}. ${cmd}`)
      .join('\n')
    
    return { output }
  },
  description: '显示命令历史',
  usage: 'history',
  examples: ['history']
})

registerCommand('clear-history', {
  handler: (): CommandResult => {
    localStorage.removeItem('weblinux-cmd-history')
    return { output: '命令历史已清除' }
  },
  description: '清除命令历史',
  usage: 'clear-history',
  examples: ['clear-history']
})

registerCommand('alias', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const saved = localStorage.getItem('weblinux-aliases')
    const aliases = saved ? JSON.parse(saved) : {}
    
    if (args.length === 0) {
      if (Object.keys(aliases).length === 0) {
        return { output: 'alias: 无别名定义' }
      }
      const output = Object.entries(aliases)
        .map(([key, value]) => `alias ${key}='${value}'`)
        .join('\n')
      return { output }
    }
    
    const [name, value] = args.join(' ').split('=')
    if (!name || !value) {
      return { output: '用法: alias name=command' }
    }
    
    aliases[name] = value.replace(/['"]/g, '')
    localStorage.setItem('weblinux-aliases', JSON.stringify(aliases))
    return { output: `alias ${name}='${aliases[name]}'` }
  },
  description: '定义或显示命令别名',
  usage: 'alias [name=command]',
  examples: ['alias', "alias ll='ls -la'"]
})

registerCommand('unalias', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const saved = localStorage.getItem('weblinux-aliases')
    const aliases = saved ? JSON.parse(saved) : {}
    
    if (args.length === 0) {
      return { output: '用法: unalias <别名>' }
    }
    
    const name = args[0]
    if (!aliases[name]) {
      return { output: `unalias: ${name}: 未定义` }
    }
    
    delete aliases[name]
    localStorage.setItem('weblinux-aliases', JSON.stringify(aliases))
    return { output: `别名 ${name} 已删除` }
  },
  description: '删除命令别名',
  usage: 'unalias <别名>',
  examples: ['unalias ll']
})