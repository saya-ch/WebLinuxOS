import { useState, useCallback } from 'react'
import { Code, Hash, FileJson, Braces, Zap, Globe } from 'lucide-react'
import { useStore } from '../store'

type TabId = 'json' | 'regex' | 'format' | 'http' | 'hash' | 'encode'

interface TabConfig {
  id: TabId
  name: string
  icon: React.ReactNode
}

const TABS: TabConfig[] = [
  { id: 'json', name: 'JSON工具', icon: <FileJson size={16} /> },
  { id: 'regex', name: '正则测试', icon: <Braces size={16} /> },
  { id: 'format', name: '代码格式化', icon: <Code size={16} /> },
  { id: 'http', name: 'HTTP状态码', icon: <Globe size={16} /> },
  { id: 'hash', name: '哈希计算', icon: <Hash size={16} /> },
  { id: 'encode', name: '编码转换', icon: <Zap size={16} /> },
]

const HTTP_STATUS_CODES: Record<number, { message: string; description: string; category: string }> = {
  100: { message: 'Continue', description: '服务器已收到请求的一部分，正在等待其余部分', category: 'Informational' },
  101: { message: 'Switching Protocols', description: '服务器正在切换协议', category: 'Informational' },
  200: { message: 'OK', description: '请求成功', category: 'Success' },
  201: { message: 'Created', description: '请求成功并且服务器创建了新的资源', category: 'Success' },
  202: { message: 'Accepted', description: '服务器已接受请求，但尚未处理', category: 'Success' },
  204: { message: 'No Content', description: '服务器成功处理了请求，但没有返回任何内容', category: 'Success' },
  300: { message: 'Multiple Choices', description: '请求的资源有多个可能的响应', category: 'Redirection' },
  301: { message: 'Moved Permanently', description: '请求的资源已永久移动到新位置', category: 'Redirection' },
  302: { message: 'Found', description: '请求的资源临时移动到了新位置', category: 'Redirection' },
  304: { message: 'Not Modified', description: '资源未被修改，可以使用缓存的版本', category: 'Redirection' },
  400: { message: 'Bad Request', description: '请求无效或无法被服务器理解', category: 'Client Error' },
  401: { message: 'Unauthorized', description: '请求未通过身份验证', category: 'Client Error' },
  403: { message: 'Forbidden', description: '服务器拒绝请求', category: 'Client Error' },
  404: { message: 'Not Found', description: '请求的资源未找到', category: 'Client Error' },
  405: { message: 'Method Not Allowed', description: '请求方法不被允许', category: 'Client Error' },
  408: { message: 'Request Timeout', description: '请求超时', category: 'Client Error' },
  409: { message: 'Conflict', description: '请求与服务器的当前状态冲突', category: 'Client Error' },
  422: { message: 'Unprocessable Entity', description: '请求格式正确，但服务器无法处理', category: 'Client Error' },
  429: { message: 'Too Many Requests', description: '请求过于频繁，请稍后重试', category: 'Client Error' },
  500: { message: 'Internal Server Error', description: '服务器内部错误', category: 'Server Error' },
  501: { message: 'Not Implemented', description: '服务器不支持请求的功能', category: 'Server Error' },
  502: { message: 'Bad Gateway', description: '网关或代理服务器收到无效响应', category: 'Server Error' },
  503: { message: 'Service Unavailable', description: '服务器暂时不可用', category: 'Server Error' },
  504: { message: 'Gateway Timeout', description: '网关或代理服务器超时', category: 'Server Error' },
}

const HASH_ALGORITHMS = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512']

