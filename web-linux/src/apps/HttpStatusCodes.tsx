import { useState, useMemo, useCallback } from 'react'
import { Copy, Search, Check, Terminal, FileCode } from 'lucide-react'

interface StatusCode {
  code: number
  name: string
  category: '1xx' | '2xx' | '3xx' | '4xx' | '5xx'
  description: string
}

const STATUS_CODES: StatusCode[] = [
  { code: 100, name: 'Continue', category: '1xx', description: '服务器已收到请求头，客户端应继续发送请求体' },
  { code: 101, name: 'Switching Protocols', category: '1xx', description: '服务器同意切换协议，常用于 WebSocket 握手' },
  { code: 102, name: 'Processing', category: '1xx', description: '服务器已收到请求并正在处理，但尚无响应可用' },
  { code: 103, name: 'Early Hints', category: '1xx', description: '在最终响应前返回 Link 头，提示客户端预加载资源' },
  { code: 200, name: 'OK', category: '2xx', description: '请求成功，响应包含请求的资源' },
  { code: 201, name: 'Created', category: '2xx', description: '请求已成功并创建了新资源' },
  { code: 202, name: 'Accepted', category: '2xx', description: '请求已接受但尚未处理完成' },
  { code: 203, name: 'Non-Authoritative Information', category: '2xx', description: '响应来自第三方副本，可能与原始数据不同' },
  { code: 204, name: 'No Content', category: '2xx', description: '请求成功但无返回内容' },
  { code: 205, name: 'Reset Content', category: '2xx', description: '要求客户端重置当前视图' },
  { code: 206, name: 'Partial Content', category: '2xx', description: '返回部分内容，配合 Range 头使用' },
  { code: 207, name: 'Multi-Status', category: '2xx', description: '返回多条状态信息（WebDAV）' },
  { code: 208, name: 'Already Reported', category: '2xx', description: '成员先前已报告过，避免重复' },
  { code: 226, name: 'IM Used', category: '2xx', description: '服务器已完成资源请求的增量修改' },
  { code: 300, name: 'Multiple Choices', category: '3xx', description: '请求的资源有多个可选表示' },
  { code: 301, name: 'Moved Permanently', category: '3xx', description: '资源已永久移动，新位置在 Location 头中' },
  { code: 302, name: 'Found', category: '3xx', description: '资源临时移动到其他位置' },
  { code: 303, name: 'See Other', category: '3xx', description: '响应应在另一个 URI 上获取' },
  { code: 304, name: 'Not Modified', category: '3xx', description: '资源未修改，可使用缓存' },
  { code: 305, name: 'Use Proxy', category: '3xx', description: '必须通过代理访问（已弃用）' },
  { code: 307, name: 'Temporary Redirect', category: '3xx', description: '临时重定向，保持原始方法和请求体不变' },
  { code: 308, name: 'Permanent Redirect', category: '3xx', description: '永久重定向，保持原始方法和请求体不变' },
  { code: 400, name: 'Bad Request', category: '4xx', description: '请求语法错误，服务器无法理解' },
  { code: 401, name: 'Unauthorized', category: '4xx', description: '请求需要用户认证' },
  { code: 402, name: 'Payment Required', category: '4xx', description: '预留状态码，未来用于数字支付' },
  { code: 403, name: 'Forbidden', category: '4xx', description: '服务器理解请求但拒绝执行' },
  { code: 404, name: 'Not Found', category: '4xx', description: '服务器无法找到请求的资源' },
  { code: 405, name: 'Method Not Allowed', category: '4xx', description: '请求方法不被允许' },
  { code: 406, name: 'Not Acceptable', category: '4xx', description: '无法根据 Accept 头提供内容' },
  { code: 407, name: 'Proxy Authentication Required', category: '4xx', description: '需要通过代理认证' },
  { code: 408, name: 'Request Timeout', category: '4xx', description: '请求超时' },
  { code: 409, name: 'Conflict', category: '4xx', description: '请求与资源当前状态冲突' },
  { code: 410, name: 'Gone', category: '4xx', description: '资源已永久删除，无新地址' },
  { code: 411, name: 'Length Required', category: '4xx', description: '需要 Content-Length 头' },
  { code: 412, name: 'Precondition Failed', category: '4xx', description: '前提条件评估为假' },
  { code: 413, name: 'Payload Too Large', category: '4xx', description: '请求体过大' },
  { code: 414, name: 'URI Too Long', category: '4xx', description: 'URL 过长' },
  { code: 415, name: 'Unsupported Media Type', category: '4xx', description: '不支持的媒体类型' },
  { code: 416, name: 'Range Not Satisfiable', category: '4xx', description: '请求范围无法满足' },
  { code: 417, name: 'Expectation Failed', category: '4xx', description: 'Expect 头无法满足' },
  { code: 418, name: "I'm a teapot", category: '4xx', description: '彩蛋状态码，源自 RFC 2324 玩笑' },
  { code: 421, name: 'Misdirected Request', category: '4xx', description: '请求被发送到了无法响应的服务器' },
  { code: 422, name: 'Unprocessable Entity', category: '4xx', description: '请求格式正确但语义错误' },
  { code: 423, name: 'Locked', category: '4xx', description: '资源被锁定' },
  { code: 424, name: 'Failed Dependency', category: '4xx', description: '因依赖操作失败而失败' },
  { code: 425, name: 'Too Early', category: '4xx', description: '服务器不愿处理可能被重放的请求' },
  { code: 426, name: 'Upgrade Required', category: '4xx', description: '需要升级协议' },
  { code: 428, name: 'Precondition Required', category: '4xx', description: '要求请求是条件性的' },
  { code: 429, name: 'Too Many Requests', category: '4xx', description: '请求过多，已被限流' },
  { code: 431, name: 'Request Header Fields Too Large', category: '4xx', description: '请求头过大' },
  { code: 451, name: 'Unavailable For Legal Reasons', category: '4xx', description: '因法律原因不可用' },
  { code: 500, name: 'Internal Server Error', category: '5xx', description: '服务器内部错误' },
  { code: 501, name: 'Not Implemented', category: '5xx', description: '服务器不支持请求的功能' },
  { code: 502, name: 'Bad Gateway', category: '5xx', description: '网关或代理从上游接收到无效响应' },
  { code: 503, name: 'Service Unavailable', category: '5xx', description: '服务器暂时无法处理请求' },
  { code: 504, name: 'Gateway Timeout', category: '5xx', description: '网关或代理未及时从上游收到响应' },
  { code: 505, name: 'HTTP Version Not Supported', category: '5xx', description: '服务器不支持请求的 HTTP 协议版本' },
  { code: 506, name: 'Variant Also Negotiates', category: '5xx', description: '服务器内部配置错误' },
  { code: 507, name: 'Insufficient Storage', category: '5xx', description: '服务器存储空间不足' },
  { code: 508, name: 'Loop Detected', category: '5xx', description: '服务器检测到无限循环' },
  { code: 510, name: 'Not Extended', category: '5xx', description: '服务器需要更多信息才能完成请求' },
  { code: 511, name: 'Network Authentication Required', category: '5xx', description: '需要网络认证（如 Captive Portal）' },
]

