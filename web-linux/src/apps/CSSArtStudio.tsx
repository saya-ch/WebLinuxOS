import { useState, useCallback, useMemo, useEffect } from 'react'

// ==================== 类型定义 ====================
type TemplateId = 'gradient' | 'aurora' | 'mesh' | 'particles' | 'waves' | 'geometry' | 'glassmorphism' | 'neon'

interface Template {
  id: TemplateId
  name: string
  icon: string
  description: string
}

interface ArtParams {
  template: TemplateId
  hue: number
  saturation: number
  speed: number
  density: number
  shape: 'circle' | 'square' | 'triangle' | 'star' | 'blob'
  complexity: number
  glow: number
  rotation: number
}

// ==================== 常量 ====================
const TEMPLATES: Template[] = [
  { id: 'gradient', name: '渐变之舞', icon: '🎨', description: '流动的渐变色彩' },
  { id: 'aurora', name: '极光梦境', icon: '🌌', description: '流动的极光效果' },
  { id: 'mesh', name: '网格迷幻', icon: '🔮', description: '柔和的网格渐变' },
  { id: 'particles', name: '粒子宇宙', icon: '✨', description: '漂浮的粒子' },
  { id: 'waves', name: '涟漪波光', icon: '🌊', description: '涟漪水波效果' },
  { id: 'geometry', name: '几何律动', icon: '🔷', description: '几何图形律动' },
  { id: 'glassmorphism', name: '玻璃拟态', icon: '💎', description: '现代玻璃效果' },
  { id: 'neon', name: '霓虹都市', icon: '💡', description: '赛博朋克霓虹' },
]

const SHAPES = [
  { id: 'circle', name: '圆形', icon: '⚪' },
  { id: 'square', name: '方形', icon: '⬛' },
  { id: 'triangle', name: '三角', icon: '🔺' },
  { id: 'star', name: '星形', icon: '⭐' },
  { id: 'blob', name: '水滴', icon: '💧' },
] as const

// ==================== 颜色主题 ====================
const C = {
  bg: '#0d0d1a',
  bgSec: '#161628',
  panel: '#1a1a30',
  panelBorder: 'rgba(139, 92, 246, 0.25)',
  accent: '#8b5cf6',
  accentLight: '#a78bfa',
  text: '#f0f0f5',
  textSec: '#9ca3af',
  sliderTrack: 'rgba(139, 92, 246, 0.2)',
  sliderFill: '#8b5cf6',
  codeBg: '#0f0f1e',
  success: '#22c55e',
  copySuccess: '#10b981',
}

