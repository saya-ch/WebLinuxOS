import React, { useState, useCallback } from 'react'
import { Copy, Link2, CheckCircle2, QrCode, ExternalLink, History, Trash2, Download, Loader2 } from 'lucide-react'

interface ShortenedLink {
  id: string
  original: string
  shortened: string
  createdAt: number
}

const URLToolsEnhanced: React.FC = () => {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('shorten')
  const [shortening, setShortening] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [shortenedLinks, setShortenedLinks] = useState<ShortenedLink[]>([])
  const [error, setError] = useState('')

  const loadHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem('weblinux-url-history')
      if (raw) setShortenedLinks(JSON.parse(raw))
    } catch {}
  }, [])

  const saveHistory = useCallback((links: ShortenedLink[]) => {
    try {
      localStorage.setItem('weblinux-url-history', JSON.stringify(links.slice(0, 20)))
    } catch {}
  }, [])

  useState(() => { loadHistory() })

  const isValidUrl = (str: string): boolean => {
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  }

  const shortenUrl = async () => {
    if (!url.trim() || !isValidUrl(url)) {
      setError('请输入有效的 URL（以 http:// 或 https:// 开头）')
      return
    }
    setError('')
    setShortening(true)
    try {
      const response = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const shortened = (await response.text()).trim()
      
      const newLink: ShortenedLink = {
        id: Date.now().toString(),
        original: url,
        shortened,
        createdAt: Date.now(),
      }
      const updated = [newLink, ...shortenedLinks].slice(0, 20)
      setShortenedLinks(updated)
      saveHistory(updated)
      setResult(shortened)
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shortened)}`)
    } catch (err) {
      setError(`缩短失败: ${err instanceof Error ? err.message : '网络错误'}。请检查网络连接或稍后重试。`)
    } finally {
      setShortening(false)
    }
  }

  const encodeURL = () => {
    try {
      const encoded = encodeURIComponent(url)
      setResult(encoded)
      setError('')
      setQrCodeUrl('')
    } catch {
      setError('编码错误: 请检查输入')
    }
  }

  const decodeURL = () => {
    try {
      const decoded = decodeURIComponent(url)
      setResult(decoded)
      setError('')
      setQrCodeUrl('')
    } catch {
      setError('解码错误: 无效的 URL 编码')
    }
  }

  const parseURL = () => {
    try {
      const parsed = new URL(url)
      const info = {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port,
        pathname: parsed.pathname,
        search: parsed.search,
        hash: parsed.hash,
        origin: parsed.origin,
        params: Object.fromEntries(parsed.searchParams),
      }
      setResult(JSON.stringify(info, null, 2))
      setError('')
      setQrCodeUrl('')
    } catch {
      setError('解析错误: 无效的 URL')
    }
  }

  const generateQR = () => {
    if (!url.trim()) {
      setError('请输入要生成二维码的内容或 URL')
      return
    }
    setError('')
    setResult(url)
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`)
  }

  const copyResult = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('复制失败:', e)
    }
  }

  const deleteFromHistory = (id: string) => {
    const updated = shortenedLinks.filter(l => l.id !== id)
    setShortenedLinks(updated)
    saveHistory(updated)
  }

  const clearHistory = () => {
    setShortenedLinks([])
    localStorage.removeItem('weblinux-url-history')
  }

  const downloadQR = () => {
    if (!qrCodeUrl) return
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `qrcode-${Date.now()}.png`
    link.target = '_blank'
    link.click()
  }

  const handleAction = () => {
    switch (activeTab) {
      case 'shorten': shortenUrl(); break
      case 'encode': encodeURL(); break
      case 'decode': decodeURL(); break
      case 'parse': parseURL(); break
      case 'qr': generateQR(); break
    }
  }

  const tabLabels: Record<string, string> = {
    shorten: '缩短',
    encode: '编码',
    decode: '解码',
    parse: '解析',
    qr: '二维码',
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 text-gray-100">
      <div className="p-6 border-b border-gray-800/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
              URL 工具箱 Pro
            </h2>
            <p className="text-gray-400 text-xs">URL 缩短 · 编解码 · 解析 · 二维码生成</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'shorten', label: '🔗 缩短 URL' },
            { id: 'encode', label: '编码' },
            { id: 'decode', label: '解码' },
            { id: 'parse', label: '解析' },
            { id: 'qr', label: '📱 二维码' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError('') }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-gray-800/50 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Link2 className="inline w-4 h-4 mr-2" />
            输入 {activeTab === 'qr' ? '内容或 URL' : 'URL'}
          </label>
          <textarea
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError('') }}
            placeholder={
              activeTab === 'shorten' ? 'https://example.com/very/long/url/to/shorten'
              : activeTab === 'qr' ? 'https://example.com 或任意文本'
              : 'https://example.com/path?query=value'
            }
            className="w-full h-24 bg-gray-800/50 border border-gray-700 rounded-xl p-3 text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none placeholder:text-gray-600"
          />
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          onClick={handleAction}
          disabled={!url.trim() || shortening}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2"
        >
          {shortening ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              缩短中...
            </>
          ) : (
            tabLabels[activeTab]
          )}
        </button>

        {(result || qrCodeUrl) && (
          <div className="space-y-4">
            {result && activeTab !== 'qr' && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">结果</span>
                  <button
                    onClick={() => copyResult(result)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-300 transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400">已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        复制
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-sm text-gray-200 whitespace-pre-wrap break-all font-mono">{result}</pre>
                {activeTab === 'shorten' && isValidUrl(result) && (
                  <a
                    href={result}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-3 text-xs text-purple-400 hover:text-purple-300"
                  >
                    <ExternalLink className="w-3 h-3" />
                    访问链接
                  </a>
                )}
              </div>
            )}

            {qrCodeUrl && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium text-gray-300">二维码</span>
                </div>
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-48 h-48 rounded-lg bg-white p-2"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={downloadQR}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    下载
                  </button>
                  <a
                    href={qrCodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    新窗口
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {shortenedLinks.length > 0 && activeTab === 'shorten' && (
          <div className="border-t border-gray-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <History className="w-4 h-4" />
                历史记录
              </h3>
              <button
                onClick={clearHistory}
                className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                清空
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-auto">
              {shortenedLinks.map((link) => (
                <div
                  key={link.id}
                  className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-3 flex items-start gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 truncate">{link.original}</div>
                    <a
                      href={link.shortened}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-400 hover:text-purple-300 font-mono break-all"
                    >
                      {link.shortened}
                    </a>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyResult(link.shortened)}
                      className="p-1 text-gray-500 hover:text-purple-400"
                      title="复制"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteFromHistory(link.id)}
                      className="p-1 text-gray-500 hover:text-red-400"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-800/50">
          <h3 className="text-xs font-medium text-gray-400 mb-2">功能说明</h3>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• 缩短: 基于 is.gd 公共 API 的真实 URL 缩短服务</li>
            <li>• 编码/解码: URL 编解码工具</li>
            <li>• 解析: 详细解析 URL 结构和参数</li>
            <li>• 二维码: 基于 QR Server API 生成二维码</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default URLToolsEnhanced
