import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

registerCommand('calc', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '🧮 计算器',
          '═'.repeat(40),
          '',
          '用法: calc <表达式>',
          '',
          '支持的运算符: +, -, *, /, %, ^ (幂), sqrt, sin, cos, tan',
          '',
          '示例:',
          '  calc 1 + 2 * 3',
          '  calc sqrt(16)',
          '  calc sin(90)',
          '  calc 2^10',
          '  calc pi * 5^2',
          '',
        ].join('\n')
      }
    }
    
    const expr = args.join(' ')
      .replace(/\^/g, '**')
      .replace(/sqrt/g, 'Math.sqrt')
      .replace(/sin/g, 'Math.sin')
      .replace(/cos/g, 'Math.cos')
      .replace(/tan/g, 'Math.tan')
      .replace(/pi/g, 'Math.PI')
      .replace(/e/g, 'Math.E')
    
    try {
      const result = Function(`'use strict'; return ${expr}`)()
      
      if (typeof result === 'number' && isFinite(result)) {
        return {
          output: [
            '🧮 计算结果',
            '═'.repeat(40),
            '',
            `  表达式: ${expr}`,
            '',
            `  结果: ${result}`,
            '',
          ].join('\n')
        }
      }
      return { output: `计算错误: 结果无效` }
    } catch {
      return { output: `计算错误: 无效的表达式 "${expr}"` }
    }
  },
  description: '数学计算器',
  usage: 'calc <表达式>',
  examples: ['calc 1+2*3', 'calc sqrt(16)', 'calc sin(90)', 'calc 2^10']
})

registerCommand('converter', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '🔄 单位转换器',
          '═'.repeat(40),
          '',
          '用法: converter <值> <单位> <目标单位>',
          '',
          '支持的类别:',
          '',
          '  长度: m, km, cm, mm, inch, foot, yard, mile',
          '  重量: kg, g, mg, lb, oz',
          '  温度: c, f, k',
          '  面积: m2, km2, cm2, acre, hectare',
          '  体积: l, ml, m3, gal, qt, pt',
          '',
          '示例:',
          '  converter 100 km mile',
          '  converter 25 c f',
          '  converter 1000 g lb',
          '  converter 50 mile km',
          '',
        ].join('\n')
      }
    }
    
    const value = parseFloat(args[0])
    const fromUnit = args[1].toLowerCase()
    const toUnit = args[2].toLowerCase()
    
    if (isNaN(value)) {
      return { output: '错误: 请输入有效的数字' }
    }
    
    const lengthFactors: Record<string, number> = {
      m: 1, km: 1000, cm: 0.01, mm: 0.001,
      inch: 0.0254, foot: 0.3048, yard: 0.9144, mile: 1609.34
    }
    
    const weightFactors: Record<string, number> = {
      kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495
    }
    
    const areaFactors: Record<string, number> = {
      m2: 1, km2: 1000000, cm2: 0.0001, acre: 4046.86, hectare: 10000
    }
    
    const volumeFactors: Record<string, number> = {
      l: 1, ml: 0.001, m3: 1000, gal: 3.78541, qt: 0.946353, pt: 0.473176
    }
    
    let result: number | null = null
    
    if (lengthFactors[fromUnit] && lengthFactors[toUnit]) {
      result = value * lengthFactors[fromUnit] / lengthFactors[toUnit]
    } else if (weightFactors[fromUnit] && weightFactors[toUnit]) {
      result = value * weightFactors[fromUnit] / weightFactors[toUnit]
    } else if (areaFactors[fromUnit] && areaFactors[toUnit]) {
      result = value * areaFactors[fromUnit] / areaFactors[toUnit]
    } else if (volumeFactors[fromUnit] && volumeFactors[toUnit]) {
      result = value * volumeFactors[fromUnit] / volumeFactors[toUnit]
    } else if (['c', 'f', 'k'].includes(fromUnit) && ['c', 'f', 'k'].includes(toUnit)) {
      let celsius = value
      if (fromUnit === 'f') celsius = (value - 32) * 5 / 9
      if (fromUnit === 'k') celsius = value - 273.15
      
      if (toUnit === 'c') result = celsius
      if (toUnit === 'f') result = celsius * 9 / 5 + 32
      if (toUnit === 'k') result = celsius + 273.15
    }
    
    if (result !== null) {
      return {
        output: [
          '🔄 转换结果',
          '═'.repeat(40),
          '',
          `  ${value} ${fromUnit} = ${result.toFixed(4)} ${toUnit}`,
          '',
        ].join('\n')
      }
    }
    
    return { output: `不支持的单位转换: ${fromUnit} -> ${toUnit}` }
  },
  description: '单位转换器',
  usage: 'converter <值> <单位> <目标单位>',
  examples: ['converter 100 km mile', 'converter 25 c f', 'converter 1000 g lb']
})

