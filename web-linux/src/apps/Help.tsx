import { useState, useMemo } from 'react'
import { useStore } from '../store'

// ============ 数据定义 ============

const quickStart = [
  {
    title: '基本操作',
    icon: '🖱️',
    steps: [
      '双击桌面图标启动应用',
      '拖动窗口标题栏移动窗口位置',
      '拖拽窗口边缘调整窗口大小',
      '使用标题栏按钮 最小化 / 最大化 / 关闭窗口',
      '右键桌面打开上下文菜单',
    ],
  },
  {
    title: '应用启动',
    icon: '🚀',
    steps: [
      '点击左下角启动器图标或按 Super 键打开应用菜单',
      '在搜索栏中输入应用名称快速定位',
      '使用任务栏快速启动已固定的应用',
      '通过终端输入应用名启动（如 terminal、files）',
    ],
  },
  {
    title: '文件管理',
    icon: '📁',
    steps: [
      '使用文件管理器浏览虚拟文件系统',
      '支持创建、删除、重命名、复制、移动文件和文件夹',
      '双击文件可用关联应用打开',
      '重要文件建议导出备份（数据存储在浏览器 localStorage 中）',
    ],
  },
  {
    title: '桌面切换',
    icon: '🖥️',
    steps: [
      '点击任务栏右侧的桌面指示器切换虚拟桌面',
      '使用快捷键在不同桌面间快速切换',
      '每个桌面可独立管理窗口布局',
      '支持最多 9 个虚拟桌面',
    ],
  },
]

const shortcuts: Record<string, { keys: string; desc: string }[]> = {
  '窗口管理': [
    { keys: 'Super', desc: '打开/关闭应用启动器' },
    { keys: 'Alt + Tab', desc: '切换窗口焦点' },
    { keys: 'Alt + F4', desc: '关闭当前窗口' },
    { keys: 'Super + D', desc: '显示桌面（最小化所有窗口）' },
    { keys: 'Super + ←/→', desc: '窗口靠左/靠右分屏' },
    { keys: 'Super + ↑', desc: '最大化当前窗口' },
    { keys: 'Super + ↓', desc: '还原/最小化当前窗口' },
    { keys: 'Ctrl + Q', desc: '关闭当前应用' },
  ],
  '桌面切换': [
    { keys: 'Ctrl + Alt + ←/→', desc: '切换到上一个/下一个桌面' },
    { keys: 'Ctrl + Alt + 1~9', desc: '切换到指定编号的桌面' },
    { keys: 'Super + Shift + ←/→', desc: '将当前窗口移动到相邻桌面' },
  ],
  '应用快捷键': [
    { keys: 'Super + T', desc: '打开终端' },
    { keys: 'Super + E', desc: '打开文件管理器' },
    { keys: 'Super + B', desc: '打开浏览器' },
    { keys: 'Super + S', desc: '打开设置' },
    { keys: 'F11', desc: '全屏模式切换' },
  ],
  '终端快捷键': [
    { keys: 'Ctrl + C', desc: '中断当前命令' },
    { keys: 'Ctrl + L', desc: '清屏' },
    { keys: 'Ctrl + Shift + C', desc: '复制选中内容' },
    { keys: 'Ctrl + Shift + V', desc: '粘贴内容' },
    { keys: '↑ / ↓', desc: '浏览历史命令' },
    { keys: 'Tab', desc: '自动补全' },
    { keys: 'Ctrl + R', desc: '搜索历史命令' },
    { keys: 'Ctrl + A', desc: '光标移动到行首' },
    { keys: 'Ctrl + E', desc: '光标移动到行尾' },
    { keys: 'Ctrl + W', desc: '删除光标前一个单词' },
    { keys: 'Ctrl + U', desc: '删除光标前所有内容' },
    { keys: 'Ctrl + K', desc: '删除光标后所有内容' },
  ],
  '通用快捷键': [
    { keys: 'Ctrl + C', desc: '复制（应用中）' },
    { keys: 'Ctrl + V', desc: '粘贴' },
    { keys: 'Ctrl + X', desc: '剪切' },
    { keys: 'Ctrl + Z', desc: '撤销' },
    { keys: 'Ctrl + S', desc: '保存' },
    { keys: 'Ctrl + A', desc: '全选' },
    { keys: 'Ctrl + F', desc: '搜索' },
    { keys: 'Esc', desc: '关闭弹窗/取消操作' },
  ],
}

