import { useState, useEffect, useRef } from 'react'

const MemoryChart = ({ used, total }: { used: number; total: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const w = canvasRef.current!.width
    const h = canvasRef.current!.height
    ctx.clearRect(0, 0, w, h)
    const cx = w / 2
    const cy = h / 2
    const r = Math.min(cx, cy) - 10
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = '#313244'
    ctx.lineWidth = 12
    ctx.stroke()
    const ratio = used / total
    ctx.beginPath()
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2)
    ctx.strokeStyle = '#89b4fa'
    ctx.lineWidth = 12
    ctx.lineCap = 'round'
    ctx.stroke()
    ctx.fillStyle = '#cdd6f4'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${Math.round(ratio * 100)}%`, cx, cy)
  }, [used, total])
  return <canvas ref={canvasRef} width={120} height={120} />
}

function parseUA(ua: string) {
  let browser = '未知'
  let version = ''
  let os = '未知'
  if (ua.includes('Firefox/')) {
    browser = 'Firefox'
    version = ua.split('Firefox/')[1]?.split(' ')[0] || ''
  } else if (ua.includes('Edg/')) {
    browser = 'Edge'
    version = ua.split('Edg/')[1]?.split(' ')[0] || ''
  } else if (ua.includes('Chrome/')) {
    browser = 'Chrome'
    version = ua.split('Chrome/')[1]?.split(' ')[0] || ''
  } else if (ua.includes('Safari/')) {
    browser = 'Safari'
    version = ua.split('Version/')[1]?.split(' ')[0] || ''
  }
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  return { browser, version, os }
}

export default function About() {
  const [tab, setTab] = useState('specs')
  const [uptime, setUptime] = useState(0)
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [online, setOnline] = useState(navigator.onLine)
  const [checking, setChecking] = useState(false)
  const [updateResult, setUpdateResult] = useState<string | null>(null)

  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => setUptime(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const onResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

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

  const ua = parseUA(navigator.userAgent)
  const deviceMemory = (navigator as unknown as Record<string, unknown>).deviceMemory as number | undefined

  const specs = [
    { label: '系统名称', value: 'Web Linux' },
    { label: '版本号', value: '2.0.0' },
    { label: '内核版本', value: 'Web Linux 6.8.0' },
    { label: '架构', value: 'x86_64 (Browser)' },
    { label: '桌面环境', value: 'Web DE 2.0' },
    { label: '窗口系统', value: 'Web Window Manager' },
    { label: '浏览器', value: `${ua.browser} ${ua.version}` },
    { label: '操作系统', value: ua.os },
    { label: '应用数量', value: '50+' },
    { label: '许可证', value: 'MIT' },
  ]

  const dynamicInfo = [
    { label: '屏幕分辨率', value: `${screen.width} × ${screen.height}` },
    { label: '窗口大小', value: `${windowSize.width} × ${windowSize.height}` },
    { label: '设备像素比', value: `${window.devicePixelRatio}x` },
    { label: '语言设置', value: navigator.language },
    { label: '在线状态', value: online ? '在线' : '离线', highlight: true },
    { label: 'CPU 核心数', value: `${navigator.hardwareConcurrency || '未知'}` },
    { label: '设备内存', value: deviceMemory ? `${deviceMemory} GB` : '未知' },
    { label: '运行时间', value: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s` },
  ]

  const contributors = [
    { name: '张伟', role: '核心开发者', avatar: '👨‍💻' },
    { name: '李娜', role: 'UI 设计师', avatar: '👩‍🎨' },
    { name: '王强', role: '后端工程师', avatar: '👨‍🔧' },
    { name: '刘洋', role: '前端工程师', avatar: '👩‍💻' },
    { name: '陈明', role: '测试工程师', avatar: '🧑‍🔬' },
    { name: '赵雪', role: '文档编写', avatar: '👩‍🏫' },
    { name: '孙磊', role: 'DevOps', avatar: '🧑‍🚀' },
    { name: '周芳', role: '社区管理', avatar: '👩‍💼' },
  ]

  const changelog = [
    { version: '2.0.0', date: '2025-05-15', changes: ['全新界面设计', '新增 20+ 应用', '性能优化 50%', '支持多窗口拖拽'] },
    { version: '1.5.0', date: '2025-03-01', changes: ['添加文件管理器', '新增终端模拟器', '修复窗口重叠问题'] },
    { version: '1.2.0', date: '2025-01-10', changes: ['添加系统设置', '新增主题切换', '优化内存使用'] },
    { version: '1.0.0', date: '2024-12-01', changes: ['初始发布', '基础窗口管理', '10 个核心应用'] },
  ]

  const techStack = [
    { name: 'React', version: '19.x', icon: '⚛️', desc: '用户界面框架' },
    { name: 'TypeScript', version: '5.x', icon: '🔷', desc: '类型安全编程语言' },
    { name: 'Zustand', version: '5.x', icon: '🐻', desc: '轻量级状态管理' },
    { name: 'Vite', version: '6.x', icon: '⚡', desc: '快速构建工具' },
  ]

  const checkUpdate = () => {
    setChecking(true)
    setUpdateResult(null)
    setTimeout(() => {
      setChecking(false)
      setUpdateResult('当前已是最新版本')
    }, 2500)
  }

  const tabs = [
    { id: 'specs', label: '系统规格' },
    { id: 'dynamic', label: '动态信息' },
    { id: 'contributors', label: '贡献者' },
    { id: 'changelog', label: '更新日志' },
  ]

  const memoryUsed = 4.2
  const memoryTotal = 8

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #313244', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '4px' }}>🐧</div>
        <h1 style={{ margin: '0 0 2px', fontSize: '22px', fontWeight: 700 }}>Web Linux</h1>
        <div style={{ fontSize: '12px', color: '#a6adc8' }}>浏览器中的 Linux 桌面环境 · v2.0.0</div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #313244' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
              background: tab === t.id ? '#313244' : 'transparent',
              color: tab === t.id ? '#89b4fa' : '#a6adc8',
              fontSize: '12px', fontWeight: tab === t.id ? 600 : 400,
              borderBottom: tab === t.id ? '2px solid #89b4fa' : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {tab === 'specs' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {specs.map(s => (
                <div key={s.label} style={{ background: '#313244', borderRadius: '8px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '11px', color: '#a6adc8' }}>{s.label}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#89b4fa' }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#a6adc8' }}>技术栈</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {techStack.map(t => (
                  <div key={t.name} style={{ background: '#313244', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px' }}>{t.icon}</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>{t.name}</div>
                    <div style={{ fontSize: '10px', color: '#89b4fa' }}>{t.version}</div>
                    <div style={{ fontSize: '9px', color: '#6c7086', marginTop: '2px' }}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={checkUpdate}
                disabled={checking}
                style={{
                  padding: '8px 24px', background: checking ? '#45475a' : '#89b4fa', color: checking ? '#a6adc8' : '#1e1e2e',
                  border: 'none', borderRadius: '6px', cursor: checking ? 'not-allowed' : 'pointer',
                  fontSize: '12px', fontWeight: 600,
                }}
              >
                {checking ? '检查中...' : '检查更新'}
              </button>
              {updateResult && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#a6e3a1' }}>{updateResult}</div>
              )}
            </div>
          </>
        )}

        {tab === 'dynamic' && (
          <>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
              <MemoryChart used={memoryUsed} total={memoryTotal} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>内存使用</div>
                <div style={{ fontSize: '12px', color: '#a6adc8' }}>{memoryUsed} GB / {memoryTotal} GB</div>
                <div style={{ fontSize: '11px', color: '#6c7086', marginTop: '2px' }}>模拟数据</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {dynamicInfo.map(d => (
                <div key={d.label} style={{ background: '#313244', borderRadius: '8px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '11px', color: '#a6adc8' }}>{d.label}</div>
                  <div style={{
                    fontSize: '13px', fontWeight: 600,
                    color: d.highlight ? (online ? '#a6e3a1' : '#f38ba8') : '#cdd6f4',
                  }}>
                    {d.value}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'contributors' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {contributors.map(c => (
              <div key={c.name} style={{ background: '#313244', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontSize: '28px' }}>{c.avatar}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: '11px', color: '#89b4fa' }}>{c.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'changelog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {changelog.map(c => (
              <div key={c.version} style={{ background: '#313244', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#89b4fa' }}>v{c.version}</span>
                  <span style={{ fontSize: '11px', color: '#6c7086' }}>{c.date}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#bac2de', lineHeight: 1.8 }}>
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
