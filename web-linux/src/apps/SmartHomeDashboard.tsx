import { useState, useEffect, useCallback } from 'react'
import {
  Lightbulb, Thermometer, Camera, Tv, Speaker, Wind,
  Lock, Plus, Home, Building2, Zap, Play,
  Fan, Coffee, Bath, Droplets, Flame,
  Battery, Activity,
} from 'lucide-react'
import { useStore } from '../store'

type DeviceType = 'light' | 'thermo' | 'camera' | 'tv' | 'speaker' | 'ac' | 'lock' | 'sensor' | 'fan' | 'coffee' | 'bath' | 'oven' | 'sprinkler'

interface Device {
  id: string
  name: string
  type: DeviceType
  room: string
  on: boolean
  value?: number
  unit?: string
  color?: string
  energy: number
}

interface Room {
  id: string
  name: string
  icon: string
  deviceCount: number
}

interface Scene {
  id: string
  name: string
  icon: string
  description: string
  active: boolean
}

const ROOMS: Room[] = [
  { id: 'all', name: '全部', icon: '🏠', deviceCount: 0 },
  { id: 'living', name: '客厅', icon: '🛋️', deviceCount: 6 },
  { id: 'bedroom', name: '卧室', icon: '🛏️', deviceCount: 4 },
  { id: 'kitchen', name: '厨房', icon: '🍳', deviceCount: 3 },
  { id: 'bathroom', name: '浴室', icon: '🚿', deviceCount: 2 },
  { id: 'office', name: '书房', icon: '💻', deviceCount: 3 },
  { id: 'garden', name: '花园', icon: '🌿', deviceCount: 2 },
]

const INITIAL_DEVICES: Device[] = [
  { id: 'd1', name: '主灯', type: 'light', room: 'living', on: true, value: 80, unit: '%', color: '#fbbf24', energy: 12 },
  { id: 'd2', name: '吊灯', type: 'light', room: 'living', on: false, value: 50, unit: '%', color: '#f59e0b', energy: 0 },
  { id: 'd3', name: '空调', type: 'ac', room: 'living', on: true, value: 24, unit: '°C', energy: 45 },
  { id: 'd4', name: '电视', type: 'tv', room: 'living', on: true, energy: 28 },
  { id: 'd5', name: '音响', type: 'speaker', room: 'living', on: false, value: 40, unit: '%', energy: 0 },
  { id: 'd6', name: '监控', type: 'camera', room: 'living', on: true, energy: 8 },
  { id: 'd7', name: '床头灯', type: 'light', room: 'bedroom', on: false, value: 30, unit: '%', color: '#f472b6', energy: 0 },
  { id: 'd8', name: '空调', type: 'ac', room: 'bedroom', on: false, value: 26, unit: '°C', energy: 0 },
  { id: 'd9', name: '空气净化器', type: 'fan', room: 'bedroom', on: true, value: 2, unit: '档', energy: 15 },
  { id: 'd10', name: '门锁', type: 'lock', room: 'bedroom', on: true, energy: 2 },
  { id: 'd11', name: '咖啡机', type: 'coffee', room: 'kitchen', on: false, energy: 0 },
  { id: 'd12', name: '烤箱', type: 'oven', room: 'kitchen', on: false, value: 180, unit: '°C', energy: 0 },
  { id: 'd13', name: '照明灯', type: 'light', room: 'kitchen', on: true, value: 100, unit: '%', color: '#fbbf24', energy: 18 },
  { id: 'd14', name: '热水器', type: 'bath', room: 'bathroom', on: true, value: 42, unit: '°C', energy: 32 },
  { id: 'd15', name: '浴霸', type: 'light', room: 'bathroom', on: false, value: 50, unit: '%', color: '#f97316', energy: 0 },
  { id: 'd16', name: '台灯', type: 'light', room: 'office', on: true, value: 70, unit: '%', color: '#60a5fa', energy: 10 },
  { id: 'd17', name: '电脑', type: 'tv', room: 'office', on: false, energy: 0 },
  { id: 'd18', name: '传感器', type: 'sensor', room: 'office', on: true, energy: 3 },
  { id: 'd19', name: '喷灌系统', type: 'sprinkler', room: 'garden', on: false, energy: 0 },
  { id: 'd20', name: '花园灯', type: 'light', room: 'garden', on: true, value: 60, unit: '%', color: '#22c55e', energy: 8 },
]

