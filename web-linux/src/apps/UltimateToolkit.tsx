import { useState } from 'react'
import { useStore } from '../store'
import { Sparkles, History, X } from './ultimate-toolkit/Shared'
import {
  type TabId, type HistoryEntry,
  loadHistory, saveHistory,
} from './ultimate-toolkit/Shared'
import { WeatherTool, CurrencyTool, IPTool, CountryTool, UnitConverterTool } from './ultimate-toolkit/NetworkTools'
import { WikiTool, QuoteTool, JokeTool, CryptoTool, GitHubTool } from './ultimate-toolkit/InfoTools'
import { ColorTool, UUIDTool, Base64Tool, TimestampTool, JSONTool, URLTool, PasswordTool, HashTool } from './ultimate-toolkit/DevTools'

interface TabDef {
  id: TabId
  label: string
  icon: React.ReactNode
}

const tabs: TabDef[] = [
  { id: 'weather', label: '天气', icon: <span style={{ fontSize: 14 }}>☀️</span> },
  { id: 'currency', label: '汇率', icon: <span style={{ fontSize: 14 }}>💱</span> },
  { id: 'ip', label: 'IP查询', icon: <span style={{ fontSize: 14 }}>🌐</span> },
  { id: 'country', label: '国家', icon: <span style={{ fontSize: 14 }}>🏳️</span> },
  { id: 'wiki', label: '百科', icon: <span style={{ fontSize: 14 }}>📖</span> },
  { id: 'quote', label: '名言', icon: <span style={{ fontSize: 14 }}>💬</span> },
  { id: 'joke', label: '笑话', icon: <span style={{ fontSize: 14 }}>😄</span> },
  { id: 'crypto', label: '加密', icon: <span style={{ fontSize: 14 }}>💰</span> },
  { id: 'github', label: 'GitHub', icon: <span style={{ fontSize: 14 }}>⭐</span> },
  { id: 'color', label: '颜色', icon: <span style={{ fontSize: 14 }}>🎨</span> },
  { id: 'uuid', label: 'UUID', icon: <span style={{ fontSize: 14 }}>🆔</span> },
  { id: 'base64', label: 'Base64', icon: <span style={{ fontSize: 14 }}>🔐</span> },
  { id: 'timestamp', label: '时间戳', icon: <span style={{ fontSize: 14 }}>⏰</span> },
  { id: 'json', label: 'JSON', icon: <span style={{ fontSize: 14 }}>📋</span> },
  { id: 'url', label: 'URL', icon: <span style={{ fontSize: 14 }}>🔗</span> },
  { id: 'password', label: '密码', icon: <span style={{ fontSize: 14 }}>🛡️</span> },
  { id: 'hash', label: 'Hash', icon: <span style={{ fontSize: 14 }}>⚡</span> },
  { id: 'unit', label: '单位', icon: <span style={{ fontSize: 14 }}>📏</span> },
]

