import { useState, useMemo } from 'react'
import { appRegistry } from '../apps'

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

const categoryMap: Record<string, string> = {
  system: '系统', office: '办公', internet: '网络',
  multimedia: '多媒体', utilities: '工具', development: '开发', games: '游戏',
}

const categoryBanners: Record<string, { color: string; icon: string }> = {
  system: { color: '#89b4fa', icon: '⚙️' },
  office: { color: '#a6e3a1', icon: '📝' },
  internet: { color: '#f9e2af', icon: '🌐' },
  multimedia: { color: '#f38ba8', icon: '🎬' },
  utilities: { color: '#94e2d5', icon: '🔧' },
  development: { color: '#cba6f7', icon: '💻' },
  games: { color: '#fab387', icon: '🎮' },
}

const appDescriptions: Record<string, string> = {
  files: '强大的文件管理器，支持文件浏览、搜索和批量操作',
  terminal: '功能完整的终端模拟器，支持命令行操作和脚本执行',
  'text-editor': '轻量级文本编辑器，支持语法高亮和多标签页',
  browser: '现代化网页浏览器，支持多标签页和书签管理',
  calculator: '科学计算器，支持基础和高级数学运算',
  calendar: '日历应用，支持日程管理和提醒功能',
  clock: '时钟应用，包含闹钟、秒表和计时器功能',
  weather: '天气预报应用，提供实时天气和未来预报',
  'system-monitor': '系统监视器，实时查看系统资源使用情况',
  settings: '系统设置中心，自定义桌面环境和系统配置',
  notepad: '简洁的记事本应用，快速记录文本内容',
  'image-viewer': '图片查看器，支持多种图片格式和基本编辑',
  'music-player': '音乐播放器，支持播放列表和音频可视化',
  'video-player': '视频播放器，支持多种视频格式',
  'pdf-viewer': 'PDF 文档查看器，支持缩放和书签',
  'code-editor': '专业代码编辑器，支持语法高亮和自动补全',
  'package-manager': '软件包管理器，管理系统软件包',
  'software-center': '应用中心，浏览和安装应用程序',
  'disk-usage': '磁盘使用分析器，可视化磁盘空间占用',
  'task-manager': '任务管理器，管理运行中的任务和进程',
  'process-monitor': '进程监视器，查看和管理系统进程',
  'network-monitor': '网络监视器，监控网络连接和流量',
  firewall: '防火墙设置，配置网络安全规则',
  'user-manager': '用户管理，管理系统用户和权限',
  screenshot: '截图工具，支持全屏和区域截图',
  paint: '画图应用，支持多种绘图工具和图层',
  spreadsheet: '电子表格，支持公式计算和图表',
  presentation: '演示文稿，创建和展示幻灯片',
  email: '邮件客户端，收发和管理电子邮件',
  chat: '即时通讯，与好友实时聊天',
  contacts: '通讯录，管理联系人信息',
  notes: '笔记应用，支持富文本和分类管理',
  'todo-list': '待办事项，管理日常任务和提醒',
  'password-manager': '密码管理器，安全存储和管理密码',
  'backup-tool': '备份工具，创建和恢复系统备份',
  'archive-manager': '归档管理器，创建和解压归档文件',
  'disk-utility': '磁盘工具，管理磁盘分区和格式化',
  'log-viewer': '日志查看器，查看和分析系统日志',
  'character-map': '字符映射表，浏览和复制特殊字符',
  'font-viewer': '字体查看器，预览已安装的字体',
  dictionary: '字典应用，查询单词释义和翻译',
  translator: '翻译器，支持多语言互译',
  maps: '地图应用，查看地图和导航',
  camera: '摄像头应用，拍照和录像',
  'screen-recorder': '屏幕录制器，录制屏幕操作',
  'sound-recorder': '录音机，录制和播放音频',
  bluetooth: '蓝牙管理器，管理蓝牙设备连接',
  wifi: 'Wi-Fi 管理器，管理无线网络连接',
  power: '电源管理，查看电池状态和电源计划',
  about: '关于系统，查看系统信息和版本',
  help: '帮助中心，获取使用帮助和文档',
  'command-ref': '命令参考，查询终端命令用法',
  'color-picker': '取色器，从屏幕选取颜色',
  magnifier: '放大镜，放大屏幕区域',
  'game-snake': '经典贪吃蛇游戏',
  'game-tetris': '经典俄罗斯方块游戏',
}

