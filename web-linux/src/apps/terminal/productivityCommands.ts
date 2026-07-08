import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { useStore } from '../../store'

const todoStore: { id: number; text: string; completed: boolean; createdAt: Date }[] = [
  { id: 1, text: '完成 WebLinuxOS 开发', completed: false, createdAt: new Date() },
  { id: 2, text: '优化系统性能', completed: false, createdAt: new Date() },
  { id: 3, text: '添加新应用程序', completed: true, createdAt: new Date() },
]

let nextId = 4

registerCommand('todo', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      const output: string[] = []
      output.push('📝 待办事项列表')
      output.push('═'.repeat(50))
      output.push('')
      
      const pending = todoStore.filter(t => !t.completed)
      const completed = todoStore.filter(t => t.completed)
      
      if (pending.length > 0) {
        output.push('【待完成】')
        pending.forEach(todo => {
          output.push(`  ${todo.id}. ${todo.text}`)
        })
        output.push('')
      }
      
      if (completed.length > 0) {
        output.push('【已完成】')
        completed.forEach(todo => {
          output.push(`  ✅ ${todo.id}. ${todo.text}`)
        })
        output.push('')
      }
      
      if (todoStore.length === 0) {
        output.push('  暂无待办事项')
        output.push('')
      }
      
      output.push(`总计: ${todoStore.length} 项 (${completed.length} 已完成)`)
      output.push('')
      output.push('用法: todo add <事项> | todo done <ID> | todo delete <ID>')
      
      return { output: output.join('\n') }
    }
    
    const action = args[0].toLowerCase()
    
    if (action === 'add') {
      const text = args.slice(1).join(' ')
      if (!text) {
        return { output: '用法: todo add <事项>\n示例: todo add 完成项目文档' }
      }
      
      todoStore.push({ id: nextId++, text, completed: false, createdAt: new Date() })
      return { output: `✅ 已添加待办事项: "${text}"` }
    }
    
    if (action === 'done') {
      const id = parseInt(args[1])
      if (isNaN(id)) {
        return { output: '用法: todo done <ID>\n示例: todo done 1' }
      }
      
      const todo = todoStore.find(t => t.id === id)
      if (!todo) {
        return { output: `未找到 ID 为 ${id} 的待办事项` }
      }
      
      todo.completed = true
      return { output: `✅ 已完成: "${todo.text}"` }
    }
    
    if (action === 'delete') {
      const id = parseInt(args[1])
      if (isNaN(id)) {
        return { output: '用法: todo delete <ID>\n示例: todo delete 1' }
      }
      
      const index = todoStore.findIndex(t => t.id === id)
      if (index === -1) {
        return { output: `未找到 ID 为 ${id} 的待办事项` }
      }
      
      const deleted = todoStore.splice(index, 1)[0]
      return { output: `🗑️ 已删除: "${deleted.text}"` }
    }
    
    return { output: `未知操作: ${action}\n用法: todo [add|done|delete]` }
  },
  description: '管理待办事项',
  usage: 'todo [add|done|delete] [参数]',
  examples: ['todo', 'todo add 完成报告', 'todo done 1', 'todo delete 2']
})

const pomodoroState = {
  running: false,
  duration: 25,
  timeLeft: 25 * 60,
  breaksCompleted: 0,
  totalPomodoros: 0,
}

