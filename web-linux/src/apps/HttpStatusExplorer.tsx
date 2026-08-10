import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Search,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Bookmark,
  Play,
  ChevronDown,
  ChevronUp,
  Copy,
  Send,
  Globe,
  Filter,
} from 'lucide-react'

interface StatusCode {
  code: number
  name: string
  category: '1xx' | '2xx' | '3xx' | '4xx' | '5xx'
  description: string
  usage: string
  example: string
  common?: boolean
}

const STATUS_CODES: StatusCode[] = [
  // 1xx Informational
  { code: 100, name: 'Continue', category: '1xx', description: '服务器已收到请求头，客户端应继续发送请求体。', usage: 'HTTP/1.1 中用于分块上传。当客户端发送 Expect: 100-continue 时，服务器返回此码表示愿意接受请求体。', example: 'POST /upload Expect: 100-continue → 100 Continue → 发送请求体' },
  { code: 101, name: 'Switching Protocols', category: '1xx', description: '服务器同意切换协议，常用于 WebSocket 握手。', usage: '客户端请求升级协议时返回，如从 HTTP 切换到 WebSocket。', example: 'Connection: upgrade → Upgrade: websocket → 101 Switching Protocols' },
  { code: 102, name: 'Processing', category: '1xx', description: '服务器已收到请求并正在处理，但尚无响应可用。', usage: 'WebDAV 中避免客户端超时，表示请求正在处理中。', example: 'PROPFIND /resource → 102 Processing (长时间操作)' },
  { code: 103, name: 'Early Hints', category: '1xx', description: '用于在最终响应前返回 Link 头，提示客户端预加载资源。', usage: '现代浏览器支持的 103 链接预加载，允许服务器在最终响应前发送预加载提示。', example: 'Link: </style.css>; rel=preload → 103 Early Hints' },
  { code: 104, name: 'Checkpoint', category: '1xx', description: '一个古老的状态码，用于 resumable HTTP 请求协议。', usage: '历史状态码，已不再使用。', example: '已弃用' },
  { code: 122, name: 'Request-URI Too Long (proxy)', category: '1xx', description: '代理服务器处理的请求URI过长。', usage: '某些代理服务器使用的非标准状态码。', example: '非标准代理响应' },
  { code: 199, name: 'Miscellaneous Persistent Connection Warning', category: '1xx', description: '持久连接的各种警告。', usage: '非标准状态码。', example: '非标准代理响应' },

  // 2xx Success
  { code: 200, name: 'OK', category: '2xx', description: '请求成功，响应包含请求的资源。', usage: '标准成功响应。GET 返回资源，POST 创建或触发动作。', example: 'GET /api/users → 200 OK [{\"id\":1,\"name\":\"Alice\"}]', common: true },
  { code: 201, name: 'Created', category: '2xx', description: '请求已成功并创建了新资源。', usage: 'POST 创建资源成功后返回，响应体包含新资源的 URI。', example: 'POST /api/users {\"name\":\"Bob\"} → 201 Created Location: /api/users/123', common: true },
  { code: 202, name: 'Accepted', category: '2xx', description: '请求已接受但尚未处理完成。', usage: '异步任务、批处理接口，实际处理稍后进行。', example: 'POST /api/tasks → 202 Accepted {\"taskId\":\"abc\",\"status\":\"pending\"}', common: true },
  { code: 203, name: 'Non-Authoritative Information', category: '2xx', description: '响应来自第三方副本，可能与原始数据不同。', usage: '代理或 CDN 场景，表示响应经过中间节点修改。', example: 'GET /cached-page → 203 Non-Authoritative Information (via CDN)' },
  { code: 204, name: 'No Content', category: '2xx', description: '请求成功但无返回内容。', usage: 'DELETE 成功、PUT 更新成功后无内容返回。', example: 'DELETE /api/users/1 → 204 No Content', common: true },
  { code: 205, name: 'Reset Content', category: '2xx', description: '要求客户端重置当前视图。', usage: '表单提交后清除输入，不清空页面，只重置表单。', example: 'POST /form → 205 Reset Content (客户端重置表单)' },
  { code: 206, name: 'Partial Content', category: '2xx', description: '返回部分内容，配合 Range 头使用。', usage: '视频分段下载、断点续传、大文件分块请求。', example: 'Range: bytes=0-999 → 206 Partial Content (返回1000字节)', common: true },
  { code: 207, name: 'Multi-Status', category: '2xx', description: '返回多条状态信息。', usage: 'WebDAV 多资源操作，以 XML 格式返回每个资源的状态。', example: 'PROPFIND /collection → 207 Multi-Status (多资源状态报告)' },
  { code: 208, name: 'Already Reported', category: '2xx', description: '成员先前已报告过，避免重复。', usage: 'WebDAV 绑定，在多状态响应中避免重复报告同一资源。', example: 'REPORT / → 208 Already Reported (绑定成员已报告)' },
  { code: 226, name: 'IM Used', category: '2xx', description: '服务器已完成资源请求，响应是对当前实例的一个或多个实例操作的结果。', usage: 'HTTP 增量编码，响应包含对资源的修改描述。', example: 'PATCH /resource → 226 IM Used (增量修改完成)' },
  { code: 250, name: 'Low On Storage Space', category: '2xx', description: '服务器存储空间不足。', usage: '非标准状态码，服务器空间低时的警告。', example: '非标准存储警告' },
  { code: 299, name: 'Miscellaneous Persistent Connection Warning', category: '2xx', description: '持久连接的各种警告。', usage: '非标准状态码。', example: '非标准代理响应' },

  // 3xx Redirection
  { code: 300, name: 'Multiple Choices', category: '3xx', description: '请求的资源有多个可选表示。', usage: '内容协商，客户端可选择不同格式/语言/版本。', example: 'GET /api/file → 300 Multiple Choices (JSON/XML/HTML 可选)' },
  { code: 301, name: 'Moved Permanently', category: '3xx', description: '资源已永久移动，新位置在 Location 头中。', usage: 'SEO 友好的 URL 变更，搜索引擎会更新索引。', example: 'GET /old-url → 301 Moved Permanently Location: /new-url', common: true },
  { code: 302, name: 'Found', category: '3xx', description: '资源临时移动到其他位置。', usage: '临时重定向，浏览器会跟随跳转，POST 可能变为 GET。', example: 'GET /temp → 302 Found Location: /temporary', common: true },
  { code: 303, name: 'See Other', category: '3xx', description: '响应应在另一个 URI 上获取。', usage: 'POST 后重定向到 GET（如表单提交后跳转到感谢页）。', example: 'POST /submit → 303 See Other Location: /thanks', common: true },
  { code: 304, name: 'Not Modified', category: '3xx', description: '资源未修改，可使用缓存。', usage: 'If-Modified-Since / If-None-Match 协商缓存。', example: 'GET /style.css If-None-Match: \"abc\" → 304 Not Modified', common: true },
  { code: 305, name: 'Use Proxy', category: '3xx', description: '必须通过代理访问（已弃用）。', usage: '历史状态码，因安全原因已弃用。', example: '已弃用' },
  { code: 306, name: 'Switch Proxy', category: '3xx', description: '后续请求应使用指定代理。', usage: '已弃用，不再使用。', example: '已弃用' },
  { code: 307, name: 'Temporary Redirect', category: '3xx', description: '临时重定向，保持原始方法和请求体不变。', usage: 'POST 重定向到另一个 POST URL，保持方法不变。', example: 'POST /api/v1 → 307 Temporary Redirect Location: /api/v2', common: true },
  { code: 308, name: 'Permanent Redirect', category: '3xx', description: '永久重定向，保持原始方法和请求体不变。', usage: 'API 版本迁移，POST 永久重定向到新 URL。', example: 'POST /api/v1 → 308 Permanent Redirect Location: /api/v2', common: true },

  // 4xx Client Error
  { code: 400, name: 'Bad Request', category: '4xx', description: '请求语法错误，服务器无法理解。', usage: '参数校验失败、JSON 格式错误、缺少必填字段。', example: 'POST /api/users {invalid} → 400 Bad Request', common: true },
  { code: 401, name: 'Unauthorized', category: '4xx', description: '请求需要用户认证。', usage: '未登录或 token 失效，需要重新认证。', example: 'GET /api/protected → 401 Unauthorized (缺少 Authorization 头)', common: true },
  { code: 402, name: 'Payment Required', category: '4xx', description: '预留状态码，未来用于数字支付。', usage: '极少使用，预留给数字支付场景。', example: '非标准支付场景' },
  { code: 403, name: 'Forbidden', category: '4xx', description: '服务器理解请求但拒绝执行。', usage: '权限不足、IP 被禁止、需要特定角色。', example: 'DELETE /api/users/1 → 403 Forbidden (无管理员权限)', common: true },
  { code: 404, name: 'Not Found', category: '4xx', description: '服务器无法找到请求的资源。', usage: '路径或资源不存在，API 路由错误。', example: 'GET /api/not-exist → 404 Not Found', common: true },
  { code: 405, name: 'Method Not Allowed', category: '4xx', description: '请求方法不被允许。', usage: 'API 端点不支持该 HTTP 方法，需用允许的方法。', example: 'DELETE /api/users → 405 Method Not Allowed (只允许 GET/POST)', common: true },
  { code: 406, name: 'Not Acceptable', category: '4xx', description: '无法根据 Accept 头提供内容。', usage: '客户端请求的 Accept 类型服务器无法提供。', example: 'Accept: text/xml → 406 Not Acceptable (只支持 JSON)' },
  { code: 407, name: 'Proxy Authentication Required', category: '4xx', description: '需要通过代理认证。', usage: '企业代理环境中，需要代理认证凭据。', example: 'GET /external → 407 Proxy Authentication Required' },
  { code: 408, name: 'Request Timeout', category: '4xx', description: '请求超时。', usage: '客户端连接过慢，服务器在超时时限内未收到完整请求。', example: '上传大文件超时 → 408 Request Timeout', common: true },
  { code: 409, name: 'Conflict', category: '4xx', description: '请求与资源当前状态冲突。', usage: '并发更新冲突、重复创建、状态不匹配。', example: 'POST /api/users {id:1} → 409 Conflict (ID已存在)', common: true },
  { code: 410, name: 'Gone', category: '4xx', description: '资源已永久删除，无新地址。', usage: '已下架的内容，比 404 更明确地表示永久删除。', example: 'GET /api/old-feature → 410 Gone (已废弃)' },
  { code: 411, name: 'Length Required', category: '4xx', description: '需要 Content-Length 头。', usage: '部分老式服务器要求请求必须包含 Content-Length。', example: 'POST /api/data (无Content-Length) → 411 Length Required' },
  { code: 412, name: 'Precondition Failed', category: '4xx', description: '前提条件评估为假。', usage: 'If-Match / If-None-Match / If-Modified-Since 前置条件不满足。', example: 'PUT /api/1 If-Match: \"old\" → 412 Precondition Failed (版本冲突)' },
  { code: 413, name: 'Payload Too Large', category: '4xx', description: '请求体过大。', usage: '上传文件超过服务器限制，请求体超过允许大小。', example: 'POST /upload (50MB文件) → 413 Payload Too Large (限制10MB)', common: true },
  { code: 414, name: 'URI Too Long', category: '4xx', description: 'URL 过长。', usage: 'GET 参数过多或过长，超出服务器 URL 长度限制。', example: 'GET /api/search?q=very...long...query → 414 URI Too Long' },
  { code: 415, name: 'Unsupported Media Type', category: '4xx', description: '不支持的媒体类型。', usage: 'Content-Type 不在服务器支持列表中。', example: 'POST /api/json (Content-Type: text/plain) → 415 Unsupported Media Type', common: true },
  { code: 416, name: 'Range Not Satisfiable', category: '4xx', description: '请求范围无法满足。', usage: 'Range 头请求的范围超出资源大小。', example: 'Range: bytes=1000-2000 (文件只有500字节) → 416 Range Not Satisfiable' },
  { code: 417, name: 'Expectation Failed', category: '4xx', description: 'Expect 头无法满足。', usage: 'Expect: 100-continue 请求被服务器拒绝。', example: 'Expect: 100-continue → 417 Expectation Failed' },
  { code: 418, name: "I'm a teapot", category: '4xx', description: '彩蛋状态码，源自1998年愚人节的 RFC 2324 玩笑。', usage: '趣味用途，表示服务器是茶壶，不能煮咖啡。', example: 'HTCPCP 请求 → 418 I\'m a teapot', common: true },
  { code: 421, name: 'Misdirected Request', category: '4xx', description: '请求被发送到了无法响应的服务器。', usage: 'TLS/SNI 场景，服务器无法为该域名提供证书。', example: 'TLS SNI 不匹配 → 421 Misdirected Request' },
  { code: 422, name: 'Unprocessable Entity', category: '4xx', description: '请求格式正确但语义错误。', usage: '字段校验失败、业务规则不满足。', example: 'POST /api/users {email:\"invalid\"} → 422 Unprocessable Entity', common: true },
  { code: 423, name: 'Locked', category: '4xx', description: '资源被锁定。', usage: 'WebDAV 资源被锁定，无法修改。', example: 'PROPPATCH /locked-resource → 423 Locked' },
  { code: 424, name: 'Failed Dependency', category: '4xx', description: '因依赖操作失败而失败。', usage: 'WebDAV 事务中，依赖的操作失败。', example: 'MKCOL /a/b (父目录不存在) → 424 Failed Dependency' },
  { code: 425, name: 'Too Early', category: '4xx', description: '服务器不愿处理可能被重放的请求。', usage: '防重放攻击，请求可能被重放。', example: '重放请求 → 425 Too Early' },
  { code: 426, name: 'Upgrade Required', category: '4xx', description: '需要升级协议。', usage: '强制 HTTPS 或协议升级。', example: 'HTTP 请求 → 426 Upgrade Required (要求 HTTPS)' },
  { code: 428, name: 'Precondition Required', category: '4xx', description: '要求请求是条件性的。', usage: '服务器要求请求必须包含前置条件头。', example: 'PUT /api/1 (无If-Match) → 428 Precondition Required' },
  { code: 429, name: 'Too Many Requests', category: '4xx', description: '请求过多，已被限流。', usage: '速率限制触发，API 调用频率超过限制。', example: 'GET /api/data (100次/分钟) → 429 Too Many Requests', common: true },
  { code: 431, name: 'Request Header Fields Too Large', category: '4xx', description: '请求头过大。', usage: 'Cookie 过多或自定义头过大。', example: 'GET /api (超大Cookie) → 431 Request Header Fields Too Large' },
  { code: 451, name: 'Unavailable For Legal Reasons', category: '4xx', description: '因法律原因不可用。', usage: 'DMCA 屏蔽、政府审查、地区限制。', example: 'GET /blocked-content → 451 Unavailable For Legal Reasons' },

  // 5xx Server Error
  { code: 500, name: 'Internal Server Error', category: '5xx', description: '服务器内部错误。', usage: '未捕获异常、代码错误、服务端逻辑错误。', example: 'GET /api/crash → 500 Internal Server Error (NullPointerException)', common: true },
  { code: 501, name: 'Not Implemented', category: '5xx', description: '服务器不支持请求的功能。', usage: 'API 路径不存在或方法未实现。', example: 'FOOBAR /api → 501 Not Implemented (方法不支持)' },
  { code: 502, name: 'Bad Gateway', category: '5xx', description: '网关或代理从上游接收到无效响应。', usage: 'Nginx/反向代理收到上游的无效响应。', example: 'Nginx → upstream 返回无效响应 → 502 Bad Gateway', common: true },
  { code: 503, name: 'Service Unavailable', category: '5xx', description: '服务器暂时无法处理请求。', usage: '系统维护、过载、临时不可用。', example: 'GET /api → 503 Service Unavailable (维护中)', common: true },
  { code: 504, name: 'Gateway Timeout', category: '5xx', description: '网关或代理未及时从上游收到响应。', usage: '上游服务响应超时，Nginx 代理超时。', example: 'Nginx → 上游超时 → 504 Gateway Timeout', common: true },
  { code: 505, name: 'HTTP Version Not Supported', category: '5xx', description: '服务器不支持请求的 HTTP 协议版本。', usage: '客户端使用了服务器不支持的 HTTP 版本。', example: 'HTTP/2 请求到只支持 HTTP/1.1 的服务器 → 505' },
  { code: 506, name: 'Variant Also Negotiates', category: '5xx', description: '服务器内部配置错误。', usage: '内容协商配置错误导致循环。', example: '协商配置错误 → 506 Variant Also Negotiates' },
  { code: 507, name: 'Insufficient Storage', category: '5xx', description: '服务器存储空间不足。', usage: 'WebDAV 写入时磁盘空间不足。', example: 'PUT /webdav/file (磁盘满) → 507 Insufficient Storage' },
  { code: 508, name: 'Loop Detected', category: '5xx', description: '服务器检测到无限循环。', usage: 'WebDAV 绑定操作中检测到循环。', example: 'BIND /a → /a/b → ... → 508 Loop Detected' },
  { code: 510, name: 'Not Extended', category: '5xx', description: '服务器需要更多信息才能完成请求。', usage: '已弃用，不再使用。', example: '已弃用' },
  { code: 511, name: 'Network Authentication Required', category: '5xx', description: '需要网络认证（如 Captive Portal）。', usage: '公共 WiFi 登录页面、网络认证。', example: '公共WiFi → 511 Network Authentication Required (需要登录)' },
  { code: 599, name: 'Network Connect Timeout Error', category: '5xx', description: '网络连接超时。', usage: '非标准状态码，某些代理/客户端使用。', example: '非标准网络错误' },
]

