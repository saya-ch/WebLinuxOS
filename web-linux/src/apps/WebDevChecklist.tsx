import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  CheckCircle2, Circle, ChevronDown, ChevronRight, Search,
  Rocket, ShieldCheck, Zap, Eye, Smartphone, Globe, Code2,
  Database, Cloud, RefreshCw, Copy, Check, Filter, Layers,
  BarChart3, AlertTriangle, FileSearch, Server, Bookmark,
} from 'lucide-react'

/* ──────────────────────────────────────────────────────────────
   WebDevChecklist · 开发者发布检查清单
   涵盖 10 大类 100+ 检查项：性能/SEO/可访问性/安全/响应式/
        跨浏览器/SEO技术/代码质量/DevOps/内容合规
   支持：本地持久化、进度统计、搜索筛选、按类别查看、
        一键导出 Markdown/JSON、自定义检查项
   ────────────────────────────────────────────────────────────── */

interface CheckItem {
  id: string
  text: string
  desc?: string
  critical?: boolean // 关键发布阻塞项
}

interface CheckGroup {
  id: string
  name: string
  icon: React.ReactNode
  accent: string
  items: CheckItem[]
}

/* ── 10 大类检查项，完全基于业界最佳实践 ── */
const CHECK_GROUPS: CheckGroup[] = [
  {
    id: 'performance',
    name: '性能优化',
    icon: <Zap size={18} />,
    accent: '#f59e0b',
    items: [
      { id: 'perf-1', text: '首屏加载时间 < 2s (LCP < 2.5s)', critical: true, desc: 'Largest Contentful Paint 是 Core Web Vitals 核心指标' },
      { id: 'perf-2', text: '首次输入延迟 FID < 100ms', critical: true },
      { id: 'perf-3', text: '累积布局偏移 CLS < 0.1', critical: true, desc: '避免图片/广告/动态插入导致的布局跳动' },
      { id: 'perf-4', text: '交互时间 TTI < 3.8s' },
      { id: 'perf-5', text: '静态资源使用 CDN 分发' },
      { id: 'perf-6', text: '图片使用 WebP / AVIF 格式并设置懒加载', critical: true },
      { id: 'perf-7', text: '关键 CSS 内联，非关键 CSS 异步加载' },
      { id: 'perf-8', text: 'JS 使用代码分割与 Tree Shaking', critical: true },
      { id: 'perf-9', text: '字体使用 swap 策略，避免 FOIT/FOUT' },
      { id: 'perf-10', text: '启用 gzip / Brotli 压缩' },
      { id: 'perf-11', text: '配置合适的 HTTP 缓存头 (Cache-Control / ETag)' },
      { id: 'perf-12', text: '预连接关键域名 (preconnect / dns-prefetch)' },
      { id: 'perf-13', text: '总 bundle 大小 gzip 后 < 300KB' },
      { id: 'perf-14', text: '首屏无阻塞请求 < 6 个' },
    ],
  },
  {
    id: 'seo',
    name: 'SEO 优化',
    icon: <Globe size={18} />,
    accent: '#10b981',
    items: [
      { id: 'seo-1', text: '每个页面有唯一且语义化的 <title> (≤60字符)', critical: true },
      { id: 'seo-2', text: '每个页面有唯一的 meta description (≤160字符)', critical: true },
      { id: 'seo-3', text: '语义化 H1-H6 层级结构，每页唯一 H1' },
      { id: 'seo-4', text: '配置 robots.txt 并验证无错误阻塞' },
      { id: 'seo-5', text: '生成并提交 XML sitemap 到 Google/Bing' },
      { id: 'seo-6', text: '配置 Open Graph / Twitter Card 社交标签', critical: true },
      { id: 'seo-7', text: '图片所有 <img> 设置 alt 属性' },
      { id: 'seo-8', text: 'URL 使用清晰的语义化路径和连字符' },
      { id: 'seo-9', text: '设置 canonical URL 避免内容重复' },
      { id: 'seo-10', text: '结构化数据 Schema.org (JSON-LD) 已配置' },
      { id: 'seo-11', text: 'hreflang 多语言标签正确配置（如适用）' },
      { id: 'seo-12', text: '301 重定向策略覆盖旧链接' },
      { id: 'seo-13', text: '404 页面友好，含导航和搜索建议' },
    ],
  },
  {
    id: 'a11y',
    name: '可访问性 (a11y)',
    icon: <Eye size={18} />,
    accent: '#8b5cf6',
    items: [
      { id: 'a11y-1', text: '所有交互元素可通过 Tab 键盘访问', critical: true },
      { id: 'a11y-2', text: '所有图片提供 alt 文本（装饰图为空 alt）', critical: true },
      { id: 'a11y-3', text: '颜色对比度 AA 级达标 (正文 4.5:1，大字 3:1)', critical: true },
      { id: 'a11y-4', text: '表单字段均有关联 <label> 或 aria-label' },
      { id: 'a11y-5', text: '正确使用语义化标签：<nav> <main> <article> <section> <aside>' },
      { id: 'a11y-6', text: '按钮与链接角色正确，无 div onclick 替代按钮' },
      { id: 'a11y-7', text: '焦点可见样式清晰（不使用 outline: none 不提供替代）' },
      { id: 'a11y-8', text: '页面有 lang 属性并与内容语言一致' },
      { id: 'a11y-9', text: '视频提供字幕，音频提供文字稿（如适用）' },
      { id: 'a11y-10', text: '仅颜色不传达信息（如图例同时有形状/图案）' },
      { id: 'a11y-11', text: '跳转到主内容的 skip-link 链接存在' },
    ],
  },
  {
    id: 'security',
    name: '安全合规',
    icon: <ShieldCheck size={18} />,
    accent: '#ef4444',
    items: [
      { id: 'sec-1', text: '全站强制 HTTPS，HSTS 头已设置', critical: true },
      { id: 'sec-2', text: '配置 Content-Security-Policy 响应头', critical: true },
      { id: 'sec-3', text: 'X-Frame-Options / CSP frame-ancestors 防止点击劫持' },
      { id: 'sec-4', text: '所有用户输入经过净化/转义，防 XSS 注入', critical: true },
      { id: 'sec-5', text: 'Cookie 设置 Secure + HttpOnly + SameSite 属性' },
      { id: 'sec-6', text: '敏感操作实施 CSRF 防护' },
      { id: 'sec-7', text: '密码使用 bcrypt/Argon2 哈希存储（绝不明文）' },
      { id: 'sec-8', text: 'API 实施速率限制与暴力破解防护' },
      { id: 'sec-9', text: '依赖包定期审计：无已知高危漏洞', critical: true },
      { id: 'sec-10', text: '错误信息不暴露堆栈/路径/版本号给用户' },
      { id: 'sec-11', text: '数据库查询参数化，防 SQL/NoSQL 注入', critical: true },
      { id: 'sec-12', text: '上传文件：限制类型/大小/内容检测，不在可执行路径存储' },
      { id: 'sec-13', text: 'X-XSS-Protection / X-Content-Type-Options / Referrer-Policy 头' },
      { id: 'sec-14', text: '权限分级：最小权限原则，用户与后台角色隔离' },
    ],
  },
  {
    id: 'responsive',
    name: '响应式与移动端',
    icon: <Smartphone size={18} />,
    accent: '#0ea5e9',
    items: [
      { id: 'resp-1', text: 'viewport meta 正确设置（无 user-scalable=no 除非强需求）' },
      { id: 'resp-2', text: '320px (小手机) 至 2560px (大屏) 全区间无水平滚动', critical: true },
      { id: 'resp-3', text: '移动端触摸目标 ≥ 44×44 px，无重叠点击区' },
      { id: 'resp-4', text: 'iOS Safari 刘海/底部安全区适配 (env(safe-area-inset-*))' },
      { id: 'resp-5', text: '移动端表单输入使用正确的 type (tel/email/number/date)' },
      { id: 'resp-6', text: '移动端禁用自动缩放时输入框字号 ≥ 16px 防缩放' },
      { id: 'resp-7', text: '字体大小使用相对单位 (rem/clamp)，极端缩放可用' },
      { id: 'resp-8', text: '移动端弹窗可关闭 (非全屏遮罩无关闭按钮)' },
      { id: 'resp-9', text: '长表格在小屏可横向滚动或折叠展示' },
    ],
  },
  {
    id: 'crossbrowser',
    name: '跨浏览器兼容',
    icon: <Layers size={18} />,
    accent: '#ec4899',
    items: [
      { id: 'cb-1', text: '目标浏览器矩阵明确：Chrome/Firefox/Safari/Edge 最近两个版本' },
      { id: 'cb-2', text: 'Safari iOS 最新两个主要版本功能与视觉一致' },
      { id: 'cb-3', text: 'CSS 使用 Autoprefixer 或 Browserslist 配置' },
      { id: 'cb-4', text: 'JS 新特性提供 polyfill（如需要支持旧浏览器）' },
      { id: 'cb-5', text: 'CSS 特性检测 @supports，非关键优雅降级' },
      { id: 'cb-6', text: '日期/数字格式使用 Intl API 而非依赖 locale 字符串' },
      { id: 'cb-7', text: 'WebSocket / EventSource / 推送通知有降级处理' },
    ],
  },
  {
    id: 'code',
    name: '代码质量',
    icon: <Code2 size={18} />,
    accent: '#6366f1',
    items: [
      { id: 'cq-1', text: 'ESLint / Stylelint 无报错，CI 阻断', critical: true },
      { id: 'cq-2', text: 'TypeScript 严格模式 (strict: true) 无 any 逃逸', critical: true },
      { id: 'cq-3', text: '单元测试覆盖率 ≥ 80%，核心模块 ≥ 90%' },
      { id: 'cq-4', text: 'E2E 测试覆盖关键流程（登录/支付/核心交互）' },
      { id: 'cq-5', text: '无 console.log / debugger / 测试代码遗留' },
      { id: 'cq-6', text: '所有第三方依赖版本锁定 (lock file 提交)' },
      { id: 'cq-7', text: '代码已 Code Review，无直接 push 到主分支' },
      { id: 'cq-8', text: 'README / 架构文档 / API 文档同步更新' },
      { id: 'cq-9', text: '无大型组件 / 上帝函数：函数 ≤ 100 行，组件单一职责' },
      { id: 'cq-10', text: '错误边界 (Error Boundary) 捕获渲染异常' },
      { id: 'cq-11', text: '可访问性静态扫描 (axe/eslint-plugin-jsx-a11y) 通过' },
    ],
  },
  {
    id: 'devops',
    name: 'DevOps 与部署',
    icon: <Cloud size={18} />,
    accent: '#14b8a6',
    items: [
      { id: 'dev-1', text: 'CI/CD 流水线：推送自动构建/测试/部署', critical: true },
      { id: 'dev-2', text: '部署环境分离：Dev / Staging / Production' },
      { id: 'dev-3', text: '生产环境不输出调试信息和 source map' },
      { id: 'dev-4', text: '回滚机制就位：一键回滚到上一版本', critical: true },
      { id: 'dev-5', text: '蓝绿发布 / 金丝雀发布策略（如适用）' },
      { id: 'dev-6', text: '健康检查 /healthz 端点存在并正确报告依赖' },
      { id: 'dev-7', text: '日志采集与查询（ELK / Loki / CloudWatch）' },
      { id: 'dev-8', text: '应用性能监控 APM 接入 (Sentry / NewRelic / Datadog)', critical: true },
      { id: 'dev-9', text: '告警规则配置：错误率/响应时间/资源使用率阈值' },
      { id: 'dev-10', text: '数据库迁移方案：版本化 + 向下兼容 + 回滚脚本' },
      { id: 'dev-11', text: '备份策略：自动 + 定期恢复演练 (RTO/RPO 明确)' },
      { id: 'dev-12', text: '静态资源版本化指纹 (asset hash)，CDN 失效处理' },
      { id: 'dev-13', text: 'Docker 镜像体积优化：多阶段构建，运行时非 root 用户' },
    ],
  },
  {
    id: 'content',
    name: '内容与合规',
    icon: <FileSearch size={18} />,
    accent: '#f43f5e',
    items: [
      { id: 'cont-1', text: '隐私政策页面并在适用场景下获得用户同意' },
      { id: 'cont-2', text: 'Cookie 同意横幅符合 GDPR/CCPA（如适用）', critical: true },
      { id: 'cont-3', text: '服务条款 / 使用条款完整' },
      { id: 'cont-4', text: '联系信息 / 公司信息展示（如适用）' },
      { id: 'cont-5', text: '全站无 Lorem ipsum / TODO / 占位内容残留', critical: true },
      { id: 'cont-6', text: '所有链接可点击，无 404 坏链' },
      { id: 'cont-7', text: '品牌资产：Logo / Favicon / OG 图像正确' },
      { id: 'cont-8', text: '版权声明年份正确（自动生成当前年份）' },
      { id: 'cont-9', text: '表单提交有服务端和客户端双重验证' },
      { id: 'cont-10', text: '邮件发送功能 SPF/DKIM/DMARC 配置（防进垃圾邮件）' },
      { id: 'cont-11', text: '无障碍声明（如面向公共机构必须合规）' },
    ],
  },
  {
    id: 'seo-tech',
    name: '技术 SEO',
    icon: <Server size={18} />,
    accent: '#0891b2',
    items: [
      { id: 'tech-1', text: '页面 HTTP 状态码正确：正常 200，已删除 410，移动 301' },
      { id: 'tech-2', text: 'TTFB 服务器响应时间 < 600ms' },
      { id: 'tech-3', text: '支持 HTTP/2 或 HTTP/3' },
      { id: 'tech-4', text: '所有资源可抓取： robots 不禁止 CSS/JS/图片' },
      { id: 'tech-5', text: '渲染策略：SSR/SSG/ISR 选择合理（非全部 CSR）' },
      { id: 'tech-6', text: '已在 Google Search Console / Bing Webmaster 验证并提交' },
      { id: 'tech-7', text: '分页 rel="prev/next" 或 View All 页面正确' },
      { id: 'tech-8', text: 'AMP / 移动端友好测试通过（如需要 AMP）' },
      { id: 'tech-9', text: 'PWA 条件：manifest + service worker + 可安装' },
      { id: 'tech-10', text: '预渲染 / 动态渲染对爬虫友好（如重度 SPA）' },
    ],
  },
]