registerCommand('timer', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          '⏱️ 计时器',
          '═'.repeat(40),
          '',
          '用法: timer <秒数>',
          '',
          '示例:',
          '  timer 60',
          '  timer 120',
          '  timer 300',
          '',
        ].join('\n')
      }
    }
    
    const seconds = parseInt(args[0])
    
    if (isNaN(seconds) || seconds <= 0) {
      return { output: '错误: 请输入有效的正数秒数' }
    }
    
    return {
      output: [
        '⏱️ 计时器已启动',
        '═'.repeat(40),
        '',
        `  倒计时: ${seconds} 秒`,
        '',
        `  预计完成: ${new Date(Date.now() + seconds * 1000).toLocaleTimeString('zh-CN')}`,
        '',
        '提示: 计时器在后台运行，完成时会发出提示音',
        '',
      ].join('\n')
    }
  },
  description: '启动倒计时器',
  usage: 'timer <秒数>',
  examples: ['timer 60', 'timer 120']
})

registerCommand('stopwatch', {
  handler: (): CommandResult => {
    return {
      output: [
        '⏲️ 秒表',
        '═'.repeat(40),
        '',
        '秒表已启动！',
        '',
        '按任意键停止计时...',
        '',
      ].join('\n')
    }
  },
  description: '启动秒表',
  usage: 'stopwatch',
  examples: ['stopwatch']
})

registerCommand('reminder', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length < 2) {
      return {
        output: [
          '📅 提醒器',
          '═'.repeat(40),
          '',
          '用法: reminder <分钟> <消息>',
          '',
          '示例:',
          '  reminder 5 休息一下',
          '  reminder 30 会议开始',
          '',
        ].join('\n')
      }
    }
    
    const minutes = parseInt(args[0])
    const message = args.slice(1).join(' ')
    
    if (isNaN(minutes) || minutes <= 0) {
      return { output: '错误: 请输入有效的正数分钟数' }
    }
    
    return {
      output: [
        '📅 提醒已设置',
        '═'.repeat(40),
        '',
        `  时间: ${minutes} 分钟后`,
        `  消息: ${message}`,
        '',
        `  预计时间: ${new Date(Date.now() + minutes * 60 * 1000).toLocaleTimeString('zh-CN')}`,
        '',
      ].join('\n')
    }
  },
  description: '设置提醒',
  usage: 'reminder <分钟> <消息>',
  examples: ['reminder 5 休息一下', 'reminder 30 会议开始']
})

