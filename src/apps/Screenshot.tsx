import { useState, useRef } from 'react'

export default function Screenshot() {
  const [mode, setMode] = useState<'full' | 'window' | 'area'>('full')
  const [captured, setCaptured] = useState(false)
  const [saved, setSaved] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const capture = () => {
    setCaptured(true)
    setSaved(false)
  }

  const save = () => {
    setSaved(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #313244', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 600 }}>截图模式:</span>
        {[
          { key: 'full' as const, label: '整个屏幕', icon: '🖥️' },
          { key: 'window' as const, label: '窗口', icon: '🪟' },
          { key: 'area' as const, label: '区域', icon: '✂️' },
        ].map((m) => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); setCaptured(false) }}
            style={{
              padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              background: mode === m.key ? '#89b4fa' : '#313244',
              color: mode === m.key ? '#1e1e2e' : '#cdd6f4', fontSize: '12px',
            }}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        {!captured ? (
          <>
            <div
              ref={previewRef}
              style={{
                width: '320px', height: '200px', background: '#313244', borderRadius: '12px',
                border: '2px dashed #45475a', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexDirection: 'column', gap: '8px',
              }}
            >
              <span style={{ fontSize: '36px' }}>
                {mode === 'full' ? '🖥️' : mode === 'window' ? '🪟' : '✂️'}
              </span>
              <span style={{ color: '#a6adc8', fontSize: '12px' }}>
                {mode === 'full' ? '截取整个屏幕' : mode === 'window' ? '点击窗口截取' : '拖动选择区域'}
              </span>
            </div>
            <button
              onClick={capture}
              style={{
                padding: '10px 24px', background: '#a6e3a1', color: '#1e1e2e',
                border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
              }}
            >
              📸 截取
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                width: '320px', height: '200px', background: '#11111b', borderRadius: '12px',
                border: '2px solid #89b4fa', display: 'flex', alignItems: 'center',
                justifyContent: 'center', position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ background: 'linear-gradient(135deg, #1e1e2e, #313244)', width: '100%', height: '100%', padding: '16px' }}>
                <div style={{ background: '#45475a', height: '20px', borderRadius: '4px', marginBottom: '8px', width: '60%' }} />
                <div style={{ display: 'flex', gap: '8px', height: '100px' }}>
                  <div style={{ background: '#89b4fa', width: '30%', borderRadius: '4px', opacity: 0.6 }} />
                  <div style={{ background: '#a6e3a1', flex: 1, borderRadius: '4px', opacity: 0.6 }} />
                </div>
                <div style={{ background: '#f9e2af', height: '12px', borderRadius: '4px', marginTop: '8px', width: '80%', opacity: 0.6 }} />
              </div>
              {saved && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#a6e3a1', padding: '8px 16px', borderRadius: '6px', color: '#1e1e2e', fontWeight: 600, fontSize: '13px' }}>
                  ✅ 已保存
                </div>
              )}
            </div>

            <div style={{ fontSize: '12px', color: '#a6adc8' }}>截图预览 · 320×200px · 约 15 KB</div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={save}
                style={{
                  padding: '8px 20px', background: '#89b4fa', color: '#1e1e2e',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                }}
              >
                💾 保存
              </button>
              <button
                style={{
                  padding: '8px 20px', background: '#313244', color: '#cdd6f4',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                }}
              >
                📋 复制
              </button>
              <button
                onClick={() => { setCaptured(false); setSaved(false) }}
                style={{
                  padding: '8px 20px', background: '#45475a', color: '#cdd6f4',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                }}
              >
                取消
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {[
                { label: '箭头', icon: '➡️' },
                { label: '文字', icon: '🔤' },
                { label: '矩形', icon: '⬜' },
                { label: '画笔', icon: '🖊️' },
              ].map((tool) => (
                <button
                  key={tool.label}
                  style={{
                    padding: '6px 10px', background: '#313244', color: '#cdd6f4',
                    border: '1px solid #45475a', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
                  }}
                >
                  {tool.icon}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}