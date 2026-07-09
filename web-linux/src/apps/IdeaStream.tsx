import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { loadFromStorage, debouncedSaveToStorage } from '../store/storageUtils'

/* ============================================================
   IdeaStream — 灵感流
   一个快速捕捉灵感、想法、片段的工具。

   设计理念：极简的"意识流"美学
   - 输入即记录，不打断思路
   - 自动解析 #标签 与颜色分级
   - 时间倒序的瀑布流呈现
   - 全文搜索 / 标签筛选
   - 一键导出 Markdown
   - 空闲时展示精选灵感提示，激发创意
   ============================================================ */

interface Idea {
  id: string
  text: string
  tags: string[]
  color: string // accent color hex
  starred: boolean
  createdAt: number
}

const STORAGE_KEY = 'weblinux-ideastream-ideas'
const MAX_IDEAS = 500

// 五种语义颜色，循环分配；也用于标签去重显示
const IDEA_COLORS = [
  '#7c6cf0', // 紫罗兰 - 创意
  '#00d6c1', // 青绿 - 灵感
  '#f59e0b', // 琥珀 - 待办
  '#ec4899', // 玫红 - 想法
  '#10b981', // 翠绿 - 学习
  '#3b82f6', // 蓝 - 笔记
]

// 空状态时的灵感提示语
const INSPIRATION_PROMPTS = [
  '如果限制是一种祝福，你最近遇到的哪个限制值得重新审视？',
  '描述一个你觉得有趣但尚未尝试的小事。',
  '把现在的情绪用一种颜色形容，为什么？',
  '如果要把今天压缩成一个词，会是哪个词？',
  '回忆一本最近读过的书里最打动你的句子。',
  '设计一个让陌生人微笑的产品，会是什么？',
  '你最常拖延的事，背后真正的阻力是什么？',
  '描述一个你想成为但目前还不是的人。',
  '如果时间是一张地图，你现在站在哪里？',
  '写下此刻能想到的最离谱的想法，先不要评判。',
  '最近一次让你心流的时刻是什么？在做什么？',
  '如果只能保留三件物品，你会留下什么？',
  '描述一个你想问但没人能回答的问题。',
  '想象十年后的自己给现在的你一句忠告。',
  '你最想"删除"的一段记忆是什么？为什么？',
]

// ---------- 工具函数 ----------
function loadIdeas(): Idea[] {
  const arr = loadFromStorage<unknown[]>(STORAGE_KEY, [])
  if (!Array.isArray(arr)) return []
  return arr.filter((x): x is Idea =>
    typeof x === 'object' && x !== null && 'id' in x && 'text' in x && 'createdAt' in x
  ).slice(0, MAX_IDEAS)
}

function saveIdeas(ideas: Idea[]) {
  debouncedSaveToStorage(STORAGE_KEY, ideas, 300)
}