registerCommand('pomo', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const mode = args[0]?.toLowerCase()
    
    if (!mode || mode === 'start') {
      return {
        output: [
          '🍅 番茄工作法',
          '═'.repeat(40),
          '',
          '番茄钟已启动！',
          '',
          '  专注时间: 25 分钟',
          '  休息时间: 5 分钟',
          '',
          '当前状态: 专注中...',
          '',
          '用法:',
          '  pomo start    - 开始番茄钟',
          '  pomo pause    - 暂停',
          '  pomo stop     - 停止',
          '  pomo status   - 查看状态',
          '',
        ].join('\n')
      }
    }
    
    if (mode === 'pause') {
      return {
        output: [
          '🍅 番茄工作法',
          '═'.repeat(40),
          '',
          '番茄钟已暂停',
          '',
          '使用 pomo start 继续',
          '',
        ].join('\n')
      }
    }
    
    if (mode === 'stop') {
      return {
        output: [
          '🍅 番茄工作法',
          '═'.repeat(40),
          '',
          '番茄钟已停止',
          '',
          '今日完成: 0 个番茄',
          '',
        ].join('\n')
      }
    }
    
    if (mode === 'status') {
      return {
        output: [
          '🍅 番茄工作法状态',
          '═'.repeat(40),
          '',
          '当前状态: 运行中',
          '剩余时间: 24:32',
          '今日完成: 3 个番茄',
          '',
        ].join('\n')
      }
    }
    
    return { output: `未知命令: ${mode}\n用法: pomo start|pause|stop|status` }
  },
  description: '番茄工作法计时器',
  usage: 'pomo [start|pause|stop|status]',
  examples: ['pomo', 'pomo start', 'pomo status']
})

registerCommand('todo', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const action = args[0]?.toLowerCase()
    
    if (!action || action === 'list') {
      const todos = [
        { id: 1, text: '完成项目报告', done: false },
        { id: 2, text: '回复邮件', done: true },
        { id: 3, text: '学习 TypeScript', done: false },
        { id: 4, text: '准备会议演示', done: false },
      ]
      
      const output: string[] = []
      output.push('📝 待办事项')
      output.push('═'.repeat(40))
      output.push('')
      
      todos.forEach(todo => {
        const status = todo.done ? '\x1b[32m✓\x1b[0m' : '\x1b[31m◯\x1b[0m'
        output.push(`  ${status} ${todo.text}`)
      })
      
      const completed = todos.filter(t => t.done).length
      output.push('')
      output.push(`  进度: ${completed}/${todos.length} 已完成`)
      output.push('')
      output.push('用法: todo add|done|remove|list')
      output.push('')
      
      return { output: output.join('\n') }
    }
    
    if (action === 'add') {
      const text = args.slice(1).join(' ')
      if (!text) return { output: '用法: todo add <事项>' }
      
      return {
        output: [
          '📝 待办事项',
          '═'.repeat(40),
          '',
          `已添加: ${text}`,
          '',
        ].join('\n')
      }
    }
    
    if (action === 'done') {
      const id = parseInt(args[1])
      if (isNaN(id)) return { output: '用法: todo done <ID>' }
      
      return {
        output: [
          '📝 待办事项',
          '═'.repeat(40),
          '',
          `已完成: #${id}`,
          '',
        ].join('\n')
      }
    }
    
    if (action === 'remove') {
      const id = parseInt(args[1])
      if (isNaN(id)) return { output: '用法: todo remove <ID>' }
      
      return {
        output: [
          '📝 待办事项',
          '═'.repeat(40),
          '',
          `已删除: #${id}`,
          '',
        ].join('\n')
      }
    }
    
    return { output: `未知命令: ${action}\n用法: todo add|done|remove|list` }
  },
  description: '待办事项管理',
  usage: 'todo [add|done|remove|list]',
  examples: ['todo', 'todo add 学习', 'todo done 1']
})

registerCommand('notes', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const action = args[0]?.toLowerCase()
    
    if (!action || action === 'list') {
      const notes = [
        { id: 1, title: '会议笔记', date: '2024-01-15' },
        { id: 2, title: '项目计划', date: '2024-01-14' },
        { id: 3, title: '代码思路', date: '2024-01-13' },
      ]
      
      const output: string[] = []
      output.push('📒 笔记列表')
      output.push('═'.repeat(40))
      output.push('')
      
      notes.forEach(note => {
        output.push(`  ${note.id}. ${note.title.padEnd(20)} ${note.date}`)
      })
      
      output.push('')
      output.push('用法: notes view|create|edit|delete')
      output.push('')
      
      return { output: output.join('\n') }
    }
    
    if (action === 'create') {
      const title = args.slice(1).join(' ')
      if (!title) return { output: '用法: notes create <标题>' }
      
      return {
        output: [
          '📒 笔记',
          '═'.repeat(40),
          '',
          `已创建笔记: ${title}`,
          '',
          '使用 notes edit <ID> 编辑内容',
          '',
        ].join('\n')
      }
    }
    
    if (action === 'view') {
      const id = parseInt(args[1])
      if (isNaN(id)) return { output: '用法: notes view <ID>' }
      
      return {
        output: [
          '📒 笔记内容',
          '═'.repeat(40),
          '',
          '# 会议笔记',
          '',
          '## 讨论内容',
          '',
          '- 项目进度更新',
          '- 下一阶段计划',
          '- 待解决问题',
          '',
          '---',
          '创建于: 2024-01-15',
          '',
        ].join('\n')
      }
    }
    
    return { output: `未知命令: ${action}\n用法: notes view|create|edit|delete` }
  },
  description: '笔记管理',
  usage: 'notes [view|create|edit|delete]',
  examples: ['notes', 'notes create 新笔记', 'notes view 1']
})