const STORAGE_KEY = 'webdev-checklist-v1'

function loadChecked(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(arr)
  } catch {
    return new Set()
  }
}

type FilterMode = 'all' | 'remaining' | 'critical'

export default function WebDevChecklist() {
  const [checked, setChecked] = useState<Set<string>>(() => loadChecked())
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterMode>('all')
  const [activeCat, setActiveCat] = useState<string>('all')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(checked))) } catch {}
  }, [checked])

  const toggle = useCallback((id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const toggleCat = (id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const resetAll = () => { if (confirm('确认重置所有检查项？此操作不可撤销。')) setChecked(new Set()) }

  const allIds = useMemo(() => {
    const ids: string[] = []
    for (const g of CHECK_GROUPS) for (const it of g.items) ids.push(it.id)
    return ids
  }, [])
  const allCriticalIds = useMemo(() => {
    const ids: string[] = []
    for (const g of CHECK_GROUPS) for (const it of g.items) if (it.critical) ids.push(it.id)
    return ids
  }, [])

  const done = checked.size
  const total = allIds.length
  const pct = Math.round((done / total) * 100)

  const criticalTotal = allCriticalIds.length
  const criticalDone = allCriticalIds.filter(id => checked.has(id)).length
  const criticalPct = Math.round((criticalDone / criticalTotal) * 100)

  const groupStats = useMemo(() => {
    const map: Record<string, { done: number; total: number; criticalDone: number; criticalTotal: number }> = {}
    for (const g of CHECK_GROUPS) {
      let d = 0, cd = 0, ct = 0
      for (const it of g.items) {
        if (checked.has(it.id)) d++
        if (it.critical) { ct++; if (checked.has(it.id)) cd++ }
      }
      map[g.id] = { done: d, total: g.items.length, criticalDone: cd, criticalTotal: ct }
    }
    return map
  }, [checked])

  const filterItems = (group: CheckGroup): CheckItem[] => {
    const q = query.trim().toLowerCase()
    return group.items.filter(it => {
      if (activeCat !== 'all' && activeCat !== group.id) return false
      if (filter === 'remaining' && checked.has(it.id)) return false
      if (filter === 'critical' && !it.critical) return false
      if (q && !it.text.toLowerCase().includes(q) && !(it.desc || '').toLowerCase().includes(q)) return false
      return true
    })
  }

  const visibleGroups = CHECK_GROUPS
    .filter(g => activeCat === 'all' || activeCat === g.id)
    .map(g => ({ g, items: filterItems(g) }))
    .filter(({ items }) => items.length > 0)

  /* ── 导出 ── */
  const exportMarkdown = () => {
    let md = `# Web 开发发布检查清单\n\n`
    md += `完成度 **${done}/${total} (${pct}%)** · 关键项 **${criticalDone}/${criticalTotal} (${criticalPct}%)**\n\n`
    md += `生成时间：${new Date().toLocaleString('zh-CN')}\n\n---\n\n`
    for (const g of CHECK_GROUPS) {
      const s = groupStats[g.id]
      md += `## ${g.name} (${s.done}/${s.total})\n\n`
      for (const it of g.items) {
        const status = checked.has(it.id) ? '[x]' : '[ ]'
        const crit = it.critical ? ' 🔴' : ''
        md += `- ${status} **${it.text}**${crit}\n`
        if (it.desc) md += `  - ${it.desc}\n`
      }
      md += '\n'
    }
    return md
  }

  const exportJSON = () => JSON.stringify({
    generatedAt: new Date().toISOString(),
    progress: { done, total, pct, criticalDone, criticalTotal, criticalPct },
    groups: CHECK_GROUPS.map(g => ({
      id: g.id, name: g.name,
      items: g.items.map(it => ({
        ...it, status: checked.has(it.id) ? 'done' : 'pending',
      })),
    })),
  }, null, 2)

  const copyMD = async () => {
    try { await navigator.clipboard.writeText(exportMarkdown()); setCopied(true); setTimeout(() => setCopied(false), 1500) }
    catch { alert('复制失败，请手动选择内容') }
  }

  const download = (content: string, filename: string, type = 'text/plain') => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  /* ── 评级 ── */
  const grade = pct >= 95 && criticalPct === 100 ? { label: 'A+', color: '#10b981', text: '生产就绪' }
    : pct >= 85 && criticalPct >= 95 ? { label: 'A', color: '#22c55e', text: '优秀' }
    : pct >= 70 && criticalPct >= 85 ? { label: 'B', color: '#84cc16', text: '良好' }
    : pct >= 55 && criticalPct >= 70 ? { label: 'C', color: '#f59e0b', text: '需要改进' }
    : pct >= 35 ? { label: 'D', color: '#f97316', text: '存在风险' }
    : { label: 'F', color: '#ef4444', text: '不可发布' }

  return (
    <div style={{
      height: '100%', overflowY: 'auto', padding: '24px',
      color: 'var(--text-primary)',
      fontFamily: "'Space Grotesk', 'Noto Sans SC', system-ui, sans-serif",
    }}>
      {/* Header */}
      <header style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--accent) 0%, #38bdf8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
            }}>
              <Rocket size={28} style={{ color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                WebDevChecklist
              </h1>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                网站发布前检查清单 · {CHECK_GROUPS.length} 大类 · {total} 项检查
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Grade Badge */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '84px', height: '84px', borderRadius: '50%',
                border: `3px solid ${grade.color}`,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: `${grade.color}15`,
              }}>
                <div style={{ fontSize: '30px', fontWeight: 900, color: grade.color, lineHeight: 1 }}>{grade.label}</div>
                <div style={{ fontSize: '10px', color: grade.color, fontWeight: 700, marginTop: '2px' }}>{grade.text}</div>
              </div>
            </div>
            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button onClick={copyMD} style={btn()}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? '已复制 MD' : '复制 Markdown'}
              </button>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => download(exportMarkdown(), 'webdev-checklist.md')} style={btn('sm')}>MD 导出</button>
                <button onClick={() => download(exportJSON(), 'webdev-checklist.json', 'application/json')} style={btn('sm')}>JSON 导出</button>
                <button onClick={resetAll} style={btn('sm', true)}>
                  <RefreshCw size={12} /> 重置
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bars */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
              <span style={{ fontWeight: 600 }}>整体完成度</span>
              <span style={{ fontWeight: 800 }}>{done}/{total} · {pct}%</span>
            </div>
            <div style={track()}>
              <div style={{ ...fill(), width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent), #38bdf8)' }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} style={{ color: '#ef4444' }} /> 关键发布阻塞项
              </span>
              <span style={{ fontWeight: 800, color: criticalDone < criticalTotal ? '#ef4444' : '#10b981' }}>
                {criticalDone}/{criticalTotal} · {criticalPct}%
              </span>
            </div>
            <div style={track()}>
              <div style={{
                ...fill(),
                width: `${criticalPct}%`,
                background: criticalPct < 100
                  ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                  : 'linear-gradient(90deg, #22c55e, #10b981)',
              }} />
            </div>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div style={{
        marginBottom: '20px',
        padding: '14px',
        borderRadius: '14px',
        background: 'var(--window-bg)',
        border: '1px solid var(--window-border)',
        display: 'grid',
        gridTemplateColumns: 'minmax(200px, 1fr) auto auto',
        gap: '10px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索检查项…"
            style={{
              width: '100%', padding: '9px 12px 9px 36px',
              borderRadius: '10px',
              border: '1px solid var(--window-border)',
              background: 'var(--context-menu-hover)',
              color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Filter size={14} style={{ color: 'var(--text-secondary)' }} />
          {([
            ['all', '全部'],
            ['remaining', '剩余'],
            ['critical', '关键'],
          ] as [FilterMode, string][]).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              style={{
                padding: '6px 12px', borderRadius: '999px',
                border: '1px solid', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                background: filter === k ? 'var(--accent)' : 'transparent',
                color: filter === k ? 'white' : 'var(--text-primary)',
                borderColor: filter === k ? 'var(--accent)' : 'var(--window-border)',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{
        display: 'flex', gap: '8px', flexWrap: 'wrap',
        marginBottom: '20px',
      }}>
        <button
          onClick={() => setActiveCat('all')}
          style={catBtn(activeCat === 'all')}
        >
          <BarChart3 size={14} />
          总览
          <span style={{ opacity: 0.7, marginLeft: '4px' }}>{done}/{total}</span>
        </button>
        {CHECK_GROUPS.map(g => {
          const s = groupStats[g.id]
          const allDone = s.done === s.total
          return (
            <button
              key={g.id}
              onClick={() => setActiveCat(g.id)}
              style={{
                ...catBtn(activeCat === g.id),
                borderColor: activeCat === g.id ? g.accent : undefined,
                background: activeCat === g.id ? `${g.accent}20` : undefined,
              }}
            >
              <span style={{ color: activeCat === g.id ? g.accent : undefined }}>{g.icon}</span>
              {g.name}
              <span style={{
                opacity: 0.7, marginLeft: '4px',
                color: allDone ? '#10b981' : undefined,
              }}>
                {s.done}/{s.total}
                {allDone && ' ✓'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Checklist Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {visibleGroups.length === 0 && (
          <div style={{
            padding: '48px 24px', textAlign: 'center',
            color: 'var(--text-secondary)',
            borderRadius: '14px',
            border: '1px dashed var(--window-border)',
            fontSize: '14px',
          }}>
            <Bookmark size={28} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <div>没有匹配的检查项，请尝试调整筛选条件</div>
          </div>
        )}
        {visibleGroups.map(({ g, items }) => {
          const s = groupStats[g.id]
          const p = Math.round((s.done / s.total) * 100)
          const collapsed_ = collapsed.has(g.id)
          return (
            <div key={g.id} style={{
              borderRadius: '14px',
              background: 'var(--window-bg)',
              border: '1px solid var(--window-border)',
              overflow: 'hidden',
            }}>
              {/* Group Header */}
              <div
                onClick={() => toggleCat(g.id)}
                style={{
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  background: `linear-gradient(90deg, ${g.accent}10, transparent 70%)`,
                  userSelect: 'none',
                }}
              >
                <div style={{
                  width: '34px', height: '34px', borderRadius: '10px',
                  background: `${g.accent}25`, color: g.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {g.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>{g.name}</span>
                    {s.done === s.total && s.total > 0 && (
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '999px',
                        background: '#10b98125', color: '#10b981', fontWeight: 700,
                      }}>✓ 全部完成</span>
                    )}
                  </div>
                  <div style={{
                    marginTop: '6px', height: '4px',
                    borderRadius: '999px',
                    background: 'var(--context-menu-hover)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', width: `${p}%`,
                      background: g.accent, transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
                <div style={{
                  fontSize: '12px', color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  <span style={{ fontWeight: 700, fontSize: '16px', color: g.accent }}>{p}%</span>
                  <span>{s.done}/{s.total}</span>
                </div>
                {collapsed_ ? <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-secondary)' }} />}
              </div>

              {/* Items */}
              {!collapsed_ && (
                <div style={{ padding: '4px 14px 12px' }}>
                  {items.map(it => {
                    const on = checked.has(it.id)
                    return (
                      <label
                        key={it.id}
                        onClick={() => toggle(it.id)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: '12px',
                          padding: '10px 10px', borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'background 0.12s',
                          border: `1px solid ${on ? (it.critical ? '#10b98166' : 'var(--accent)66') : 'transparent'}`,
                          background: on ? (it.critical ? '#10b9810f' : 'var(--accent)10') : 'transparent',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = on ? e.currentTarget.style.background : 'var(--context-menu-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = on ? e.currentTarget.style.background : 'transparent'}
                      >
                        <div style={{ marginTop: '1px', color: on ? (it.critical ? '#10b981' : 'var(--accent)') : 'var(--text-secondary)' }}>
                          {on ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '13.5px',
                            textDecoration: on ? 'line-through' : 'none',
                            opacity: on ? 0.6 : 1,
                            display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
                          }}>
                            {it.text}
                            {it.critical && (
                              <span style={{
                                fontSize: '10px', fontWeight: 800,
                                padding: '1px 7px', borderRadius: '999px',
                                background: on ? '#10b98120' : '#ef444420',
                                color: on ? '#10b981' : '#ef4444',
                                letterSpacing: '0.02em',
                                textDecoration: 'none', opacity: 1,
                              }}>
                                关键项
                              </span>
                            )}
                          </div>
                          {it.desc && (
                            <div style={{
                              fontSize: '12px', color: 'var(--text-secondary)',
                              marginTop: '3px', lineHeight: 1.5,
                            }}>
                              {it.desc}
                            </div>
                          )}
                        </div>
                      </label>
                    )
                  })}
                  {items.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      此类别下没有匹配的检查项
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer Note */}
      <div style={{
        marginTop: '24px', padding: '18px 20px', borderRadius: '14px',
        background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(56,189,248,0.08))',
        border: '1px solid var(--window-border)',
        fontSize: '13px', lineHeight: 1.65,
      }}>
        <div style={{ fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={16} style={{ color: 'var(--accent)' }} />
          关于本清单
        </div>
        本清单综合了 Google Core Web Vitals、MDN Web 文档、OWASP Top 10、WCAG 2.1 AA、W3C 最佳实践、Google Search Essentials 等业界标准，适用于大多数 Web 产品的上线前质量保证。使用时请根据项目规模、行业合规要求（医疗/金融/政府等）自行裁剪和扩展。进度自动保存于浏览器本地存储。
      </div>
    </div>
  )
}

/* ── style helpers ── */

function btn(size: 'sm' | 'md' = 'md', danger = false) {
  return {
    display: 'inline-flex' as const,
    alignItems: 'center',
    gap: '6px',
    padding: size === 'sm' ? '6px 10px' : '8px 14px',
    borderRadius: '10px',
    border: `1px solid ${danger ? '#ef444466' : 'var(--window-border)'}`,
    background: danger ? '#ef444418' : 'var(--context-menu-hover)',
    color: danger ? '#fca5a5' : 'var(--text-primary)',
    fontSize: size === 'sm' ? '12px' : '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    justifyContent: 'center' as const,
  }
}

function catBtn(active: boolean) {
  return {
    display: 'inline-flex' as const,
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: '999px',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--window-border)'}`,
    background: active ? 'var(--accent)18' : 'var(--window-bg)',
    color: 'var(--text-primary)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  }
}

function track(): React.CSSProperties {
  return { height: '8px', background: 'var(--context-menu-hover)', borderRadius: '999px', overflow: 'hidden' }
}
function fill(): React.CSSProperties {
  return { height: '100%', borderRadius: '999px', transition: 'width 0.3s ease' }
}
