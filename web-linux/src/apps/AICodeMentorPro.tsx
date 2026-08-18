/**
 * AICodeMentor Pro - AI 代码导师
 * v110 创新功能
 *
 * 核心价值：
 * - 基于 Pollinations.ai 公开免费 API 的真实 AI 编程导师
 * - 代码解释：粘贴任何代码，AI 逐行解释工作原理
 * - 代码审查：自动检测代码问题，给出改进建议和最佳实践
 * - 算法教学：选择算法类型，AI 生成讲解 + 可视化示例
 * - 调试助手：粘贴错误信息，AI 分析原因并给出修复方案
 * - 面试准备：生成技术面试题 + 参考答案
 * - 学习路径：根据目标生成个性化学习计划
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'

type Mode = 'explain' | 'review' | 'algo' | 'debug' | 'interview' | 'roadmap'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

const ALGORITHMS = [
  { id: 'bubble', name: '冒泡排序', difficulty: '入门', category: '排序' },
  { id: 'quick', name: '快速排序', difficulty: '中等', category: '排序' },
  { id: 'merge', name: '归并排序', difficulty: '中等', category: '排序' },
  { id: 'binary-search', name: '二分查找', difficulty: '入门', category: '搜索' },
  { id: 'bfs', name: '广度优先搜索', difficulty: '中等', category: '图算法' },
  { id: 'dfs', name: '深度优先搜索', difficulty: '中等', category: '图算法' },
  { id: 'dp', name: '动态规划入门', difficulty: '困难', category: '动态规划' },
  { id: 'greedy', name: '贪心算法', difficulty: '中等', category: '算法范式' },
  { id: 'two-pointer', name: '双指针技巧', difficulty: '入门', category: '技巧' },
  { id: 'sliding-window', name: '滑动窗口', difficulty: '中等', category: '技巧' },
]

const INTERVIEW_TOPICS = [
  'JavaScript 基础', 'React Hooks 原理', 'TypeScript 类型体操',
  '算法与数据结构', '浏览器原理', '网络协议 (HTTP/TCP)',
  '设计模式', '系统设计入门', '前端性能优化', 'CSS 布局',
]

const ROADMAP_GOALS = [
  { id: 'frontend', name: '前端开发工程师', duration: '6 个月' },
  { id: 'fullstack', name: '全栈开发工程师', duration: '12 个月' },
  { id: 'algo', name: '算法竞赛选手', duration: '9 个月' },
  { id: 'python', name: 'Python 数据分析', duration: '4 个月' },
  { id: 'devops', name: 'DevOps 工程师', duration: '8 个月' },
]

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust']

// 简单渲染 markdown 的关键特征
function renderMarkdown(text: string): string {
  let html = text
    .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:700;margin:16px 0 10px;color:#a78bfa;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:17px;font-weight:700;margin:18px 0 12px;color:#7dd3fc;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:19px;font-weight:800;margin:20px 0 14px;color:#fff;">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fbbf24;">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:#f0abfc;">$1</em>')
    .replace(/`{3}(\w+)?\n([\s\S]*?)`{3}/g, (_, __, code) =>
      `<pre style="background:rgba(0,0,0,0.5);padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);overflow:auto;margin:10px 0;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.6;color:#7dd3fc;"><code>${code.trim().replace(/</g, '&lt;')}</code></pre>`
    )
    .replace(/`([^`]+)`/g, (_, code) =>
      `<code style="background:rgba(124,58,237,0.12);padding:1px 6px;border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#c4b5fd;">${code.replace(/</g, '&lt;')}</code>`
    )
    .replace(/^\s*[-*]\s(.+)$/gm, '<li style="margin-left:20px;margin-bottom:4px;">$1</li>')
    .replace(/(?:<\/li>\n)+/g, '</li>')
    .replace(/\n{2,}/g, '</p><p style="margin-bottom:10px;">')
  return `<div style="font-size:13px;line-height:1.75;color:#cbd5e1;"><p style="margin-bottom:10px;">${html}</p></div>`
}

async function pollinateChat(prompt: string, systemPrompt: string): Promise<string> {
  const full = `<s>###System:${systemPrompt}\n###User:${prompt}\n###Assistant:`
  const url = `https://text.pollinations.ai/${encodeURIComponent(full)}?model=openai&seed=${Math.floor(Math.random() * 999999)}`
  try {
    const ctrl = new AbortController()
    const tm = setTimeout(() => ctrl.abort(), 45000)
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(tm)
    if (!res.ok) throw new Error(`API 错误 ${res.status}`)
    const text = await res.text()
    return text.trim() || '（AI 未返回内容，请重试）'
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return '⏱ 请求超时，请检查网络连接后重试。'
    }
    return `⚠ API 调用失败：${e instanceof Error ? e.message : String(e)}。你仍然可以查看本工具提供的示例模板。`
  }
}

export default function AICodeMentorPro() {
  const [mode, setMode] = useState<Mode>('explain')
  const [codeInput, setCodeInput] = useState('')
  const [language, setLanguage] = useState('JavaScript')
  const [algorithm, setAlgorithm] = useState(ALGORITHMS[0].id)
  const [topic, setTopic] = useState(INTERVIEW_TOPICS[0])
  const [goal, setGoal] = useState(ROADMAP_GOALS[0].id)
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [history, setHistory] = useState<{ mode: Mode; input: string; result: string; time: number }[]>(() => {
    try {
      const raw = localStorage.getItem('aicodementor-history')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem('aicodementor-history', JSON.stringify(history.slice(0, 20)))
  }, [history])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = 0
    }
  }, [messages])

  const modeConfig = useMemo<Record<Mode, { label: string; icon: string; desc: string; system: string }>>(() => ({
    explain: {
      label: '代码解释', icon: '📖',
      desc: '粘贴任意代码，AI 将逐行解释工作原理和设计思路',
      system: '你是一位资深编程导师。请详细解释用户提供的代码，逐行说明每一部分的作用，指出核心思想和潜在问题。用中文回答，使用 Markdown 格式，包含小标题和代码块。'
    },
    review: {
      label: '代码审查', icon: '🔍',
      desc: '自动检测 Bug、性能问题、代码异味并给出改进建议',
      system: '你是一位资深代码审查专家。请对用户提供的代码进行全面审查：1) 潜在 Bug 和边界情况 2) 性能瓶颈和优化建议 3) 可读性和命名问题 4) 安全隐患 5) 最佳实践建议。按严重程度排序，每项给出具体改进后的代码示例。用中文 Markdown 回答。'
    },
    algo: {
      label: '算法教学', icon: '🧮',
      desc: '选择算法类型，获得讲解、复杂度分析、可视化示例代码',
      system: '你是一位算法教授。针对用户选择的算法，请给出：1) 算法思想和适用场景 2) 时间/空间复杂度分析 3) JavaScript 实现代码（含详细注释）4) 一步步执行示例 5) 常见变体和面试考点。用中文 Markdown 回答，代码块完整。'
    },
    debug: {
      label: '调试助手', icon: '🐛',
      desc: '粘贴错误信息和代码，AI 分析原因并给出修复方案',
      system: '你是一位调试专家。请根据用户提供的错误信息（和相关代码），：1) 分析错误根本原因 2) 列出最可能的 3 种情况 3) 给出逐步排查方法 4) 提供修复后的代码示例 5) 预防建议。用中文 Markdown 回答。'
    },
    interview: {
      label: '面试准备', icon: '🎯',
      desc: '生成技术面试题 + 详细参考答案，覆盖高频考点',
      system: '你是一位顶级技术面试官。针对用户选择的面试主题，请生成：5 道精选面试题（由浅入深），每题包含：题目、难度标签、考察点、详细参考答案、常见陷阱和追问方向。用中文 Markdown 回答。'
    },
    roadmap: {
      label: '学习路径', icon: '🗺',
      desc: '根据目标，生成个性化分阶段学习计划和资源推荐',
      system: '你是一位职业规划顾问。针对用户的学习目标，生成：1) 分阶段学习路径（按月/周划分）2) 每个阶段的核心知识点 3) 高质量免费学习资源推荐（文档/课程/项目）4) 实战项目建议 5) 学习检查点和评估标准。用中文 Markdown 回答，结构化列出。'
    },
  }), [])

  const runAnalysis = useCallback(async () => {
    let prompt = ''
    switch (mode) {
      case 'explain':
      case 'review':
        if (!codeInput.trim()) { alert('请先输入需要分析的代码'); return }
        prompt = `【编程语言：${language}】\n\n${codeInput}`
        break
      case 'algo':
        const algo = ALGORITHMS.find(a => a.id === algorithm)
        prompt = `请讲解算法：${algo?.name}（${algo?.category} · 难度：${algo?.difficulty}）\n请用 ${language} 给出实现代码。`
        break
      case 'debug':
        if (!codeInput.trim() && !errorMsg.trim()) {
          alert('请输入错误信息或相关代码'); return
        }
        prompt = `【错误信息】\n${errorMsg || '（未提供）'}\n\n【相关代码】\n${codeInput || '（未提供）'}\n\n【编程语言】${language}`
        break
      case 'interview':
        prompt = `面试主题：${topic}\n请生成 5 道高质量面试题，覆盖初级到高级难度。`
        break
      case 'roadmap':
        const g = ROADMAP_GOALS.find(x => x.id === goal)
        prompt = `我的目标是成为：${g?.name}。预计学习周期：${g?.duration}。\n请生成详细的学习路径和阶段里程碑。`
        break
    }

    const userMsg: Message = {
      id: 'u' + Date.now(), role: 'user', content: prompt, timestamp: Date.now(),
    }
    setMessages([userMsg])
    setLoading(true)

    const result = await pollinateChat(prompt, modeConfig[mode].system)
    const assistantMsg: Message = {
      id: 'a' + Date.now(), role: 'assistant', content: result, timestamp: Date.now(),
    }
    setMessages([userMsg, assistantMsg])
    setHistory(prev => [{
      mode, input: prompt.slice(0, 80) + (prompt.length > 80 ? '…' : ''), result: result.slice(0, 80) + '…', time: Date.now()
    }, ...prev].slice(0, 20))
    setLoading(false)
  }, [mode, codeInput, language, algorithm, errorMsg, topic, goal, modeConfig])

  const loadExampleCode = useCallback(() => {
    const examples: Record<Mode, string> = {
      explain: `function debounce(fn, delay) {
  let timer = null
  return function(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}`,
      review: `// 求数组最大值
function findMax(arr) {
  var max = 0
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] > max) max = arr[i]
  }
  return max
}
console.log(findMax([-5, -2, -8]))`,
      algo: '', debug: `// TypeError: Cannot read properties of undefined
const data = await fetch('/api/users')
data.users.forEach(u => console.log(u.name))`,
      interview: '', roadmap: '',
    }
    setCodeInput(examples[mode])
  }, [mode])

  return (
    <div style={{
      display: 'flex', height: '100%', fontFamily: "'Noto Sans SC', 'Space Grotesk', sans-serif",
      color: 'var(--text-primary, #e0e0e8)',
    }}>
      {/* 左侧面板：模式选择 + 输入 */}
      <div style={{
        width: 380, flexShrink: 0, borderRight: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        display: 'flex', flexDirection: 'column', background: 'var(--panel-bg, rgba(15,15,25,0.6))',
      }}>
        {/* Logo */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #7c3aed 0%, #38bdf8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
          }}>🧠</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, background: 'linear-gradient(90deg,#a78bfa,#7dd3fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AI Code Mentor Pro
            </div>
            <div style={{ fontSize: 10, color: '#64748b' }}>v110 · Pollinations.ai</div>
          </div>
        </div>

        {/* 模式按钮 */}
        <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {(Object.keys(modeConfig) as Mode[]).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '10px 8px', borderRadius: 8, fontSize: 11,
              border: '1px solid',
              borderColor: mode === m ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.06)',
              background: mode === m
                ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(56,189,248,0.18))'
                : 'rgba(255,255,255,0.02)',
              color: mode === m ? '#fff' : '#94a3b8',
              cursor: 'pointer', fontWeight: mode === m ? 700 : 500,
              transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>{modeConfig[m].icon}</div>
              {modeConfig[m].label}
            </button>
          ))}
        </div>

        {/* 描述 */}
        <div style={{
          padding: '8px 20px 14px', fontSize: 11, color: '#94a3b8',
          borderBottom: '1px solid rgba(255,255,255,0.04)', lineHeight: 1.5,
        }}>
          <span style={{ color: '#a78bfa', fontWeight: 600 }}>{modeConfig[mode].icon} {modeConfig[mode].label}</span>
          <br />{modeConfig[mode].desc}
        </div>

        {/* 输入区 */}
        <div style={{ padding: '14px 20px', flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {['explain', 'review', 'debug'].includes(mode) && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1' }}>
                  {mode === 'debug' ? '相关代码（可选）' : '代码输入'}
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select value={language} onChange={e => setLanguage(e.target.value)} style={{
                    padding: '3px 8px', fontSize: 10, borderRadius: 4,
                    background: 'rgba(255,255,255,0.04)', color: 'inherit',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <button onClick={loadExampleCode} style={{
                    padding: '3px 10px', fontSize: 10, borderRadius: 4,
                    background: 'rgba(124,58,237,0.15)', color: '#c4b5fd',
                    border: '1px solid rgba(124,58,237,0.25)', cursor: 'pointer', fontWeight: 600,
                  }}>示例</button>
                </div>
              </div>
              <textarea
                value={codeInput}
                onChange={e => setCodeInput(e.target.value)}
                spellCheck={false}
                placeholder={mode === 'debug' ? '粘贴相关代码片段（可选）...' : `粘贴需要${modeConfig[mode].label}的代码...`}
                style={{
                  width: '100%', minHeight: mode === 'debug' ? 100 : 180, padding: 10,
                  borderRadius: 8, fontSize: 12,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  background: 'rgba(0,0,0,0.3)', color: '#cbd5e1',
                  border: '1px solid rgba(255,255,255,0.06)',
                  resize: 'vertical', lineHeight: 1.6,
                }}
              />
            </div>
          )}

          {mode === 'debug' && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
                错误信息 / 异常堆栈
              </label>
              <textarea
                value={errorMsg}
                onChange={e => setErrorMsg(e.target.value)}
                spellCheck={false}
                placeholder="粘贴控制台错误、堆栈跟踪、Unexpected token..."
                style={{
                  width: '100%', minHeight: 100, padding: 10,
                  borderRadius: 8, fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  background: 'rgba(239,68,68,0.05)', color: '#fca5a5',
                  border: '1px solid rgba(239,68,68,0.15)',
                  resize: 'vertical', lineHeight: 1.6,
                }}
              />
            </div>
          )}

          {mode === 'algo' && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 8 }}>
                选择算法主题
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {ALGORITHMS.map(a => (
                  <button key={a.id} onClick={() => setAlgorithm(a.id)} style={{
                    padding: '9px 12px', borderRadius: 8, textAlign: 'left', fontSize: 12,
                    border: '1px solid',
                    borderColor: algorithm === a.id ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.06)',
                    background: algorithm === a.id ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.02)',
                    color: algorithm === a.id ? '#fff' : '#cbd5e1',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontWeight: 500 }}>{a.name}</span>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 10, alignSelf: 'center',
                      background: a.difficulty === '入门' ? 'rgba(16,185,129,0.15)'
                        : a.difficulty === '中等' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                      color: a.difficulty === '入门' ? '#10b981'
                        : a.difficulty === '中等' ? '#f59e0b' : '#ef4444',
                      fontWeight: 600,
                    }}>{a.difficulty}</span>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: '#64748b' }}>代码语言：</span>
                <select value={language} onChange={e => setLanguage(e.target.value)} style={{
                  padding: '3px 8px', fontSize: 10, borderRadius: 4,
                  background: 'rgba(255,255,255,0.04)', color: 'inherit',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          )}

          {mode === 'interview' && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 8 }}>
                面试主题
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {INTERVIEW_TOPICS.map(t => (
                  <button key={t} onClick={() => setTopic(t)} style={{
                    padding: '6px 12px', borderRadius: 999, fontSize: 11,
                    border: '1px solid',
                    borderColor: topic === t ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.06)',
                    background: topic === t ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.02)',
                    color: topic === t ? '#7dd3fc' : '#94a3b8',
                    cursor: 'pointer', fontWeight: topic === t ? 600 : 400,
                  }}>{t}</button>
                ))}
              </div>
            </div>
          )}

          {mode === 'roadmap' && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: 8 }}>
                我的学习目标
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ROADMAP_GOALS.map(g => (
                  <button key={g.id} onClick={() => setGoal(g.id)} style={{
                    padding: '12px 14px', borderRadius: 10, textAlign: 'left',
                    border: '1px solid',
                    borderColor: goal === g.id ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.06)',
                    background: goal === g.id
                      ? 'linear-gradient(90deg, rgba(124,58,237,0.2), rgba(56,189,248,0.08))'
                      : 'rgba(255,255,255,0.02)',
                    color: goal === g.id ? '#fff' : '#cbd5e1',
                    cursor: 'pointer',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{g.name}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>预计学习周期：{g.duration}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 提交按钮 */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={runAnalysis} disabled={loading} style={{
            width: '100%', padding: '12px', borderRadius: 10, border: 'none',
            background: loading
              ? 'linear-gradient(90deg, #555, #666)'
              : 'linear-gradient(90deg, #7c3aed 0%, #5b4cd8 50%, #38bdf8 100%)',
            backgroundSize: '200% 100%',
            color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(124,58,237,0.35)',
          }}>
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                  display: 'inline-block',
                }} /> AI 正在思考中…
              </span>
            ) : `✨ ${modeConfig[mode].label}（免费 AI）`}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>

      {/* 右侧：输出 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{
          padding: '12px 20px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.01)',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1' }}>
            {messages.length === 0 ? '💡 准备就绪 - 点击左侧按钮开始 AI 辅导' : `📝 分析结果（${messages.length} 条）`}
          </span>
          {history.length > 0 && (
            <select
              value=""
              onChange={e => {
                const idx = parseInt(e.target.value)
                if (!isNaN(idx) && history[idx]) {
                  const h = history[idx]
                  setMessages([{
                    id: 'hist', role: 'assistant', content: h.result, timestamp: h.time,
                  }])
                }
              }}
              style={{
                padding: '4px 10px', fontSize: 11, borderRadius: 6,
                background: 'rgba(255,255,255,0.04)', color: '#94a3b8',
                border: '1px solid rgba(255,255,255,0.08)', maxWidth: 240,
              }}
            >
              <option value="">📚 历史记录（{history.length}）</option>
              {history.map((h, i) => (
                <option key={i} value={i}>
                  [{modeConfig[h.mode]?.label}] {new Date(h.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - {h.input.slice(0, 20)}
                </option>
              ))}
            </select>
          )}
        </div>
        <div ref={outputRef} style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {messages.length === 0 ? (
            <div style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: '#64748b',
            }}>
              <div style={{ fontSize: 64, marginBottom: 20, opacity: 0.4 }}>
                {modeConfig[mode].icon}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
                {modeConfig[mode].label}
              </div>
              <div style={{ fontSize: 12, maxWidth: 420, textAlign: 'center', lineHeight: 1.7 }}>
                {modeConfig[mode].desc}
                <br /><br />
                <span style={{ color: '#a78bfa' }}>本工具基于 Pollinations.ai 公开免费 API，无需配置 Key，开箱即用。</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900, margin: '0 auto' }}>
              {messages.map(m => (
                <div key={m.id} style={{
                  display: 'flex', gap: 12,
                  flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: m.role === 'user'
                      ? 'linear-gradient(135deg,#38bdf8,#0ea5e9)'
                      : 'linear-gradient(135deg,#7c3aed,#5b4cd8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: '#fff',
                  }}>
                    {m.role === 'user' ? '我' : 'AI'}
                  </div>
                  <div style={{
                    flex: 1, padding: '14px 18px', borderRadius: 14,
                    background: m.role === 'user'
                      ? 'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(14,165,233,0.06))'
                      : 'var(--panel-bg, rgba(20,20,35,0.75))',
                    border: '1px solid',
                    borderColor: m.role === 'user' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.06)',
                    maxWidth: '85%',
                  }}>
                    {m.role === 'user' ? (
                      <pre style={{
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        fontSize: 12, color: '#e0e0e8',
                        fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6,
                      }}>{m.content}</pre>
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
                    )}
                    <div style={{
                      marginTop: 8, fontSize: 10, color: '#475569',
                      textAlign: m.role === 'user' ? 'right' : 'left',
                    }}>
                      {new Date(m.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
