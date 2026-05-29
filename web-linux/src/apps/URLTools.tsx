import React, { useState } from 'react'
import { Copy, Link2, CheckCircle2 } from 'lucide-react'

const URLTools: React.FC = () => {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('shorten')

  const encodeURL = () => {
    try {
      const encoded = encodeURIComponent(url)
      setResult(encoded)
    } catch (e) {
      setResult('编码错误: 请检查输入')
    }
  }

  const decodeURL = () => {
    try {
      const decoded = decodeURIComponent(url)
      setResult(decoded)
    } catch (e) {
      setResult('解码错误: 无效的 URL 编码')
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
    } catch (e) {
      setResult('解析错误: 无效的 URL')
    }
  }

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('复制失败:', e)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 text-purple-300">URL 工具箱</h2>
        <p className="text-gray-400 text-sm">URL 编码、解码、解析和更多功能</p>
      </div>

      <div className="flex space-x-2 mb-4 border-b border-gray-700 pb-2">
        {[
          { id: 'shorten', label: '编码' },
          { id: 'expand', label: '解码' },
          { id: 'parse', label: '解析' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Link2 className="inline w-4 h-4 mr-2" />
            输入 URL
          </label>
          <textarea
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/path?query=value"
            className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
        </div>

        <button
          onClick={() => {
            if (activeTab === 'shorten') encodeURL()
            else if (activeTab === 'expand') decodeURL()
            else parseURL()
          }}
          disabled={!url.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-purple-500/25"
        >
          {activeTab === 'shorten'
            ? '编码 URL'
            : activeTab === 'expand'
            ? '解码 URL'
            : '解析 URL'}
        </button>

        {result && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                结果
              </label>
              <button
                onClick={copyResult}
                className="flex items-center space-x-1 text-xs text-gray-400 hover:text-purple-300 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>已复制!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>复制</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 overflow-auto max-h-40">
              <pre className="text-sm text-gray-200 whitespace-pre-wrap break-all">{result}</pre>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 mb-2">功能说明</h3>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• 编码: 对 URL 进行 URI 编码</li>
          <li>• 解码: 对 URL 进行 URI 解码</li>
          <li>• 解析: 详细解析 URL 结构和参数</li>
        </ul>
      </div>
    </div>
  )
}

export default URLTools
