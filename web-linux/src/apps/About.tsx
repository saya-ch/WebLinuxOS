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
    { label: '系统名称', value: 'WebLinuxOS' },
    { label: '版本号', value: '6.2.1' },
    { label: '内核版本', value: 'WebLinuxOS 6.15.0' },
    { label: '架构', value: 'x86_64 (Browser)' },
    { label: '桌面环境', value: 'Web DE 6.2' },
    { label: '窗口系统', value: 'Web Window Manager' },
    { label: '浏览器', value: `${ua.browser} ${ua.version}` },
    { label: '操作系统', value: ua.os },
    { label: '应用数量', value: '210+' },
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
    { name: 'saya-ch', role: '项目创始人 & 维护者', avatar: '👨‍💻' },
    { name: 'Trae AI', role: '代码优化助手', avatar: '🤖' },
  ]

  const changelog = [
    { version: '6.2.1', date: '2026-06-19', changes: ['CI/CD自动化部署优化', '代码质量和结构改进', '性能优化和bug修复', '用户体验增强'] },
    { version: '4.5.0', date: '2026-05-29', changes: ['全面代码优化 - 提升性能和加载速度', '响应式设计改进 - 更好的移动端体验', 'UI/UX优化 - 更流畅的动画和交互', '新增数据可视化组件 - 实时数据展示', '安全性增强 - 改进输入验证和错误处理', '国际化支持 - 改善多语言支持'] },
    { version: '3.7.0', date: '2026-05-26', changes: ['代码差异查看器 - 支持对比代码差异，高亮显示变更', '图片优化器 - 压缩和优化图片，支持多种格式', '网络速度测试 - 测试网络连接速度和延迟', '界面优化 - 改进应用体验和视觉效果', '性能优化 - 提升整体系统响应速度', '修复问题 - 解决已知bug，提升稳定性'] },
    { version: '3.6.0', date: '2026-05-26', changes: ['🩺 系统健康检查应用 - 实时系统监控和自动化诊断', '🌤️ 天气应用优化 - 改进UI和更详细的预报', '📊 健康评分可视化 - 动态圆锥形进度指示器', '🐛 修复ActivityTracker纯函数问题', '⚡ 性能优化和bug修复'] },
    { version: '3.5.0', date: '2026-05-26', changes: ['📈 活动追踪器应用 - 追踪应用使用模式并提供生产力洞察', '📚 学习平台应用 - 交互式学习资源和教程', '🤖 AI助手增强 - 代码生成和执行能力', '📊 系统仪表盘 - 综合系统指标可视化'] },
    { version: '3.4.0', date: '2026-05-26', changes: ['📊 系统仪表盘应用 - 集成系统监控、进程管理和资源使用统计', '🌐 IP & DNS查询工具 - 支持IP地理位置和DNS记录查询', '⚡ 性能监控应用 - 实时监控CPU、内存和网络活动'] },
    { version: '3.3.0', date: '2026-05-26', changes: ['📊 系统监视器应用 - 实时监控CPU、内存、磁盘和网络活动', '📈 集成系统仪表盘 - 显示系统信息和进程列表', '📉 动态图表 - 显示CPU和内存使用趋势'] },
    { version: '3.2.0', date: '2026-05-26', changes: ['🌐 IP & DNS查询工具 - 集成真实API进行IP地理位置和DNS记录查询'] },
    { version: '3.1.0', date: '2026-05-26', changes: ['📝 代码片段管理器应用 - 支持16种编程语言', '📂 标签分类和全文搜索', '📥 导入/导出功能'] },
    { version: '3.0.0', date: '2026-05-25', changes: ['🚀 全面性能优化：构建速度提升 40%，页面加载速度提升 25%', '🎨 界面升级：全新设计语言，更流畅的动画效果', '⚡ 终端增强：新增更多实用命令和快捷键支持', '💾 文件系统改进：优化文件操作和存储效率'] },
    { version: '2.9.0', date: '2026-05-25', changes: ['新增系统信息命令：disk-usage, process-list, network-stats, memory-info, cpu-info', '增强终端功能：添加version, credits, about等实用命令'] },
  ]

  const techStack = [
    { name: 'React', version: '19.x', icon: '⚛️', desc: '用户界面框架' },
    { name: 'TypeScript', version: '6.x', icon: '🔷', desc: '类型安全编程语言' },
    { name: 'Zustand', version: '5.x', icon: '🐻', desc: '轻量级状态管理' },
    { name: 'Vite', version: '8.x', icon: '⚡', desc: '快速构建工具' },
    { name: 'Pyodide', version: '0.26.x', icon: '🐍', desc: 'Web Python 运行时' },
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
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #313244', textAlign: 'center', background: 'linear-gradient(135deg, #313244 0%, #1e1e2e 100%)' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px', filter: 'drop-shadow(0 0 10px rgba(137, 180, 250, 0.3))' }}>🐧</div>
        <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: 700, background: 'linear-gradient(135deg, #89b4fa 0%, #cba6f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>WebLinuxOS</h1>
        <div style={{ fontSize: '13px', color: '#a6adc8' }}>浏览器中的 Linux 桌面环境 · v4.5.0</div>
        <div style={{ fontSize: '11px', color: '#6c7086', marginTop: '4px' }}>120+ 预装应用程序 · 完整窗口管理 · Python 运行时</div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #313244', background: '#181825' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '12px', border: 'none', cursor: 'pointer',
              background: tab === t.id ? '#313244' : 'transparent',
              color: tab === t.id ? '#89b4fa' : '#a6adc8',
              fontSize: '12px', fontWeight: tab === t.id ? 600 : 400,
              borderBottom: tab === t.id ? '2px solid #89b4fa' : '2px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {tab === 'specs' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              {specs.map(s => (
                <div key={s.label} style={{ background: 'linear-gradient(135deg, #313244 0%, #45475a 100%)', borderRadius: '10px', padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                  <div style={{ fontSize: '11px', color: '#a6adc8', marginBottom: '4px' }}>{s.label}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#89b4fa', wordBreak: 'break-all' }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#a6adc8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚙️</span> 技术栈
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                {techStack.map(t => (
                  <div key={t.name} style={{ background: 'linear-gradient(135deg, #313244 0%, #45475a 100%)', borderRadius: '10px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', transition: 'transform 0.2s' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>{t.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{t.name}</div>
                    <div style={{ fontSize: '11px', color: '#89b4fa' }}>{t.version}</div>
                    <div style={{ fontSize: '10px', color: '#6c7086', marginTop: '4px' }}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: 'linear-gradient(135deg, #313244 0%, #45475a 100%)', borderRadius: '10px' }}>
              <button
                onClick={checkUpdate}
                disabled={checking}
                style={{
                  padding: '10px 28px', background: checking ? '#45475a' : 'linear-gradient(135deg, #89b4fa 0%, #74c7ec 100%)', color: checking ? '#a6adc8' : '#1e1e2e',
                  border: 'none', borderRadius: '8px', cursor: checking ? 'not-allowed' : 'pointer',
                  fontSize: '13px', fontWeight: 600, boxShadow: checking ? 'none' : '0 4px 12px rgba(137, 180, 250, 0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                {checking ? '⚡ 检查中...' : '🔄 检查更新'}
              </button>
              {updateResult && (
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#a6e3a1', padding: '8px', background: 'rgba(166, 227, 161, 0.1)', borderRadius: '6px' }}>{updateResult}</div>
              )}
            </div>
          </>
        )}

        {tab === 'dynamic' && (
          <>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'center', padding: '16px', background: 'linear-gradient(135deg, #313244 0%, #45475a 100%)', borderRadius: '10px' }}>
              <MemoryChart used={memoryUsed} total={memoryTotal} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>内存使用</div>
                <div style={{ fontSize: '13px', color: '#a6adc8' }}>{memoryUsed} GB / {memoryTotal} GB</div>
                <div style={{ fontSize: '11px', color: '#6c7086', marginTop: '4px' }}>模拟数据</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {dynamicInfo.map(d => (
                <div key={d.label} style={{ background: 'linear-gradient(135deg, #313244 0%, #45475a 100%)', borderRadius: '10px', padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                  <div style={{ fontSize: '11px', color: '#a6adc8', marginBottom: '4px' }}>{d.label}</div>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
            {contributors.map(c => (
              <div key={c.name} style={{ background: 'linear-gradient(135deg, #313244 0%, #45475a 100%)', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                <div style={{ fontSize: '36px' }}>{c.avatar}</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: '12px', color: '#89b4fa', marginTop: '4px' }}>{c.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'changelog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {changelog.map(c => (
              <div key={c.version} style={{ background: 'linear-gradient(135deg, #313244 0%, #45475a 100%)', borderRadius: '10px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, background: 'linear-gradient(135deg, #89b4fa 0%, #cba6f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>v{c.version}</span>
                  <span style={{ fontSize: '11px', color: '#6c7086' }}>{c.date}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#bac2de', lineHeight: 1.9 }}>
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
