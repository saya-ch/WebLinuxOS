import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Wand2, Download, Copy, Shuffle, Image as ImageIcon,
  Loader2, AlertCircle, Sparkles, Sliders, Trash2, Heart, Clock,
  X, ZoomIn, RefreshCw, Palette, Camera, Aperture,
} from 'lucide-react'

/**
 * ImageForge AI 图像工坊
 * --------------------------------------------------------------
 *  基于 Pollinations.ai 公开免费 API 的浏览器内 AI 图像生成器
 *  - 零配置、零密钥、零登录
 *  - 8 种艺术风格预设 + 完整参数面板
 *  - 一键下载 / 复制 / 收藏历史
 *
 *  API 文档: https://pollinations.ai/
 *  端点: https://image.pollinations.ai/prompt/{prompt}?{params}
 */

interface Generation {
  id: string
  prompt: string
  negativePrompt?: string
  url: string
  width: number
  height: number
  model: string
  seed: number
  style: string
  createdAt: number
  favorite?: boolean
}

const STORAGE_KEY = 'weblinux-imageforge-v1'
const HISTORY_KEY = 'weblinux-imageforge-history'
const FAV_KEY = 'weblinux-imageforge-favs'

const MODELS = [
  { id: 'flux', label: 'Flux', desc: '通用型，细节丰富', badge: '推荐' },
  { id: 'turbo', label: 'Turbo', desc: '快速生成，质量良好', badge: '快速' },
  { id: 'flux-realism', label: 'Flux Realism', desc: '照片级真实感' },
  { id: 'flux-anime', label: 'Flux Anime', desc: '二次元 / 动漫风格' },
  { id: 'flux-3d', label: 'Flux 3D', desc: '3D 渲染质感' },
]

const STYLE_PRESETS: Array<{ id: string; label: string; prompt: string; icon: string; swatch: string[] }> = [
  { id: 'cinematic', label: '电影感', prompt: 'cinematic shot, dramatic lighting, depth of field, 8k, color graded', icon: '🎬', swatch: ['#1a1a2e', '#f59e0b', '#3b82f6'] },
  { id: 'cyberpunk', label: '赛博朋克', prompt: 'cyberpunk city, neon lights, rain, holographic, futuristic', icon: '🌃', swatch: ['#ec4899', '#06b6d4', '#1e1b4b'] },
  { id: 'watercolor', label: '水彩', prompt: 'watercolor painting, soft edges, paper texture, artistic', icon: '🎨', swatch: ['#fbbf24', '#a78bfa', '#fb7185'] },
  { id: 'anime', label: '动漫', prompt: 'anime style, vibrant colors, detailed, studio ghibli inspired', icon: '✨', swatch: ['#f9a8d4', '#c4b5fd', '#93c5fd'] },
  { id: 'oil', label: '油画', prompt: 'oil painting, brush strokes, classical, rich texture', icon: '🖼️', swatch: ['#7c2d12', '#a16207', '#365314'] },
  { id: 'pixel', label: '像素', prompt: 'pixel art, 16-bit, retro game, crisp pixels', icon: '👾', swatch: ['#84cc16', '#fb923c', '#facc15'] },
  { id: 'isometric', label: '等距', prompt: 'isometric view, 3d, clean lines, soft shading', icon: '📐', swatch: ['#34d399', '#60a5fa', '#fde68a'] },
  { id: 'noir', label: '黑色', prompt: 'black and white, high contrast, film noir, dramatic shadows', icon: '🎭', swatch: ['#000000', '#525252', '#fafafa'] },
]

const SAMPLE_PROMPTS = [
  '一座漂浮在云海之上的水晶宫殿，夕阳余晖透过玻璃穹顶',
  'A serene Japanese garden with cherry blossoms and a stone bridge over koi pond',
  '赛博朋克风格的东京街头，霓虹灯与蒸汽，未来感',
  '宇航员在火星上弹吉他，红色沙漠，星空',
  'A magical library with infinite floating books and glowing constellations',
  '蒸汽朋克机械鲸鱼飞越维多利亚时代伦敦上空',
  'A bioluminescent forest at midnight with glowing mushrooms and fireflies',
  '古风仕女图，绢本设色，工笔重彩',
]

