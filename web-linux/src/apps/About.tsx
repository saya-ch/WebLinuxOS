import { useState, useEffect, useRef, useCallback } from 'react'
import { TerminalIcon } from '../icons'

interface SystemInfo {
  browser: string
  os: string
  screenWidth: number
  screenHeight: number
  windowWidth: number
  windowHeight: number
  pixelRatio: number
  language: string
  online: boolean
  cpuCores: number
  memory: number | null
  uptime: number
}

const CONTRIBUTORS = [
  { name: '张明', role: '核心开发者', avatar: '👨‍💻' },
  { name: '李华', role: 'UI 设计师', avatar: '👩‍🎨' },
  { name: '王强', role: '后端架构', avatar: '👨‍🔧' },
  { name: '赵丽', role: '前端开发', avatar: '👩‍💻' },
  { name: '陈伟', role: '测试工程师', avatar: '🧑‍🔬' },
  { name: '刘芳', role: '文档撰写', avatar: '📝' },
  { name: '杨帆', role: 'DevOps', avatar: '🚀' },
  { name: '黄磊', role: '安全顾问', avatar: '🔒' },
]

const CHANGELOG = [
  { version: '2.1.0', date: '2025-05-15', changes: ['新增软件中心应用评分系统', '优化窗口管理性能', '修复多显示器布局问题', '新增深色主题配色方案'] },
  { version: '2.0.0', date: '2025-04-01', changes: ['全新 UI 设计语言', '支持多窗口拖拽', '新增 20+ 应用程序', '性能提升 50%'] },
  { version: '1.5.0', date: '2025-02-10', changes: ['新增终端模拟器', '支持文件系统', '新增 Python 运行环境', '优化启动速度'] },
  { version: '1.0.0', date: '2024-12-01', changes: ['初始版本发布', '基础桌面环境', '10+ 核心应用', '窗口管理系统'] },
]

function parseBrowser(ua: string): string {
  if (ua.includes('Firefox')) return 'Firefox ' + (ua.match(/Firefox\/([\d.]+)/)?.[1] || '')
  if (ua.includes('Edg')) return 'Edge ' + (ua.match(/Edg\/([\d.]+)/)?.[1] || '')
  if (ua.includes('Chrome')) return 'Chrome ' + (ua.match(/Chrome\/([\d.]+)/)?.[1] || '')
  if (ua.includes('Safari')) return 'Safari ' + (ua.match(/Version\/([\d.]+)/)?.[1] || '')
  return 'Unknown'
}

function parseOS(ua: string): string {
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Mac OS X')) return 'macOS ' + (ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.') || '')
  if (ua.includes('Windows NT 10')) return 'Windows 10/11'
  if (ua.includes('Windows')) return 'Windows'
  return 'Unknown'
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${h}时 ${m}分 ${s}秒`
}

function MemoryPieChart({ used, total }: { used: number; total: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const size = 140
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = size + 'px'
    canvas.style.height = size + 'px'
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const radius = 55
    const lineWidth = 18

    ctx.clearRect(0, 0, size, size)

    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.strokeStyle = '#45475a'
    ctx.lineWidth = lineWidth
    ctx.stroke()

    const ratio = total > 0 ? Math.min(used / total, 1) : 0
    const startAngle = -Math.PI / 2
    const endAngle = startAngle + ratio * Math.PI * 2

    ctx.beginPath()
    ctx.arc(cx, cy, radius, startAngle, endAngle)
    ctx.strokeStyle = '#89b4fa'
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.stroke()

    ctx.fillStyle = '#cdd6f4'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${Math.round(ratio * 100)}%`, cx, cy - 8)
    ctx.fillStyle = '#a6adc8'
    ctx.font = '10px sans-serif'
    ctx.fillText('内存使用', cx, cy + 10)
  }, [used, total])

  return <canvas ref={canvasRef} />
}