const SCENES: Scene[] = [
  { id: 's1', name: '回家模式', icon: '🏠', description: '开启客厅灯、空调、播放音乐', active: false },
  { id: 's2', name: '离家模式', icon: '🚪', description: '关闭所有灯光和电器、启动安防', active: false },
  { id: 's3', name: '睡眠模式', icon: '🌙', description: '调暗灯光、关闭客厅设备、开启安防', active: false },
  { id: 's4', name: '影院模式', icon: '🎬', description: '关闭灯光、开启电视和音响', active: false },
  { id: 's5', name: '用餐模式', icon: '🍽️', description: '开启餐厅灯、播放轻音乐', active: false },
  { id: 's6', name: '阅读模式', icon: '📖', description: '开启台灯、调至暖色光', active: false },
]

const ENERGY_DATA = [
  { hour: '00', value: 2.1 }, { hour: '02', value: 1.8 },
  { hour: '04', value: 1.5 }, { hour: '06', value: 3.2 },
  { hour: '08', value: 5.8 }, { hour: '10', value: 4.2 },
  { hour: '12', value: 6.1 }, { hour: '14', value: 4.8 },
  { hour: '16', value: 5.2 }, { hour: '18', value: 7.5 },
  { hour: '20', value: 8.3 }, { hour: '22', value: 4.5 },
]

const DEVICE_ICONS: Record<DeviceType, React.ReactNode> = {
  light: <Lightbulb size={20} />,
  thermo: <Thermometer size={20} />,
  camera: <Camera size={20} />,
  tv: <Tv size={20} />,
  speaker: <Speaker size={20} />,
  ac: <Wind size={20} />,
  lock: <Lock size={20} />,
  sensor: <Activity size={20} />,
  fan: <Fan size={20} />,
  coffee: <Coffee size={20} />,
  bath: <Bath size={20} />,
  oven: <Flame size={20} />,
  sprinkler: <Droplets size={20} />,
}

const DEVICE_COLORS: Record<DeviceType, string> = {
  light: '#fbbf24', thermo: '#ef4444', camera: '#8b5cf6',
  tv: '#3b82f6', speaker: '#ec4899', ac: '#06b6d4',
  lock: '#f59e0b', sensor: '#10b981', fan: '#6366f1',
  coffee: '#92400e', bath: '#0ea5e9', oven: '#dc2626',
  sprinkler: '#22c55e',
}

