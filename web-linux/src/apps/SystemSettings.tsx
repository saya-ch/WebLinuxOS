import { useState } from 'react'
import { useStore } from '../store'

const wallpapers = [
  { id: 'default', name: '默认', style: { background: 'var(--desktop-bg, #1e1e2e)' } },
  { id: 'sunset', name: '日落', style: { background: 'linear-gradient(135deg, #ff6b6b, #feca57)' } },
  { id: 'ocean', name: '海洋', style: { background: 'linear-gradient(135deg, #0c3483, #a2b6df)' } },
  { id: 'forest', name: '森林', style: { background: 'linear-gradient(135deg, #134e5e, #71b280)' } },
  { id: 'purple', name: '紫色', style: { background: 'linear-gradient(135deg, #6a0572, #ab83a1)' } },
  { id: 'midnight', name: '午夜', style: { background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' } },
  { id: 'cherry', name: '樱花', style: { background: 'linear-gradient(135deg, #ffb7b2, #e2f0cb)' } },
  { id: 'fire', name: '火焰', style: { background: 'linear-gradient(135deg, #f12711, #f5af19)' } },
  { id: 'aurora', name: '极光', style: { background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' } },
  { id: 'sunset-purple', name: '晚霞', style: { background: 'linear-gradient(135deg, #cc2b5e, #753a88)' } },
  { id: 'mint', name: '薄荷', style: { background: 'linear-gradient(135deg, #43cea2, #185a9d)' } },
  { id: 'peach', name: '蜜桃', style: { background: 'linear-gradient(135deg, #ffecd2, #fcb69f)' } },
]

const wifiNetworks = [
  { name: 'Home-WiFi-5G', signal: 4, secured: true },
  { name: 'Office-Network', signal: 3, secured: true },
  { name: 'Coffee-Shop-WiFi', signal: 2, secured: false },
  { name: 'Neighbor-Net', signal: 1, secured: true },
]

function SignalIcon({ level }: { level: number }) {
  return (
    <span style={{ fontSize: 14, opacity: level >= 3 ? 1 : level >= 2 ? 0.7 : 0.3 }}>
      {level === 4 ? '📶' : level === 3 ? '📶' : level === 2 ? '📶' : '📶'}
    </span>
  )
}

const categories = [
  { id: 'appearance', name: '外观', icon: '🎨' },
  { id: 'wallpaper', name: '壁纸', icon: '🖼️' },
  { id: 'sound', name: '声音', icon: '🔊' },
  { id: 'network', name: '网络', icon: '🌐' },
  { id: 'power', name: '电源', icon: '🔋' },
  { id: 'about', name: '关于', icon: 'ℹ️' },
]

function PowerConfirmationDialog({ title, message, confirmText, onConfirm, onCancel, isDestructive = false }: {
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        background: 'var(--window-bg)',
        border: '1px solid var(--window-border)',
        borderRadius: 12,
        padding: 24,
        maxWidth: 360,
        width: '90%',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 18, color: 'var(--text-primary)' }}>{title}</h3>
        <p style={{ margin: '0 0 20px 0', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid var(--window-border)',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: isDestructive ? '#ef4444' : 'var(--accent)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Settings() {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const wallpaper = useStore((s) => s.wallpaper)
  const setWallpaper = useStore((s) => s.setWallpaper)
  const clearWindows = useStore((s) => s.clearWindows)

  const [activeCategory, setActiveCategory] = useState('appearance')
  const [wifiEnabled, setWifiEnabled] = useState(true)
  const [volume, setVolume] = useState(80)
  const [powerDialog, setPowerDialog] = useState<{ type: string; title: string; message: string; confirmText: string; isDestructive: boolean } | null>(null)

  const handlePowerAction = (action: string) => {
    switch (action) {
      case 'sleep':
        setPowerDialog({
          type: action,
          title: '进入休眠',
          message: '系统将保存当前状态并进入低功耗模式。确定要继续吗？',
          confirmText: '休眠',
          isDestructive: false,
        })
        break
      case 'restart':
        setPowerDialog({
          type: action,
          title: '重启系统',
          message: '所有未保存的工作将会丢失。确定要重启吗？',
          confirmText: '重启',
          isDestructive: true,
        })
        break
      case 'shutdown':
        setPowerDialog({
          type: action,
          title: '关闭系统',
          message: '系统将会关闭，所有未保存的工作将会丢失。确定要关闭吗？',
          confirmText: '关机',
          isDestructive: true,
        })
        break
    }
  }

  const confirmPowerAction = () => {
    if (!powerDialog) return

    switch (powerDialog.type) {
      case 'sleep':
        useStore.getState().addNotification({
          title: '系统休眠',
          message: '系统已进入休眠模式',
          type: 'info',
          duration: 3000,
        })
        break
      case 'restart':
        clearWindows()
        setTimeout(() => {
          useStore.getState().addNotification({
            title: '系统重启',
            message: '系统已重新启动',
            type: 'success',
            duration: 3000,
          })
        }, 500)
        break
      case 'shutdown':
        clearWindows()
        setTimeout(() => {
          useStore.getState().addNotification({
            title: '系统关闭',
            message: '感谢使用 WebLinuxOS',
            type: 'info',
            duration: 5000,
          })
        }, 500)
        break
    }
    setPowerDialog(null)
  }

  return (
    <div className="app-container app-settings" style={{ flexDirection: 'row', padding: 0 }}>
      <div className="app-settings-sidebar" style={{ width: 200, borderRight: '1px solid var(--window-border)', padding: '12px 0', flexShrink: 0 }}>
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={`app-settings-nav-item${activeCategory === cat.id ? ' active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 14,
              background: activeCategory === cat.id ? 'var(--accent-bg)' : 'transparent',
              color: activeCategory === cat.id ? 'var(--accent)' : 'var(--text-primary)',
              borderLeft: activeCategory === cat.id ? '3px solid var(--accent)' : '3px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        {activeCategory === 'appearance' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 24, fontSize: 20, color: 'var(--text-primary)' }}>外观设置</h3>
            <div className="app-settings-section" style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>主题模式</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  className={`app-settings-theme-btn${theme === 'light' ? ' active' : ''}`}
                  onClick={() => setTheme('light')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: theme === 'light' ? '2px solid var(--accent)' : '1px solid var(--window-border)',
                    background: theme === 'light' ? 'var(--accent-bg)' : 'var(--window-bg)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: 14,
                    transition: 'all 0.2s ease',
                  }}
                >
                  ☀️ 亮色
                </button>
                <button
                  className={`app-settings-theme-btn${theme === 'dark' ? ' active' : ''}`}
                  onClick={() => setTheme('dark')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: theme === 'dark' ? '2px solid var(--accent)' : '1px solid var(--window-border)',
                    background: theme === 'dark' ? 'var(--accent-bg)' : 'var(--window-bg)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: 14,
                    transition: 'all 0.2s ease',
                  }}
                >
                  🌙 暗色
                </button>
              </div>
            </div>
          </div>
        )}

        {activeCategory === 'wallpaper' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 24, fontSize: 20, color: 'var(--text-primary)' }}>壁纸设置</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {wallpapers.map((wp) => (
                <div
                  key={wp.id}
                  onClick={() => setWallpaper(wp.style.background)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: wallpaper === wp.style.background ? '2px solid var(--accent)' : '1px solid var(--window-border)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ ...wp.style, height: 80 }} />
                  <div style={{ padding: '6px 8px', fontSize: 12, textAlign: 'center', background: 'var(--window-bg)', color: 'var(--text-primary)' }}>
                    {wp.name}
                    {wallpaper === wp.style.background && <span style={{ marginLeft: 4, color: 'var(--accent)' }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeCategory === 'sound' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 24, fontSize: 20, color: 'var(--text-primary)' }}>声音设置</h3>
            <div className="app-settings-section">
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>音量</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: 'var(--text-primary)' }}>🔈</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ color: 'var(--text-primary)' }}>🔊</span>
                <span style={{ fontFamily: 'monospace', width: 40, textAlign: 'right', color: 'var(--text-primary)' }}>{volume}%</span>
              </div>
            </div>
            <div className="app-settings-section" style={{ marginTop: 20 }}>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>输出设备</div>
              <select className="app-select" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--window-bg)', color: 'var(--text-primary)', border: '1px solid var(--window-border)' }}>
                <option>内置扬声器 - Analog Stereo</option>
                <option>HDMI 输出 - Digital Stereo</option>
              </select>
            </div>
          </div>
        )}

        {activeCategory === 'network' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 24, fontSize: 20, color: 'var(--text-primary)' }}>网络设置</h3>
            <div className="app-settings-section" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-primary)' }}>Wi-Fi</span>
                <button
                  onClick={() => setWifiEnabled(!wifiEnabled)}
                  style={{
                    padding: '6px 18px',
                    borderRadius: 20,
                    border: 'none',
                    background: wifiEnabled ? 'var(--accent)' : 'var(--window-border)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  {wifiEnabled ? '已开启' : '已关闭'}
                </button>
              </div>
            </div>
            {wifiEnabled && (
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>可用网络</div>
                {wifiNetworks.map((net, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--window-bg)',
                      border: '1px solid var(--window-border)',
                      borderRadius: 8,
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <SignalIcon level={net.signal} />
                      <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{net.name}</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{net.secured ? '🔒' : '🔓'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeCategory === 'power' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 24, fontSize: 20, color: 'var(--text-primary)' }}>电源管理</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                className="app-settings-power-btn"
                onClick={() => handlePowerAction('sleep')}
                style={{
                  padding: '14px 20px',
                  borderRadius: 8,
                  border: '1px solid var(--window-border)',
                  background: 'var(--window-bg)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent-bg)'
                  e.currentTarget.style.borderColor = 'var(--accent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--window-bg)'
                  e.currentTarget.style.borderColor = 'var(--window-border)'
                }}
              >
                <span style={{ fontSize: 20 }}>😴</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: 'var(--text-primary)' }}>休眠</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>将当前会话保存到磁盘并进入低功耗模式</div>
                </div>
              </button>
              <button
                className="app-settings-power-btn"
                onClick={() => handlePowerAction('restart')}
                style={{
                  padding: '14px 20px',
                  borderRadius: 8,
                  border: '1px solid var(--window-border)',
                  background: 'var(--window-bg)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent-bg)'
                  e.currentTarget.style.borderColor = 'var(--accent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--window-bg)'
                  e.currentTarget.style.borderColor = 'var(--window-border)'
                }}
              >
                <span style={{ fontSize: 20 }}>🔄</span>
                <div style={{ textAlign: 'left' }}>
                  <div>重启</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>重新启动系统</div>
                </div>
              </button>
              <button
                className="app-settings-power-btn"
                onClick={() => handlePowerAction('shutdown')}
                style={{
                  padding: '14px 20px',
                  borderRadius: 8,
                  border: '1px solid #ff6b6b',
                  background: 'rgba(255,107,107,0.15)',
                  color: '#ff6b6b',
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,107,107,0.25)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,107,107,0.15)'
                }}
              >
                <span style={{ fontSize: 20 }}>⏻</span>
                <div style={{ textAlign: 'left' }}>
                  <div>关机</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>关闭系统电源</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {activeCategory === 'about' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 24, fontSize: 20, color: 'var(--text-primary)' }}>关于系统</h3>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 64, marginBottom: 8 }}>🐧</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>Web Linux</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>版本 8.2.1</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 12, background: 'var(--window-bg)', border: '1px solid var(--window-border)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>内核版本</div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>6.15.0-web</div>
              </div>
              <div style={{ padding: 12, background: 'var(--window-bg)', border: '1px solid var(--window-border)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>桌面环境</div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>WebDE 4.3</div>
              </div>
              <div style={{ padding: 12, background: 'var(--window-bg)', border: '1px solid var(--window-border)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>架构</div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>x86_64 (Web)</div>
              </div>
              <div style={{ padding: 12, background: 'var(--window-bg)', border: '1px solid var(--window-border)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>构建日期</div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{new Date().toLocaleDateString('zh-CN')}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {powerDialog && (
        <PowerConfirmationDialog
          title={powerDialog.title}
          message={powerDialog.message}
          confirmText={powerDialog.confirmText}
          isDestructive={powerDialog.isDestructive}
          onConfirm={confirmPowerAction}
          onCancel={() => setPowerDialog(null)}
        />
      )}
    </div>
  )
}