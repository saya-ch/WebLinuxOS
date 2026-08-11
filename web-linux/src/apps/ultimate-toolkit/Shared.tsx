import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useStore } from '../../store'
import { Search, RefreshCw, Copy, Check } from 'lucide-react'

export type TabId =
  | 'weather' | 'currency' | 'ip' | 'country' | 'wiki'
  | 'quote' | 'joke' | 'crypto' | 'github' | 'color'
  | 'uuid' | 'base64' | 'timestamp' | 'json'
  | 'url' | 'password' | 'hash' | 'unit'

export interface ToolProps {
  onAddHistory: (tool: TabId, query: string, result: string) => void
  onCopy: (text: string, msg?: string) => void
}

export const HISTORY_KEY = 'ultimate-toolkit-history'
export const MAX_HISTORY = 50

export interface HistoryEntry {
  id: string
  tool: TabId
  query: string
  result: string
  timestamp: number
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveHistory(history: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
  } catch { }
}

export const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  background: 'var(--glass-bg)', border: '1px solid var(--window-border)',
  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
  boxSizing: 'border-box',
}

export const labelStyle: React.CSSProperties = {
  fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6,
}

export const selectStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  background: 'var(--glass-bg)', border: '1px solid var(--window-border)',
  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
}

export const primaryBtnStyle: React.CSSProperties = {
  padding: '12px 20px', borderRadius: 10,
  background: 'linear-gradient(135deg, var(--accent) 0%, #a29bfe 100%)',
  color: 'white', border: 'none', cursor: 'pointer',
  fontSize: 14, fontWeight: 600,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
}

export const ghostBtnStyle: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8,
  background: 'var(--glass-bg)', border: '1px solid var(--window-border)',
  color: 'var(--text-secondary)', cursor: 'pointer',
  fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
}

export const swapBtnStyle: React.CSSProperties = {
  padding: '10px', borderRadius: 10,
  background: 'var(--glass-bg)', border: '1px solid var(--window-border)',
  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16,
}

export function ToolHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        {icon}
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{title}</h3>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 30 }}>{subtitle}</p>
    </div>
  )
}

export function SearchBar({ value, onChange, onSearch, placeholder, loading }: {
  value: string; onChange: (v: string) => void; onSearch: () => void; placeholder: string; loading: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputStyle, flex: 1 }}
        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
      />
      <button
        onClick={onSearch}
        disabled={loading}
        style={{
          padding: '0 20px', borderRadius: 10,
          background: loading ? 'var(--glass-bg)' : 'var(--accent)',
          border: 'none', color: loading ? 'var(--text-secondary)' : 'white',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          fontWeight: 500,
        }}
      >
        {loading ? <RefreshCw size={16} className="ut-spin" /> : <Search size={16} />}
        {loading ? '' : '搜索'}
      </button>
    </div>
  )
}

export function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 12,
      background: 'var(--glass-bg)', border: '1px solid var(--window-border)',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{value}</div>
    </div>
  )
}

export function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 10,
      background: 'var(--glass-bg)', border: '1px solid var(--window-border)',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, wordBreak: 'break-word' }}>{value}</div>
    </div>
  )
}

export function useToolActions() {
  const addNotification = useStore((s) => s.addNotification)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const addHistory = useCallback((
    setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>,
    tool: TabId, query: string, result: string
  ) => {
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tool, query, result, timestamp: Date.now(),
    }
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_HISTORY)
      saveHistory(next)
      return next
    })
  }, [])

  const copyToClipboard = useCallback((text: string, msg = '已复制到剪贴板') => {
    try {
      navigator.clipboard.writeText(text)
      addNotification({ title: '成功', message: msg, type: 'success' })
    } catch {
      addNotification({ title: '失败', message: '复制失败', type: 'error' })
    }
  }, [addNotification])

  return { addNotification, addHistory, copyToClipboard, copiedId, setCopiedId }
}

export function CopyButton({ text, id: _id, onCopy }: { text: string; id: string; onCopy: (t: string, m?: string) => void }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { onCopy(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      style={{
        padding: '6px 12px', borderRadius: 8,
        background: copied ? 'rgba(16, 185, 129, 0.15)' : 'var(--glass-bg)',
        border: '1px solid var(--window-border)',
        color: copied ? '#10b981' : 'var(--text-secondary)',
        cursor: 'pointer', fontSize: 12,
        display: 'flex', alignItems: 'center', gap: 4,
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? '已复制' : '复制'}
    </button>
  )
}

export { useState, useCallback, useRef, useEffect, useMemo }
export { useStore }
export {
  Search, RefreshCw, Copy, Check, Globe, Cloud, Sun, CloudRain, CloudSnow,
  Wind, Droplets, Thermometer, MapPin, DollarSign, Flag, BookOpen, Quote,
  Laugh, TrendingUp, Palette, KeyRound, Hash, Clock, Braces, ExternalLink,
  History, X, ChevronRight, Sparkles, Link, Lock, Shield, Ruler,
  Zap, Eye, EyeOff,
} from 'lucide-react'