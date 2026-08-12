import { useState, useCallback, useEffect, useRef } from 'react'
import {
  SparklesIcon, WandIcon, CopyIcon, CheckIcon, RefreshCwIcon,
  DownloadIcon, StarIcon, FileTextIcon, LightbulbIcon, ZapIcon,
  SaveIcon, TrashIcon, SettingsIcon, WhiteboardIcon as PenIcon
} from '../icons'
import {
  History as HistoryIcon,
  Eye as EyeIcon,
} from 'lucide-react'

const WRITING_SCENES = [
  { id: 'article', name: '文章写作', icon: '📝', description: '撰写博客文章、新闻报道、专栏评论' },
  { id: 'email', name: '商务邮件', icon: '📧', description: '商务邮件、求职信、沟通信函' },
  { id: 'story', name: '故事创作', icon: '📖', description: '短篇小说、童话、剧本片段' },
  { id: 'poetry', name: '诗歌创作', icon: '🎭', description: '现代诗、古诗风格、歌词' },
  { id: 'speech', name: '演讲稿', icon: '🎤', description: '演讲稿、致辞、分享会发言稿' },
  { id: 'summary', name: '摘要提炼', icon: '📋', description: '文章摘要、要点整理、报告提炼' },
  { id: 'translate', name: '翻译润色', icon: '🌍', description: '中英互译、文本润色、风格转换' },
  { id: 'code-doc', name: '代码文档', icon: '💻', description: '技术文档、API说明、README撰写' },
  { id: 'marketing', name: '营销文案', icon: '📢', description: '广告语、产品描述、社交媒体文案' },
  { id: 'academic', name: '学术写作', icon: '🎓', description: '论文框架、研究综述、学术摘要' },
]

const WRITING_STYLES = [
  { id: 'professional', name: '专业正式', prompt: '使用专业、正式的语言风格，句子严谨，逻辑清晰。' },
  { id: 'casual', name: '轻松口语', prompt: '使用轻松、口语化的表达，贴近日常对话。' },
  { id: 'literary', name: '文学典雅', prompt: '使用优美、典雅的文学语言，注重修辞和意境。' },
  { id: 'concise', name: '简洁精炼', prompt: '言简意赅，用最少的文字表达最丰富的内容。' },
  { id: 'persuasive', name: '说服力强', prompt: '逻辑严密，论据充分，具有说服力。' },
  { id: 'creative', name: '创意十足', prompt: '富有想象力，运用比喻、排比等修辞。' },
]

const TONES = [
  { id: 'neutral', name: '中立' },
  { id: 'positive', name: '积极' },
  { id: 'humorous', name: '幽默' },
  { id: 'serious', name: '严肃' },
  { id: 'enthusiastic', name: '热情' },
  { id: 'analytical', name: '分析' },
]

interface HistoryItem {
  id: string
  scene: string
  prompt: string
  result: string
  wordCount: number
  timestamp: number
}

interface Template {
  id: string
  name: string
  content: string
  scene: string
  createdAt: number
}

const STORAGE_KEYS = {
  HISTORY: 'weblinux-aicraft-history',
  TEMPLATES: 'weblinux-aicraft-templates',
  SETTINGS: 'weblinux-aicraft-settings',
}

const MAX_HISTORY = 100
const MAX_TEMPLATES = 50

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch { /* ignore */ }
  return defaultValue
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* ignore */ }
}

