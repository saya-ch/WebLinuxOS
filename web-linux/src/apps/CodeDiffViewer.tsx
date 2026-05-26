import { useState, useMemo } from 'react'
import { Copy, Download, FileCode, Trash2, ArrowRight } from 'lucide-react'

export default function CodeDiffViewer() {
  const [original, setOriginal] = useState('')
  const [modified, setModified] = useState('')
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split')

  const diffResult = useMemo(() => {
    if (!original && !modified) return null

    const origLines = original.split('\n')
    const modLines = modified.split('\n')
    const result: Array<{ type: 'same' | 'add' | 'remove' | 'change'; lineNum: number; content: string; otherContent?: string }> = []

    const maxLines = Math.max(origLines.length, modLines.length)

    for (let i = 0; i < maxLines; i++) {
      const origLine = origLines[i]
      const modLine = modLines[i]

      if (origLine === modLine) {
        result.push({ type: 'same', lineNum: i + 1, content: origLine || '' })
      } else if (origLine === undefined) {
        result.push({ type: 'add', lineNum: i + 1, content: modLine })
      } else if (modLine === undefined) {
        result.push({ type: 'remove', lineNum: i + 1, content: origLine })
      } else {
        result.push({ type: 'change', lineNum: i + 1, content: origLine, otherContent: modLine })
      }
    }

    return result
  }, [original, modified])

  const stats = useMemo(() => {
    if (!diffResult) return { added: 0, removed: 0, changed: 0 }

    return {
      added: diffResult.filter(d => d.type === 'add').length,
      removed: diffResult.filter(d => d.type === 'remove').length,
      changed: diffResult.filter(d => d.type === 'change').length,
    }
  }, [diffResult])

  const copyDiff = () => {
    if (!diffResult) return
    const text = diffResult.map(d => {
      switch (d.type) {
        case 'add': return `+ ${d.content}`
        case 'remove': return `- ${d.content}`
        case 'change': return `- ${d.content}\n+ ${d.otherContent}`
        default: return `  ${d.content}`
      }
    }).join('\n')
    navigator.clipboard.writeText(text)
  }

  const downloadDiff = () => {
    if (!diffResult) return
    const text = diffResult.map(d => {
      switch (d.type) {
        case 'add': return `+ ${d.content}`
        case 'remove': return `- ${d.content}`
        case 'change': return `- ${d.content}\n+ ${d.otherContent}`
        default: return `  ${d.content}`
      }
    }).join('\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'diff.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const swapPanels = () => {
    const temp = original
    setOriginal(modified)
    setModified(temp)
  }

  const clearAll = () => {
    setOriginal('')
    setModified('')
  }

  return (
    <div className="app-container" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}>
      <div style={{ padding: 16, borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={swapPanels}
          style={{
            padding: '8px 12px',
            background: 'var(--button-primary)',
            border: 'none',
            borderRadius: 6,
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
          }}
          disabled={!original && !modified}
        >
          <ArrowRight size={14} />
          交换
        </button>

        <button
          onClick={clearAll}
          style={{
            padding: '8px 12px',
            background: 'var(--button-secondary)',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
          }}
          disabled={!original && !modified}
        >
          <Trash2 size={14} />
          清空
        </button>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setViewMode('split')}
          style={{
            padding: '8px 12px',
            background: viewMode === 'split' ? 'var(--button-primary)' : 'var(--button-secondary)',
            border: 'none',
            borderRadius: 6,
            color: viewMode === 'split' ? 'white' : 'inherit',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          分屏
        </button>

        <button
          onClick={() => setViewMode('unified')}
          style={{
            padding: '8px 12px',
            background: viewMode === 'unified' ? 'var(--button-primary)' : 'var(--button-secondary)',
            border: 'none',
            borderRadius: 6,
            color: viewMode === 'unified' ? 'white' : 'inherit',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          统一
        </button>

        <button
          onClick={copyDiff}
          style={{
            padding: '8px 12px',
            background: 'var(--button-secondary)',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
          }}
          disabled={!diffResult}
        >
          <Copy size={14} />
          复制
        </button>

        <button
          onClick={downloadDiff}
          style={{
            padding: '8px 12px',
            background: 'var(--button-primary)',
            border: 'none',
            borderRadius: 6,
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
          }}
          disabled={!diffResult}
        >
          <Download size={14} />
          导出
        </button>
      </div>

      {diffResult && (
        <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 16, fontSize: 13 }}>
          <span style={{ color: '#2ecc71', fontWeight: 600 }}>+{stats.added} 行</span>
          <span style={{ color: '#e74c3c', fontWeight: 600 }}>-{stats.removed} 行</span>
          <span style={{ color: '#3498db', fontWeight: 600 }}>~{stats.changed} 行</span>
        </div>
      )}

      {viewMode === 'split' ? (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)' }}>
            <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              原始文本
            </div>
            <textarea
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              placeholder="粘贴原始代码或文本..."
              style={{
                flex: 1,
                padding: 12,
                border: 'none',
                resize: 'none',
                fontFamily: 'monospace',
                fontSize: 13,
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              修改后
            </div>
            <textarea
              value={modified}
              onChange={(e) => setModified(e.target.value)}
              placeholder="粘贴修改后的代码或文本..."
              style={{
                flex: 1,
                padding: 12,
                border: 'none',
                resize: 'none',
                fontFamily: 'monospace',
                fontSize: 13,
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-primary)' }}>
          {diffResult ? (
            <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
              {diffResult.map((line, i) => (
                <div
                  key={i}
                  style={{
                    padding: '2px 12px',
                    background: line.type === 'add' ? 'rgba(46, 204, 113, 0.1)' : line.type === 'remove' ? 'rgba(231, 76, 60, 0.1)' : line.type === 'change' ? 'rgba(52, 152, 219, 0.1)' : 'transparent',
                    borderLeft: line.type === 'add' ? '3px solid #2ecc71' : line.type === 'remove' ? '3px solid #e74c3c' : line.type === 'change' ? '3px solid #3498db' : '3px solid transparent',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)', marginRight: 12 }}>{line.lineNum}</span>
                  <span style={{ color: line.type === 'add' ? '#2ecc71' : line.type === 'remove' ? '#e74c3c' : line.type === 'change' ? '#3498db' : 'inherit' }}>
                    {line.type === 'add' ? '+ ' : line.type === 'remove' ? '- ' : line.type === 'change' ? '~ ' : '  '}
                    {line.content}
                    {line.type === 'change' && (
                      <>
                        {'\n'}
                        <span style={{ color: '#2ecc71' }}>+ {line.otherContent}</span>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ flex: 1, padding: 12 }}>
                <textarea
                  value={original}
                  onChange={(e) => setOriginal(e.target.value)}
                  placeholder="粘贴原始代码或文本..."
                  style={{
                    width: '100%',
                    height: '100%',
                    padding: 12,
                    border: '1px solid var(--border-color)',
                    borderRadius: 6,
                    resize: 'none',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ padding: '0 12px 12px' }}>
                <textarea
                  value={modified}
                  onChange={(e) => setModified(e.target.value)}
                  placeholder="粘贴修改后的代码或文本..."
                  style={{
                    width: '100%',
                    height: 200,
                    padding: 12,
                    border: '1px solid var(--border-color)',
                    borderRadius: 6,
                    resize: 'none',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {!diffResult && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
        }}>
          <FileCode size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <div style={{ fontSize: 14 }}>在两侧输入代码或文本以查看差异</div>
        </div>
      )}
    </div>
  )
}
