import { useState, useMemo } from 'react'

/**
 * HTTP 状态码浏览器
 *
 * 数据来源：IANA / RFC 9110 官方规范。本工具内置 60+ 常见状态码，
 * 支持按类别（1xx/2xx/3xx/4xx/5xx）和关键字搜索，便于开发者在排查
 * API 调用问题时快速查阅。
 */

interface StatusCode {
  code: number
  name: string
  category: '1xx' | '2xx' | '3xx' | '4xx' | '5xx'
  description: string
  usage: string
  common?: boolean
}

const STATUS_CODES: StatusCode[] = [
  // 1xx Informational
  { code: 100, name: 'Continue', category: '1xx', description: '服务器已收到请求头，客户端应继续发送请求体。', usage: 'HTTP/1.1 中用于分块上传。', common: true },
  { code: 101, name: 'Switching Protocols', category: '1xx', description: '服务器同意切换协议，常用于 WebSocket 握手。', usage: 'Upgrade: websocket 响应。', common: true },
  { code: 102, name: 'Processing', category: '1xx', description: '服务器已收到请求并正在处理，但尚无响应可用。', usage: 'WebDAV 中避免客户端超时。' },
  { code: 103, name: 'Early Hints', category: '1xx', description: '用于在最终响应前返回 Link 头，提示客户端预加载资源。', usage: '现代浏览器支持的 103 链接预加载。' },

  // 2xx Success
  { code: 200, name: 'OK', category: '2xx', description: '请求成功，响应包含请求的资源。', usage: '标准成功响应。', common: true },
  { code: 201, name: 'Created', category: '2xx', description: '请求已成功并创建了新资源。', usage: 'POST/PUT 创建资源时返回。', common: true },
  { code: 202, name: 'Accepted', category: '2xx', description: '请求已接受但尚未处理完成。', usage: '异步任务、批处理接口。', common: true },
  { code: 203, name: 'Non-Authoritative Information', category: '2xx', description: '响应来自第三方副本，可能与原始数据不同。', usage: '代理或 CDN 场景。' },
  { code: 204, name: 'No Content', category: '2xx', description: '请求成功但无返回内容。', usage: 'DELETE 或部分 PUT 响应。', common: true },
  { code: 205, name: 'Reset Content', category: '2xx', description: '要求客户端重置当前视图。', usage: '表单提交后清除输入。' },
  { code: 206, name: 'Partial Content', category: '2xx', description: '返回部分内容，配合 Range 头使用。', usage: '视频分段下载、断点续传。', common: true },
  { code: 207, name: 'Multi-Status', category: '2xx', description: '返回多条状态信息。', usage: 'WebDAV 多资源操作。' },
  { code: 208, name: 'Already Reported', category: '2xx', description: '成员先前已报告过，避免重复。', usage: 'WebDAV 绑定。' },
  { code: 226, name: 'IM Used', category: '2xx', description: '服务器已完成资源请求，响应是对当前实例的一个或多个实例操作的结果。', usage: 'HTTP 增量编码。' },

  // 3xx Redirection
  { code: 300, name: 'Multiple Choices', category: '3xx', description: '请求的资源有多个可选表示。', usage: '内容协商。' },
  { code: 301, name: 'Moved Permanently', category: '3xx', description: '资源已永久移动，新位置在 Location 头中。', usage: 'SEO 友好的 URL 变更。', common: true },
  { code: 302, name: 'Found', category: '3xx', description: '资源临时移动到其他位置。', usage: '临时重定向。', common: true },
  { code: 303, name: 'See Other', category: '3xx', description: '响应应在另一个 URI 上获取。', usage: 'POST 后重定向到 GET。', common: true },
  { code: 304, name: 'Not Modified', category: '3xx', description: '资源未修改，可使用缓存。', usage: 'If-Modified-Since 协商缓存。', common: true },
  { code: 305, name: 'Use Proxy', category: '3xx', description: '必须通过代理访问（已弃用）。', usage: '历史状态码。' },
  { code: 307, name: 'Temporary Redirect', category: '3xx', description: '临时重定向，保持原始方法不变。', usage: '保持 POST/GET 不变。', common: true },
  { code: 308, name: 'Permanent Redirect', category: '3xx', description: '永久重定向，保持原始方法不变。', usage: 'API 版本迁移。', common: true },

  // 4xx Client Error
  { code: 400, name: 'Bad Request', category: '4xx', description: '请求语法错误，服务器无法理解。', usage: '参数校验失败。', common: true },
  { code: 401, name: 'Unauthorized', category: '4xx', description: '请求需要用户认证。', usage: '未登录或 token 失效。', common: true },
  { code: 402, name: 'Payment Required', category: '4xx', description: '预留状态码，未来用于数字支付。', usage: '极少使用。' },
  { code: 403, name: 'Forbidden', category: '4xx', description: '服务器理解请求但拒绝执行。', usage: '权限不足。', common: true },
  { code: 404, name: 'Not Found', category: '4xx', description: '服务器无法找到请求的资源。', usage: '路径或资源不存在。', common: true },
  { code: 405, name: 'Method Not Allowed', category: '4xx', description: '请求方法不被允许。', usage: '方法不匹配。', common: true },
  { code: 406, name: 'Not Acceptable', category: '4xx', description: '无法根据 Accept 头提供内容。', usage: '内容协商失败。' },
  { code: 407, name: 'Proxy Authentication Required', category: '4xx', description: '需要通过代理认证。', usage: '代理环境。' },
  { code: 408, name: 'Request Timeout', category: '4xx', description: '请求超时。', usage: '客户端连接过慢。', common: true },
  { code: 409, name: 'Conflict', category: '4xx', description: '请求与资源当前状态冲突。', usage: '并发更新冲突。', common: true },
  { code: 410, name: 'Gone', category: '4xx', description: '资源已永久删除，无新地址。', usage: '已下架的内容。' },
  { code: 411, name: 'Length Required', category: '4xx', description: '需要 Content-Length 头。', usage: '部分老式服务器。' },
  { code: 412, name: 'Precondition Failed', category: '4xx', description: '前提条件评估为假。', usage: 'If-Match 失败。' },
  { code: 413, name: 'Payload Too Large', category: '4xx', description: '请求体过大。', usage: '上传文件超限。', common: true },
  { code: 414, name: 'URI Too Long', category: '4xx', description: 'URL 过长。', usage: 'GET 参数过多。' },
  { code: 415, name: 'Unsupported Media Type', category: '4xx', description: '不支持的媒体类型。', usage: 'Content-Type 错误。', common: true },
  { code: 416, name: 'Range Not Satisfiable', category: '4xx', description: '请求范围无法满足。', usage: 'Range 越界。' },
  { code: 417, name: 'Expectation Failed', category: '4xx', description: 'Expect 头无法满足。', usage: 'Expect: 100-continue 失败。' },
  { code: 418, name: "I'm a teapot", category: '4xx', description: '彩蛋状态码，源自愚人节玩笑。', usage: '趣味用途。' },
  { code: 421, name: 'Misdirected Request', category: '4xx', description: '请求被发送到了无法响应的服务器。', usage: 'TLS/SNI 场景。' },
  { code: 422, name: 'Unprocessable Entity', category: '4xx', description: '请求格式正确但语义错误。', usage: '字段校验失败。', common: true },
  { code: 423, name: 'Locked', category: '4xx', description: '资源被锁定。', usage: 'WebDAV。' },
  { code: 424, name: 'Failed Dependency', category: '4xx', description: '因依赖操作失败而失败。', usage: 'WebDAV 事务。' },
  { code: 425, name: 'Too Early', category: '4xx', description: '服务器不愿处理可能被重放的请求。', usage: '防重放。' },
  { code: 426, name: 'Upgrade Required', category: '4xx', description: '需要升级协议。', usage: '强制 HTTPS。' },
  { code: 428, name: 'Precondition Required', category: '4xx', description: '要求请求是条件性的。', usage: '避免丢失更新。' },
  { code: 429, name: 'Too Many Requests', category: '4xx', description: '请求过多，已被限流。', usage: '速率限制。', common: true },
  { code: 431, name: 'Request Header Fields Too Large', category: '4xx', description: '请求头过大。', usage: 'Cookie 过多。' },
  { code: 451, name: 'Unavailable For Legal Reasons', category: '4xx', description: '因法律原因不可用。', usage: 'DMCA 屏蔽。' },

  // 5xx Server Error
  { code: 500, name: 'Internal Server Error', category: '5xx', description: '服务器内部错误。', usage: '未捕获异常。', common: true },
  { code: 501, name: 'Not Implemented', category: '5xx', description: '服务器不支持请求的功能。', usage: 'API 路径不存在但方法不支持。' },
  { code: 502, name: 'Bad Gateway', category: '5xx', description: '网关或代理从上游接收到无效响应。', usage: 'Nginx 上游错误。', common: true },
  { code: 503, name: 'Service Unavailable', category: '5xx', description: '服务器暂时无法处理请求。', usage: '维护或过载。', common: true },
  { code: 504, name: 'Gateway Timeout', category: '5xx', description: '网关或代理未及时从上游收到响应。', usage: '上游服务超时。', common: true },
  { code: 505, name: 'HTTP Version Not Supported', category: '5xx', description: '服务器不支持请求的 HTTP 协议版本。', usage: '协议不匹配。' },
  { code: 506, name: 'Variant Also Negotiates', category: '5xx', description: '服务器内部配置错误。', usage: '内容协商冲突。' },
  { code: 507, name: 'Insufficient Storage', category: '5xx', description: '服务器存储空间不足。', usage: 'WebDAV。' },
  { code: 508, name: 'Loop Detected', category: '5xx', description: '服务器检测到无限循环。', usage: 'WebDAV 绑定。' },
  { code: 510, name: 'Not Extended', category: '5xx', description: '服务器需要更多信息才能完成请求。', usage: '已弃用。' },
  { code: 511, name: 'Network Authentication Required', category: '5xx', description: '需要网络认证（如 Captive Portal）。', usage: '公共 WiFi 登录。' },
]

