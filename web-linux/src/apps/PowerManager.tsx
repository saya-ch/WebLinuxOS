import { useState } from 'react'

export default function PowerManager() {
  const [batteryPercent, setBatteryPercent] = useState(85)
  const [charging, setCharging] = useState(false)
  const [powerMode, setPowerMode] = useState<'power-saver' | 'balanced' | 'performance'>('balanced')
  const [brightness, setBrightness] = useState(80)
  const [showConfirm, setShowConfirm] = useState<'shutdown' | 'restart' | 'hibernate' | null>(null)

  const toggleCharging = () => {
    setCharging(!charging)
    if (!charging) {
      const interval = setInterval(() => {
        setBatteryPercent((prev) => {
          if (prev >= 100) { clearInterval(interval); setCharging(false); return 100 }
          return prev + 1
        })
      }, 200)
    }
  }

  const confirmAction = () => {
    setShowConfirm(null)
  }

  const batteryColor = batteryPercent > 60 ? '#a6e3a1' : batteryPercent > 20 ? '#f9e2af' : '#f38ba8'
  const batteryWidth = Math.max(2, batteryPercent)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #313244', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#a6adc8', marginBottom: '8px' }}>电池状态</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '28px' }}>🔋</span>
          <span style={{ fontSize: '32px', fontWeight: 700, color: batteryColor }}>{batteryPercent}%</span>
          {charging && <span style={{ fontSize: '16px', color: '#f9e2af' }}>⚡</span>}
        </div>

        <div style={{ background: '#313244', borderRadius: '6px', height: '16px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{
            width: `${batteryWidth}%`, height: '100%',
            background: batteryPercent > 60 ? 'linear-gradient(90deg, #a6e3a1, #89b4fa)' :
              batteryPercent > 20 ? 'linear-gradient(90deg, #f9e2af, #fab387)' :
              'linear-gradient(90deg, #f38ba8, #f9e2af)',
            transition: 'width 0.3s',
          }} />
        </div>

        <div style={{ fontSize: '11px', color: '#a6adc8' }}>
          {charging ? '正在充电...' : '使用电池供电'} · 预计剩余 {Math.floor(batteryPercent / 10)} 小时 {batteryPercent % 10 * 6} 分钟
        </div>
        <button
          onClick={toggleCharging}
          style={{
            marginTop: '8px', padding: '4px 12px', background: '#313244', color: '#cdd6f4',
            border: '1px solid #45475a', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
          }}
        >
          {charging ? '断开电源' : '接入电源'}
        </button>
      </div>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid #313244' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>电源模式</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { key: 'power-saver' as const, label: '节能', icon: '🌱', desc: '延长电池寿命' },
            { key: 'balanced' as const, label: '平衡', icon: '⚖️', desc: '自动调节性能' },
            { key: 'performance' as const, label: '性能', icon: '🚀', desc: '最佳性能' },
          ].map((mode) => (
            <button
              key={mode.key}
              onClick={() => setPowerMode(mode.key)}
              style={{
                flex: 1, padding: '12px 8px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                background: powerMode === mode.key ? '#89b4fa' : '#313244',
                color: powerMode === mode.key ? '#1e1e2e' : '#cdd6f4',
                textAlign: 'center', fontSize: '12px',
              }}
            >
              <div style={{ fontSize: '20px' }}>{mode.icon}</div>
              <div style={{ fontWeight: 600, marginTop: '4px' }}>{mode.label}</div>
              <div style={{ fontSize: '10px', opacity: 0.7 }}>{mode.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid #313244' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>屏幕亮度: {brightness}%</div>
        <input
          type="range"
          min="0" max="100" value={brightness}
          onChange={(e) => setBrightness(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#89b4fa' }}
        />
      </div>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid #313244' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>电源统计</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px' }}>
          {[
            { label: '电池健康', value: '92%', color: '#a6e3a1' },
            { label: '循环次数', value: '156', color: '#cdd6f4' },
            { label: '容量', value: '56 Wh', color: '#cdd6f4' },
            { label: '电压', value: '12.3 V', color: '#cdd6f4' },
          ].map((item) => (
            <div key={item.label} style={{ background: '#313244', borderRadius: '6px', padding: '8px 10px' }}>
              <div style={{ fontSize: '11px', color: '#a6adc8' }}>{item.label}</div>
              <div style={{ fontWeight: 600, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        {[
          { key: 'shutdown' as const, label: '关机', icon: '⏻', color: '#f38ba8' },
          { key: 'restart' as const, label: '重启', icon: '🔄', color: '#f9e2af' },
          { key: 'hibernate' as const, label: '休眠', icon: '🌙', color: '#89b4fa' },
        ].map((action) => (
          <button
            key={action.key}
            onClick={() => setShowConfirm(action.key)}
            style={{
              flex: 1, padding: '12px', background: action.color, color: '#1e1e2e',
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            }}
          >
            <div style={{ fontSize: '20px' }}>{action.icon}</div>
            <div>{action.label}</div>
          </button>
        ))}
      </div>

      {showConfirm && (
        <div
          onClick={() => setShowConfirm(null)}
          style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1e1e2e', borderRadius: '12px', padding: '24px', textAlign: 'center',
              border: '1px solid #45475a',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              确认{showConfirm === 'shutdown' ? '关机' : showConfirm === 'restart' ? '重启' : '休眠'}?
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={confirmAction}
                style={{
                  padding: '8px 20px', background: '#f38ba8', color: '#1e1e2e',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                }}
              >
                确认
              </button>
              <button
                onClick={() => setShowConfirm(null)}
                style={{
                  padding: '8px 20px', background: '#45475a', color: '#cdd6f4',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}