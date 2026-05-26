import React, { useState } from 'react'

const TextDiffViewer = () => {
  const [text1, setText1] = useState('Hello, world!\nThis is version 1.')
  const [text2, setText2] = useState('Hello, everyone!\nThis is version 2.')
  const [showDiff, setShowDiff] = useState(false)

  const computeDiff = () => {
    setShowDiff(true)
  }

  const lineDiff = (a: string, b: string) => {
    const lines1 = a.split('\n')
    const lines2 = b.split('\n')
    const result: React.ReactNode[] = []
    let i = 0, j = 0

    while (i < lines1.length || j < lines2.length) {
      if (i < lines1.length && j < lines2.length && lines1[i] === lines2[j]) {
        result.push(
          <div
            key={`unchanged-${i}`}
            style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.02)',
              borderLeft: '4px solid rgba(255,255,255,0.1)',
              color: '#9090a0',
              fontFamily: 'monospace',
              fontSize: 13,
              marginBottom: 2,
            }}
          >
            {lines1[i]}
          </div>
        )
        i++
        j++
      } else {
        if (i < lines1.length) {
          result.push(
            <div
              key={`removed-${i}`}
              style={{
                padding: '6px 12px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderLeft: '4px solid #ef4444',
                color: '#fca5a5',
                fontFamily: 'monospace',
                fontSize: 13,
                marginBottom: 2,
              }}
            >
              - {lines1[i]}
            </div>
          )
          i++
        }
        if (j < lines2.length) {
          result.push(
            <div
              key={`added-${j}`}
              style={{
                padding: '6px 12px',
                background: 'rgba(16, 185, 129, 0.1)',
                borderLeft: '4px solid #10b981',
                color: '#6ee7b7',
                fontFamily: 'monospace',
                fontSize: 13,
                marginBottom: 2,
              }}
            >
              + {lines2[j]}
            </div>
          )
          j++
        }
      }
    }

    return result
  }

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        padding: 16,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: '#fff', margin: 0, fontSize: 20, fontWeight: 600 }}>
          📊 文本比较工具
        </h3>
        <button
          onClick={computeDiff}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(145deg, #60a5fa, #3b82f6)',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          比较
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          flex: 1,
          minHeight: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              color: '#fca5a5',
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            原始文本
          </div>
          <textarea
            value={text1}
            onChange={(e) => setText1(e.target.value)}
            style={{
              flex: 1,
              minHeight: 0,
              background: 'linear-gradient(145deg, #0f0f1a, #0a0a12)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 16,
              fontSize: 14,
              lineHeight: 1.6,
              resize: 'none',
              outline: 'none',
              fontFamily: 'monospace',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              color: '#6ee7b7',
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            新文本
          </div>
          <textarea
            value={text2}
            onChange={(e) => setText2(e.target.value)}
            style={{
              flex: 1,
              minHeight: 0,
              background: 'linear-gradient(145deg, #0f0f1a, #0a0a12)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 16,
              fontSize: 14,
              lineHeight: 1.6,
              resize: 'none',
              outline: 'none',
              fontFamily: 'monospace',
            }}
          />
        </div>
      </div>

      {showDiff && (
        <div
          style={{
            background: 'linear-gradient(145deg, #23233a, #1f1f35)',
            borderRadius: 16,
            padding: 16,
            border: '1px solid rgba(255,255,255,0.05)',
            maxHeight: '40%',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              color: '#9090a0',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            差异结果
          </div>
          <div>{lineDiff(text1, text2)}</div>
        </div>
      )}
    </div>
  )
}

export default TextDiffViewer