export default function DeveloperToolbox() {
  const [activeTab, setActiveTab] = useState<TabId>('json')
  const addNotification = useStore((s) => s.addNotification)

  const [jsonInput, setJsonInput] = useState('{"name":"test","value":123}')
  const [jsonOutput, setJsonOutput] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)

  const [regexPattern, setRegexPattern] = useState('')
  const [regexFlags, setRegexFlags] = useState('g')
  const [regexTest, setRegexTest] = useState('')
  const [regexMatches, setRegexMatches] = useState<string[]>([])
  const [regexError, setRegexError] = useState<string | null>(null)

  const [codeInput, setCodeInput] = useState('')
  const [codeOutput, setCodeOutput] = useState('')
  const [codeLanguage, setCodeLanguage] = useState('json')
  const [codeError, setCodeError] = useState<string | null>(null)

  const [httpCode, setHttpCode] = useState('')
  const [httpResult, setHttpResult] = useState<typeof HTTP_STATUS_CODES[number] | null>(null)

  const [hashInput, setHashInput] = useState('')
  const [hashAlgorithm, setHashAlgorithm] = useState('SHA-256')
  const [hashResult, setHashResult] = useState('')

  const [encodeInput, setEncodeInput] = useState('')
  const [encodeType, setEncodeType] = useState<'url' | 'base64' | 'html'>('url')
  const [encodeOutput, setEncodeOutput] = useState('')

  const copyText = useCallback((text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text)
      addNotification({ title: '开发者工具箱', message: `${label} 已复制`, type: 'success' })
    } catch {
      addNotification({ title: '开发者工具箱', message: '复制失败', type: 'error' })
    }
  }, [addNotification])

  const handleJsonFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput)
      setJsonOutput(JSON.stringify(parsed, null, 2))
      setJsonError(null)
    } catch (e) {
      setJsonError((e as Error).message)
      setJsonOutput('')
    }
  }, [jsonInput])

  const handleJsonMinify = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput)
      setJsonOutput(JSON.stringify(parsed))
      setJsonError(null)
    } catch (e) {
      setJsonError((e as Error).message)
      setJsonOutput('')
    }
  }, [jsonInput])

  const handleRegexTest = useCallback(() => {
    try {
      if (!regexPattern) {
        setRegexMatches([])
        setRegexError(null)
        return
      }
      const regex = new RegExp(regexPattern, regexFlags)
      const matches = regexTest.match(regex) || []
      setRegexMatches(matches)
      setRegexError(null)
    } catch (e) {
      setRegexError((e as Error).message)
      setRegexMatches([])
    }
  }, [regexPattern, regexFlags, regexTest])

  const handleCodeFormat = useCallback(() => {
    try {
      if (!codeInput) {
        setCodeOutput('')
        setCodeError(null)
        return
      }

      let result = ''
      if (codeLanguage === 'json') {
        const parsed = JSON.parse(codeInput)
        result = JSON.stringify(parsed, null, 2)
      } else if (codeLanguage === 'javascript' || codeLanguage === 'typescript') {
        result = codeInput
      } else if (codeLanguage === 'css') {
        result = codeInput
      } else if (codeLanguage === 'html') {
        result = codeInput
      }

      setCodeOutput(result)
      setCodeError(null)
    } catch (e) {
      setCodeError((e as Error).message)
      setCodeOutput('')
    }
  }, [codeInput, codeLanguage])

  const handleHttpLookup = useCallback(() => {
    const code = parseInt(httpCode)
    if (!isNaN(code) && HTTP_STATUS_CODES[code]) {
      setHttpResult(HTTP_STATUS_CODES[code])
    } else {
      setHttpResult(null)
    }
  }, [httpCode])

  const handleHash = useCallback(async () => {
    if (!hashInput) {
      setHashResult('')
      return
    }

    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(hashInput)
      const hashBuffer = await crypto.subtle.digest(hashAlgorithm, data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      setHashResult(hashArray.map(b => b.toString(16).padStart(2, '0')).join(''))
    } catch {
      setHashResult('计算失败')
    }
  }, [hashInput, hashAlgorithm])

  const handleEncode = useCallback(() => {
    try {
      let result = ''
      switch (encodeType) {
        case 'url':
          result = encodeURIComponent(encodeInput)
          break
        case 'base64':
          result = btoa(encodeInput)
          break
        case 'html':
          const div = document.createElement('div')
          div.textContent = encodeInput
          result = div.innerHTML
          break
      }
      setEncodeOutput(result)
    } catch {
      setEncodeOutput('编码失败')
    }
  }, [encodeInput, encodeType])

  const handleDecode = useCallback(() => {
    try {
      let result = ''
      switch (encodeType) {
        case 'url':
          result = decodeURIComponent(encodeInput)
          break
        case 'base64':
          result = atob(encodeInput)
          break
        case 'html':
          const div = document.createElement('div')
          div.innerHTML = encodeInput
          result = div.textContent || ''
          break
      }
      setEncodeOutput(result)
    } catch {
      setEncodeOutput('解码失败')
    }
  }, [encodeInput, encodeType])

  const renderJsonPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleJsonFormat}
          style={{
            flex: 1,
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            transition: 'opacity 0.2s',
          }}
        >
          格式化
        </button>
        <button
          onClick={handleJsonMinify}
          style={{
            flex: 1,
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
            transition: 'all 0.2s',
          }}
        >
          压缩
        </button>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>输入</div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: 12,
              resize: 'none',
              outline: 'none',
            }}
            placeholder="输入JSON..."
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>输出</div>
            {jsonOutput && (
              <button
                onClick={() => copyText(jsonOutput, 'JSON')}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: 'none',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                复制
              </button>
            )}
          </div>
          {jsonError ? (
            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,100,100,0.2)', color: '#ff6464', fontSize: 12 }}>
              ❌ {jsonError}
            </div>
          ) : (
            <textarea
              value={jsonOutput}
              readOnly
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)',
                color: '#00d6c1',
                fontFamily: 'monospace',
                fontSize: 12,
                resize: 'none',
                outline: 'none',
              }}
              placeholder="输出..."
            />
          )}
        </div>
      </div>
    </div>
  )

  const renderRegexPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={regexPattern}
          onChange={(e) => setRegexPattern(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.3)',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: 13,
            outline: 'none',
          }}
          placeholder="正则表达式，如: /pattern/g"
        />
        <select
          value={regexFlags}
          onChange={(e) => setRegexFlags(e.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.3)',
            color: '#fff',
            fontSize: 13,
            outline: 'none',
          }}
        >
          <option value="g">global</option>
          <option value="i">ignoreCase</option>
          <option value="gi">global + ignoreCase</option>
          <option value="m">multiline</option>
        </select>
        <button
          onClick={handleRegexTest}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          测试
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>测试文本</div>
          <textarea
            value={regexTest}
            onChange={(e) => setRegexTest(e.target.value)}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: 12,
              resize: 'none',
              outline: 'none',
            }}
            placeholder="输入要测试的文本..."
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>匹配结果</div>
            {regexMatches.length > 0 && (
              <span style={{ fontSize: 12, color: '#00d6c1' }}>找到 {regexMatches.length} 个匹配</span>
            )}
          </div>
          {regexError ? (
            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,100,100,0.2)', color: '#ff6464', fontSize: 12 }}>
              ❌ {regexError}
            </div>
          ) : regexMatches.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {regexMatches.map((match, i) => (
                <span
                  key={i}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: 'rgba(0,214,193,0.2)',
                    color: '#00d6c1',
                    fontFamily: 'monospace',
                    fontSize: 12,
                  }}
                >
                  {match}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
              无匹配结果
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderFormatPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <select
          value={codeLanguage}
          onChange={(e) => setCodeLanguage(e.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.3)',
            color: '#fff',
            fontSize: 13,
            outline: 'none',
          }}
        >
          <option value="json">JSON</option>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="css">CSS</option>
          <option value="html">HTML</option>
        </select>
        <button
          onClick={handleCodeFormat}
          style={{
            flex: 1,
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          格式化代码
        </button>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>输入</div>
          <textarea
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: 12,
              resize: 'none',
              outline: 'none',
            }}
            placeholder="输入代码..."
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>输出</div>
            {codeOutput && (
              <button
                onClick={() => copyText(codeOutput, '代码')}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: 'none',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                复制
              </button>
            )}
          </div>
          {codeError ? (
            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,100,100,0.2)', color: '#ff6464', fontSize: 12 }}>
              ❌ {codeError}
            </div>
          ) : (
            <textarea
              value={codeOutput}
              readOnly
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)',
                color: '#00d6c1',
                fontFamily: 'monospace',
                fontSize: 12,
                resize: 'none',
                outline: 'none',
              }}
              placeholder="输出..."
            />
          )}
        </div>
      </div>
    </div>
  )

  const renderHttpPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={httpCode}
          onChange={(e) => setHttpCode(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.3)',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: 13,
            outline: 'none',
          }}
          placeholder="输入HTTP状态码，如: 404"
        />
        <button
          onClick={handleHttpLookup}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          查询
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {httpResult ? (
          <div style={{ padding: 16, borderRadius: 12, background: 'linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.2) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 700,
                color: '#fff',
              }}>
                {httpCode}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>{httpResult.message}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{httpResult.category}</div>
              </div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(0,0,0,0.2)', fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
              {httpResult.description}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
            {Object.entries(HTTP_STATUS_CODES).map(([code, info]) => (
              <div
                key={code}
                onClick={() => {
                  setHttpCode(code)
                  setHttpResult(info)
                }}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(102,126,234,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{code}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{info.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderHashPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={hashInput}
          onChange={(e) => setHashInput(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.3)',
            color: '#fff',
            fontSize: 13,
            outline: 'none',
          }}
          placeholder="输入要计算哈希的文本..."
        />
        <select
          value={hashAlgorithm}
          onChange={(e) => setHashAlgorithm(e.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.3)',
            color: '#fff',
            fontSize: 13,
            outline: 'none',
          }}
        >
          {HASH_ALGORITHMS.map((alg) => (
            <option key={alg} value={alg}>{alg}</option>
          ))}
        </select>
        <button
          onClick={handleHash}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          计算
        </button>
      </div>
      {hashResult && (
        <div style={{ padding: 16, borderRadius: 12, background: 'linear-gradient(135deg, rgba(0,214,193,0.2) 0%, rgba(155,138,240,0.2) 100%)' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{hashAlgorithm} 哈希</div>
          <div style={{
            padding: 12,
            borderRadius: 8,
            background: 'rgba(0,0,0,0.3)',
            fontFamily: 'monospace',
            fontSize: 13,
            color: '#00d6c1',
            wordBreak: 'break-all',
          }}>
            {hashResult}
          </div>
          <button
            onClick={() => copyText(hashResult, '哈希值')}
            style={{
              marginTop: 12,
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            复制哈希值
          </button>
        </div>
      )}
    </div>
  )

  const renderEncodePanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <select
          value={encodeType}
          onChange={(e) => setEncodeType(e.target.value as typeof encodeType)}
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.3)',
            color: '#fff',
            fontSize: 13,
            outline: 'none',
          }}
        >
          <option value="url">URL编码</option>
          <option value="base64">Base64编码</option>
          <option value="html">HTML编码</option>
        </select>
        <button
          onClick={handleEncode}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          编码
        </button>
        <button
          onClick={handleDecode}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          解码
        </button>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>输入</div>
          <textarea
            value={encodeInput}
            onChange={(e) => setEncodeInput(e.target.value)}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: 12,
              resize: 'none',
              outline: 'none',
            }}
            placeholder="输入文本..."
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>输出</div>
            {encodeOutput && (
              <button
                onClick={() => copyText(encodeOutput, '编码结果')}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: 'none',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                复制
              </button>
            )}
          </div>
          <textarea
            value={encodeOutput}
            readOnly
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.3)',
              color: '#00d6c1',
              fontFamily: 'monospace',
              fontSize: 12,
              resize: 'none',
              outline: 'none',
            }}
            placeholder="输出..."
          />
        </div>
      </div>
    </div>
  )

  const renderPanel = () => {
    switch (activeTab) {
      case 'json': return renderJsonPanel()
      case 'regex': return renderRegexPanel()
      case 'format': return renderFormatPanel()
      case 'http': return renderHttpPanel()
      case 'hash': return renderHashPanel()
      case 'encode': return renderEncodePanel()
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
    }}>
      <div style={{
        padding: '12px 16px',
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        gap: 4,
        overflowX: 'auto',
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === tab.id
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, padding: 16, overflow: 'auto' }}>
        {renderPanel()}
      </div>
    </div>
  )
}