const coreApps = [
  { name: '终端', icon: '⬛', desc: '功能完整的终端模拟器，支持 50+ 命令和 Python 运行时' },
  { name: '文件管理器', icon: '📁', desc: '双栏布局文件浏览器，支持完整文件操作' },
  { name: '代码编辑器', icon: '💻', desc: '支持语法高亮的多语言代码编辑器' },
  { name: '浏览器', icon: '🌐', desc: '内置轻量级浏览器，支持多标签页' },
  { name: '文本编辑器', icon: '📝', desc: '简洁高效的纯文本编辑工具' },
  { name: '系统监视器', icon: '📊', desc: '实时监控 CPU、内存、网络等系统资源' },
  { name: '设置', icon: '⚙️', desc: '系统外观、壁纸、主题等偏好设置' },
  { name: '计算器', icon: '🔢', desc: '支持科学计算的表达式计算器' },
  { name: '画图', icon: '🎨', desc: '简易绘图工具，支持多种画笔和形状' },
  { name: '图片查看器', icon: '🖼️', desc: '支持常见图片格式的查看器' },
  { name: '音乐播放器', icon: '🎵', desc: '本地音乐播放，支持播放列表' },
  { name: '日历', icon: '📅', desc: '月视图日历，支持事件管理' },
  { name: '天气', icon: '🌤️', desc: '实时天气查询与预报展示' },
  { name: '截图工具', icon: '📸', desc: '屏幕、窗口或区域截图' },
  { name: '密码管理器', icon: '🔐', desc: '安全存储和管理密码' },
  { name: 'PDF 查看器', icon: '📄', desc: '查看 PDF 文档内容' },
  { name: '电子表格', icon: '📊', desc: '类似 Excel 的表格处理工具' },
  { name: '演示文稿', icon: '📽️', desc: '创建和展示幻灯片' },
  { name: '软件中心', icon: '🛒', desc: '浏览和安装更多应用' },
  { name: '帮助', icon: '❓', desc: '系统帮助文档和使用指南（就是本应用）' },
]