const appPermissions: Record<string, string[]> = {
  files: ['文件系统读写', '存储访问'],
  terminal: ['系统命令执行', '文件系统访问', '网络访问'],
  browser: ['网络访问', '文件下载', '通知'],
  camera: ['摄像头访问', '麦克风访问', '文件存储'],
  email: ['网络访问', '联系人读取', '通知'],
  chat: ['网络访问', '通知', '联系人读取'],
  'music-player': ['音频播放', '文件读取'],
  'video-player': ['视频播放', '文件读取', '网络访问'],
  'screen-recorder': ['屏幕捕获', '音频录制', '文件存储'],
  'sound-recorder': ['麦克风访问', '文件存储'],
  bluetooth: ['蓝牙适配器', '设备发现'],
  wifi: ['网络配置', '位置信息'],
  firewall: ['网络配置', '系统管理'],
  'password-manager': ['加密存储', '剪贴板访问'],
  'code-editor': ['文件系统读写', '终端访问'],
  'package-manager': ['系统管理', '网络访问'],
  'system-monitor': ['系统信息读取', '进程管理'],
  settings: ['系统配置', '所有权限'],
}

interface InstalledApp {
  id: string
  installDate: string
  version: string
}

export default function SoftwareCenter() {
  const [tab, setTab] = useState<'browse' | 'installed' | 'updates'>('browse')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'size'>('name')
  const [detailApp, setDetailApp] = useState<string | null>(null)
  const [installing, setInstalling] = useState<string | null>(null)
  const [installProgress, setInstallProgress] = useState(0)
  const [installed, setInstalled] = useState<InstalledApp[]>(() =>
    appRegistry.slice(0, 10).map(a => ({
      id: a.id,
      installDate: '2025-01-15',
      version: '1.0.0',
    }))
  )

  const ratings = useMemo(() => {
    const r: Record<string, number> = {}
    appRegistry.forEach(a => {
      r[a.id] = 2.5 + (hashStr(a.id) % 30) / 10
    })
    return r
  }, [])

  const sizes = useMemo(() => {
    const s: Record<string, string> = {}
    appRegistry.forEach(a => {
      const bytes = 500000 + (hashStr(a.id + 'size') % 50000000)
      if (bytes < 1024 * 1024) s[a.id] = (bytes / 1024).toFixed(1) + ' KB'
      else s[a.id] = (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    })
    return s
  }, [])

  const sizeNumbers = useMemo(() => {
    const s: Record<string, number> = {}
    appRegistry.forEach(a => {
      s[a.id] = 500000 + (hashStr(a.id + 'size') % 50000000)
    })
    return s
  }, [])

  const updatesAvailable = useMemo(() => {
    return installed.filter(i => hashStr(i.id + 'update') % 3 === 0).map(i => ({
      ...i,
      newVersion: '2.0.0',
      changeLog: '性能优化和 Bug 修复',
    }))
  }, [installed])

  const categories = [
    { id: 'all', name: '全部' },
    { id: 'system', name: '系统' },
    { id: 'office', name: '办公' },
    { id: 'internet', name: '网络' },
    { id: 'multimedia', name: '多媒体' },
    { id: 'utilities', name: '工具' },
    { id: 'development', name: '开发' },
    { id: 'games', name: '游戏' },
  ]

  const filteredApps = useMemo(() => {
    let apps = appRegistry.filter(a => {
      if (category !== 'all' && a.category !== category) return false
      if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    apps = [...apps].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'rating') return (ratings[b.id] || 0) - (ratings[a.id] || 0)
      return (sizeNumbers[b.id] || 0) - (sizeNumbers[a.id] || 0)
    })
    return apps
  }, [category, search, sortBy, ratings, sizeNumbers])

  const installApp = (appId: string) => {
    setInstalling(appId)
    setInstallProgress(0)
    const interval = setInterval(() => {
      setInstallProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setInstalling(null)
          setInstalled(prev => {
            if (prev.find(i => i.id === appId)) return prev
            return [...prev, { id: appId, installDate: new Date().toLocaleDateString('zh-CN'), version: '1.0.0' }]
          })
          return 100
        }
        return prev + Math.random() * 20
      })
    }, 100)
  }

  const uninstallApp = (appId: string) => {
    setInstalled(prev => prev.filter(i => i.id !== appId))
  }

  const isInstalled = (appId: string) => installed.some(i => i.id === appId)

  const renderStars = (rating: number) => {
    const stars: string[] = []
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) stars.push('★')
      else if (i - 0.5 <= rating) stars.push('★')
      else stars.push('☆')
    }
    return stars.join('')
  }

  const detail = detailApp ? appRegistry.find(a => a.id === detailApp) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4', position: 'relative' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #313244' }}>
        {(['browse', 'installed', 'updates'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
              background: tab === t ? '#313244' : 'transparent',
              color: tab === t ? '#89b4fa' : '#a6adc8',
              fontSize: '12px', fontWeight: tab === t ? 600 : 400,
              borderBottom: tab === t ? '2px solid #89b4fa' : '2px solid transparent',
            }}
          >
            {t === 'browse' ? '浏览' : t === 'installed' ? '已安装' : `更新 (${updatesAvailable.length})`}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #313244', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索应用..."
              style={{
                flex: 1, padding: '7px 12px', background: '#313244', border: '1px solid #45475a',
                borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none',
              }}
            />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'name' | 'rating' | 'size')}
              style={{
                padding: '7px 10px', background: '#313244', border: '1px solid #45475a',
                borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none',
              }}
            >
              <option value="name">名称</option>
              <option value="rating">评分</option>
              <option value="size">大小</option>
            </select>
          </div>

          {category !== 'all' && categoryBanners[category] && (
            <div style={{
              padding: '12px 16px', margin: '10px 12px', borderRadius: '8px',
              background: `${categoryBanners[category].color}22`,
              border: `1px solid ${categoryBanners[category].color}44`,
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '24px' }}>{categoryBanners[category].icon}</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: categoryBanners[category].color }}>
                  {categoryMap[category]}
                </div>
                <div style={{ fontSize: '11px', color: '#a6adc8' }}>
                  {appRegistry.filter(a => a.category === category).length} 个应用
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', padding: '6px 12px', gap: '4px', overflowX: 'auto' }}>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                style={{
                  padding: '4px 12px', border: 'none', borderRadius: '12px', cursor: 'pointer',
                  background: category === c.id ? '#89b4fa' : '#313244',
                  color: category === c.id ? '#1e1e2e' : '#a6adc8', fontSize: '11px', whiteSpace: 'nowrap',
                }}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
              {filteredApps.map(app => (
                <div
                  key={app.id}
                  onClick={() => setDetailApp(app.id)}
                  style={{
                    background: '#313244', borderRadius: '8px', padding: '12px', cursor: 'pointer',
                    border: '1px solid #45475a',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#45475a'}
                  onMouseLeave={e => e.currentTarget.style.background = '#313244'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '28px' }}>{app.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</div>
                      <div style={{ fontSize: '10px', color: '#6c7086' }}>{categoryMap[app.category] || app.category}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: '#f9e2af', fontSize: '11px' }}>{renderStars(ratings[app.id] || 0)}</span>
                      <span style={{ fontSize: '10px', color: '#6c7086', marginLeft: '4px' }}>{(ratings[app.id] || 0).toFixed(1)}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#6c7086' }}>{sizes[app.id]}</span>
                  </div>
                  {installing === app.id && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ background: '#1e1e2e', borderRadius: '3px', height: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(installProgress, 100)}%`, height: '100%', background: '#89b4fa', transition: 'width 0.1s' }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {filteredApps.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6c7086' }}>没有找到匹配的应用</div>
            )}
          </div>
        </>
      )}

      {tab === 'installed' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {installed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c7086' }}>暂无已安装的应用</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {installed.map(inst => {
                const app = appRegistry.find(a => a.id === inst.id)
                if (!app) return null
                return (
                  <div key={inst.id} style={{ background: '#313244', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>{app.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{app.name}</div>
                      <div style={{ fontSize: '10px', color: '#6c7086' }}>v{inst.version} · {inst.installDate}</div>
                    </div>
                    <button
                      onClick={() => uninstallApp(inst.id)}
                      style={{
                        padding: '4px 12px', background: '#f38ba8', color: '#1e1e2e',
                        border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                      }}
                    >
                      卸载
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'updates' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {updatesAvailable.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c7086' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>✅</div>
              所有应用均为最新版本
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {updatesAvailable.map(upd => {
                const app = appRegistry.find(a => a.id === upd.id)
                if (!app) return null
                return (
                  <div key={upd.id} style={{ background: '#313244', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>{app.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{app.name}</div>
                      <div style={{ fontSize: '10px', color: '#a6adc8' }}>{upd.version} → {upd.newVersion}</div>
                      <div style={{ fontSize: '10px', color: '#6c7086' }}>{upd.changeLog}</div>
                    </div>
                    <button
                      onClick={() => installApp(upd.id)}
                      style={{
                        padding: '4px 12px', background: '#89b4fa', color: '#1e1e2e',
                        border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                      }}
                    >
                      更新
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {detail && (
        <div
          onClick={() => setDetailApp(null)}
          style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1e1e2e', borderRadius: '12px', padding: '24px', width: '380px',
              border: '1px solid #45475a', maxHeight: '80%', overflowY: 'auto',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '48px' }}>{detail.icon}</span>
              <h3 style={{ margin: '8px 0 4px', fontSize: '18px' }}>{detail.name}</h3>
              <div style={{ fontSize: '12px', color: '#a6adc8' }}>
                {categoryMap[detail.category] || detail.category} · v1.0.0 · {sizes[detail.id]}
              </div>
              <div style={{ marginTop: '4px' }}>
                <span style={{ color: '#f9e2af', fontSize: '14px' }}>{renderStars(ratings[detail.id] || 0)}</span>
                <span style={{ fontSize: '12px', color: '#a6adc8', marginLeft: '6px' }}>{(ratings[detail.id] || 0).toFixed(1)}</span>
              </div>
            </div>

            <div style={{ background: '#313244', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#89b4fa' }}>描述</div>
              <div style={{ fontSize: '12px', color: '#bac2de', lineHeight: 1.6 }}>
                {appDescriptions[detail.id] || `${detail.name}是一个功能齐全的应用程序。`}
              </div>
            </div>

            <div style={{ background: '#313244', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#89b4fa' }}>更新日志</div>
              <div style={{ fontSize: '11px', color: '#bac2de', lineHeight: 1.6 }}>
                <div>v1.0.0 - 初始发布版本</div>
                <div>v0.9.0 - Beta 测试版本</div>
                <div>v0.8.0 - Alpha 开发版本</div>
              </div>
            </div>

            {(appPermissions[detail.id] || []).length > 0 && (
              <div style={{ background: '#313244', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#89b4fa' }}>权限</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(appPermissions[detail.id] || []).map(p => (
                    <span key={p} style={{ background: '#45475a', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', color: '#a6adc8' }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              {isInstalled(detail.id) ? (
                <button
                  onClick={() => { uninstallApp(detail.id); setDetailApp(null) }}
                  style={{
                    flex: 1, padding: '10px', background: '#f38ba8', color: '#1e1e2e',
                    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  }}
                >
                  卸载
                </button>
              ) : (
                <button
                  onClick={() => { installApp(detail.id); setDetailApp(null) }}
                  disabled={installing === detail.id}
                  style={{
                    flex: 1, padding: '10px',
                    background: installing === detail.id ? '#45475a' : '#89b4fa',
                    color: installing === detail.id ? '#a6adc8' : '#1e1e2e',
                    border: 'none', borderRadius: '6px',
                    cursor: installing === detail.id ? 'not-allowed' : 'pointer',
                    fontSize: '13px', fontWeight: 600,
                  }}
                >
                  {installing === detail.id ? '安装中...' : '安装'}
                </button>
              )}
              <button
                onClick={() => setDetailApp(null)}
                style={{
                  flex: 1, padding: '10px', background: '#45475a', color: '#cdd6f4',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
                }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