// ==================== CSS生成器 ====================
function generateArtCSS(params: ArtParams): { css: string; html: string; preview: string } {
  const { template, hue, saturation, speed, density, shape, complexity, glow, rotation } = params
  
  const hue2 = (hue + 60) % 360
  const hue3 = (hue + 180) % 360
  const sat = saturation
  const light = 50
  
  switch (template) {
    case 'gradient': {
      const css = `.css-art {
  width: 100%;
  height: 100%;
  background: linear-gradient(${rotation}deg, 
    hsl(${hue}, ${sat}%, ${light}%), 
    hsl(${hue2}, ${sat}%, ${light}%), 
    hsl(${hue3}, ${sat}%, ${light}%));
  background-size: 300% 300%;
  animation: gradient-move ${8 - speed}s ease infinite;
  border-radius: ${shape === 'circle' ? '50%' : shape === 'square' ? '0' : '12px'};
  box-shadow: 0 0 ${glow * 30}px hsla(${hue}, ${sat}%, 50%, 0.5);
}
@keyframes gradient-move {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}`
      return { css, html: '', preview: css }
    }
    
    case 'aurora': {
      const count = Math.max(2, complexity)
      const layers = Array.from({ length: count }, (_, i) => {
        const h = (hue + i * 40) % 360
        const delay = (i * 0.3).toFixed(1)
        return `  .aurora-layer-${i} {
    background: linear-gradient(${90 + i * 30}deg, 
      transparent 0%, hsla(${h}, ${sat}%, 60%, 0.6) 50%, transparent 100%);
    animation: aurora-flow${i} ${6 - speed}s ease-in-out infinite ${delay}s;
  }
  @keyframes aurora-flow${i} {
    0%, 100% { transform: translateX(-30%) translateY(${i * 10}px); }
    50% { transform: translateX(30%) translateY(${i * -10}px); }
  }`
      }).join('\n')
      
      const css = `.aurora-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: ${shape === 'circle' ? '50%' : '16px'};
  box-shadow: 0 0 ${glow * 40}px hsla(${hue}, ${sat}%, 50%, 0.4);
}
.aurora-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, 
    hsla(${hue}, ${sat}%, 30%, 0.3), transparent 70%);
}
${layers}
.aurora-layer {
  position: absolute;
  inset: -20%;
  filter: blur(${20 + glow * 15}px);
  opacity: ${0.4 + density * 0.05};
}`
      return { css, html: '', preview: css }
    }
    
    case 'mesh': {
      const meshPoints = Array.from({ length: Math.min(6, complexity + 2) }, (_, i) => {
        const x = [20, 50, 80, 30, 60, 90][i] || 50
        const y = [30, 20, 50, 70, 40, 80][i] || 50
        const h = (hue + i * 60) % 360
        return ` radial-gradient(at ${x}% ${y}%, 
          hsla(${h}, ${sat}%, 60%, 0.6) 0px, transparent 50%)`
      }).join(',')
      
      const css = `.mesh-gradient {
  width: 100%;
  height: 100%;
  background: ${meshPoints};
  background-color: hsl(${hue3}, ${sat}%, 8%);
  border-radius: ${shape === 'circle' ? '50%' : '20px'};
  animation: mesh-shift ${10 - speed}s ease-in-out infinite;
  box-shadow: 0 0 ${glow * 30}px hsla(${hue}, ${sat}%, 50%, 0.3);
}
@keyframes mesh-shift {
  0%, 100% { filter: hue-rotate(0deg); }
  50% { filter: hue-rotate(${rotation}deg); }
}`
      return { css, html: '', preview: css }
    }
    
    case 'particles': {
      const count = Math.max(5, density)
      const particles = Array.from({ length: count }, (_, i) => {
        const left = (Math.random() * 100).toFixed(1)
        const top = (Math.random() * 100).toFixed(1)
        const size = (3 + Math.random() * 8).toFixed(1)
        const delay = (Math.random() * 3).toFixed(1)
        const h = (hue + Math.random() * 180) % 360
        return `.particle-${i} {
  position: absolute;
  left: ${left}%;
  top: ${top}%;
  width: ${size}px;
  height: ${size}px;
  background: hsl(${h}, ${sat}%, 65%);
  border-radius: 50%;
  box-shadow: 0 0 ${glow * 10}px hsl(${h}, ${sat}%, 60%);
  animation: particle-float ${5 - speed}s ease-in-out infinite ${delay}s;
}`
      }).join('\n')
      
      const css = `.particles-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: radial-gradient(ellipse at 50% 50%, 
    hsl(${hue3}, ${sat}%, 10%), hsl(${hue}, ${sat}%, 5%));
  border-radius: ${shape === 'circle' ? '50%' : '12px'};
  overflow: hidden;
}
${particles}
@keyframes particle-float {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
  50% { transform: translateY(-20px) scale(1.2); opacity: 1; }
}`
      return { css, html: '', preview: css }
    }
    
    case 'waves': {
      const waveCount = Math.max(2, complexity)
      const waves = Array.from({ length: waveCount }, (_, i) => {
        const h = (hue + i * 40) % 360
        const amp = 10 + i * 5
        return `.wave-${i} {
  position: absolute;
  bottom: ${i * 15}%;
  left: -50%;
  width: 200%;
  height: ${amp * 2}px;
  background: linear-gradient(to top, 
    hsla(${h}, ${sat}%, 50%, ${0.3 + density * 0.05}), 
    transparent);
  border-radius: 50%;
  filter: blur(${5 + i * 3}px);
  animation: wave-move ${8 - speed}s ease-in-out infinite ${i * 0.5}s;
  transform-origin: center;
}
@keyframes wave-move {
  0%, 100% { transform: translateX(0) scaleY(1); }
  50% { transform: translateX(25%) scaleY(${1 + i * 0.1}); }
}`
      }).join('\n')
      
      const css = `.waves-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(180deg, 
    hsl(${hue}, ${sat}%, 15%), 
    hsl(${hue3}, ${sat}%, 8%));
  border-radius: ${shape === 'circle' ? '50%' : '16px'};
  overflow: hidden;
  box-shadow: 0 0 ${glow * 20}px hsla(${hue}, ${sat}%, 50%, 0.3);
}
${waves}`
      return { css, html: '', preview: css }
    }
    
    case 'geometry': {
      const shapes = Array.from({ length: Math.max(3, density) }, (_, i) => {
        const h = (hue + i * 30) % 360
        const size = 40 + i * 15
        const left = [15, 45, 70, 25, 60][i % 5]
        const top = [20, 55, 30, 70, 45][i % 5]
        const delay = (i * 0.2).toFixed(1)
        return `.shape-${i} {
  position: absolute;
  left: ${left}%;
  top: ${top}%;
  width: ${size}px;
  height: ${size}px;
  background: linear-gradient(${rotation}deg, 
    hsl(${h}, ${sat}%, 55%), hsl(${(h + 60) % 360}, ${sat}%, 45%));
  border-radius: ${i % 3 === 0 ? '50%' : i % 3 === 1 ? '8px' : '0'};
  box-shadow: 0 0 ${glow * 15}px hsla(${h}, ${sat}%, 50%, 0.5);
  animation: geo-spin ${6 - speed}s linear infinite ${delay}s;
}`
      }).join('\n')
      
      const css = `.geometry-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: hsl(${hue3}, ${sat}%, 8%);
  border-radius: ${shape === 'circle' ? '50%' : '12px'};
  overflow: hidden;
}
${shapes}
@keyframes geo-spin {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(${rotation}deg) scale(${1.1 + complexity * 0.05}); }
  100% { transform: rotate(360deg) scale(1); }
}`
      return { css, html: '', preview: css }
    }
    
    case 'glassmorphism': {
      const cards = Array.from({ length: Math.max(2, Math.min(5, complexity)) }, (_, i) => {
        const h = (hue + i * 50) % 360
        const size = 100 + i * 30
        return `.glass-card-${i} {
  position: absolute;
  width: ${size}px;
  height: ${size * 0.7}px;
  background: hsla(${h}, ${sat}%, 50%, ${0.15 + density * 0.03});
  backdrop-filter: blur(${10 + glow * 5}px);
  -webkit-backdrop-filter: blur(${10 + glow * 5}px);
  border: 1px solid hsla(${h}, ${sat}%, 70%, 0.3);
  border-radius: 16px;
  box-shadow: 0 8px ${20 + glow * 10}px hsla(${h}, ${sat}%, 50%, 0.2);
  animation: glass-float ${5 - speed}s ease-in-out infinite ${i * 0.3}s;
}`
      }).join('\n')
      
      const css = `.glass-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(${rotation}deg, 
    hsl(${hue}, ${sat}%, 25%), 
    hsl(${hue2}, ${sat}%, 20%), 
    hsl(${hue3}, ${sat}%, 15%));
  background-size: 400% 400%;
  animation: glass-bg ${15 - speed * 2}s ease infinite;
  border-radius: ${shape === 'circle' ? '50%' : '20px'};
  overflow: hidden;
}
${cards}
@keyframes glass-bg {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
@keyframes glass-float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(${5 + glow * 3}px) rotate(${rotation * 0.2}deg); }
}`
      return { css, html: '', preview: css }
    }
    
    case 'neon': {
      const elements = Array.from({ length: Math.max(3, density) }, (_, i) => {
        const h = (hue + i * 45) % 360
        const size = 20 + i * 10
        return `.neon-line-${i} {
  position: absolute;
  width: ${size}px;
  height: ${size}px;
  border: 2px solid hsl(${h}, ${sat}%, 60%);
  border-radius: ${i % 2 === 0 ? '50%' : '4px'};
  box-shadow: 
    0 0 ${glow * 8}px hsl(${h}, ${sat}%, 60%),
    0 0 ${glow * 15}px hsla(${h}, ${sat}%, 60%, 0.5),
    inset 0 0 ${glow * 5}px hsla(${h}, ${sat}%, 70%, 0.3);
  animation: neon-pulse ${3 - speed * 0.3}s ease-in-out infinite ${i * 0.15}s;
}`
      }).join('\n')
      
      const css = `.neon-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: 
    radial-gradient(circle at 30% 40%, hsla(${hue}, ${sat}%, 20%, 0.3), transparent 50%),
    radial-gradient(circle at 70% 60%, hsla(${hue2}, ${sat}%, 15%, 0.3), transparent 50%),
    #0a0a12;
  border-radius: ${shape === 'circle' ? '50%' : '8px'};
  overflow: hidden;
}
.neon-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(hsla(${hue}, ${sat}%, 50%, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, hsla(${hue}, ${sat}%, 50%, 0.1) 1px, transparent 1px);
  background-size: ${20 + complexity * 5}px ${20 + complexity * 5}px;
}
${elements}
@keyframes neon-pulse {
  0%, 100% { 
    opacity: 0.8; 
    transform: scale(1) rotate(0deg);
    filter: brightness(1);
  }
  50% { 
    opacity: 1; 
    transform: scale(${1.1 + glow * 0.05}) rotate(${rotation}deg);
    filter: brightness(1.3);
  }
}`
      return { css, html: '', preview: css }
    }
  }
}