const terminalCommands: Record<string, { cmd: string; desc: string; usage: string }[]> = {
  '文件操作': [
    { cmd: 'ls', desc: '列出目录内容', usage: 'ls [路径]' },
    { cmd: 'cd', desc: '切换目录', usage: 'cd <路径>' },
    { cmd: 'pwd', desc: '显示当前目录', usage: 'pwd' },
    { cmd: 'cat', desc: '显示文件内容', usage: 'cat <文件>' },
    { cmd: 'mkdir', desc: '创建目录', usage: 'mkdir <目录名>' },
    { cmd: 'rm', desc: '删除文件/目录', usage: 'rm [-r] <路径>' },
    { cmd: 'cp', desc: '复制文件', usage: 'cp <源> <目标>' },
    { cmd: 'mv', desc: '移动/重命名文件', usage: 'mv <源> <目标>' },
    { cmd: 'touch', desc: '创建空文件', usage: 'touch <文件名>' },
    { cmd: 'find', desc: '搜索文件', usage: 'find <路径> <名称>' },
    { cmd: 'grep', desc: '文本搜索', usage: 'grep <模式> <文件>' },
    { cmd: 'echo', desc: '输出文本', usage: 'echo <内容>' },
  ],
  '系统信息': [
    { cmd: 'uname', desc: '显示系统信息', usage: 'uname [-a]' },
    { cmd: 'whoami', desc: '显示当前用户', usage: 'whoami' },
    { cmd: 'date', desc: '显示日期时间', usage: 'date' },
    { cmd: 'uptime', desc: '显示运行时间', usage: 'uptime' },
    { cmd: 'hostname', desc: '显示主机名', usage: 'hostname' },
  ],
  '进程管理': [
    { cmd: 'ps', desc: '查看进程列表', usage: 'ps' },
    { cmd: 'top', desc: '实时进程监控', usage: 'top' },
    { cmd: 'kill', desc: '终止进程', usage: 'kill <PID>' },
  ],
  '磁盘/网络': [
    { cmd: 'df', desc: '磁盘使用情况', usage: 'df [-h]' },
    { cmd: 'free', desc: '内存使用情况', usage: 'free [-h]' },
    { cmd: 'ping', desc: '网络连通测试', usage: 'ping <主机>' },
    { cmd: 'ifconfig', desc: '网络接口信息', usage: 'ifconfig' },
  ],
  '其他': [
    { cmd: 'clear', desc: '清屏', usage: 'clear' },
    { cmd: 'history', desc: '命令历史', usage: 'history' },
    { cmd: 'help', desc: '显示帮助信息', usage: 'help' },
    { cmd: 'apps', desc: '列出所有应用', usage: 'apps' },
    { cmd: 'version', desc: '显示版本号', usage: 'version' },
    { cmd: 'neofetch', desc: '系统信息展示', usage: 'neofetch' },
    { cmd: 'tree', desc: '目录树展示', usage: 'tree [路径]' },
    { cmd: 'wc', desc: '统计字数行数', usage: 'wc <文件>' },
    { cmd: 'head', desc: '显示文件头部', usage: 'head [-n N] <文件>' },
    { cmd: 'tail', desc: '显示文件尾部', usage: 'tail [-n N] <文件>' },
    { cmd: 'sort', desc: '排序', usage: 'sort <文件>' },
    { cmd: 'chmod', desc: '修改权限（模拟）', usage: 'chmod <权限> <文件>' },
    { cmd: 'python', desc: '启动 Python 运行时', usage: 'python' },
  ],
}

const faq = [
  {
    q: '如何安装新的应用程序？',
    a: '打开"软件中心"应用，浏览或搜索您需要的应用，点击"安装"按钮即可。安装完成后应用会出现在启动器中。',
  },
  {
    q: '我的数据会丢失吗？',
    a: '数据存储在浏览器 localStorage 中，清除浏览器数据会导致数据丢失。建议定期使用备份工具导出重要文件，或使用浏览器的持久化存储功能。',
  },
  {
    q: '支持哪些浏览器？',
    a: '推荐使用最新版 Chrome、Edge、Firefox 或 Safari。需要支持 ES2022+、Canvas API 和 WebGL。Chrome 体验最佳。',
  },
  {
    q: '如何在终端运行 Python？',
    a: '在终端中输入 python 命令即可启动 Pyodide Python 运行时。首次启动需要下载运行时文件，请耐心等待。',
  },
  {
    q: '如何截图？',
    a: '打开"截图工具"应用，选择截图模式（全屏/窗口/区域），点击截取按钮。截图后可保存到虚拟文件系统或下载。',
  },
  {
    q: '如何切换深色/浅色主题？',
    a: '打开"设置"应用，在"外观"选项中切换主题。也可以使用终端命令 theme dark 或 theme light 切换。',
  },
  {
    q: '终端支持哪些命令？',
    a: '终端支持 50+ 常用 Linux 命令，包括文件操作、系统信息、进程管理等。输入 help 查看完整列表。',
  },
  {
    q: '如何自定义壁纸？',
    a: '在桌面右键选择"更换壁纸"，或在"设置"应用中选择静态壁纸或动态壁纸。支持自定义图片 URL。',
  },
  {
    q: '性能不佳怎么办？',
    a: '尝试关闭不需要的窗口、关闭动态壁纸、减少虚拟桌面数量。推荐使用 Chrome 浏览器获得最佳性能。',
  },
  {
    q: '可以和其他人共享我的桌面吗？',
    a: 'WebLinuxOS 运行在本地浏览器中，数据不会上传到服务器。您可以分享项目 URL 让他人体验相同的系统。',
  },
]

