import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

interface Task {
  id: string
  title: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  createdAt: string
}

function getNotes(): Note[] {
  const stored = localStorage.getItem('weblinux-notes')
  return stored ? JSON.parse(stored) : []
}

function saveNotes(notes: Note[]): void {
  localStorage.setItem('weblinux-notes', JSON.stringify(notes))
}

function getTasks(): Task[] {
  const stored = localStorage.getItem('weblinux-tasks')
  return stored ? JSON.parse(stored) : []
}

function saveTasks(tasks: Task[]): void {
  localStorage.setItem('weblinux-tasks', JSON.stringify(tasks))
}

registerCommand('notes', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const notes = getNotes()

    if (args.length === 0) {
      if (notes.length === 0) {
        return {
          output: [
            '📝 笔记管理',
            '═'.repeat(40),
            '',
            '暂无笔记',
            '',
            '用法:',
            '  notes list        - 列出所有笔记',
            '  notes view <ID>   - 查看笔记内容',
            '  notes add <标题>  - 创建新笔记',
            '  notes edit <ID>   - 编辑笔记',
            '  notes delete <ID> - 删除笔记',
            '',
          ].join('\n')
        }
      }

      const output: string[] = []
      output.push('📝 笔记列表')
      output.push('═'.repeat(50))
      output.push('')
      output.push(`${notes.length} 条笔记`)
      output.push('')

      notes.forEach((note, index) => {
        const date = new Date(note.updatedAt).toLocaleDateString('zh-CN')
        output.push(`${(index + 1).toString().padStart(3)}. ${note.title}`)
        output.push(`     更新: ${date} | ID: ${note.id.slice(0, 8)}`)
        output.push(`     预览: ${note.content.slice(0, 50)}${note.content.length > 50 ? '...' : ''}`)
        output.push('')
      })

      output.push('使用 "notes view <ID>" 查看详细内容')
      return { output: output.join('\n') }
    }

    const subcommand = args[0]

    if (subcommand === 'list') {
      const output: string[] = []
      output.push('📝 笔记列表')
      output.push('═'.repeat(50))
      output.push('')

      if (notes.length === 0) {
        output.push('暂无笔记')
        return { output: output.join('\n') }
      }

      notes.forEach((note, index) => {
        const date = new Date(note.updatedAt).toLocaleDateString('zh-CN')
        output.push(`${(index + 1).toString().padStart(3)}. ${note.title}`)
        output.push(`     ID: ${note.id} | 更新: ${date}`)
        output.push('')
      })

      return { output: output.join('\n') }
    }

    if (subcommand === 'add') {
      const title = args.slice(1).join(' ')
      if (!title) {
        return { output: '错误: 请输入笔记标题\n用法: notes add <标题>' }
      }

      const newNote: Note = {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      saveNotes([newNote, ...notes])
      return {
        output: [
          '📝 创建笔记',
          '═'.repeat(40),
          '',
          `已创建笔记: "${title}"`,
          `ID: ${newNote.id}`,
          '',
          '使用 "notes edit <ID> <内容>" 添加内容',
          '',
        ].join('\n')
      }
    }

    if (subcommand === 'view') {
      const id = args[1]
      if (!id) {
        return { output: '错误: 请输入笔记ID\n用法: notes view <ID>' }
      }

      const note = notes.find(n => n.id === id || n.id.startsWith(id))
      if (!note) {
        return { output: `未找到ID为 "${id}" 的笔记` }
      }

      return {
        output: [
          `📝 ${note.title}`,
          '═'.repeat(50),
          '',
          `ID: ${note.id}`,
          `创建: ${new Date(note.createdAt).toLocaleString('zh-CN')}`,
          `更新: ${new Date(note.updatedAt).toLocaleString('zh-CN')}`,
          '',
          '---',
          '',
          note.content || '(无内容)',
          '',
        ].join('\n')
      }
    }

    if (subcommand === 'edit') {
      const id = args[1]
      const content = args.slice(2).join(' ')
      if (!id) {
        return { output: '错误: 请输入笔记ID\n用法: notes edit <ID> <内容>' }
      }

      const noteIndex = notes.findIndex(n => n.id === id || n.id.startsWith(id))
      if (noteIndex === -1) {
        return { output: `未找到ID为 "${id}" 的笔记` }
      }

      notes[noteIndex] = {
        ...notes[noteIndex],
        content,
        updatedAt: new Date().toISOString(),
      }

      saveNotes(notes)
      return {
        output: [
          '📝 编辑笔记',
          '═'.repeat(40),
          '',
          `已更新笔记: "${notes[noteIndex].title}"`,
          '',
        ].join('\n')
      }
    }

    if (subcommand === 'delete') {
      const id = args[1]
      if (!id) {
        return { output: '错误: 请输入笔记ID\n用法: notes delete <ID>' }
      }

      const noteIndex = notes.findIndex(n => n.id === id || n.id.startsWith(id))
      if (noteIndex === -1) {
        return { output: `未找到ID为 "${id}" 的笔记` }
      }

      const deleted = notes.splice(noteIndex, 1)[0]
      saveNotes(notes)
      return {
        output: [
          '🗑️ 删除笔记',
          '═'.repeat(40),
          '',
          `已删除笔记: "${deleted.title}"`,
          '',
        ].join('\n')
      }
    }

    return {
      output: [
        '📝 笔记管理',
        '═'.repeat(40),
        '',
        '未知子命令',
        '',
        '可用子命令:',
        '  list        - 列出所有笔记',
        '  view <ID>   - 查看笔记内容',
        '  add <标题>  - 创建新笔记',
        '  edit <ID>   - 编辑笔记',
        '  delete <ID> - 删除笔记',
        '',
      ].join('\n')
    }
  },
  description: '笔记管理工具',
  usage: 'notes [list|view|add|edit|delete] [参数]',
  examples: ['notes', 'notes list', 'notes add 今日计划', 'notes view <ID>', 'notes edit <ID> 内容']
})