const CATEGORY_INFO: Record<string, { label: string; color: string; gradient: string; description: string }> = {
  '1xx': { label: '信息响应', color: '#0ea5e9', gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4)', description: '服务器收到请求，正在继续处理' },
  '2xx': { label: '成功', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)', description: '请求已成功被服务器接收、理解并接受' },
  '3xx': { label: '重定向', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', description: '需要客户端进一步操作才能完成请求' },
  '4xx': { label: '客户端错误', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', description: '客户端请求包含语法错误或无法完成请求' },
  '5xx': { label: '服务端错误', color: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7, #9333ea)', description: '服务器在处理请求过程中发生错误' },
}

const CATEGORIES = [
  { key: 'all', label: '全部', color: '#64748b' },
  { key: 'common', label: '常用', color: '#8b5cf6' },
  { key: '1xx', label: '1xx 信息', color: '#0ea5e9' },
  { key: '2xx', label: '2xx 成功', color: '#10b981' },
  { key: '3xx', label: '3xx 重定向', color: '#f59e0b' },
  { key: '4xx', label: '4xx 客户端', color: '#ef4444' },
  { key: '5xx', label: '5xx 服务端', color: '#a855f7' },
] as const

type CategoryKey = typeof CATEGORIES[number]['key']

interface TestResponse {
  status: number | null
  statusText: string
  headers: Record<string, string>
  body: string
  time: number | null
  error: string | null
}

const FAVORITES_KEY = 'http-status-favorites'

function StatusCodeCard({
  code,
  selected,
  onClick,
  isFavorite,
  onToggleFavorite,
}: {
  code: StatusCode
  selected: boolean
  onClick: () => void
  isFavorite: boolean
  onToggleFavorite: () => void
}) {
  const cat = CATEGORY_INFO[code.category]

  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 16px',
        borderRadius: 12,
        cursor: 'pointer',
        background: selected
          ? 'rgba(139, 92, 246, 0.15)'
          : 'rgba(255, 255, 255, 0.04)',
        border: selected
          ? '1px solid rgba(139, 92, 246, 0.5)'
          : '1px solid rgba(255, 255, 255, 0.06)',
        borderLeft: selected ? `3px solid ${cat.color}` : '3px solid transparent',
        transition: 'all 0.2s ease',
        marginBottom: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)'
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 44,
          height: 28,
          padding: '0 10px',
          borderRadius: 8,
          background: cat.gradient,
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          boxShadow: `0 2px 8px ${cat.color}40`,
        }}
      >
        {code.code}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {code.name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'rgba(255, 255, 255, 0.45)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {code.description}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite()
        }}
        style={{
          padding: 4,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: isFavorite ? '#fbbf24' : 'rgba(255, 255, 255, 0.3)',
          transition: 'color 0.2s',
          display: 'flex',
          alignItems: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = isFavorite ? '#f59e0b' : 'rgba(255, 255, 255, 0.7)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = isFavorite ? '#fbbf24' : 'rgba(255, 255, 255, 0.3)'
        }}
        title={isFavorite ? '取消收藏' : '收藏'}
      >
        <Bookmark size={16} fill={isFavorite ? '#fbbf24' : 'none'} />
      </button>
    </div>
  )
}

