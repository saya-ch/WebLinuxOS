import { useState, useEffect, useRef, useMemo } from 'react'
import {
  RotateCcw, Copy, Check,
  Zap, Code2, Download, Palette,
} from 'lucide-react'

type AnimationPreset = {
  id: string
  name: string
  icon: string
  keyframes: string
  defaultDuration: number
  defaultTiming: string
  category: 'attention' | 'motion' | 'transformation' | 'loading'
}

const presets: AnimationPreset[] = [
  { id: 'fade-in', name: '淡入', icon: 'eye', category: 'attention',
    keyframes: `@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}`, defaultDuration: 500, defaultTiming: 'ease-out' },
  { id: 'fade-out', name: '淡出', icon: 'eye', category: 'attention',
    keyframes: `@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}`, defaultDuration: 500, defaultTiming: 'ease-in' },
  { id: 'slide-up', name: '向上滑动', icon: 'move', category: 'motion',
    keyframes: `@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}`, defaultDuration: 500, defaultTiming: 'ease-out' },
  { id: 'slide-down', name: '向下滑动', icon: 'move', category: 'motion',
    keyframes: `@keyframes slideDown {
  from { transform: translateY(-30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}`, defaultDuration: 500, defaultTiming: 'ease-out' },
  { id: 'slide-left', name: '向左滑动', icon: 'move', category: 'motion',
    keyframes: `@keyframes slideLeft {
  from { transform: translateX(30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}`, defaultDuration: 500, defaultTiming: 'ease-out' },
  { id: 'slide-right', name: '向右滑动', icon: 'move', category: 'motion',
    keyframes: `@keyframes slideRight {
  from { transform: translateX(-30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}`, defaultDuration: 500, defaultTiming: 'ease-out' },
  { id: 'bounce', name: '弹跳', icon: 'zap', category: 'attention',
    keyframes: `@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-20px); }
  60% { transform: translateY(-10px); }
}`, defaultDuration: 1000, defaultTiming: 'ease-out' },
  { id: 'pulse', name: '脉冲', icon: 'heart', category: 'attention',
    keyframes: `@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}`, defaultDuration: 1500, defaultTiming: 'ease-in-out' },
  { id: 'shake', name: '震动', icon: 'shuffle', category: 'attention',
    keyframes: `@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}`, defaultDuration: 800, defaultTiming: 'ease-in-out' },
  { id: 'rotate', name: '旋转', icon: 'rotate', category: 'transformation',
    keyframes: `@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`, defaultDuration: 1000, defaultTiming: 'linear' },
  { id: 'flip-x', name: 'X轴翻转', icon: 'box', category: 'transformation',
    keyframes: `@keyframes flipX {
  from { transform: perspective(400px) rotateY(0); }
  to { transform: perspective(400px) rotateY(360deg); }
}`, defaultDuration: 1000, defaultTiming: 'ease-in-out' },
  { id: 'flip-y', name: 'Y轴翻转', icon: 'box', category: 'transformation',
    keyframes: `@keyframes flipY {
  from { transform: perspective(400px) rotateX(0); }
  to { transform: perspective(400px) rotateX(360deg); }
}`, defaultDuration: 1000, defaultTiming: 'ease-in-out' },
  { id: 'zoom-in', name: '放大进入', icon: 'maximize', category: 'transformation',
    keyframes: `@keyframes zoomIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}`, defaultDuration: 500, defaultTiming: 'ease-out' },
  { id: 'zoom-out', name: '缩小退出', icon: 'minimize', category: 'transformation',
    keyframes: `@keyframes zoomOut {
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(0); opacity: 0; }
}`, defaultDuration: 500, defaultTiming: 'ease-in' },
  { id: 'swing', name: '摇摆', icon: 'move', category: 'attention',
    keyframes: `@keyframes swing {
  20% { transform: rotate(15deg); }
  40% { transform: rotate(-10deg); }
  60% { transform: rotate(5deg); }
  80% { transform: rotate(-5deg); }
  100% { transform: rotate(0deg); }
}`, defaultDuration: 1000, defaultTiming: 'ease-in-out' },
  { id: 'tada', name: '庆祝', icon: 'sparkles', category: 'attention',
    keyframes: `@keyframes tada {
  0% { transform: scale(1); }
  10%, 20% { transform: scale(0.9) rotate(-3deg); }
  30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); }
  40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); }
  100% { transform: scale(1) rotate(0); }
}`, defaultDuration: 1000, defaultTiming: 'ease-in-out' },
  { id: 'float', name: '浮动', icon: 'move', category: 'motion',
    keyframes: `@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}`, defaultDuration: 3000, defaultTiming: 'ease-in-out' },
  { id: 'jello', name: '果冻抖动', icon: 'layers', category: 'attention',
    keyframes: `@keyframes jello {
  0%, 100% { transform: skewX(0deg) skewY(0deg); }
  30% { transform: skewX(-12.5deg) skewY(-12.5deg); }
  40% { transform: skewX(6.25deg) skewY(6.25deg); }
  50% { transform: skewX(-3.125deg) skewY(-3.125deg); }
  60% { transform: skewX(1.5625deg) skewY(1.5625deg); }
  70% { transform: skewX(-0.78125deg) skewY(-0.78125deg); }
}`, defaultDuration: 1000, defaultTiming: 'ease-in-out' },
  { id: 'heartbeat', name: '心跳', icon: 'heart', category: 'attention',
    keyframes: `@keyframes heartbeat {
  0% { transform: scale(1); }
  14% { transform: scale(1.3); }
  28% { transform: scale(1); }
  42% { transform: scale(1.3); }
  70% { transform: scale(1); }
}`, defaultDuration: 1300, defaultTiming: 'ease-in-out' },
  { id: 'progress', name: '加载进度', icon: 'loader', category: 'loading',
    keyframes: `@keyframes progress {
  0% { width: 0; margin-left: 0; }
  50% { width: 100%; margin-left: 0; }
  100% { width: 0; margin-left: 100%; }
}`, defaultDuration: 1500, defaultTiming: 'ease-in-out' },
  { id: 'stripe', name: '条纹加载', icon: 'loader', category: 'loading',
    keyframes: `@keyframes stripe {
  0% { background-position: 0 0; }
  100% { background-position: 40px 0; }
}`, defaultDuration: 1000, defaultTiming: 'linear' },
  { id: 'glow', name: '发光', icon: 'sparkles', category: 'attention',
    keyframes: `@keyframes glow {
  0%, 100% { box-shadow: 0 0 5px currentColor; }
  50% { box-shadow: 0 0 20px currentColor, 0 0 30px currentColor; }
}`, defaultDuration: 2000, defaultTiming: 'ease-in-out' },
  { id: 'ripple', name: '涟漪', icon: 'waves', category: 'motion',
    keyframes: `@keyframes ripple {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}`, defaultDuration: 1000, defaultTiming: 'ease-out' },
  { id: 'typewriter', name: '打字机', icon: 'cursor', category: 'motion',
    keyframes: `@keyframes typing {
  from { width: 0; }
  to { width: 100%; }
}
@keyframes blink-caret {
  from, to { border-color: transparent; }
  50% { border-color: currentColor; }
}`, defaultDuration: 3000, defaultTiming: 'steps(30, end)' },
  { id: 'rubber-band', name: '橡皮筋', icon: 'layers', category: 'transformation',
    keyframes: `@keyframes rubberBand {
  0% { transform: scale(1); }
  30% { transform: scaleX(1.25) scaleY(0.75); }
  40% { transform: scaleX(0.75) scaleY(1.25); }
  60% { transform: scaleX(1.15) scaleY(0.85); }
  100% { transform: scale(1); }
}`, defaultDuration: 1000, defaultTiming: 'ease-in-out' },
]

