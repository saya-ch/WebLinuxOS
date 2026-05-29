import { useState } from 'react'

const templates: Record<string, string> = {
  'react-component': `import React, { useState } from 'react'

export default function MyComponent() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1>Hello World</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}`,
  'api-fetch': `async function fetchData(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Network error')
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

// 使用示例
fetchData('https://api.example.com/data')
  .then(data => console.log(data))`,
  'express-server': `const express = require('express')
const app = express()
const PORT = 3000

app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' })
})

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`)
})`,
  'css-flexbox': `.container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.item {
  flex: 1;
  padding: 1rem;
  background: #f0f0f0;
  border-radius: 8px;
}`,
  'debounce': `function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 使用示例
const handleSearch = debounce((query) => {
  console.log('Searching:', query)
}, 300)`,
  'async-await': `async function processItems(items) {
  const results = []
  for (const item of items) {
    const result = await processItem(item)
    results.push(result)
  }
  return results
}

async function processItem(item) {
  // 处理单个项目
  return item
}`
}

export default function CodeGenerator() {
  const [template, setTemplate] = useState('react-component')
  const [customCode, setCustomCode] = useState('')

  const copyToClipboard = () => {
    const code = template === 'custom' ? customCode : templates[template]
    navigator.clipboard.writeText(code)
  }

  const downloadCode = () => {
    const code = template === 'custom' ? customCode : templates[template]
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = template === 'custom' ? 'code.txt' : `${template}.txt`
    a.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #313244', background: '#181825' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700 }}>⚡ 代码生成器</h1>
        <p style={{ margin: 0, fontSize: '12px', color: '#a6adc8' }}>快速生成常用代码模板</p>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: '250px', background: '#181825', borderRight: '1px solid #313244', padding: '16px', overflowY: 'auto' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#a6adc8' }}>模板</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.keys(templates).map((key) => (
              <button
                key={key}
                onClick={() => setTemplate(key)}
                style={{
                  padding: '12px',
                  background: template === key ? 'linear-gradient(135deg, #313244 0%, #45475a 100%)' : '#313244',
                  border: template === key ? '1px solid #89b4fa' : '1px solid #45475a',
                  borderRadius: '10px',
                  color: '#cdd6f4',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                {key.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
            <button
              onClick={() => setTemplate('custom')}
              style={{
                padding: '12px',
                background: template === 'custom' ? 'linear-gradient(135deg, #313244 0%, #45475a 100%)' : '#313244',
                border: template === 'custom' ? '1px solid #89b4fa' : '1px solid #45475a',
                borderRadius: '10px',
                color: '#cdd6f4',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              自定义
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #313244', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={copyToClipboard} style={{ padding: '8px 16px', background: '#45475a', border: 'none', borderRadius: '8px', color: '#cdd6f4', cursor: 'pointer', fontSize: '13px' }}>
              📋 复制
            </button>
            <button onClick={downloadCode} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #89b4fa 0%, #74c7ec 100%)', border: 'none', borderRadius: '8px', color: '#1e1e2e', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
              💾 下载
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
            {template === 'custom' ? (
              <textarea
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="在此输入您的自定义代码..."
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#181825',
                  border: '1px solid #313244',
                  borderRadius: '10px',
                  padding: '16px',
                  color: '#cdd6f4',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  resize: 'none',
                }}
              />
            ) : (
              <pre style={{
                background: '#181825',
                borderRadius: '10px',
                padding: '20px',
                margin: 0,
                overflow: 'auto',
                fontSize: '14px',
                lineHeight: 1.6,
                color: '#a6e3a1'
              }}>
                <code>{templates[template]}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