registerCommand('tasks', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const tasks = getTasks()

    if (args.length === 0) {
      const pending = tasks.filter(t => !t.completed)
      const completed = tasks.filter(t => t.completed)

      const output: string[] = []
      output.push('✅ 任务管理')
      output.push('═'.repeat(50))
      output.push('')
      output.push(`待完成: ${pending.length} | 已完成: ${completed.length}`)
      output.push('')

      if (pending.length > 0) {
        output.push('【待完成】')
        pending.forEach((task, index) => {
          const priorityColor = task.priority === 'high' ? '\x1b[31m' : task.priority === 'medium' ? '\x1b[33m' : '\x1b[32m'
          const priorityLabel = task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'
          output.push(`${(index + 1).toString().padStart(3)}. ${task.title}`)
          output.push(`     优先级: ${priorityColor}${priorityLabel}\x1b[0m`)
          if (task.dueDate) {
            output.push(`     截止: ${task.dueDate}`)
          }
          output.push('')
        })
      }

      if (completed.length > 0) {
        output.push('【已完成】')
        completed.slice(0, 5).forEach((task) => {
          output.push(`   ✓ ${task.title}`)
        })
        if (completed.length > 5) {
          output.push(`   ... 还有 ${completed.length - 5} 个已完成任务`)
        }
      }

      if (tasks.length === 0) {
        output.push('暂无任务')
      }

      output.push('')
      output.push('用法:')
      output.push('  tasks add <任务> [-p high|medium|low] [--due 日期]')
      output.push('  tasks done <ID>')
      output.push('  tasks delete <ID>')
      output.push('  tasks clear')

      return { output: output.join('\n') }
    }

    const subcommand = args[0]

    if (subcommand === 'add') {
      const priorityIndex = args.indexOf('-p')
      const dueIndex = args.indexOf('--due')

      let priority: 'low' | 'medium' | 'high' = 'medium'
      let dueDate: string | undefined

      if (priorityIndex !== -1 && args[priorityIndex + 1]) {
        const p = args[priorityIndex + 1].toLowerCase()
        if (p === 'high' || p === 'medium' || p === 'low') {
          priority = p
        }
      }

      if (dueIndex !== -1 && args[dueIndex + 1]) {
        dueDate = args[dueIndex + 1]
      }

      const titleArgs = args.slice(1).filter((_, i) => {
        const idx = i + 1
        return idx !== priorityIndex && idx !== priorityIndex + 1 && idx !== dueIndex && idx !== dueIndex + 1
      })
      const title = titleArgs.join(' ')

      if (!title) {
        return { output: '错误: 请输入任务内容\n用法: tasks add <任务> [-p high|medium|low] [--due 日期]' }
      }

      const newTask: Task = {
        id: `task-${Date.now()}`,
        title,
        completed: false,
        priority,
        dueDate,
        createdAt: new Date().toISOString(),
      }

      saveTasks([newTask, ...tasks])

      const priorityLabel = priority === 'high' ? '高' : priority === 'medium' ? '中' : '低'
      return {
        output: [
          '✅ 添加任务',
          '═'.repeat(40),
          '',
          `已添加任务: "${title}"`,
          `优先级: ${priorityLabel}`,
          dueDate ? `截止日期: ${dueDate}` : '',
          '',
        ].filter(Boolean).join('\n')
      }
    }

    if (subcommand === 'done') {
      const id = args[1]
      if (!id) {
        return { output: '错误: 请输入任务ID\n用法: tasks done <ID>' }
      }

      const taskIndex = tasks.findIndex(t => t.id === id || t.id.startsWith(id))
      if (taskIndex === -1) {
        return { output: `未找到ID为 "${id}" 的任务` }
      }

      tasks[taskIndex].completed = true
      saveTasks(tasks)

      return {
        output: [
          '✅ 完成任务',
          '═'.repeat(40),
          '',
          `已完成: "${tasks[taskIndex].title}"`,
          '',
        ].join('\n')
      }
    }

    if (subcommand === 'delete') {
      const id = args[1]
      if (!id) {
        return { output: '错误: 请输入任务ID\n用法: tasks delete <ID>' }
      }

      const taskIndex = tasks.findIndex(t => t.id === id || t.id.startsWith(id))
      if (taskIndex === -1) {
        return { output: `未找到ID为 "${id}" 的任务` }
      }

      const deleted = tasks.splice(taskIndex, 1)[0]
      saveTasks(tasks)

      return {
        output: [
          '🗑️ 删除任务',
          '═'.repeat(40),
          '',
          `已删除: "${deleted.title}"`,
          '',
        ].join('\n')
      }
    }

    if (subcommand === 'clear') {
      saveTasks([])
      return {
        output: [
          '🗑️ 清空任务',
          '═'.repeat(40),
          '',
          '已清空所有任务',
          '',
        ].join('\n')
      }
    }

    return {
      output: [
        '✅ 任务管理',
        '═'.repeat(40),
        '',
        '未知子命令',
        '',
        '可用子命令:',
        '  add <任务> [-p high|medium|low] [--due 日期] - 添加任务',
        '  done <ID>                                  - 标记完成',
        '  delete <ID>                                - 删除任务',
        '  clear                                      - 清空所有',
        '',
      ].join('\n')
    }
  },
  description: '任务管理工具',
  usage: 'tasks [add|done|delete|clear] [参数]',
  examples: ['tasks', 'tasks add 完成项目报告 -p high', 'tasks done <ID>', 'tasks delete <ID>', 'tasks clear']
})