const CATEGORY_INFO: Record<string, { label: string; color: string; bg: string; border: string }> = {
  '1xx': { label: '信息响应', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.12)', border: 'rgba(14, 165, 233, 0.4)' },
  '2xx': { label: '成功', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.4)' },
  '3xx': { label: '重定向', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.4)' },
  '4xx': { label: '客户端错误', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.4)' },
  '5xx': { label: '服务端错误', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.4)' },
}

const CATEGORY_TABS = [
  { key: 'all', label: '全部' },
  { key: '1xx', label: '1xx' },
  { key: '2xx', label: '2xx' },
  { key: '3xx', label: '3xx' },
  { key: '4xx', label: '4xx' },
  { key: '5xx', label: '5xx' },
] as const

type CategoryKey = typeof CATEGORY_TABS[number]['key']

const HTTP_METHODS = [
  { method: 'GET', desc: '获取资源，幂等，无请求体', color: '#10b981' },
  { method: 'POST', desc: '创建资源，非幂等，有请求体', color: '#3b82f6' },
  { method: 'PUT', desc: '全量更新资源，幂等，有请求体', color: '#f59e0b' },
  { method: 'PATCH', desc: '部分更新资源，非幂等', color: '#8b5cf6' },
  { method: 'DELETE', desc: '删除资源，幂等', color: '#ef4444' },
  { method: 'HEAD', desc: '获取响应头，无响应体', color: '#06b6d4' },
  { method: 'OPTIONS', desc: '获取支持的 HTTP 方法', color: '#ec4899' },
]