export default function UltimateToolkit() {
  const addNotification = useStore((s) => s.addNotification)
  const [activeTab, setActiveTab] = useState<TabId>('weather')
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory())
  const [showHistory, setShowHistory] = useState(false)

  const addHistory = (tool: TabId, query: string, result: string) => {
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tool, query, result, timestamp: Date.now(),
    }
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 50)
      saveHistory(next)
      return next
    })
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('ultimate-toolkit-history')
    addNotification({ title: '历史已清除', message: '', type: 'info' })
  }

  const copyToClipboard = (text: string, msg = '已复制到剪贴板') => {
    try {
      navigator.clipboard.writeText(text)
      addNotification({ title: '成功', message: msg, type: 'success' })
    } catch {
      addNotification({ title: '失败', message: '复制失败', type: 'error' })
    }
  }

  const toolProps = { onAddHistory: addHistory, onCopy: copyToClipboard }

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--window-bg)', color: 'var(--text-primary)', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes ut-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ut-spin { animation: ut-spin 1s linear infinite; }
        @keyframes ut-spin { to { transform: rotate(360deg); } }
        .ut-fade-in { animation: ut-fade-in 0.3s ease-out; }
        .ut-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .ut-scroll::-webkit-scrollbar-track { background: transparent; }
        .ut-scroll::-webkit-scrollbar-thumb { background: var(--window-border); border-radius: 3px; }
        .ut-scroll::-webkit-scrollbar-thumb:hover { background: var(--accent); }
      `}</style>

      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--window-border)',
        background: 'linear-gradient(135deg, var(--window-bg), var(--desktop-bg))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
          }}>
            <Sparkles size={18} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Ultimate Toolkit</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>终极在线工具箱 · 18 个实用工具</div>
          </div>
        </div>
        <button onClick={() => setShowHistory(!showHistory)} style={{
          padding: '6px 12px', borderRadius: 8,
          background: showHistory ? 'var(--accent-bg)' : 'transparent',
          border: '1px solid var(--window-border)',
          color: showHistory ? 'var(--accent)' : 'var(--text-secondary)',
          cursor: 'pointer', fontSize: 12,
          display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
        }}>
          <History size={14} /> 历史
        </button>
      </div>

      <div style={{
        display: 'flex', gap: 4, padding: '10px 12px',
        borderBottom: '1px solid var(--window-border)',
        background: 'var(--glass-bg)',
        overflowX: 'auto', flexShrink: 0,
      }} className="ut-scroll">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '7px 14px', borderRadius: 8,
              background: activeTab === tab.id ? 'var(--accent-bg)' : 'transparent',
              border: activeTab === tab.id ? '1px solid var(--accent)' : '1px solid transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 12,
              fontWeight: activeTab === tab.id ? 600 : 400,
              display: 'flex', alignItems: 'center', gap: 6,
              whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0,
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: 20, overflow: 'auto' }} className="ut-scroll">
          <div key={activeTab} className="ut-fade-in">
            {activeTab === 'weather' && <WeatherTool {...toolProps} />}
            {activeTab === 'currency' && <CurrencyTool {...toolProps} />}
            {activeTab === 'ip' && <IPTool {...toolProps} />}
            {activeTab === 'country' && <CountryTool {...toolProps} />}
            {activeTab === 'wiki' && <WikiTool {...toolProps} />}
            {activeTab === 'quote' && <QuoteTool {...toolProps} />}
            {activeTab === 'joke' && <JokeTool {...toolProps} />}
            {activeTab === 'crypto' && <CryptoTool {...toolProps} />}
            {activeTab === 'github' && <GitHubTool {...toolProps} />}
            {activeTab === 'color' && <ColorTool {...toolProps} />}
            {activeTab === 'uuid' && <UUIDTool {...toolProps} />}
            {activeTab === 'base64' && <Base64Tool {...toolProps} />}
            {activeTab === 'timestamp' && <TimestampTool {...toolProps} />}
            {activeTab === 'json' && <JSONTool {...toolProps} />}
            {activeTab === 'url' && <URLTool {...toolProps} />}
            {activeTab === 'password' && <PasswordTool {...toolProps} />}
            {activeTab === 'hash' && <HashTool {...toolProps} />}
            {activeTab === 'unit' && <UnitConverterTool {...toolProps} />}
          </div>
        </div>

        {showHistory && (
          <div style={{
            width: 280, borderLeft: '1px solid var(--window-border)',
            background: 'var(--glass-bg)', display: 'flex', flexDirection: 'column', flexShrink: 0,
          }}>
            <div style={{
              padding: '12px 14px', borderBottom: '1px solid var(--window-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <History size={14} /> 历史记录
              </span>
              {history.length > 0 && (
                <button onClick={clearHistory} style={{
                  padding: '4px 8px', borderRadius: 6, background: 'transparent',
                  border: 'none', color: 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: 11,
                }}>清空</button>
              )}
            </div>
            <div style={{ flex: 1, overflow: 'auto' }} className="ut-scroll">
              {history.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
                  暂无历史记录
                </div>
              ) : (
                history.map((entry) => {
                  const tab = tabs.find((t) => t.id === entry.tool)
                  return (
                    <div
                      key={entry.id}
                      onClick={() => { setActiveTab(entry.tool); setShowHistory(false) }}
                      style={{
                        padding: '10px 14px', borderBottom: '1px solid var(--window-border)',
                        cursor: 'pointer', transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 4 }}>
                        {tab?.icon} {tab?.label}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 2, wordBreak: 'break-all' }}>
                        {entry.query || '(无查询)'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {new Date(entry.timestamp).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <button onClick={() => setShowHistory(false)} style={{
              padding: '10px', borderTop: '1px solid var(--window-border)',
              background: 'transparent', borderBottom: 'none',
              color: 'var(--text-secondary)', cursor: 'pointer',
              fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <X size={14} /> 关闭
            </button>
          </div>
        )}
      </div>
    </div>
  )
}