function CpuChart({ cores }: { cores: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const size = 140
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = size + 'px'
    canvas.style.height = size + 'px'
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, size, size)

    const barWidth = Math.min(12, (size - 20) / cores - 4)
    const totalWidth = cores * (barWidth + 4) - 4
    const startX = (size - totalWidth) / 2
    const maxH = 80
    const baseY = size / 2 + maxH / 2 + 5

    for (let i = 0; i < cores; i++) {
      const usage = 0.2 + Math.random() * 0.6
      const h = maxH * usage
      const x = startX + i * (barWidth + 4)

      ctx.fillStyle = '#45475a'
      ctx.fillRect(x, baseY - maxH, barWidth, maxH)

      const gradient = ctx.createLinearGradient(0, baseY - h, 0, baseY)
      gradient.addColorStop(0, '#89b4fa')
      gradient.addColorStop(1, '#74c7ec')
      ctx.fillStyle = gradient
      ctx.fillRect(x, baseY - h, barWidth, h)

      ctx.fillStyle = '#6c7086'
      ctx.font = '8px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${i}`, x + barWidth / 2, baseY + 10)
    }

    ctx.fillStyle = '#cdd6f4'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${cores} 核心`, size / 2, baseY - maxH - 10)
  }, [cores])

  return <canvas ref={canvasRef} />
}

export default function About() {
  const [sysInfo, setSysInfo] = useState<SystemInfo>({
    browser: '', os: '', screenWidth: 0, screenHeight: 0,
    windowWidth: 0, windowHeight: 0, pixelRatio: 1, language: '',
    online: true, cpuCores: 1, memory: null, uptime: 0,
  })
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [updateResult, setUpdateResult] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'info' | 'dynamic' | 'contributors' | 'changelog'>('info')
  const startTimeRef = useRef(Date.now())

  const updateSystemInfo = useCallback(() => {
    const nav = navigator as any
    setSysInfo({
      browser: parseBrowser(navigator.userAgent),
      os: parseOS(navigator.userAgent),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
      language: navigator.language,
      online: navigator.onLine,
      cpuCores: navigator.hardwareConcurrency || 1,
      memory: nav.deviceMemory || null,
      uptime: (Date.now() - startTimeRef.current) / 1000,
    })
  }, [])

  useEffect(() => {
    updateSystemInfo()
    const timer = setInterval(updateSystemInfo, 1000)
    const handleResize = () => updateSystemInfo()
    const handleOnline = () => updateSystemInfo()
    window.addEventListener('resize', handleResize)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOnline)
    return () => {
      clearInterval(timer)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOnline)
    }
  }, [updateSystemInfo])

  const checkForUpdates = () => {
    setCheckingUpdate(true)
    setUpdateResult(null)
    setTimeout(() => {
      setCheckingUpdate(false)
      setUpdateResult('您的系统已是最新版本 (v2.1.0)')
    }, 2500)
  }

  const specs = [
    { label: '系统名称', value: 'Web Linux' },
    { label: '版本号', value: '2.1.0' },
    { label: '内核版本', value: 'Web Linux 6.8.0' },
    { label: '架构', value: 'x86_64 (Browser)' },
    { label: '桌面环境', value: 'Web DE 2.0' },
    { label: '窗口系统', value: 'Web Window Manager' },
    { label: '应用数量', value: '50+' },
    { label: '许可证', value: 'MIT' },
  ]

  const techStack = [
    { name: 'React', version: '19.x', icon: '⚛️', desc: '用户界面框架' },
    { name: 'TypeScript', version: '5.x', icon: '🔷', desc: '类型安全编程语言' },
    { name: 'Zustand', version: '5.x', icon: '🐻', desc: '轻量级状态管理' },
    { name: 'Vite', version: '6.x', icon: '⚡', desc: '快速构建工具' },
  ]

  const dynamicInfo = [
    { label: '浏览器', value: sysInfo.browser },
    { label: '操作系统', value: sysInfo.os },
    { label: '屏幕分辨率', value: `${sysInfo.screenWidth} × ${sysInfo.screenHeight}` },
    { label: '窗口大小', value: `${sysInfo.windowWidth} × ${sysInfo.windowHeight}` },
    { label: '设备像素比', value: `${sysInfo.pixelRatio}x` },
    { label: '语言设置', value: sysInfo.language },
    { label: '在线状态', value: sysInfo.online ? '🟢 在线' : '🔴 离线' },
    { label: 'CPU 核心', value: `${sysInfo.cpuCores} 核` },
    { label: '设备内存', value: sysInfo.memory ? `${sysInfo.memory} GB` : '不可用' },
    { label: '运行时间', value: formatUptime(sysInfo.uptime) },
  ]

  const sectionBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer',
    background: active ? '#89b4fa' : '#313244', color: active ? '#1e1e2e' : '#a6adc8',
    fontSize: '12px', fontWeight: 600,
  })

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e',
      color: '#cdd6f4', overflowY: 'auto',
    }}>
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>
            <TerminalIcon className="w-12 h-12" />
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700 }}>Web Linux</h1>
          <div style={{ fontSize: 13, color: '#a6adc8' }}>浏览器中的 Linux 桌面环境</div>
        </div>

        <div style={{
          background: '#313244', borderRadius: 12, padding: '16px 20px',
          marginBottom: 16, textAlign: 'center',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#89b4fa' }}>
            关于 Web Linux
          </div>
          <p style={{ fontSize: 12, color: '#bac2de', lineHeight: 1.7, margin: 0 }}>
            Web Linux 是一个纯前端实现的 Linux 桌面环境模拟器。它提供了完整的窗口管理系统、
            丰富的系统工具、办公应用、网络工具、多媒体播放器和经典游戏。所有功能均在浏览器中运行，
            无需后端服务器支持。项目旨在展示现代 Web 技术的强大能力，同时提供一个有趣且实用的桌面环境体验。
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {(['info', 'dynamic', 'contributors', 'changelog'] as const).map((s) => (
            <button key={s} onClick={() => setActiveSection(s)} style={sectionBtnStyle(activeSection === s)}>
              {s === 'info' ? '系统规格' : s === 'dynamic' ? '动态信息' : s === 'contributors' ? '贡献者' : '更新日志'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: '0 20px 20px', overflowY: 'auto' }}>
        {activeSection === 'info' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {specs.map((spec) => (
                <div key={spec.label} style={{ background: '#313244', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: '#a6adc8' }}>{spec.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#89b4fa' }}>{spec.value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#a6adc8' }}>技术栈</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                {techStack.map((tech) => (
                  <div key={tech.name} style={{ background: '#313244', borderRadius: 8, padding: 12, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 24 }}>{tech.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{tech.name}</span>
                    <span style={{ fontSize: 10, color: '#89b4fa' }}>{tech.version}</span>
                    <span style={{ fontSize: 9, color: '#6c7086' }}>{tech.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeSection === 'dynamic' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {dynamicInfo.map((info) => (
                <div key={info.label} style={{ background: '#313244', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: '#a6adc8' }}>{info.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#89b4fa' }}>{info.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ background: '#313244', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#a6adc8', marginBottom: 8 }}>内存使用</div>
                <MemoryPieChart used={sysInfo.memory ? sysInfo.memory * 0.6 : 4} total={sysInfo.memory || 8} />
                <div style={{ fontSize: 10, color: '#6c7086', marginTop: 6 }}>
                  {sysInfo.memory ? `${(sysInfo.memory * 0.6).toFixed(1)} GB / ${sysInfo.memory} GB` : '4.0 GB / 8.0 GB (估算)'}
                </div>
              </div>
              <div style={{ background: '#313244', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#a6adc8', marginBottom: 8 }}>CPU 使用</div>
                <CpuChart cores={sysInfo.cpuCores} />
                <div style={{ fontSize: 10, color: '#6c7086', marginTop: 6 }}>模拟数据</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <button
                onClick={checkForUpdates}
                disabled={checkingUpdate}
                style={{
                  padding: '10px 28px', background: checkingUpdate ? '#45475a' : '#89b4fa',
                  color: checkingUpdate ? '#6c7086' : '#1e1e2e', border: 'none', borderRadius: 8,
                  cursor: checkingUpdate ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600,
                }}
              >
                {checkingUpdate ? '检查中...' : '🔍 检查更新'}
              </button>
              {updateResult && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#a6e3a1' }}>{updateResult}</div>
              )}
            </div>
          </>
        )}

        {activeSection === 'contributors' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {CONTRIBUTORS.map((c) => (
              <div key={c.name} style={{ background: '#313244', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 28 }}>{c.avatar}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#a6adc8' }}>{c.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'changelog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {CHANGELOG.map((log) => (
              <div key={log.version} style={{ background: '#313244', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#89b4fa' }}>v{log.version}</span>
                  <span style={{ fontSize: 11, color: '#6c7086' }}>{log.date}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#bac2de', lineHeight: 1.8 }}>
                  {log.changes.map((change, i) => (
                    <li key={i}>{change}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', fontSize: 11, color: '#6c7086', lineHeight: 1.8, padding: '12px 20px', borderTop: '1px solid #313244' }}>
        <div>Web Linux © 2025</div>
        <div>基于 Web 技术构建 · 使用 React + TypeScript + Zustand + Vite</div>
        <div>开源项目 · MIT License</div>
      </div>
    </div>
  )
}
