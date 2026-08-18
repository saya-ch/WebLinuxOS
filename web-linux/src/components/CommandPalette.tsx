import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useStore } from '../store'
import { appRegistry } from '../apps'
import { SearchIcon, FileTextIcon, SettingsIcon, ActivityIcon, ClockIcon, StarIcon } from '../icons'

interface Command {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
  action: () => void
  priority?: number
  shortcut?: string
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

// 最近使用命令记录存储 key
const RECENT_COMMANDS_KEY = 'weblinux-recent-commands'
const MAX_RECENT_COMMANDS = 8

function loadRecentCommands(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_COMMANDS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.slice(0, MAX_RECENT_COMMANDS)
    }
  } catch { /* 忽略解析错误 */ }
  return []
}

function saveRecentCommands(ids: string[]) {
  try {
    localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(ids.slice(0, MAX_RECENT_COMMANDS)))
  } catch { /* 忽略存储错误 */ }
}

// 分类到 CSS 类名的映射
function getCategoryClass(category: string): string {
  switch (category) {
    case '应用': return 'command-palette-category-app'
    case '系统': return 'command-palette-category-system'
    case '桌面': return 'command-palette-category-desktop'
    case '窗口': return 'command-palette-category-window'
    default: return 'command-palette-category-app'
  }
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentCommandIds, setRecentCommandIds] = useState<string[]>(loadRecentCommands)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
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

    // 防御性过滤：跳过 appRegistry 中可能的 undefined/null 条目，避免 reading 'id' 崩溃
    ;(appRegistry || []).forEach((app) => {
      if (!app || !app.id || !app.name) return
      result.push({
        id: `app-${app.id}`,
        name: app.name,
        description: '打开 ' + app.name,
        icon: app.icon,
        category: '应用',
        priority: 100,
        action: () => openApp(app.id),
        shortcut: undefined,
      })
    })

    result.push({
      id: 'theme-toggle',
      name: '切换主题',
      description: theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题',
      icon: <SettingsIcon />,
      category: '系统',
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      shortcut: 'Ctrl+Shift+T',
    })

    for (let i = 1; i <= totalDesktops; i++) {
      result.push({
        id: `desktop-${i}`,
        name: `切换到桌面 ${i}`,
        description: i === currentDesktop ? '当前桌面' : '切换到桌面 ' + i,
        icon: <ActivityIcon />,
        category: '桌面',
        action: () => switchDesktop(i),
        shortcut: i <= 9 ? `Ctrl+${i}` : undefined,
      })
    }

    result.push({
      id: 'add-desktop',
      name: '添加新桌面',
      description: '创建一个新的虚拟桌面',
      icon: <FileTextIcon />,
      category: '桌面',
      action: () => addDesktop(),
    })

    if (totalDesktops > 1) {
      result.push({
        id: 'remove-desktop',
        name: '删除当前桌面',
        description: '删除当前虚拟桌面',
        icon: <FileTextIcon />,
        category: '桌面',
        action: () => removeDesktop(currentDesktop),
      })
    }

    const currentWindows = windowsPerDesktop[currentDesktop] || []
    currentWindows.forEach((windowId) => {
      const win = (windows || []).find((w: any) => w && w.id === windowId)
      if (win) {
        const app = (appRegistry || []).find((a: any) => a && a.id === win.appId)
        result.push({
          id: `window-${win.id}`,
          name: `聚焦 ${win.title}`,
          description: '聚焦到 ' + win.title,
          icon: app?.icon || <ActivityIcon />,
          category: '窗口',
          priority: 90,
          action: () => focusWindow(win.id),
        })
      }
    })

    return result
  }, [openApp, setTheme, theme, windows, focusWindow, windowsPerDesktop, currentDesktop, switchDesktop, addDesktop, removeDesktop, totalDesktops])

  // 获取所有分类
  const allCategories = useMemo(() => {
    const cats = new Set<string>()
    commands.forEach(cmd => cats.add(cmd.category))
    return Array.from(cats)
  }, [commands])

  const filteredCommands = useMemo(() => {
    let result = commands

    // 按分类筛选
    if (activeCategory) {
      result = result.filter(cmd => cmd.category === activeCategory)
    }

    if (!searchQuery) {
      // 无搜索词时，最近使用的命令排在前面
      return result.sort((a, b) => {
        const aRecent = recentCommandIds.indexOf(a.id)
        const bRecent = recentCommandIds.indexOf(b.id)
        // 最近使用的排前面
        if (aRecent !== -1 && bRecent !== -1) return aRecent - bRecent
        if (aRecent !== -1) return -1
        if (bRecent !== -1) return 1
        const aPriority = a.priority || 0
        const bPriority = b.priority || 0
        if (aPriority !== bPriority) return bPriority - aPriority
        return a.name.localeCompare(b.name)
      })
    }

    const query = searchQuery.toLowerCase()
    const queryWords = query.split(/\s+/).filter(Boolean)

    const matchesQuery = (cmd: Command): { score: number; matches: boolean } => {
      const name = cmd.name.toLowerCase()
      const desc = cmd.description.toLowerCase()
      const cat = cmd.category.toLowerCase()

      let score = 0
      const fullText = `${name} ${desc} ${cat}`

      for (const word of queryWords) {
        if (name === word) score += 100
        else if (name.startsWith(word)) score += 50
        else if (name.includes(word)) score += 30
        else if (desc.includes(word)) score += 15
        else if (cat.includes(word)) score += 10
        else if (fullText.includes(word)) score += 5
        else return { score: 0, matches: false }
      }

      // 最近使用的额外加分
      if (recentCommandIds.includes(cmd.id)) {
        score += 20
      }

      return { score, matches: true }
    }

    return result
      .map(cmd => ({ cmd, ...matchesQuery(cmd) }))
      .filter(item => item.matches)
      .sort((a, b) => {
        const aPriority = a.cmd.priority || 0
        const bPriority = b.cmd.priority || 0
        if (aPriority !== bPriority) return bPriority - aPriority
        if (a.score !== b.score) return a.score - b.score
        return a.cmd.name.localeCompare(b.cmd.name)
      })
      .map(item => item.cmd)
  }, [commands, searchQuery, activeCategory, recentCommandIds])

  // 执行命令时记录到最近使用
  const executeCommand = useCallback((cmd: Command) => {
    cmd.action()
    setRecentCommandIds(prev => {
      const next = [cmd.id, ...prev.filter(id => id !== cmd.id)].slice(0, MAX_RECENT_COMMANDS)
      saveRecentCommands(next)
      return next
    })
    onClose()
  }, [onClose])

  useEffect(() => {
    setSelectedIndex(() => 0)
  }, [searchQuery, activeCategory])

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
      setActiveCategory(null)
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
          executeCommand(filteredCommands[selectedIndex])
        }
        break
      case 'Tab':
        e.preventDefault()
        // Tab 键切换分类
        if (e.shiftKey) {
          setActiveCategory(prev => {
            if (!prev) return allCategories[allCategories.length - 1]
            const idx = allCategories.indexOf(prev)
            return allCategories[(idx - 1 + allCategories.length) % allCategories.length]
          })
        } else {
          setActiveCategory(prev => {
            if (!prev) return allCategories[0]
            const idx = allCategories.indexOf(prev)
            return allCategories[(idx + 1) % allCategories.length]
          })
        }
        break
    }
  }, [isOpen, onClose, filteredCommands, selectedIndex, executeCommand, allCategories])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[15vh] z-[99999]"
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
            <span className="command-palette-shortcut">↑↓</span>
            <span>导航</span>
            <span className="command-palette-shortcut ml-2">↵</span>
            <span>执行</span>
            <span className="command-palette-shortcut ml-2">Tab</span>
            <span>分类</span>
            <span className="command-palette-shortcut ml-2">Esc</span>
            <span>关闭</span>
          </div>
        </div>

        {/* 分类标签栏 */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-700/30 overflow-x-auto">
          <button
            className={`command-palette-category-badge ${!activeCategory ? 'command-palette-category-app' : ''}`}
            style={{ opacity: !activeCategory ? 1 : 0.5, cursor: 'pointer', background: !activeCategory ? undefined : 'rgba(255,255,255,0.05)' }}
            onClick={() => setActiveCategory(null)}
          >
            全部
          </button>
          {allCategories.map(cat => (
            <button
              key={cat}
              className={`command-palette-category-badge ${activeCategory === cat ? getCategoryClass(cat) : ''}`}
              style={{ opacity: activeCategory === cat ? 1 : 0.5, cursor: 'pointer', background: activeCategory === cat ? undefined : 'rgba(255,255,255,0.05)' }}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            >
              {cat}
            </button>
          ))}
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
            filteredCommands.map((cmd, index) => {
              const isRecent = recentCommandIds.includes(cmd.id)
              return (
                <div
                  key={cmd.id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    index === selectedIndex
                      ? 'bg-blue-600/20 border border-blue-500/30'
                      : 'hover:bg-slate-700/50 hover:border border-transparent'
                  }`}
                  onClick={() => executeCommand(cmd)}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-700/50 flex-shrink-0">
                    {cmd.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-200 flex items-center gap-2">
                      {cmd.name}
                      {isRecent && (
                        <span className="command-palette-recent-badge">
                          <ClockIcon size={9} style={{ marginRight: 2, verticalAlign: 'middle' }} />
                          最近
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-400 truncate">{cmd.description}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`command-palette-category-badge ${getCategoryClass(cmd.category)}`}>
                      {cmd.category}
                    </span>
                    {cmd.shortcut && (
                      <span className="command-palette-shortcut">{cmd.shortcut}</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* 底部提示 */}
        <div className="px-4 py-2 border-t border-slate-700/30 flex items-center justify-between text-xs text-slate-500">
          <span>{filteredCommands.length} 条命令</span>
          <div className="flex items-center gap-3">
            {recentCommandIds.length > 0 && (
              <button
                className="flex items-center gap-1 hover:text-slate-300 transition-colors"
                onClick={() => {
                  setRecentCommandIds([])
                  saveRecentCommands([])
                }}
              >
                <ClockIcon size={11} /> 清除历史
              </button>
            )}
            <span className="flex items-center gap-1">
              <StarIcon size={11} /> 按 Tab 切换分类
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