const changelog = [
  { version: 'v36.0', date: '2026-07-15', changes: '全新系统信息面板与帮助中心，实时性能监控，GPU 检测，浏览器 UA 智能解析' },
  { version: 'v6.3', date: '2026-07-01', changes: '增强前端设计，独特字体和精致动画效果，流畅微交互和视觉效果' },
  { version: 'v6.2', date: '2026-06-19', changes: 'CI/CD 自动化部署优化，代码质量和结构改进，性能优化' },
  { version: 'v4.5', date: '2026-05-29', changes: '全面代码优化，响应式设计改进，UI/UX 优化，安全性增强' },
  { version: 'v3.7', date: '2026-05-26', changes: '代码差异查看器，图片优化器，网络速度测试，界面优化' },
]

// ============ 主组件 ============

export default function Help() {
  const [tab, setTab] = useState<'quickstart' | 'shortcuts' | 'apps' | 'terminal' | 'faq' | 'changelog'>('quickstart')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [shortcutCategory, setShortcutCategory] = useState<string>(Object.keys(shortcuts)[0])
  const [terminalCategory, setTerminalCategory] = useState<string>(Object.keys(terminalCommands)[0])

  const theme = useStore(s => s.theme)
  const isDark = theme === 'dark'

  const s = {
    bg: isDark ? 'var(--color-surface)' : 'var(--color-surface)',
    cardBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    textPrimary: isDark ? 'var(--text-primary)' : 'var(--text-primary)',
    textSecondary: isDark ? 'var(--text-secondary)' : 'var(--text-secondary)',
    accent: 'var(--accent)',
    accentBg: 'var(--accent-bg)',
    codeBg: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)',
    tabActive: isDark ? 'rgba(124,108,240,0.15)' : 'rgba(91,76,216,0.08)',
    hoverBg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    success: isDark ? '#a6e3a1' : '#059669',
  }

  const tabList = [
    { key: 'quickstart' as const, label: '快速入门', icon: '🚀' },
    { key: 'shortcuts' as const, label: '快捷键', icon: '⌨️' },
    { key: 'apps' as const, label: '核心应用', icon: '📦' },
    { key: 'terminal' as const, label: '终端命令', icon: '⬛' },
    { key: 'faq' as const, label: '常见问题', icon: '❓' },
    { key: 'changelog' as const, label: '更新日志', icon: '📋' },
  ]

  // 搜索过滤
  const filteredApps = useMemo(() => {
    if (!searchQuery) return coreApps
    const q = searchQuery.toLowerCase()
    return coreApps.filter(a => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q))
  }, [searchQuery])

  const filteredCommands = useMemo(() => {
    if (!searchQuery) return terminalCommands
    const q = searchQuery.toLowerCase()
    const result: Record<string, Array<{ cmd: string; desc: string; usage: string }>> = {}
    for (const [cat, cmds] of Object.entries(terminalCommands)) {
      const filtered = cmds.filter(c => c.cmd.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q))
      if (filtered.length > 0) result[cat] = filtered
    }
    return result
  }, [searchQuery])

  const filteredShortcuts = useMemo(() => {
    if (!searchQuery) return shortcuts
    const q = searchQuery.toLowerCase()
    const result: Record<string, Array<{ keys: string; desc: string }>> = {}
    for (const [cat, items] of Object.entries(shortcuts)) {
      const filtered = items.filter(item => item.keys.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q))
      if (filtered.length > 0) result[cat] = filtered
    }
    return result
  }, [searchQuery])

  const filteredFaq = useMemo(() => {
    if (!searchQuery) return faq
    const q = searchQuery.toLowerCase()
    return faq.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
  }, [searchQuery])

  const hasSearch = searchQuery.length > 0

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: s.bg,
      color: s.textPrimary,
    }}>
      {/* 顶部搜索 + 标签 */}
      <div style={{
        padding: '12px 16px 0',
        borderBottom: `1px solid ${s.border}`,
      }}>
        {/* 搜索栏 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          background: s.cardBg,
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${s.border}`,
          marginBottom: '12px',
        }}>
          <span style={{ fontSize: '13px', opacity: 0.6 }}>🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索快捷键、应用、命令..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: s.textPrimary,
              fontSize: '13px',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: s.textSecondary,
                cursor: 'pointer',
                fontSize: '14px',
                padding: '2px 4px',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* 标签栏 */}
        <div style={{ display: 'flex', overflowX: 'auto' }}>
          {tabList.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: '1 0 auto',
                padding: '8px 10px',
                border: 'none',
                cursor: 'pointer',
                background: tab === t.key ? s.tabActive : 'transparent',
                color: tab === t.key ? s.accent : s.textSecondary,
                fontSize: '11px',
                fontWeight: tab === t.key ? 600 : 400,
                borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '12px' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* ====== 快速入门 ====== */}
        {(tab === 'quickstart' || hasSearch) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {!hasSearch && (
              <div style={{
                padding: '14px 18px',
                background: `linear-gradient(135deg, ${isDark ? 'rgba(124,108,240,0.12)' : 'rgba(91,76,216,0.06)'} 0%, ${isDark ? 'rgba(0,214,193,0.06)' : 'rgba(14,165,160,0.04)'} 100%)`,
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${s.border}`,
              }}>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  👋 欢迎使用 WebLinuxOS
                </div>
                <div style={{ fontSize: '12px', color: s.textSecondary, lineHeight: 1.7 }}>
                  WebLinuxOS 是一个运行在浏览器中的 Linux 桌面环境。它提供了丰富的系统工具、办公应用、开发工具和游戏。所有数据存储在浏览器本地，无需安装任何软件。
                </div>
              </div>
            )}
            {quickStart.map(section => (
              <div key={section.title} style={{
                background: s.cardBg,
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${s.border}`,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '12px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: s.accent,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderBottom: `1px solid ${s.border}`,
                }}>
                  <span>{section.icon}</span> {section.title}
                </div>
                <div style={{ padding: '4px 0' }}>
                  {section.steps.map((step, i) => (
                    <div key={i} style={{
                      padding: '8px 16px 8px 36px',
                      fontSize: '12px',
                      color: s.textSecondary,
                      lineHeight: 1.6,
                      position: 'relative',
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: '16px',
                        color: s.accent,
                        fontWeight: 600,
                        fontSize: '11px',
                      }}>{i + 1}.</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ====== 快捷键 ====== */}
        {(tab === 'shortcuts' || hasSearch) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 分类选择 */}
            {!hasSearch && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {Object.keys(shortcuts).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setShortcutCategory(cat)}
                    style={{
                      padding: '5px 12px',
                      border: `1px solid ${shortcutCategory === cat ? 'var(--accent)' : s.border}`,
                      borderRadius: 'var(--radius-sm)',
                      background: shortcutCategory === cat ? s.accentBg : 'transparent',
                      color: shortcutCategory === cat ? s.accent : s.textSecondary,
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: shortcutCategory === cat ? 600 : 400,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* 快捷键表 */}
            {(hasSearch ? Object.entries(filteredShortcuts) : [[shortcutCategory, (filteredShortcuts as typeof shortcuts)[shortcutCategory]] as const])
              .filter(([, items]) => items && items.length > 0)
              .map(([cat, items]) => (
                <div key={cat} style={{
                  background: s.cardBg,
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${s.border}`,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '10px 16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: s.accent,
                    borderBottom: `1px solid ${s.border}`,
                    background: s.hoverBg,
                  }}>
                    {cat}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    {items!.map((item, i) => (
                      <tr key={i} style={{ borderBottom: i < items!.length - 1 ? `1px solid ${s.border}` : 'none' }}>
                        <td style={{ padding: '8px 16px', width: '180px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: s.codeBg,
                            color: s.accent,
                            border: `1px solid ${s.border}`,
                          }}>
                            {item.keys}
                          </span>
                        </td>
                        <td style={{ padding: '8px 16px', fontSize: '12px', color: s.textSecondary }}>
                          {item.desc}
                        </td>
                      </tr>
                    ))}
                  </table>
                </div>
              ))}
          </div>
        )}

        {/* ====== 核心应用 ====== */}
        {(tab === 'apps' || hasSearch) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '10px',
          }}>
            {filteredApps.map(app => (
              <div key={app.name} style={{
                background: s.cardBg,
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${s.border}`,
                padding: '14px 16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: '24px', lineHeight: 1, flexShrink: 0 }}>{app.icon}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: s.textPrimary, marginBottom: '4px' }}>{app.name}</div>
                  <div style={{ fontSize: '11px', color: s.textSecondary, lineHeight: 1.5 }}>{app.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ====== 终端命令 ====== */}
        {(tab === 'terminal' || hasSearch) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 分类选择 */}
            {!hasSearch && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {Object.keys(terminalCommands).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setTerminalCategory(cat)}
                    style={{
                      padding: '5px 12px',
                      border: `1px solid ${terminalCategory === cat ? 'var(--accent)' : s.border}`,
                      borderRadius: 'var(--radius-sm)',
                      background: terminalCategory === cat ? s.accentBg : 'transparent',
                      color: terminalCategory === cat ? s.accent : s.textSecondary,
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: terminalCategory === cat ? 600 : 400,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* 命令表 */}
            {(hasSearch ? Object.entries(filteredCommands) : [[terminalCategory, (filteredCommands as typeof terminalCommands)[terminalCategory]] as const])
              .filter(([, cmds]) => cmds && cmds.length > 0)
              .map(([cat, cmds]) => (
                <div key={cat} style={{
                  background: s.cardBg,
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${s.border}`,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '10px 16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: s.accent,
                    borderBottom: `1px solid ${s.border}`,
                    background: s.hoverBg,
                  }}>
                    {cat}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    {cmds!.map((cmd, i) => (
                      <tr key={i} style={{ borderBottom: i < cmds!.length - 1 ? `1px solid ${s.border}` : 'none' }}>
                        <td style={{ padding: '8px 16px', width: '120px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: s.codeBg,
                            color: s.accent,
                            border: `1px solid ${s.border}`,
                          }}>
                            {cmd.cmd}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: '12px', color: s.textSecondary, width: '200px' }}>
                          {cmd.desc}
                        </td>
                        <td style={{ padding: '8px 16px', fontSize: '11px', fontFamily: 'monospace', color: s.textSecondary, opacity: 0.7 }}>
                          {cmd.usage}
                        </td>
                      </tr>
                    ))}
                  </table>
                </div>
              ))}
          </div>
        )}

        {/* ====== FAQ ====== */}
        {(tab === 'faq' || hasSearch) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredFaq.map((item, i) => (
              <div
                key={i}
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                style={{
                  background: s.cardBg,
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${s.border}`,
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: s.accent,
                    flex: 1,
                  }}>
                    Q: {item.q}
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: s.textSecondary,
                    transition: 'transform 0.2s',
                    transform: expandedFaq === i ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}>▶</span>
                </div>
                {expandedFaq === i && (
                  <div style={{
                    padding: '0 16px 12px',
                    fontSize: '12px',
                    color: s.textSecondary,
                    lineHeight: 1.7,
                    borderTop: `1px solid ${s.border}`,
                    paddingTop: '10px',
                  }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ====== 更新日志 ====== */}
        {(tab === 'changelog' || hasSearch) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {changelog.map(c => (
              <div key={c.version} style={{
                background: s.cardBg,
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${s.border}`,
                padding: '14px 18px',
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
              }}>
                <div style={{
                  flexShrink: 0,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-bg)',
                  color: 'var(--accent)',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}>
                  {c.version}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: s.textSecondary, lineHeight: 1.6 }}>
                    {c.changes}
                  </div>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: s.textSecondary,
                  opacity: 0.6,
                  flexShrink: 0,
                }}>
                  {c.date}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
