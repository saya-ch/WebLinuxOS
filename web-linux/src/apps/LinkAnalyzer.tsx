import { useState, useMemo, useCallback } from 'react'
import {
  Link2,
  Globe,
  Copy,
  Check,
  Trash2,
  Bath,
  Lock,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Hash,
  Server,
  Route,
  Search,
  FileJson,
} from 'lucide-react'

interface URLAnalysis {
  original: string
  valid: boolean
  protocol?: string
  hostname?: string
  subdomain?: string
  domain?: string
  tld?: string
  port?: string
  pathname?: string
  hash?: string
  search?: string
  params?: Record<string, string>
  encodedParams?: Record<string, string>
  decodedParams?: Record<string, string>
  isSecure?: boolean
  isLocalhost?: boolean
  isIPAddress?: boolean
  hasCredentials?: boolean
  urlEncoded?: string
  urlDecoded?: string
  securityFlags: string[]
  warnings: string[]
}

const SUSPICIOUS_TLDS = ['tk', 'ml', 'ga', 'cf', 'gq', 'xyz', 'top', 'club', 'online', 'site']

const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:', 'chrome:']

function parseSingleURL(rawUrl: string): URLAnalysis {
  const analysis: URLAnalysis = {
    original: rawUrl.trim(),
    valid: false,
    securityFlags: [],
    warnings: [],
  }

  if (!rawUrl.trim()) {
    analysis.warnings.push('空URL')
    return analysis
  }

  let urlStr = rawUrl.trim()
  if (!/^https?:\/\//i.test(urlStr) && !/^javascript:/i.test(urlStr) && !/^data:/i.test(urlStr)) {
    urlStr = 'https://' + urlStr
  }

  try {
    const url = new URL(urlStr)
    analysis.valid = true
    analysis.protocol = url.protocol.replace(':', '')
    analysis.hostname = url.hostname
    analysis.port = url.port || undefined
    analysis.pathname = url.pathname
    analysis.hash = url.hash || undefined
    analysis.search = url.search || undefined

    const params: Record<string, string> = {}
    const encParams: Record<string, string> = {}
    const decParams: Record<string, string> = {}
    url.searchParams.forEach((value, key) => {
      params[key] = value
      encParams[key] = encodeURIComponent(value)
      try {
        decParams[key] = decodeURIComponent(value)
      } catch {
        decParams[key] = value
      }
    })
    analysis.params = params
    analysis.encodedParams = encParams
    analysis.decodedParams = decParams

    analysis.isSecure = url.protocol === 'https:'
    analysis.isLocalhost =
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.hostname.endsWith('.local')
    analysis.isIPAddress = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(url.hostname)

    const hostParts = url.hostname.split('.')
    if (hostParts.length >= 2) {
      analysis.domain = hostParts.slice(-2).join('.')
      const tldCandidate = hostParts[hostParts.length - 1]
      analysis.tld = tldCandidate
      if (hostParts.length > 2) {
        analysis.subdomain = hostParts.slice(0, -2).join('.')
      }
    } else {
      analysis.domain = url.hostname
      analysis.tld = ''
      analysis.subdomain = ''
    }

    analysis.urlEncoded = encodeURIComponent(urlStr)
    try {
      analysis.urlDecoded = decodeURIComponent(urlStr)
    } catch {
      analysis.urlDecoded = urlStr
    }

    if (analysis.isSecure) analysis.securityFlags.push('HTTPS加密')
    else analysis.securityFlags.push('HTTP明文')

    if (DANGEROUS_PROTOCOLS.some((p) => urlStr.toLowerCase().startsWith(p))) {
      analysis.securityFlags.push('危险协议')
      analysis.warnings.push('使用了可能危险的协议')
    }

    if (analysis.isLocalhost) analysis.securityFlags.push('本地地址')
    if (analysis.isIPAddress) analysis.securityFlags.push('IP地址')

    if (analysis.tld && SUSPICIOUS_TLDS.includes(analysis.tld)) {
      analysis.warnings.push(`TLD "${analysis.tld}" 常见于可疑站点`)
    }

    const paramCount = Object.keys(params).length
    if (paramCount > 10) {
      analysis.warnings.push(`参数过多 (${paramCount}个)，可能存在注入风险`)
    }

    const decodedUrl = decodeURIComponent(urlStr)
    if (decodedUrl !== urlStr) {
      analysis.securityFlags.push('包含编码')
      const decodedParamCount = (decodedUrl.match(/%[0-9A-Fa-f]{2}/g) || []).length
      if (decodedParamCount > 5) {
        analysis.warnings.push('大量URL编码，可能用于隐藏恶意载荷')
      }
    }

    for (const [key, value] of Object.entries(params)) {
      if (/<script|javascript:|on\w+=/i.test(value)) {
        analysis.warnings.push(`参数 "${key}" 可能包含XSS载荷`)
      }
      if (key.toLowerCase().includes('redirect') || key.toLowerCase().includes('url')) {
        analysis.warnings.push(`参数 "${key}" 可能被用于开放重定向`)
      }
    }

    if (url.username || url.password) {
      analysis.hasCredentials = true
      analysis.warnings.push('URL中包含用户名/密码，存在泄露风险')
    }
  } catch {
    analysis.valid = false
    analysis.warnings.push('URL格式无效')
  }

  return analysis
}