registerCommand('calendar', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const today = new Date()
    let year = today.getFullYear()
    let month = today.getMonth()

    if (args.length === 1) {
      const arg = args[0]
      if (arg.length === 4 && !isNaN(parseInt(arg))) {
        year = parseInt(arg)
      } else if (arg.length <= 2 && !isNaN(parseInt(arg))) {
        month = parseInt(arg) - 1
      }
    } else if (args.length === 2) {
      year = parseInt(args[0]) || year
      month = (parseInt(args[1]) || month + 1) - 1
    }

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDay = firstDay.getDay()

    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']

    const output: string[] = []
    output.push(`📅 ${year}年 ${monthNames[month]}`)
    output.push('═'.repeat(28))
    output.push('')
    output.push('  ' + weekDays.join('  '))
    output.push('')

    let line = ''
    for (let i = 0; i < startDay; i++) {
      line += '   '
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
      const dayStr = isToday ? `\x1b[1;32m${day.toString().padStart(2)}\x1b[0m` : day.toString().padStart(2)
      line += ` ${dayStr}`
      
      if ((startDay + day) % 7 === 0) {
        output.push(line)
        line = ''
      }
    }

    if (line) {
      output.push(line)
    }

    output.push('')
    output.push(`当前日期: ${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`)
    output.push(`本月天数: ${daysInMonth}天`)
    output.push(`星期${['日', '一', '二', '三', '四', '五', '六'][today.getDay()]}`)
    output.push('')

    return { output: output.join('\n') }
  },
  description: '显示日历',
  usage: 'calendar [年份] [月份]',
  examples: ['calendar', 'calendar 2024', 'calendar 2024 12']
})

registerCommand('timer', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
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
          '  timer 60     - 倒计时60秒',
          '  timer 180    - 倒计时3分钟',
          '  timer 300    - 倒计时5分钟',
          '',
        ].join('\n')
      }
    }

    const seconds = parseInt(args[0])
    if (isNaN(seconds) || seconds <= 0) {
      return { output: '错误: 请输入有效的秒数' }
    }

    const output: string[] = []
    output.push(`⏱️ 倒计时 ${seconds} 秒`)
    output.push('═'.repeat(40))
    output.push('')

    for (let i = seconds; i >= 0; i--) {
      const minutes = Math.floor(i / 60)
      const secs = i % 60
      output.push(`剩余时间: ${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    output.push('')
    output.push('⏰ 时间到！')
    output.push('')

    return { output: output.join('\n') }
  },
  description: '倒计时计时器',
  usage: 'timer <秒数>',
  examples: ['timer 60', 'timer 180', 'timer 300']
})