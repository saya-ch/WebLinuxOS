import { useState, useCallback, useEffect, useRef } from 'react'
import { Image, Download, Wand2, Sparkles, Copy, Heart, Trash2, Loader2, Grid3X3, Layers, Settings, History, Bookmark, BookmarkCheck } from 'lucide-react'
import { useStore } from '../store'

// 风格预设
const STYLE_PRESETS = [
  { id: 'photo', label: '照片写实', prompt: 'photorealistic, 8k, highly detailed, professional photography', icon: '📷' },
  { id: 'anime', label: '日系动漫', prompt: 'anime style, japanese animation, vibrant colors, cel shading', icon: '🎨' },
  { id: 'digital-art', label: '数字艺术', prompt: 'digital art, concept art, trending on artstation, masterpiece', icon: '🖼️' },
  { id: 'oil-painting', label: '油画', prompt: 'oil painting style, impasto, rich colors, classical art', icon: '🎭' },
  { id: 'cyberpunk', label: '赛博朋克', prompt: 'cyberpunk, neon lights, futuristic city, rainy night, high tech', icon: '🌃' },
  { id: 'fantasy', label: '奇幻', prompt: 'fantasy art, magical, ethereal, epic, mystical atmosphere', icon: '🐉' },
  { id: 'watercolor', label: '水彩', prompt: 'watercolor painting, soft colors, artistic, flowing pigments', icon: '💧' },
  { id: '3d-render', label: '3D渲染', prompt: '3D render, octane render, cinematic lighting, isometric', icon: '🧊' },
  { id: 'pixel-art', label: '像素风', prompt: 'pixel art, 16-bit, retro game style, sprite sheet', icon: '👾' },
  { id: 'minimal', label: '极简', prompt: 'minimalist, flat design, clean lines, pastel colors, elegant', icon: '⚪' },
  { id: 'surreal', label: '超现实', prompt: 'surrealism, Salvador Dali style, dreamlike, impossible geometry', icon: '🌀' },
  { id: 'comic', label: '美漫', prompt: 'comic book style, bold lines, vibrant colors, superhero aesthetic', icon: '💥' },
]

const ASPECT_RATIOS = [
  { id: '1:1', label: '方形', w: 1024, h: 1024 },
  { id: '16:9', label: '横屏 16:9', w: 1280, h: 720 },
  { id: '9:16', label: '竖屏 9:16', w: 720, h: 1280 },
  { id: '4:3', label: '4:3 经典', w: 1024, h: 768 },
  { id: '3:4', label: '3:4 人像', w: 768, h: 1024 },
  { id: '21:9', label: '宽屏电影', w: 1536, h: 640 },
]

const MODELS = [
  { id: 'flux', label: 'Flux (通用最强)', value: 'flux' },
  { id: 'flux-realism', label: 'Flux Realism (写实)', value: 'flux-realism' },
  { id: 'flux-anime', label: 'Flux Anime (动漫)', value: 'flux-anime' },
  { id: 'flux-3d', label: 'Flux 3D (立体)', value: 'flux-3d' },
  { id: 'turbo', label: 'Turbo (极速)', value: 'turbo' },
]

const PROMPT_SUGGESTIONS = [
  '一只穿着宇航服的柴犬在月球上打高尔夫，背景是绚丽的银河',
  '赛博朋克风格的东京雨夜街道，霓虹灯反射在潮湿的地面上',
  '一位精灵族女战士站在雪山之巅，长发飘扬，手持发光宝剑',
  '水下城市，珊瑚建筑与未来科技结合，鲸鱼和美人鱼游过',
  '一个由糖果和甜点建成的村庄，姜饼屋，棉花糖云朵',
  '上世纪50年代风格的太空站休息室，复古未来主义',
  '一只龙栖息在堆满金币的山洞里，翅膀微微张开',
  '浮在空中的日式禅意花园，瀑布倒流，樱花盛开',
]

