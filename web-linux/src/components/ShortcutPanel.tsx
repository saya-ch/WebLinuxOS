import { useState, useEffect, memo } from 'react'

interface ShortcutItem {
  keys: string
  description: string
  category: string
}

const allShortcuts: ShortcutItem[] = [
  { keys: 'Ctrl + T', description: '打开终端', category: '应用' },
  { keys: 'Ctrl + E', description: '打开文件管理器', category: '应用' },
  { keys: 'Ctrl + B', description: '打开浏览器', category: '应用' },
  { keys: 'Ctrl + G', description: '打开代码编辑器', category: '应用' },
  { keys: 'Ctrl + P', description: '打开画图工具', category: '应用' },
  { keys: 'Ctrl + I', description: '打开图片查看器', category: '应用' },
  { keys: 'Ctrl + S', description: '打开系统监视器', category: '应用' },
  { keys: 'Ctrl + H', description: '打开帮助', category: '应用' },
  { keys: 'Ctrl + ,', description: '打开设置', category: '应用' },
  { keys: 'Ctrl + 1-9', description: '切换到对应编号的应用', category: '应用' },
  { keys: 'Ctrl + Shift + C', description: '打开计算器', category: '应用' },
  { keys: 'Ctrl + Shift + E', description: '打开文本编辑器', category: '应用' },
  { keys: 'Ctrl + Shift + N', description: '打开笔记', category: '应用' },
  { keys: 'Ctrl + Shift + D', description: '打开日历', category: '应用' },
  { keys: 'Ctrl + Shift + M', description: '打开音乐播放器', category: '应用' },
  { keys: 'Ctrl + Shift + W', description: '打开天气', category: '应用' },
  { keys: 'Ctrl + Shift + I', description: '打开摄像头', category: '应用' },
  { keys: 'Ctrl + Shift + O', description: '打开密码管理器', category: '应用' },
  { keys: 'Ctrl + Q', description: '关闭当前窗口', category: '窗口' },
  { keys: 'Ctrl + M', description: '最小化窗口', category: '窗口' },
  { keys: 'Ctrl + Shift + M', description: '最大化窗口', category: '窗口' },
  { keys: 'Alt + Tab', description: '切换窗口', category: '窗口' },
  { keys: 'Ctrl + Alt + Tab', description: '循环切换窗口', category: '窗口' },
  { keys: 'F11', description: '全屏模式', category: '系统' },
  { keys: 'PrintScreen', description: '截图', category: '系统' },
  { keys: 'Ctrl + K', description: '全局搜索', category: '系统' },
  { keys: 'Ctrl + P', description: '命令面板', category: '系统' },
  { keys: 'Ctrl + L', description: '锁屏', category: '系统' },
  { keys: 'Ctrl + N', description: '通知中心', category: '系统' },
  { keys: 'Super', description: '打开启动器', category: '系统' },
  { keys: 'Escape', description: '关闭弹窗/取消操作', category: '通用' },
]

const ShortcutPanel = memo(function ShortcutPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setFilter('')
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const filteredShortcuts = allShortcuts.filter(
    item =>
      item.description.toLowerCase().includes(filter.toLowerCase()) ||
      item.keys.toLowerCase().includes(filter.toLowerCase()) ||
      item.category.toLowerCase().includes(filter.toLowerCase())
  )

  const groupedShortcuts = filteredShortcuts.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, ShortcutItem[]>)

  if (!isOpen) return null

  return (
    <div className="shortcut-panel-overlay" onClick={onClose}>
      <div className="shortcut-panel" onClick={e => e.stopPropagation()}>
        <div className="shortcut-panel-header">
          <div className="shortcut-panel-title">
            ⌨️ 快捷键参考
          </div>
          <button className="shortcut-panel-close" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="shortcut-panel-search">
          <input
            type="text"
            placeholder="搜索快捷键..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="shortcut-panel-search-input"
            autoFocus
          />
        </div>

        <div className="shortcut-panel-content">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category} className="shortcut-panel-section">
              <div className="shortcut-panel-section-title">{category}</div>
              <div className="shortcut-panel-items">
                {shortcuts.map((item, index) => (
                  <div key={index} className="shortcut-panel-item">
                    <div className="shortcut-panel-item-keys">
                      {item.keys.split(' + ').map((keyPart, i) => (
                        <span key={i} className="shortcut-key">
                          {keyPart}
                        </span>
                      ))}
                    </div>
                    <div className="shortcut-panel-item-description">
                      {item.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcut-panel-footer">
          <span>按 Escape 关闭</span>
        </div>
      </div>
    </div>
  )
})

export default ShortcutPanel