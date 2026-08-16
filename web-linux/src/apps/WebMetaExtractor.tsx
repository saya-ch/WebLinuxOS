import { useState, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { useStore } from '../store'

interface MetaResult {
  title?: string
  description?: string
  url?: string
  image?: string
  siteName?: string
  type?: string
  locale?: string
  author?: string
  favicon?: string
  canonical?: string
  ogTags: Record<string, string>
  twitterTags: Record<string, string>
  rawHtml?: string
}

export default function WebMetaExtractor() {
  const addNotification = useStore((s) => s.addNotification)
  const [url, setUrl] = useState('https://github.com/saya-ch/WebLinuxOS')
  const [result, setResult] = useState<MetaResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'basic' | 'og' | 'twitter' | 'raw'>('basic')

  const proxyUrl = useCallback((targetUrl: string) => {
    const api = 'https://api.allorigins.win/get?url='
    return `${api}${encodeURIComponent(targetUrl)}`
  }, [])

  const normalizeUrl = (input: string): string => {
    if (!input.startsWith('http')) {
      return 'https://' + input
    }
    return input
  }

  const extractMeta = useCallback(async () => {
    const targetUrl = normalizeUrl(url.trim())
    if (!targetUrl) return
    
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      const response = await fetch(proxyUrl(targetUrl))
      const data = await response.json()
      const html: string = data.contents
      
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      
      const extractMetaTag = (name: string, attr: string = 'property') => {
        return doc.querySelector(`meta[${attr}="${name}"]`)?.getAttribute('content') ||
               doc.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || ''
      }
      
      const ogTags: Record<string, string> = {}
      doc.querySelectorAll('meta[property^="og:"]').forEach(meta => {
        const prop = meta.getAttribute('property') || ''
        const content = meta.getAttribute('content') || ''
        ogTags[prop] = content
      })
      
      const twitterTags: Record<string, string> = {}
      doc.querySelectorAll('meta[name^="twitter:"]').forEach(meta => {
        const name = meta.getAttribute('name') || ''
        const content = meta.getAttribute('content') || ''
        twitterTags[name] = content
      })
      
      const linkCanonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || ''
      const iconLink = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]')?.getAttribute('href') || ''
      
      const meta: MetaResult = {
        title: doc.querySelector('title')?.textContent || extractMetaTag('og:title'),
        description: extractMetaTag('description') || extractMetaTag('og:description'),
        url: linkCanonical || targetUrl,
        image: extractMetaTag('og:image'),
        siteName: extractMetaTag('og:site_name'),
        type: extractMetaTag('og:type'),
        locale: extractMetaTag('og:locale'),
        author: extractMetaTag('author'),
        favicon: iconLink ? new URL(iconLink, targetUrl).href : `${new URL(targetUrl).origin}/favicon.ico`,
        canonical: linkCanonical,
        ogTags,
        twitterTags,
        rawHtml: html.substring(0, 5000),
      }
      
      setResult(meta)
      addNotification({ title: '提取成功', message: `已提取 ${targetUrl} 的元数据`, type: 'success' })
    } catch (err) {
      setError('无法获取该页面。可能是网络问题或该站点禁止访问。')
      addNotification({ title: '提取失败', message: '请检查 URL 或网络连接', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [url, proxyUrl, addNotification])

  const copyToClipboard = useCallback((text: string) => {
    try {
      navigator.clipboard.writeText(text)
      addNotification({ title: '已复制', message: '内容已复制到剪贴板', type: 'success' })
    } catch {}
  }, [addNotification])

  const exportJSON = useCallback(() => {
    if (!result) return
    const json = JSON.stringify(result, null, 2)
    copyToClipboard(json)
  }, [result, copyToClipboard])

  const MetaRow = ({ label, value }: { label: string; value?: string }) => (
    <div style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ width: 140, color: 'var(--text-secondary)', fontSize: 13, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 13, wordBreak: 'break-all', color: 'var(--text-primary)' }}>
        {value || <span style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>未设置</span>}
      </div>
    </div>
  )

  const styles: Record<string, CSSProperties> = {
    container: { height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--window-bg)', color: 'var(--text-primary)' },
    header: { padding: '16px 20px', borderBottom: '1px solid var(--window-border)', background: 'linear-gradient(135deg, var(--window-bg), var(--desktop-bg))' },
    title: { fontSize: 18, fontWeight: 700 },
    subtitle: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 },
    content: { flex: 1, overflow: 'auto', padding: 20 },
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid var(--window-border)', borderRadius: 12, padding: 20, marginBottom: 16 },
    urlInput: { width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--window-border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const },
    fetchBtn: { padding: '12px 24px', background: 'var(--accent)', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, marginTop: 12, width: '100%' as const },
    tabBtn: { padding: '8px 16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, borderBottom: '2px solid transparent', fontWeight: 500 },
    tabActive: { padding: '8px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13, borderBottom: '2px solid var(--accent)', fontWeight: 600 },
    previewImg: { maxWidth: 200, maxHeight: 200, borderRadius: 8, border: '1px solid var(--window-border)' },
    copyBtn: { padding: '6px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--window-border)', borderRadius: 6, color: 'var(--text-primary)', cursor: 'pointer', fontSize: 12 },
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>网页元数据提取器</div>
        <div style={styles.subtitle}>提取任意 URL 的 meta 标签、Open Graph、Twitter Card 信息</div>
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          <input
            style={styles.urlInput}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            onKeyDown={(e) => e.key === 'Enter' && extractMeta()}
          />
          <button style={styles.fetchBtn} onClick={extractMeta} disabled={loading}>
            {loading ? '⏳ 正在获取...' : '🔍 提取元数据'}
          </button>
          {error && (
            <div style={{ marginTop: 12, padding: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#fca5a5', fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>

        {result && (
          <>
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--window-border)', marginBottom: 16 }}>
              <button style={tab === 'basic' ? styles.tabActive : styles.tabBtn} onClick={() => setTab('basic')}>基本信息</button>
              <button style={tab === 'og' ? styles.tabActive : styles.tabBtn} onClick={() => setTab('og')}>
                Open Graph ({Object.keys(result.ogTags).length})
              </button>
              <button style={tab === 'twitter' ? styles.tabActive : styles.tabBtn} onClick={() => setTab('twitter')}>
                Twitter Card ({Object.keys(result.twitterTags).length})
              </button>
              <button style={tab === 'raw' ? styles.tabActive : styles.tabBtn} onClick={() => setTab('raw')}>原始 HTML</button>
              <button style={{ ...styles.tabBtn, marginLeft: 'auto' }} onClick={exportJSON} disabled>
                📋 导出 JSON
              </button>
            </div>

            {tab === 'basic' && (
              <div style={styles.card}>
                {result.image && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>预览图</div>
                    <img style={styles.previewImg} src={result.image} alt="preview" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                )}
                <MetaRow label="页面标题" value={result.title} />
                <MetaRow label="页面描述" value={result.description} />
                <MetaRow label="规范 URL" value={result.url} />
                <MetaRow label="网站名称" value={result.siteName} />
                <MetaRow label="类型" value={result.type} />
                <MetaRow label="语言" value={result.locale} />
                <MetaRow label="作者" value={result.author} />
                <MetaRow label="Favicon" value={result.favicon} />
                {result.favicon && (
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={result.favicon} alt="favicon" style={{ width: 32, height: 32 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>站点图标预览</span>
                  </div>
                )}
              </div>
            )}

            {tab === 'og' && (
              <div style={styles.card}>
                {Object.keys(result.ogTags).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                    该页面未发现 Open Graph 标签
                  </div>
                ) : (
                  Object.entries(result.ogTags).map(([key, value]) => (
                    <div key={key} style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', alignItems: 'center' }}>
                      <div style={{ width: 180, fontSize: 13, fontWeight: 500, color: '#a5f3fc' }}>{key}</div>
                      <div style={{ flex: 1, fontSize: 13, wordBreak: 'break-all', color: 'var(--text-primary)' }}>
                        {value.length > 100 ? value.substring(0, 100) + '...' : value}
                      </div>
                      <button style={styles.copyBtn} onClick={() => copyToClipboard(value)}>📋</button>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'twitter' && (
              <div style={styles.card}>
                {Object.keys(result.twitterTags).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                    该页面未发现 Twitter Card 标签
                  </div>
                ) : (
                  Object.entries(result.twitterTags).map(([key, value]) => (
                    <div key={key} style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', alignItems: 'center' }}>
                      <div style={{ width: 180, fontSize: 13, fontWeight: 500, color: '#fca5a5' }}>{key}</div>
                      <div style={{ flex: 1, fontSize: 13, wordBreak: 'break-all', color: 'var(--text-primary)' }}>
                        {value.length > 100 ? value.substring(0, 100) + '...' : value}
                      </div>
                      <button style={styles.copyBtn} onClick={() => copyToClipboard(value)}>📋</button>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'raw' && (
              <div style={styles.card}>
                <div style={{ background: '#0a0a0f', borderRadius: 8, padding: 16, maxHeight: 400, overflow: 'auto', fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#a3e635', whiteSpace: 'pre-wrap' as const }}>
                  {result.rawHtml}
                </div>
              </div>
            )}
          </>
        )}

        {!result && !loading && (
          <div style={styles.card}>
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>开始提取元数据</h3>
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>
                输入任意网页 URL，即可获取：<br />
                • 页面标题和描述<br />
                • Open Graph 标签（Facebook / LinkedIn 等社交平台）<br />
                • Twitter Card 标签（Twitter / X）<br />
                • Favicon 和预览图<br />
                • 规范链接和语言设置
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}