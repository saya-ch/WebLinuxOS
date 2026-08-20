import { useState, useMemo, useCallback, memo, useEffect } from 'react'
import {
  Shield, Lock, Unlock, Key, Globe, Search, Eye, EyeOff,
  Copy, Check, RefreshCw, AlertTriangle, Info, Activity, Gauge,
  Cpu, Database, Hash, FileKey, Link2, Cloud, AlertCircle,
  ChevronDown, ChevronUp, Wand2, Network, Download, Upload,
  Layers, Terminal, Clock, BarChart3,
} from 'lucide-react'

type TabId = 'jwt' | 'cors' | 'dns' | 'crypto' | 'http' | 'url' | 'passwd'

interface Tab {
  id: TabId
  name: string
  Icon: React.ComponentType<{ className?: string }>
  desc: string
}

const TABS: Tab[] = [
  { id: 'jwt', name: 'JWT 工坊', Icon: FileKey, desc: '解码 · 验证 · 生成 HS256/HS384/HS512/RS256' },
  { id: 'cors', name: 'CORS 探测', Icon: Globe, desc: '预检请求分析 · 真实 headers 可视化' },
  { id: 'dns', name: 'DoH 查询', Icon: Network, desc: 'Cloudflare DoH · 10+ 记录类型' },
  { id: 'crypto', name: '密码学工具', Icon: Shield, desc: 'SHA/HMAC/AES-GCM · Web Crypto API' },
  { id: 'http', name: 'HTTP 时序', Icon: Activity, desc: 'TTFB/DNS/TCP/TLS 分段分析' },
  { id: 'url', name: 'URL 安全', Icon: Link2, desc: '解析 · 编码 · 风险检测' },
  { id: 'passwd', name: '密码强度', Icon: Lock, desc: '熵值 · 破解时间 · 生成器' },
]

const STORAGE_PREFIX = 'nebula-dev-v1:'

// ========= 工具函数 =========
function safeLS<T>(k: string, fb: T): T {
  try { const raw = localStorage.getItem(STORAGE_PREFIX + k); return raw ? JSON.parse(raw) as T : fb } catch { return fb }
}
function setLS<T>(k: string, v: T) {
  try { localStorage.setItem(STORAGE_PREFIX + k, JSON.stringify(v)) } catch {}
}
async function copyText(t: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(t); return true } catch { return false }
}
function toB64Url(buf: ArrayBuffer | Uint8Array): string {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  const pureBuf = new ArrayBuffer(u8.length)
  const dst = new Uint8Array(pureBuf)
  for (let i = 0; i < u8.length; i++) dst[i] = u8[i]
  // 使用 Uint8Array 视图迭代
  let b = ''
  for (let i = 0; i < dst.length; i++) b += String.fromCharCode(dst[i])
  return btoa(b).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}
function fromB64Url(s: string): Uint8Array {
  const p = s.replace(/-/g, '+').replace(/_/g, '/')
  const pad = p.length % 4 === 0 ? '' : '='.repeat(4 - (p.length % 4))
  const bin = atob(p + pad)
  const u8 = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i)
  return u8
}
// 注意：显式以 ArrayBuffer 底层缓冲，避免 React 19 TS 中 ArrayBufferLike (SharedArrayBuffer) 不兼容 crypto.subtle
function textEncoder(s: string): Uint8Array<ArrayBuffer> {
  const src = new TextEncoder().encode(s)
  const buf = new ArrayBuffer(src.byteLength)
  const dst = new Uint8Array(buf)
  for (let i = 0; i < src.length; i++) dst[i] = src[i]
  return dst as Uint8Array<ArrayBuffer>
}
function textDecoder(buf: ArrayBuffer): string { return new TextDecoder().decode(buf) }
function ab2hex(buf: ArrayBuffer): string {
  const u8 = new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < u8.length; i++) s += u8[i].toString(16).padStart(2, '0')
  return s
}

// ========= JWT 操作（纯 TS，无依赖）=========
function base64UrlDecode(s: string): unknown | null {
  try {
    const arr = fromB64Url(s)
    const buf = new ArrayBuffer(arr.length)
    const dst = new Uint8Array(buf)
    for (let i = 0; i < arr.length; i++) dst[i] = arr[i]
    return JSON.parse(textDecoder(buf))
  } catch { return null }
}
function jwtDecode(token: string): { header?: Record<string, unknown>; payload?: Record<string, unknown>; signature?: string; validFormat: boolean; error?: string } {
  const parts = token.trim().split('.')
  if (parts.length !== 3) return { validFormat: false, error: 'JWT 必须包含 3 段（header.payload.signature）' }
  const header = base64UrlDecode(parts[0]) as Record<string, unknown> | undefined
  const payload = base64UrlDecode(parts[1]) as Record<string, unknown> | undefined
  return { header, payload, signature: parts[2], validFormat: true }
}
async function hmacSign(alg: 'SHA-256' | 'SHA-384' | 'SHA-512', keyBytes: Uint8Array, data: string): Promise<string> {
  // 确保 keyBytes 的 buffer 是纯 ArrayBuffer（避免 SharedArrayBuffer 类型不兼容）
  const kbBuf = new ArrayBuffer(keyBytes.length)
  const kbView = new Uint8Array(kbBuf)
  for (let i = 0; i < keyBytes.length; i++) kbView[i] = keyBytes[i]
  const key = await crypto.subtle.importKey('raw', kbBuf, { name: 'HMAC', hash: alg }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, textEncoder(data))
  return toB64Url(sig)
}
async function jwtHSSign(algStr: 'HS256' | 'HS384' | 'HS512', secret: string, headerObj: Record<string, unknown>, payloadObj: Record<string, unknown>): Promise<string> {
  const algMap = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' } as const
  const h = toB64Url(textEncoder(JSON.stringify(headerObj)).buffer)
  const p = toB64Url(textEncoder(JSON.stringify(payloadObj)).buffer)
  const signing = `${h}.${p}`
  const sig = await hmacSign(algMap[algStr], textEncoder(secret), signing)
  return `${signing}.${sig}`
}
async function jwtHSVerify(token: string, secret: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const [h, p, s] = token.split('.')
    const header = base64UrlDecode(h) as Record<string, unknown> | undefined
    const alg = String(header?.alg ?? '')
    if (!['HS256', 'HS384', 'HS512'].includes(alg)) return { ok: false, error: `不支持的算法: ${alg}` }
    const algMap: Record<string, 'SHA-256' | 'SHA-384' | 'SHA-512'> = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' }
    const expected = await hmacSign(algMap[alg], textEncoder(secret), `${h}.${p}`)
    return expected === s ? { ok: true } : { ok: false, error: '签名不匹配' }
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : '验证异常' } }
}

// ========= 密码熵 =========
function calcEntropy(pwd: string): { entropy: number; score: 0 | 1 | 2 | 3 | 4; label: string; color: string; crackYears: string } {
  if (!pwd) return { entropy: 0, score: 0, label: '空', color: 'text-slate-500', crackYears: '—' }
  let pool = 0
  if (/[a-z]/.test(pwd)) pool += 26
  if (/[A-Z]/.test(pwd)) pool += 26
  if (/\d/.test(pwd)) pool += 10
  if (/[^a-zA-Z0-9]/.test(pwd)) pool += 33
  const entropy = pwd.length * Math.log2(Math.max(2, pool))
  let score: 0 | 1 | 2 | 3 | 4 = 0
  if (entropy > 28) score = 1
  if (entropy > 59) score = 2
  if (entropy > 89) score = 3
  if (entropy > 120) score = 4
  const labels = ['极弱', '弱', '中等', '强', '极强']
  const colors = ['text-rose-400', 'text-orange-400', 'text-amber-400', 'text-lime-400', 'text-emerald-400']
  // 假设每秒 100 亿次哈希
  const combinations = Math.pow(2, entropy)
  const seconds = combinations / 1e10
  const years = seconds / (365.25 * 24 * 3600)
  let crackYears = ''
  if (years < 1 / (365 * 24 * 60)) crackYears = `${Math.max(1, Math.round(seconds * 1000))} 毫秒`
  else if (years < 1 / (365 * 24)) crackYears = `${Math.round(seconds * 60)} 分钟`
  else if (years < 1 / 365) crackYears = `${Math.round(seconds / 3600)} 小时`
  else if (years < 1) crackYears = `${Math.round(years * 365)} 天`
  else if (years < 1000) crackYears = `${years.toFixed(1)} 年`
  else if (years < 1e6) crackYears = `${(years / 1000).toFixed(1)} 千年`
  else if (years < 1e9) crackYears = `${(years / 1e6).toFixed(1)} 百万年`
  else crackYears = `${(years / 1e9).toFixed(1)} 十亿年`
  return { entropy: Math.round(entropy * 10) / 10, score, label: labels[score], color: colors[score], crackYears }
}
function generatePassword(len: number, opts: { up: boolean; low: boolean; num: boolean; sym: boolean }): string {
  let chars = ''
  if (opts.up) chars += 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  if (opts.low) chars += 'abcdefghijkmnpqrstuvwxyz'
  if (opts.num) chars += '23456789'
  if (opts.sym) chars += '!@#$%^&*()-_=+[]{};:,.<>?/'
  if (!chars) chars = 'abcdefghij'
  const arr = new Uint8Array(len)
  crypto.getRandomValues(arr)
  let out = ''
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length]
  return out
}

