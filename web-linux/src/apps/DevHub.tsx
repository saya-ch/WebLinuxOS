import { useState, useCallback, memo, useEffect } from 'react'
import { useStore } from '../store'

// 开发者工具中心 - 集成多个实用开发工具
const DevHub = memo(function DevHub() {
  const [activeTab, setActiveTab] = useState<'json' | 'base64' | 'hash' | 'uuid' | 'timestamp' | 'regex' | 'diff'>('json')
  const addNotification = useStore(s => s.addNotification)
  
  // JSON工具状态
  const [jsonInput, setJsonInput] = useState('')
  const [jsonOutput, setJsonOutput] = useState('')
  const [jsonError, setJsonError] = useState('')
  
  // Base64工具状态
  const [base64Input, setBase64Input] = useState('')
  const [base64Output, setBase64Output] = useState('')
  const [base64Mode, setBase64Mode] = useState<'encode' | 'decode'>('encode')
  
  // Hash工具状态
  const [hashInput, setHashInput] = useState('')
  const [hashOutputs, setHashOutputs] = useState<{md5: string; sha1: string; sha256: string} | null>(null)
  
  // UUID生成器
  const [uuids, setUuids] = useState<string[]>([])
  const [uuidCount, setUuidCount] = useState(5)
  
  // 时间戳工具
  const [timestampInput, setTimestampInput] = useState('')
  const [timestampOutput, setTimestampOutput] = useState('')
  const [currentTimestamp, setCurrentTimestamp] = useState(Date.now())
  
  // Regex测试器
  const [regexPattern, setRegexPattern] = useState('')
  const [regexInput, setRegexInput] = useState('')
  const [regexMatches, setRegexMatches] = useState<RegExpMatchArray | null>(null)
  const [regexError, setRegexError] = useState('')
  
  // Diff工具
  const [diffLeft, setDiffLeft] = useState('')
  const [diffRight, setDiffRight] = useState('')
  const [diffResult, setDiffResult] = useState<{added: string[]; removed: string[]; unchanged: string[]} | null>(null)

  // 更新当前时间戳
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimestamp(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  // JSON格式化
  const formatJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput)
      setJsonOutput(JSON.stringify(parsed, null, 2))
      setJsonError('')
      addNotification({ title: 'JSON格式化成功', message: 'JSON已成功格式化', type: 'success', duration: 2000 })
    } catch (e) {
      setJsonError(`解析错误: ${e instanceof Error ? e.message : '未知错误'}`)
      setJsonOutput('')
    }
  }, [jsonInput, addNotification])

  // JSON压缩
  const minifyJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput)
      setJsonOutput(JSON.stringify(parsed))
      setJsonError('')
      addNotification({ title: 'JSON压缩成功', message: 'JSON已成功压缩', type: 'success', duration: 2000 })
    } catch (e) {
      setJsonError(`解析错误: ${e instanceof Error ? e.message : '未知错误'}`)
      setJsonOutput('')
    }
  }, [jsonInput, addNotification])

  // Base64编码/解码
  const processBase64 = useCallback(() => {
    try {
      if (base64Mode === 'encode') {
        setBase64Output(btoa(unescape(encodeURIComponent(base64Input))))
      } else {
        setBase64Output(decodeURIComponent(escape(atob(base64Input))))
      }
      addNotification({ title: 'Base64处理成功', message: `${base64Mode === 'encode' ? '编码' : '解码'}完成`, type: 'success', duration: 2000 })
    } catch (e) {
      setBase64Output(`错误: ${e instanceof Error ? e.message : '无效输入'}`)
    }
  }, [base64Input, base64Mode, addNotification])

  // 简易Hash计算（使用Web Crypto API）
  const calculateHash = useCallback(async () => {
    if (!hashInput) return
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(hashInput)
      
      // SHA-256
      const sha256Buffer = await crypto.subtle.digest('SHA-256', data)
      const sha256 = Array.from(new Uint8Array(sha256Buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
      
      // SHA-1
      const sha1Buffer = await crypto.subtle.digest('SHA-1', data)
      const sha1 = Array.from(new Uint8Array(sha1Buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
      
      setHashOutputs({
        md5: 'MD5需要额外库支持', // Web Crypto不支持MD5
        sha1,
        sha256
      })
      addNotification({ title: 'Hash计算成功', message: 'SHA-1和SHA-256已计算', type: 'success', duration: 2000 })
    } catch (e) {
      addNotification({ title: 'Hash计算失败', message: e instanceof Error ? e.message : '未知错误', type: 'error', duration: 3000 })
    }
  }, [hashInput, addNotification])

  // UUID生成
  const generateUuids = useCallback(() => {
    const newUuids: string[] = []
    for (let i = 0; i < uuidCount; i++) {
      // 使用crypto.randomUUID()如果可用，否则使用替代方案
      if (crypto.randomUUID) {
        newUuids.push(crypto.randomUUID())
      } else {
        newUuids.push('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0
          const v = c === 'x' ? r : (r & 0x3 | 0x8)
          return v.toString(16)
        }))
      }
    }
    setUuids(newUuids)
    addNotification({ title: 'UUID生成成功', message: `已生成${uuidCount}个UUID`, type: 'success', duration: 2000 })
  }, [uuidCount, addNotification])

  // 时间戳转换
  const convertTimestamp = useCallback(() => {
    try {
      if (!timestampInput) {
        setTimestampOutput('')
        return
      }
      const ts = parseInt(timestampInput)
      if (isNaN(ts)) {
        setTimestampOutput('无效的时间戳')
        return
      }
      const date = new Date(ts > 1e12 ? ts : ts * 1000)
      setTimestampOutput(date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        weekday: 'short'
      }))
    } catch (e) {
      setTimestampOutput('转换失败')
    }
  }, [timestampInput])

  // Regex测试
  const testRegex = useCallback(() => {
    try {
      setRegexError('')
      if (!regexPattern || !regexInput) {
        setRegexMatches(null)
        return
      }
      const regex = new RegExp(regexPattern, 'g')
      const matches = regexInput.match(regex)
      setRegexMatches(matches)
    } catch (e) {
      setRegexError(`正则表达式错误: ${e instanceof Error ? e.message : '未知错误'}`)
      setRegexMatches(null)
    }
  }, [regexPattern, regexInput])

  // 文本Diff
  const computeDiff = useCallback(() => {
    const leftLines = diffLeft.split('\n')
    const rightLines = diffRight.split('\n')
    
    const added: string[] = []
    const removed: string[] = []
    const unchanged: string[] = []
    
    const leftSet = new Set(leftLines)
    const rightSet = new Set(rightLines)
    
    leftLines.forEach(line => {
      if (!rightSet.has(line)) removed.push(line)
      else unchanged.push(line)
    })
    
    rightLines.forEach(line => {
      if (!leftSet.has(line)) added.push(line)
    })
    
    setDiffResult({ added, removed, unchanged })
  }, [diffLeft, diffRight])

  // 复制到剪贴板
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      addNotification({ title: '已复制', message: '内容已复制到剪贴板', type: 'success', duration: 1500 })
    } catch (e) {
      addNotification({ title: '复制失败', message: '无法访问剪贴板', type: 'error', duration: 2000 })
    }
  }, [addNotification])

  // 样式 - 使用React.CSSProperties类型
  const containerStyle: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--window-bg)',
    color: 'var(--text-primary)',
    fontFamily: 'JetBrains Mono, monospace'
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary)',
    border: 'none',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: active ? 600 : 400,
    transition: 'all 0.2s'
  })

  const inputStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '100px',
    padding: '12px',
    background: 'var(--input-bg)',
    border: '1px solid var(--window-border)',
    borderRadius: '6px',
    color: 'var(--text-primary)',
    fontSize: '13px',
    resize: 'vertical',
    fontFamily: 'inherit'
  }

  const outputStyle: React.CSSProperties = {
    ...inputStyle,
    background: 'var(--card-bg)',
    minHeight: '80px'
  }

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'background 0.2s'
  }

  return (
    <div style={containerStyle}>
      {/* 标签导航 */}
      <div style={{ display: 'flex', gap: '4px', padding: '12px', borderBottom: '1px solid var(--window-border)', flexWrap: 'wrap' }}>
        {(['json', 'base64', 'hash', 'uuid', 'timestamp', 'regex', 'diff'] as const).map(tab => (
          <button key={tab} style={tabStyle(activeTab === tab)} onClick={() => setActiveTab(tab)}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
        {/* JSON工具 */}
        {activeTab === 'json' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>JSON格式化/压缩</h3>
            <textarea
              style={inputStyle}
              placeholder="输入JSON..."
              value={jsonInput}
              onChange={e => setJsonInput(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={buttonStyle} onClick={formatJson}>格式化</button>
              <button style={buttonStyle} onClick={minifyJson}>压缩</button>
              {jsonOutput && <button style={{...buttonStyle, background: 'var(--text-secondary)'}} onClick={() => copyToClipboard(jsonOutput)}>复制结果</button>}
            </div>
            {jsonError && <div style={{ color: '#ef4444', fontSize: '13px' }}>{jsonError}</div>}
            {jsonOutput && (
              <textarea style={outputStyle} value={jsonOutput} readOnly />
            )}
          </div>
        )}

        {/* Base64工具 */}
        {activeTab === 'base64' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Base64编码/解码</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{...buttonStyle, background: base64Mode === 'encode' ? 'var(--accent)' : 'var(--text-secondary)'}} onClick={() => setBase64Mode('encode')}>编码</button>
              <button style={{...buttonStyle, background: base64Mode === 'decode' ? 'var(--accent)' : 'var(--text-secondary)'}} onClick={() => setBase64Mode('decode')}>解码</button>
            </div>
            <textarea
              style={inputStyle}
              placeholder={base64Mode === 'encode' ? '输入要编码的文本...' : '输入Base64字符串...'}
              value={base64Input}
              onChange={e => setBase64Input(e.target.value)}
            />
            <button style={buttonStyle} onClick={processBase64}>处理</button>
            {base64Output && (
              <textarea style={outputStyle} value={base64Output} readOnly />
            )}
          </div>
        )}

        {/* Hash工具 */}
        {activeTab === 'hash' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Hash计算</h3>
            <textarea
              style={inputStyle}
              placeholder="输入要计算Hash的文本..."
              value={hashInput}
              onChange={e => setHashInput(e.target.value)}
            />
            <button style={buttonStyle} onClick={calculateHash}>计算Hash</button>
            {hashOutputs && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ padding: '12px', background: 'var(--card-bg)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>SHA-256</div>
                  <div style={{ fontSize: '12px', wordBreak: 'break-all' }}>{hashOutputs.sha256}</div>
                  <button style={{...buttonStyle, fontSize: '11px', padding: '4px 8px', marginTop: '8px'}} onClick={() => copyToClipboard(hashOutputs.sha256)}>复制</button>
                </div>
                <div style={{ padding: '12px', background: 'var(--card-bg)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>SHA-1</div>
                  <div style={{ fontSize: '12px', wordBreak: 'break-all' }}>{hashOutputs.sha1}</div>
                  <button style={{...buttonStyle, fontSize: '11px', padding: '4px 8px', marginTop: '8px'}} onClick={() => copyToClipboard(hashOutputs.sha1)}>复制</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* UUID生成 */}
        {activeTab === 'uuid' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>UUID生成器</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px' }}>生成数量:</label>
              <input
                type="number"
                min={1}
                max={100}
                value={uuidCount}
                onChange={e => setUuidCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                style={{ width: '60px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--window-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              />
              <button style={buttonStyle} onClick={generateUuids}>生成</button>
              {uuids.length > 0 && <button style={{...buttonStyle, background: 'var(--text-secondary)'}} onClick={() => copyToClipboard(uuids.join('\n'))}>复制全部</button>}
            </div>
            {uuids.length > 0 && (
              <div style={{ padding: '12px', background: 'var(--card-bg)', borderRadius: '6px', maxHeight: '300px', overflow: 'auto' }}>
                {uuids.map((uuid, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: i < uuids.length - 1 ? '1px solid var(--window-border)' : 'none' }}>
                    <span style={{ fontSize: '13px' }}>{uuid}</span>
                    <button style={{...buttonStyle, fontSize: '11px', padding: '2px 6px'}} onClick={() => copyToClipboard(uuid)}>复制</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 时间戳工具 */}
        {activeTab === 'timestamp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>时间戳转换</h3>
            <div style={{ padding: '12px', background: 'var(--card-bg)', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>当前时间戳 (毫秒)</div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--accent)' }}>{currentTimestamp}</div>
              <button style={{...buttonStyle, marginTop: '8px'}} onClick={() => copyToClipboard(String(currentTimestamp))}>复制</button>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="输入时间戳..."
                value={timestampInput}
                onChange={e => setTimestampInput(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--window-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              />
              <button style={buttonStyle} onClick={convertTimestamp}>转换</button>
            </div>
            {timestampOutput && (
              <div style={{ padding: '12px', background: 'var(--card-bg)', borderRadius: '6px' }}>
                <div style={{ fontSize: '16px' }}>{timestampOutput}</div>
              </div>
            )}
          </div>
        )}

        {/* Regex测试 */}
        {activeTab === 'regex' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>正则表达式测试</h3>
            <input
              type="text"
              placeholder="输入正则表达式 (不含斜杠)"
              value={regexPattern}
              onChange={e => setRegexPattern(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--window-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '13px' }}
            />
            <textarea
              style={inputStyle}
              placeholder="输入测试文本..."
              value={regexInput}
              onChange={e => setRegexInput(e.target.value)}
            />
            <button style={buttonStyle} onClick={testRegex}>测试</button>
            {regexError && <div style={{ color: '#ef4444', fontSize: '13px' }}>{regexError}</div>}
            {regexMatches && (
              <div style={{ padding: '12px', background: 'var(--card-bg)', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>匹配结果 ({regexMatches.length}个)</div>
                {regexMatches.map((match, i) => (
                  <div key={i} style={{ padding: '4px 8px', background: 'rgba(139, 124, 240, 0.1)', borderRadius: '4px', marginBottom: '4px', fontSize: '13px' }}>
                    {match}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Diff工具 */}
        {activeTab === 'diff' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>文本差异对比</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <textarea
                style={{...inputStyle, minHeight: '150px'}}
                placeholder="原始文本..."
                value={diffLeft}
                onChange={e => setDiffLeft(e.target.value)}
              />
              <textarea
                style={{...inputStyle, minHeight: '150px'}}
                placeholder="修改后文本..."
                value={diffRight}
                onChange={e => setDiffRight(e.target.value)}
              />
            </div>
            <button style={buttonStyle} onClick={computeDiff}>对比</button>
            {diffResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {diffResult.removed.length > 0 && (
                  <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '4px' }}>删除 ({diffResult.removed.length}行)</div>
                    {diffResult.removed.map((line, i) => (
                      <div key={i} style={{ fontSize: '13px', color: '#ef4444' }}>- {line}</div>
                    ))}
                  </div>
                )}
                {diffResult.added.length > 0 && (
                  <div style={{ padding: '12px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: '#22c55e', marginBottom: '4px' }}>添加 ({diffResult.added.length}行)</div>
                    {diffResult.added.map((line, i) => (
                      <div key={i} style={{ fontSize: '13px', color: '#22c55e' }}>+ {line}</div>
                    ))}
                  </div>
                )}
                {diffResult.unchanged.length > 0 && (
                  <div style={{ padding: '12px', background: 'var(--card-bg)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>未变化 ({diffResult.unchanged.length}行)</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {diffResult.unchanged.slice(0, 5).map((line, i) => (
                        <div key={i}>  {line}</div>
                      ))}
                      {diffResult.unchanged.length > 5 && <div>... 还有 {diffResult.unchanged.length - 5} 行</div>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

export default DevHub