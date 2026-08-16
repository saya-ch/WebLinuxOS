import { useState, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { useStore } from '../store'

const ASCII_FONTS: Record<string, (text: string) => string> = {
  standard: (text: string) => {
    const chars: Record<string, string[]> = {
      'A': ['  ██████  ', ' ██    ██ ', ' ██    ██ ', ' ████████ ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ '],
      'B': [' ████████ ', ' ██    ██ ', ' ██    ██ ', ' ████████ ', ' ██    ██ ', ' ██    ██ ', ' ████████ '],
      'C': [' ████████ ', ' ██       ', ' ██       ', ' ██       ', ' ██       ', ' ██    ██ ', '  ██████  '],
      'D': [' ████████ ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ ', ' ████████ '],
      'E': [' ████████ ', ' ██       ', ' ██       ', ' ██████   ', ' ██       ', ' ██       ', ' ████████ '],
      'F': [' ████████ ', ' ██       ', ' ██       ', ' ██████   ', ' ██       ', ' ██       ', ' ██       '],
      'G': [' ████████ ', ' ██       ', ' ██       ', ' ██   ███ ', ' ██    ██ ', ' ██    ██ ', '  ███████ '],
      'H': [' ██    ██ ', ' ██    ██ ', ' ██    ██ ', ' ████████ ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ '],
      'I': [' ████████ ', '    ██    ', '    ██    ', '    ██    ', '    ██    ', '    ██    ', ' ████████ '],
      'J': ['    ██████', '       ██', '       ██', '       ██', '       ██', ' ██    ██', '  ██████  '],
      'K': [' ██    ██ ', ' ██   ██  ', ' ██  ██   ', ' ██████   ', ' ██  ██   ', ' ██   ██  ', ' ██    ██ '],
      'L': [' ██       ', ' ██       ', ' ██       ', ' ██       ', ' ██       ', ' ██       ', ' ████████ '],
      'M': [' ██    ██ ', ' ███  ███ ', ' ██ ██ ██ ', ' ██ ██ ██ ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ '],
      'N': [' ██    ██ ', ' ███   ██ ', ' ██ ██ ██ ', ' ██ ██ ██ ', ' ██  ███ ', ' ██   ███', ' ██    ██ '],
      'O': ['  ██████  ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ ', '  ██████  '],
      'P': [' ████████ ', ' ██    ██ ', ' ██    ██ ', ' ████████ ', ' ██       ', ' ██       ', ' ██       '],
      'Q': ['  ██████  ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ ', ' ██ ██ ██ ', ' ██  ██ ██', '  ███████ '],
      'R': [' ████████ ', ' ██    ██ ', ' ██    ██ ', ' ████████ ', ' ██  ██   ', ' ██   ██  ', ' ██    ██ '],
      'S': ['  ███████ ', ' ██       ', ' ██       ', '  ██████  ', '       ██ ', '       ██ ', ' ███████  '],
      'T': [' ██████████', '    ██    ', '    ██    ', '    ██    ', '    ██    ', '    ██    ', '    ██    '],
      'U': [' ██    ██ ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ ', '  ██████  '],
      'V': [' ██    ██ ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ ', ' ██    ██ ', '  ██  ██  ', '   ████   '],
      'W': [' ██    ██ ', ' ██    ██ ', ' ██    ██ ', ' ██ ██ ██ ', ' ██ ██ ██ ', ' ███  ███ ', ' ██    ██ '],
      'X': [' ██    ██ ', ' ██    ██ ', '  ██  ██  ', '   ████   ', '  ██  ██  ', ' ██    ██ ', ' ██    ██ '],
      'Y': [' ██    ██ ', ' ██    ██ ', '  ██  ██  ', '   ████   ', '    ██    ', '    ██    ', '    ██    '],
      'Z': [' ████████ ', '    ██    ', '   ██     ', '   ██     ', '  ██      ', ' ██       ', ' ████████ '],
      ' ': ['   ', '   ', '   ', '   ', '   ', '   ', '   '],
      '0': ['  ██████  ', ' ██    ██ ', ' ██   ███', ' ██  █ ██', ' ██ ██ ██', ' ████  ██', '  ██████  '],
      '1': ['     ██   ', '    ███   ', '   ██ ██  ', '  ██  ██  ', '     ██   ', '     ██   ', '  ███████ '],
      '2': ['  ██████  ', ' ██    ██ ', '       ██ ', '      ██  ', '     ██   ', '    ██    ', ' ████████ '],
      '3': ['  ██████  ', ' ██    ██ ', '       ██ ', '   ██████ ', '       ██ ', ' ██    ██ ', '  ██████  '],
      '4': ['      ███ ', '     █ ██ ', '    █  ██ ', '   ███████', '       ██ ', '       ██ ', '       ██ '],
      '5': [' ████████ ', ' ██       ', ' ██████   ', '       ██ ', '       ██ ', ' ██    ██ ', '  ██████  '],
      '6': ['  ██████  ', ' ██       ', ' ██       ', ' ████████ ', ' ██    ██ ', ' ██    ██ ', '  ███████ '],
      '7': [' ████████ ', '       ██ ', '      ██  ', '     ██   ', '    ██    ', '    ██    ', '    ██    '],
      '8': ['  ██████  ', ' ██    ██ ', ' ██    ██ ', '  ██████  ', ' ██    ██ ', ' ██    ██ ', '  ██████  '],
      '9': ['  ███████ ', ' ██    ██ ', ' ██    ██ ', '  ███████ ', '       ██ ', '       ██ ', '  ██████  '],
      '-': ['          ', '          ', '          ', '   ████   ', '          ', '          ', '          '],
      '_': ['          ', '          ', '          ', '          ', '          ', '          ', '██████████'],
      '.': ['          ', '          ', '          ', '          ', '          ', '          ', '    ██    '],
    }
    
    const lines = ['', '', '', '', '', '', '']
    for (const ch of text.toUpperCase()) {
      const glyph = chars[ch] || chars[' ']
      for (let i = 0; i < 7; i++) {
        lines[i] += glyph[i] + ' '
      }
    }
    return lines.join('\n')
  },
  
  'figlet': (text: string) => {
    const fonts: Record<string, string> = {
      'A': '_____\n|_   _|\n  | |\n  | |\n  | |\n  |_|',
      'B': '____\n| __ )\n|  _ \\\n| |_) |\n|  __/\n|_|',
      'C': ' _____\n| ____|\n|  _|\n| |\n| |___\n|_____|',
      'D': ' _____\n|  __ \\\n| |  | |\n| |  | |\n| |__| |\n|_____|',
      'E': ' _____\n| ____|\n|  _|\n| |\n| |___\n|_____|',
      'F': ' _____\n| ____|\n|  _|\n| |\n| |__\n|____|',
      'G': '  ____\n |  _ \\\n | |_) |\n |  __/\n | |\n |_|',
      'H': ' _____\n| | | |\n| |_| |\n|  _  |\n| | | |\n|_| |_|',
      'I': ' ____\n|_   _|\n  | |\n  | |\n  | |\n  |_|',
      ' ': '     \n     \n     \n     \n     \n     ',
    }
    
    const lines: string[] = ['', '', '', '', '', '']
    for (const ch of text.toUpperCase()) {
      const glyph = fonts[ch] || fonts[' ']
      const glyphLines = glyph.split('\n')
      for (let i = 0; i < 6; i++) {
        lines[i] += glyphLines[i] + ' '
      }
    }
    return lines.join('\n')
  },
  
  'banner': (text: string) => {
    const width = text.length * 2 + 4
    const top = '╔' + '═'.repeat(width - 2) + '╗'
    const mid = '║ ' + text + ' ║'
    const bottom = '╚' + '═'.repeat(width - 2) + '╝'
    return `${top}\n${mid}\n${bottom}`
  },
  
  'box': (text: string) => {
    const width = text.length + 4
    const top = '+' + '-'.repeat(width - 2) + '+'
    const mid = '| ' + text + ' |'
    const bottom = '+' + '-'.repeat(width - 2) + '+'
    return `${top}\n${mid}\n${bottom}`
  },
  
  'diamond': (text: string) => {
    const len = text.length
    const height = len + 4
    const lines: string[] = []
    for (let i = 0; i < height; i++) {
      if (i < height / 2) {
        const spaces = Math.floor(i)
        lines.push(' '.repeat(spaces) + '╱' + ' '.repeat(height - 2 - 2 * spaces) + '╲')
      } else {
        const spaces = Math.floor(height - 1 - i)
        lines.push(' '.repeat(spaces) + '╲' + ' '.repeat(height - 2 - 2 * spaces) + '╱')
      }
    }
    const mid = Math.floor(height / 2)
    lines[mid] = '  ' + text + '  '
    return lines.join('\n')
  },
}

const PRESET_TEXTS = [
  'HELLO',
  'DEV',
  'WEB',
  'CODE',
  'LINUX',
  'SYSTEM',
  'TOOLKIT',
  'OPEN SOURCE',
]

export default function AsciiArtGenerator() {
  const addNotification = useStore((s) => s.addNotification)
  const [input, setInput] = useState('HELLO')
  const [font, setFont] = useState('standard')
  const [output, setOutput] = useState('')
  const [customWidth, setCustomWidth] = useState(1)

  const generate = useCallback(() => {
    const text = input.trim()
    if (!text) {
      setOutput('')
      return
    }
    let result = ASCII_FONTS[font](text)
    if (font === 'standard' && customWidth > 1) {
      const lines = result.split('\n')
      const scaled: string[] = []
      for (const line of lines) {
        let scaledLine = ''
        for (const ch of line) {
          scaledLine += ch.repeat(customWidth)
        }
        scaled.push(scaledLine)
      }
      result = scaled.join('\n')
    }
    setOutput(result)
  }, [input, font, customWidth])

  const copyOutput = useCallback(() => {
    if (!output) return
    try {
      navigator.clipboard.writeText(output)
      addNotification({ title: '已复制', message: 'ASCII 艺术已复制到剪贴板', type: 'success' })
    } catch {}
  }, [output, addNotification])

  const downloadOutput = useCallback(() => {
    if (!output) return
    try {
      const blob = new Blob([output], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ascii-art-${input.toLowerCase().replace(/\s+/g, '-')}.txt`
      a.click()
      URL.revokeObjectURL(url)
      addNotification({ title: '已下载', message: 'ASCII 艺术已保存为文件', type: 'success' })
    } catch {}
  }, [output, input, addNotification])

  const clearOutput = () => {
    setInput('')
    setOutput('')
  }

  const wrapOutput = () => {
    if (!output) return
    const border = '═'.repeat(Math.max(...output.split('\n').map(l => l.length)))
    const wrapped = `╔${border}╗\n║${output.split('\n').map(l => l.padEnd(border.length, ' ')).join('║\n║')}║\n╚${border}╝`
    setOutput(wrapped)
  }

  generate()

  const styles: Record<string, CSSProperties> = {
    container: { height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--window-bg)', color: 'var(--text-primary)' },
    header: { padding: '16px 20px', borderBottom: '1px solid var(--window-border)', background: 'linear-gradient(135deg, var(--window-bg), var(--desktop-bg))' },
    title: { fontSize: 18, fontWeight: 700 },
    subtitle: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 },
    content: { flex: 1, overflow: 'auto', padding: 20 },
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid var(--window-border)', borderRadius: 12, padding: 20, marginBottom: 16 },
    input: { width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--window-border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, outline: 'none', boxSizing: 'border-box' as const, letterSpacing: '0.1em' },
    select: { padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--window-border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' as const },
    outputBox: { background: '#0a0a0f', border: '1px solid var(--window-border)', borderRadius: 10, padding: 20, overflow: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: 12, lineHeight: 1.2, whiteSpace: 'pre' as const, color: '#a5f3fc', maxHeight: 400 },
    btn: { padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
    btnSecondary: { padding: '8px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--window-border)', borderRadius: 8, color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13 },
    presetBtn: { padding: '6px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--window-border)', borderRadius: 6, color: 'var(--text-primary)', cursor: 'pointer', fontSize: 12 },
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>ASCII 艺术生成器</div>
        <div style={styles.subtitle}>创建炫酷的 ASCII 文本艺术</div>
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          <input
            style={styles.input}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入英文文本..."
            maxLength={30}
          />
          
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>字体样式：</label>
            <select style={styles.select} value={font} onChange={(e) => setFont(e.target.value)}>
              <option value="standard">标准块状</option>
              <option value="figlet">Figlet 风格</option>
              <option value="banner">横幅边框</option>
              <option value="box">方框装饰</option>
              <option value="diamond">菱形环绕</option>
            </select>

            {font === 'standard' && (
              <>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 12 }}>宽度：</label>
                {[1, 2, 3].map(w => (
                  <button key={w} style={{ ...styles.presetBtn, background: customWidth === w ? 'var(--accent)' : undefined, color: customWidth === w ? '#fff' : undefined }} onClick={() => setCustomWidth(w)}>
                    {w}x
                  </button>
                ))}
              </>
            )}

            <button style={{ ...styles.btnSecondary, marginLeft: 'auto' }} onClick={clearOutput}>
              清空
            </button>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>快速预设：</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PRESET_TEXTS.map(text => (
                <button key={text} style={styles.presetBtn} onClick={() => setInput(text)}>{text}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>实时预览</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={styles.btnSecondary} onClick={wrapOutput}>添加边框</button>
              <button style={styles.btnSecondary} onClick={downloadOutput} disabled={!output}>⬇ 下载</button>
              <button style={styles.btn} onClick={copyOutput} disabled={!output}>📋 复制</button>
            </div>
          </div>
          <div style={styles.outputBox}>
            {output || '输入文本以生成 ASCII 艺术...'}
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>💡 使用提示</h3>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <li>支持英文字母 (A-Z) 和数字 (0-9) 以及常用符号</li>
            <li>"标准块状" 字体使用 7 行高的 ASCII 字符，在终端中效果最佳</li>
            <li>"横幅边框" 样式使用 Unicode 绘制精美的装饰框</li>
            <li>可复制粘贴到 Markdown、README、论坛帖子中</li>
            <li>1x/2x/3x 宽度可以调节字符的粗度</li>
          </ul>
        </div>
      </div>
    </div>
  )
}