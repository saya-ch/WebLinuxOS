import { useState } from 'react'

const fontFamilies = [
  'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'Source Code Pro',
  'Ubuntu Mono', 'Consolas', 'Monaco', 'Courier New', 'IBM Plex Mono',
  'Roboto Mono', 'DejaVu Sans Mono', 'Hack', 'Menlo', 'monospace',
]

const systemFonts = [
  { name: 'Sans-serif', preview: 'Ag 敏捷的棕色狐狸' },
  { name: 'Serif', preview: 'Ag 敏捷的棕色狐狸' },
  { name: 'Monospace', preview: 'Ag 敏捷的棕色狐狸' },
  { name: 'Cursive', preview: 'Ag 敏捷的棕色狐狸' },
  { name: 'Fantasy', preview: 'Ag 敏捷的棕色狐狸' },
  { name: 'System UI', preview: 'Ag 敏捷的棕色狐狸' },
]

export default function FontViewer() {
  const [previewText, setPreviewText] = useState('敏捷的棕色狐狸跳过了懒狗\nThe quick brown fox jumps over the lazy dog\n0123456789 !@#$%^&*()')
  const [fontSize, setFontSize] = useState(24)
  const [selectedFont, setSelectedFont] = useState(fontFamilies[0])
  const [bold, setBold] = useState(false)
  const [italic, setItalic] = useState(false)
  const [tab, setTab] = useState<'monospace' | 'system'>('monospace')

  const fontStyle: React.CSSProperties = {
    fontFamily: selectedFont,
    fontSize: `${fontSize}px`,
    fontWeight: bold ? 700 : 400,
    fontStyle: italic ? 'italic' : 'normal',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #313244', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => setTab('monospace')}
          style={{
            padding: '4px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
            background: tab === 'monospace' ? '#89b4fa' : '#313244',
            color: tab === 'monospace' ? '#1e1e2e' : '#cdd6f4',
          }}
        >
          等宽字体
        </button>
        <button
          onClick={() => setTab('system')}
          style={{
            padding: '4px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
            background: tab === 'system' ? '#89b4fa' : '#313244',
            color: tab === 'system' ? '#1e1e2e' : '#cdd6f4',
          }}
        >
          系统字体
        </button>
        <span style={{ color: '#45475a' }}>|</span>
        <button
          onClick={() => setBold(!bold)}
          style={{ padding: '4px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, background: bold ? '#89b4fa' : '#313244', color: bold ? '#1e1e2e' : '#cdd6f4' }}
        >
          B
        </button>
        <button
          onClick={() => setItalic(!italic)}
          style={{ padding: '4px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontStyle: 'italic', background: italic ? '#89b4fa' : '#313244', color: italic ? '#1e1e2e' : '#cdd6f4' }}
        >
          I
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: '#a6adc8' }}>{fontSize}px</span>
          <input
            type="range"
            min="10"
            max="72"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            style={{ width: '80px', accentColor: '#89b4fa' }}
          />
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: '200px', borderRight: '1px solid #313244', overflowY: 'auto', padding: '4px' }}>
          {(tab === 'monospace' ? fontFamilies : systemFonts.map((f) => ({ name: f.name, sample: f.preview }))).map((font) => {
            const fontName = typeof font === 'string' ? font : font.name
            const sample = typeof font === 'string' ? 'AaBbCc 敏捷' : (font as { sample: string }).sample
            return (
              <div
                key={fontName}
                onClick={() => setSelectedFont(fontName)}
                style={{
                  padding: '8px 10px', cursor: 'pointer', borderRadius: '4px',
                  background: selectedFont === fontName ? '#313244' : 'transparent',
                  marginBottom: '2px',
                }}
              >
                <div style={{ fontSize: '13px', fontFamily: fontName, fontWeight: 500 }}>{fontName}</div>
                <div style={{ fontSize: '11px', color: '#a6adc8', fontFamily: fontName }}>{sample}</div>
              </div>
            )
          })}
        </div>

        <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <textarea
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            style={{
              width: '100%', height: '60px', padding: '8px', background: '#313244',
              border: '1px solid #45475a', borderRadius: '6px', color: '#cdd6f4',
              fontSize: '12px', resize: 'none', outline: 'none', fontFamily: 'monospace',
            }}
            placeholder="输入预览文本..."
          />
          <div
            style={{
              flex: 1, background: '#11111b', borderRadius: '8px', padding: '16px',
              border: '1px solid #313244', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              ...fontStyle,
            }}
          >
            {previewText}
          </div>
          <div style={{ fontSize: '11px', color: '#6c7086' }}>
            当前字体: {selectedFont} · {fontSize}px · {bold ? '粗体' : '正常'} · {italic ? '斜体' : '正常'}
          </div>
        </div>
      </div>
    </div>
  )
}