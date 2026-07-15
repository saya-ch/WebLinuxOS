import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store'

// ============ 工具函数 ============

function parseUA(ua: string) {
  let browser = '未知'
  let version = ''
  let engine = '未知'
  let os = '未知'

  if (ua.includes('Firefox/')) {
    browser = 'Firefox'
    version = ua.split('Firefox/')[1]?.split(' ')[0] || ''
    engine = 'Gecko'
  } else if (ua.includes('Edg/')) {
    browser = 'Edge'
    version = ua.split('Edg/')[1]?.split(' ')[0] || ''
    engine = 'Blink'
  } else if (ua.includes('OPR/') || ua.includes('Opera/')) {
    browser = 'Opera'
    version = ua.split('OPR/')[1]?.split(' ')[0] || ''
    engine = 'Blink'
  } else if (ua.includes('Chrome/')) {
    browser = 'Chrome'
    version = ua.split('Chrome/')[1]?.split(' ')[0] || ''
    engine = 'Blink'
  } else if (ua.includes('Safari/') && ua.includes('Version/')) {
    browser = 'Safari'
    version = ua.split('Version/')[1]?.split(' ')[0] || ''
    engine = 'WebKit'
  }

  if (ua.includes('Windows NT 10')) os = 'Windows 10/11'
  else if (ua.includes('Windows NT')) os = 'Windows'
  else if (ua.includes('Mac OS X')) {
    const m = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/)
    os = m ? `macOS ${m[1].replace(/_/g, '.')}` : 'macOS'
  } else if (ua.includes('Android')) {
    const m = ua.match(/Android (\d+\.?\d*)/)
    os = m ? `Android ${m[1]}` : 'Android'
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    const m = ua.match(/OS (\d+[._]\d+)/)
    os = m ? `iOS ${m[1].replace(/_/g, '.')}` : 'iOS'
  } else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('CrOS')) os = 'Chrome OS'

  return { browser, version, engine, os }
}

function getLoadTime(): string {
  try {
    const timing = performance.timing
    if (timing && timing.loadEventEnd > 0) {
      const loadTime = timing.loadEventEnd - timing.navigationStart
      return `${loadTime} ms`
    }
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (nav && nav.loadEventEnd > 0) {
      return `${Math.round(nav.loadEventEnd)} ms`
    }
  } catch { /* ignore */ }
  return '加载中...'
}

function estimateLocalStorageUsage(): string {
  try {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        total += key.length + (localStorage.getItem(key)?.length || 0)
      }
    }
    // UTF-16 每个 char 2 bytes
    const bytes = total * 2
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  } catch { /* ignore */ }
  return '未知'
}