export default function HttpStatusCodes() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all')
  const [copiedCode, setCopiedCode] = useState<number | null>(null)
  const [copiedCurl, setCopiedCurl] = useState<string | null>(null)

  const filteredCodes = useMemo(() => {
    let result = STATUS_CODES
    if (activeCategory !== 'all') {
      result = result.filter((c) => c.category === activeCategory)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(
        (c) =>
          String(c.code).includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      )
    }
    return result
  }, [query, activeCategory])

  const copyCode = useCallback((code: number) => {
    navigator.clipboard.writeText(String(code))
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 1200)
  }, [])

  const copyCurl = useCallback((code: number) => {
    const curl = `curl -i -w "\\nHTTP Status: %{http_code}" https://httpbin.org/status/${code}`
    navigator.clipboard.writeText(curl)
    setCopiedCurl(`${code}`)
    setTimeout(() => setCopiedCurl(null), 1200)
  }, [])

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, StatusCode[]> = {}
    filteredCodes.forEach((c) => {
      if (!groups[c.category]) groups[c.category] = []
      groups[c.category].push(c)
    })
    return groups
  }, [filteredCodes])

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--window-bg)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--window-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent, #8b5cf6), var(--accent-secondary, #6366f1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>HTTP</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>HTTP 状态码参考</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            {STATUS_CODES.length} 个状态码 · 按分类浏览或搜索
          </div>
        </div>
      </div>

      <div style={{ padding: '10px 16px', flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'var(--input-bg, rgba(255,255,255,0.06))',
            border: '1px solid var(--window-border)',
          }}
        >
          <Search size={15} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索状态码编号或描述..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: 'inherit',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 14,
                padding: 0,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '0 16px 10px',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        {CATEGORY_TABS.map((tab) => {
          const active = activeCategory === tab.key
          const catInfo = tab.key !== 'all' ? CATEGORY_INFO[tab.key] : null
          return (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                border: active
                  ? `1px solid ${catInfo ? catInfo.border : 'var(--accent)'}`
                  : '1px solid transparent',
                background: active
                  ? catInfo
                    ? catInfo.bg
                    : 'var(--accent-bg, rgba(139,92,246,0.15))'
                  : 'transparent',
                color: active
                  ? catInfo
                    ? catInfo.color
                    : 'var(--accent)'
                  : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '0 16px 16px',
        }}
      >
        {filteredCodes.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 0',
              color: 'var(--text-secondary)',
              fontSize: 13,
            }}
          >
            未找到匹配的状态码
          </div>
        )}

        {(activeCategory === 'all' || activeCategory === '1xx') && groupedByCategory['1xx'] && (
          <CategorySection
            title="1xx 信息响应"
            color={CATEGORY_INFO['1xx'].color}
            bg={CATEGORY_INFO['1xx'].bg}
            border={CATEGORY_INFO['1xx'].border}
            codes={groupedByCategory['1xx']}
            copiedCode={copiedCode}
            copiedCurl={copiedCurl}
            onCopyCode={copyCode}
            onCopyCurl={copyCurl}
          />
        )}
        {(activeCategory === 'all' || activeCategory === '2xx') && groupedByCategory['2xx'] && (
          <CategorySection
            title="2xx 成功"
            color={CATEGORY_INFO['2xx'].color}
            bg={CATEGORY_INFO['2xx'].bg}
            border={CATEGORY_INFO['2xx'].border}
            codes={groupedByCategory['2xx']}
            copiedCode={copiedCode}
            copiedCurl={copiedCurl}
            onCopyCode={copyCode}
            onCopyCurl={copyCurl}
          />
        )}
        {(activeCategory === 'all' || activeCategory === '3xx') && groupedByCategory['3xx'] && (
          <CategorySection
            title="3xx 重定向"
            color={CATEGORY_INFO['3xx'].color}
            bg={CATEGORY_INFO['3xx'].bg}
            border={CATEGORY_INFO['3xx'].border}
            codes={groupedByCategory['3xx']}
            copiedCode={copiedCode}
            copiedCurl={copiedCurl}
            onCopyCode={copyCode}
            onCopyCurl={copyCurl}
          />
        )}
        {(activeCategory === 'all' || activeCategory === '4xx') && groupedByCategory['4xx'] && (
          <CategorySection
            title="4xx 客户端错误"
            color={CATEGORY_INFO['4xx'].color}
            bg={CATEGORY_INFO['4xx'].bg}
            border={CATEGORY_INFO['4xx'].border}
            codes={groupedByCategory['4xx']}
            copiedCode={copiedCode}
            copiedCurl={copiedCurl}
            onCopyCode={copyCode}
            onCopyCurl={copyCurl}
          />
        )}
        {(activeCategory === 'all' || activeCategory === '5xx') && groupedByCategory['5xx'] && (
          <CategorySection
            title="5xx 服务端错误"
            color={CATEGORY_INFO['5xx'].color}
            bg={CATEGORY_INFO['5xx'].bg}
            border={CATEGORY_INFO['5xx'].border}
            codes={groupedByCategory['5xx']}
            copiedCode={copiedCode}
            copiedCurl={copiedCurl}
            onCopyCode={copyCode}
            onCopyCurl={copyCurl}
          />
        )}

        <div
          style={{
            marginTop: 20,
            padding: 14,
            borderRadius: 10,
            background: 'var(--input-bg, rgba(255,255,255,0.04))',
            border: '1px solid var(--window-border)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 10,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <FileCode size={13} />
            常用 HTTP 方法
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {HTTP_METHODS.map((m) => (
              <div
                key={m.method}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 8px',
                  borderRadius: 6,
                  background: 'transparent',
                  transition: 'background 0.15s',
                  fontSize: 12,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent-bg, rgba(139,92,246,0.08))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 52,
                    padding: '3px 8px',
                    borderRadius: 5,
                    background: m.color + '22',
                    color: m.color,
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  }}
                >
                  {m.method}
                </span>
                <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{m.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CategorySection({
  title,
  color,
  bg,
  border,
  codes,
  copiedCode,
  copiedCurl,
  onCopyCode,
  onCopyCurl,
}: {
  title: string
  color: string
  bg: string
  border: string
  codes: StatusCode[]
  copiedCode: number | null
  copiedCurl: string | null
  onCopyCode: (code: number) => void
  onCopyCurl: (code: number) => void
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
          }}
        />
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {codes.map((c) => (
          <CodeRow
            key={c.code}
            code={c}
            color={color}
            bg={bg}
            border={border}
            copiedCode={copiedCode}
            copiedCurl={copiedCurl}
            onCopyCode={onCopyCode}
            onCopyCurl={onCopyCurl}
          />
        ))}
      </div>
    </div>
  )
}

function CodeRow({
  code,
  color,
  bg,
  border,
  copiedCode,
  copiedCurl,
  onCopyCode,
  onCopyCurl,
}: {
  code: StatusCode
  color: string
  bg: string
  border: string
  copiedCode: number | null
  copiedCurl: string | null
  onCopyCode: (code: number) => void
  onCopyCurl: (code: number) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const curlCmd = `curl -i -w "\\nHTTP Status: %{http_code}" https://httpbin.org/status/${code.code}`

  return (
    <div
      style={{
        borderRadius: 8,
        border: `1px solid ${border}`,
        background: bg,
        overflow: 'hidden',
        transition: 'all 0.15s',
      }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '9px 12px',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 48,
            height: 24,
            padding: '0 8px',
            borderRadius: 6,
            background: color,
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            flexShrink: 0,
          }}
        >
          {code.code}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{code.name}</div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {code.description}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCopyCode(code.code)
            }}
            title="复制状态码"
            style={{
              padding: '4px 6px',
              borderRadius: 5,
              background: copiedCode === code.code ? color : 'transparent',
              border: 'none',
              color: copiedCode === code.code ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (copiedCode !== code.code) {
                e.currentTarget.style.background = 'var(--accent-bg, rgba(139,92,246,0.15))'
                e.currentTarget.style.color = 'var(--accent, #8b5cf6)'
              }
            }}
            onMouseLeave={(e) => {
              if (copiedCode !== code.code) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }
            }}
          >
            {copiedCode === code.code ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div
          style={{
            padding: '8px 12px 12px',
            borderTop: `1px solid ${border}`,
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          <p style={{ margin: '0 0 10px', fontSize: 12, lineHeight: 1.6, color: 'var(--text-primary)' }}>
            {code.description}
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 6,
              fontSize: 10,
              color: 'var(--text-secondary)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
            }}
          >
            <Terminal size={11} />
            cURL 命令
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 6,
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--window-border)',
            }}
          >
            <code
              style={{
                flex: 1,
                fontSize: 11,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                color: color,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {curlCmd}
            </code>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCopyCurl(code.code)
              }}
              style={{
                padding: '3px 8px',
                borderRadius: 4,
                background: copiedCurl === `${code.code}` ? color : 'rgba(255,255,255,0.08)',
                border: 'none',
                color: copiedCurl === `${code.code}` ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
            >
              {copiedCurl === `${code.code}` ? <Check size={11} /> : <Copy size={11} />}
              {copiedCurl === `${code.code}` ? '已复制' : '复制'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}