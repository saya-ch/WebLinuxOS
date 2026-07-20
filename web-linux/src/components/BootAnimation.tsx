import { useState, useEffect } from 'react'

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
  '准备就绪'
]

export default function BootAnimation({ onComplete }: BootAnimationProps) {
  const [progress, setProgress] = useState(0)
  const [currentMessage, setCurrentMessage] = useState('')
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    setShowContent(true)
    
    let progressInterval: ReturnType<typeof setInterval>
    let messageIndex = 0
    
    const updateMessage = () => {
      if (messageIndex < loadingMessages.length) {
        setCurrentMessage(loadingMessages[messageIndex])
        messageIndex++
      }
    }
    
    updateMessage()
    
    const messageInterval = setInterval(() => {
      updateMessage()
    }, 400)

    progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          clearInterval(messageInterval)
          setTimeout(() => {
            setShowContent(false)
            setTimeout(onComplete, 500)
          }, 500)
          return 100
        }
        return prev + Math.random() * 8 + 2
      })
    }, 100)

    return () => {
      clearInterval(progressInterval)
      clearInterval(messageInterval)
    }
  }, [onComplete])

  if (!showContent) return null

  return (
    <div className="boot-overlay">
      <div className="boot-container">
        <div className="boot-logo">
          <div className="logo-ring"></div>
          <div className="logo-ring-inner"></div>
          <div className="logo-center">
            <span className="logo-text">W</span>
          </div>
        </div>
        
        <div className="boot-info">
          <div className="boot-title">WebLinuxOS</div>
          <div className="boot-version">v2.0</div>
        </div>
        
        <div className="boot-progress-container">
          <div className="boot-progress-bar">
            <div 
              className="boot-progress-fill" 
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              <div className="progress-shine"></div>
            </div>
          </div>
          <div className="boot-progress-text">
            {Math.floor(Math.min(progress, 100))}%
          </div>
        </div>
        
        <div className="boot-message">{currentMessage}</div>
        
        <div className="boot-status-grid">
          <div className="status-item">
            <span className="status-dot"></span>
            <span className="status-text">系统</span>
          </div>
          <div className="status-item">
            <span className="status-dot active"></span>
            <span className="status-text">图形</span>
          </div>
          <div className="status-item">
            <span className="status-dot"></span>
            <span className="status-text">网络</span>
          </div>
          <div className="status-item">
            <span className="status-dot"></span>
            <span className="status-text">存储</span>
          </div>
        </div>
      </div>
      
      <style>{`
        .boot-overlay {
          position: fixed;
          inset: 0;
          background: #08080f;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          animation: bootFadeOut 0.5s ease-out forwards;
          animation-delay: 2.5s;
        }
        
        @keyframes bootFadeOut {
          to {
            opacity: 0;
            visibility: hidden;
          }
        }
        
        .boot-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 30px;
          animation: bootSlideUp 0.6s ease-out;
        }
        
        @keyframes bootSlideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .boot-logo {
          position: relative;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .logo-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid rgba(139, 124, 240, 0.3);
          border-radius: 50%;
          animation: ringSpin 3s linear infinite;
        }
        
        .logo-ring-inner {
          position: absolute;
          width: 80%;
          height: 80%;
          border: 2px solid rgba(0, 214, 193, 0.4);
          border-radius: 50%;
          animation: ringSpin 2s linear infinite reverse;
        }
        
        @keyframes ringSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .logo-center {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #7c6cf0 0%, #9b8af0 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 30px rgba(139, 124, 240, 0.5);
          animation: logoPulse 1.5s ease-in-out infinite;
        }
        
        @keyframes logoPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 30px rgba(139, 124, 240, 0.5);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 45px rgba(139, 124, 240, 0.7);
          }
        }
        
        .logo-text {
          font-size: 28px;
          font-weight: 700;
          color: white;
        }
        
        .boot-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        
        .boot-title {
          font-size: 24px;
          font-weight: 600;
          color: #f0f0ff;
          letter-spacing: 2px;
        }
        
        .boot-version {
          font-size: 12px;
          color: #64748b;
        }
        
        .boot-progress-container {
          width: 280px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .boot-progress-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .boot-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #7c6cf0 0%, #00d6c1 100%);
          border-radius: 3px;
          transition: width 0.15s ease-out;
          position: relative;
          overflow: hidden;
        }
        
        .progress-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
          animation: shineMove 1.5s ease-in-out infinite;
        }
        
        @keyframes shineMove {
          to { left: 100%; }
        }
        
        .boot-progress-text {
          font-size: 12px;
          color: #94a3b8;
          text-align: right;
        }
        
        .boot-message {
          font-size: 13px;
          color: #94a3b8;
          min-height: 18px;
        }
        
        .boot-status-grid {
          display: flex;
          gap: 24px;
          margin-top: 10px;
        }
        
        .status-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          transition: all 0.3s ease;
        }
        
        .status-dot.active {
          background: #7c6cf0;
          box-shadow: 0 0 10px rgba(139, 124, 240, 0.8);
        }
        
        .status-text {
          font-size: 11px;
          color: #64748b;
        }
      `}</style>
    </div>
  )
}