function parseTags(text: string): string[] {
  const matches = text.match(/#[\u4e00-\u9fa5\w]+/g) || []
  // 去重并保留顺序
  const seen = new Set<string>()
  const result: string[] = []
  for (const t of matches) {
    const lower = t.toLowerCase()
    if (!seen.has(lower)) {
      seen.add(lower)
      result.push(t)
    }
  }
  return result
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function formatTime(ts: number): string {
  const now = Date.now()
  const diff = now - ts
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} 天前`
  return new Date(ts).toLocaleDateString('zh-CN')
}

function formatFullTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}

// ---------- 主组件 ----------
export default function IdeaStream() {
  const [ideas, setIdeas] = useState<Idea[]>(() => loadIdeas())
  const [input, setInput] = useState('')
  const [color, setColor] = useState<string>(IDEA_COLORS[0])
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [showStarredOnly, setShowStarredOnly] = useState(false)
  const [inspirationIdx, setInspirationIdx] = useState(() =>
    Math.floor(Math.random() * INSPIRATION_PROMPTS.length)
  )
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 持久化
  useEffect(() => {
    saveIdeas(ideas)
  }, [ideas])

  // 自动调整 textarea 高度
  const adjustTextarea = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [])

  useEffect(() => {
    adjustTextarea()
  }, [input, adjustTextarea])

  // 添加想法
  const addIdea = useCallback(() => {
    const text = input.trim()
    if (!text) return
    const newIdea: Idea = {
      id: genId(),
      text,
      tags: parseTags(text),
      color,
      starred: false,
      createdAt: Date.now(),
    }
    setIdeas((prev) => [newIdea, ...prev].slice(0, MAX_IDEAS))
    setInput('')
    // 自动循环颜色
    setColor(IDEA_COLORS[(IDEA_COLORS.indexOf(color) + 1) % IDEA_COLORS.length])
  }, [input, color])

  // 删除
  const deleteIdea = useCallback((id: string) => {
    setIdeas((prev) => prev.filter((i) => i.id !== id))
  }, [])

  // 切换星标
  const toggleStar = useCallback((id: string) => {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, starred: !i.starred } : i)))
  }, [])

  // 复制文本
  const copyIdea = useCallback((idea: Idea) => {
    navigator.clipboard?.writeText(idea.text).then(() => {
      setCopiedId(idea.id)
      setTimeout(() => setCopiedId(null), 1200)
    }).catch(() => {})
  }, [])

  // 换一条灵感提示
  const refreshInspiration = useCallback(() => {
    setInspirationIdx((prev) => (prev + 1) % INSPIRATION_PROMPTS.length)
  }, [])

  // 清空所有
  const clearAll = useCallback(() => {
    if (ideas.length === 0) return
    if (window.confirm(`确定要清空全部 ${ideas.length} 条想法吗？此操作不可撤销。`)) {
      setIdeas([])
    }
  }, [ideas.length])

  // 导出 Markdown
  const exportMarkdown = useCallback(() => {
    if (ideas.length === 0) return
    const lines: string[] = ['# 我的灵感流', '', `> 共 ${ideas.length} 条 · 导出时间 ${formatFullTime(Date.now())}`, '']
    // 按标签分组
    const byTag = new Map<string, Idea[]>()
    const noTag: Idea[] = []
    ideas.forEach((idea) => {
      if (idea.tags.length === 0) {
        noTag.push(idea)
      } else {
        idea.tags.forEach((t) => {
          if (!byTag.has(t)) byTag.set(t, [])
          byTag.get(t)!.push(idea)
        })
      }
    })
    if (noTag.length > 0) {
      lines.push('## 未分类', '')
      noTag.forEach((i) => {
        lines.push(`- ${i.text.replace(/\n/g, ' '  )}  `)
        lines.push(`  _${formatFullTime(i.createdAt)}_`)
      })
      lines.push('')
    }
    Array.from(byTag.entries()).sort((a, b) => b[1].length - a[1].length).forEach(([tag, items]) => {
      lines.push(`## ${tag} (${items.length})`, '')
      items.forEach((i) => {
        lines.push(`- ${i.text.replace(/\n/g, ' '  )}  `)
        lines.push(`  _${formatFullTime(i.createdAt)}_`)
      })
      lines.push('')
    })
    const md = lines.join('\n')
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ideastream-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [ideas])

  // 收集所有标签及计数
  const allTags = useMemo(() => {
    const counts = new Map<string, number>()
    ideas.forEach((i) => {
      i.tags.forEach((t) => {
        const key = t.toLowerCase()
        counts.set(key, (counts.get(key) || 0) + 1)
      })
    })
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
  }, [ideas])

  // 过滤后的想法
  const filteredIdeas = useMemo(() => {
    let list = ideas
    if (showStarredOnly) list = list.filter((i) => i.starred)
    if (activeTag) {
      list = list.filter((i) => i.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase()))
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((i) => i.text.toLowerCase().includes(q))
    }
    return list
  }, [ideas, showStarredOnly, activeTag, search])

  // 统计
  const stats = useMemo(() => ({
    total: ideas.length,
    starred: ideas.filter((i) => i.starred).length,
    today: ideas.filter((i) => {
      const d = new Date(i.createdAt)
      const now = new Date()
      return d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
    }).length,
    tags: allTags.length,
  }), [ideas, allTags.length])

  // 键盘快捷键
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      addIdea()
    }
  }, [addIdea])

  return (
    <div className="ideastream-root">
      {/* 顶部输入区 */}
      <div className="ideastream-composer">
        <div className="ideastream-composer-inner">
          <div className="ideastream-color-picker" role="radiogroup" aria-label="选择颜色">
            {IDEA_COLORS.map((c) => (
              <button
                key={c}
                className={`ideastream-color-dot${color === c ? ' ideastream-color-dot-active' : ''}`}
                style={{ background: c, '--dot-color': c } as React.CSSProperties}
                onClick={() => setColor(c)}
                aria-label={`选择颜色 ${c}`}
                aria-pressed={color === c}
              />
            ))}
          </div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="捕捉一个想法… 用 #标签 分类，Ctrl+Enter 保存"
            className="ideastream-textarea"
            rows={1}
          />
          <div className="ideastream-composer-actions">
            <span className="ideastream-char-count">{input.length}</span>
            <button
              className="ideastream-submit-btn"
              onClick={addIdea}
              disabled={!input.trim()}
              style={{ '--btn-color': color } as React.CSSProperties}
            >
              记录
            </button>
          </div>
        </div>
        {/* 实时标签预览 */}
        {input.trim() && parseTags(input).length > 0 && (
          <div className="ideastream-tag-preview">
            {parseTags(input).map((t) => (
              <span key={t} className="ideastream-tag-chip">{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* 工具栏 */}
      <div className="ideastream-toolbar">
        <div className="ideastream-search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索想法..."
            className="ideastream-search-input"
          />
          {search && (
            <button className="ideastream-clear-btn" onClick={() => setSearch('')} aria-label="清除搜索">×</button>
          )}
        </div>
        <div className="ideastream-toolbar-actions">
          <button
            className={`ideastream-tool-btn${showStarredOnly ? ' ideastream-tool-btn-active' : ''}`}
            onClick={() => setShowStarredOnly((v) => !v)}
            title="只看星标"
          >
            ★ {stats.starred}
          </button>
          <button
            className="ideastream-tool-btn"
            onClick={exportMarkdown}
            disabled={ideas.length === 0}
            title="导出 Markdown"
          >
            导出
          </button>
          <button
            className="ideastream-tool-btn ideastream-danger"
            onClick={clearAll}
            disabled={ideas.length === 0}
            title="清空所有"
          >
            清空
          </button>
        </div>
      </div>

      {/* 标签筛选条 */}
      {allTags.length > 0 && (
        <div className="ideastream-tags-bar">
          <button
            className={`ideastream-tag-filter${activeTag === null ? ' ideastream-tag-filter-active' : ''}`}
            onClick={() => setActiveTag(null)}
          >
            全部 {ideas.length}
          </button>
          {allTags.slice(0, 12).map(({ tag, count }) => (
            <button
              key={tag}
              className={`ideastream-tag-filter${activeTag?.toLowerCase() === tag ? ' ideastream-tag-filter-active' : ''}`}
              onClick={() => setActiveTag(activeTag?.toLowerCase() === tag ? null : tag)}
            >
              {tag} {count}
            </button>
          ))}
        </div>
      )}

      {/* 统计条 */}
      <div className="ideastream-stats">
        <span><strong>{stats.total}</strong> 总想法</span>
        <span className="ideastream-stats-sep">·</span>
        <span><strong>{stats.today}</strong> 今日</span>
        <span className="ideastream-stats-sep">·</span>
        <span><strong>{stats.starred}</strong> 星标</span>
        <span className="ideastream-stats-sep">·</span>
        <span><strong>{stats.tags}</strong> 标签</span>
        {filteredIdeas.length !== ideas.length && (
          <>
            <span className="ideastream-stats-sep">·</span>
            <span className="ideastream-stats-filtered">筛选 {filteredIdeas.length}</span>
          </>
        )}
      </div>

      {/* 想法流 */}
      <div className="ideastream-stream">
        {filteredIdeas.length === 0 ? (
          ideas.length === 0 ? (
            <div className="ideastream-empty">
              <div className="ideastream-empty-orb" />
              <div className="ideastream-empty-prompt">
                <div className="ideastream-empty-prompt-label">今日灵感</div>
                <div className="ideastream-empty-prompt-text">{INSPIRATION_PROMPTS[inspirationIdx]}</div>
                <button className="ideastream-empty-refresh" onClick={refreshInspiration}>
                  换一个 →
                </button>
              </div>
              <div className="ideastream-empty-hint">在上方输入框捕捉你的第一个想法</div>
            </div>
          ) : (
            <div className="ideastream-empty">
              <div className="ideastream-empty-icon">∅</div>
              <div className="ideastream-empty-title">没有匹配的想法</div>
              <div className="ideastream-empty-sub">尝试更换搜索词或清除筛选</div>
            </div>
          )
        ) : (
          filteredIdeas.map((idea, idx) => (
            <div
              key={idea.id}
              className="ideastream-card"
              style={{
                '--card-color': idea.color,
                animationDelay: `${Math.min(idx * 30, 300)}ms`,
              } as React.CSSProperties}
            >
              <div className="ideastream-card-accent" />
              <div className="ideastream-card-body">
                <div className="ideastream-card-text">{idea.text}</div>
                {idea.tags.length > 0 && (
                  <div className="ideastream-card-tags">
                    {idea.tags.map((t) => (
                      <span
                        key={t}
                        className="ideastream-card-tag"
                        onClick={() => setActiveTag(t.toLowerCase())}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="ideastream-card-meta">
                  <span className="ideastream-card-time" title={formatFullTime(idea.createdAt)}>
                    {formatTime(idea.createdAt)}
                  </span>
                  <div className="ideastream-card-actions">
                    <button
                      className={`ideastream-card-action${idea.starred ? ' ideastream-card-action-active' : ''}`}
                      onClick={() => toggleStar(idea.id)}
                      title="星标"
                    >
                      ★
                    </button>
                    <button
                      className="ideastream-card-action"
                      onClick={() => copyIdea(idea)}
                      title="复制"
                    >
                      {copiedId === idea.id ? '✓' : '⧉'}
                    </button>
                    <button
                      className="ideastream-card-action ideastream-card-action-danger"
                      onClick={() => deleteIdea(idea.id)}
                      title="删除"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{IDEASTREAM_STYLES}</style>
    </div>
  )
}

// ---------- 样式 ----------
const IDEASTREAM_STYLES = `
.ideastream-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(124, 108, 240, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(0, 214, 193, 0.06) 0%, transparent 50%),
    var(--bg-primary, #0a0a14);
  color: var(--text-primary, #f0f0ff);
  font-family: 'Plus Jakarta Sans', 'Noto Sans SC', system-ui, sans-serif;
  overflow: hidden;
}

/* === 输入区 === */
.ideastream-composer {
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--window-border, rgba(108, 92, 231, 0.2));
  background: rgba(0, 0, 0, 0.15);
}

.ideastream-composer-inner {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(124, 108, 240, 0.25);
  border-radius: 14px;
  padding: 10px 12px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.ideastream-composer-inner:focus-within {
  border-color: rgba(124, 108, 240, 0.6);
  box-shadow: 0 0 0 3px rgba(124, 108, 240, 0.12);
}

.ideastream-color-picker {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 4px 6px 4px 0;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  padding-right: 10px;
}

.ideastream-color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
}

.ideastream-color-dot:hover {
  transform: scale(1.15);
}

.ideastream-color-dot-active {
  border-color: rgba(255, 255, 255, 0.85);
  box-shadow: 0 0 10px var(--dot-color);
}

.ideastream-textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary, #f0f0ff);
  font-size: 15px;
  font-family: inherit;
  line-height: 1.55;
  resize: none;
  min-height: 24px;
  max-height: 200px;
}

.ideastream-textarea::placeholder {
  color: var(--text-secondary, #6a6a85);
}

.ideastream-composer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.ideastream-char-count {
  font-size: 11px;
  color: var(--text-secondary, #6a6a85);
  font-family: 'JetBrains Mono', monospace;
  min-width: 24px;
  text-align: right;
}

.ideastream-submit-btn {
  padding: 7px 18px;
  border-radius: 9px;
  border: none;
  background: var(--btn-color, #7c6cf0);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
  font-family: inherit;
  letter-spacing: 0.02em;
}

.ideastream-submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(124, 108, 240, 0.4);
}

.ideastream-submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.ideastream-submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ideastream-tag-preview {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
  padding-left: 4px;
}

.ideastream-tag-chip {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(124, 108, 240, 0.18);
  color: #c5bdff;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  animation: ideastream-chip-in 0.2s ease-out;
}

@keyframes ideastream-chip-in {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}

/* === 工具栏 === */
.ideastream-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--window-border, rgba(108, 92, 231, 0.15));
}

.ideastream-search-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 9px;
  color: var(--text-secondary, #8a8aa0);
  transition: border-color 0.2s;
}

.ideastream-search-wrap:focus-within {
  border-color: rgba(124, 108, 240, 0.5);
  color: var(--text-primary, #f0f0ff);
}

.ideastream-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary, #f0f0ff);
  font-size: 13px;
  font-family: inherit;
}

.ideastream-search-input::placeholder {
  color: var(--text-secondary, #6a6a85);
}

.ideastream-clear-btn {
  background: none;
  border: none;
  color: var(--text-secondary, #6a6a85);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0 2px;
}

.ideastream-clear-btn:hover {
  color: var(--text-primary, #f0f0ff);
}

.ideastream-toolbar-actions {
  display: flex;
  gap: 6px;
}

.ideastream-tool-btn {
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: var(--text-secondary, #a0a0b5);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.ideastream-tool-btn:hover:not(:disabled) {
  background: rgba(124, 108, 240, 0.12);
  border-color: rgba(124, 108, 240, 0.3);
  color: var(--text-primary, #f0f0ff);
}

.ideastream-tool-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.ideastream-tool-btn-active {
  background: rgba(245, 158, 11, 0.18);
  border-color: rgba(245, 158, 11, 0.5);
  color: #fbbf24;
}

.ideastream-danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.15) !important;
  border-color: rgba(239, 68, 68, 0.4) !important;
  color: #f87171 !important;
}

/* === 标签筛选条 === */
.ideastream-tags-bar {
  display: flex;
  gap: 6px;
  padding: 8px 20px;
  overflow-x: auto;
  border-bottom: 1px solid var(--window-border, rgba(108, 92, 231, 0.1));
  scrollbar-width: thin;
}

.ideastream-tags-bar::-webkit-scrollbar {
  height: 4px;
}

.ideastream-tags-bar::-webkit-scrollbar-thumb {
  background: rgba(124, 108, 240, 0.3);
  border-radius: 2px;
}

.ideastream-tag-filter {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid transparent;
  color: var(--text-secondary, #a0a0b5);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
}

.ideastream-tag-filter:hover {
  background: rgba(124, 108, 240, 0.1);
  color: var(--text-primary, #f0f0ff);
}

.ideastream-tag-filter-active {
  background: rgba(124, 108, 240, 0.25);
  border-color: rgba(124, 108, 240, 0.5);
  color: #c5bdff;
}

/* === 统计条 === */
.ideastream-stats {
  padding: 8px 20px;
  font-size: 11px;
  color: var(--text-secondary, #6a6a85);
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--window-border, rgba(108, 92, 231, 0.1));
}

.ideastream-stats strong {
  color: var(--text-primary, #d0d0e0);
  font-weight: 700;
  margin-right: 3px;
}

.ideastream-stats-sep {
  opacity: 0.4;
}

.ideastream-stats-filtered {
  color: #c5bdff;
  font-weight: 600;
}

/* === 想法流 === */
.ideastream-stream {
  flex: 1;
  overflow-y: auto;
  padding: 14px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ideastream-stream::-webkit-scrollbar {
  width: 8px;
}

.ideastream-stream::-webkit-scrollbar-thumb {
  background: rgba(124, 108, 240, 0.3);
  border-radius: 4px;
}

/* === 卡片 === */
.ideastream-card {
  display: flex;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  animation: ideastream-card-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  transition: border-color 0.2s, transform 0.2s, background 0.2s;
}

@keyframes ideastream-card-in {
  from { opacity: 0; transform: translateY(-8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.ideastream-card:hover {
  border-color: rgba(124, 108, 240, 0.3);
  background: rgba(255, 255, 255, 0.04);
  transform: translateX(2px);
}

.ideastream-card-accent {
  width: 3px;
  background: var(--card-color, #7c6cf0);
  flex-shrink: 0;
  box-shadow: 0 0 12px var(--card-color, #7c6cf0);
}

.ideastream-card-body {
  flex: 1;
  padding: 12px 14px;
  min-width: 0;
}

.ideastream-card-text {
  font-size: 14px;
  line-height: 1.65;
  color: var(--text-primary, #e8e8f5);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.ideastream-card-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.ideastream-card-tag {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(124, 108, 240, 0.15);
  color: #c5bdff;
  cursor: pointer;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  transition: background 0.15s;
}

.ideastream-card-tag:hover {
  background: rgba(124, 108, 240, 0.3);
}

.ideastream-card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.ideastream-card-time {
  font-size: 10px;
  color: var(--text-secondary, #6a6a85);
  font-family: 'JetBrains Mono', monospace;
}

.ideastream-card-actions {
  display: flex;
  gap: 2px;
}

.ideastream-card-action {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--text-secondary, #6a6a85);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ideastream-card-action:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary, #f0f0ff);
}

.ideastream-card-action-active {
  color: #fbbf24;
}

.ideastream-card-action-danger:hover {
  background: rgba(239, 68, 68, 0.15) !important;
  color: #f87171 !important;
}

/* === 空状态 === */
.ideastream-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  gap: 18px;
}

.ideastream-empty-orb {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 35%, rgba(124, 108, 240, 0.6), rgba(124, 108, 240, 0.1) 60%, transparent),
    radial-gradient(circle at 70% 70%, rgba(0, 214, 193, 0.4), transparent 60%);
  filter: blur(0.5px);
  animation: ideastream-orb-pulse 4s ease-in-out infinite;
  box-shadow: 0 0 60px rgba(124, 108, 240, 0.3);
}

@keyframes ideastream-orb-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 60px rgba(124, 108, 240, 0.3); }
  50% { transform: scale(1.08); box-shadow: 0 0 80px rgba(124, 108, 240, 0.5); }
}

.ideastream-empty-prompt {
  max-width: 440px;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(124, 108, 240, 0.2);
  border-radius: 14px;
  position: relative;
}

.ideastream-empty-prompt-label {
  font-size: 10px;
  font-weight: 700;
  color: #c5bdff;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 10px;
}

.ideastream-empty-prompt-text {
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-primary, #e8e8f5);
  font-weight: 500;
  font-family: 'Noto Serif SC', 'Noto Sans SC', serif;
}

.ideastream-empty-refresh {
  margin-top: 14px;
  padding: 5px 14px;
  border-radius: 6px;
  background: rgba(124, 108, 240, 0.15);
  border: 1px solid rgba(124, 108, 240, 0.3);
  color: #c5bdff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.ideastream-empty-refresh:hover {
  background: rgba(124, 108, 240, 0.25);
  transform: translateX(2px);
}

.ideastream-empty-hint {
  font-size: 12px;
  color: var(--text-secondary, #6a6a85);
  opacity: 0.7;
}

.ideastream-empty-icon {
  font-size: 56px;
  color: var(--text-secondary, #4a4a60);
  font-weight: 200;
}

.ideastream-empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #c0c0d0);
}

.ideastream-empty-sub {
  font-size: 12px;
  color: var(--text-secondary, #6a6a85);
}

/* === 亮色主题 === */
:root.light .ideastream-root {
  background:
    radial-gradient(ellipse at 20% 0%, rgba(124, 108, 240, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(0, 214, 193, 0.05) 0%, transparent 50%),
    #f7f7fc;
}

:root.light .ideastream-composer {
  background: rgba(0, 0, 0, 0.02);
}

:root.light .ideastream-composer-inner {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(124, 108, 240, 0.3);
}

:root.light .ideastream-color-picker {
  border-color: rgba(0, 0, 0, 0.08);
}

:root.light .ideastream-textarea,
:root.light .ideastream-search-input {
  color: #1a1a2e;
}

:root.light .ideastream-search-wrap {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.08);
}

:root.light .ideastream-tool-btn {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.06);
  color: #555;
}

:root.light .ideastream-card {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(0, 0, 0, 0.06);
}

:root.light .ideastream-card:hover {
  background: rgba(255, 255, 255, 0.95);
}

:root.light .ideastream-card-text {
  color: #1a1a2e;
}

:root.light .ideastream-empty-prompt {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(124, 108, 240, 0.25);
}

:root.light .ideastream-empty-prompt-text {
  color: #1a1a2e;
}

:root.light .ideastream-stats strong,
:root.light .ideastream-card-time {
  color: #555;
}
`