function countFileNodes(nodes: { children?: any[] }[]): number {
  let count = 0
  for (const n of nodes) {
    count++
    if (n.children) count += countFileNodes(n.children)
  }
  return count
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}h ${m}m ${s}s`
}

// ============ FPS 计算组件 ============

function useFPS(): number {
  const [fps, setFps] = useState(0)
  const frames = useRef(0)
  const lastTime = useRef(performance.now())
  const rafId = useRef(0)

  useEffect(() => {
    const tick = (now: number) => {
      frames.current++
      const delta = now - lastTime.current
      if (delta >= 1000) {
        setFps(Math.round((frames.current * 1000) / delta))
        frames.current = 0
        lastTime.current = now
      }
      rafId.current = requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId.current)
  }, [])

  return fps
}

// ============ 主组件 ============

export default function About() {
  const [tab, setTab] = useState('overview')
  const [uptime, setUptime] = useState(0)
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [online, setOnline] = useState(navigator.onLine)
  const fps = useFPS()
  const [loadTime, setLoadTime] = useState(getLoadTime())
  const [lsUsage, setLsUsage] = useState(estimateLocalStorageUsage())

  const windows = useStore(s => s.windows)
  const apps = useStore(s => s.apps)
  const files = useStore(s => s.files)
  const theme = useStore(s => s.theme)

  const isDark = theme === 'dark'

  // 运行时间
  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => setUptime(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [])

  // 窗口大小
  useEffect(() => {
    const onResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // 网络状态
  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  // 定时刷新性能数据
  useEffect(() => {
    const timer = setInterval(() => {
      setLoadTime(getLoadTime())
      setLsUsage(estimateLocalStorageUsage())
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // ============ CSS 变量驱动的主题色 ============
  const S = useCallback(() => ({
    bg: isDark ? 'var(--color-surface)' : 'var(--color-surface)',
    cardBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    cardBgHover: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    textPrimary: isDark ? 'var(--text-primary)' : 'var(--text-primary)',
    textSecondary: isDark ? 'var(--text-secondary)' : 'var(--text-secondary)',
    accent: 'var(--accent)',
    accentGradient: 'var(--accent-gradient)',
    accentBg: 'var(--accent-bg)',
    success: isDark ? '#a6e3a1' : '#059669',
    error: isDark ? '#f38ba8' : '#dc2626',
    info: isDark ? '#89b4fa' : '#3b82f6',
    glow: isDark ? '0 0 20px rgba(124,108,240,0.2)' : 'none',
    tabActive: isDark ? 'rgba(124,108,240,0.15)' : 'rgba(91,76,216,0.08)',
    headerGradient: isDark
      ? 'linear-gradient(135deg, rgba(124,108,240,0.15) 0%, rgba(0,214,193,0.08) 100%)'
      : 'linear-gradient(135deg, rgba(91,76,216,0.08) 0%, rgba(14,165,160,0.05) 100%)',
  }), [isDark])

  const s = S()

  const ua = parseUA(navigator.userAgent)
  const deviceMemory = (navigator as unknown as Record<string, unknown>).deviceMemory as number | undefined
  const touchSupport = navigator.maxTouchPoints > 0 || 'ontouchstart' in window
  const totalFileNodes = countFileNodes(files)

  // ============ 数据定义 ============

  const overviewItems = [
    { label: '系统名称', value: 'WebLinuxOS', icon: '🐧' },
    { label: '版本号', value: 'v36.0', icon: '🏷️' },
    { label: '内核版本', value: 'WebLinuxOS 36.0.0', icon: '⚙️' },
    { label: '架构', value: 'x86_64 (Browser)', icon: '🖥️' },
    { label: '桌面环境', value: 'Web DE 36', icon: '🎨' },
    { label: '窗口系统', value: 'Web Window Manager', icon: '🪟' },
    { label: '构建时间', value: typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__! : new Date().toLocaleString('zh-CN'), icon: '🕐' },
    { label: '许可证', value: 'MIT', icon: '📄' },
  ]

  const browserItems = [
    { label: '浏览器', value: `${ua.browser} ${ua.version}`, icon: '🌐' },
    { label: '渲染引擎', value: ua.engine, icon: '⚡' },
    { label: '宿主操作系统', value: ua.os, icon: '💻' },
    { label: '语言设置', value: navigator.language, icon: '🌍' },
    { label: 'Cookie 支持', value: navigator.cookieEnabled ? '已启用' : '已禁用', icon: '🍪' },
    { label: '在线状态', value: online ? '在线' : '离线', icon: online ? '🟢' : '🔴', highlight: true },
  ]

  const hardwareItems = [
    { label: '屏幕分辨率', value: `${screen.width} × ${screen.height}`, icon: '📺' },
    { label: '视口大小', value: `${windowSize.width} × ${windowSize.height}`, icon: '📐' },
    { label: '设备像素比', value: `${window.devicePixelRatio}x`, icon: '🔍' },
    { label: 'CPU 核心数', value: `${navigator.hardwareConcurrency || '未知'}`, icon: '🧠' },
    { label: '设备内存', value: deviceMemory ? `${deviceMemory} GB` : '不可用', icon: '💾' },
    { label: '触控支持', value: touchSupport ? `支持 (${navigator.maxTouchPoints} 触点)` : '不支持', icon: '👆' },
    { label: 'GPU', value: getGPUInfo(), icon: '🎮' },
  ]

  const runtimeItems = [
    { label: '打开窗口数', value: `${windows.length}`, icon: '🪟' },
    { label: '已注册应用', value: `${apps.length}`, icon: '📦' },
    { label: '虚拟文件数', value: `${totalFileNodes}`, icon: '📂' },
    { label: 'localStorage', value: lsUsage, icon: '💾' },
    { label: '运行时间', value: formatUptime(uptime), icon: '⏱️' },
    { label: '主题模式', value: isDark ? '深色' : '浅色', icon: isDark ? '🌙' : '☀️' },
  ]

  const performanceItems = [
    { label: '页面加载', value: loadTime, icon: '🚀' },
    { label: '当前 FPS', value: `${fps}`, icon: '📊' },
    { label: '内存估算', value: getPerformanceMemory(), icon: '📈' },
  ]

  const techStack = [
    { name: 'React', version: '19.2.x', icon: '⚛️', desc: '用户界面框架' },
    { name: 'TypeScript', version: '6.x', icon: '🔷', desc: '类型安全编程语言' },
    { name: 'Zustand', version: '5.x', icon: '🐻', desc: '轻量级状态管理' },
    { name: 'Vite', version: '8.x', icon: '⚡', desc: '快速构建工具' },
    { name: 'Pyodide', version: '0.26.x', icon: '🐍', desc: 'Web Python 运行时' },
    { name: 'Lucide', version: '1.x', icon: '✨', desc: '图标库' },
  ]

  const changelog = [
    { version: '36.0.0', date: '2026-07-15', changes: ['全新 About 系统信息面板，展示真实运行时数据', '完整帮助系统重构，支持搜索与分类浏览', '实时 FPS 与性能监控', '浏览器 UA 智能解析', '硬件信息与 GPU 检测', 'localStorage 使用量估算'] },
    { version: '6.3.0', date: '2026-07-01', changes: ['增强前端设计 - 添加独特字体和精致动画效果', '优化用户体验 - 新增流畅微交互和视觉效果', '性能优化 - 改进CSS动画和渲染性能', '改进字体系统 - 添加Sora、Outfit等独特字体选择'] },
    { version: '6.2.1', date: '2026-06-19', changes: ['CI/CD自动化部署优化', '代码质量和结构改进', '性能优化和bug修复', '用户体验增强'] },
    { version: '4.5.0', date: '2026-05-29', changes: ['全面代码优化 - 提升性能和加载速度', '响应式设计改进 - 更好的移动端体验', 'UI/UX优化 - 更流畅的动画和交互', '新增数据可视化组件 - 实时数据展示', '安全性增强 - 改进输入验证和错误处理'] },
    { version: '3.7.0', date: '2026-05-26', changes: ['代码差异查看器 - 支持对比代码差异', '图片优化器 - 压缩和优化图片', '网络速度测试 - 测试网络连接速度和延迟', '界面优化 - 改进应用体验和视觉效果'] },
  ]

  const tabs = [
    { id: 'overview', label: '系统概览', icon: '🖥️' },
    { id: 'browser', label: '浏览器', icon: '🌐' },
    { id: 'hardware', label: '硬件', icon: '🔧' },
    { id: 'runtime', label: '运行时', icon: '⚡' },
    { id: 'techstack', label: '技术栈', icon: '🏗️' },
    { id: 'changelog', label: '更新日志', icon: '📋' },
  ]

  // ============ 渲染辅助 ============

  const renderCard = (item: { label: string; value: string; icon: string; highlight?: boolean }, idx: number) => (
    <div key={idx} style={{
      background: s.cardBg,
      borderRadius: 'var(--radius-md)',
      padding: '14px 16px',
      border: `1px solid ${s.border}`,
      transition: 'all 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: '14px' }}>{item.icon}</span>
        <span style={{ fontSize: '11px', color: s.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</span>
      </div>
      <div style={{
        fontSize: '14px',
        fontWeight: 600,
        color: item.highlight
          ? (item.value === '在线' ? s.success : s.error)
          : s.textPrimary,
      }}>
        {item.value}
      </div>
    </div>
  )

  const renderGrid = (items: Array<{ label: string; value: string; icon: string; highlight?: boolean }>) => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '10px',
    }}>
      {items.map(renderCard)}
    </div>
  )

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: s.bg,
      color: s.textPrimary,
      overflow: 'hidden',
    }}>
      {/* ====== 顶部头部 ====== */}
      <div style={{
        padding: '20px 24px 16px',
        background: s.headerGradient,
        borderBottom: `1px solid ${s.border}`,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '42px',
          marginBottom: '6px',
          filter: isDark ? 'drop-shadow(0 0 12px rgba(124,108,240,0.3))' : 'none',
        }}>🐧</div>
        <h1 style={{
          margin: '0 0 4px',
          fontSize: '24px',
          fontWeight: 700,
          background: 'var(--accent-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>WebLinuxOS</h1>
        <div style={{ fontSize: '13px', color: s.textSecondary }}>
          浏览器中的 Linux 桌面环境 · v36.0
        </div>
        <div style={{ fontSize: '11px', color: s.textSecondary, marginTop: '4px', opacity: 0.7 }}>
          {apps.length} 已注册应用 · 完整窗口管理 · Python 运行时
        </div>
      </div>

      {/* ====== 标签栏 ====== */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${s.border}`,
        background: s.cardBg,
        overflowX: 'auto',
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: '1 0 auto',
              padding: '10px 12px',
              border: 'none',
              cursor: 'pointer',
              background: tab === t.id ? s.tabActive : 'transparent',
              color: tab === t.id ? s.accent : s.textSecondary,
              fontSize: '11px',
              fontWeight: tab === t.id ? 600 : 400,
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'var(--transition-smooth)',
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

      {/* ====== 内容区域 ====== */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* 系统概览 */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 性能概览条 */}
            <div style={{
              display: 'flex',
              gap: '12px',
              padding: '14px 18px',
              background: s.cardBg,
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${s.border}`,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: fps >= 50 ? s.success : fps >= 30 ? '#f59e0b' : s.error }}>{fps}</span>
                <span style={{ fontSize: '10px', color: s.textSecondary }}>FPS</span>
              </div>
              <div style={{ width: '1px', height: '24px', background: s.border }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: s.info }}>{windows.length}</span>
                <span style={{ fontSize: '10px', color: s.textSecondary }}>窗口</span>
              </div>
              <div style={{ width: '1px', height: '24px', background: s.border }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: s.accent }}>{apps.length}</span>
                <span style={{ fontSize: '10px', color: s.textSecondary }}>应用</span>
              </div>
              <div style={{ width: '1px', height: '24px', background: s.border }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: s.textPrimary }}>{formatUptime(uptime)}</span>
                <span style={{ fontSize: '10px', color: s.textSecondary }}>运行时间</span>
              </div>
              <div style={{ width: '1px', height: '24px', background: s.border }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: online ? s.success : s.error }}>{online ? '● 在线' : '● 离线'}</span>
              </div>
            </div>

            {renderGrid(overviewItems)}
          </div>
        )}

        {/* 浏览器信息 */}
        {tab === 'browser' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '16px 20px',
              background: s.cardBg,
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${s.border}`,
            }}>
              <div style={{ fontSize: '11px', color: s.textSecondary, marginBottom: '8px' }}>User-Agent 原始字符串</div>
              <div style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                color: s.textSecondary,
                wordBreak: 'break-all',
                lineHeight: 1.6,
                padding: '10px 14px',
                background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)',
                borderRadius: 'var(--radius-sm)',
              }}>
                {navigator.userAgent}
              </div>
            </div>
            {renderGrid(browserItems)}
          </div>
        )}

        {/* 硬件信息 */}
        {tab === 'hardware' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 性能指标 */}
            <div style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
            }}>
              {performanceItems.map((p, i) => (
                <div key={i} style={{
                  flex: '1 1 160px',
                  background: s.cardBg,
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${s.border}`,
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-sm)',
                    background: s.accentBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                  }}>
                    {p.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: s.textSecondary }}>{p.label}</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: p.label === '当前 FPS' ? (fps >= 50 ? s.success : fps >= 30 ? '#f59e0b' : s.error) : s.accent }}>{p.value}</div>
                  </div>
                </div>
              ))}
            </div>
            {renderGrid(hardwareItems)}
          </div>
        )}

        {/* 运行时状态 */}
        {tab === 'runtime' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 窗口列表 */}
            {windows.length > 0 && (
              <div style={{
                background: s.cardBg,
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${s.border}`,
                padding: '16px',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: s.accent, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🪟 当前打开的窗口
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {windows.map(w => (
                    <span key={w.id} style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: s.accentBg,
                      color: s.accent,
                      border: `1px solid ${s.border}`,
                    }}>
                      {w.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {renderGrid(runtimeItems)}
          </div>
        )}

        {/* 技术栈 */}
        {tab === 'techstack' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '12px',
          }}>
            {techStack.map(t => (
              <div key={t.name} style={{
                background: s.cardBg,
                borderRadius: 'var(--radius-md)',
                padding: '18px 14px',
                textAlign: 'center',
                border: `1px solid ${s.border}`,
                transition: 'var(--transition-smooth)',
              }}>
                <div style={{
                  fontSize: '32px',
                  marginBottom: '8px',
                  filter: isDark ? 'drop-shadow(0 0 6px rgba(124,108,240,0.2))' : 'none',
                }}>{t.icon}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: s.textPrimary, marginBottom: '4px' }}>{t.name}</div>
                <div style={{ fontSize: '11px', color: s.accent, fontWeight: 600 }}>{t.version}</div>
                <div style={{ fontSize: '10px', color: s.textSecondary, marginTop: '4px' }}>{t.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* 更新日志 */}
        {tab === 'changelog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {changelog.map(c => (
              <div key={c.version} style={{
                background: s.cardBg,
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                border: `1px solid ${s.border}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    background: 'var(--accent-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>v{c.version}</span>
                  <span style={{ fontSize: '11px', color: s.textSecondary }}>{c.date}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: s.textSecondary, lineHeight: 1.9 }}>
                  {c.changes.map((change, i) => (
                    <li key={i}>{change}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============ 辅助函数 ============

function getGPUInfo(): string {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return '不可用'
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info')
    if (debugInfo) {
      return (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '未知'
    }
    return 'WebGL 支持'
  } catch {
    return '不可用'
  }
}

function getPerformanceMemory(): string {
  try {
    const perf = performance as unknown as Record<string, unknown>
    const memory = perf.memory as { usedJSHeapSize?: number; jsHeapSizeLimit?: number } | undefined
    if (memory && memory.usedJSHeapSize && memory.jsHeapSizeLimit) {
      const used = (memory.usedJSHeapSize / (1024 * 1024)).toFixed(1)
      const total = (memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(1)
      return `${used} / ${total} MB`
    }
  } catch { /* ignore */ }
  return '不可用'
}

// 构建时间注入（由 Vite define 替换，fallback 为当前时间）
declare const __BUILD_TIME__: string | undefined