const EXAMPLE_URLS = [
  'https://www.example.com:8080/path/to/page?query=hello&lang=zh-CN#section-1',
  'https://api.github.com/users?since=100&per_page=30',
  'http://localhost:3000/api?debug=true&token=abc123',
  'https://sub.domain.example.co.uk/search?q=hello%20world&filter=active',
  'https://evil.com/phishing?redirect=https://good.com',
]

export default function LinkAnalyzer() {
  const [input, setInput] = useState('')
  const [analyses, setAnalyses] = useState<URLAnalysis[]>([])
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single')
  const [batchInput, setBatchInput] = useState('')
  const [batchResults, setBatchResults] = useState<URLAnalysis[]>([])
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [, setHistory] = useState<URLAnalysis[]>([])

  const analyze = useCallback(() => {
    if (!input.trim()) return
    const result = parseSingleURL(input)
    setAnalyses((prev) => [result, ...prev].slice(0, 50))
    setHistory((prev) => [result, ...prev].slice(0, 20))
  }, [input])

  const analyzeBatch = useCallback(() => {
    const urls = batchInput.split('\n').map((u) => u.trim()).filter(Boolean)
    if (!urls.length) return
    const results = urls.map(parseSingleURL)
    setBatchResults(results)
  }, [batchInput])

  const copyToClipboard = useCallback(async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 1500)
    } catch {}
  }, [])

  const loadExample = useCallback((url: string) => {
    setInput(url)
  }, [])

  const clearAll = useCallback(() => {
    setInput('')
    setAnalyses([])
    setBatchInput('')
    setBatchResults([])
    setHistory([])
  }, [])

  const batchStats = useMemo(() => {
    if (!batchResults.length) return null
    const valid = batchResults.filter((r) => r.valid).length
    const invalid = batchResults.filter((r) => !r.valid).length
    const withWarnings = batchResults.filter((r) => r.warnings.length > 0).length
    const secure = batchResults.filter((r) => r.isSecure).length
    return { total: batchResults.length, valid, invalid, withWarnings, secure }
  }, [batchResults])

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900 text-gray-100 overflow-hidden">
      <div className="shrink-0 px-6 py-4 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                URL链接深度分析器
              </h1>
              <p className="text-xs text-gray-400">URL结构解析 · 安全检测 · 批量分析</p>
            </div>
          </div>
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          {(['single', 'batch'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              {tab === 'single' ? '单URL分析' : '批量分析'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === 'single' && (
          <>
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 backdrop-blur-xl">
              <label className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                输入URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && analyze()}
                  placeholder="https://example.com/path?query=value"
                  className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono"
                />
                <button
                  onClick={analyze}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20"
                >
                  分析
                </button>
              </div>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-xs text-gray-500">示例:</span>
                {EXAMPLE_URLS.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => loadExample(url)}
                    className="text-xs px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors font-mono truncate max-w-[200px]"
                    title={url}
                  >
                    {url.replace(/^https?:\/\//, '').slice(0, 30)}...
                  </button>
                ))}
              </div>
            </div>

            {analyses.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <Info className="w-4 h-4 text-cyan-400" />
                    分析结果
                  </h2>
                  <span className="text-xs text-gray-500">共 {analyses.length} 条</span>
                </div>

                {analyses.map((a, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden transition-all hover:border-white/20"
                  >
                    <div
                      className="p-4 cursor-pointer flex items-center justify-between"
                      onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            a.valid
                              ? a.isSecure
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {a.valid ? (
                            a.isSecure ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Globe className="w-4 h-4" />
                            )
                          ) : (
                            <AlertTriangle className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-mono text-gray-200 truncate">{a.original}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {a.securityFlags.map((f, fi) => (
                              <span
                                key={fi}
                                className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  f === 'HTTPS加密'
                                    ? 'bg-emerald-500/15 text-emerald-300'
                                    : f === '危险协议'
                                    ? 'bg-red-500/15 text-red-300'
                                    : 'bg-cyan-500/15 text-cyan-300'
                                }`}
                              >
                                {f}
                              </span>
                            ))}
                            {a.warnings.length > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">
                                {a.warnings.length} 警告
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(a.original, idx * 100)
                          }}
                          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
                        >
                          {copiedIdx === idx * 100 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <a
                          href={a.original.startsWith('http') ? a.original : `https://${a.original}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        {expandedIdx === idx ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    </div>

                    {expandedIdx === idx && a.valid && (
                      <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <InfoRow icon={<Hash className="w-3.5 h-3.5" />} label="协议" value={a.protocol || '-'} />
                          <InfoRow icon={<Server className="w-3.5 h-3.5" />} label="端口" value={a.port || '默认'} />
                          <InfoRow icon={<Globe className="w-3.5 h-3.5" />} label="主机名" value={a.hostname || '-'} />
                          <InfoRow icon={<Route className="w-3.5 h-3.5" />} label="路径" value={a.pathname || '/'} />
                          <InfoRow icon={<Hash className="w-3.5 h-3.5" />} label="子域名" value={a.subdomain || '-'} />
                          <InfoRow icon={<Globe className="w-3.5 h-3.5" />} label="主域名" value={a.domain || '-'} />
                          <InfoRow icon={<Search className="w-3.5 h-3.5" />} label="TLD" value={a.tld || '-'} />
                          <InfoRow icon={<Hash className="w-3.5 h-3.5" />} label="锚点" value={a.hash || '-'} />
                        </div>

                        {a.params && Object.keys(a.params).length > 0 && (
                          <div className="rounded-xl bg-black/20 border border-white/5 p-3">
                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                              <FileJson className="w-3.5 h-3.5" />
                              查询参数 ({Object.keys(a.params).length})
                            </div>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {Object.entries(a.params).map(([k, v]) => (
                                <div key={k} className="flex items-start gap-2 text-xs font-mono">
                                  <span className="text-cyan-400 shrink-0">{k}</span>
                                  <span className="text-gray-500">=</span>
                                  <span className="text-gray-300 break-all">{v}</span>
                                  {a.decodedParams && a.decodedParams[k] !== v && (
                                    <span className="text-gray-500 line-through text-[10px] ml-1">
                                      → {a.decodedParams[k]}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg bg-black/20 p-2.5 border border-white/5">
                            <div className="text-[10px] text-gray-500 mb-1">URL编码</div>
                            <div className="text-xs font-mono text-cyan-300 break-all">{a.urlEncoded}</div>
                          </div>
                          <div className="rounded-lg bg-black/20 p-2.5 border border-white/5">
                            <div className="text-[10px] text-gray-500 mb-1">URL解码</div>
                            <div className="text-xs font-mono text-emerald-300 break-all">{a.urlDecoded}</div>
                          </div>
                        </div>

                        {a.warnings.length > 0 && (
                          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                            <div className="flex items-center gap-2 text-xs text-amber-400 mb-2">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              安全警告
                            </div>
                            <ul className="space-y-1">
                              {a.warnings.map((w, wi) => (
                                <li key={wi} className="text-xs text-amber-300 flex items-start gap-2">
                                  <span className="text-amber-500">•</span>
                                  {w}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {analyses.length === 0 && (
              <div className="rounded-2xl bg-white/[0.02] border border-white/10 border-dashed p-12 text-center">
                <Link2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-sm">输入URL开始深度分析</p>
                <p className="text-gray-600 text-xs mt-1">支持协议检测、子域名分析、安全检查等</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'batch' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 backdrop-blur-xl">
              <label className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                <Bath className="w-3.5 h-3.5" />
                批量URL输入（每行一个）
              </label>
              <textarea
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                rows={8}
                placeholder={'https://example.com\nhttps://api.github.com/users\nhttps://localhost:3000'}
                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-all font-mono resize-none"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500">
                  {batchInput.split('\n').filter((l) => l.trim()).length} 个URL
                </span>
                <button
                  onClick={analyzeBatch}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20"
                >
                  批量分析
                </button>
              </div>
            </div>

            {batchStats && (
              <div className="grid grid-cols-5 gap-3">
                <StatCard label="总数" value={batchStats.total} color="cyan" />
                <StatCard label="有效" value={batchStats.valid} color="emerald" />
                <StatCard label="无效" value={batchStats.invalid} color="red" />
                <StatCard label="HTTPS" value={batchStats.secure} color="blue" />
                <StatCard label="警告" value={batchStats.withWarnings} color="amber" />
              </div>
            )}

            {batchResults.length > 0 && (
              <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden backdrop-blur-xl">
                <div className="px-4 py-3 border-b border-white/5 text-xs text-gray-400 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5" />
                  批量分析结果
                </div>
                <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                  {batchResults.map((a, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                          a.valid
                            ? a.isSecure
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {a.valid ? (
                          <Lock className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                      </div>
                      <span className="text-sm font-mono text-gray-300 truncate flex-1">
                        {a.original}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {a.valid ? (
                          <>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                              {a.domain}
                            </span>
                            {a.warnings.length > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">
                                {a.warnings.length} ⚠
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-300">
                            无效
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/20 p-2.5 border border-white/5">
      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-xs font-mono text-gray-200 truncate">{value}</div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10',
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
    red: 'text-red-400 border-red-500/20 bg-red-500/10',
    blue: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
    amber: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
  }
  return (
    <div className={`rounded-xl border p-3 ${colorMap[color]}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] opacity-80">{label}</div>
    </div>
  )
}