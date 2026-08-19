import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'

declare const __APP_VERSION__: string

interface BootAnimationProps {
  onComplete: () => void
}

const loadingMessages = [
  '正在初始化系统核心...',
  '加载驱动模块...',
  '挂载文件系统...',
  '启动图形界面...',
  '初始化窗口管理器...',
  '加载用户配置...',
  '建立安全隧道...',
  '优化渲染管线...',
  '准备就绪'
]

const techQuotes = [
  '"代码就像幽默。当你不得不解释它时，它就不好了。"',
  '"过早的优化是万恶之源。" — Donald Knuth',
  '"任何傻瓜都能写出计算机能懂的代码，好程序员写人能懂的。"',
  '"真正的高手是从错误中学习的，不是从成功中。"',
  '"简洁是复杂的最终形式。"',
  '"先让它跑起来，再让它跑对，最后让它跑快。"',
  '"计算机科学不仅仅是关于计算机的，就像天文学不仅仅是关于望远镜的。"',
  '"程序必须被写给人读，只是顺便让机器执行。"',
  '"第一次就把事情做对，比事后修复要便宜得多。"'
]

interface Particle {
  id: number
  left: string
  top: string
  size: number
  duration: number
  delay: number
  color: string
}

const ParticleField = memo(() => {
  const particles = useMemo<Particle[]>(() => {
    const colors = ['#7c6cf0', '#00d6c1', '#9b8af0', '#4fd1c5', '#63b3ed']
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 8 + 4,
      delay: Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)]
    }))
  }, [])

  return (
    <div className="particle-field">
      {particles.map(p => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            boxShadow: `0 0 ${p.size * 4}px ${p.color}`
          }}
        />
      ))}
    </div>
  )
})

ParticleField.displayName = 'ParticleField'

