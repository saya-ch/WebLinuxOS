import { useState, useCallback } from 'react'
import { useStore } from '../store'
import { wallpapers } from '../utils/wallpapers'

const solidColors = [
  '#000000', '#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#ffffff',
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
]

const WallpaperGallery = () => {
  const setWallpaper = useStore(state => state.setWallpaper)
  const currentWallpaper = useStore(state => state.wallpaper)
  const [customColor1, setCustomColor1] = useState('#667eea')
  const [customColor2, setCustomColor2] = useState('#764ba2')
  const [searchQuery, setSearchQuery] = useState('')

  const applyWallpaper = useCallback((style: string) => {
    setWallpaper(style)
  }, [setWallpaper])

  const applyCustom = useCallback(() => {
    setWallpaper(`linear-gradient(135deg, ${customColor1} 0%, ${customColor2} 100%)`)
  }, [setWallpaper, customColor1, customColor2])

  const filteredWallpapers = searchQuery
    ? wallpapers.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : wallpapers

  const S = {
    root: {
      padding: '20px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
      overflowY: 'auto' as const,
      color: 'var(--text-primary)',
    },
    title: {
      fontSize: '22px',
      fontWeight: 700,
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    searchBox: {
      padding: '8px 12px',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.05)',
      color: 'var(--text-primary)',
      fontSize: '14px',
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: '12px',
    },
    card: (style: string, selected: boolean) => ({
      cursor: 'pointer',
      borderRadius: '10px',
      overflow: 'hidden',
      border: `2px solid ${selected ? 'var(--accent)' : 'transparent'}`,
      transition: 'all 0.2s ease',
      background: style,
      boxShadow: selected ? '0 0 12px rgba(124,108,240,0.3)' : 'none',
    }),
    cardLabel: {
      padding: '8px 10px',
      background: 'rgba(0,0,0,0.25)',
      color: '#fff',
      fontSize: '12px',
      fontWeight: 500,
      borderRadius: '0 0 8px 8px',
    },
    section: {
      borderTop: '1px solid rgba(255,255,255,0.08)',
      paddingTop: '16px',
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: 600,
      marginBottom: '12px',
    },
    row: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      flexWrap: 'wrap' as const,
    },
    label: {
      fontSize: '13px',
      color: 'var(--text-secondary)',
    },
    colorInput: {
      width: '40px',
      height: '32px',
      padding: 0,
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      background: 'transparent',
    },
    colorHex: {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: 'var(--text-secondary)',
    },
    btn: {
      padding: '8px 20px',
      border: 'none',
      borderRadius: '8px',
      background: 'var(--accent)',
      color: '#fff',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'opacity 0.2s',
    },
    preview: {
      marginTop: '12px',
      aspectRatio: '16/9',
      borderRadius: '10px',
      border: '2px solid rgba(255,255,255,0.08)',
    },
    solidGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(8, 1fr)',
      gap: '8px',
    },
    solidBtn: (color: string) => ({
      aspectRatio: '1',
      borderRadius: '8px',
      border: currentWallpaper === color ? '2px solid var(--accent)' : '2px solid rgba(255,255,255,0.1)',
      background: color,
      cursor: 'pointer',
      transition: 'border-color 0.2s',
    }),
    resetBtn: {
      width: '100%',
      padding: '10px',
      border: 'none',
      borderRadius: '8px',
      background: 'rgba(255,255,255,0.06)',
      color: 'var(--text-primary)',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'background 0.2s',
    },
    count: {
      fontSize: '13px',
      color: 'var(--text-secondary)',
    },
  }

  return (
    <div style={S.root}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={S.title}>Wallpaper Gallery</h2>
        <span style={S.count}>{filteredWallpapers.length} wallpapers</span>
      </div>

      <input
        type="text"
        placeholder="Search wallpapers..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={S.searchBox}
      />

      <div style={S.grid}>
        {filteredWallpapers.map(wallpaper => (
          <div
            key={wallpaper.id}
            style={S.card(wallpaper.style, currentWallpaper === wallpaper.style)}
            onClick={() => applyWallpaper(wallpaper.style)}
            title={wallpaper.name}
          >
            <div style={{ aspectRatio: '16/9' }} />
            <div style={S.cardLabel}>{wallpaper.name}</div>
          </div>
        ))}
      </div>

      {filteredWallpapers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          No wallpapers match "{searchQuery}"
        </div>
      )}

      <div style={S.section}>
        <h3 style={S.sectionTitle}>Custom Gradient</h3>
        <div style={S.row}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={S.label}>From</span>
            <input type="color" value={customColor1} onChange={(e) => setCustomColor1(e.target.value)} style={S.colorInput} />
            <span style={S.colorHex}>{customColor1}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={S.label}>To</span>
            <input type="color" value={customColor2} onChange={(e) => setCustomColor2(e.target.value)} style={S.colorInput} />
            <span style={S.colorHex}>{customColor2}</span>
          </div>
          <button onClick={applyCustom} style={S.btn}>Apply</button>
        </div>
        <div style={{ ...S.preview, background: `linear-gradient(135deg, ${customColor1} 0%, ${customColor2} 100%)` }} />
      </div>

      <div style={S.section}>
        <h3 style={S.sectionTitle}>Solid Colors</h3>
        <div style={S.solidGrid}>
          {solidColors.map(color => (
            <button key={color} onClick={() => setWallpaper(color)} style={S.solidBtn(color)} title={color} />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => setWallpaper('')} style={S.resetBtn}>Reset to Default</button>
      </div>
    </div>
  )
}

export default WallpaperGallery