function StatusDetailPanel({
  code,
  isFavorite,
  onToggleFavorite,
  onTest,
}: {
  code: StatusCode
  isFavorite: boolean
  onToggleFavorite: () => void
  onTest: (code: StatusCode) => void
}) {
  const cat = CATEGORY_INFO[code.category]
  const [expanded, setExpanded] = useState<'desc' | 'usage' | 'example'>('desc')

  return (
    <div>
      <div
        style={{
          padding: 24,
          borderRadius: 20,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${cat.color}30`,
          boxShadow: `0 8px 32px ${cat.color}15`,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 16 }}>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              background: cat.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              lineHeight: 1,
            }}
          >
            {code.code}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>{code.name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.55)' }}>
              {cat.label} · {cat.description}
            </div>
            {code.common && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 8,
                  padding: '3px 10px',
                  borderRadius: 12,
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: '#c4b5fd',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                ★ 常用状态码
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onToggleFavorite}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                background: isFavorite ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: `1px solid ${isFavorite ? 'rgba(251, 191, 36, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                color: isFavorite ? '#fbbf24' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              <Bookmark size={14} fill={isFavorite ? '#fbbf24' : 'none'} />
              {isFavorite ? '已收藏' : '收藏'}
            </button>
            <button
              onClick={() => onTest(code)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                background: `${cat.color}25`,
                border: `1px solid ${cat.color}50`,
                color: cat.color,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              <Play size={14} />
              测试
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['desc', 'usage', 'example'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setExpanded(tab)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                background: expanded === tab ? `${cat.color}30` : 'rgba(255, 255, 255, 0.05)',
                color: expanded === tab ? cat.color : 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: expanded === tab ? 600 : 400,
                transition: 'all 0.2s',
              }}
            >
              {tab === 'desc' ? '描述' : tab === 'usage' ? '使用场景' : '示例'}
            </button>
          ))}
        </div>

        {expanded === 'desc' && (
          <p style={{ margin: 0, lineHeight: 1.7, fontSize: 14, color: 'rgba(255, 255, 255, 0.85)' }}>
            {code.description}
          </p>
        )}
        {expanded === 'usage' && (
          <p style={{ margin: 0, lineHeight: 1.7, fontSize: 14, color: 'rgba(255, 255, 255, 0.85)' }}>
            {code.usage}
          </p>
        )}
        {expanded === 'example' && (
          <pre
            style={{
              margin: 0,
              padding: 16,
              borderRadius: 12,
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: 13,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              color: '#a6e3a1',
              overflow: 'auto',
              lineHeight: 1.6,
            }}
          >
            {code.example}
          </pre>
        )}
      </div>

      <div
        style={{
          padding: 24,
          borderRadius: 20,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Info size={14} color={cat.color} />
          快速参考
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div
            style={{
              padding: 14,
              borderRadius: 12,
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
            }}
          >
            <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.4)', marginBottom: 6 }}>cURL 命令</div>
            <pre
              style={{
                margin: 0,
                fontSize: 11,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                color: '#7dd3fc',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
{`curl -i -w "HTTP: %{http_code}\\n" https://httpbin.org/status/${code.code}`}
            </pre>
          </div>
          <div
            style={{
              padding: 14,
              borderRadius: 12,
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
            }}
          >
            <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.4)', marginBottom: 6 }}>JavaScript 检查</div>
            <pre
              style={{
                margin: 0,
                fontSize: 11,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                color: '#c4b5fd',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
{`if (res.status === ${code.code}) {
  // ${code.name}
  console.log('${code.description}')
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

function HTTPTestPanel({
  onClose,
  initialCode,
}: {
  onClose: () => void
  initialCode?: StatusCode
}) {
  const [url, setUrl] = useState(initialCode ? `https://httpbin.org/status/${initialCode.code}` : 'https://httpbin.org/status/200')
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'>('GET')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<TestResponse | null>(null)
  const [showHeaders, setShowHeaders] = useState(false)
  const [showBody, setShowBody] = useState(true)

  const handleTest = useCallback(async () => {
    if (!url.trim()) return
    setLoading(true)
    setResponse(null)

    const startTime = performance.now()

    try {
      const headers: Record<string, string> = {
        'User-Agent': 'HTTPStatusExplorer/2.0',
        Accept: '*/*',
      }

      const response = await fetch(url, {
        method,
        headers,
        redirect: 'follow',
      })

      const endTime = performance.now()
      const time = Math.round(endTime - startTime)

      const respHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        respHeaders[key] = value
      })

      let body = ''
      try {
        body = await response.text()
      } catch {
        body = '(无法读取响应体)'
      }

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: respHeaders,
        body,
        time,
        error: null,
      })
    } catch (err) {
      const endTime = performance.now()
      setResponse({
        status: null,
        statusText: '',
        headers: {},
        body: '',
        time: Math.round(endTime - startTime),
        error: err instanceof Error ? err.message : '请求失败',
      })
    } finally {
      setLoading(false)
    }
  }, [url, method])

  const copyResponse = useCallback(() => {
    if (response) {
      const text = JSON.stringify(response, null, 2)
      navigator.clipboard.writeText(text)
    }
  }, [response])

  const statusColor = (status: number | null) => {
    if (status === null) return '#64748b'
    if (status >= 200 && status < 300) return '#10b981'
    if (status >= 300 && status < 400) return '#f59e0b'
    if (status >= 400 && status < 500) return '#ef4444'
    if (status >= 500) return '#a855f7'
    return '#64748b'
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 900,
          maxHeight: '90vh',
          borderRadius: 20,
          background: 'linear-gradient(145deg, rgba(30, 30, 46, 0.95), rgba(22, 33, 62, 0.95))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: 20,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Globe size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>HTTP 实时测试</div>
              <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' }}>
                发送请求并查看响应详情
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            关闭
          </button>
        </div>

        <div style={{ padding: 20, overflow: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as typeof method)}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e0e0e8',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].map((m) => (
                <option key={m} value={m} style={{ background: '#1e1e2e' }}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e0e0e8',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}
            />
            <button
              onClick={handleTest}
              disabled={loading || !url.trim()}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                background: loading ? 'rgba(139, 92, 246, 0.3)' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                border: 'none',
                color: '#fff',
                cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
                minWidth: 100,
              }}
            >
              {loading ? (
                <>
                  <Clock size={14} /> 请求中...
                </>
              ) : (
                <>
                  <Send size={14} /> 发送
                </>
              )}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { label: '200 OK', url: 'https://httpbin.org/status/200' },
              { label: '301 跳转', url: 'https://httpbin.org/status/301' },
              { label: '404 未找到', url: 'https://httpbin.org/status/404' },
              { label: '500 错误', url: 'https://httpbin.org/status/500' },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => setUrl(preset.url)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  fontSize: 12,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {response && (
            <div
              style={{
                borderRadius: 14,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: 14,
                  background: 'rgba(0, 0, 0, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {response.error ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <XCircle size={18} color="#ef4444" />
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#ef4444' }}>
                        请求失败
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {response.status && response.status >= 200 && response.status < 400 ? (
                        <CheckCircle size={18} color={statusColor(response.status)} />
                      ) : (
                        <AlertCircle size={18} color={statusColor(response.status)} />
                      )}
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: statusColor(response.status),
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        }}
                      >
                        {response.status} {response.statusText}
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: 13,
                    }}
                  >
                    <Clock size={14} />
                    {response.time}ms
                  </div>
                </div>
                <button
                  onClick={copyResponse}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Copy size={12} /> 复制
                </button>
              </div>

              {response.error && (
                <div
                  style={{
                    padding: 16,
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    fontSize: 13,
                    borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
                  }}
                >
                  {response.error}
                </div>
              )}

              {!response.error && (
                <>
                  <div
                    style={{
                      display: 'flex',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <button
                      onClick={() => {
                        setShowHeaders(!showHeaders)
                        setShowBody(false)
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: showHeaders ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                        border: 'none',
                        color: showHeaders ? '#c4b5fd' : 'rgba(255, 255, 255, 0.5)',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: showHeaders ? 600 : 400,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      响应头 ({Object.keys(response.headers).length})
                      {showHeaders ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    <button
                      onClick={() => {
                        setShowBody(!showBody)
                        setShowHeaders(false)
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: showBody ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                        border: 'none',
                        color: showBody ? '#c4b5fd' : 'rgba(255, 255, 255, 0.5)',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: showBody ? 600 : 400,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      响应体
                      {showBody ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>

                  {showHeaders && (
                    <div
                      style={{
                        padding: 16,
                        maxHeight: 300,
                        overflow: 'auto',
                      }}
                    >
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {Object.entries(response.headers).map(([key, value]) => (
                            <tr key={key}>
                              <td
                                style={{
                                  padding: '6px 12px 6px 0',
                                  fontSize: 12,
                                  color: '#c4b5fd',
                                  fontWeight: 500,
                                  verticalAlign: 'top',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {key}
                              </td>
                              <td
                                style={{
                                  padding: '6px 0',
                                  fontSize: 12,
                                  color: 'rgba(255, 255, 255, 0.75)',
                                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                  wordBreak: 'break-all',
                                }}
                              >
                                {value}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {showBody && (
                    <div style={{ padding: 16, maxHeight: 300, overflow: 'auto' }}>
                      <pre
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: '#a6e3a1',
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                          lineHeight: 1.6,
                        }}
                      >
                        {response.body || '(空响应体)'}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {!response && !loading && (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: 13,
              }}
            >
              输入 URL 并点击发送，即可查看 HTTP 响应详情
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function HTTPStatusExplorer() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all')
  const [selectedCode, setSelectedCode] = useState<StatusCode | null>(
    STATUS_CODES.find((c) => c.code === 200) || null
  )
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [testOpen, setTestOpen] = useState(false)
  const [testInitialCode, setTestInitialCode] = useState<StatusCode | undefined>(undefined)

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
    } catch {}
  }, [favorites])

  const toggleFavorite = useCallback((code: number) => {
    setFavorites((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }, [])

  const filteredCodes = useMemo(() => {
    let result = STATUS_CODES
    if (showFavoritesOnly) {
      result = result.filter((c) => favorites.includes(c.code))
    } else if (activeCategory === 'common') {
      result = result.filter((c) => c.common)
    } else if (activeCategory !== 'all') {
      result = result.filter((c) => c.category === activeCategory)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(
        (c) =>
          String(c.code).includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.usage.toLowerCase().includes(q)
      )
    }
    return result
  }, [query, activeCategory, showFavoritesOnly, favorites])

  const handleTest = useCallback((code: StatusCode) => {
    setTestInitialCode(code)
    setTestOpen(true)
  }, [])

  return (
    <div
      style={{
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f1a 100%)',
        color: '#e0e0e8',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '340px 1fr',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'rgba(0, 0, 0, 0.15)',
          }}
        >
          <div
            style={{
              padding: 20,
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                }}
              >
                <Globe size={18} color="#fff" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>HTTP 状态码</h2>
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.4)' }}>
                  {STATUS_CODES.length} 个状态码参考
                </div>
              </div>
            </div>

            <div
              style={{
                position: 'relative',
                marginBottom: 12,
              }}
            >
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.4)',
                }}
              />
              <input
                type="text"
                placeholder="搜索状态码、名称或描述..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 36px',
                  borderRadius: 12,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: 'inherit',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: 6,
                marginBottom: 10,
                flexWrap: 'wrap',
              }}
            >
              {CATEGORIES.map((cat) => {
                const isActive = !showFavoritesOnly && activeCategory === cat.key
                return (
                  <button
                    key={cat.key}
                    onClick={() => {
                      setShowFavoritesOnly(false)
                      setActiveCategory(cat.key)
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 8,
                      border: isActive
                        ? `1px solid ${cat.color}`
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isActive
                        ? `${cat.color}25`
                        : 'rgba(255, 255, 255, 0.03)',
                      color: isActive ? cat.color : 'rgba(255, 255, 255, 0.5)',
                      fontSize: 11,
                      cursor: 'pointer',
                      fontWeight: isActive ? 600 : 400,
                      transition: 'all 0.2s',
                    }}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 10,
                background: showFavoritesOnly
                  ? 'rgba(251, 191, 36, 0.15)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: showFavoritesOnly
                  ? '1px solid rgba(251, 191, 36, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                color: showFavoritesOnly ? '#fbbf24' : 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: showFavoritesOnly ? 600 : 400,
                transition: 'all 0.2s',
              }}
            >
              <Bookmark size={13} fill={showFavoritesOnly ? '#fbbf24' : 'none'} />
              {showFavoritesOnly ? `收藏夹 (${favorites.length})` : '显示收藏'}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
            {filteredCodes.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.3)',
                  fontSize: 13,
                }}
              >
                {showFavoritesOnly ? '暂无收藏' : '没有匹配的状态码'}
              </div>
            ) : (
              filteredCodes.map((sc) => (
                <StatusCodeCard
                  key={sc.code}
                  code={sc}
                  selected={selectedCode?.code === sc.code}
                  onClick={() => setSelectedCode(sc)}
                  isFavorite={favorites.includes(sc.code)}
                  onToggleFavorite={() => toggleFavorite(sc.code)}
                />
              ))
            )}
          </div>

          <div
            style={{
              padding: 12,
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.35)',
              textAlign: 'center',
            }}
          >
            共 {STATUS_CODES.length} 个状态码 · 显示 {filteredCodes.length} 个
          </div>
        </div>

        <div
          style={{
            overflow: 'auto',
            padding: 28,
            background: 'rgba(0, 0, 0, 0.1)',
          }}
        >
          {selectedCode ? (
            <StatusDetailPanel
              code={selectedCode}
              isFavorite={favorites.includes(selectedCode.code)}
              onToggleFavorite={() => toggleFavorite(selectedCode.code)}
              onTest={handleTest}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'rgba(255, 255, 255, 0.3)',
                fontSize: 14,
              }}
            >
              请选择左侧的状态码查看详情
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          padding: 12,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.4)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={12} />
            支持 1xx-5xx 全部类别
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bookmark size={12} />
            收藏功能
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ExternalLink size={12} />
            实时 HTTP 测试
          </span>
        </div>
        <button
          onClick={() => {
            const code = STATUS_CODES.find((c) => c.code === 200)
            if (code) handleTest(code)
          }}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
            transition: 'all 0.2s',
          }}
        >
          <Play size={12} />
          快速测试
        </button>
      </div>

      {testOpen && (
        <HTTPTestPanel
          onClose={() => setTestOpen(false)}
          initialCode={testInitialCode}
        />
      )}
    </div>
  )
}
