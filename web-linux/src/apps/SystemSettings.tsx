import { useState } from 'react'
import { useStore } from '../store'
import { PaletteIcon, ImageIcon, VolumeIcon, WifiIcon, BatteryIcon, InfoIcon, SettingsIcon } from '../icons'

const wallpapers = [
  { id: 'default', name: '默认', style: { background: '#1e1e2e' } },
  { id: 'sunset', name: '日落', style: { background: 'linear-gradient(135deg, #ff6b6b, #feca57)' } },
  { id: 'ocean', name: '海洋', style: { background: 'linear-gradient(135deg, #0c3483, #a2b6df)' } },
  { id: 'forest', name: '森林', style: { background: 'linear-gradient(135deg, #134e5e, #71b280)' } },
  { id: 'purple', name: '紫色', style: { background: 'linear-gradient(135deg, #6a0572, #ab83a1)' } },
  { id: 'midnight', name: '午夜', style: { background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' } },
  { id: 'cherry', name: '樱花', style: { background: 'linear-gradient(135deg, #ffb7b2, #e2f0cb)' } },
  { id: 'fire', name: '火焰', style: { background: 'linear-gradient(135deg, #f12711, #f5af19)' } },
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
      <WifiIcon />
    </span>
  )
}

const categories = [
  { id: 'appearance', name: '外观', icon: <PaletteIcon /> },
  { id: 'wallpaper', name: '壁纸', icon: <ImageIcon /> },
  { id: 'sound', name: '声音', icon: <VolumeIcon /> },
  { id: 'network', name: '网络', icon: <WifiIcon /> },
  { id: 'power', name: '电源', icon: <BatteryIcon /> },
  { id: 'about', name: '关于', icon: <InfoIcon /> },
]

export default function Settings() {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const wallpaper = useStore((s) => s.wallpaper)
  const setWallpaper = useStore((s) => s.setWallpaper)

  const [activeCategory, setActiveCategory] = useState('appearance')
  const [wifiEnabled, setWifiEnabled] = useState(true)
  const [volume, setVolume] = useState(80)

  return (
    <div className="app-container app-settings" style={{ flexDirection: 'row', padding: 0 }}>
      <div className="app-settings-sidebar" style={{ width: 200, borderRight: '1px solid #333', padding: '12px 0', flexShrink: 0 }}>
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
              borderLeft: activeCategory === cat.id ? '3px solid var(--accent)' : '3px solid transparent',
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
            <h3 style={{ marginTop: 0, marginBottom: 24, fontSize: 20 }}>外观设置</h3>
            <div className="app-settings-section" style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>主题模式</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  className={`app-settings-theme-btn${theme === 'light' ? ' active' : ''}`}
                  onClick={() => setTheme('light')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: theme === 'light' ? '2px solid var(--accent)' : '1px solid #555',
                    background: theme === 'light' ? 'var(--accent-bg)' : '#2d2d2d',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 14,
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
                    border: theme === 'dark' ? '2px solid var(--accent)' : '1px solid #555',
                    background: theme === 'dark' ? 'var(--accent-bg)' : '#2d2d2d',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 14,
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
            <h3 style={{ marginTop: 0, marginBottom: 24, fontSize: 20 }}>壁纸设置</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {wallpapers.map((wp) => (
                <div
                  key={wp.id}
                  onClick={() => setWallpaper(wp.id)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: wallpaper === wp.id ? '2px solid var(--accent)' : '1px solid #333',
                  }}
                >
                  <div style={{ ...wp.style, height: 80 }} />
                  <div style={{ padding: '6px 8px', fontSize: 12, textAlign: 'center', background: '#2d2d2d' }}>
                    {wp.name}
                    {wallpaper === wp.id && <span style={{ marginLeft: 4, color: 'var(--accent)' }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeCategory === 'sound' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 24, fontSize: 20 }}>声音设置</h3>
            <div className="app-settings-section">
              <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>音量</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>🔈</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span><VolumeIcon /></span>
                <span style={{ fontFamily: 'monospace', width: 40, textAlign: 'right' }}>{volume}%</span>
              </div>
            </div>
            <div className="app-settings-section" style={{ marginTop: 20 }}>
              <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>输出设备</div>
              <select className="app-select" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: '#2d2d2d', color: '#fff', border: '1px solid #555' }}>
                <option>内置扬声器 - Analog Stereo</option>
                <option>HDMI 输出 - Digital Stereo</option>
              </select>
            </div>
          </div>
        )}

        {activeCategory === 'network' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 24, fontSize: 20 }}>网络设置</h3>
            <div className="app-settings-section" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Wi-Fi</span>
                <button
                  onClick={() => setWifiEnabled(!wifiEnabled)}
                  style={{
                    padding: '6px 18px',
                    borderRadius: 20,
                    border: 'none',
                    background: wifiEnabled ? 'var(--accent)' : '#555',
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
                <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>可用网络</div>
                {wifiNetworks.map((net, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#2d2d2d',
                      borderRadius: 8,
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <SignalIcon level={net.signal} />
                      <span style={{ fontSize: 14 }}>{net.name}</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#888' }}>{net.secured ? '🔒' : '🔓'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeCategory === 'power' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 24, fontSize: 20 }}>电源管理</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                className="app-settings-power-btn"
                style={{
                  padding: '14px 20px',
                  borderRadius: 8,
                  border: '1px solid #555',
                  background: '#2d2d2d',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 20 }}>😴</span>
                <div style={{ textAlign: 'left' }}>
                  <div>休眠</div>
                  <div style={{ fontSize: 12, color: '#888' }}>将当前会话保存到磁盘并进入低功耗模式</div>
                </div>
              </button>
              <button
                className="app-settings-power-btn"
                style={{
                  padding: '14px 20px',
                  borderRadius: 8,
                  border: '1px solid #555',
                  background: '#2d2d2d',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 20 }}>🔄</span>
                <div style={{ textAlign: 'left' }}>
                  <div>重启</div>
                  <div style={{ fontSize: 12, color: '#888' }}>重新启动系统</div>
                </div>
              </button>
              <button
                className="app-settings-power-btn"
                style={{
                  padding: '14px 20px',
                  borderRadius: 8,
                  border: '1px solid #f44747',
                  background: 'rgba(244,71,71,0.15)',
                  color: '#f44747',
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
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
            <h3 style={{ marginTop: 0, marginBottom: 24, fontSize: 20 }}>关于系统</h3>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 64, marginBottom: 8 }}><SettingsIcon /></div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>Web Linux</div>
              <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>版本 1.0.0</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 12, background: '#2d2d2d', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: '#888' }}>内核版本</div>
                <div style={{ fontSize: 14 }}>6.1.0-web</div>
              </div>
              <div style={{ padding: 12, background: '#2d2d2d', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: '#888' }}>桌面环境</div>
                <div style={{ fontSize: 14 }}>WebDE 1.0</div>
              </div>
              <div style={{ padding: 12, background: '#2d2d2d', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: '#888' }}>架构</div>
                <div style={{ fontSize: 14 }}>x86_64 (Web)</div>
              </div>
              <div style={{ padding: 12, background: '#2d2d2d', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: '#888' }}>构建日期</div>
                <div style={{ fontSize: 14 }}>{new Date().toLocaleDateString('zh-CN')}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}