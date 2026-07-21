import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

let commandHistory: string[] = []
const MAX_HISTORY = 100

export function addToHistory(command: string) {
  if (command.trim()) {
    commandHistory = [command, ...commandHistory.filter(c => c !== command)].slice(0, MAX_HISTORY)
  }
}

export function getHistory(): string[] {
  return commandHistory
}

registerCommand('history', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const clearFlag = args.includes('-c')
    
    if (clearFlag) {
      commandHistory = []
      return { output: '' }
    }
    
    const count = parseInt(args[0]) || commandHistory.length
    
    const output = [
      '命令历史',
      '',
      ...commandHistory.slice(0, count).map((cmd, index) => 
        `${(commandHistory.length - index).toString().padStart(4)}  ${cmd}`
      ),
      '',
      `共 ${commandHistory.length} 条记录`,
    ]
    
    return { output: output.join('\n') }
  },
  description: '查看命令历史',
  usage: 'history [数量] [-c]',
  examples: ['history', 'history 20', 'history -c']
})

registerCommand('clear', {
  handler: (): CommandResult => {
    return { output: '\x1b[2J\x1b[H' }
  },
  description: '清空终端屏幕',
  usage: 'clear',
  examples: ['clear']
})