registerCommand('clipboard', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const action = args[0]?.toLowerCase()
    
    if (!action || action === 'show') {
      return {
        output: [
          '📋 剪贴板',
          '═'.repeat(40),
          '',
          '剪贴板历史:',
          '',
          '  1. Hello World',
          '  2. https://github.com',
          '  3. const x = 10;',
          '',
          '用法:',
          '  clipboard show    - 显示历史',
          '  clipboard copy    - 复制到剪贴板',
          '  clipboard clear   - 清空剪贴板',
          '',
        ].join('\n')
      }
    }
    
    if (action === 'copy') {
      const text = args.slice(1).join(' ')
      if (!text) return { output: '用法: clipboard copy <文本>' }
      
      return {
        output: [
          '📋 剪贴板',
          '═'.repeat(40),
          '',
          `已复制: "${text}"`,
          '',
        ].join('\n')
      }
    }
    
    if (action === 'clear') {
      return {
        output: [
          '📋 剪贴板',
          '═'.repeat(40),
          '',
          '剪贴板已清空',
          '',
        ].join('\n')
      }
    }
    
    return { output: `未知命令: ${action}\n用法: clipboard show|copy|clear` }
  },
  description: '剪贴板管理',
  usage: 'clipboard [show|copy|clear]',
  examples: ['clipboard', 'clipboard copy hello', 'clipboard clear']
})

registerCommand('history', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const action = args[0]?.toLowerCase()
    
    if (!action || action === 'show') {
      const history = [
        'ls -la',
        'cd /home/user',
        'weather Beijing',
        'crypto',
        'news',
      ]
      
      const output: string[] = []
      output.push('📜 命令历史')
      output.push('═'.repeat(40))
      output.push('')
      
      history.forEach((cmd, i) => {
        output.push(`  ${(i + 1).toString().padStart(3)}. ${cmd}`)
      })
      
      output.push('')
      output.push('用法: history show|clear')
      output.push('提示: 使用 ↑ ↓ 键浏览历史')
      output.push('')
      
      return { output: output.join('\n') }
    }
    
    if (action === 'clear') {
      return {
        output: [
          '📜 命令历史',
          '═'.repeat(40),
          '',
          '历史记录已清空',
          '',
        ].join('\n')
      }
    }
    
    return { output: `未知命令: ${action}\n用法: history show|clear` }
  },
  description: '命令历史管理',
  usage: 'history [show|clear]',
  examples: ['history', 'history clear']
})

registerCommand('theme', {
  handler: (context: CommandContext): CommandResult => {
    const { args, theme } = context
    
    const action = args[0]?.toLowerCase()
    
    if (!action || action === 'status') {
      return {
        output: [
          '🎨 主题设置',
          '═'.repeat(40),
          '',
          `当前主题: ${theme === 'dark' ? '\x1b[32m深色\x1b[0m' : '\x1b[33m浅色\x1b[0m'}`,
          '',
          '可用主题:',
          '  dark   - 深色模式',
          '  light  - 浅色模式',
          '',
          '用法: theme dark|light',
          '',
        ].join('\n')
      }
    }
    
    if (action === 'dark' || action === 'light') {
      return {
        output: [
          '🎨 主题设置',
          '═'.repeat(40),
          '',
          `主题已切换为: ${action === 'dark' ? '\x1b[32m深色\x1b[0m' : '\x1b[33m浅色\x1b[0m'}`,
          '',
          '需要重启应用才能生效',
          '',
        ].join('\n')
      }
    }
    
    return { output: `未知主题: ${action}\n可用: dark, light` }
  },
  description: '切换主题',
  usage: 'theme [dark|light]',
  examples: ['theme', 'theme dark', 'theme light']
})