function BootAnimation({ onComplete }: BootAnimationProps) {
  const [progress, setProgress] = useState(0)
  const [currentMessage, setCurrentMessage] = useState('')
  const [currentQuote, setCurrentQuote] = useState('')
  const [showContent, setShowContent] = useState(false)
  const [fading, setFading] = useState(false)
  const completedRef = useRef(false)
  const progressRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  const finishBoot = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    setFading(true)
    setTimeout(() => {
      setShowContent(false)
      onComplete()
    }, 600)
  }, [onComplete])

  useEffect(() => {
    setShowContent(true)

    const quoteIndex = Math.floor(Math.random() * techQuotes.length)
    setCurrentQuote(techQuotes[quoteIndex])

    let messageInterval: ReturnType<typeof setInterval> | null = null
    let messageIndex = 0

    const updateMessage = () => {
      if (messageIndex < loadingMessages.length) {
        setCurrentMessage(loadingMessages[messageIndex])
        messageIndex++
      }
    }

    updateMessage()

    messageInterval = setInterval(() => {
      updateMessage()
    }, 350)

    const animate = () => {
      if (completedRef.current) return

      // 使用时间增量而非帧增量，确保在不同帧率下进度一致
      // 约2.5秒完成加载
      const increment = (100 - progressRef.current) * 0.025 + 1.5
      progressRef.current = Math.min(progressRef.current + increment, 100)
      setProgress(progressRef.current)

      if (progressRef.current >= 100) {
        if (messageInterval) clearInterval(messageInterval)
        finishBoot()
        return
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    const skip = () => {
      if (completedRef.current) return
      if (messageInterval) clearInterval(messageInterval)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      progressRef.current = 100
      setProgress(100)
      setCurrentMessage('正在加速启动...')
      finishBoot()
    }

    window.addEventListener('keydown', skip)
    window.addEventListener('click', skip)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (messageInterval) clearInterval(messageInterval)
      window.removeEventListener('keydown', skip)
      window.removeEventListener('click', skip)
    }
  }, [finishBoot])

  if (!showContent) return null

  const displayProgress = Math.floor(Math.min(progress, 100))

  return (
    <div
      className={`boot-overlay${fading ? ' fading' : ''}`}
      onClick={() => {}}
    >
      <ParticleField />

      <div className="boot-grid-bg" />

      <div className="boot-container">
        <div className="boot-logo">
          <div className="logo-ring-outer" />
          <div className="logo-ring" />
          <div className="logo-ring-inner" />
          <div className="logo-ring-core" />
          <div className="logo-center">
            <span className="logo-text">W</span>
          </div>
        </div>

        <div className="boot-info">
          <div className="boot-title">
            <span className="title-main">WebLinuxOS</span>
            <span className="title-sub">NEXUS</span>
          </div>
          <div className="boot-version">v{__APP_VERSION__} · Quantum Core</div>
        </div>

        <div className="boot-progress-container">
          <div className="boot-progress-bar">
            <div
              className="boot-progress-fill"
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              <div className="progress-glow" />
              <div className="progress-shine" />
              <div className="progress-tick" />
            </div>
          </div>
          <div className="boot-progress-info">
            <span className="boot-progress-text">{displayProgress}%</span>
            <div className="boot-progress-ticks">
              {Array.from({ length: 20 }, (_, i) => (
                <span
                  key={i}
                  className={`tick${i < Math.floor(displayProgress / 5) ? ' active' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="boot-message">
          <span className="message-icon">›</span>
          {currentMessage}
          <span className="cursor">_</span>
        </div>

        <div className="boot-quote">
          <p>{currentQuote}</p>
        </div>

        <div className="boot-status-grid">
          <div className="status-item">
            <span className="status-dot active" />
            <span className="status-text">系统</span>
          </div>
          <div className="status-item">
            <span className="status-dot active" />
            <span className="status-text">图形</span>
          </div>
          <div className="status-item">
            <span className="status-dot" />
            <span className="status-text">网络</span>
          </div>
          <div className="status-item">
            <span className="status-dot" />
            <span className="status-text">存储</span>
          </div>
        </div>

        <div className="boot-hint">按任意键或点击屏幕加速启动</div>
      </div>

      <style>{`
        .boot-overlay {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at 50% 30%, #0d0d1a 0%, #050508 70%, #020204 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          overflow: hidden;
        }

        .boot-overlay.fading {
          animation: bootFadeOut 0.6s ease-out forwards;
        }

        @keyframes bootFadeOut {
          0% {
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            opacity: 0;
            filter: blur(10px);
            visibility: hidden;
            pointer-events: none;
          }
        }

        .particle-field {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          opacity: 0.6;
          animation: particleFloat linear infinite, particlePulse ease-in-out infinite;
        }

        @keyframes particleFloat {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-30px) translateX(15px);
          }
          50% {
            transform: translateY(-60px) translateX(-10px);
          }
          75% {
            transform: translateY(-30px) translateX(20px);
          }
        }

        @keyframes particlePulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.9;
          }
        }

        .boot-grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(124, 108, 240, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124, 108, 240, 0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse at 50% 50%, black 20%, transparent 70%);
          -webkit-mask-image: radial-gradient(ellipse at 50% 50%, black 20%, transparent 70%);
          pointer-events: none;
        }

        .boot-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          animation: bootSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 1;
        }

        @keyframes bootSlideUp {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
            filter: blur(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
        }

        .boot-logo {
          position: relative;
          width: 140px;
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-ring-outer {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 1px solid rgba(124, 108, 240, 0.15);
          border-radius: 50%;
          animation: ringPulse 3s ease-in-out infinite;
        }

        .logo-ring {
          position: absolute;
          width: 92%;
          height: 92%;
          border: 2px solid transparent;
          border-top-color: #7c6cf0;
          border-right-color: #00d6c1;
          border-radius: 50%;
          animation: ringSpin 2s linear infinite;
          filter: drop-shadow(0 0 8px rgba(124, 108, 240, 0.5));
        }

        .logo-ring-inner {
          position: absolute;
          width: 72%;
          height: 72%;
          border: 2px solid transparent;
          border-bottom-color: #9b8af0;
          border-left-color: #4fd1c5;
          border-radius: 50%;
          animation: ringSpin 3s linear infinite reverse;
          filter: drop-shadow(0 0 6px rgba(0, 214, 193, 0.4));
        }

        .logo-ring-core {
          position: absolute;
          width: 50%;
          height: 50%;
          border: 1px solid rgba(155, 138, 240, 0.4);
          border-radius: 50%;
          animation: ringPulse 2s ease-in-out infinite 0.5s;
        }

        @keyframes ringSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes ringPulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.08);
          }
        }

        .logo-center {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #7c6cf0 0%, #00d6c1 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 0 40px rgba(124, 108, 240, 0.6),
            0 0 80px rgba(0, 214, 193, 0.3),
            inset 0 0 20px rgba(255, 255, 255, 0.1);
          animation: logoPulse 2s ease-in-out infinite;
          position: relative;
        }

        .logo-center::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c6cf0 0%, #00d6c1 100%);
          opacity: 0.3;
          filter: blur(12px);
          z-index: -1;
        }

        @keyframes logoPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow:
              0 0 40px rgba(124, 108, 240, 0.6),
              0 0 80px rgba(0, 214, 193, 0.3),
              inset 0 0 20px rgba(255, 255, 255, 0.1);
          }
          50% {
            transform: scale(1.08);
            box-shadow:
              0 0 60px rgba(124, 108, 240, 0.8),
              0 0 100px rgba(0, 214, 193, 0.5),
              inset 0 0 25px rgba(255, 255, 255, 0.2);
          }
        }

        .logo-text {
          font-size: 26px;
          font-weight: 700;
          color: white;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }

        .boot-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .boot-title {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }

        .title-main {
          font-size: 26px;
          font-weight: 700;
          color: #f0f0ff;
          letter-spacing: 3px;
          background: linear-gradient(90deg, #f0f0ff 0%, #7c6cf0 50%, #00d6c1 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .title-sub {
          font-size: 11px;
          font-weight: 600;
          color: #00d6c1;
          letter-spacing: 4px;
          padding: 2px 8px;
          border: 1px solid rgba(0, 214, 193, 0.4);
          border-radius: 4px;
          text-transform: uppercase;
        }

        .boot-version {
          font-size: 11px;
          color: #4a5568;
          font-family: 'Courier New', monospace;
          letter-spacing: 1px;
        }

        .boot-progress-container {
          width: 320px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .boot-progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(124, 108, 240, 0.1);
        }

        .boot-progress-bar::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 8px,
            rgba(124, 108, 240, 0.05) 8px,
            rgba(124, 108, 240, 0.05) 9px
          );
          pointer-events: none;
        }

        .boot-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #7c6cf0 0%, #9b8af0 40%, #00d6c1 100%);
          border-radius: 4px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 15px rgba(124, 108, 240, 0.5), 0 0 30px rgba(0, 214, 193, 0.3);
        }

        .progress-glow {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
          filter: blur(4px);
          animation: glowPulse 2s ease-in-out infinite;
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .progress-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%);
          animation: shineMove 2s ease-in-out infinite;
        }

        @keyframes shineMove {
          0% { left: -50%; }
          100% { left: 100%; }
        }

        .progress-tick {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 120%;
          background: white;
          box-shadow: 0 0 10px white, 0 0 20px rgba(255, 255, 255, 0.8);
          animation: tickPulse 0.5s ease-in-out infinite alternate;
        }

        @keyframes tickPulse {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }

        .boot-progress-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .boot-progress-text {
          font-size: 13px;
          color: #a0aec0;
          font-family: 'Courier New', monospace;
          font-weight: 600;
          min-width: 45px;
        }

        .boot-progress-ticks {
          display: flex;
          gap: 3px;
        }

        .tick {
          width: 3px;
          height: 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 1px;
          transition: all 0.3s ease;
        }

        .tick.active {
          background: linear-gradient(180deg, #7c6cf0, #00d6c1);
          box-shadow: 0 0 4px rgba(124, 108, 240, 0.6);
        }

        .boot-message {
          font-size: 13px;
          color: #a0aec0;
          min-height: 20px;
          font-family: 'Courier New', monospace;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .message-icon {
          color: #00d6c1;
          font-weight: bold;
        }

        .cursor {
          display: inline-block;
          color: #7c6cf0;
          animation: cursorBlink 0.8s step-end infinite;
          font-weight: bold;
        }

        @keyframes cursorBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .boot-quote {
          max-width: 380px;
          text-align: center;
          opacity: 0.4;
          animation: quoteFade 8s ease-in-out infinite;
        }

        .boot-quote p {
          font-size: 11px;
          color: #64748b;
          font-style: italic;
          line-height: 1.5;
          margin: 0;
        }

        @keyframes quoteFade {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }

        .boot-status-grid {
          display: flex;
          gap: 28px;
          margin-top: 4px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          transition: all 0.5s ease;
        }

        .status-dot.active {
          background: #00d6c1;
          box-shadow: 0 0 12px rgba(0, 214, 193, 0.8);
          animation: statusPulse 2s ease-in-out infinite;
        }

        @keyframes statusPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(0, 214, 193, 0.6); }
          50% { box-shadow: 0 0 16px rgba(0, 214, 193, 1); }
        }

        .status-text {
          font-size: 11px;
          color: #4a5568;
          letter-spacing: 1px;
        }

        .status-item:nth-child(-n+2) .status-text {
          color: #a0aec0;
        }

        .boot-hint {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          color: #2d3748;
          letter-spacing: 1px;
          animation: hintPulse 3s ease-in-out infinite;
          white-space: nowrap;
        }

        @keyframes hintPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}

export default memo(BootAnimation)