const categories = [
  { id: 'all', name: '全部', icon: 'grid' },
  { id: 'attention', name: '注意力', icon: 'zap' },
  { id: 'motion', name: '运动', icon: 'move' },
  { id: 'transformation', name: '变形', icon: 'box' },
  { id: 'loading', name: '加载', icon: 'loader' },
]

const timingFunctions = [
  'linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out',
  'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  'cubic-bezier(0.645, 0.045, 0.355, 1)',
  'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
]

const sampleElements = [
  { type: 'box', label: '方块' },
  { type: 'circle', label: '圆形' },
  { type: 'text', label: '文本' },
  { type: 'button', label: '按钮' },
  { type: 'card', label: '卡片' },
]

const colors = [
  { name: '紫色', value: '#7c3aed' },
  { name: '蓝色', value: '#3b82f6' },
  { name: '青色', value: '#06b6d4' },
  { name: '绿色', value: '#22c55e' },
  { name: '黄色', value: '#eab308' },
  { name: '橙色', value: '#f97316' },
  { name: '红色', value: '#ef4444' },
  { name: '粉色', value: '#ec4899' },
]

export default function CssAnimationStudio() {
  const [selectedPreset, setSelectedPreset] = useState<AnimationPreset>(presets[0])
  const [duration, setDuration] = useState(500)
  const [timing, setTiming] = useState('ease-out')
  const [iterationCount, setIterationCount] = useState('infinite')
  const [direction, setDirection] = useState('normal')
  const [playState, setPlayState] = useState<'playing' | 'paused'>('playing')
  const [selectedElement, setSelectedElement] = useState(sampleElements[0])
  const [selectedColor, setSelectedColor] = useState(colors[0])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [copied, setCopied] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDuration(selectedPreset.defaultDuration)
    setTiming(selectedPreset.defaultTiming)
  }, [selectedPreset])

  const filteredPresets = useMemo(() => {
    if (selectedCategory === 'all') return presets
    return presets.filter(p => p.category === selectedCategory)
  }, [selectedCategory])

  const generatedCSS = useMemo(() => {
    const iteration = iterationCount === 'infinite' ? 'infinite' : iterationCount
    const css = `/* CSS 动画生成器 - WebLinuxOS */

${selectedPreset.keyframes}

.animated-element {
  animation: ${selectedPreset.id} ${duration}ms ${timing} ${iteration} ${direction};
}

/* 应用示例 */
.animated-element {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, ${selectedColor.value}, ${selectedColor.value}aa);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.animated-element:hover {
  transform: scale(1.05);
}`
    return css
  }, [selectedPreset, duration, timing, iterationCount, direction, selectedColor])

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedCSS)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadCSS = () => {
    const blob = new Blob([generatedCSS], { type: 'text/css' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `animation-${selectedPreset.id}.css`
    a.click()
    URL.revokeObjectURL(url)
  }

  const animationStyle: React.CSSProperties = {
    animation: playState === 'playing'
      ? `${selectedPreset.id} ${duration}ms ${timing} ${iterationCount} ${direction}`
      : 'none',
  }

  const elementStyle: React.CSSProperties = {
    width: selectedElement.type === 'card' ? 180 : 120,
    height: selectedElement.type === 'text' ? 'auto' : selectedElement.type === 'card' ? 120 : 120,
    minHeight: selectedElement.type === 'text' ? 40 : undefined,
    background: selectedElement.type === 'text' || selectedElement.type === 'button'
      ? 'transparent'
      : `linear-gradient(135deg, ${selectedColor.value}, ${selectedColor.value}cc)`,
    borderRadius: selectedElement.type === 'circle' ? '50%' : selectedElement.type === 'card' ? 12 : 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: selectedElement.type === 'text' || selectedElement.type === 'button' ? selectedColor.value : 'white',
    fontWeight: 600,
    fontSize: selectedElement.type === 'text' ? 18 : 16,
    cursor: 'pointer',
    border: selectedElement.type === 'button' ? `2px solid ${selectedColor.value}` : 'none',
    padding: selectedElement.type === 'button' ? '12px 24px' : selectedElement.type === 'text' ? '16px' : undefined,
    boxShadow: selectedElement.type !== 'text' ? `0 10px 30px ${selectedColor.value}40` : 'none',
    animationPlayState: playState,
    ...animationStyle,
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: 20,
    height: '100%',
    padding: 20,
    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
    color: '#e0e0e8',
    fontFamily: 'Space Grotesk, "Noto Sans SC", sans-serif',
    overflow: 'hidden'
  }

  const panelStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, rgba(30,30,50,0.9), rgba(20,20,35,0.9))',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  }

  const sidebarStyle: React.CSSProperties = {
    ...panelStyle,
    height: '100%'
  }

  const mainStyle: React.CSSProperties = {
    ...panelStyle,
    height: '100%'
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 60,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 10
  }

  return (
    <div style={gridStyle}>
      <div style={sidebarStyle}>
        <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #ec4899, #f97316)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Palette size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>CSS 动画工坊</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>可视化 CSS 动画生成器</div>
            </div>
          </div>
        </div>

        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={sectionTitleStyle}>动画分类</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: selectedCategory === cat.id ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'rgba(255,255,255,0.05)',
                  color: selectedCategory === cat.id ? 'white' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500
                }}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div style={sectionTitleStyle}>动画预设</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 20 }}>
            {filteredPresets.map(preset => (
              <button key={preset.id} onClick={() => setSelectedPreset(preset)} style={{
                padding: '10px',
                borderRadius: 10,
                border: selectedPreset.id === preset.id ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)',
                background: selectedPreset.id === preset.id ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                color: selectedPreset.id === preset.id ? '#c4b5fd' : '#cbd5e1',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <Zap size={14} color={selectedPreset.id === preset.id ? '#a78bfa' : '#64748b'} />
                {preset.name}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={sectionTitleStyle}>动画持续时间</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range"
                min="100"
                max="3000"
                step="100"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#7c3aed' }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, minWidth: 60 }}>{duration}ms</span>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={sectionTitleStyle}>缓动函数</div>
            <select value={timing} onChange={(e) => setTiming(e.target.value)} style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#e0e0e8',
              fontSize: 13,
              cursor: 'pointer'
            }}>
              {timingFunctions.map(t => (
                <option key={t} value={t} style={{ background: '#1a1a2e' }}>{t}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={sectionTitleStyle}>循环次数</div>
              <select value={iterationCount} onChange={(e) => setIterationCount(e.target.value)} style={{
                width: '100%', padding: '10px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#e0e0e8', fontSize: 13
              }}>
                <option value="infinite" style={{ background: '#1a1a2e' }}>无限循环</option>
                <option value="1" style={{ background: '#1a1a2e' }}>1 次</option>
                <option value="2" style={{ background: '#1a1a2e' }}>2 次</option>
                <option value="3" style={{ background: '#1a1a2e' }}>3 次</option>
                <option value="5" style={{ background: '#1a1a2e' }}>5 次</option>
              </select>
            </div>
            <div>
              <div style={sectionTitleStyle}>方向</div>
              <select value={direction} onChange={(e) => setDirection(e.target.value)} style={{
                width: '100%', padding: '10px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#e0e0e8', fontSize: 13
              }}>
                <option value="normal" style={{ background: '#1a1a2e' }}>正常</option>
                <option value="reverse" style={{ background: '#1a1a2e' }}>反向</option>
                <option value="alternate" style={{ background: '#1a1a2e' }}>交替</option>
                <option value="alternate-reverse" style={{ background: '#1a1a2e' }}>交替反向</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={sectionTitleStyle}>预览元素</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {sampleElements.map(el => (
                <button key={el.type} onClick={() => setSelectedElement(el)} style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: selectedElement.type === el.type ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)',
                  background: selectedElement.type === el.type ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  fontSize: 12
                }}>
                  {el.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={sectionTitleStyle}>颜色主题</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {colors.map(c => (
                <button key={c.value} onClick={() => setSelectedColor(c)} style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: c.value,
                  border: selectedColor.value === c.value ? '3px solid white' : '2px solid transparent',
                  cursor: 'pointer',
                  padding: 0
                }} title={c.name} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={mainStyle}>
        <div style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedPreset.name} 动画预览</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {selectedPreset.id} · {duration}ms · {timing}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPlayState(playState === 'playing' ? 'paused' : 'playing')} style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: 'none',
              background: playState === 'playing' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600
            }}>
              {playState === 'playing' ? '暂停' : '播放'}
            </button>
            <button onClick={() => {
              setPlayState('paused')
              setTimeout(() => setPlayState('playing'), 50)
            }} style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#e0e0e8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <RotateCcw size={14} />
            </button>
            <button onClick={() => setShowCode(!showCode)} style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: showCode ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)',
              background: showCode ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)',
              color: showCode ? '#c4b5fd' : '#e0e0e8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <Code2 size={14} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div ref={canvasRef} style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at 50% 50%, rgba(124,58,237,0.05), transparent 70%)',
            position: 'relative',
            overflow: 'hidden',
            minHeight: 300
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }} />
            <div style={elementStyle}>
              {selectedElement.type === 'text' ? 'WebLinuxOS 动画' :
               selectedElement.type === 'button' ? '按钮' :
               selectedElement.type === 'card' ? '卡片内容' :
               selectedElement.type === 'circle' ? '' : ''}
            </div>
          </div>

          {showCode && (
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(0,0,0,0.3)',
              maxHeight: 250,
              overflow: 'auto'
            }}>
              <div style={{
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(0,0,0,0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Code2 size={14} color="#64748b" />
                  <span style={{ fontSize: 12, color: '#64748b' }}>生成的 CSS 代码</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={copyToClipboard} style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                    color: copied ? '#4ade80' : '#e0e0e8',
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    {copied ? <><Check size={12} /> 已复制</> : <><Copy size={12} /> 复制</>}
                  </button>
                  <button onClick={downloadCSS} style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#e0e0e8',
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <Download size={12} /> 下载
                  </button>
                </div>
              </div>
              <pre style={{
                padding: 16,
                margin: 0,
                fontSize: 12,
                lineHeight: 1.6,
                color: '#cbd5e1',
                fontFamily: 'JetBrains Mono, monospace',
                whiteSpace: 'pre-wrap'
              }}>{generatedCSS}</pre>
            </div>
          )}
        </div>

        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <span>已选: {selectedPreset.name}</span>
            <span>时长: {duration}ms</span>
            <span>缓动: {timing}</span>
          </div>
          <div>WebLinuxOS CSS 动画工坊 · {presets.length} 个预设动画</div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideDown { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideLeft { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideRight { from { transform: translateX(-30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-20px); } 60% { transform: translateY(-10px); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes flipX { from { transform: perspective(400px) rotateY(0); } to { transform: perspective(400px) rotateY(360deg); } }
        @keyframes flipY { from { transform: perspective(400px) rotateX(0); } to { transform: perspective(400px) rotateX(360deg); } }
        @keyframes zoomIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes zoomOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0); opacity: 0; } }
        @keyframes swing { 20% { transform: rotate(15deg); } 40% { transform: rotate(-10deg); } 60% { transform: rotate(5deg); } 80% { transform: rotate(-5deg); } 100% { transform: rotate(0deg); } }
        @keyframes tada { 0% { transform: scale(1); } 10%, 20% { transform: scale(0.9) rotate(-3deg); } 30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); } 40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); } 100% { transform: scale(1) rotate(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes jello { 0%, 100% { transform: skewX(0deg) skewY(0deg); } 30% { transform: skewX(-12.5deg) skewY(-12.5deg); } 40% { transform: skewX(6.25deg) skewY(6.25deg); } 50% { transform: skewX(-3.125deg) skewY(-3.125deg); } 60% { transform: skewX(1.5625deg) skewY(1.5625deg); } 70% { transform: skewX(-0.78125deg) skewY(-0.78125deg); } }
        @keyframes heartbeat { 0% { transform: scale(1); } 14% { transform: scale(1.3); } 28% { transform: scale(1); } 42% { transform: scale(1.3); } 70% { transform: scale(1); } }
        @keyframes progress { 0% { width: 0; margin-left: 0; } 50% { width: 100%; margin-left: 0; } 100% { width: 0; margin-left: 100%; } }
        @keyframes stripe { 0% { background-position: 0 0; } 100% { background-position: 40px 0; } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 5px currentColor; } 50% { box-shadow: 0 0 20px currentColor, 0 0 30px currentColor; } }
        @keyframes ripple { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
        @keyframes typing { from { width: 0; } to { width: 100%; } }
        @keyframes rubberBand { 0% { transform: scale(1); } 30% { transform: scaleX(1.25) scaleY(0.75); } 40% { transform: scaleX(0.75) scaleY(1.25); } 60% { transform: scaleX(1.15) scaleY(0.85); } 100% { transform: scale(1); } }
      `}</style>
    </div>
  )
}