registerCommand('config', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    const action = args[0]?.toLowerCase()
    
    if (!action || action === 'show') {
      const config = {
        theme: 'dark',
        fontSize: '14px',
        fontFamily: 'Monaco, Consolas',
        autoSave: 'on',
        language: 'zh-CN',
      }
      
      const output: string[] = []
      output.push('⚙️ 配置设置')
      output.push('═'.repeat(40))
      output.push('')
      
      Object.entries(config).forEach(([key, value]) => {
        output.push(`  ${key.padEnd(15)}: ${value}`)
      })
      
      output.push('')
      output.push('用法: config get|set|reset')
      output.push('')
      
      return { output: output.join('\n') }
    }
    
    if (action === 'get') {
      const key = args[1]
      if (!key) return { output: '用法: config get <键>' }
      
      return {
        output: [
          '⚙️ 配置设置',
          '═'.repeat(40),
          '',
          `${key}: dark`,
          '',
        ].join('\n')
      }
    }
    
    if (action === 'set') {
      const key = args[1]
      const value = args.slice(2).join(' ')
      if (!key || !value) return { output: '用法: config set <键> <值>' }
      
      return {
        output: [
          '⚙️ 配置设置',
          '═'.repeat(40),
          '',
          `已设置 ${key} = ${value}`,
          '',
        ].join('\n')
      }
    }
    
    if (action === 'reset') {
      return {
        output: [
          '⚙️ 配置设置',
          '═'.repeat(40),
          '',
          '配置已重置为默认值',
          '',
        ].join('\n')
      }
    }
    
    return { output: `未知命令: ${action}\n用法: config get|set|reset` }
  },
  description: '配置管理',
  usage: 'config [get|set|reset]',
  examples: ['config', 'config set theme dark', 'config reset']
})

registerCommand('help-util', {
  handler: (): CommandResult => {
    const commands = [
      { name: 'calc', desc: '数学计算器', usage: 'calc <表达式>' },
      { name: 'converter', desc: '单位转换器', usage: 'converter <值> <单位> <目标>' },
      { name: 'timer', desc: '倒计时器', usage: 'timer <秒数>' },
      { name: 'stopwatch', desc: '秒表', usage: 'stopwatch' },
      { name: 'reminder', desc: '提醒器', usage: 'reminder <分钟> <消息>' },
      { name: 'pomo', desc: '番茄工作法', usage: 'pomo [start|pause|stop]' },
      { name: 'todo', desc: '待办事项', usage: 'todo [add|done|remove|list]' },
      { name: 'notes', desc: '笔记管理', usage: 'notes [view|create|edit]' },
      { name: 'clipboard', desc: '剪贴板管理', usage: 'clipboard [show|copy|clear]' },
      { name: 'history', desc: '命令历史', usage: 'history [show|clear]' },
      { name: 'theme', desc: '切换主题', usage: 'theme [dark|light]' },
      { name: 'config', desc: '配置管理', usage: 'config [get|set|reset]' },
    ]
    
    const output: string[] = []
    output.push('🛠️ 工具命令列表')
    output.push('═'.repeat(70))
    output.push('')
    
    commands.forEach(cmd => {
      output.push(`  ${cmd.name.padEnd(15)} ${cmd.desc.padEnd(18)} ${cmd.usage}`)
    })
    
    output.push('')
    output.push('使用 help 查看所有命令')
    output.push('')
    
    return { output: output.join('\n') }
  },
  description: '显示工具命令列表',
  usage: 'help-util',
  examples: ['help-util']
})