export default function SmartHomeDashboard() {
  const addNotification = useStore((s) => s.addNotification)
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES)
  const [activeRoom, setActiveRoom] = useState('all')
  const [scenes, setScenes] = useState<Scene[]>(SCENES)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [energyHistory] = useState(ENERGY_DATA)
  const [currentPower, setCurrentPower] = useState(4.2)
  const [weather] = useState({ temp: 24, condition: '晴', humidity: 45 })
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPower((prev) => {
        const next = prev + (Math.random() - 0.5) * 0.4
        return Math.max(1, Math.min(10, next))
      })
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  const toggleDevice = useCallback((id: string) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const newOn = !d.on
          addNotification({
            title: newOn ? '已开启' : '已关闭',
            message: `${d.name} 已${newOn ? '开启' : '关闭'}`,
            type: newOn ? 'success' : 'info',
            duration: 2000,
          })
          return { ...d, on: newOn, energy: newOn ? Math.max(1, d.energy || 5) : 0 }
        }
        return d
      })
    )
  }, [addNotification])

  const updateDeviceValue = useCallback((id: string, value: number) => {
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, value } : d)))
  }, [])

  const activateScene = useCallback((sceneId: string) => {
    const scene = scenes.find((s) => s.id === sceneId)
    if (!scene) return
    setScenes((prev) => prev.map((s) => ({ ...s, active: s.id === sceneId ? !s.active : false })))

    if (sceneId === 's2') {
      setDevices((prev) => prev.map((d) => ({ ...d, on: d.type === 'camera' || d.type === 'sensor' || d.type === 'lock' })))
    } else if (sceneId === 's1') {
      setDevices((prev) => prev.map((d) => {
        if (d.room === 'living' && (d.type === 'light' || d.type === 'ac' || d.type === 'speaker')) return { ...d, on: true }
        return d
      }))
    } else if (sceneId === 's3') {
      setDevices((prev) => prev.map((d) => {
        if (d.type === 'light' && d.value !== undefined) return { ...d, on: false, value: 10 }
        if (d.room === 'living') return { ...d, on: false }
        return d
      }))
    } else if (sceneId === 's4') {
      setDevices((prev) => prev.map((d) => {
        if (d.id === 'd1') return { ...d, on: false }
        if (d.type === 'tv' || (d.type === 'speaker' && d.room === 'living')) return { ...d, on: true }
        return d
      }))
    }

    addNotification({ title: '场景已激活', message: scene.name, type: 'success', duration: 2500 })
  }, [scenes, addNotification])

  const filteredDevices = activeRoom === 'all' ? devices : devices.filter((d) => d.room === activeRoom)
  const activeDevices = devices.filter((d) => d.on).length

  const maxEnergy = Math.max(...energyHistory.map((e) => e.value))
  const peakEnergy = Math.max(...energyHistory.map((e) => e.value))
  const todayTotal = energyHistory.reduce((sum, e) => sum + e.value, 0)

  const deviceCard = (d: Device) => {
    const roomInfo = ROOMS.find((r) => r.id === d.room)
    return (
      <div
        key={d.id}
        onClick={() => setSelectedDevice(d)}
        style={{
          background: d.on
            ? `linear-gradient(135deg, ${DEVICE_COLORS[d.type]}20, ${DEVICE_COLORS[d.type]}10)`
            : 'rgba(255,255,255,0.02)',
          border: `1px solid ${d.on ? DEVICE_COLORS[d.type] + '60' : 'var(--window-border)'}`,
          borderRadius: 14,
          padding: 14,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
      >
        {d.on && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, ${DEVICE_COLORS[d.type]}, ${DEVICE_COLORS[d.type]}88)`,
          }} />
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: d.on ? DEVICE_COLORS[d.type] : 'rgba(255,255,255,0.08)',
            color: d.on ? '#fff' : 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}>
            {DEVICE_ICONS[d.type]}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); toggleDevice(d.id) }}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: d.on ? DEVICE_COLORS[d.type] : 'rgba(255,255,255,0.15)',
              position: 'relative', transition: 'background 0.2s',
              padding: 0,
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              background: '#fff', position: 'absolute', top: 3,
              left: d.on ? 23 : 3, transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }} />
          </button>
        </div>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{d.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
          {roomInfo?.icon} {roomInfo?.name}
        </div>
        {d.value !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {d.type === 'light' && (
              <div style={{
                flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${d.value}%`, height: '100%',
                  background: DEVICE_COLORS[d.type], borderRadius: 2,
                }} />
              </div>
            )}
            <span style={{ fontSize: 11, color: d.on ? DEVICE_COLORS[d.type] : 'var(--text-secondary)', fontWeight: 600 }}>
              {d.value}{d.unit}
            </span>
          </div>
        )}
        {d.on && d.energy > 0 && (
          <div style={{
            marginTop: 8, display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10, color: 'var(--text-secondary)',
          }}>
            <Zap size={10} style={{ color: '#fbbf24' }} />
            {d.energy}W
          </div>
        )}
      </div>
    )
  }

  const c: React.CSSProperties = {
    width: '100%', height: '100%',
    background: 'linear-gradient(160deg, rgba(99,102,241,0.06) 0%, rgba(16,185,129,0.04) 50%, rgba(59,130,246,0.05) 100%)',
    display: 'flex', flexDirection: 'column', color: 'var(--text-primary)',
    fontFamily: 'inherit', overflow: 'hidden',
  }
  const hdr: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px', borderBottom: '1px solid var(--window-border)',
    background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)',
  }
  const bb: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px',
    borderRadius: 8, border: '1px solid var(--window-border)',
    background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)',
    cursor: 'pointer', fontSize: 12, transition: 'all 0.18s ease',
  }

  return (
    <div style={c}>
      <div style={hdr}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
          }}>
            <Home size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>智能家居控制中心</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
              <span>·</span>
              <span>{weather.condition} {weather.temp}°C</span>
              <span>·</span>
              <span>湿度 {weather.humidity}%</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
            borderRadius: 10, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
          }}>
            <Zap size={16} style={{ color: '#10b981' }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>当前功率</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>{currentPower.toFixed(1)} kW</div>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
            borderRadius: 10, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
          }}>
            <Battery size={16} style={{ color: '#fbbf24' }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>今日总能耗</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>{todayTotal.toFixed(1)} kWh</div>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
            borderRadius: 10, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
          }}>
            <Activity size={16} style={{ color: '#3b82f6' }} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>在线设备</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6' }}>{activeDevices}/{devices.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: 'var(--window-bg)', border: '1px solid var(--window-border)',
              borderRadius: 14, padding: 16, backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={14} /> 房间
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {ROOMS.map((r) => {
                  const count = r.id === 'all' ? devices.length : devices.filter((d) => d.room === r.id).length
                  return (
                    <button
                      key={r.id}
                      onClick={() => setActiveRoom(r.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: activeRoom === r.id ? 'rgba(99,102,241,0.2)' : 'transparent',
                        color: activeRoom === r.id ? '#fff' : 'var(--text-secondary)',
                        transition: 'all 0.15s', fontSize: 13,
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{r.icon}</span> {r.name}
                      </span>
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 999,
                        background: activeRoom === r.id ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)',
                      }}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{
              background: 'var(--window-bg)', border: '1px solid var(--window-border)',
              borderRadius: 14, padding: 16, backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={14} style={{ color: '#fbbf24' }} /> 能耗曲线
              </div>
              <div style={{ height: 140, display: 'flex', alignItems: 'flex-end', gap: 3 }}>
                {energyHistory.map((e, i) => {
                  const height = (e.value / maxEnergy) * 100
                  const isPeak = e.value === peakEnergy
                  return (
                    <div key={i} style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}>
                      <div style={{
                        width: '100%', height: `${height}%`,
                        background: isPeak
                          ? 'linear-gradient(to top, #fbbf24, #f59e0b)'
                          : 'linear-gradient(to top, rgba(99,102,241,0.6), rgba(99,102,241,0.3))',
                        borderRadius: '4px 4px 0 0',
                        transition: 'all 0.3s',
                      }} />
                      <span style={{ fontSize: 8, color: 'var(--text-secondary)' }}>{e.hour}</span>
                    </div>
                  )
                })}
              </div>
              <div style={{
                marginTop: 10, padding: '8px 10px', borderRadius: 8,
                background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>峰值功率</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>{peakEnergy.toFixed(1)} kW</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
              background: 'var(--window-bg)', border: '1px solid var(--window-border)',
              borderRadius: 14, padding: 16, backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Play size={14} /> 智能场景
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {scenes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => activateScene(s.id)}
                    style={{
                      padding: 14, borderRadius: 12, border: s.active ? '1px solid var(--color-primary)' : '1px solid var(--window-border)',
                      background: s.active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                      display: 'flex', flexDirection: 'column', gap: 6,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
                  >
                    <div style={{ fontSize: 24 }}>{s.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{s.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {ROOMS.find((r) => r.id === activeRoom)?.icon}{' '}
                  {ROOMS.find((r) => r.id === activeRoom)?.name} - 设备
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 11 }}>({filteredDevices.length} 台)</span>
                </div>
                <button style={bb}>
                  <Plus size={14} /> 添加设备
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {filteredDevices.map(deviceCard)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedDevice && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          zIndex: 20, display: 'flex', justifyContent: 'center', alignItems: 'center',
        }} onClick={() => setSelectedDevice(null)}>
          <div style={{
            width: 'min(420px, 92%)', background: 'var(--window-bg)',
            border: '1px solid var(--window-border)', borderRadius: 18,
            overflow: 'hidden', animation: 'scaleIn 0.22s ease',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: 20, background: selectedDevice.on
                ? `linear-gradient(135deg, ${DEVICE_COLORS[selectedDevice.type]}40, ${DEVICE_COLORS[selectedDevice.type]}10)`
                : 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid var(--window-border)',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: selectedDevice.on ? DEVICE_COLORS[selectedDevice.type] : 'rgba(255,255,255,0.1)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {DEVICE_ICONS[selectedDevice.type]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedDevice.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {ROOMS.find((r) => r.id === selectedDevice.room)?.name}
                </div>
              </div>
              <button onClick={() => setSelectedDevice(null)} style={{ ...bb, padding: '6px 10px' }}>✕</button>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 10,
                background: selectedDevice.on
                  ? `${DEVICE_COLORS[selectedDevice.type]}15`
                  : 'rgba(255,255,255,0.03)',
                border: '1px solid var(--window-border)',
              }}>
                <span style={{ fontSize: 13 }}>电源</span>
                <button
                  onClick={() => { toggleDevice(selectedDevice.id); setSelectedDevice((d) => d ? { ...d, on: !d.on } : null) }}
                  style={{
                    width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                    background: selectedDevice.on ? DEVICE_COLORS[selectedDevice.type] : 'rgba(255,255,255,0.15)',
                    position: 'relative', transition: 'background 0.2s', padding: 0,
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3, left: selectedDevice.on ? 27 : 3,
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </button>
              </div>

              {selectedDevice.value !== undefined && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13 }}>
                      {selectedDevice.type === 'light' ? '亮度' : selectedDevice.type === 'thermo' || selectedDevice.type === 'ac' || selectedDevice.type === 'oven' || selectedDevice.type === 'bath' ? '温度' : '音量'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: DEVICE_COLORS[selectedDevice.type] }}>
                      {selectedDevice.value}{selectedDevice.unit}
                    </span>
                  </div>
                  <input
                    type="range" min={selectedDevice.type === 'thermo' || selectedDevice.type === 'ac' ? 16 : 0}
                    max={selectedDevice.type === 'thermo' || selectedDevice.type === 'ac' ? 32 : 100}
                    value={selectedDevice.value}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      updateDeviceValue(selectedDevice.id, v)
                      setSelectedDevice((d) => d ? { ...d, value: v } : null)
                    }}
                    style={{ width: '100%', accentColor: DEVICE_COLORS[selectedDevice.type] }}
                  />
                </div>
              )}

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
              }}>
                <div style={{
                  padding: '10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>功率</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>{selectedDevice.on ? selectedDevice.energy : 0}W</div>
                </div>
                <div style={{
                  padding: '10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>状态</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: selectedDevice.on ? '#10b981' : '#6b7280' }}>
                    {selectedDevice.on ? '在线' : '离线'}
                  </div>
                </div>
                <div style={{
                  padding: '10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>运行时间</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedDevice.on ? '4h 32m' : '0m'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}