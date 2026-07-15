import { useState, useEffect, useMemo } from 'react'
import { useStore } from '../store'
import { 
  Terminal, 
  Folder, 
  Code, 
  Cloud, 
  Cpu, 
  Globe, 
  Zap, 
  Sparkles,
  ChevronRight,
  Clock,
  TrendingUp
} from 'lucide-react'
import { apiService } from '../services/apiService'

interface FeatureCard {
  icon: React.ReactNode
  title: string
  description: string
  action: string
  appId: string
  gradient: string
}

export default function WelcomeHub() {
  const openApp = useStore(s => s.openApp)
  const theme = useStore(s => s.theme)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [quote, setQuote] = useState<string>('')
  const [activity, setActivity] = useState<string>('')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // 加载每日内容
    Promise.all([
      apiService.fetchRandomQuote(),
      apiService.fetchRandomActivity()
    ]).then(([quoteData, activityData]) => {
      if (quoteData) setQuote(`${quoteData.content} — ${quoteData.author}`)
      if (activityData) setActivity((activityData as Record<string, unknown>).activity as string || '')
    })
  }, [])

  const features: FeatureCard[] = useMemo(() => [
    {
      icon: <Terminal className="w-6 h-6" />,
      title: '终端模拟器',
      description: '150+ 命令，实时API查询，智能补全',
      action: '打开终端',
      appId: 'terminal',
      gradient: 'from-cyan-500 to-blue-600'
    },
    {
      icon: <Folder className="w-6 h-6" />,
      title: '文件管理器',
      description: '虚拟文件系统，多格式预览，智能搜索',
      action: '浏览文件',
      appId: 'files',
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: '在线IDE',
      description: 'JavaScript, TypeScript, Python 执行',
      action: '开始编程',
      appId: 'web-ide-pro',
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      icon: <Cloud className="w-6 h-6" />,
      title: '实时数据中心',
      description: '天气、加密货币、新闻、汇率实时更新',
      action: '查看数据',
      appId: 'live-data-hub',
      gradient: 'from-orange-500 to-red-600'
    },
    {
      icon: <Cpu className="w-6 h-6" />,
      title: '系统监控',
      description: '进程管理，性能监控，资源分析',
      action: '监控系统',
      appId: 'system-monitor',
      gradient: 'from-rose-500 to-pink-600'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: '网络工具',
      description: 'API测试，网络诊断，IP查询',
      action: '网络工具',
      appId: 'api-explorer',
      gradient: 'from-indigo-500 to-purple-600'
    }
  ], [])

  const quickStats = [
    { icon: <Zap className="w-4 h-4" />, label: '240+', value: '应用' },
    { icon: <Code className="w-4 h-4" />, label: '150+', value: '命令' },
    { icon: <Globe className="w-4 h-4" />, label: '20+', value: 'API' },
    { icon: <Sparkles className="w-4 h-4" />, label: '∞', value: '可能' }
  ]

  return (
    <div className="welcome-hub">
      {/* 动态背景 */}
      <div className="welcome-background">
        <div className="grid-overlay" />
        <div className="glow-orb glow-orb-1" />
        <div className="glow-orb glow-orb-2" />
        <div className="glow-orb glow-orb-3" />
      </div>

      <div className="welcome-content">
        {/* 头部 */}
        <header className="welcome-header">
          <div className="time-display">
            <Clock className="w-5 h-5 opacity-60" />
            <span className="time-value">
              {currentTime.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
            <span className="date-value">
              {currentTime.toLocaleDateString('zh-CN', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>

          <div className="brand">
            <h1 className="brand-title">
              <span className="brand-text">WebLinux</span>
              <span className="brand-os">OS</span>
            </h1>
            <p className="brand-subtitle">浏览器中的完整Linux桌面环境</p>
          </div>

          <div className="quick-stats">
            {quickStats.map((stat, i) => (
              <div key={i} className="stat-item">
                <span className="stat-icon">{stat.icon}</span>
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </header>

        {/* 主要内容区 */}
        <div className="welcome-main">
          {/* 左侧：每日灵感 */}
          <aside className="daily-inspiration">
            <div className="inspiration-card">
              <div className="inspiration-header">
                <TrendingUp className="w-5 h-5" />
                <span>每日灵感</span>
              </div>
              {quote && (
                <blockquote className="quote-text">
                  "{quote}"
                </blockquote>
              )}
              {activity && (
                <div className="activity-suggestion">
                  <Zap className="w-4 h-4" />
                  <span>试试这个: {activity}</span>
                </div>
              )}
            </div>

            <div className="action-buttons">
              <button 
                className="action-btn primary"
                onClick={() => openApp('terminal')}
              >
                <Terminal className="w-4 h-4" />
                <span>快速启动终端</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>
              <button 
                className="action-btn secondary"
                onClick={() => openApp('help')}
              >
                <span>查看帮助文档</span>
              </button>
            </div>
          </aside>

          {/* 右侧：功能卡片网格 */}
          <div className="features-grid">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="feature-card"
                style={{ animationDelay: `${i * 0.1}s` }}
                onClick={() => openApp(feature.appId)}
              >
                <div className={`feature-icon bg-gradient-to-br ${feature.gradient}`}>
                  {feature.icon}
                </div>
                <div className="feature-content">
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-desc">{feature.description}</p>
                  <div className="feature-action">
                    <span>{feature.action}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部提示 */}
        <footer className="welcome-footer">
          <p>
            按 <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>L</kbd> 打开应用启动器 · 
            按 <kbd>Ctrl</kbd>+<kbd>K</kbd> 全局搜索 · 
            按 <kbd>Ctrl</kbd>+<kbd>P</kbd> 命令面板
          </p>
        </footer>
      </div>

      <style>{`
        .welcome-hub {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
          background: ${theme === 'dark' ? '#0a0a0f' : '#f8f9fa'};
          color: ${theme === 'dark' ? '#e4e4e7' : '#18181b'};
        }

        /* 动态背景 */
        .welcome-background {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0;
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(${theme === 'dark' ? 'rgba(99, 102, 241, 0.03)' : 'rgba(99, 102, 241, 0.05)'} 1px, transparent 1px),
            linear-gradient(90deg, ${theme === 'dark' ? 'rgba(99, 102, 241, 0.03)' : 'rgba(99, 102, 241, 0.05)'} 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridMove 20s linear infinite;
        }

        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          animation: float 8s ease-in-out infinite;
        }

        .glow-orb-1 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          top: -100px;
          right: -100px;
          animation-delay: 0s;
        }

        .glow-orb-2 {
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #14b8a6, #0ea5e9);
          bottom: -50px;
          left: -50px;
          animation-delay: 2s;
        }

        .glow-orb-3 {
          width: 250px;
          height: 250px;
          background: linear-gradient(135deg, #f43f5e, #ec4899);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        /* 内容层 */
        .welcome-content {
          position: relative;
          z-index: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 2rem 3rem;
        }

        /* 头部 */
        .welcome-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .time-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          opacity: 0.7;
        }

        .time-value {
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.05em;
        }

        .date-value {
          margin-left: 0.5rem;
        }

        .brand {
          text-align: center;
        }

        .brand-title {
          font-size: 3.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0;
          line-height: 1;
        }

        .brand-text {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .brand-os {
          color: ${theme === 'dark' ? '#22d3ee' : '#0891b2'};
          font-weight: 300;
        }

        .brand-subtitle {
          font-size: 1rem;
          opacity: 0.6;
          margin-top: 0.5rem;
          font-weight: 300;
          letter-spacing: 0.1em;
        }

        .quick-stats {
          display: flex;
          gap: 1rem;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          padding: 0.5rem 1rem;
          background: ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
          border-radius: 9999px;
          backdrop-filter: blur(8px);
        }

        .stat-icon {
          opacity: 0.5;
        }

        .stat-value {
          font-weight: 700;
          margin: 0 0.25rem;
        }

        .stat-label {
          opacity: 0.6;
        }

        /* 主要内容 */
        .welcome-main {
          flex: 1;
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 2rem;
          overflow: hidden;
        }

        /* 左侧边栏 */
        .daily-inspiration {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .inspiration-card {
          padding: 1.5rem;
          background: ${theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
          border-radius: 16px;
          border: 1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
          backdrop-filter: blur(12px);
        }

        .inspiration-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          opacity: 0.7;
          margin-bottom: 1rem;
        }

        .quote-text {
          font-size: 1rem;
          line-height: 1.6;
          opacity: 0.85;
          margin: 0 0 1rem;
          font-style: italic;
        }

        .activity-suggestion {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          padding: 0.75rem;
          background: ${theme === 'dark' ? 'rgba(34, 211, 238, 0.1)' : 'rgba(34, 211, 238, 0.05)'};
          border-radius: 8px;
          color: #22d3ee;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
        }

        .action-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -4px rgba(99, 102, 241, 0.4);
        }

        .action-btn.secondary {
          background: ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
          color: inherit;
        }

        .action-btn.secondary:hover {
          background: ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
        }

        /* 功能网格 */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          align-content: start;
          overflow-y: auto;
          padding-right: 1rem;
        }

        .feature-card {
          position: relative;
          padding: 1.25rem;
          background: ${theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
          border-radius: 16px;
          border: 1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
          backdrop-filter: blur(12px);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .feature-card:hover {
          transform: translateY(-4px);
          background: ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'};
          box-shadow: 0 12px 24px -8px ${theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'};
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          color: white;
          margin-bottom: 1rem;
        }

        .feature-title {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .feature-desc {
          font-size: 0.75rem;
          opacity: 0.6;
          line-height: 1.4;
          margin-bottom: 0.75rem;
        }

        .feature-action {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #6366f1;
          font-weight: 500;
        }

        /* 底部 */
        .welcome-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.75rem;
          opacity: 0.5;
        }

        .welcome-footer kbd {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          background: ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
          border-radius: 4px;
          font-family: inherit;
          font-size: 0.7rem;
          margin: 0 0.125rem;
        }

        /* 响应式 */
        @media (max-width: 1200px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 900px) {
          .welcome-main {
            grid-template-columns: 1fr;
          }

          .daily-inspiration {
            order: 1;
          }

          .brand-title {
            font-size: 2.5rem;
          }
        }

        @media (max-width: 600px) {
          .welcome-content {
            padding: 1rem;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .quick-stats {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}