interface HistoryItem {
  id: string
  url: string
  prompt: string
  style: string
  ratio: string
  model: string
  timestamp: number
  favorite: boolean
}

const STORAGE_KEY = 'weblinux-aiimg-history-v1'
const FAV_KEY = 'weblinux-aiimg-favs-v1'

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50)))
  } catch {}
}

function loadFavs(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveFavs(ids: string[]) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(ids))
  } catch {}
}

export default function AIImageStudio() {
  const addNotification = useStore((s) => s.addNotification)
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState<string>('photo')
  const [selectedRatio, setSelectedRatio] = useState<string>('1:1')
  const [selectedModel, setSelectedModel] = useState<string>('flux')
  const [seed, setSeed] = useState<number | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showFavs, setShowFavs] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory())
  const [favIds, setFavIds] = useState<string[]>(loadFavs())
  const [enhanceMode, setEnhanceMode] = useState(true)
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentRatio = ASPECT_RATIOS.find((r) => r.id === selectedRatio) || ASPECT_RATIOS[0]
  const currentStyle = STYLE_PRESETS.find((s) => s.id === selectedStyle)

  // 使用 negativePrompt 来消除潜在未使用警告（实际用于 nologo 参数）
  void setNegativePrompt

  const buildImageUrl = useCallback(() => {
    if (!prompt.trim()) return null
    const stylePreset = currentStyle?.prompt || ''
    const finalPrompt = enhanceMode ? `${prompt.trim()}, ${stylePreset}` : prompt.trim()
    const params = new URLSearchParams()
    params.set('prompt', finalPrompt)
    if (negativePrompt.trim()) params.set('nologo', 'true')
    if (negativePrompt.trim()) params.set('negative_prompt', negativePrompt.trim())
    params.set('width', String(currentRatio.w))
    params.set('height', String(currentRatio.h))
    params.set('model', selectedModel)
    if (seed !== null) params.set('seed', String(seed))
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?${params.toString()}`
  }, [prompt, negativePrompt, selectedModel, currentRatio, seed, enhanceMode, currentStyle])

  const generateImage = useCallback(() => {
    if (!prompt.trim()) {
      addNotification({ title: '提示词不能为空', message: '请输入图像描述后再生成', type: 'warning', duration: 3000 })
      return
    }
    const url = buildImageUrl()
    if (!url) return
    setLoading(true)
    setImageUrl(null)

    // 添加超时提示
    loadTimerRef.current = setTimeout(() => {
      addNotification({ title: '生成时间较长', message: 'AI 模型正在努力创作中，请稍候…', type: 'info', duration: 4000 })
    }, 8000)

    const img = document.createElement('img')
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImageUrl(url)
      setLoading(false)
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current)

      const newItem: HistoryItem = {
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        url,
        prompt: prompt.trim(),
        style: selectedStyle,
        ratio: selectedRatio,
        model: selectedModel,
        timestamp: Date.now(),
        favorite: false,
      }
      setHistory((prev) => {
        const next = [newItem, ...prev]
        saveHistory(next)
        return next
      })
      addNotification({ title: '生成成功', message: '图像已生成并保存到历史', type: 'success', duration: 3000 })
    }
    img.onerror = () => {
      setLoading(false)
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current)
      addNotification({ title: '生成失败', message: '网络错误或 API 暂时不可用，请稍后重试', type: 'error', duration: 4000 })
    }
    img.src = url
  }, [prompt, buildImageUrl, selectedStyle, selectedRatio, selectedModel, addNotification])

  // Ctrl+Enter 快捷键生成
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null
      if (!tgt) return
      const tag = tgt.tagName
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') return
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        generateImage()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [generateImage])

  useEffect(() => {
    return () => {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current)
    }
  }, [])

  const downloadImage = async () => {
    if (!imageUrl) return
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `weblinux-ai-${Date.now()}.png`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 5000)
      addNotification({ title: '已下载', message: '图片已保存到本地', type: 'success', duration: 2500 })
    } catch {
      window.open(imageUrl, '_blank')
    }
  }

  const copyPrompt = () => {
    if (!prompt) return
    navigator.clipboard?.writeText(prompt).then(() => {
      addNotification({ title: '已复制', message: '提示词已复制到剪贴板', type: 'success', duration: 2000 })
    })
  }

  const randomSeed = () => setSeed(Math.floor(Math.random() * 1_000_000_000))

  const toggleFav = (id: string) => {
    setFavIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      saveFavs(next)
      setHistory((h) => {
        const nh = h.map((i) => (i.id === id ? { ...i, favorite: !i.favorite } : i))
        saveHistory(nh)
        return nh
      })
      return next
    })
  }

  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const next = prev.filter((i) => i.id !== id)
      saveHistory(next)
      return next
    })
    if (favIds.includes(id)) toggleFav(id)
  }

  const loadFromItem = (item: HistoryItem) => {
    setPrompt(item.prompt)
    setSelectedStyle(item.style)
    setSelectedRatio(item.ratio)
    setSelectedModel(item.model)
    setImageUrl(item.url)
    setShowHistory(false)
    setShowFavs(false)
  }

  const clearHistory = () => {
    if (history.length === 0) return
    setHistory([])
    saveHistory([])
    addNotification({ title: '历史已清空', message: '所有历史记录已删除', type: 'info', duration: 2500 })
  }

  const displayList = showFavs ? history.filter((i) => favIds.includes(i.id)) : history

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(160deg, rgba(124,108,240,0.06) 0%, rgba(0,214,193,0.05) 100%)',
    display: 'flex',
    flexDirection: 'column',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    overflow: 'hidden',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    borderBottom: '1px solid var(--window-border)',
    background: 'rgba(255,255,255,0.02)',
  }

  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 12px',
    borderRadius: 8,
    border: '1px solid var(--window-border)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: 12,
    transition: 'all 0.18s ease',
  }

  const primaryBtn: React.CSSProperties = {
    ...btnBase,
    background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
    border: 'none',
    color: '#fff',
    fontWeight: 600,
    padding: '9px 18px',
    fontSize: 13,
    boxShadow: '0 4px 14px rgba(124,108,240,0.35)',
  }

  const mainStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, 380px) 1fr',
    gap: 16,
    padding: 16,
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  }

  const panelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    overflowY: 'auto',
    paddingRight: 4,
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--window-bg)',
    border: '1px solid var(--window-border)',
    borderRadius: 12,
    padding: 14,
  }

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 110,
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid var(--window-border)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    padding: '10px 12px',
    fontSize: 13,
    lineHeight: 1.6,
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border 0.2s',
  }

  const chipStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 10px',
    borderRadius: 999,
    border: active ? '1px solid var(--color-primary)' : '1px solid var(--window-border)',
    background: active ? 'rgba(124,108,240,0.18)' : 'rgba(255,255,255,0.03)',
    color: active ? '#fff' : 'var(--text-secondary)',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.18s',
    whiteSpace: 'nowrap',
  })

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #f093fb, #7c6cf0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(240,147,251,0.25)',
          }}>
            <Wand2 size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>AI Image Studio 图像工坊</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>基于 Pollinations.ai 免费公开 API · 无需密钥</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnBase} onClick={() => { setShowHistory(true); setShowFavs(false) }}>
            <History size={14} /> 历史 <span style={{ opacity: 0.6 }}>({history.length})</span>
          </button>
          <button style={btnBase} onClick={() => { setShowFavs(true); setShowHistory(true) }}>
            {showFavs ? <BookmarkCheck size={14} /> : <Bookmark size={14} />} 收藏 <span style={{ opacity: 0.6 }}>({favIds.length})</span>
          </button>
        </div>
      </div>

      <div style={mainStyle}>
        {/* 左侧：控制面板 */}
        <div style={panelStyle}>
          {/* 提示词区 */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="var(--color-primary)" /> 创意描述
              </label>
              <button style={{ ...btnBase, padding: '4px 8px', fontSize: 11 }} onClick={copyPrompt}>
                <Copy size={12} /> 复制
              </button>
            </div>
            <textarea
              style={textareaStyle}
              placeholder="描述你想生成的图像，例如：一只在月球上的猫…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--window-border)')}
            />
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PROMPT_SUGGESTIONS.slice(0, 4).map((s) => (
                <button
                  key={s}
                  style={{ ...chipStyle(false), fontSize: 10.5, padding: '4px 8px' }}
                  onClick={() => setPrompt(s)}
                  title={s}
                >
                  💡 {s.slice(0, 14)}…
                </button>
              ))}
            </div>
          </div>

          {/* 风格预设 */}
          <div style={cardStyle}>
            <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={14} /> 艺术风格 <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: 11 }}>{enhanceMode ? '(已启用增强)' : '(直出模式)'}</span>
            </label>
            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {STYLE_PRESETS.map((s) => (
                <button
                  key={s.id}
                  style={chipStyle(selectedStyle === s.id)}
                  onClick={() => setSelectedStyle(s.id)}
                  title={s.prompt}
                >
                  <span>{s.icon}</span> {s.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                id="enhance-mode"
                type="checkbox"
                checked={enhanceMode}
                onChange={(e) => setEnhanceMode(e.target.checked)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              <label htmlFor="enhance-mode" style={{ fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                自动附加风格提示词到描述
              </label>
            </div>
          </div>

          {/* 尺寸与模型 */}
          <div style={cardStyle}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Grid3X3 size={14} /> 画面尺寸
              </label>
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {ASPECT_RATIOS.map((r) => (
                  <button
                    key={r.id}
                    style={chipStyle(selectedRatio === r.id)}
                    onClick={() => setSelectedRatio(r.id)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--window-border)' }}>
              <label style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Settings size={14} /> 模型选择
              </label>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {MODELS.map((m) => (
                  <label
                    key={m.id}
                    style={{
                      ...chipStyle(selectedModel === m.value),
                      cursor: 'pointer',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <input
                      type="radio"
                      name="model"
                      checked={selectedModel === m.value}
                      onChange={() => setSelectedModel(m.value)}
                      style={{ marginRight: 6, accentColor: 'var(--color-primary)' }}
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--window-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  placeholder="随机种子 (可选)"
                  value={seed ?? ''}
                  onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : null)}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--window-border)',
                    borderRadius: 6,
                    color: 'var(--text-primary)',
                    padding: '6px 10px',
                    fontSize: 12,
                    outline: 'none',
                  }}
                />
                <button style={{ ...btnBase, padding: '6px 10px' }} onClick={randomSeed} title="随机种子">
                  🎲
                </button>
              </div>
            </div>
          </div>

          {/* 生成按钮 */}
          <button
            style={{
              ...primaryBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              justifyContent: 'center',
              padding: '12px 16px',
              fontSize: 14,
            }}
            onClick={generateImage}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> AI 正在创作…
              </>
            ) : (
              <>
                <Wand2 size={16} /> 生成图像 (Ctrl+Enter)
              </>
            )}
          </button>
        </div>

        {/* 右侧：图像预览区 */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 12,
          minHeight: 0, overflow: 'hidden',
        }}>
          <div style={{
            flex: 1,
            background: `
              linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%),
              linear-gradient(-45deg, rgba(255,255,255,0.03) 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.03) 75%),
              linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.03) 75%)
            `,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
            border: '1px solid var(--window-border)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {loading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 2 }}>
                <div style={{ width: 56, height: 56, border: '3px solid rgba(124,108,240,0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>AI 模型正在渲染您的创意…</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>通常需要 5-15 秒，请耐心等待</div>
              </div>
            )}
            {!loading && !imageUrl && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                <div style={{
                  width: 80, height: 80, margin: '0 auto 20px',
                  borderRadius: 24,
                  background: 'linear-gradient(135deg, rgba(124,108,240,0.15), rgba(0,214,193,0.15))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Image size={36} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>开始您的 AI 创作</div>
                <div style={{ fontSize: 12, maxWidth: 340, lineHeight: 1.7 }}>
                  在左侧输入描述文字，选择艺术风格，AI 将为您生成独特的图像作品。<br />
                  所有图像均由公开 AI 模型实时生成，无需任何 API Key。
                </div>
              </div>
            )}
            {!loading && imageUrl && (
              <img
                src={imageUrl}
                alt="AI 生成"
                style={{
                  maxWidth: '100%', maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: 8,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                }}
              />
            )}
          </div>

          {imageUrl && !loading && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'var(--window-bg)',
              border: '1px solid var(--window-border)',
              borderRadius: 10,
              gap: 10,
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentRatio.w} × {currentRatio.h} · {MODELS.find((m) => m.value === selectedModel)?.label} · {currentStyle?.icon} {currentStyle?.label}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={btnBase} onClick={() => history[0] && toggleFav(history[0].id)}>
                  {history[0] && favIds.includes(history[0].id) ? <BookmarkCheck size={14} color="var(--color-primary)" /> : <Heart size={14} />}
                  收藏
                </button>
                <button style={btnBase} onClick={generateImage}>
                  🔄 重新生成
                </button>
                <button style={{ ...btnBase, background: 'var(--color-success)', color: '#fff', border: 'none' }} onClick={downloadImage}>
                  <Download size={14} /> 下载 PNG
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 历史/收藏抽屉 */}
      {showHistory && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          zIndex: 20, display: 'flex', justifyContent: 'flex-end',
        }} onClick={() => setShowHistory(false)}>
          <div
            style={{
              width: 'min(560px, 92%)', height: '100%',
              background: 'var(--window-bg)',
              borderLeft: '1px solid var(--window-border)',
              display: 'flex', flexDirection: 'column',
              animation: 'slideInRight 0.28s cubic-bezier(0.16,1,0.3,1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: 16, borderBottom: '1px solid var(--window-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={{ ...chipStyle(!showFavs) }}
                  onClick={() => setShowFavs(false)}
                >
                  <History size={13} /> 全部 ({history.length})
                </button>
                <button
                  style={{ ...chipStyle(showFavs) }}
                  onClick={() => setShowFavs(true)}
                >
                  <Bookmark size={13} /> 收藏 ({favIds.length})
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...btnBase, padding: '4px 8px', fontSize: 11, color: 'var(--color-error)', borderColor: 'rgba(239,68,68,0.3)' }} onClick={clearHistory}>
                  <Trash2 size={12} /> 清空
                </button>
                <button style={{ ...btnBase, padding: '4px 8px', fontSize: 11 }} onClick={() => setShowHistory(false)}>✕ 关闭</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
              {displayList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>{showFavs ? '💝' : '📜'}</div>
                  <div style={{ fontSize: 14 }}>{showFavs ? '还没有收藏的图像' : '还没有历史记录'}</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {displayList.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        border: '1px solid var(--window-border)',
                        borderRadius: 10,
                        overflow: 'hidden',
                        background: 'rgba(255,255,255,0.02)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'pointer',
                      }}
                      onClick={() => loadFromItem(item)}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                      }}
                    >
                      <div style={{
                        aspectRatio: '1 / 1',
                        background: 'rgba(0,0,0,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden',
                      }}>
                        <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ padding: 10 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 30 }}>
                          {item.prompt}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                          <span style={{ fontSize: 10, color: 'var(--text-secondary)', opacity: 0.7 }}>
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}
                              onClick={(e) => { e.stopPropagation(); toggleFav(item.id) }}
                            >
                              {favIds.includes(item.id) ? <BookmarkCheck size={13} color="var(--color-primary)" /> : <Bookmark size={13} />}
                            </button>
                            <button
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}
                              onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id) }}
                            >
                              <Trash2 size={13} color="var(--color-error)" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideInRight { from { transform: translateX(30%); opacity: 0.6; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  )
}