registerCommand('pomodoro', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      const status = pomodoroState.running ? '运行中' : '已停止'
      const minutes = Math.floor(pomodoroState.timeLeft / 60)
      const seconds = pomodoroState.timeLeft % 60
      
      return {
        output: [
          '🍅 番茄工作法',
          '═'.repeat(40),
          '',
          `状态: ${status}`,
          `剩余时间: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
          `完成番茄数: ${pomodoroState.totalPomodoros}`,
          `连续休息次数: ${pomodoroState.breaksCompleted}`,
          '',
          '用法: pomodoro start | pomodoro stop | pomodoro reset',
        ].join('\n')
      }
    }
    
    const action = args[0].toLowerCase()
    
    if (action === 'start') {
      if (pomodoroState.running) {
        return { output: '番茄钟已在运行中' }
      }
      pomodoroState.running = true
      return { output: '🍅 番茄钟已启动！专注工作 25 分钟。' }
    }
    
    if (action === 'stop') {
      pomodoroState.running = false
      return { output: '⏹️ 番茄钟已停止' }
    }
    
    if (action === 'reset') {
      pomodoroState.running = false
      pomodoroState.timeLeft = pomodoroState.duration * 60
      pomodoroState.breaksCompleted = 0
      return { output: '🔄 番茄钟已重置' }
    }
    
    return { output: `未知操作: ${action}\n用法: pomodoro [start|stop|reset]` }
  },
  description: '番茄工作法计时器',
  usage: 'pomodoro [start|stop|reset]',
  examples: ['pomodoro', 'pomodoro start', 'pomodoro stop', 'pomodoro reset']
})

const noteStore: { id: number; title: string; content: string; createdAt: Date }[] = []
let noteId = 1

registerCommand('note', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      const output: string[] = []
      output.push('📓 笔记管理')
      output.push('═'.repeat(50))
      output.push('')
      
      if (noteStore.length === 0) {
        output.push('  暂无笔记')
      } else {
        noteStore.forEach(note => {
          output.push(`  ${note.id}. ${note.title}`)
          output.push(`     ${note.createdAt.toLocaleString('zh-CN')}`)
          output.push('')
        })
      }
      
      output.push('用法: note add <标题> <内容> | note view <ID> | note delete <ID>')
      
      return { output: output.join('\n') }
    }
    
    const action = args[0].toLowerCase()
    
    if (action === 'add') {
      const title = args[1]
      const content = args.slice(2).join(' ')
      
      if (!title) {
        return { output: '用法: note add <标题> <内容>\n示例: note add 会议记录 今天讨论了项目进度' }
      }
      
      noteStore.push({ id: noteId++, title, content: content || '', createdAt: new Date() })
      return { output: `📝 已添加笔记: "${title}"` }
    }
    
    if (action === 'view') {
      const id = parseInt(args[1])
      if (isNaN(id)) {
        return { output: '用法: note view <ID>\n示例: note view 1' }
      }
      
      const note = noteStore.find(n => n.id === id)
      if (!note) {
        return { output: `未找到 ID 为 ${id} 的笔记` }
      }
      
      return {
        output: [
          `📓 ${note.title}`,
          '═'.repeat(50),
          '',
          note.content || '(无内容)',
          '',
          `创建时间: ${note.createdAt.toLocaleString('zh-CN')}`,
        ].join('\n')
      }
    }
    
    if (action === 'delete') {
      const id = parseInt(args[1])
      if (isNaN(id)) {
        return { output: '用法: note delete <ID>\n示例: note delete 1' }
      }
      
      const index = noteStore.findIndex(n => n.id === id)
      if (index === -1) {
        return { output: `未找到 ID 为 ${id} 的笔记` }
      }
      
      const deleted = noteStore.splice(index, 1)[0]
      return { output: `🗑️ 已删除笔记: "${deleted.title}"` }
    }
    
    return { output: `未知操作: ${action}\n用法: note [add|view|delete]` }
  },
  description: '管理快速笔记',
  usage: 'note [add|view|delete] [参数]',
  examples: ['note', 'note add 想法 新功能建议', 'note view 1', 'note delete 2']
})

const projectStore: { id: string; name: string; description: string; tasks: { id: number; text: string; done: boolean }[]; createdAt: Date }[] = []

registerCommand('project', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      const output: string[] = []
      output.push('📋 项目管理')
      output.push('═'.repeat(50))
      output.push('')
      
      if (projectStore.length === 0) {
        output.push('  暂无项目')
      } else {
        projectStore.forEach(project => {
          const done = project.tasks.filter(t => t.done).length
          const total = project.tasks.length
          output.push(`  ${project.name}`)
          output.push(`     描述: ${project.description || '无'}`)
          output.push(`     进度: ${done}/${total} 任务完成`)
          output.push('')
        })
      }
      
      output.push('用法: project create <名称> | project add-task <名称> <任务> | project done <名称> <任务ID>')
      
      return { output: output.join('\n') }
    }
    
    const action = args[0].toLowerCase()
    
    if (action === 'create') {
      const name = args.slice(1).join(' ')
      if (!name) {
        return { output: '用法: project create <项目名称>\n示例: project create 网站重构' }
      }
      
      projectStore.push({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        description: '',
        tasks: [],
        createdAt: new Date()
      })
      return { output: `📋 已创建项目: "${name}"` }
    }
    
    if (action === 'add-task') {
      const projectName = args[1]
      const taskText = args.slice(2).join(' ')
      
      if (!projectName || !taskText) {
        return { output: '用法: project add-task <项目名称> <任务内容>\n示例: project add-task 网站重构 设计新UI' }
      }
      
      const project = projectStore.find(p => p.name === projectName || p.id === projectName)
      if (!project) {
        return { output: `未找到项目: "${projectName}"` }
      }
      
      project.tasks.push({ id: project.tasks.length + 1, text: taskText, done: false })
      return { output: `✅ 已添加任务到 "${project.name}": "${taskText}"` }
    }
    
    if (action === 'done') {
      const projectName = args[1]
      const taskId = parseInt(args[2])
      
      if (!projectName || isNaN(taskId)) {
        return { output: '用法: project done <项目名称> <任务ID>\n示例: project done 网站重构 1' }
      }
      
      const project = projectStore.find(p => p.name === projectName || p.id === projectName)
      if (!project) {
        return { output: `未找到项目: "${projectName}"` }
      }
      
      const task = project.tasks.find(t => t.id === taskId)
      if (!task) {
        return { output: `未找到任务 ID: ${taskId}` }
      }
      
      task.done = true
      const done = project.tasks.filter(t => t.done).length
      const total = project.tasks.length
      return { output: `✅ 任务完成！项目进度: ${done}/${total}` }
    }
    
    if (action === 'delete') {
      const projectName = args.slice(1).join(' ')
      if (!projectName) {
        return { output: '用法: project delete <项目名称>\n示例: project delete 旧项目' }
      }
      
      const index = projectStore.findIndex(p => p.name === projectName || p.id === projectName)
      if (index === -1) {
        return { output: `未找到项目: "${projectName}"` }
      }
      
      const deleted = projectStore.splice(index, 1)[0]
      return { output: `🗑️ 已删除项目: "${deleted.name}"` }
    }
    
    return { output: `未知操作: ${action}\n用法: project [create|add-task|done|delete]` }
  },
  description: '轻量级项目管理',
  usage: 'project [create|add-task|done|delete] [参数]',
  examples: ['project', 'project create 新项目', 'project add-task 新项目 任务1', 'project done 新项目 1']
})

registerCommand('calendar', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const now = new Date()
    const year = args.length >= 2 ? parseInt(args[1]) : now.getFullYear()
    const month = args.length >= 1 ? (parseInt(args[0]) - 1) : now.getMonth()
    
    if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
      return { output: '用法: calendar [月份] [年份]\n示例: calendar, calendar 12 2024' }
    }
    
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = now.getDate()
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()
    
    const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    
    const output: string[] = []
    output.push(`📅 ${year}年 ${months[month]}`)
    output.push('═'.repeat(40))
    output.push('')
    
    output.push('  ' + weekdays.join('   '))
    
    let line = '   '
    for (let i = 0; i < firstDay; i++) {
      line += '    '
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = isCurrentMonth && day === today ? `\x1b[32m${day.toString().padStart(2)}\x1b[0m` : day.toString().padStart(2)
      line += `${dayStr}   `
      
      if ((firstDay + day) % 7 === 0) {
        output.push(line)
        line = '   '
      }
    }
    
    if (line.trim()) {
      output.push(line)
    }
    
    output.push('')
    
    return { output: output.join('\n') }
  },
  description: '显示日历',
  usage: 'calendar [月份] [年份]',
  examples: ['calendar', 'calendar 12 2024']
})

registerCommand('countdown', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      return { output: '用法: countdown <日期>\n示例: countdown 2025-01-01' }
    }
    
    const targetDate = new Date(args.join(' '))
    if (isNaN(targetDate.getTime())) {
      return { output: '错误: 无效的日期格式，请使用 YYYY-MM-DD' }
    }
    
    const now = new Date()
    const diff = targetDate.getTime() - now.getTime()
    
    if (diff < 0) {
      return { output: '目标日期已过！' }
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    return {
      output: [
        '⏰ 倒计时',
        '═'.repeat(40),
        '',
        `目标日期: ${targetDate.toLocaleDateString('zh-CN')}`,
        '',
        `剩余时间:`,
        `  ${days} 天`,
        `  ${hours} 小时`,
        `  ${minutes} 分钟`,
        `  ${seconds} 秒`,
        '',
        `总计: ${days * 24 + hours} 小时`,
      ].join('\n')
    }
  },
  description: '计算到指定日期的倒计时',
  usage: 'countdown <日期>',
  examples: ['countdown 2025-01-01', 'countdown 2024-12-25']
})

// === v19.0 新增：WorldPulse 启动与全局应用启动器 ===
registerCommand('worldpulse', {
  handler: (): CommandResult => {
    const state = useStore.getState()
    const existing = state.windows.find((w) => w.appId === 'world-pulse')
    if (existing) {
      state.focusWindow(existing.id)
      if (existing.minimized) {
        useStore.setState((s) => ({
          windows: s.windows.map((w) =>
            w.id === existing.id ? { ...w, minimized: false } : w
          ),
        }))
      }
      const winDesktop = Object.entries(state.windowsPerDesktop)
        .find(([, ids]) => ids.includes(existing.id))?.[0]
      if (winDesktop && Number(winDesktop) !== state.currentDesktop) {
        state.switchDesktop(Number(winDesktop))
      }
      return { output: 'WorldPulse 全球脉搏已聚焦到前台' }
    }
    state.openApp('world-pulse')
    return {
      output: [
        '启动 WorldPulse 全球脉搏仪表盘',
        '═'.repeat(48),
        '',
        '正在加载实时全球情报数据:',
        '  - 加密货币市场行情 (CoinGecko)',
        '  - 全球主要城市天气 (Open-Meteo)',
        '  - 国际空间站实时位置 (wheretheiss.at)',
        '  - 全球汇率快讯 (open.er-api.com)',
        '  - Hacker News 热门榜单 (Firebase)',
        '',
        '提示: 使用 launch <应用ID> 可启动其他应用',
      ].join('\n'),
    }
  },
  description: '启动 WorldPulse 实时全球情报仪表盘',
  usage: 'worldpulse',
  examples: ['worldpulse'],
})

registerCommand('launch', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    if (args.length === 0) {
      const apps = useStore.getState().apps
      const output: string[] = [
        '启动器：可用应用列表',
        '═'.repeat(50),
        '',
      ]
      const categories = new Map<string, typeof apps>()
      for (const app of apps) {
        const cat = app.category || 'other'
        if (!categories.has(cat)) categories.set(cat, [])
        categories.get(cat)!.push(app)
      }
      const categoryLabels: Record<string, string> = {
        system: '系统',
        utilities: '实用工具',
        internet: '网络',
        productivity: '生产力',
        media: '媒体',
        games: '游戏',
        development: '开发',
        other: '其他',
      }
      for (const [cat, appList] of categories) {
        output.push(`【${categoryLabels[cat] || cat}】`)
        for (const app of appList) {
          output.push(`  ${app.id.padEnd(28)} ${app.name}`)
        }
        output.push('')
      }
      output.push('用法: launch <应用ID>')
      output.push('示例: launch world-pulse')
      return { output: output.join('\n') }
    }
    const appId = args[0]
    const apps = useStore.getState().apps
    if (!apps.find((a) => a.id === appId)) {
      return { output: `未找到应用: "${appId}"\n输入 launch 查看所有可用应用` }
    }
    useStore.getState().openApp(appId)
    return { output: `已启动应用: ${appId}` }
  },
  description: '启动指定应用，或列出所有可用应用',
  usage: 'launch [应用ID]',
  examples: ['launch', 'launch world-pulse', 'launch terminal'],
})