const CATEGORY_INFO: Record<StatusCode['category'], { label: string; color: string; description: string }> = {
  '1xx': { label: '信息响应', color: '#0ea5e9', description: '服务器收到请求，正在继续处理' },
  '2xx': { label: '成功', color: '#10b981', description: '请求已成功被服务器接收、理解并接受' },
  '3xx': { label: '重定向', color: '#f59e0b', description: '需要客户端进一步操作才能完成请求' },
  '4xx': { label: '客户端错误', color: '#ef4444', description: '客户端请求包含语法错误或无法完成请求' },
  '5xx': { label: '服务器错误', color: '#a855f7', description: '服务器在处理请求过程中发生错误' },
}

const HttpStatusExplorer = () => {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<StatusCode['category'] | 'all' | 'common'>('all')
  const [selectedCode, setSelectedCode] = useState<StatusCode | null>(STATUS_CODES.find(c => c.code === 200) || null)

  const filteredCodes = useMemo(() => {
    let result = STATUS_CODES
    if (activeCategory === 'common') {
      result = result.filter(c => c.common)
    } else if (activeCategory !== 'all') {
      result = result.filter(c => c.category === activeCategory)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(c =>
        String(c.code).includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.usage.toLowerCase().includes(q)
      )
    }
    return result
  }, [query, activeCategory])

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '320px 1fr',
      height: '100%',
      background: 'var(--window-bg, #1a1a2e)',
      color: 'var(--text-primary, #e0e0e8)',
    }}>
      {/* 左侧栏：搜索和分类 */}
      <div style={{
        borderRight: '1px solid var(--window-border, rgba(255,255,255,0.08))',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--window-border, rgba(255,255,255,0.08))' }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>HTTP 状态码</h2>
          <input
            type="text"
            placeholder="搜索状态码、名称或描述..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid var(--window-border, rgba(255,255,255,0.1))',
              background: 'var(--input-bg, rgba(255,255,255,0.04))',
              color: 'inherit',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
            <CategoryButton active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} label="全部" color="#888" />
            <CategoryButton active={activeCategory === 'common'} onClick={() => setActiveCategory('common')} label="常用" color="#0ea5e9" />
            <CategoryButton active={activeCategory === '1xx'} onClick={() => setActiveCategory('1xx')} label="1xx" color={CATEGORY_INFO['1xx'].color} />
            <CategoryButton active={activeCategory === '2xx'} onClick={() => setActiveCategory('2xx')} label="2xx" color={CATEGORY_INFO['2xx'].color} />
            <CategoryButton active={activeCategory === '3xx'} onClick={() => setActiveCategory('3xx')} label="3xx" color={CATEGORY_INFO['3xx'].color} />
            <CategoryButton active={activeCategory === '4xx'} onClick={() => setActiveCategory('4xx')} label="4xx" color={CATEGORY_INFO['4xx'].color} />
            <CategoryButton active={activeCategory === '5xx'} onClick={() => setActiveCategory('5xx')} label="5xx" color={CATEGORY_INFO['5xx'].color} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredCodes.length === 0 && (
            <div style={{ padding: 20, fontSize: 13, color: 'var(--text-secondary, #888)', textAlign: 'center' }}>
              没有匹配的状态码
            </div>
          )}
          {filteredCodes.map((sc) => {
            const isSelected = selectedCode?.code === sc.code
            return (
              <button
                key={sc.code}
                onClick={() => setSelectedCode(sc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: isSelected ? 'var(--accent-bg, rgba(139, 92, 246, 0.15))' : 'transparent',
                  borderLeft: isSelected ? '3px solid var(--accent, #8b5cf6)' : '3px solid transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 13,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span style={{
                  display: 'inline-block',
                  minWidth: 36,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: CATEGORY_INFO[sc.category].color,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                  textAlign: 'center',
                  fontFamily: 'monospace',
                }}>
                  {sc.code}
                </span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sc.name}
                </span>
                {sc.common && <span style={{ fontSize: 10, color: 'var(--accent, #8b5cf6)' }}>★</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* 右侧详情 */}
      <div style={{ overflow: 'auto', padding: 24 }}>
        {selectedCode ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 16 }}>
              <span style={{
                fontSize: 48,
                fontWeight: 700,
                color: CATEGORY_INFO[selectedCode.category].color,
                fontFamily: 'monospace',
              }}>
                {selectedCode.code}
              </span>
              <div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{selectedCode.name}</h1>
                <div style={{ fontSize: 13, color: 'var(--text-secondary, #888)', marginTop: 4 }}>
                  {CATEGORY_INFO[selectedCode.category].label} · {CATEGORY_INFO[selectedCode.category].description}
                </div>
              </div>
            </div>
            <Section title="描述">
              <p style={{ margin: 0, lineHeight: 1.6, fontSize: 14 }}>{selectedCode.description}</p>
            </Section>
            <Section title="常见用途">
              <p style={{ margin: 0, lineHeight: 1.6, fontSize: 14 }}>{selectedCode.usage}</p>
            </Section>
            <Section title="请求示例 (curl)">
              <pre style={{
                margin: 0,
                padding: 12,
                borderRadius: 6,
                background: 'rgba(0,0,0,0.3)',
                fontSize: 12,
                fontFamily: 'monospace',
                overflow: 'auto',
              }}>
{`# 模拟返回 ${selectedCode.code} 的请求
curl -i -X GET https://api.example.com/demo \\
  -H "Accept: application/json" \\
  -o /dev/null -w "HTTP Status: %{http_code}\\n"`}
              </pre>
            </Section>
            <Section title="JavaScript 错误检查">
              <pre style={{
                margin: 0,
                padding: 12,
                borderRadius: 6,
                background: 'rgba(0,0,0,0.3)',
                fontSize: 12,
                fontFamily: 'monospace',
                overflow: 'auto',
              }}>
{`const res = await fetch('/api/endpoint')
if (res.status === ${selectedCode.code}) {
  // ${selectedCode.name}
  console.log('${selectedCode.description}')
} else if (!res.ok) {
  // 处理其他错误状态码
  throw new Error(\`HTTP \${res.status}\`)
}`}
              </pre>
            </Section>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary, #888)' }}>
            请选择左侧的状态码查看详情
          </div>
        )}
      </div>
    </div>
  )
}

const CategoryButton = ({
  active, onClick, label, color,
}: { active: boolean; onClick: () => void; label: string; color: string }) => (
  <button
    onClick={onClick}
    style={{
      padding: '4px 8px',
      border: active ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
      background: active ? `${color}22` : 'transparent',
      color: active ? color : 'var(--text-secondary, #888)',
      borderRadius: 4,
      fontSize: 11,
      cursor: 'pointer',
      fontFamily: 'monospace',
      fontWeight: active ? 600 : 400,
    }}
  >
    {label}
  </button>
)

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginTop: 24 }}>
    <h3 style={{
      margin: '0 0 8px 0',
      fontSize: 12,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: 'var(--text-secondary, #888)',
    }}>{title}</h3>
    <div>{children}</div>
  </div>
)

export default HttpStatusExplorer
