import { useState, useCallback, useMemo } from 'react'
import { Shield, EyeOff, Copy, Download, Trash2, AlertTriangle, Check, FileText, Lock, Unlock, Search, ShieldCheck } from 'lucide-react'

type DetectionMode = 'detect-only' | 'mask' | 'hash' | 'remove'

interface PIIDetection {
  type: string
  label: string
  value: string
  position: number
  severity: 'high' | 'medium' | 'low'
  masked: string
}

const PII_PATTERNS: { type: string; label: string; regex: RegExp; severity: 'high' | 'medium' | 'low' }[] = [
  { type: 'email', label: '邮箱地址', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, severity: 'medium' },
  { type: 'phone', label: '手机号码', regex: /1[3-9]\d{9}/g, severity: 'high' },
  { type: 'id-card', label: '身份证号', regex: /[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]/g, severity: 'high' },
  { type: 'bank-card', label: '银行卡号', regex: /\b(?:\d{4}[- ]?){3}\d{4}\b/g, severity: 'high' },
  { type: 'ip', label: 'IP地址', regex: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g, severity: 'low' },
  { type: 'api-key', label: 'API密钥', regex: /(?:api[_-]?key|apikey|access[_-]?token|secret[_-]?key)\s*[:=]\s*['"]?[a-zA-Z0-9_\-]{20,}['"]?/gi, severity: 'high' },
  { type: 'jwt', label: 'JWT令牌', regex: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, severity: 'high' },
  { type: 'password', label: '密码', regex: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{4,}['"]/gi, severity: 'high' },
  { type: 'credit-card', label: '信用卡号', regex: /\b(?:\d{4}[- ]?){3}\d{4}\b/g, severity: 'high' },
  { type: 'ssn', label: '社保账号', regex: /\b\d{3}-\d{2}-\d{4}\b/g, severity: 'high' },
  { type: 'github-token', label: 'GitHub Token', regex: /ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82}/g, severity: 'high' },
  { type: 'private-key', label: '私钥', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g, severity: 'high' },
  { type: 'aws-key', label: 'AWS密钥', regex: /AKIA[0-9A-Z]{16}/g, severity: 'high' },
  { type: 'url-with-creds', label: '含凭证URL', regex: /https?:\/\/[^\/\s]+:[^@\/\s]+@[^\s]+/g, severity: 'high' },
  { type: 'name-phone', label: '姓名+手机', regex: /(?:张|王|李|赵|刘|陈|杨|黄|周|吴|徐|孙|马|朱|胡|郭|何|高|林)[\u4e00-\u9fa5]{1,3}(?:\s|)\d{11}/g, severity: 'medium' },
  { type: 'address', label: '地址信息', regex: /[\u4e00-\u9fa5]{2,}(?:省|市|区|县|镇|乡|街道|路|街|巷|号|栋|单元|室)[\u4e00-\u9fa5\d]+(?:号|栋|单元|室)?/g, severity: 'low' },
  { type: 'dob', label: '出生日期', regex: /(?:19|20)\d{2}[-/](?:0[1-9]|1[0-2])[-/](?:0[1-9]|[12]\d|3[01])/g, severity: 'medium' },
]

const SAMPLE_TEXT = `// 配置文件示例
const config = {
  email: "zhangsan@example.com",
  phone: "13812345678",
  idCard: "110101199003071234",
  bankCard: "6222-0202-0000-0001",
  apiKey: "api_key: sk-abc123def456ghi789jkl012mno345",
  jwtToken: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
  server: {
    host: "192.168.1.100",
    password: "admin123"
  },
  awsKey: "AKIAIOSFODNN7EXAMPLE",
  github: "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmn",
  database: "postgres://admin:password123@db.example.com:5432/app"
}`

function maskValue(value: string, type: string): string {
  if (type === 'email') {
    const [local, domain] = value.split('@')
    return local[0] + '***@' + domain
  }
  if (type === 'phone') {
    return value.slice(0, 3) + '****' + value.slice(-4)
  }
  if (type === 'id-card') {
    return value.slice(0, 6) + '********' + value.slice(-4)
  }
  if (type === 'bank-card' || type === 'credit-card') {
    return value.replace(/\d(?=\d{4})/g, '*')
  }
  if (type === 'ip') {
    return value.split('.').map((p, i) => i < 2 ? '***' : p).join('.')
  }
  if (type === 'api-key' || type === 'github-token' || type === 'aws-key') {
    return value.slice(0, 8) + '***' + value.slice(-4)
  }
  if (type === 'jwt') {
    const parts = value.split('.')
    if (parts.length === 3) {
      return parts[0].slice(0, 6) + '***.' + parts[1].slice(0, 6) + '***.' + parts[2].slice(0, 6) + '***'
    }
    return value.slice(0, 12) + '***'
  }
  if (type === 'password') {
    return '********'
  }
  if (type === 'private-key') {
    return '-----BEGIN PRIVATE KEY-----\n[REDACTED]\n-----END PRIVATE KEY-----'
  }
  if (type === 'ssn') {
    return '***-**-' + value.slice(-4)
  }
  if (type === 'dob') {
    return value.replace(/\d{2}[-/]\d{2}$/, '**-**')
  }
  if (type === 'address') {
    return value.slice(0, 6) + '***'
  }
  return value.slice(0, 4) + '***' + value.slice(-4)
}

function hashValue(value: string): string {
  let hash = 0
  const str = value.slice(0, 16)
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return 'HASH_' + Math.abs(hash).toString(16).toUpperCase().padStart(8, '0') + '_' + value.length
}

export default function PrivacyGuard() {
  const [input, setInput] = useState(SAMPLE_TEXT)
  const [mode, setMode] = useState<DetectionMode>('mask')
  const [detections, setDetections] = useState<PIIDetection[]>([])
  const [output, setOutput] = useState('')
  const [scanning, setScanning] = useState(false)
  const [copied, setCopied] = useState(false)
  const [enabledTypes, setEnabledTypes] = useState<Set<string>>(new Set(PII_PATTERNS.map(p => p.type)))

  const toggleType = useCallback((type: string) => {
    setEnabledTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }, [])

  const scan = useCallback(async () => {
    setScanning(true)
    setOutput('')
    setDetections([])

    await new Promise(r => setTimeout(r, 400))

    const found: PIIDetection[] = []
    const activePatterns = PII_PATTERNS.filter(p => enabledTypes.has(p.type))
    let workingText = input

    for (const pattern of activePatterns) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags.includes('g') ? pattern.regex.flags : pattern.regex.flags + 'g')
      let match
      while ((match = regex.exec(workingText)) !== null) {
        found.push({
          type: pattern.type,
          label: pattern.label,
          value: match[0],
          position: match.index,
          severity: pattern.severity,
          masked: maskValue(match[0], pattern.type),
        })
        if (found.length > 500) break
      }
    }

    found.sort((a, b) => a.position - b.position)
    setDetections(found)

    let result = input
    if (mode === 'mask') {
      for (const d of found.reverse()) {
        result = result.slice(0, d.position) + d.masked + result.slice(d.position + d.value.length)
      }
    } else if (mode === 'hash') {
      for (const d of found.reverse()) {
        result = result.slice(0, d.position) + hashValue(d.value) + result.slice(d.position + d.value.length)
      }
    } else if (mode === 'remove') {
      for (const d of found.reverse()) {
        result = result.slice(0, d.position) + '[REDACTED]' + result.slice(d.position + d.value.length)
      }
    }

    setOutput(result)
    setScanning(false)
  }, [input, mode, enabledTypes])

  const copyOutput = useCallback(async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [output])

  const downloadOutput = useCallback(() => {
    if (!output) return
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `privacy-guard-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [output])

  const clearAll = useCallback(() => {
    setInput('')
    setOutput('')
    setDetections([])
  }, [])

  const loadSample = useCallback(() => {
    setInput(SAMPLE_TEXT)
    setOutput('')
    setDetections([])
  }, [])

  const severityColor = (s: string) => {
    if (s === 'high') return '#ef4444'
    if (s === 'medium') return '#f59e0b'
    return '#3b82f6'
  }

  const severityBg = (s: string) => {
    if (s === 'high') return 'rgba(239,68,68,0.12)'
    if (s === 'medium') return 'rgba(245,158,11,0.12)'
    return 'rgba(59,130,246,0.12)'
  }

  const stats = useMemo(() => {
    const bySeverity = { high: 0, medium: 0, low: 0 }
    const byType: Record<string, number> = {}
    for (const d of detections) {
      bySeverity[d.severity]++
      byType[d.type] = (byType[d.type] || 0) + 1
    }
    return {
      total: detections.length,
      high: bySeverity.high,
      medium: bySeverity.medium,
      low: bySeverity.low,
      types: Object.keys(byType).length,
    }
  }, [detections])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={18} color="#22d3ee" />
          <span style={{ fontSize: 15, fontWeight: 600 }}>隐私守护者</span>
          <span style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 10,
            background: 'rgba(34,211,238,0.15)',
            color: '#22d3ee',
          }}>PII 检测与脱敏</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {stats.total > 0 && (
            <div style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              fontSize: 11,
            }}>
              {stats.high > 0 && (
                <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                  高危 {stats.high}
                </span>
              )}
              {stats.medium > 0 && (
                <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.2)', color: '#fcd34d' }}>
                  中危 {stats.medium}
                </span>
              )}
              {stats.low > 0 && (
                <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(59,130,246,0.2)', color: '#93c5fd' }}>
                  低危 {stats.low}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: 12,
        padding: '10px 20px',
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>处理模式</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {([
              { v: 'detect-only', label: '仅检测', icon: Search },
              { v: 'mask', label: '部分掩码', icon: EyeOff },
              { v: 'hash', label: '哈希替换', icon: Lock },
              { v: 'remove', label: '完全移除', icon: Unlock },
            ] as const).map(({ v, label, icon: Icon }) => (
              <button
                key={v}
                onClick={() => setMode(v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 10px',
                  fontSize: 11,
                  borderRadius: 6,
                  border: mode === v ? '1px solid #22d3ee' : '1px solid rgba(255,255,255,0.1)',
                  background: mode === v ? 'rgba(34,211,238,0.15)' : 'transparent',
                  color: mode === v ? '#22d3ee' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={loadSample}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'transparent',
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          <FileText size={13} /> 加载示例
        </button>

        <button
          onClick={clearAll}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid rgba(239,68,68,0.3)',
            background: 'transparent',
            color: '#ef4444',
            cursor: 'pointer',
          }}
        >
          <Trash2 size={13} /> 清空
        </button>

        <button
          onClick={scan}
          disabled={scanning || !input.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 16px',
            fontSize: 12,
            borderRadius: 6,
            border: 'none',
            background: scanning ? 'rgba(34,211,238,0.4)' : 'linear-gradient(135deg, #0891b2, #22d3ee)',
            color: 'white',
            cursor: scanning ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            boxShadow: scanning ? 'none' : '0 0 20px rgba(34,211,238,0.3)',
          }}
        >
          <ShieldCheck size={13} /> {scanning ? '扫描中...' : '开始检测'}
        </button>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
      }}>
        <div style={{
          width: '45%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{
            padding: '8px 20px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={14} color="#94a3b8" />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>输入文本</span>
              <span style={{ fontSize: 10, color: '#64748b' }}>{input.length} 字符</span>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1,
              padding: '16px 20px',
              background: 'rgba(0,0,0,0.2)',
              color: '#e2e8f0',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: 12,
              lineHeight: 1.6,
              fontFamily: "'JetBrains Mono', monospace",
            }}
            placeholder="粘贴需要检测的文本内容..."
          />
        </div>

        <div style={{
          width: '55%',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '8px 20px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {mode === 'detect-only' ? (
                <>
                  <AlertTriangle size={14} color="#f59e0b" />
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>检测结果</span>
                </>
              ) : (
                <>
                  <Lock size={14} color="#22d3ee" />
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{mode === 'mask' ? '脱敏结果' : mode === 'hash' ? '哈希结果' : '移除结果'}</span>
                </>
              )}
              {detections.length > 0 && (
                <span style={{ fontSize: 10, color: '#64748b' }}>
                  发现 {detections.length} 项敏感信息
                </span>
              )}
            </div>
            {output && mode !== 'detect-only' && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={copyOutput}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    fontSize: 11,
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  {copied ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                  {copied ? '已复制' : '复制'}
                </button>
                <button
                  onClick={downloadOutput}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    fontSize: 11,
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  <Download size={12} /> 下载
                </button>
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            {detections.length > 0 ? (
              <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {mode !== 'detect-only' && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>处理后文本</div>
                    <pre style={{
                      background: 'rgba(34,211,238,0.08)',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 12,
                      color: '#e2e8f0',
                      overflow: 'auto',
                      maxHeight: 200,
                      whiteSpace: 'pre-wrap',
                      border: '1px solid rgba(34,211,238,0.2)',
                    }}>{output}</pre>
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>检测详情 ({detections.length} 项)</div>
                {detections.slice(0, 100).map((d, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 8,
                      border: `1px solid ${severityColor(d.severity)}40`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: severityBg(d.severity),
                        color: severityColor(d.severity),
                        fontWeight: 600,
                      }}>
                        {d.severity === 'high' ? '高危' : d.severity === 'medium' ? '中危' : '低危'}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{d.label}</span>
                      <span style={{ fontSize: 10, color: '#64748b', marginLeft: 'auto' }}>位置: {d.position}</span>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                    }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#ef4444', marginBottom: 2 }}>原始</div>
                        <code style={{
                          background: 'rgba(239,68,68,0.1)',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          color: '#fca5a5',
                          wordBreak: 'break-all',
                        }}>{d.value}</code>
                      </div>
                      {mode !== 'detect-only' && (
                        <div>
                          <div style={{ fontSize: 10, color: '#22c55e', marginBottom: 2 }}>{mode === 'mask' ? '脱敏后' : mode === 'hash' ? '哈希后' : '移除后'}</div>
                          <code style={{
                            background: 'rgba(34,197,94,0.1)',
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            color: '#86efac',
                            wordBreak: 'break-all',
                          }}>{mode === 'remove' ? '[REDACTED]' : d.masked}</code>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {detections.length > 100 && (
                  <div style={{
                    padding: '8px',
                    textAlign: 'center',
                    fontSize: 11,
                    color: '#64748b',
                  }}>
                    仅显示前 100 项，共 {detections.length} 项
                  </div>
                )}
              </div>
            ) : output && mode !== 'detect-only' ? (
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>处理结果</div>
                <pre style={{
                  background: 'rgba(34,211,238,0.08)',
                  borderRadius: 10,
                  padding: 16,
                  fontSize: 12,
                  color: '#e2e8f0',
                  overflow: 'auto',
                  maxHeight: '100%',
                  whiteSpace: 'pre-wrap',
                  border: '1px solid rgba(34,211,238,0.2)',
                }}>{output}</pre>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#475569',
                gap: 12,
                padding: 20,
              }}>
                <Shield size={32} />
                <span style={{ fontSize: 13 }}>点击「开始检测」分析文本中的敏感信息</span>
                <span style={{ fontSize: 11, textAlign: 'center' }}>支持 17 类 PII 检测：邮箱、手机号、身份证、银行卡、API密钥、JWT、私钥等</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{
        maxHeight: 90,
        padding: '10px 20px',
        background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: '#64748b', marginRight: 4 }}>检测类型:</span>
        {PII_PATTERNS.map(p => (
          <button
            key={p.type}
            onClick={() => toggleType(p.type)}
            style={{
              padding: '3px 8px',
              fontSize: 10,
              borderRadius: 4,
              border: enabledTypes.has(p.type) ? `1px solid ${severityColor(p.severity)}` : '1px solid rgba(255,255,255,0.1)',
              background: enabledTypes.has(p.type) ? severityBg(p.severity) : 'transparent',
              color: enabledTypes.has(p.type) ? severityColor(p.severity) : '#475569',
              cursor: 'pointer',
            }}
          >
            {enabledTypes.has(p.type) ? <Check size={8} style={{ display: 'inline', marginRight: 3 }} /> : ''}{p.label}
          </button>
        ))}
      </div>

      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
      `}</style>
    </div>
  )
}