const AICraft = () => {
  const [selectedScene, setSelectedScene] = useState(WRITING_SCENES[0])
  const [selectedStyle, setSelectedStyle] = useState(WRITING_STYLES[0])
  const [selectedTone, setSelectedTone] = useState(TONES[0])
  const [wordCount, setWordCount] = useState(300)
  const [creativity, setCreativity] = useState(0.7)
  const [userPrompt, setUserPrompt] = useState('')
  const [generatedText, setGeneratedText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>(() => loadFromStorage(STORAGE_KEYS.HISTORY, []))
  const [templates, setTemplates] = useState<Template[]>(() => loadFromStorage(STORAGE_KEYS.TEMPLATES, []))
  const [activeTab, setActiveTab] = useState<'write' | 'history' | 'templates'>('write')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.HISTORY, history)
  }, [history])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TEMPLATES, templates)
  }, [templates])

  const buildPrompt = useCallback(() => {
    const styleDesc = WRITING_STYLES.find(s => s.id === selectedStyle.id)?.prompt || ''
    const sceneDesc = selectedScene.description
    
    return `你是一位顶级的中文写作助手。请根据以下要求创作：

【写作类型】${selectedScene.name}
【写作要求】${sceneDesc}
【语言风格】${selectedStyle.name}：${styleDesc}
【语气】${selectedTone.name}
【目标字数】约${wordCount}字
【创意程度】${creativity > 0.7 ? '高' : creativity > 0.4 ? '中' : '低'}

【用户需求】
${userPrompt || '请根据以上要求自由创作一篇优秀的作品。'}

请直接输出创作内容，不需要额外的解释或说明。使用中文创作。`
  }, [selectedScene, selectedStyle, selectedTone, wordCount, creativity, userPrompt])

  const generateContent = useCallback(async () => {
    if (isGenerating) {
      abortRef.current?.abort()
      setIsGenerating(false)
      return
    }

    setIsGenerating(true)
    setGeneratedText('')
    abortRef.current = new AbortController()

    const prompt = buildPrompt()

    try {
      const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: '你是一位顶级的中文写作助手，擅长各种文体创作。请直接输出创作内容，不要添加任何解释、说明或元评论。' },
            { role: 'user', content: prompt }
          ],
          model: 'openai',
          temperature: creativity,
          max_tokens: wordCount * 2,
          stream: true,
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error(`API请求失败: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let result = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        try {
          const lines = chunk.split('\n\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content || parsed.content || ''
                if (content) {
                  result += content
                  setGeneratedText(result)
                }
              } catch {
                if (!data.startsWith('{')) {
                  result += data
                  setGeneratedText(result)
                }
              }
            }
          }
        } catch {
          result += chunk
          setGeneratedText(result)
        }
      }

      if (result.trim()) {
        const item: HistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          scene: selectedScene.name,
          prompt: userPrompt,
          result: result,
          wordCount: result.length,
          timestamp: Date.now(),
        }
        setHistory(prev => [item, ...prev.filter(h => h.result !== result)].slice(0, MAX_HISTORY))
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setGeneratedText(prev => prev + '\n\n[已停止生成]')
      } else {
        console.error('Generation error:', err)
        setGeneratedText('生成失败，请重试。如果问题持续存在，请检查网络连接。')
      }
    } finally {
      setIsGenerating(false)
    }
  }, [isGenerating, buildPrompt, selectedScene, userPrompt, wordCount, creativity])

  const copyToClipboard = useCallback(async () => {
    if (generatedText) {
      try {
        await navigator.clipboard.writeText(generatedText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        const textarea = document.createElement('textarea')
        textarea.value = generatedText
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }, [generatedText])

  const downloadText = useCallback(() => {
    if (!generatedText) return
    const blob = new Blob([generatedText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedScene.name}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [generatedText, selectedScene])

  const saveAsTemplate = useCallback(() => {
    if (!generatedText) return
    const name = prompt('请输入模板名称：')
    if (!name) return
    const template: Template = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      content: generatedText,
      scene: selectedScene.name,
      createdAt: Date.now(),
    }
    setTemplates(prev => [template, ...prev].slice(0, MAX_TEMPLATES))
  }, [generatedText, selectedScene])

  const restoreFromHistory = useCallback((item: HistoryItem) => {
    setUserPrompt(item.prompt)
    setGeneratedText(item.result)
  }, [])

  const deleteHistoryItem = useCallback((id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id))
  }, [])

  const clearHistory = useCallback(() => {
    if (confirm('确定要清空所有历史记录吗？')) {
      setHistory([])
    }
  }, [])

  const useTemplate = useCallback((template: Template) => {
    setGeneratedText(template.content)
    setUserPrompt(`基于模板"${template.name}"继续创作`)
  }, [])

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id))
  }, [])

  const clearTemplates = useCallback(() => {
    if (confirm('确定要清空所有模板吗？')) {
      setTemplates([])
    }
  }, [])

  const previewPrompt = useCallback(() => {
    alert('即将发送给 AI 的完整提示词：\n\n' + buildPrompt())
  }, [buildPrompt])

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)',
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 20px',
      borderBottom: '1px solid var(--window-border)',
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%)',
    },
    title: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '16px',
      fontWeight: 600,
    },
    tabsContainer: {
      display: 'flex',
      gap: '4px',
      background: 'rgba(255,255,255,0.05)',
      padding: '4px',
      borderRadius: '10px',
    },
    tab: {
      padding: '6px 14px',
      borderRadius: '8px',
      border: 'none',
      background: 'transparent',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      fontSize: '13px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.2s',
    },
    activeTab: {
      background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
      color: '#fff',
    },
    mainContent: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
    },
    leftPanel: {
      width: '320px',
      borderRight: '1px solid var(--window-border)',
      padding: '20px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    rightPanel: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    sectionTitle: {
      fontSize: '13px',
      fontWeight: 600,
      color: 'var(--text-secondary)',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    sceneGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
    },
    sceneCard: {
      padding: '10px',
      borderRadius: '10px',
      border: '1px solid var(--window-border)',
      background: 'rgba(255,255,255,0.02)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      textAlign: 'center',
    },
    sceneCardActive: {
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(236, 72, 153, 0.2) 100%)',
      borderColor: '#8b5cf6',
      transform: 'scale(1.02)',
    },
    sceneIcon: {
      fontSize: '24px',
      marginBottom: '4px',
    },
    sceneName: {
      fontSize: '12px',
      fontWeight: 500,
    },
    selectGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    },
    select: {
      padding: '8px 10px',
      borderRadius: '8px',
      border: '1px solid var(--window-border)',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)',
      fontSize: '13px',
      cursor: 'pointer',
      outline: 'none',
    },
    sliderContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    },
    slider: {
      width: '100%',
      height: '6px',
      borderRadius: '3px',
      background: 'var(--window-border)',
      cursor: 'pointer',
    },
    inputArea: {
      padding: '20px',
      borderBottom: '1px solid var(--window-border)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    },
    textarea: {
      width: '100%',
      minHeight: '100px',
      padding: '12px',
      borderRadius: '10px',
      border: '1px solid var(--window-border)',
      background: 'rgba(255,255,255,0.03)',
      color: 'var(--text-primary)',
      fontSize: '14px',
      resize: 'vertical',
      outline: 'none',
      fontFamily: 'inherit',
      lineHeight: 1.6,
    },
    actionBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 20px',
      borderBottom: '1px solid var(--window-border)',
      background: 'rgba(255,255,255,0.02)',
    },
    generateBtn: {
      padding: '10px 24px',
      borderRadius: '10px',
      border: 'none',
      background: isGenerating 
        ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)'
        : 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
      boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
    },
    resultArea: {
      flex: 1,
      padding: '20px',
      overflowY: 'auto',
    },
    resultContent: {
      whiteSpace: 'pre-wrap',
      fontSize: '15px',
      lineHeight: 1.8,
      color: 'var(--text-primary)',
    },
    resultPlaceholder: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'var(--text-secondary)',
      gap: '12px',
    },
    historyList: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
    },
    historyItem: {
      padding: '12px',
      borderRadius: '10px',
      marginBottom: '8px',
      background: 'rgba(255,255,255,0.03)',
      cursor: 'pointer',
      transition: 'background 0.15s',
    },
    smallBtn: {
      padding: '6px 10px',
      borderRadius: '6px',
      border: '1px solid var(--window-border)',
      background: 'transparent',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'all 0.15s',
    },
    loading: {
      display: 'inline-block',
      width: '14px',
      height: '14px',
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
  }

  if (activeTab === 'history') {
    return (
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.title}>
            <HistoryIcon size={20} style={{ color: 'var(--accent)' }} />
            <span>创作历史</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({history.length})</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={styles.smallBtn} onClick={clearHistory} disabled={history.length === 0}>
              <TrashIcon size={12} />清空
            </button>
            <button style={{ ...styles.smallBtn, background: 'var(--accent-bg)', color: 'var(--accent)' }} onClick={() => setActiveTab('write')}>
              返回创作
            </button>
          </div>
        </div>
        <div style={styles.historyList}>
          {history.length === 0 ? (
            <div style={{ ...styles.resultPlaceholder }}>
              <HistoryIcon size={48} />
              <p>暂无创作历史</p>
              <p style={{ fontSize: '12px' }}>开始创作后，历史记录会显示在这里</p>
            </div>
          ) : (
            history.map(item => (
              <div
                key={item.id}
                style={styles.historyItem}
                onClick={() => {
                  restoreFromHistory(item)
                  setActiveTab('write')
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>{item.scene}</span>
                  <button
                    style={{ ...styles.smallBtn, padding: '2px 6px' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteHistoryItem(item.id)
                    }}
                  >
                    <TrashIcon size={10} />
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {item.prompt || '无特定提示'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.result.slice(0, 100)}...
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  {formatTime(item.timestamp)} · {item.wordCount}字
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  if (activeTab === 'templates') {
    return (
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.title}>
            <StarIcon size={20} style={{ color: 'var(--accent)' }} />
            <span>我的模板</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({templates.length})</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={styles.smallBtn} onClick={clearTemplates} disabled={templates.length === 0}>
              <TrashIcon size={12} />清空
            </button>
            <button style={{ ...styles.smallBtn, background: 'var(--accent-bg)', color: 'var(--accent)' }} onClick={() => setActiveTab('write')}>
              返回创作
            </button>
          </div>
        </div>
        <div style={styles.historyList}>
          {templates.length === 0 ? (
            <div style={{ ...styles.resultPlaceholder }}>
              <StarIcon size={48} />
              <p>暂无保存的模板</p>
              <p style={{ fontSize: '12px' }}>在创作界面点击"保存为模板"来保存作品</p>
            </div>
          ) : (
            templates.map(template => (
              <div
                key={template.id}
                style={styles.historyItem}
                onClick={() => useTemplate(template)}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{template.name}</span>
                  <button
                    style={{ ...styles.smallBtn, padding: '2px 6px' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteTemplate(template.id)
                    }}
                  >
                    <TrashIcon size={10} />
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {template.scene} · {formatTime(template.createdAt)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {template.content.slice(0, 120)}...
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>
          <SparklesIcon size={20} style={{ color: 'var(--accent)' }} />
          <span>AI 创作工坊</span>
        </div>
        <div style={styles.tabsContainer}>
          <button
            style={{ ...styles.tab, ...(activeTab === 'write' ? styles.activeTab : {}) }}
            onClick={() => setActiveTab('write')}
          >
            <PenIcon size={14} />创作
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab as string === 'history' ? styles.activeTab : {}) }}
            onClick={() => setActiveTab('history')}
          >
            <HistoryIcon size={14} />历史
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab as string === 'templates' ? styles.activeTab : {}) }}
            onClick={() => setActiveTab('templates')}
          >
            <StarIcon size={14} />模板
          </button>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.leftPanel}>
          <div>
            <div style={styles.sectionTitle}>
              <FileTextIcon size={14} />选择场景
            </div>
            <div style={styles.sceneGrid}>
              {WRITING_SCENES.map(scene => (
                <div
                  key={scene.id}
                  style={{
                    ...styles.sceneCard,
                    ...(selectedScene.id === scene.id ? styles.sceneCardActive : {}),
                  }}
                  onClick={() => setSelectedScene(scene)}
                  title={scene.description}
                >
                  <div style={styles.sceneIcon}>{scene.icon}</div>
                  <div style={styles.sceneName}>{scene.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={styles.sectionTitle}>
              <LightbulbIcon size={14} />语言风格
            </div>
            <div style={styles.selectGroup}>
              <select
                style={styles.select}
                value={selectedStyle.id}
                onChange={(e) => setSelectedStyle(WRITING_STYLES.find(s => s.id === e.target.value)!)}
              >
                {WRITING_STYLES.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div style={styles.sectionTitle}>
              <ZapIcon size={14} />语气选择
            </div>
            <div style={styles.selectGroup}>
              <select
                style={styles.select}
                value={selectedTone.id}
                onChange={(e) => setSelectedTone(TONES.find(t => t.id === e.target.value)!)}
              >
                {TONES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div 
              style={{ ...styles.sectionTitle, cursor: 'pointer' }}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <SettingsIcon size={14} />
              高级设置
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                {showAdvanced ? '收起 ▲' : '展开 ▼'}
              </span>
            </div>
            {showAdvanced && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={styles.sliderContainer}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>目标字数</span>
                    <span style={{ color: 'var(--accent)' }}>{wordCount}字</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="50"
                    value={wordCount}
                    onChange={(e) => setWordCount(Number(e.target.value))}
                    style={styles.slider}
                  />
                </div>
                <div style={styles.sliderContainer}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>创意程度</span>
                    <span style={{ color: 'var(--accent)' }}>
                      {creativity > 0.7 ? '高' : creativity > 0.4 ? '中' : '低'} ({creativity.toFixed(1)})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={creativity}
                    onChange={(e) => setCreativity(Number(e.target.value))}
                    style={styles.slider}
                  />
                </div>
                <button style={styles.smallBtn} onClick={previewPrompt}>
                  <EyeIcon size={12} />预览提示词
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={styles.rightPanel}>
          <div style={styles.inputArea}>
            <div style={styles.sectionTitle}>
              <PenIcon size={14} />创作需求
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                {selectedScene.description}
              </span>
            </div>
            <textarea
              style={styles.textarea}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder={`描述你想要创作的内容...\n例如：写一篇关于人工智能未来发展的科普文章`}
            />
          </div>

          <div style={styles.actionBar}>
            <button
              style={styles.generateBtn}
              onClick={generateContent}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span style={styles.loading} />
                  <span>停止生成</span>
                </>
              ) : (
                <>
                  <WandIcon size={16} />
                  <span>开始创作</span>
                </>
              )}
            </button>
            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
              <button
                style={styles.smallBtn}
                onClick={copyToClipboard}
                disabled={!generatedText}
              >
                {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
                {copied ? '已复制' : '复制'}
              </button>
              <button
                style={styles.smallBtn}
                onClick={() => setGeneratedText('')}
                disabled={!generatedText}
              >
                <RefreshCwIcon size={12} />清空
              </button>
              <button
                style={styles.smallBtn}
                onClick={saveAsTemplate}
                disabled={!generatedText}
              >
                <SaveIcon size={12} />存为模板
              </button>
              <button
                style={styles.smallBtn}
                onClick={downloadText}
                disabled={!generatedText}
              >
                <DownloadIcon size={12} />下载
              </button>
            </div>
          </div>

          <div style={styles.resultArea}>
            {!generatedText && !isGenerating ? (
              <div style={styles.resultPlaceholder}>
                <SparklesIcon size={64} style={{ opacity: 0.3 }} />
                <h3 style={{ color: 'var(--text-secondary)' }}>AI 创作工坊</h3>
                <p style={{ maxWidth: '400px', textAlign: 'center', fontSize: '13px', lineHeight: 1.6 }}>
                  选择写作场景，描述你的创作需求，<br />
                  AI 将为你生成高质量的中文内容。
                </p>
                <div style={{ display: 'flex', gap: '16px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['文章', '邮件', '诗歌', '故事', '演讲稿'].map(tag => (
                    <span
                      key={tag}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: '#a78bfa',
                        fontSize: '12px',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div style={styles.resultContent}>
                {generatedText}
                {isGenerating && (
                  <span style={{ color: '#8b5cf6', animation: 'pulse 1s infinite' }}>▊</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AICraft