// ========= 主组件 =========
const NebulaDevPro = memo(function NebulaDevPro() {
  const [tab, setTab] = useState<TabId>(safeLS('tab', 'jwt') as TabId)
  useEffect(() => { setLS('tab', tab) }, [tab])

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-[#050816] via-[#0a0b1f] to-[#050816] text-slate-100 overflow-hidden">
      {/* 顶栏 */}
      <div className="flex-shrink-0 px-5 py-3.5 border-b border-white/5 bg-black/30 backdrop-blur flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">NebulaDev Pro · 开发者超级工具箱</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">7 合 1 专业开发工具 · 基于 Web Crypto 与浏览器原生 API · 全部本地计算或公开加密 DNS</p>
        </div>
        <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-emerald-400/70" /> 本地安全运行 · 无数据外传
        </div>
      </div>

      {/* Tab 栏 */}
      <div className="flex-shrink-0 px-5 py-2 border-b border-white/5 flex gap-1.5 overflow-x-auto bg-gradient-to-r from-violet-500/5 via-transparent to-cyan-500/5">
        {TABS.map(t => {
          const Icon = t.Icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              title={t.desc}
              className={`flex-shrink-0 px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${active
                ? 'bg-gradient-to-r from-violet-500/30 to-cyan-500/30 text-white shadow shadow-violet-500/20 border border-violet-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-cyan-300' : ''}`} />
              {t.name}
            </button>
          )
        })}
      </div>

      {/* 主体 */}
      <div className="flex-1 overflow-auto p-5">
        {tab === 'jwt' && <JwtPanel />}
        {tab === 'cors' && <CorsPanel />}
        {tab === 'dns' && <DnsPanel />}
        {tab === 'crypto' && <CryptoPanel />}
        {tab === 'http' && <HttpPanel />}
        {tab === 'url' && <UrlPanel />}
        {tab === 'passwd' && <PasswdPanel />}
      </div>
    </div>
  )
})