// ==================== 预览组件 ====================
function ArtPreview({ params }: { params: ArtParams }) {
  const [, setError] = useState(false)
  
  useEffect(() => {
    setError(false)
  }, [params])
  
  const { template, hue, saturation, speed, density, complexity, glow, rotation } = params
  
  const containerClass = {
    gradient: 'css-art',
    aurora: 'aurora-container',
    mesh: 'mesh-gradient',
    particles: 'particles-container',
    waves: 'waves-container',
    geometry: 'geometry-container',
    glassmorphism: 'glass-container',
    neon: 'neon-container',
  }[template]
  
  return (
    <div 
      className={containerClass}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '300px',
      }}
    >
      {/* 动态子元素 */}
      {template === 'aurora' && (
        <>
          <div className="aurora-bg" />
          {Array.from({ length: Math.max(2, complexity) }, (_, i) => {
            const h = (hue + i * 40) % 360
            return (
              <div 
                key={i}
                className={`aurora-layer aurora-layer-${i}`}
                style={{
                  position: 'absolute',
                  inset: '-20%',
                  background: `linear-gradient(${90 + i * 30}deg, transparent 0%, hsla(${h}, ${saturation}%, 60%, 0.6) 50%, transparent 100%)`,
                  filter: `blur(${20 + glow * 15}px)`,
                  opacity: 0.4 + density * 0.05,
                  animation: `aurora-flow${i} ${6 - speed}s ease-in-out infinite ${(i * 0.3).toFixed(1)}s`,
                }}
              />
            )
          })}
          <style>{generateKeyframes(template, complexity, speed)}</style>
        </>
      )}
      
      {template === 'particles' && (
        <>
          {Array.from({ length: Math.max(5, density) }, (_, i) => {
            const h = (hue + (i * 30) % 360) % 360
            const size = 3 + (i % 5) * 2
            const left = (i * 17 + 10) % 100
            const top = (i * 23 + 5) % 100
            return (
              <div
                key={i}
                className={`particle-${i}`}
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  background: `hsl(${h}, ${saturation}%, 65%)`,
                  borderRadius: '50%',
                  boxShadow: `0 0 ${glow * 10}px hsl(${h}, ${saturation}%, 60%)`,
                  animation: `particle-float ${5 - speed}s ease-in-out infinite ${(i * 0.2).toFixed(1)}s`,
                }}
              />
            )
          })}
          <style>{`
            @keyframes particle-float {
              0%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
              50% { transform: translateY(-20px) scale(1.2); opacity: 1; }
            }
          `}</style>
        </>
      )}
      
      {template === 'geometry' && (
        <>
          {Array.from({ length: Math.max(3, density) }, (_, i) => {
            const h = (hue + i * 30) % 360
            const size = 40 + i * 15
            const positions = [
              { left: '15%', top: '20%' },
              { left: '45%', top: '55%' },
              { left: '70%', top: '30%' },
              { left: '25%', top: '70%' },
              { left: '60%', top: '45%' },
            ]
            const pos = positions[i % positions.length]
            const borderRadius = i % 3 === 0 ? '50%' : i % 3 === 1 ? '8px' : '0'
            return (
              <div
                key={i}
                className={`shape-${i}`}
                style={{
                  position: 'absolute',
                  left: pos.left,
                  top: pos.top,
                  width: `${size}px`,
                  height: `${size}px`,
                  background: `linear-gradient(${rotation}deg, hsl(${h}, ${saturation}%, 55%), hsl(${(h + 60) % 360}, ${saturation}%, 45%))`,
                  borderRadius,
                  boxShadow: `0 0 ${glow * 15}px hsla(${h}, ${saturation}%, 50%, 0.5)`,
                  animation: `geo-spin ${6 - speed}s linear infinite ${(i * 0.2).toFixed(1)}s`,
                }}
              />
            )
          })}
          <style>{`
            @keyframes geo-spin {
              0% { transform: rotate(0deg) scale(1); }
              50% { transform: rotate(${rotation}deg) scale(${1.1 + complexity * 0.05}); }
              100% { transform: rotate(360deg) scale(1); }
            }
          `}</style>
        </>
      )}
      
      {template === 'glassmorphism' && (
        <>
          <div className="neon-grid" style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(hsla(${hue}, ${saturation}%, 50%, 0.1) 1px, transparent 1px), linear-gradient(90deg, hsla(${hue}, ${saturation}%, 50%, 0.1) 1px, transparent 1px)`,
            backgroundSize: `${20 + complexity * 5}px ${20 + complexity * 5}px`,
          }} />
          {Array.from({ length: Math.max(2, Math.min(5, complexity)) }, (_, i) => {
            const h = (hue + i * 50) % 360
            const size = 100 + i * 30
            const positions = [
              { left: '10%', top: '20%' },
              { left: '40%', top: '40%' },
              { left: '60%', top: '25%' },
              { left: '20%', top: '55%' },
              { left: '50%', top: '60%' },
            ]
            const pos = positions[i % positions.length]
            return (
              <div
                key={i}
                className={`glass-card-${i}`}
                style={{
                  position: 'absolute',
                  left: pos.left,
                  top: pos.top,
                  width: `${size}px`,
                  height: `${size * 0.7}px`,
                  background: `hsla(${h}, ${saturation}%, 50%, ${0.15 + density * 0.03})`,
                  backdropFilter: `blur(${10 + glow * 5}px)`,
                  WebkitBackdropFilter: `blur(${10 + glow * 5}px)`,
                  border: `1px solid hsla(${h}, ${saturation}%, 70%, 0.3)`,
                  borderRadius: '16px',
                  boxShadow: `0 8px ${20 + glow * 10}px hsla(${h}, ${saturation}%, 50%, 0.2)`,
                  animation: `glass-float ${5 - speed}s ease-in-out infinite ${(i * 0.3).toFixed(1)}s`,
                }}
              />
            )
          })}
          <style>{`
            @keyframes glass-float {
              0%, 100% { transform: translateY(0) rotate(0deg); }
              50% { transform: translateY(${5 + glow * 3}px) rotate(${rotation * 0.2}deg); }
            }
          `}</style>
        </>
      )}
      
      {template === 'neon' && (
        <>
          <div className="neon-grid" style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(hsla(${hue}, ${saturation}%, 50%, 0.1) 1px, transparent 1px), linear-gradient(90deg, hsla(${hue}, ${saturation}%, 50%, 0.1) 1px, transparent 1px)`,
            backgroundSize: `${20 + complexity * 5}px ${20 + complexity * 5}px`,
          }} />
          {Array.from({ length: Math.max(3, density) }, (_, i) => {
            const h = (hue + i * 45) % 360
            const size = 20 + i * 10
            const positions = [
              { left: '20%', top: '30%' },
              { left: '60%', top: '40%' },
              { left: '40%', top: '65%' },
              { left: '75%', top: '55%' },
              { left: '30%', top: '75%' },
            ]
            const pos = positions[i % positions.length]
            return (
              <div
                key={i}
                className={`neon-line-${i}`}
                style={{
                  position: 'absolute',
                  left: pos.left,
                  top: pos.top,
                  width: `${size}px`,
                  height: `${size}px`,
                  border: `2px solid hsl(${h}, ${saturation}%, 60%)`,
                  borderRadius: i % 2 === 0 ? '50%' : '4px',
                  boxShadow: `0 0 ${glow * 8}px hsl(${h}, ${saturation}%, 60%), 0 0 ${glow * 15}px hsla(${h}, ${saturation}%, 60%, 0.5), inset 0 0 ${glow * 5}px hsla(${h}, ${saturation}%, 70%, 0.3)`,
                  animation: `neon-pulse ${3 - speed * 0.3}s ease-in-out infinite ${(i * 0.15).toFixed(1)}s`,
                }}
              />
            )
          })}
          <style>{`
            @keyframes neon-pulse {
              0%, 100% { opacity: 0.8; transform: scale(1) rotate(0deg); filter: brightness(1); }
              50% { opacity: 1; transform: scale(${1.1 + glow * 0.05}) rotate(${rotation}deg); filter: brightness(1.3); }
            }
          `}</style>
        </>
      )}
    </div>
  )
}

