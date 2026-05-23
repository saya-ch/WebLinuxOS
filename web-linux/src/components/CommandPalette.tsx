import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useStore } from '../store'
import { appRegistry } from '../apps'
import { SearchIcon, FileTextIcon, SettingsIcon, ActivityIcon } from '../icons'

interface Command {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
  action: () => void
  priority?: number
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const openApp = useStore((s) => s.openApp)
  const setTheme = useStore((s) => s.setTheme)
  const theme = useStore((s) => s.theme)
  const windows = useStore((s) => s.windows)
  const focusWindow = useStore((s) => s.focusWindow)
  const windowsPerDesktop = useStore((s) => s.windowsPerDesktop)
  const currentDesktop = useStore((s) => s.currentDesktop)
  const switchDesktop = useStore((s) => s.switchDesktop)
  const addDesktop = useStore((s) => s.addDesktop)
  const removeDesktop = useStore((s) => s.removeDesktop)
  const totalDesktops = useStore((s) => s.totalDesktops)

  const commands = useMemo(() => {
    const result: Command[] = []
    
    appRegistry.forEach((app) => {
      result.push({
        id: `app-${app.id}`,
        name: app.name,
        description: '打开 ' + app.name,
        icon: app.icon,
        category: '应用',
        priority: 100,
        action: () => openApp(app.id)
      })
    })

    result.push({
      id: 'theme-toggle',
      name: '切换主题',
      description: theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题',
      icon: <SettingsIcon />,
      category: '系统',
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark')
    })

    for (let i = 1; i <= totalDesktops; i++) {
      result.push({
        id: `desktop-${i}`,
        name: `切换到桌面 ${i}`,
        description: i === currentDesktop ? '当前桌面' : '切换到桌面 ' + i,
        icon: <ActivityIcon />,
        category: '桌面',
        action: () => switchDesktop(i)
      })
    }

    result.push({
      id: 'add-desktop',
      name: '添加新桌面',
      description: '创建一个新的虚拟桌面',
      icon: <FileTextIcon />,
      category: '桌面',
      action: () => addDesktop()
    })

    if (totalDesktops > 1) {
      result.push({
        id: 'remove-desktop',
        name: '删除当前桌面',
        description: '删除当前虚拟桌面',
        icon: <FileTextIcon />,
        category: '桌面',
        action: () => removeDesktop(currentDesktop)
      })
    }

    const currentWindows = windowsPerDesktop[currentDesktop] || []
    currentWindows.forEach((windowId) => {
      const win = windows.find(w => w.id === windowId)
      if (win) {
        const app = appRegistry.find(a => a.id === win.appId)
        result.push({
          id: `window-${win.id}`,
          name: `聚焦 ${win.title}`,
          description: '聚焦到 ' + win.title,
          icon: app?.icon || <ActivityIcon />,
          category: '窗口',
          priority: 90,
          action: () => focusWindow(win.id)
        })
      }
    })

    return result
  }, [openApp, setTheme, theme, windows, focusWindow, windowsPerDesktop, currentDesktop, switchDesktop, addDesktop, removeDesktop, totalDesktops])

  const filteredCommands = useMemo(() => {
    if (!searchQuery) return commands
    const query = searchQuery.toLowerCase()
    return commands.filter(cmd => 
      cmd.name.toLowerCase().includes(query) ||
      cmd.description.toLowerCase().includes(query) ||
      cmd.category.toLowerCase().includes(query)
    ).sort((a, b) => {
      const aPriority = a.priority || 0
      const bPriority = b.priority || 0
      return bPriority - aPriority
    })
  }, [commands, searchQuery])

  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  useEffect(() => {
    if (listRef.current && listRef.current.children[selectedIndex]) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement
      selectedElement.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setSearchQuery('')
    }
  }, [isOpen])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          Math.min(prev + 1, filteredCommands.length - 1)
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
          onClose()
        }
        break
    }
  }, [isOpen, onClose, filteredCommands, selectedIndex])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[15vh] z-[99999"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[600px] bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            placeholder="输入命令..."
            className="flex-1 bg-transparent border-none outline-none text-slate-200 text-lg placeholder-slate-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span className="px-1.5 py-0.5 border border-slate-700 rounded">↑↓</span>
            <span>导航</span>
            <span className="px-1.5 py-0.5 border border-slate-700 rounded ml-2">↵</span>
            <span>执行</span>
            <span className="px-1.5 py-0.5 border border-slate-700 rounded ml-2">Esc</span>
            <span>关闭</span>
          </div>
        </div>
        <div 
          ref={listRef}
          className="max-h-[400px] overflow-y-auto p-2"
        >
          {filteredCommands.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <SearchIcon />
              <span className="mt-2">未找到匹配的命令</span>
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <div
                key={cmd.id}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  index === selectedIndex 
                    ? 'bg-blue-600/20 border border-blue-500/30' 
                    : 'hover:bg-slate-700/50 hover:border border-transparent'
                }`}
                onClick={() => {
                  cmd.action()
                  onClose()
                }}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-700/50">
                  {cmd.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-200">{cmd.name}</div>
                  <div className="text-sm text-slate-400">{cmd.description}</div>
                </div>
                <div className="text-xs text-slate-500 bg-slate-700/70 px-2 py-0.5 rounded">
                  {cmd.category}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
