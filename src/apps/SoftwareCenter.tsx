import { useState } from 'react'
import { useStore } from '../store'
import { appRegistry } from '../apps'

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

export default function SoftwareCenter() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [detailApp, setDetailApp] = useState<string | null>(null)
  const openApp = useStore((s) => s.openApp)

  const filtered = appRegistry.filter((app) => {
    if (category !== 'all' && app.category !== category) return false
    if (search && !app.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const detail = detailApp ? appRegistry.find((a) => a.id === detailApp) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #313244', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索应用..."
          style={{
            flex: 1, padding: '8px 12px', background: '#313244', border: '1px solid #45475a',
            borderRadius: '6px', color: '#cdd6f4', fontSize: '13px', outline: 'none',
          }}
        />
      </div>
      <div style={{ display: 'flex', padding: '8px 16px', gap: '6px', borderBottom: '1px solid #313244', overflowX: 'auto' }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            style={{
              padding: '6px 14px', border: 'none', borderRadius: '16px', cursor: 'pointer',
              background: category === cat.id ? '#89b4fa' : '#313244',
              color: category === cat.id ? '#1e1e2e' : '#a6adc8', fontSize: '12px', whiteSpace: 'nowrap',
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
          {filtered.map((app) => (
            <div
              key={app.id}
              onClick={() => setDetailApp(app.id)}
              style={{
                background: '#313244', borderRadius: '8px', padding: '14px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                border: '1px solid #45475a', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#45475a')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#313244')}
            >
              <span style={{ fontSize: '36px' }}>{app.icon}</span>
              <div style={{ fontWeight: 600, fontSize: '13px', textAlign: 'center' }}>{app.name}</div>
              <div style={{ fontSize: '11px', color: '#a6adc8', textAlign: 'center' }}>
                {app.category === 'system' ? '系统' : app.category === 'office' ? '办公' : app.category === 'internet' ? '网络' : app.category === 'multimedia' ? '多媒体' : app.category === 'utilities' ? '工具' : app.category === 'development' ? '开发' : '游戏'}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); openApp(app.id) }}
                style={{
                  marginTop: '4px', padding: '6px 18px', background: '#89b4fa', color: '#1e1e2e',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                }}
              >
                打开
              </button>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c7086' }}>没有找到匹配的应用</div>
        )}
      </div>

      {detail && (
        <div
          onClick={() => setDetailApp(null)}
          style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1e1e2e', borderRadius: '12px', padding: '24px', width: '360px',
              border: '1px solid #45475a', textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '48px' }}>{detail.icon}</span>
            <h3 style={{ margin: '8px 0', color: '#cdd6f4' }}>{detail.name}</h3>
            <div style={{ fontSize: '12px', color: '#a6adc8', marginBottom: '12px' }}>
              分类: {detail.category} | 版本: 1.0.0
            </div>
            <p style={{ fontSize: '13px', color: '#bac2de', marginBottom: '16px' }}>
              {detail.name} 是一个功能齐全的应用程序。
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => { openApp(detail.id); setDetailApp(null) }}
                style={{
                  padding: '8px 24px', background: '#89b4fa', color: '#1e1e2e',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                }}
              >
                打开
              </button>
              <button
                onClick={() => setDetailApp(null)}
                style={{
                  padding: '8px 24px', background: '#45475a', color: '#cdd6f4',
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