function generateKeyframes(template: TemplateId, complexity: number, _speed: number): string {
  const animations: string[] = []
  const count = Math.max(2, complexity)
  
  if (template === 'aurora') {
    for (let i = 0; i < count; i++) {
      animations.push(`
        @keyframes aurora-flow${i} {
          0%, 100% { transform: translateX(-30%) translateY(${i * 10}px); }
          50% { transform: translateX(30%) translateY(${i * -10}px); }
        }
      `)
    }
  }
  
  return animations.join('\n')
}

// ==================== 主应用 ====================
export default function CSSArtStudio() {
  const [params, setParams] = useState<ArtParams>({
    template: 'aurora',
    hue: 260,
    saturation: 70,
    speed: 3,
    density: 5,
    shape: 'blob',
    complexity: 4,
    glow: 0.5,
    rotation: 45,
  })
  
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'gallery'>('preview')
  const [copied, setCopied] = useState(false)
  const [gallery, setGallery] = useState<{ id: number; params: ArtParams; thumbnail: string }[]>([])
  
  // 加载画廊
  useEffect(() => {
    const saved = localStorage.getItem('css-art-gallery')
    if (saved) {
      try {
        setGallery(JSON.parse(saved))
      } catch {}
    }
  }, [])
  
  const updateParam = useCallback(<K extends keyof ArtParams>(key: K, value: ArtParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }, [])
  
  const generatedCSS = useMemo(() => {
    return generateArtCSS(params).css
  }, [params])
  
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }, [])
  
  const saveToGallery = useCallback(() => {
    const newItem = {
      id: Date.now(),
      params: { ...params },
      thumbnail: `${params.template}-${params.hue}-${Date.now()}`,
    }
    const updated = [newItem, ...gallery].slice(0, 20)
    setGallery(updated)
    localStorage.setItem('css-art-gallery', JSON.stringify(updated))
  }, [params, gallery])
  
  const loadFromGallery = useCallback((item: { params: ArtParams }) => {
    setParams(item.params)
  }, [])
  
  const deleteFromGallery = useCallback((id: number) => {
    const updated = gallery.filter(g => g.id !== id)
    setGallery(updated)
    localStorage.setItem('css-art-gallery', JSON.stringify(updated))
  }, [gallery])
  
  const exportHTML = useCallback(() => {
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>CSS Art Studio Export</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #1a1a2e; }
  .art-container { width: 400px; height: 400px; }
  ${generatedCSS}
</style>
</head>
<body>
  <div class="art-container">
    <div class="${params.template === 'gradient' ? 'css-art' : 
                  params.template === 'aurora' ? 'aurora-container' :
                  params.template === 'mesh' ? 'mesh-gradient' :
                  params.template === 'particles' ? 'particles-container' :
                  params.template === 'waves' ? 'waves-container' :
                  params.template === 'geometry' ? 'geometry-container' :
                  params.template === 'glassmorphism' ? 'glass-container' :
                  'neon-container'}">
      ${params.template === 'aurora' ? `
        <div class="aurora-bg"></div>
        ${Array.from({ length: Math.max(2, params.complexity) }, (_, i) => 
          `<div class="aurora-layer aurora-layer-${i}"></div>`
        ).join('\n')}
      ` : ''}
    </div>
  </div>
</body>
</html>`
    
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `css-art-${params.template}-${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [generatedCSS, params])
  
  const downloadCSS = useCallback(() => {
    const blob = new Blob([generatedCSS], { type: 'text/css' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `css-art-${params.template}.css`
    a.click()
    URL.revokeObjectURL(url)
  }, [generatedCSS, params])

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: C.bg, color: C.text,
      fontFamily: "'Noto Sans SC', 'Space Grotesk', sans-serif",
    }}>
      {/* 顶部标题栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', borderBottom: `1px solid ${C.panelBorder}`,
        background: C.bgSec,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>🎨</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>CSS Art Studio · CSS艺术工作室</div>
            <div style={{ fontSize: 12, color: C.textSec }}>生成优雅的纯CSS艺术效果</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={saveToGallery} style={btnStyle.secondary}>
            收藏
          </button>
          <button onClick={downloadCSS} style={btnStyle.secondary}>
            下载CSS
          </button>
          <button onClick={exportHTML} style={btnStyle.primary}>
            导出HTML
          </button>
        </div>
      </div>
      
      {/* 标签页切换 */}
      <div style={{ display: 'flex', gap: 4, padding: '8px 20px', borderBottom: `1px solid ${C.panelBorder}` }}>
        {(['preview', 'code', 'gallery'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '6px 16px',
              background: activeTab === tab ? C.accent : 'transparent',
              color: activeTab === tab ? '#fff' : C.textSec,
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeTab === tab ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            {tab === 'preview' ? '🎨 预览' : tab === 'code' ? '💻 代码' : '🖼️ 画廊'}
          </button>
        ))}
      </div>
      
      {/* 主内容区 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左侧控制面板 */}
        <div style={{
          width: 280, padding: 16,
          background: C.bgSec, borderRight: `1px solid ${C.panelBorder}`,
          overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {/* 模板选择 */}
          <div>
            <div style={sectionTitle}>模板风格</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => updateParam('template', t.id)}
                  style={{
                    padding: '8px 6px',
                    background: params.template === t.id ? C.accent : C.panel,
                    border: params.template === t.id ? `1px solid ${C.accent}` : `1px solid ${C.panelBorder}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    color: params.template === t.id ? C.accentLight : C.text,
                    fontSize: 12,
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                  title={t.description}
                >
                  <div style={{ fontSize: 18 }}>{t.icon}</div>
                  <div>{t.name}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* 参数控制 */}
          <div>
            <div style={sectionTitle}>参数</div>
            
            <Slider
              label="色相"
              value={params.hue}
              min={0} max={360} step={1}
              onChange={v => updateParam('hue', v)}
              unit="°"
            />
            <Slider
              label="饱和度"
              value={params.saturation}
              min={0} max={100} step={1}
              onChange={v => updateParam('saturation', v)}
              unit="%"
            />
            <Slider
              label="动画速度"
              value={params.speed}
              min={0.5} max={5} step={0.1}
              onChange={v => updateParam('speed', v)}
            />
            <Slider
              label="复杂度"
              value={params.complexity}
              min={1} max={8} step={1}
              onChange={v => updateParam('complexity', v)}
            />
            <Slider
              label="密度"
              value={params.density}
              min={1} max={10} step={1}
              onChange={v => updateParam('density', v)}
            />
            <Slider
              label="发光强度"
              value={params.glow}
              min={0} max={2} step={0.1}
              onChange={v => updateParam('glow', v)}
            />
            <Slider
              label="旋转角度"
              value={params.rotation}
              min={0} max={360} step={1}
              onChange={v => updateParam('rotation', v)}
              unit="°"
            />
          </div>
          
          {/* 形状选择 */}
          <div>
            <div style={sectionTitle}>容器形状</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {SHAPES.map(s => (
                <button
                  key={s.id}
                  onClick={() => updateParam('shape', s.id)}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    background: params.shape === s.id ? C.accent : C.panel,
                    border: params.shape === s.id ? `1px solid ${C.accent}` : `1px solid ${C.panelBorder}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: params.shape === s.id ? C.accentLight : C.textSec,
                    fontSize: 11,
                    transition: 'all 0.2s',
                  }}
                >
                  {s.icon} {s.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* 预设按钮 */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => {
              setParams(p => ({
                ...p,
                hue: Math.floor(Math.random() * 360),
                saturation: 50 + Math.floor(Math.random() * 40),
                speed: 1 + Math.random() * 3,
                density: 3 + Math.floor(Math.random() * 7),
                complexity: 2 + Math.floor(Math.random() * 5),
                glow: Math.random() * 1.5,
                rotation: Math.floor(Math.random() * 360),
              }))
            }} style={btnStyle.random}>
              🎲 随机
            </button>
            <button onClick={() => {
              setParams({
                template: 'aurora',
                hue: 260,
                saturation: 70,
                speed: 3,
                density: 5,
                shape: 'blob',
                complexity: 4,
                glow: 0.5,
                rotation: 45,
              })
            }} style={btnStyle.reset}>
              🔄 重置
            </button>
          </div>
        </div>
        
        {/* 右侧内容区 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, overflow: 'auto' }}>
          {activeTab === 'preview' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                flex: 1,
                minHeight: 300,
                background: C.bgSec,
                borderRadius: 16,
                border: `1px solid ${C.panelBorder}`,
                padding: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{ width: '100%', maxWidth: 500, aspectRatio: '1' }}>
                  <ArtPreview params={params} />
                </div>
              </div>
              
              {/* 参数速览 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
              }}>
                <InfoCard label="当前模板" value={TEMPLATES.find(t => t.id === params.template)?.name || ''} icon="🎨" />
                <InfoCard label="主色相" value={`${params.hue}°`} icon="🌈" />
                <InfoCard label="动画速度" value={`${params.speed.toFixed(1)}x`} icon="⚡" />
                <InfoCard label="复杂度" value={`${params.complexity}`} icon="🔢" />
              </div>
            </div>
          )}
          
          {activeTab === 'code' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, color: C.textSec }}>
                  生成的CSS代码 - 复制并在任何项目中使用
                </div>
                <button onClick={() => copyToClipboard(generatedCSS)} style={btnStyle.primary}>
                  {copied ? '✓ 已复制' : '📋 复制代码'}
                </button>
              </div>
              <pre style={{
                flex: 1,
                background: C.codeBg,
                borderRadius: 12,
                padding: 20,
                overflow: 'auto',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                lineHeight: 1.6,
                color: '#a5f3fc',
                border: `1px solid ${C.panelBorder}`,
              }}>
                {generatedCSS}
              </pre>
              <div style={{
                background: C.accent,
                border: `1px solid ${C.accent}`,
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 12,
                color: C.accentLight,
              }}>
                💡 提示：将此CSS添加到您的项目中，使用对应的HTML结构即可看到效果。
                导出完整HTML文件可以一键使用。
              </div>
            </div>
          )}
          
          {activeTab === 'gallery' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, color: C.textSec }}>
                  我的收藏 ({gallery.length})
                </div>
                {gallery.length > 0 && (
                  <button onClick={() => {
                    if (confirm('清空所有收藏？')) {
                      setGallery([])
                      localStorage.removeItem('css-art-gallery')
                    }
                  }} style={btnStyle.danger}>
                    🗑️ 清空全部
                  </button>
                )}
              </div>
              
              {gallery.length === 0 ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  color: C.textSec,
                }}>
                  <div style={{ fontSize: 48 }}>🎨</div>
                  <div style={{ fontSize: 16 }}>还没有收藏的作品</div>
                  <div style={{ fontSize: 12 }}>在预览页面点击"收藏"按钮保存你的作品</div>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 12,
                }}>
                  {gallery.map(item => (
                    <div
                      key={item.id}
                      style={{
                        background: C.bgSec,
                        borderRadius: 12,
                        border: `1px solid ${C.panelBorder}`,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => loadFromGallery(item)}
                      onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
                      onMouseLeave={e => e.currentTarget.style.borderColor = C.panelBorder}
                    >
                      <div style={{ height: 120, padding: 8 }}>
                        <ArtPreview params={item.params} />
                      </div>
                      <div style={{
                        padding: '10px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: `1px solid ${C.panelBorder}`,
                      }}>
                        <div style={{ fontSize: 12 }}>
                          {TEMPLATES.find(t => t.id === item.params.template)?.name}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteFromGallery(item.id) }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: C.textSec,
                            cursor: 'pointer',
                            fontSize: 14,
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== 子组件 ====================
function Slider({ label, value, min, max, step, onChange, unit }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  unit?: string
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: C.textSec }}>{label}</span>
        <span style={{ fontSize: 12, color: C.accentLight, fontWeight: 600 }}>
          {typeof value === 'number' ? value.toFixed(step < 1 ? 1 : 0) : value}{unit || ''}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: C.accent }}
      />
    </div>
  )
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={{
      background: C.bgSec,
      border: `1px solid ${C.panelBorder}`,
      borderRadius: 10,
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: C.textSec }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{value}</div>
      </div>
    </div>
  )
}

// ==================== 样式 ====================
const btnStyle = {
  primary: {
    padding: '8px 16px',
    background: C.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  secondary: {
    padding: '8px 16px',
    background: C.bgSec,
    color: C.text,
    border: `1px solid ${C.panelBorder}`,
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    transition: 'all 0.2s',
  },
  random: {
    padding: '8px 12px',
    background: C.accent,
    color: C.accentLight,
    border: `1px solid ${C.accent}`,
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12,
    flex: 1,
    transition: 'all 0.2s',
  },
  reset: {
    padding: '8px 12px',
    background: C.panel,
    color: C.textSec,
    border: `1px solid ${C.panelBorder}`,
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12,
    flex: 1,
    transition: 'all 0.2s',
  },
  danger: {
    padding: '6px 12px',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    transition: 'all 0.2s',
  },
}

const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: C.textSec,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginBottom: 8,
}