function loadArr<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function saveArr<T>(key: string, arr: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(arr.slice(-200)))
  } catch { /* noop */ }
}

// URL 安全编码
function encode(s: string): string {
  return encodeURIComponent(s)
}

interface GenParams {
  model: string
  width: number
  height: number
  seed: number
  enhance: boolean
  nologo: boolean
  private: boolean
  guidanceScale: number
}

export default function ImageForge() {
  const [prompt, setPrompt] = useState('')
  const [negative, setNegative] = useState('')
  const [selectedStyle, setSelectedStyle] = useState<string>('cinematic')
  const [params, setParams] = useState<GenParams>({
    model: 'flux',
    width: 1024,
    height: 1024,
    seed: Math.floor(Math.random() * 999999999),
    enhance: true,
    nologo: true,
    private: true,
    guidanceScale: 7.5,
  })
  const [generating, setGenerating] = useState(false)
  const [current, setCurrent] = useState<Generation | null>(null)
  const [history, setHistory] = useState<Generation[]>(() => loadArr<Generation>(HISTORY_KEY))
  const [favorites, setFavorites] = useState<Generation[]>(() => loadArr<Generation>(FAV_KEY))
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [previewImage, setPreviewImage] = useState<Generation | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => { saveArr(HISTORY_KEY, history) }, [history])
  useEffect(() => { saveArr(FAV_KEY, favorites) }, [favorites])

  // 启动时加载上次的当前图像
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const last = JSON.parse(raw) as Generation
        if (last && last.url) setCurrent(last)
      }
    } catch { /* noop */ }
  }, [])

  const buildImageUrl = useCallback((p: GenParams, promptText: string, negText: string, seedOverride?: number) => {
    let fullPrompt = promptText.trim()
    if (negText.trim()) {
      fullPrompt = `${fullPrompt} --no ${negText.trim()}`
    }
    const seed = seedOverride ?? p.seed
    const params_ = new URLSearchParams({
      width: String(p.width),
      height: String(p.height),
      seed: String(seed),
      model: p.model,
      nologo: p.nologo ? 'true' : 'false',
      private: p.private ? 'true' : 'false',
      enhance: p.enhance ? 'true' : 'false',
    })
    return `https://image.pollinations.ai/prompt/${encode(fullPrompt)}?${params_.toString()}`
  }, [])

  const generate = useCallback(async () => {
    const text = prompt.trim()
    if (!text) {
      setError('请输入提示词')
      return
    }
    setError(null)
    setGenerating(true)
    // 随机种子，避免重复
    const newSeed = Math.floor(Math.random() * 999999999)
    setParams((p) => ({ ...p, seed: newSeed }))
    const stylePrefix = STYLE_PRESETS.find((s) => s.id === selectedStyle)?.prompt || ''
    const fullText = stylePrefix ? `${text}, ${stylePrefix}` : text
    const url = buildImageUrl({ ...params, seed: newSeed }, fullText, negative, newSeed)
    const gen: Generation = {
      id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      prompt: text,
      negativePrompt: negative,
      url,
      width: params.width,
      height: params.height,
      model: params.model,
      seed: newSeed,
      style: selectedStyle,
      createdAt: Date.now(),
    }
    setCurrent(gen)
    // 预加载图像
    const img = new Image()
    img.onload = () => {
      setGenerating(false)
      setHistory((h) => [gen, ...h.filter((g) => g.url !== gen.url)].slice(0, 50))
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(gen)) } catch { /* noop */ }
    }
    img.onerror = () => {
      setError('生成失败，可能是网络问题或提示词触发了过滤器，请稍后重试')
      setGenerating(false)
    }
    img.onprogress = () => { /* noop */ }
    img.src = url
  }, [prompt, negative, selectedStyle, params, buildImageUrl])

  const surprise = useCallback(() => {
    const pick = SAMPLE_PROMPTS[Math.floor(Math.random() * SAMPLE_PROMPTS.length)]
    setPrompt(pick)
  }, [])

  const reSeed = useCallback(() => {
    setParams((p) => ({ ...p, seed: Math.floor(Math.random() * 999999999) }))
  }, [])

  const copyPrompt = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // 视觉反馈即可，无通知系统
    })
  }, [])

  const downloadImage = useCallback((gen: Generation) => {
    const a = document.createElement('a')
    a.href = gen.url
    a.download = `imageforge-${gen.seed}.jpg`
    a.target = '_blank'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [])

  const toggleFavorite = useCallback((gen: Generation) => {
    setFavorites((favs) => {
      const exists = favs.some((g) => g.url === gen.url)
      if (exists) return favs.filter((g) => g.url !== gen.url)
      return [{ ...gen, favorite: true }, ...favs].slice(0, 100)
    })
  }, [])

  const applyHistory = useCallback((gen: Generation) => {
    setCurrent(gen)
    setPrompt(gen.prompt)
    setNegative(gen.negativePrompt || '')
    setSelectedStyle(gen.style)
    setParams((p) => ({ ...p, model: gen.model, width: gen.width, height: gen.height, seed: gen.seed }))
    setPreviewImage(null)
  }, [])

  const clearHistory = useCallback(() => {
    if (confirm('确定清空生成历史？')) setHistory([])
  }, [])

  // 当前图像的 fav 状态
  const isCurrentFav = useMemo(() => {
    if (!current) return false
    return favorites.some((g) => g.url === current.url)
  }, [favorites, current])

  // 比例预设
  const aspectRatios: Array<{ label: string; w: number; h: number }> = [
    { label: '1:1', w: 1024, h: 1024 },
    { label: '16:9', w: 1280, h: 720 },
    { label: '9:16', w: 720, h: 1280 },
    { label: '4:3', w: 1024, h: 768 },
    { label: '3:4', w: 768, h: 1024 },
  ]

  return (
    <div className="if-root">
      <aside className="if-sidebar">
        <div className="if-brand">
          <div className="if-brand-row">
            <Wand2 size={18} />
            <span>ImageForge</span>
          </div>
          <div className="if-brand-sub">AI 图像工坊 · Pollinations.ai</div>
        </div>

        <div className="if-section">
          <div className="if-section-head">
            <span>提示词</span>
            <button className="if-icon-btn" onClick={surprise} title="随机示例">
              <Shuffle size={12} />
            </button>
          </div>
          <textarea
            className="if-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述你想生成的图像…"
            rows={4}
          />
          <div className="if-hint">支持中英文 · 越具体效果越好</div>
        </div>

        <div className="if-section">
          <div className="if-section-head">
            <span>反向提示词</span>
            <span className="if-section-meta">可选</span>
          </div>
          <textarea
            className="if-textarea if-textarea-sm"
            value={negative}
            onChange={(e) => setNegative(e.target.value)}
            placeholder="不希望出现的内容，例如: blurry, low quality"
            rows={2}
          />
        </div>

        <div className="if-section">
          <div className="if-section-head">
            <Palette size={11} /> <span>艺术风格</span>
          </div>
          <div className="if-style-grid">
            {STYLE_PRESETS.map((s) => (
              <button
                key={s.id}
                className={`if-style ${selectedStyle === s.id ? 'if-style-active' : ''}`}
                onClick={() => setSelectedStyle(s.id)}
                title={s.prompt}
              >
                <div className="if-style-swatch">
                  {s.swatch.map((c, i) => (
                    <span key={i} style={{ background: c }} />
                  ))}
                </div>
                <div className="if-style-label">
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="if-section">
          <button
            className="if-toggle"
            onClick={() => setShowSettings((v) => !v)}
          >
            <Sliders size={12} />
            <span>高级设置</span>
            <span className={`if-chevron ${showSettings ? 'if-chevron-open' : ''}`}>▸</span>
          </button>
          {showSettings && (
            <div className="if-advanced">
              <label className="if-field">
                <span>模型</span>
                <select
                  value={params.model}
                  onChange={(e) => setParams((p) => ({ ...p, model: e.target.value }))}
                >
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label} — {m.desc}</option>
                  ))}
                </select>
              </label>
              <label className="if-field">
                <span>比例</span>
                <div className="if-ratio-row">
                  {aspectRatios.map((ar) => (
                    <button
                      key={ar.label}
                      className={`if-ratio ${params.width === ar.w && params.height === ar.h ? 'if-ratio-active' : ''}`}
                      onClick={() => setParams((p) => ({ ...p, width: ar.w, height: ar.h }))}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>
              </label>
              <label className="if-field">
                <span>种子</span>
                <div className="if-seed-row">
                  <input
                    type="number"
                    value={params.seed}
                    onChange={(e) => setParams((p) => ({ ...p, seed: parseInt(e.target.value) || 0 }))}
                  />
                  <button className="if-icon-btn" onClick={reSeed} title="随机种子">
                    <RefreshCw size={12} />
                  </button>
                </div>
              </label>
              <div className="if-check-row">
                <label>
                  <input
                    type="checkbox"
                    checked={params.enhance}
                    onChange={(e) => setParams((p) => ({ ...p, enhance: e.target.checked }))}
                  />
                  <span>Prompt 增强</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={params.nologo}
                    onChange={(e) => setParams((p) => ({ ...p, nologo: e.target.checked }))}
                  />
                  <span>无水印</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <button
          className="if-generate-btn"
          onClick={generate}
          disabled={generating || !prompt.trim()}
        >
          {generating ? (
            <>
              <Loader2 size={16} className="if-spin" />
              生成中…
            </>
          ) : (
            <>
              <Sparkles size={16} />
              生成图像
            </>
          )}
        </button>
        {error && (
          <div className="if-error">
            <AlertCircle size={12} /> {error}
          </div>
        )}

        <div className="if-info">
          <div className="if-info-row">
            <span>当前尺寸</span>
            <span>{params.width} × {params.height}</span>
          </div>
          <div className="if-info-row">
            <span>种子</span>
            <span className="if-mono">{params.seed}</span>
          </div>
          <div className="if-info-row">
            <span>模型</span>
            <span>{MODELS.find((m) => m.id === params.model)?.label}</span>
          </div>
        </div>
      </aside>

      <main className="if-main">
        <div className="if-canvas-wrap">
          {current ? (
            <div className="if-canvas">
              <img
                ref={imgRef}
                src={current.url}
                alt={current.prompt}
                className={generating ? 'if-canvas-img if-canvas-img-loading' : 'if-canvas-img'}
                onClick={() => setPreviewImage(current)}
              />
              {generating && (
                <div className="if-canvas-overlay">
                  <Loader2 size={32} className="if-spin" />
                  <div className="if-overlay-text">AI 正在绘制…</div>
                </div>
              )}
              <div className="if-canvas-actions">
                <button className="if-canvas-btn" onClick={() => downloadImage(current)} title="下载">
                  <Download size={14} /> 下载
                </button>
                <button
                  className={`if-canvas-btn ${isCurrentFav ? 'if-canvas-btn-active' : ''}`}
                  onClick={() => toggleFavorite(current)}
                  title="收藏"
                >
                  <Heart size={14} fill={isCurrentFav ? 'currentColor' : 'none'} /> 收藏
                </button>
                <button className="if-canvas-btn" onClick={() => copyPrompt(current.prompt)} title="复制提示词">
                  <Copy size={14} /> 复制
                </button>
                <button className="if-canvas-btn" onClick={() => setPreviewImage(current)} title="放大">
                  <ZoomIn size={14} /> 放大
                </button>
              </div>
              <div className="if-canvas-meta">
                <div className="if-canvas-prompt">{current.prompt}</div>
                <div className="if-canvas-info">
                  <span><Aperture size={10} /> {current.width}×{current.height}</span>
                  <span className="if-mono">seed {current.seed}</span>
                  <span>· {current.model}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="if-empty">
              <div className="if-empty-icon">
                <Camera size={48} strokeWidth={1.2} />
              </div>
              <h3>开始你的创作</h3>
              <p>在左侧输入提示词，选择风格后点击「生成图像」</p>
              <div className="if-empty-examples">
                {SAMPLE_PROMPTS.slice(0, 4).map((p, i) => (
                  <button key={i} className="if-example" onClick={() => setPrompt(p)}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="if-tabs">
          <div className="if-tab-list">
            <div className="if-tab-active">
              <Clock size={12} /> 历史 ({history.length})
            </div>
          </div>
          {history.length > 0 && (
            <button className="if-icon-btn" onClick={clearHistory} title="清空历史">
              <Trash2 size={12} />
            </button>
          )}
        </div>
        <div className="if-gallery">
          {history.length === 0 ? (
            <div className="if-gallery-empty">
              <ImageIcon size={20} />
              <span>生成记录将出现在这里</span>
            </div>
          ) : (
            history.map((gen) => (
              <div key={gen.id} className="if-thumb" onClick={() => applyHistory(gen)}>
                <img src={gen.url} alt={gen.prompt} loading="lazy" />
                <div className="if-thumb-overlay">
                  <span className="if-thumb-prompt">{gen.prompt}</span>
                  <span className="if-thumb-info">{gen.width}×{gen.height} · {gen.model}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {previewImage && (
        <div className="if-preview-mask" onClick={() => setPreviewImage(null)}>
          <div className="if-preview" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage.url} alt={previewImage.prompt} />
            <div className="if-preview-bar">
              <span className="if-preview-prompt">{previewImage.prompt}</span>
              <div className="if-preview-actions">
                <button className="if-canvas-btn" onClick={() => downloadImage(previewImage)}>
                  <Download size={14} /> 下载
                </button>
                <button className="if-icon-btn" onClick={() => setPreviewImage(null)}>
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{STYLES}</style>
    </div>
  )
}

const STYLES = `
.if-root {
  display: flex; height: 100%;
  background: linear-gradient(180deg, #0a0a14 0%, #0d0d1a 100%);
  color: #e2e8f0;
  font-family: 'Plus Jakarta Sans', 'Noto Sans SC', system-ui, sans-serif;
  font-size: 14px; overflow: hidden;
  position: relative;
}
.if-root * { box-sizing: border-box; }
.if-sidebar {
  width: 320px; flex-shrink: 0;
  display: flex; flex-direction: column;
  background: rgba(15, 15, 25, 0.7);
  border-right: 1px solid rgba(255,255,255,0.06);
  backdrop-filter: blur(12px);
  padding: 16px 18px; gap: 14px; overflow-y: auto;
}
.if-sidebar::-webkit-scrollbar { width: 6px; }
.if-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
.if-brand-row {
  display: flex; align-items: center; gap: 8px;
  font-family: 'Fraunces', 'Plus Jakarta Sans', serif;
  font-weight: 700; font-size: 17px; color: #fcd34d;
  letter-spacing: -0.01em;
}
.if-brand-sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; color: #64748b;
  font-weight: 500; letter-spacing: 0.04em;
  margin-top: 4px;
}
.if-section {
  display: flex; flex-direction: column; gap: 8px;
}
.if-section-head {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; color: #94a3b8; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.08em;
  justify-content: space-between;
}
.if-section-meta { color: #475569; font-weight: 400; text-transform: none; letter-spacing: 0; }
.if-textarea {
  width: 100%; min-height: 80px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px; padding: 10px 12px;
  color: #f1f5f9; font-size: 13px; line-height: 1.6;
  font-family: inherit; outline: none; resize: vertical;
  transition: border-color 0.2s;
}
.if-textarea:focus { border-color: rgba(251, 191, 36, 0.5); background: rgba(255,255,255,0.05); }
.if-textarea::placeholder { color: #475569; }
.if-textarea-sm { min-height: 50px; font-size: 12px; }
.if-hint { font-size: 10.5px; color: #64748b; }
.if-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: none; cursor: pointer;
  color: #64748b; padding: 4px; border-radius: 4px;
  transition: all 0.15s;
}
.if-icon-btn:hover { color: #fbbf24; background: rgba(255,255,255,0.05); }
.if-style-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
}
.if-style {
  display: flex; flex-direction: column; gap: 6px;
  padding: 8px; border-radius: 8px; cursor: pointer;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  text-align: left; font-family: inherit; color: inherit;
  transition: all 0.15s;
}
.if-style:hover { background: rgba(255,255,255,0.06); transform: translateY(-1px); }
.if-style-active {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%);
  border-color: rgba(251, 191, 36, 0.5);
  box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.2);
}
.if-style-swatch {
  display: flex; height: 16px; border-radius: 4px; overflow: hidden;
}
.if-style-swatch span { flex: 1; }
.if-style-label {
  display: flex; align-items: center; gap: 4px;
  font-size: 11.5px; font-weight: 500; color: #cbd5e1;
}
.if-toggle {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 10px; border-radius: 6px; cursor: pointer;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  color: #cbd5e1; font-size: 12px; font-family: inherit;
  font-weight: 500; transition: all 0.15s;
}
.if-toggle:hover { background: rgba(255,255,255,0.05); }
.if-toggle span:first-of-type { flex: 1; text-align: left; }
.if-chevron { font-size: 9px; color: #64748b; transition: transform 0.2s; }
.if-chevron-open { transform: rotate(90deg); }
.if-advanced {
  display: flex; flex-direction: column; gap: 10px;
  padding: 12px; border-radius: 8px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
}
.if-field { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #94a3b8; }
.if-field select, .if-field input {
  background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08);
  color: #e2e8f0; padding: 6px 8px; border-radius: 5px;
  font-size: 12px; font-family: inherit; outline: none;
}
.if-field select { cursor: pointer; }
.if-field select:focus, .if-field input:focus { border-color: rgba(251, 191, 36, 0.5); }
.if-ratio-row { display: flex; gap: 4px; }
.if-ratio {
  flex: 1; padding: 5px 0; border: 1px solid rgba(255,255,255,0.08);
  background: rgba(0,0,0,0.2); color: #cbd5e1; font-size: 11px;
  border-radius: 4px; cursor: pointer; font-family: inherit;
  transition: all 0.15s;
}
.if-ratio:hover { background: rgba(255,255,255,0.05); }
.if-ratio-active {
  background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
  color: #1a1a2e; border-color: transparent; font-weight: 600;
}
.if-seed-row { display: flex; gap: 4px; }
.if-seed-row input { flex: 1; font-family: 'JetBrains Mono', monospace; }
.if-check-row { display: flex; flex-direction: column; gap: 6px; }
.if-check-row label {
  display: flex; align-items: center; gap: 6px; font-size: 11.5px;
  color: #cbd5e1; cursor: pointer;
}
.if-check-row input[type="checkbox"] { accent-color: #fbbf24; }
.if-generate-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 16px; border-radius: 10px; cursor: pointer;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #1a1a2e; border: none; font-size: 14px; font-weight: 700;
  font-family: inherit; letter-spacing: 0.01em;
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.3);
  transition: all 0.2s;
  position: sticky; bottom: 0;
}
.if-generate-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(245, 158, 11, 0.45); }
.if-generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.if-spin { animation: ifSpin 0.9s linear infinite; }
@keyframes ifSpin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
.if-error {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 10px; border-radius: 6px;
  background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5; font-size: 11.5px;
}
.if-info {
  display: flex; flex-direction: column; gap: 4px;
  padding: 10px 12px; border-radius: 6px;
  background: rgba(0,0,0,0.3);
  font-family: 'JetBrains Mono', monospace; font-size: 10.5px;
}
.if-info-row { display: flex; justify-content: space-between; color: #94a3b8; }
.if-info-row span:last-child { color: #cbd5e1; }
.if-mono { font-family: 'JetBrains Mono', monospace; }
.if-main {
  flex: 1; display: flex; flex-direction: column;
  min-width: 0; padding: 16px; gap: 12px; overflow: hidden;
}
.if-canvas-wrap {
  flex: 1; min-height: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; padding: 16px;
  position: relative; overflow: hidden;
}
.if-canvas {
  position: relative; max-width: 100%; max-height: 100%;
  display: flex; flex-direction: column; gap: 10px; align-items: center;
}
.if-canvas-img {
  max-width: 100%; max-height: 65vh; object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.5);
  cursor: zoom-in;
  transition: opacity 0.3s;
}
.if-canvas-img-loading { opacity: 0.3; }
.if-canvas-overlay {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: rgba(10, 10, 20, 0.7);
  border-radius: 8px; color: #fcd34d; gap: 8px;
  backdrop-filter: blur(4px);
  z-index: 2;
}
.if-overlay-text { font-size: 13px; color: #cbd5e1; }
.if-canvas-actions {
  display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;
}
.if-canvas-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 12px; border-radius: 6px; cursor: pointer;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: #cbd5e1; font-size: 12px; font-family: inherit;
  font-weight: 500; transition: all 0.15s;
}
.if-canvas-btn:hover { background: rgba(251, 191, 36, 0.12); color: #fde68a; border-color: rgba(251, 191, 36, 0.4); }
.if-canvas-btn-active { color: #f472b6; border-color: rgba(244, 114, 182, 0.4); }
.if-canvas-meta {
  width: 100%; max-width: 720px;
  padding: 10px 14px; border-radius: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
}
.if-canvas-prompt { font-size: 13px; color: #e2e8f0; line-height: 1.5; }
.if-canvas-info {
  display: flex; gap: 12px; margin-top: 6px;
  font-size: 10.5px; color: #64748b; font-family: 'JetBrains Mono', monospace;
}
.if-canvas-info span { display: inline-flex; align-items: center; gap: 3px; }
.if-empty {
  text-align: center; color: #64748b;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 40px;
}
.if-empty-icon { color: rgba(251, 191, 36, 0.3); }
.if-empty h3 { color: #cbd5e1; font-size: 16px; font-weight: 500; margin: 0; }
.if-empty p { color: #64748b; font-size: 13px; }
.if-empty-examples {
  display: flex; flex-direction: column; gap: 6px; margin-top: 12px;
  max-width: 480px; width: 100%;
}
.if-example {
  padding: 8px 12px; border-radius: 6px; cursor: pointer;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  color: #94a3b8; font-size: 12px; text-align: left;
  font-family: inherit; transition: all 0.15s;
}
.if-example:hover { background: rgba(251, 191, 36, 0.08); color: #fde68a; border-color: rgba(251, 191, 36, 0.3); }
.if-tabs { display: flex; align-items: center; justify-content: space-between; }
.if-tab-list { display: flex; gap: 4px; }
.if-tab-active {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 6px;
  background: rgba(251, 191, 36, 0.1); color: #fde68a;
  font-size: 12px; font-weight: 600;
}
.if-gallery {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px; max-height: 220px; overflow-y: auto; padding: 4px;
}
.if-gallery::-webkit-scrollbar { width: 6px; height: 6px; }
.if-gallery::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
.if-gallery-empty {
  grid-column: 1/-1; padding: 24px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  color: #475569; font-size: 12px;
}
.if-thumb {
  position: relative; aspect-ratio: 1; overflow: hidden;
  border-radius: 6px; cursor: pointer; background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.05);
  transition: all 0.15s;
}
.if-thumb:hover { transform: translateY(-2px); border-color: rgba(251, 191, 36, 0.4); }
.if-thumb img { width: 100%; height: 100%; object-fit: cover; }
.if-thumb-overlay {
  position: absolute; inset: 0; padding: 6px;
  background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.85) 100%);
  display: flex; flex-direction: column; justify-content: flex-end;
  opacity: 0; transition: opacity 0.15s;
}
.if-thumb:hover .if-thumb-overlay { opacity: 1; }
.if-thumb-prompt {
  font-size: 10.5px; color: #f1f5f9; line-height: 1.3;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; text-overflow: ellipsis;
}
.if-thumb-info {
  font-size: 9px; color: #94a3b8; font-family: 'JetBrains Mono', monospace;
  margin-top: 2px;
}
.if-preview-mask {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  padding: 40px;
  animation: ifFadeIn 0.2s ease-out;
}
@keyframes ifFadeIn { from { opacity: 0; } to { opacity: 1; } }
.if-preview {
  max-width: 100%; max-height: 100%;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.if-preview img {
  max-width: 100%; max-height: 80vh; object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.6);
}
.if-preview-bar {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 10px 16px; border-radius: 8px;
  background: rgba(20, 20, 30, 0.95);
  border: 1px solid rgba(255,255,255,0.08);
}
.if-preview-prompt { flex: 1; color: #cbd5e1; font-size: 12px; }
.if-preview-actions { display: flex; gap: 6px; }
`