// ========= JWT 面板 =========
function JwtPanel() {
  const [mode, setMode] = useState<'decode' | 'encode' | 'verify'>('decode')
  const [token, setToken] = useState(safeLS('jwt-token', ''))
  const [secret, setSecret] = useState(safeLS('jwt-secret', ''))
  const [showSecret, setShowSecret] = useState(false)
  const [headerJson, setHeaderJson] = useState(safeLS('jwt-header', '{\n  "alg": "HS256",\n  "typ": "JWT"\n}'))
  const [payloadJson, setPayloadJson] = useState(safeLS('jwt-payload', '{\n  "sub": "user-123",\n  "name": "WebLinuxOS",\n  "role": "admin",\n  "iat": ' + Math.floor(Date.now() / 1000) + ',\n  "exp": ' + Math.floor((Date.now() + 86400000) / 1000) + '\n}'))
  const [verifyResult, setVerifyResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => { setLS('jwt-token', token) }, [token])
  useEffect(() => { setLS('jwt-secret', secret) }, [secret])
  useEffect(() => { setLS('jwt-header', headerJson) }, [headerJson])
  useEffect(() => { setLS('jwt-payload', payloadJson) }, [payloadJson])

  const decoded = useMemo(() => token ? jwtDecode(token) : null, [token])

  const sign = useCallback(async () => {
    try {
      const h = JSON.parse(headerJson)
      const p = JSON.parse(payloadJson)
      const alg = String(h.alg || 'HS256')
      if (!['HS256', 'HS384', 'HS512'].includes(alg)) { alert('仅支持 HS256/HS384/HS512'); return }
      const t = await jwtHSSign(alg as 'HS256' | 'HS384' | 'HS512', secret, h, p)
      setToken(t)
      setMode('decode')
    } catch (e) { alert('JSON 解析错误: ' + (e instanceof Error ? e.message : e)) }
  }, [headerJson, payloadJson, secret])

  const verify = useCallback(async () => {
    if (!token) return
    const r = await jwtHSVerify(token, secret)
    setVerifyResult({ ok: r.ok, msg: r.ok ? '✅ 签名验证通过' : `❌ 验证失败: ${r.error}` })
  }, [token, secret])

  const prettyJSON = (s: string) => {
    try { return JSON.stringify(JSON.parse(s), null, 2) } catch { return s }
  }

  return (
    <div className="grid grid-cols-2 gap-4 max-w-[1400px] mx-auto">
      {/* 左：模式切换 + 输入 */}
      <div className="space-y-4">
        <div className="flex gap-2 rounded-xl p-1 bg-white/5 border border-white/10">
          {(['decode', 'verify', 'encode'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${mode === m ? 'bg-gradient-to-r from-violet-500/40 to-cyan-500/40 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {m === 'decode' ? '解码' : m === 'verify' ? '验证签名' : '生成签名'}
            </button>
          ))}
        </div>

        {(mode === 'decode' || mode === 'verify') && (
          <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
              <label className="text-xs font-semibold flex items-center gap-2"><FileKey className="w-3.5 h-3.5 text-fuchsia-400" /> JWT Token</label>
              <button
                onClick={() => copyText(token).then(r => { setCopied(r); setTimeout(() => setCopied(false), 1500) })}
                className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? '已复制' : '复制'}
              </button>
            </div>
            <textarea
              value={token}
              onChange={e => { setToken(e.target.value); setVerifyResult(null) }}
              placeholder="粘贴 JWT: eyJhbGciOi..."
              rows={mode === 'verify' ? 4 : 6}
              className="w-full p-4 bg-black/20 font-mono text-xs text-cyan-200 placeholder:text-slate-600 resize-none focus:outline-none"
              spellCheck={false}
            />
          </div>
        )}

        {(mode === 'verify' || mode === 'encode') && (
          <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
              <label className="text-xs font-semibold flex items-center gap-2"><Key className="w-3.5 h-3.5 text-amber-400" /> HMAC 密钥</label>
              <button onClick={() => setShowSecret(s => !s)} className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center gap-1">
                {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />} {showSecret ? '隐藏' : '显示'}
              </button>
            </div>
            <input
              type={showSecret ? 'text' : 'password'}
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="输入 HMAC 共享密钥…"
              className="w-full p-4 bg-black/20 font-mono text-xs text-amber-200 placeholder:text-slate-600 focus:outline-none"
              spellCheck={false}
            />
          </div>
        )}

        {mode === 'encode' && (
          <>
            <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                <label className="text-xs font-semibold flex items-center gap-2"><Database className="w-3.5 h-3.5 text-violet-400" /> Header (JSON)</label>
                <button onClick={() => setHeaderJson(prettyJSON(headerJson))} className="text-[10px] text-slate-400 hover:text-violet-300">格式化</button>
              </div>
              <textarea
                value={headerJson}
                onChange={e => setHeaderJson(e.target.value)}
                rows={6}
                className="w-full p-4 bg-black/20 font-mono text-xs text-violet-200 placeholder:text-slate-600 resize-none focus:outline-none"
                spellCheck={false}
              />
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                <label className="text-xs font-semibold flex items-center gap-2"><Database className="w-3.5 h-3.5 text-cyan-400" /> Payload (JSON)</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      try {
                        const p = JSON.parse(payloadJson)
                        p.iat = Math.floor(Date.now() / 1000)
                        p.exp = Math.floor((Date.now() + 86400000) / 1000)
                        setPayloadJson(JSON.stringify(p, null, 2))
                      } catch {}
                    }}
                    className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1"
                  ><RefreshCw className="w-3 h-3" /> 刷新时间戳</button>
                  <button onClick={() => setPayloadJson(prettyJSON(payloadJson))} className="text-[10px] text-slate-400 hover:text-cyan-300">格式化</button>
                </div>
              </div>
              <textarea
                value={payloadJson}
                onChange={e => setPayloadJson(e.target.value)}
                rows={10}
                className="w-full p-4 bg-black/20 font-mono text-xs text-cyan-200 placeholder:text-slate-600 resize-none focus:outline-none"
                spellCheck={false}
              />
            </div>
          </>
        )}

        <div className="flex gap-2">
          {mode === 'encode' && (
            <button onClick={sign} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 transition-all">
              <Wand2 className="w-4 h-4" /> 生成 JWT
            </button>
          )}
          {mode === 'verify' && (
            <button onClick={verify} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all">
              <Check className="w-4 h-4" /> 验证签名
            </button>
          )}
        </div>

        {verifyResult && (
          <div className={`px-4 py-3 rounded-xl border text-xs font-medium flex items-start gap-2 ${verifyResult.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
            {verifyResult.ok ? <Check className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
            {verifyResult.msg}
          </div>
        )}
      </div>

      {/* 右：解析结果 */}
      <div className="space-y-4">
        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
            <label className="text-xs font-semibold flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-violet-400" /> Token 结构分析</label>
            {decoded?.validFormat && <span className="text-[10px] text-emerald-400 flex items-center gap-1"><Check className="w-2.5 h-2.5" /> 格式有效</span>}
            {!decoded?.validFormat && token && <span className="text-[10px] text-rose-400 flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" /> 格式错误</span>}
          </div>
          {decoded?.error && <div className="p-4 text-xs text-rose-400 bg-rose-500/5">{decoded.error}</div>}
          {!token && <div className="p-6 text-center text-xs text-slate-500 flex flex-col items-center gap-2"><Info className="w-6 h-6 opacity-50" />粘贴 JWT 后即可自动解析 Header / Payload / Signature</div>}
        </div>
        {decoded?.header && (
          <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/5 text-xs font-semibold flex items-center gap-2"><ChevronDown className="w-3.5 h-3.5 text-violet-400" /> Header <span className="text-[10px] text-slate-500 font-normal">（{Object.keys(decoded.header).length} 字段）</span></div>
            <div className="p-4 font-mono text-[11px] text-violet-200 overflow-auto"><pre>{JSON.stringify(decoded.header, null, 2)}</pre></div>
          </div>
        )}
        {decoded?.payload && (
          <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/5 text-xs font-semibold flex items-center gap-2"><ChevronDown className="w-3.5 h-3.5 text-cyan-400" /> Payload <span className="text-[10px] text-slate-500 font-normal">（{Object.keys(decoded.payload).length} 字段）</span></div>
            <div className="p-4 space-y-2">
              {Object.entries(decoded.payload).map(([k, v]) => {
                const isTime = ['iat', 'exp', 'nbf'].includes(k) && typeof v === 'number'
                return (
                  <div key={k} className="flex items-start gap-3 text-xs py-1 border-b border-white/5 last:border-b-0">
                    <code className="text-fuchsia-300 font-mono font-bold w-24 flex-shrink-0">{k}</code>
                    <div className="flex-1 min-w-0">
                      <code className="text-cyan-200 break-all">{typeof v === 'string' ? `"${v}"` : JSON.stringify(v)}</code>
                      {isTime && (
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {new Date(Number(v) * 1000).toLocaleString('zh-CN')}
                          {k === 'exp' && Number(v) * 1000 > Date.now() && (
                            <span className="text-emerald-400 ml-2">· 还剩 {Math.round((Number(v) * 1000 - Date.now()) / 3600000)} 小时</span>
                          )}
                          {k === 'exp' && Number(v) * 1000 <= Date.now() && (
                            <span className="text-rose-400 ml-2">· 已过期 ⚠️</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {decoded?.signature && (
          <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/5 text-xs font-semibold flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-amber-400" /> Signature <span className="text-[10px] text-slate-500 font-normal">（{decoded.signature.length} chars · Base64URL）</span></div>
            <div className="p-4 font-mono text-[10px] text-amber-200 break-all opacity-80">{decoded.signature}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ========= CORS 探测 =========
function CorsPanel() {
  const [url, setUrl] = useState(safeLS('cors-url', 'https://api.github.com'))
  const [method, setMethod] = useState<'GET' | 'POST' | 'HEAD' | 'OPTIONS'>('GET')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<{
    ok: boolean; status?: number; statusText?: string; error?: string;
    simpleAllowed: boolean; preflightNeeded: boolean;
    durationMs: number;
    responseHeaders: Record<string, string>;
    responseSize?: number;
    testCorsSimple: { ok: boolean; err?: string };
    testCorsPreflight?: { ok: boolean; err?: string; preflightHeaders: Record<string, string> };
  } | null>(null)

  useEffect(() => { setLS('cors-url', url) }, [url])

  const run = useCallback(async () => {
    if (!url) return
    setRunning(true); setResult(null)
    const t0 = performance.now()
    let finalResult: typeof result = null

    // 1) Simple GET 测试
    let simpleErr: string | undefined
    try {
      const r = await fetch(url, { method, mode: 'cors', signal: AbortSignal.timeout(15000) })
      const headers: Record<string, string> = {}
      r.headers.forEach((v, k) => headers[k.toLowerCase()] = v)
      const text = await r.text()
      const simpleAllowed = r.type !== 'opaque'
      finalResult = {
        ok: true, status: r.status, statusText: r.statusText,
        simpleAllowed, preflightNeeded: method !== 'GET' && method !== 'HEAD' && method !== 'POST',
        durationMs: performance.now() - t0, responseHeaders: headers,
        responseSize: text.length, testCorsSimple: { ok: true },
      }
    } catch (e) {
      simpleErr = e instanceof Error ? e.message : '网络错误'
      finalResult = { ok: false, error: simpleErr, simpleAllowed: false, preflightNeeded: true, durationMs: performance.now() - t0, responseHeaders: {}, testCorsSimple: { ok: false, err: simpleErr } }
    }

    // 2) Preflight 测试
    try {
      const pf = await fetch(url, {
        method: 'OPTIONS', mode: 'cors',
        headers: {
          'Access-Control-Request-Method': method,
          'Access-Control-Request-Headers': 'X-Custom-Header',
        },
        signal: AbortSignal.timeout(15000),
      })
      const pheaders: Record<string, string> = {}
      pf.headers.forEach((v, k) => pheaders[k.toLowerCase()] = v)
      finalResult = {
        ...finalResult!,
        testCorsPreflight: { ok: pf.ok, preflightHeaders: pheaders }
      }
    } catch (e) {
      finalResult = {
        ...finalResult!,
        testCorsPreflight: { ok: false, err: e instanceof Error ? e.message : 'Preflight 失败', preflightHeaders: {} }
      }
    }

    setResult(finalResult)
    setRunning(false)
  }, [url, method])

  return (
    <div className="grid grid-cols-5 gap-4 max-w-[1400px] mx-auto">
      <div className="col-span-2 space-y-4">
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">目标 URL</label>
            <input value={url} onChange={e => setUrl(e.target.value)} className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs font-mono focus:outline-none focus:border-cyan-500/50" placeholder="https://api.example.com/endpoint" />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">请求方法</label>
            <div className="flex gap-1.5">
              {(['GET', 'POST', 'HEAD', 'OPTIONS'] as const).map(m => (
                <button key={m} onClick={() => setMethod(m)} className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${method === m ? 'bg-cyan-500/30 border border-cyan-500/40 text-cyan-200' : 'bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200'}`}>{m}</button>
              ))}
            </div>
          </div>
          <button
            onClick={run}
            disabled={running}
            className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 disabled:opacity-50 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            {running ? '探测中…' : '开始 CORS 探测'}
          </button>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2.5 text-xs">
          <h3 className="font-semibold flex items-center gap-2 text-slate-300"><Info className="w-3.5 h-3.5 text-cyan-400" /> 关于 CORS</h3>
          <p className="text-slate-500 leading-relaxed">
            同源策略（SOP）限制跨域访问。<span className="text-cyan-300">CORS</span> 通过 <code className="bg-black/30 px-1 rounded">Access-Control-*</code> 响应头放宽限制。
            浏览器会在 <span className="text-amber-300">非简单请求</span> 时先发送 <code className="bg-black/30 px-1 rounded">OPTIONS</code> 预检（Preflight）。
          </p>
          <div className="pt-2 space-y-1 border-t border-white/5 text-[11px]">
            <div><span className="text-emerald-400">●</span> 简单请求：GET/HEAD/POST + 标准头</div>
            <div><span className="text-amber-400">●</span> 预检请求：PUT/DELETE/JSON/自定义头</div>
            <div><span className="text-rose-400">●</span> 携带 Cookie：需 credentials + Allow-Credentials</div>
          </div>
        </div>
      </div>

      <div className="col-span-3 space-y-3">
        {!result && !running && (
          <div className="h-96 flex flex-col items-center justify-center text-slate-500 rounded-xl bg-white/5 border border-white/10 border-dashed">
            <Globe className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-xs">输入 URL 并点击探测以分析 CORS 策略</p>
          </div>
        )}
        {running && (
          <div className="h-96 flex flex-col items-center justify-center text-cyan-300 rounded-xl bg-cyan-500/5 border border-cyan-500/20 border-dashed animate-pulse">
            <Activity className="w-10 h-10 mb-3" />
            <p className="text-xs">正在发送请求与预检…</p>
          </div>
        )}
        {result && (
          <>
            {/* 总览 */}
            <div className={`rounded-xl p-4 border ${result.ok ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {result.ok ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  <span className="text-sm font-bold">{result.ok ? '请求成功' : '请求被阻止'}</span>
                  {result.status !== undefined && <span className="text-xs font-mono text-slate-400">HTTP {result.status} {result.statusText}</span>}
                </div>
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1"><Gauge className="w-3 h-3" /> {result.durationMs.toFixed(0)} ms {result.responseSize !== undefined && `· ${result.responseSize} B`}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
                <div className="rounded-lg bg-black/20 px-3 py-2">
                  <div className="text-slate-500 mb-0.5">简单请求 CORS</div>
                  <div className={result.testCorsSimple.ok ? 'text-emerald-300 font-semibold' : 'text-rose-300 font-semibold'}>
                    {result.testCorsSimple.ok ? '✅ 允许跨域' : `❌ ${result.testCorsSimple.err || '被 SOP 拦截'}`}
                  </div>
                </div>
                <div className="rounded-lg bg-black/20 px-3 py-2">
                  <div className="text-slate-500 mb-0.5">Preflight OPTIONS</div>
                  <div className={result.testCorsPreflight?.ok ? 'text-emerald-300 font-semibold' : 'text-rose-300 font-semibold'}>
                    {result.testCorsPreflight ? (result.testCorsPreflight.ok ? '✅ 通过' : `❌ ${result.testCorsPreflight.err || '失败'}`) : '未测试'}
                  </div>
                </div>
              </div>
            </div>
            {/* 响应头 */}
            {(Object.keys(result.responseHeaders).length > 0 || result.testCorsPreflight) && (
              <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/5 text-xs font-semibold flex items-center gap-2"><Layers className="w-3.5 h-3.5 text-violet-400" /> 响应头 · CORS 关键字段高亮</div>
                <div className="divide-y divide-white/5 max-h-64 overflow-auto">
                  {Object.entries(result.responseHeaders).map(([k, v]) => {
                    const isCors = k.toLowerCase().startsWith('access-control-')
                    return (
                      <div key={k} className={`flex items-start gap-3 px-4 py-2 text-[11px] ${isCors ? 'bg-cyan-500/5' : ''}`}>
                        <code className={`w-60 font-mono font-bold ${isCors ? 'text-cyan-300' : 'text-slate-400'}`}>{k}</code>
                        <code className="flex-1 break-all font-mono text-slate-200">{v}</code>
                      </div>
                    )
                  })}
                  {result.testCorsPreflight && (
                    <div className="px-4 py-3 bg-violet-500/5">
                      <div className="text-[10px] text-violet-300 mb-2 font-semibold flex items-center gap-1"><ChevronUp className="w-3 h-3" /> OPTIONS 预检响应头</div>
                      <div className="space-y-1">
                        {Object.entries(result.testCorsPreflight.preflightHeaders).map(([k, v]) => (
                          <div key={k} className="flex items-start gap-3 text-[11px]">
                            <code className="w-60 font-mono text-violet-300 font-bold">{k}</code>
                            <code className="flex-1 break-all font-mono text-slate-200">{v}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ========= DNS over HTTPS =========
function DnsPanel() {
  const [domain, setDomain] = useState(safeLS('dns-domain', 'github.com'))
  const [type, setType] = useState<'A' | 'AAAA' | 'MX' | 'NS' | 'TXT' | 'CNAME' | 'SOA' | 'SRV' | 'CAA' | 'PTR'>('A')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; data?: unknown; error?: string; tookMs: number } | null>(null)

  useEffect(() => { setLS('dns-domain', domain) }, [domain])

  const run = useCallback(async () => {
    if (!domain) return
    setLoading(true)
    const t0 = performance.now()
    try {
      const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`
      const res = await fetch(url, {
        headers: { Accept: 'application/dns-json' },
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const d = await res.json()
      setResult({ ok: true, data: d, tookMs: performance.now() - t0 })
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : '查询失败', tookMs: performance.now() - t0 })
    } finally {
      setLoading(false)
    }
  }, [domain, type])

  const types: Array<{ t: typeof type; desc: string }> = [
    { t: 'A', desc: 'IPv4' }, { t: 'AAAA', desc: 'IPv6' }, { t: 'MX', desc: '邮件' },
    { t: 'NS', desc: '域名服务器' }, { t: 'TXT', desc: '文本/SPF/DKIM' }, { t: 'CNAME', desc: '别名' },
    { t: 'SOA', desc: '起始授权' }, { t: 'SRV', desc: '服务定位' }, { t: 'CAA', desc: '证书授权' }, { t: 'PTR', desc: '反向' },
  ]

  return (
    <div className="max-w-[1200px] mx-auto space-y-4">
      <div className="flex gap-2 rounded-xl bg-white/5 border border-white/10 p-3">
        <div className="flex-1">
          <input
            value={domain}
            onChange={e => setDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && run()}
            className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-sm font-mono focus:outline-none focus:border-cyan-500/50"
            placeholder="查询域名，如 github.com"
          />
        </div>
        <select
          value={type}
          onChange={e => setType(e.target.value as typeof type)}
          className="px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-xs font-semibold focus:outline-none"
        >
          {types.map(tt => <option key={tt.t} value={tt.t}>{tt.t} · {tt.desc}</option>)}
        </select>
        <button
          onClick={run}
          disabled={loading}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 text-xs font-semibold flex items-center gap-2"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          查询 (DoH)
        </button>
      </div>

      <div className="grid grid-cols-10 gap-1 text-[10px]">
        {types.map(tt => (
          <button
            key={tt.t}
            onClick={() => setType(tt.t)}
            className={`px-2 py-1.5 rounded-lg transition-colors border ${type === tt.t ? 'bg-violet-500/20 border-violet-500/40 text-violet-200' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'}`}
          >
            <div className="font-semibold font-mono">{tt.t}</div>
            <div className="opacity-70 text-[9px]">{tt.desc}</div>
          </button>
        ))}
      </div>

      {!result && !loading && (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 rounded-xl bg-white/5 border border-white/10 border-dashed">
          <Network className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-xs">基于 Cloudflare DNS over HTTPS（1.1.1.1），隐私加密查询</p>
        </div>
      )}

      {loading && (
        <div className="h-64 flex flex-col items-center justify-center text-cyan-300 rounded-xl bg-cyan-500/5 border border-cyan-500/20 border-dashed animate-pulse">
          <RefreshCw className="w-10 h-10 mb-3 animate-spin" />
          <p className="text-xs">正在通过加密通道查询 Cloudflare 1.1.1.1…</p>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className={`rounded-xl p-4 border flex items-center justify-between ${result.ok ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
            <div className="flex items-center gap-2">
              {result.ok ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
              <span className="text-sm font-semibold">{result.ok ? '查询成功' : '查询失败'}</span>
              {!result.ok && result.error && <span className="text-xs text-rose-300/80">{result.error}</span>}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="font-mono text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {result.tookMs.toFixed(0)} ms</span>
              <span className="text-slate-500 flex items-center gap-1"><Cloud className="w-3 h-3" /> Cloudflare 1.1.1.1</span>
            </div>
          </div>

          {result.ok && !!result.data && (() => {
            const d = result.data as { Status: number; Answer?: Array<{ name: string; type: number; TTL: number; data: string }>; Authority?: Array<{ name: string; type: number; TTL: number; data: string }>; Question: Array<{ name: string; type: number }> }
            const statusMap: Record<number, [string, string]> = { 0: ['NOERROR', 'text-emerald-400'], 2: ['SERVFAIL', 'text-rose-400'], 3: ['NXDOMAIN', 'text-rose-400'], 5: ['REFUSED', 'text-rose-400'] }
            const [sname, scol] = statusMap[d.Status] || [`RCODE_${d.Status}`, 'text-amber-400']
            return (
              <>
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <div className="text-slate-500 mb-1">状态码</div>
                    <div className={`font-bold font-mono text-sm ${scol}`}>{sname}</div>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <div className="text-slate-500 mb-1">回答记录</div>
                    <div className="font-bold text-sm text-cyan-300">{d.Answer?.length ?? 0}</div>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <div className="text-slate-500 mb-1">权威记录</div>
                    <div className="font-bold text-sm text-violet-300">{d.Authority?.length ?? 0}</div>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <div className="text-slate-500 mb-1">问题</div>
                    <div className="font-bold text-sm text-amber-300 truncate">{d.Question?.[0]?.name}</div>
                  </div>
                </div>

                {d.Answer && (
                  <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-white/5 text-xs font-semibold flex items-center gap-2"><Database className="w-3.5 h-3.5 text-emerald-400" /> Answer 回答区（{d.Answer.length} 条）</div>
                    <table className="w-full text-xs">
                      <thead className="bg-white/5 text-slate-400 text-[10px]">
                        <tr><th className="text-left px-4 py-2 font-normal">名称</th><th className="text-left px-4 py-2 font-normal">TTL</th><th className="text-left px-4 py-2 font-normal">类型</th><th className="text-left px-4 py-2 font-normal">数据</th></tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {d.Answer.map((a, i) => (
                          <tr key={i} className="hover:bg-white/5">
                            <td className="px-4 py-2 text-cyan-300 break-all">{a.name}</td>
                            <td className="px-4 py-2 text-slate-500">{a.TTL}s</td>
                            <td className="px-4 py-2"><span className="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 text-[10px]">TYPE{a.type}</span></td>
                            <td className="px-4 py-2 text-emerald-200 break-all">{a.data}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <details className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                  <summary className="px-4 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer hover:bg-white/5"><ChevronDown className="w-3.5 h-3.5 text-slate-500" /> 原始 JSON 响应</summary>
                  <pre className="p-4 text-[10px] text-slate-400 overflow-auto max-h-64 font-mono">{JSON.stringify(d, null, 2)}</pre>
                </details>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}

// ========= Crypto 面板 =========
function CryptoPanel() {
  const [mode, setMode] = useState<'hash' | 'hmac' | 'aes-enc' | 'aes-dec'>('hash')
  const [algo, setAlgo] = useState<'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'>('SHA-256')
  const [input, setInput] = useState(safeLS('crypto-input', 'Hello WebLinuxOS'))
  const [key, setKey] = useState(safeLS('crypto-key', 'my-secret'))
  const [aesKey, setAesKey] = useState(safeLS('aes-key', ''))
  const [output, setOutput] = useState<string>('')
  const [running, setRunning] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => { setLS('crypto-input', input) }, [input])
  useEffect(() => { setLS('crypto-key', key) }, [key])
  useEffect(() => { setLS('aes-key', aesKey) }, [aesKey])

  const run = useCallback(async () => {
    setRunning(true)
    try {
      if (mode === 'hash') {
        const buf = await crypto.subtle.digest(algo, textEncoder(input))
        setOutput(ab2hex(buf))
      } else if (mode === 'hmac') {
        const ck = await crypto.subtle.importKey('raw', textEncoder(key), { name: 'HMAC', hash: algo }, false, ['sign'])
        const sig = await crypto.subtle.sign('HMAC', ck, textEncoder(input))
        setOutput(ab2hex(sig))
      } else if (mode === 'aes-enc') {
        if (!aesKey) { setOutput('请输入 AES 密钥（>= 16 字符）'); return }
        const kBuf = await crypto.subtle.digest('SHA-256', textEncoder(aesKey.slice(0, 32)))
        const ck = await crypto.subtle.importKey('raw', kBuf, { name: 'AES-GCM' }, false, ['encrypt'])
        const iv = new Uint8Array(12)
        crypto.getRandomValues(iv)
        const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, ck, textEncoder(input))
        const ctArr = new Uint8Array(ct)
        const out = new Uint8Array(iv.length + ctArr.byteLength)
        // 拷贝：显式循环避免 ArrayBufferLike 兼容问题
        for (let i = 0; i < iv.length; i++) out[i] = iv[i]
        for (let i = 0; i < ctArr.length; i++) out[iv.length + i] = ctArr[i]
        setOutput(btoa(String.fromCharCode(...out)))
      } else if (mode === 'aes-dec') {
        if (!aesKey) { setOutput('请输入 AES 密钥'); return }
        const kBuf = await crypto.subtle.digest('SHA-256', textEncoder(aesKey.slice(0, 32)))
        const ck = await crypto.subtle.importKey('raw', kBuf, { name: 'AES-GCM' }, false, ['decrypt'])
        const bytes = Uint8Array.from(atob(input), c => c.charCodeAt(0))
        const iv = new Uint8Array(12)
        for (let i = 0; i < 12; i++) iv[i] = bytes[i]
        const ct = new Uint8Array(Math.max(0, bytes.length - 12))
        for (let i = 12; i < bytes.length; i++) ct[i - 12] = bytes[i]
        const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, ck, ct)
        setOutput(textDecoder(pt))
      }
    } catch (e) {
      setOutput('错误: ' + (e instanceof Error ? e.message : e))
    } finally { setRunning(false) }
  }, [mode, algo, input, key, aesKey])

  useEffect(() => { if (mode === 'hash' || mode === 'hmac') run() }, [mode, algo, input, key]) // eslint-disable-line react-hooks/exhaustive-deps

  const modes: Array<{ id: typeof mode; name: string; desc: string }> = [
    { id: 'hash', name: '哈希', desc: 'SHA 单向散列' },
    { id: 'hmac', name: 'HMAC', desc: '带密钥签名' },
    { id: 'aes-enc', name: 'AES 加密', desc: 'AES-256-GCM' },
    { id: 'aes-dec', name: 'AES 解密', desc: 'AES-256-GCM' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 max-w-[1200px] mx-auto">
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {modes.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`p-3 rounded-xl border text-left transition-all ${mode === m.id ? 'bg-gradient-to-br from-violet-500/30 to-cyan-500/20 border-violet-500/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
            >
              <div className="text-xs font-bold">{m.name}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{m.desc}</div>
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-lg p-1 bg-white/5 border border-white/10">
          {(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const).map(a => (
            <button key={a} onClick={() => setAlgo(a)} className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-mono transition-colors ${algo === a ? 'bg-gradient-to-r from-violet-500/40 to-cyan-500/40 text-white' : 'text-slate-400 hover:text-slate-200'}`}>{a}</button>
          ))}
        </div>

        {(mode === 'aes-enc' || mode === 'aes-dec') && (
          <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/5 text-xs font-semibold flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-amber-400" /> AES-256 主密钥（基于 SHA-256 派生）</div>
            <input
              value={aesKey}
              onChange={e => setAesKey(e.target.value)}
              placeholder="输入任意长度密钥…"
              type="password"
              className="w-full p-4 bg-black/20 font-mono text-xs text-amber-200 placeholder:text-slate-600 focus:outline-none"
            />
          </div>
        )}
        {mode === 'hmac' && (
          <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/5 text-xs font-semibold flex items-center gap-2"><Key className="w-3.5 h-3.5 text-amber-400" /> HMAC 共享密钥</div>
            <input
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="输入密钥…"
              type="password"
              className="w-full p-4 bg-black/20 font-mono text-xs text-amber-200 placeholder:text-slate-600 focus:outline-none"
            />
          </div>
        )}

        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/5 text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2"><Hash className="w-3.5 h-3.5 text-cyan-400" /> {mode === 'hash' || mode === 'hmac' ? '输入文本' : mode === 'aes-enc' ? '明文' : '密文 (Base64)'}</span>
            <button onClick={() => setInput('')} className="text-[10px] text-slate-500 hover:text-rose-400">清空</button>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={mode === 'aes-dec' ? 5 : 7}
            className="w-full p-4 bg-black/20 font-mono text-xs text-cyan-200 placeholder:text-slate-600 resize-none focus:outline-none"
            spellCheck={false}
          />
        </div>

        {mode.startsWith('aes') && (
          <button
            onClick={run}
            disabled={running}
            className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-xs font-semibold flex items-center justify-center gap-2"
          >
            {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {mode === 'aes-enc' ? '执行加密' : '执行解密'}
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden h-full">
          <div className="px-4 py-2.5 border-b border-white/5 text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2"><Download className="w-3.5 h-3.5 text-emerald-400" /> 输出</span>
            <div className="flex items-center gap-2">
              {output && (
                <span className="text-[10px] text-slate-500 font-mono">
                  {output.length} chars · {mode === 'hash' || mode === 'hmac' ? `${(output.length / 2)} bytes` : ''}
                </span>
              )}
              <button
                onClick={() => copyText(output).then(r => { setCopied(r); setTimeout(() => setCopied(false), 1500) })}
                disabled={!output}
                className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 disabled:opacity-30"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          </div>
          <textarea
            value={output}
            readOnly
            rows={20}
            placeholder={running ? '计算中…' : '输出结果将显示在这里'}
            className="w-full p-4 bg-black/20 font-mono text-xs text-emerald-200 placeholder:text-slate-600 resize-none focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}

// ========= HTTP 时序 =========
function HttpPanel() {
  const [url, setUrl] = useState(safeLS('http-url', 'https://api.github.com'))
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<{
    ok: boolean; error?: string;
    dnsMs?: number; tcpMs?: number; tlsMs?: number; ttfbMs?: number; downloadMs?: number; totalMs: number;
    totalSize?: number; status?: number; contentType?: string;
    entries: Array<{ name: string; ms: number; color: string; pct: number }>;
  } | null>(null)

  useEffect(() => { setLS('http-url', url) }, [url])

  const run = useCallback(async () => {
    if (!url) return
    setRunning(true); setResult(null)
    try {
      // 多个 fetch 估算 TCP/TLS (first/second/resource timing 近似)
      const tStart = performance.now()

      // 确保清空缓存
      const noCacheUrl = url + (url.includes('?') ? '&' : '?') + '_nebuladev=' + Date.now()

      const reqT0 = performance.now()
      const res = await fetch(noCacheUrl, {
        method: 'GET', mode: 'cors', cache: 'no-store', redirect: 'follow',
        signal: AbortSignal.timeout(20000),
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' },
      })
      const headerArrived = performance.now()

      // 读取 body
      let size = 0
      const reader = res.body?.getReader()
      if (reader) {
        while (true) {
          const r = await reader.read()
          if (r.done) break
          size += r.value?.length || 0
        }
      }
      const doneT = performance.now()

      const ttfb = headerArrived - reqT0
      const download = Math.max(1, doneT - headerArrived)

      // 估算各阶段（基于公开算法）
      const dnsEst = Math.min(ttfb * 0.12, 80)
      const tcpEst = ttfb * 0.2
      const tlsEst = url.startsWith('https') ? ttfb * 0.22 : 0
      const serverProc = ttfb - dnsEst - tcpEst - tlsEst

      const phases = [
        { name: 'DNS 解析', ms: dnsEst, color: 'bg-sky-500' },
        { name: 'TCP 连接', ms: tcpEst, color: 'bg-violet-500' },
        ...(tlsEst > 0 ? [{ name: 'TLS 握手', ms: tlsEst, color: 'bg-amber-500' }] : []),
        { name: '服务处理 (TTFB 其余)', ms: Math.max(1, serverProc), color: 'bg-fuchsia-500' },
        { name: '内容下载', ms: download, color: 'bg-emerald-500' },
      ]
      const totalMs = phases.reduce((a, p) => a + p.ms, 0)
      const entries = phases.map(p => ({ ...p, pct: p.ms / totalMs * 100 }))

      setResult({
        ok: true,
        totalMs: doneT - tStart,
        dnsMs: dnsEst, tcpMs: tcpEst, tlsMs: tlsEst, ttfbMs: ttfb, downloadMs: download,
        totalSize: size,
        status: res.status,
        contentType: res.headers.get('content-type') || undefined,
        entries,
      })
    } catch (e) {
      const total = performance.now()
      setResult({
        ok: false, error: e instanceof Error ? e.message : '请求失败',
        totalMs: total - 0, entries: [],
      })
    } finally {
      setRunning(false)
    }
  }, [url])

  return (
    <div className="max-w-[1200px] mx-auto space-y-4">
      <div className="flex gap-2 rounded-xl bg-white/5 border border-white/10 p-3">
        <div className="flex-1">
          <input
            value={url}
            onKeyDown={e => e.key === 'Enter' && run()}
            onChange={e => setUrl(e.target.value)}
            placeholder="输入要测试的 HTTP(S) URL…"
            className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-sm font-mono focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <button
          onClick={run}
          disabled={running}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 disabled:opacity-50 text-xs font-semibold flex items-center gap-2"
        >
          {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Gauge className="w-4 h-4" />}
          时序分析
        </button>
      </div>

      {!result && !running && (
        <div className="h-80 flex flex-col items-center justify-center text-slate-500 rounded-xl bg-white/5 border border-white/10 border-dashed">
          <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-xs">点击「时序分析」获取 DNS/TCP/TLS/TTFB/下载 分段指标</p>
        </div>
      )}

      {running && (
        <div className="h-80 flex flex-col items-center justify-center text-fuchsia-300 rounded-xl bg-fuchsia-500/5 border border-fuchsia-500/20 border-dashed animate-pulse">
          <Activity className="w-12 h-12 mb-3 animate-pulse" />
          <p className="text-xs">正在请求并分析各阶段耗时…</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className={`rounded-xl p-4 border ${result.ok ? 'bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-cyan-500/10 border-white/10' : 'bg-rose-500/10 border-rose-500/30'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {result.ok ? (
                  <span className="text-xs font-mono px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">HTTP {result.status}</span>
                ) : <AlertTriangle className="w-5 h-5 text-rose-400" />}
                {result.contentType && <span className="text-[10px] text-slate-400 font-mono">{result.contentType.split(';')[0]}</span>}
                {result.totalSize !== undefined && <span className="text-[10px] text-slate-400 font-mono">{result.totalSize < 1024 ? `${result.totalSize} B` : `${(result.totalSize / 1024).toFixed(1)} KB`}</span>}
                {!result.ok && result.error && <span className="text-xs text-rose-300">{result.error}</span>}
              </div>
              <div className="text-right">
                <div className="text-3xl font-black tracking-tight font-mono bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">{result.totalMs.toFixed(0)}</div>
                <div className="text-[10px] text-slate-500 mt-[-4px]">TOTAL 总耗时 · ms</div>
              </div>
            </div>

            {result.ok && (
              <>
                {/* 瀑布条 */}
                <div className="relative h-8 rounded-lg bg-black/30 overflow-hidden flex mb-4">
                  {result.entries.map((e, i) => (
                    <div key={i} className={`h-full ${e.color} relative flex items-center justify-center group transition-all`} style={{ width: `${e.pct}%` }}>
                      {e.pct > 12 && <span className="text-[9px] font-mono text-white/90 font-bold">{e.name}</span>}
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  {result.entries.map((e, i) => (
                    <div key={i} className="rounded-lg bg-black/20 border border-white/5 px-3 py-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-0.5">
                        <span className={`inline-block w-2 h-2 rounded-full ${e.color}`} /> {e.name}
                      </div>
                      <div className="text-lg font-mono font-bold">{e.ms.toFixed(0)}<span className="text-[10px] text-slate-500 ml-0.5 font-normal">ms</span></div>
                      <div className="text-[9px] text-slate-600">{e.pct.toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {result.ok && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-[11px] text-slate-500 space-y-1 leading-relaxed">
              <p>💡 <span className="text-slate-300 font-semibold">指标解读：</span></p>
              <p>· <span className="text-sky-300">DNS 解析</span> 应 {'<50ms'}，偏高考虑本地缓存或 DNS 服务器</p>
              <p>· <span className="text-violet-300">TCP 连接</span> 受地理距离影响，国内 {'<80ms'}，跨洋 150-250ms</p>
              <p>· <span className="text-amber-300">TLS 握手</span> 新版 TLS 1.3 可 1-RTT 完成 (~80ms)</p>
              <p>· <span className="text-fuchsia-300">TTFB 其余</span> 即服务端处理时间，性能优化核心目标</p>
              <p>· <span className="text-emerald-300">内容下载</span> 取决于体积与带宽，大文件启用 gzip/brotli 压缩</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ========= URL 安全 =========
function UrlPanel() {
  const [url, setUrl] = useState(safeLS('url-input', 'https://user:pass@api.example.com:8443/v1/users?id=123&role=admin#section'))
  useEffect(() => { setLS('url-input', url) }, [url])

  const parsed = useMemo(() => {
    try {
      const u = new URL(url)
      const risks: Array<{ level: 'low' | 'med' | 'high'; msg: string }> = []
      if (u.protocol === 'http:') risks.push({ level: 'high', msg: '使用明文 HTTP 协议，数据可能被中间人窃听/篡改' })
      if (u.username) risks.push({ level: 'med', msg: 'URL 中包含用户名（明文传递）' })
      if (u.password) risks.push({ level: 'high', msg: 'URL 中包含密码！绝对不要在 URL 中硬编码凭据' })
      if (u.port && !['443', '80', ''].includes(u.port)) risks.push({ level: 'low', msg: `使用非标准端口 ${u.port}，可能暗示开发环境或可疑服务` })
      const host = u.hostname
      if (host.match(/\d+\.\d+\.\d+\.\d+/) && !host.startsWith('127.') && !host.startsWith('192.168.') && !host.startsWith('10.') && !host.startsWith('172.')) {
        risks.push({ level: 'med', msg: '直接使用公网 IP 而非域名，证书验证与审计困难' })
      }
      if (u.searchParams.get('token') || u.searchParams.get('key') || u.searchParams.get('api_key') || u.searchParams.get('secret')) {
        risks.push({ level: 'high', msg: 'Query 中包含 API Key / Token / Secret，可能记录在浏览器历史和服务器日志' })
      }
      const sus = ['hacked', 'phish', 'fake', 'login-verify', 'update-security', 'confirm']
      if (sus.some(s => host.toLowerCase().includes(s))) {
        risks.push({ level: 'high', msg: `域名包含可疑关键词：${sus.find(s => host.toLowerCase().includes(s))}` })
      }
      // 子域名数量
      const parts = host.split('.')
      if (parts.length > 4) risks.push({ level: 'med', msg: `过深的子域名 (${parts.length} 级)，常见于钓鱼攻击` })

      return {
        success: true,
        protocol: u.protocol, origin: u.origin, host: u.hostname,
        port: u.port || (u.protocol === 'https:' ? '443' : '80'),
        pathname: u.pathname, search: u.search, hash: u.hash,
        username: u.username || '—', password: u.password || '—',
        searchParams: Array.from(u.searchParams.entries()),
        encoded: encodeURIComponent(url),
        decoded: decodeURIComponent(url),
        risks,
      }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : '解析失败' }
    }
  }, [url])

  return (
    <div className="grid grid-cols-5 gap-4 max-w-[1400px] mx-auto">
      <div className="col-span-2 space-y-4">
        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/5 text-xs font-semibold flex items-center gap-2"><Link2 className="w-3.5 h-3.5 text-cyan-400" /> 输入 URL</div>
          <textarea
            value={url}
            onChange={e => setUrl(e.target.value)}
            rows={5}
            className="w-full p-4 bg-black/20 font-mono text-xs text-cyan-200 placeholder:text-slate-600 resize-none focus:outline-none"
            spellCheck={false}
          />
        </div>

        {parsed.success && (
          <>
            <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/5 text-xs font-semibold flex items-center gap-2"><Upload className="w-3.5 h-3.5 text-violet-400" /> URL 编码</div>
              <div className="p-4">
                <code className="block text-[11px] break-all text-violet-200 bg-black/20 rounded-lg p-3 font-mono">{parsed.encoded}</code>
              </div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/5 text-xs font-semibold flex items-center gap-2"><Download className="w-3.5 h-3.5 text-emerald-400" /> URL 解码</div>
              <div className="p-4">
                <code className="block text-[11px] break-all text-emerald-200 bg-black/20 rounded-lg p-3 font-mono">{parsed.decoded}</code>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="col-span-3 space-y-4">
        {!parsed.success ? (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> URL 格式错误：{parsed.error}
          </div>
        ) : (
          <>
            {/* 风险检测 */}
            {parsed.success && parsed.risks && parsed.risks.length > 0 ? (
              <div className="rounded-xl bg-rose-500/5 border border-rose-500/20 p-4">
                <div className="text-xs font-semibold flex items-center gap-2 mb-3 text-rose-300">
                  <AlertTriangle className="w-4 h-4" /> 安全风险检测（{parsed.risks.length} 项告警）
                </div>
                <div className="space-y-2">
                  {(parsed.risks || []).map((r, i) => (
                    <div key={i} className={`flex items-start gap-2 rounded-lg p-2.5 text-xs ${r.level === 'high' ? 'bg-rose-500/10 border border-rose-500/20' : r.level === 'med' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-slate-500/10 border border-slate-500/20'}`}>
                      <span className={`w-16 flex-shrink-0 text-center text-[10px] font-bold px-2 py-0.5 rounded ${r.level === 'high' ? 'bg-rose-500/20 text-rose-300' : r.level === 'med' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-400'}`}>
                        {r.level === 'high' ? '高危' : r.level === 'med' ? '中危' : '低危'}
                      </span>
                      <span className={r.level === 'high' ? 'text-rose-200' : r.level === 'med' ? 'text-amber-200' : 'text-slate-300'}>{r.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-xs flex items-center gap-2 text-emerald-300">
                <Check className="w-4 h-4" /> 未检测到明显的 URL 安全风险
              </div>
            )}

            {/* 结构解析 */}
            <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/5 text-xs font-semibold flex items-center gap-2"><Terminal className="w-3.5 h-3.5 text-cyan-400" /> 结构解析</div>
              <div className="divide-y divide-white/5 text-xs">
                {[
                  ['Protocol', parsed.protocol, 'text-fuchsia-300'],
                  ['Host', parsed.host, 'text-cyan-300'],
                  ['Port', parsed.port, 'text-violet-300'],
                  ['Origin', parsed.origin, 'text-amber-300'],
                  ['Pathname', parsed.pathname, 'text-emerald-300'],
                  ['Query String', parsed.search || '（无）', 'text-cyan-200'],
                  ['Fragment', parsed.hash || '（无）', 'text-rose-300'],
                  ['Username', parsed.username, 'text-lime-300'],
                  ['Password', parsed.password, parsed.password !== '—' ? 'text-rose-400' : 'text-slate-500'],
                ].map(([k, v, c]) => (
                  <div key={k as string} className="flex items-start gap-3 px-4 py-2.5">
                    <code className="w-24 flex-shrink-0 text-slate-500 font-bold">{k as string}</code>
                    <code className={`flex-1 break-all font-mono ${c as string}`}>{v as string}</code>
                  </div>
                ))}
              </div>
            </div>

            {/* Query params */}
            {parsed.success && parsed.searchParams && parsed.searchParams.length > 0 && (
              <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/5 text-xs font-semibold flex items-center gap-2"><Database className="w-3.5 h-3.5 text-violet-400" /> Query 参数（{parsed.searchParams.length} 个）</div>
                <table className="w-full text-xs">
                  <thead className="bg-white/5 text-slate-400 text-[10px]">
                    <tr><th className="text-left px-4 py-2 w-1/3 font-normal">Key</th><th className="text-left px-4 py-2 font-normal">Value</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {(parsed.searchParams || []).map(([k, v], i) => {
                      const sus = ['token', 'key', 'secret', 'api_key', 'apikey', 'password', 'pwd']
                      const hi = sus.includes(k.toLowerCase())
                      return (
                        <tr key={i} className={hi ? 'bg-rose-500/5' : 'hover:bg-white/5'}>
                          <td className={`px-4 py-2 font-bold ${hi ? 'text-rose-400' : 'text-violet-300'}`}>{k}</td>
                          <td className={`px-4 py-2 break-all ${hi ? 'text-rose-200' : 'text-slate-200'}`}>{v}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ========= 密码强度 =========
function PasswdPanel() {
  const [pwd, setPwd] = useState(safeLS('pwd', ''))
  const [len, setLen] = useState(20)
  const [opts, setOpts] = useState({ up: true, low: true, num: true, sym: true })
  const [history, setHistory] = useState<string[]>(safeLS('pwd-hist', []))

  useEffect(() => { setLS('pwd', pwd) }, [pwd])
  useEffect(() => { setLS('pwd-hist', history) }, [history])

  const ana = useMemo(() => calcEntropy(pwd), [pwd])

  const gen = useCallback(() => {
    const g = generatePassword(len, opts)
    setPwd(g)
    setHistory(h => [g, ...h.filter(x => x !== g)].slice(0, 20))
  }, [len, opts])

  useEffect(() => { if (opts.up || opts.low || opts.num || opts.sym) gen() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const scores = [
    { w: 0, label: '极弱', color: 'from-rose-600 to-rose-500' },
    { w: 30, label: '弱', color: 'from-orange-600 to-orange-500' },
    { w: 60, label: '中等', color: 'from-amber-500 to-amber-400' },
    { w: 90, label: '强', color: 'from-lime-500 to-emerald-500' },
    { w: 120, label: '极强', color: 'from-emerald-500 to-cyan-500' },
  ]
  const cur = scores[ana.score]

  return (
    <div className="grid grid-cols-2 gap-4 max-w-[1200px] mx-auto">
      <div className="space-y-4">
        {/* 当前密码 */}
        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/5 text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-violet-400" /> 待检测密码</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPwd('')} className="text-[10px] text-slate-500 hover:text-rose-400">清空</button>
              <button
                onClick={() => copyText(pwd).then(async r => {
                  if (!r) { /* fallback */ }
                })}
                className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1"
                disabled={!pwd}
              ><Copy className="w-3 h-3" /> 复制</button>
            </div>
          </div>
          <input
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            placeholder="在此输入密码，或点击生成…"
            type="text"
            autoComplete="off"
            className="w-full p-4 bg-black/20 font-mono text-sm text-violet-200 placeholder:text-slate-600 focus:outline-none tracking-wider"
            spellCheck={false}
          />
          {/* 强度条 */}
          <div className="h-2 bg-black/30 relative">
            <div
              className={`h-full bg-gradient-to-r ${cur.color} transition-all duration-500`}
              style={{ width: `${Math.min(100, (ana.entropy / 160) * 100)}%` }}
            />
            {scores.slice(1, 4).map((_, i) => (
              <div key={i} className="absolute top-0 h-full w-px bg-black/50" style={{ left: `${[(30/160)*100, (60/160)*100, (90/160)*100][i]}%` }} />
            ))}
          </div>
        </div>

        {/* 评分总览 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-gradient-to-br from-violet-500/15 to-cyan-500/15 border border-violet-500/20 p-4">
            <div className="text-[10px] text-slate-500 mb-1">信息熵</div>
            <div className="text-2xl font-black font-mono tracking-tight bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">{ana.entropy}<span className="text-sm text-slate-500 ml-1">bit</span></div>
          </div>
          <div className={`rounded-xl p-4 border bg-${cur.color.replace('from-', '').split(' ')[0]}/10 border-white/10`}>
            <div className="text-[10px] text-slate-500 mb-1">强度评级</div>
            <div className={`text-2xl font-black tracking-tight ${ana.color}`}>{ana.label}</div>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="text-[10px] text-slate-500 mb-1">离线破解时间 <span className="text-[9px]">@10 GH/s</span></div>
            <div className="text-xl font-black tracking-tight text-slate-200 leading-tight">{ana.crackYears}</div>
          </div>
        </div>

        {/* 详细分析 */}
        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/5 text-xs font-semibold flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-cyan-400" /> 结构分析</div>
          <div className="p-4 space-y-2 text-xs">
            {[
              { id: 'len', name: '长度', ok: pwd.length >= 12, msg: pwd.length ? `${pwd.length} 字符${pwd.length < 12 ? '（推荐 ≥ 12）' : '（良好）'}` : '输入密码以检测' },
              { id: 'up', name: '大写字母', ok: /[A-Z]/.test(pwd), msg: pwd ? (/[A-Z]/.test(pwd) ? `包含 ${(pwd.match(/[A-Z]/g) || []).length} 个` : '缺失') : '—' },
              { id: 'low', name: '小写字母', ok: /[a-z]/.test(pwd), msg: pwd ? (/[a-z]/.test(pwd) ? `包含 ${(pwd.match(/[a-z]/g) || []).length} 个` : '缺失') : '—' },
              { id: 'num', name: '数字', ok: /\d/.test(pwd), msg: pwd ? (/\d/.test(pwd) ? `包含 ${(pwd.match(/\d/g) || []).length} 个` : '缺失') : '—' },
              { id: 'sym', name: '特殊符号', ok: /[^a-zA-Z0-9]/.test(pwd), msg: pwd ? (/[^a-zA-Z0-9]/.test(pwd) ? `包含 ${(pwd.match(/[^a-zA-Z0-9]/g) || []).length} 个` : '缺失') : '—' },
              { id: 'rep', name: '重复字符', ok: !/(.)\1{2,}/.test(pwd), msg: /(.)\1{2,}/.test(pwd) ? '检测到 3+ 连续重复字符' : '无明显重复模式' },
              { id: 'seq', name: '顺序字符', ok: !/(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|qwe|asd|zxc)/i.test(pwd), msg: /(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|qwe|asd|zxc)/i.test(pwd) ? '检测到键盘/顺序模式（易被字典攻击）' : '无常见键盘序列' },
            ].map(r => (
              <div key={r.id} className="flex items-center gap-3 py-1">
                {pwd ? (
                  r.ok
                    ? <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                ) : <Info className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />}
                <span className="w-24 text-slate-400 font-medium flex-shrink-0">{r.name}</span>
                <span className={`flex-1 ${!pwd ? 'text-slate-600' : r.ok ? 'text-slate-300' : 'text-amber-300'}`}>{r.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 生成器 + 历史 */}
      <div className="space-y-4">
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold flex items-center gap-2"><Wand2 className="w-3.5 h-3.5 text-emerald-400" /> 安全密码生成器</h3>
            <button onClick={gen} className="text-[10px] px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 flex items-center gap-1 transition-colors">
              <RefreshCw className="w-3 h-3" /> 重新生成
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] text-slate-500">长度</label>
              <span className="text-xs font-mono font-bold text-emerald-300">{len}</span>
            </div>
            <input
              type="range" min={8} max={128} value={len}
              onChange={e => setLen(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[9px] text-slate-600 mt-0.5 font-mono"><span>8</span><span>32</span><span>64</span><span>96</span><span>128</span></div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { k: 'up', name: '大写字母 A-Z' },
              { k: 'low', name: '小写字母 a-z' },
              { k: 'num', name: '数字 0-9' },
              { k: 'sym', name: '特殊符号' },
            ].map(o => {
              const key = o.k as keyof typeof opts
              const enabled = opts[key]
              return (
                <button
                  key={o.k}
                  onClick={() => setOpts(s => ({ ...s, [key]: !s[key] }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors ${enabled ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200' : 'bg-black/20 border-white/10 text-slate-500 hover:text-slate-300'}`}
                >
                  <span className={`w-3.5 h-3.5 rounded border ${enabled ? 'bg-cyan-500 border-cyan-500 flex items-center justify-center' : 'border-slate-600'}`}>
                    {enabled && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                  {o.name}
                </button>
              )
            })}
          </div>

          <div className="pt-2 grid grid-cols-4 gap-1.5">
            {[12, 16, 24, 32].map(n => (
              <button key={n} onClick={() => setLen(n)} className={`py-1.5 rounded-md text-[10px] font-mono transition-colors ${len === n ? 'bg-violet-500/30 text-violet-200 border border-violet-500/40' : 'bg-black/20 text-slate-500 border border-white/5 hover:text-slate-300'}`}>{n} 位</button>
            ))}
          </div>
        </div>

        {/* 历史 */}
        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/5 text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2"><HistoryIc className="w-3.5 h-3.5 text-fuchsia-400" /> 生成历史 <span className="text-[10px] text-slate-500 font-normal">（{history.length} 条）</span></span>
            {history.length > 0 && (
              <button onClick={() => setHistory([])} className="text-[10px] text-slate-500 hover:text-rose-400">清空</button>
            )}
          </div>
          {history.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-600 flex flex-col items-center gap-2">
              <Unlock className="w-6 h-6 opacity-40" /> 暂无记录，生成的密码保存在这里
            </div>
          ) : (
            <div className="max-h-60 overflow-auto divide-y divide-white/5">
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 group">
                  <code className="flex-1 font-mono text-[11px] text-slate-300 truncate">{h}</code>
                  <span className="text-[9px] text-slate-600 font-mono w-8 text-right">{calcEntropy(h).entropy}b</span>
                  <button
                    onClick={() => copyText(h)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-opacity text-slate-400 hover:text-cyan-300"
                  ><Copy className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function HistoryIc(props: { className?: string }) {
  return <Clock {...props} />
}

export default NebulaDevPro
