import { useState } from 'react'

const categories: { name: string; range: [number, number]; label: string }[] = [
  { name: '符号', range: [0x2100, 0x214f], label: '符号' },
  { name: '箭头', range: [0x2190, 0x21ff], label: '箭头' },
  { name: '数学', range: [0x2200, 0x22ff], label: '数学' },
  { name: '图形', range: [0x25a0, 0x25ff], label: '图形' },
  { name: '方块', range: [0x2580, 0x259f], label: '方块' },
  { name: '货币', range: [0x20a0, 0x20cf], label: '货币' },
  { name: '希腊', range: [0x0391, 0x03c9], label: '希腊' },
  { name: '制表符', range: [0x2500, 0x257f], label: '制表符' },
  { name: '杂项', range: [0x2600, 0x26ff], label: '杂项' },
  { name: '装饰', range: [0x2700, 0x27bf], label: '装饰' },
]

function generateChars(start: number, end: number): string[] {
  const chars: string[] = []
  for (let i = start; i <= end; i++) {
    chars.push(String.fromCodePoint(i))
  }
  return chars
}

export default function CharacterMap() {
  const [selectedCat, setSelectedCat] = useState(categories[0])
  const [search, setSearch] = useState('')
  const [selectedChar, setSelectedChar] = useState<string | null>(null)
  const [copied, setCopied] = useState('')

  let chars = generateChars(selectedCat.range[0], selectedCat.range[1])

  if (search) {
    chars = chars.filter((c) => {
      try {
        return c.toLowerCase().includes(search.toLowerCase()) ||
          c.codePointAt(0)!.toString(16).includes(search.toLowerCase())
      } catch {
        return false
      }
    })
  }

  const copyChar = (char: string) => {
    navigator.clipboard.writeText(char).catch(() => {})
    setCopied(char)
    setTimeout(() => setCopied(''), 1500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #313244', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => { setSelectedCat(cat); setSelectedChar(null) }}
            style={{
              padding: '4px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
              background: selectedCat.name === cat.name ? '#89b4fa' : '#313244',
              color: selectedCat.name === cat.name ? '#1e1e2e' : '#cdd6f4',
            }}
          >
            {cat.label}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索字符或码点..."
          style={{
            width: '140px', padding: '4px 8px', background: '#313244', border: '1px solid #45475a',
            borderRadius: '4px', color: '#cdd6f4', fontSize: '11px', outline: 'none',
          }}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '3px' }}>
            {chars.map((char, i) => (
              <div
                key={`${char}-${i}`}
                onClick={() => { setSelectedChar(char); copyChar(char) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '36px', background: selectedChar === char ? '#89b4fa' : '#313244',
                  borderRadius: '4px', cursor: 'pointer', fontSize: '16px',
                  color: selectedChar === char ? '#1e1e2e' : '#cdd6f4',
                  border: copied === char ? '2px solid #a6e3a1' : '2px solid transparent',
                }}
                title={`U+${char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`}
              >
                {char}
              </div>
            ))}
          </div>
        </div>

        {selectedChar && (
          <div style={{
            width: '180px', borderLeft: '1px solid #313244', padding: '12px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          }}>
            <div style={{
              width: '80px', height: '80px', background: '#313244', borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '42px',
              border: '2px solid #45475a',
            }}>
              {selectedChar}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#89b4fa' }}>
              U+{selectedChar.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}
            </div>
            <div style={{ fontSize: '11px', color: '#a6adc8', textAlign: 'center' }}>
              十进制: {selectedChar.codePointAt(0)}
            </div>
            <div style={{ fontSize: '10px', color: '#6c7086' }}>点击字符即可复制</div>
          </div>
        )}
      </div>

      <div style={{ padding: '6px 12px', borderTop: '1px solid #313244', fontSize: '11px', color: '#6c7086' }}>
        {chars.length} 个字符 · {selectedCat.label} (U+{selectedCat.range[0].toString(16).toUpperCase()}-U+{selectedCat.range[1].toString(16).toUpperCase()})
      </div>
    </div>
  )
}