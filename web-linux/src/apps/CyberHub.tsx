import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import {
  Activity, CloudAlert, Wifi, Zap, Shield, BarChart3,
  Clock, TrendingUp, Globe2, Radio, Battery, Cpu, HardDrive,
  RefreshCw, ExternalLink, AlertCircle, CheckCircle2, GitBranch
} from 'lucide-react'

/**
 * CyberHub - 赛博格控制中心
 * 实时系统监控 + GitHub集成 + 天气预警 + 网络状态 + 快捷工具
 * v26.0 创新应用
 */

interface SystemMetrics {
  cpu: number
  memory: { used: number; total: number; percent: number }
  disk: { used: number; total: number; percent: number }
  network: { upload: number; download: number }
  timestamp: string
}

interface GitHubRepo {
  name: string
  full_name: string
  description: string
  stargazers_count: number
  forks_count: number
  language: string
  html_url: string
  updated_at: string
}

interface WeatherAlert {
  type: string
  severity: 'low' | 'medium' | 'high'
  location: string
  description: string
  expires: string
}

interface NetworkStatus {
  online: boolean
  latency: number
  bandwidth: { upload: number; download: number }
  dns: string
}

const ALERT_COLORS = {
  low: '#00ff88',
  medium: '#ffd700',
  high: '#ff3366'
}

const GITHUB_TRENDING_REPOS = [
  'facebook/react',
  'vercel/next.js',
  'microsoft/vscode',
  'tailwindlabs/tailwindcss',
  'sveltejs/svelte'
]

export default memo(function CyberHub() {
  const [activePanel, setActivePanel] = useState<'monitor' | 'github' | 'weather' | 'network' | 'tools'>('monitor')
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([])
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([])
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  // 模拟系统监控数据（实际项目中可以接入真实API）
  const fetchSystemMetrics = useCallback(() => {
    const metrics: SystemMetrics = {
      cpu: Math.random() * 30 + 20,
      memory: {
        used: Math.random() * 4000 + 2000,
        total: 8000,
        percent: Math.random() * 30 + 40
      },
      disk: {
        used: Math.random() * 80 + 40,
        total: 200,
        percent: Math.random() * 20 + 60
      },
      network: {
        upload: Math.random() * 100,
        download: Math.random() * 500
      },
      timestamp: new Date().toISOString()
    }
    setSystemMetrics(metrics)
    setLastUpdate(new Date().toLocaleTimeString())
  }, [])

  // 获取GitHub热门仓库
  const fetchGitHubRepos = useCallback(async () => {
    setIsLoading(true)
    try {
      const reposData: GitHubRepo[] = await Promise.all(
        GITHUB_TRENDING_REPOS.map(async (repo) => {
          const res = await fetch(`https://api.github.com/repos/${repo}`)
          return res.json()
        })
      )
      setGithubRepos(reposData)
      setLastUpdate(new Date().toLocaleTimeString())
    } catch (err) {
      console.error('GitHub API error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 模拟天气预警数据
  const fetchWeatherAlerts = useCallback(() => {
    const alerts: WeatherAlert[] = [
      {
        type: '高温预警',
        severity: 'medium',
        location: '上海',
        description: '预计温度将达到38°C，请注意防暑',
        expires: new Date(Date.now() + 3600000).toISOString()
      },
      {
        type: '暴雨预警',
        severity: 'high',
        location: '北京',
        description: '未来6小时内可能出现暴雨，请做好防范',
        expires: new Date(Date.now() + 21600000).toISOString()
      }
    ]
    setWeatherAlerts(alerts)
    setLastUpdate(new Date().toLocaleTimeString())
  }, [])

  // 模拟网络状态检测
  const fetchNetworkStatus = useCallback(() => {
    const status: NetworkStatus = {
      online: navigator.onLine,
      latency: Math.random() * 50 + 10,
      bandwidth: {
        upload: Math.random() * 10 + 5,
        download: Math.random() * 50 + 20
      },
      dns: '8.8.8.8'
    }
    setNetworkStatus(status)
    setLastUpdate(new Date().toLocaleTimeString())
  }, [])

  // 初始化数据获取
  useEffect(() => {
    fetchSystemMetrics()
    fetchGitHubRepos()
    fetchWeatherAlerts()
    fetchNetworkStatus()

    // 设置定时更新
    const interval = setInterval(() => {
      fetchSystemMetrics()
      fetchNetworkStatus()
    }, 5000)

    return () => clearInterval(interval)
  }, [fetchSystemMetrics, fetchGitHubRepos, fetchWeatherAlerts, fetchNetworkStatus])

  // 刷新当前面板数据
  const handleRefresh = useCallback(() => {
    switch (activePanel) {
      case 'monitor':
        fetchSystemMetrics()
        break
      case 'github':
        fetchGitHubRepos()
        break
      case 'weather':
        fetchWeatherAlerts()
        break
      case 'network':
        fetchNetworkStatus()
        break
    }
  }, [activePanel, fetchSystemMetrics, fetchGitHubRepos, fetchWeatherAlerts, fetchNetworkStatus])

  // 渲染系统监控面板
  const MonitorPanel = useMemo(() => (
    <div className="cyberhub-panel glass-panel-intense">
      <div className="panel-header">
        <h2 className="panel-title neon-text">系统性能监控</h2>
        <div className="last-update">{lastUpdate}</div>
      </div>
      
      {systemMetrics && (
        <div className="metrics-grid">
          <div className="metric-card worldpulse-card-cyber">
            <Cpu className="metric-icon neon-cyan" />
            <div className="metric-label">CPU 使用率</div>
            <div className="metric-value">{systemMetrics.cpu.toFixed(1)}%</div>
            <div className="metric-bar">
              <div 
                className="metric-bar-fill" 
                style={{ width: `${systemMetrics.cpu}%`, background: ALERT_COLORS.medium }}
              />
            </div>
          </div>

          <div className="metric-card worldpulse-card-cyber">
            <HardDrive className="metric-icon neon-cyan" />
            <div className="metric-label">内存使用</div>
            <div className="metric-value">{systemMetrics.memory.percent.toFixed(1)}%</div>
            <div className="metric-sub">
              {systemMetrics.memory.used.toFixed(0)} MB / {systemMetrics.memory.total} MB
            </div>
            <div className="metric-bar">
              <div 
                className="metric-bar-fill" 
                style={{ width: `${systemMetrics.memory.percent}%`, background: ALERT_COLORS.medium }}
              />
            </div>
          </div>

          <div className="metric-card worldpulse-card-cyber">
            <HardDrive className="metric-icon neon-cyan" />
            <div className="metric-label">磁盘使用</div>
            <div className="metric-value">{systemMetrics.disk.percent.toFixed(1)}%</div>
            <div className="metric-sub">
              {systemMetrics.disk.used.toFixed(0)} GB / {systemMetrics.disk.total} GB
            </div>
            <div className="metric-bar">
              <div 
                className="metric-bar-fill" 
                style={{ width: `${systemMetrics.disk.percent}%`, background: ALERT_COLORS.medium }}
              />
            </div>
          </div>

          <div className="metric-card worldpulse-card-cyber">
            <Wifi className="metric-icon neon-cyan" />
            <div className="metric-label">网络速率</div>
            <div className="metric-value">↓ {systemMetrics.network.download.toFixed(0)} KB/s</div>
            <div className="metric-sub">↑ {systemMetrics.network.upload.toFixed(0)} KB/s</div>
          </div>
        </div>
      )}
    </div>
  ), [systemMetrics, lastUpdate])

  // 渲染GitHub面板
  const GitHubPanel = useMemo(() => (
    <div className="cyberhub-panel glass-panel-intense">
      <div className="panel-header">
        <h2 className="panel-title neon-text">GitHub 热门仓库</h2>
        <div className="last-update">{lastUpdate}</div>
      </div>
      
      {isLoading ? (
        <div className="loading-indicator">
          <RefreshCw className="spinning neon-cyan" />
          <span>正在加载...</span>
        </div>
      ) : (
        <div className="github-repos-grid">
          {githubRepos.map((repo) => (
            <div key={repo.full_name} className="github-repo-card worldpulse-card-cyber">
              <div className="repo-header">
                <GitBranch className="repo-icon neon-cyan" />
                <h3 className="repo-name">{repo.name}</h3>
              </div>
              <p className="repo-description">{repo.description || '无描述'}</p>
              <div className="repo-stats">
                <span className="repo-stat">
                  <TrendingUp className="stat-icon neon-green" />
                  {repo.stargazers_count.toLocaleString()}
                </span>
                <span className="repo-stat">
                  <Activity className="stat-icon neon-pink" />
                  {repo.forks_count.toLocaleString()}
                </span>
                {repo.language && (
                  <span className="repo-language">{repo.language}</span>
                )}
              </div>
              <div className="repo-footer">
                <span className="repo-updated">
                  更新: {new Date(repo.updated_at).toLocaleDateString()}
                </span>
                <a 
                  href={repo.html_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="repo-link"
                >
                  <ExternalLink className="link-icon neon-cyan" />
                  查看
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  ), [githubRepos, isLoading, lastUpdate])

  // 渲染天气预警面板
  const WeatherPanel = useMemo(() => (
    <div className="cyberhub-panel glass-panel-intense">
      <div className="panel-header">
        <h2 className="panel-title neon-text">天气预警</h2>
        <div className="last-update">{lastUpdate}</div>
      </div>
      
      <div className="weather-alerts-grid">
        {weatherAlerts.map((alert, idx) => (
          <div key={idx} className="weather-alert-card worldpulse-card-cyber">
            <div className="alert-header">
              <CloudAlert 
                className="alert-icon" 
                style={{ color: ALERT_COLORS[alert.severity] }}
              />
              <h3 className="alert-type">{alert.type}</h3>
              <span 
                className="alert-severity-badge"
                style={{ background: ALERT_COLORS[alert.severity] }}
              >
                {alert.severity === 'high' ? '严重' : alert.severity === 'medium' ? '中等' : '轻微'}
              </span>
            </div>
            <div className="alert-location">{alert.location}</div>
            <p className="alert-description">{alert.description}</p>
            <div className="alert-footer">
              <Clock className="footer-icon neon-cyan" />
              <span className="alert-expires">
                有效期至: {new Date(alert.expires).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  ), [weatherAlerts, lastUpdate])

  // 渲染网络状态面板
  const NetworkPanel = useMemo(() => (
    <div className="cyberhub-panel glass-panel-intense">
      <div className="panel-header">
        <h2 className="panel-title neon-text">网络状态检测</h2>
        <div className="last-update">{lastUpdate}</div>
      </div>
      
      {networkStatus && (
        <div className="network-status-grid">
          <div className="network-status-card worldpulse-card-cyber">
            <div className="status-header">
              {networkStatus.online ? (
                <CheckCircle2 className="status-icon neon-green pulse-animation" />
              ) : (
                <AlertCircle className="status-icon neon-red" />
              )}
              <h3 className="status-label">
                {networkStatus.online ? '网络在线' : '网络离线'}
              </h3>
            </div>
          </div>

          <div className="network-metric-card worldpulse-card-cyber">
            <Radio className="metric-icon neon-cyan" />
            <div className="metric-label">网络延迟</div>
            <div className="metric-value">{networkStatus.latency.toFixed(0)} ms</div>
          </div>

          <div className="network-metric-card worldpulse-card-cyber">
            <Wifi className="metric-icon neon-cyan" />
            <div className="metric-label">带宽</div>
            <div className="metric-value">↓ {networkStatus.bandwidth.download} Mbps</div>
            <div className="metric-sub">↑ {networkStatus.bandwidth.upload} Mbps</div>
          </div>

          <div className="network-metric-card worldpulse-card-cyber">
            <Globe2 className="metric-icon neon-cyan" />
            <div className="metric-label">DNS 服务器</div>
            <div className="metric-value">{networkStatus.dns}</div>
          </div>
        </div>
      )}
    </div>
  ), [networkStatus, lastUpdate])

  // 渲染快捷工具面板
  const ToolsPanel = useMemo(() => (
    <div className="cyberhub-panel glass-panel-intense">
      <div className="panel-header">
        <h2 className="panel-title neon-text">快捷工具集合</h2>
      </div>
      
      <div className="tools-grid">
        <div className="tool-card worldpulse-card-cyber neon-border">
          <Zap className="tool-icon neon-cyan" />
          <h3 className="tool-name">终端快捷启动</h3>
          <p className="tool-desc">一键打开终端命令行</p>
        </div>

        <div className="tool-card worldpulse-card-cyber neon-border-pink">
          <Shield className="tool-icon neon-pink" />
          <h3 className="tool-name">密码生成器</h3>
          <p className="tool-desc">快速生成安全密码</p>
        </div>

        <div className="tool-card worldpulse-card-cyber neon-border">
          <BarChart3 className="tool-icon neon-cyan" />
          <h3 className="tool-name">数据可视化</h3>
          <p className="tool-desc">图表生成与分析</p>
        </div>

        <div className="tool-card worldpulse-card-cyber neon-border-pink">
          <Clock className="tool-icon neon-pink" />
          <h3 className="tool-name">时间管理</h3>
          <p className="tool-desc">番茄钟与任务追踪</p>
        </div>

        <div className="tool-card worldpulse-card-cyber neon-border">
          <Battery className="tool-icon neon-cyan" />
          <h3 className="tool-name">电池状态</h3>
          <p className="tool-desc">设备电池健康检查</p>
        </div>

        <div className="tool-card worldpulse-card-cyber neon-border-pink">
          <RefreshCw className="tool-icon neon-pink" />
          <h3 className="tool-name">系统优化</h3>
          <p className="tool-desc">一键清理与优化</p>
        </div>
      </div>
    </div>
  ), [])

  return (
    <div className="cyberhub-container">
      {/* 赛博格网格背景 */}
      <div className="cyber-grid-bg" />
      
      {/* 扫描线效果 */}
      <div className="scanline-overlay" />
      
      {/* 主控制中心 */}
      <div className="cyberhub-main glass-panel">
        {/* 顶部导航栏 */}
        <div className="cyberhub-nav">
          <h1 className="cyberhub-title neon-border">
            <Zap className="title-icon neon-cyan pulse-animation" />
            CyberHub 控制中心
          </h1>
          
          <div className="nav-tabs">
            {[
              { id: 'monitor', label: '系统监控', Icon: Activity },
              { id: 'github', label: 'GitHub', Icon: GitBranch },
              { id: 'weather', label: '天气预警', Icon: CloudAlert },
              { id: 'network', label: '网络状态', Icon: Wifi },
              { id: 'tools', label: '快捷工具', Icon: Zap }
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`nav-tab ${activePanel === id ? 'active neon-border' : ''}`}
                onClick={() => setActivePanel(id as any)}
              >
                <Icon className="tab-icon neon-cyan" />
                {label}
              </button>
            ))}
          </div>
          
          <button className="refresh-btn neon-border" onClick={handleRefresh}>
            <RefreshCw className="refresh-icon neon-cyan" />
            刷新数据
          </button>
        </div>

        {/* 内容区域 */}
        <div className="cyberhub-content">
          {activePanel === 'monitor' && MonitorPanel}
          {activePanel === 'github' && GitHubPanel}
          {activePanel === 'weather' && WeatherPanel}
          {activePanel === 'network' && NetworkPanel}
          {activePanel === 'tools' && ToolsPanel}
        </div>
      </div>
      
      <style>{`
        .cyberhub-container {
          position: relative;
          width: 100%;
          height: 100%;
          background: var(--cyber-dark);
          color: #ffffff;
          font-family: 'Rajdhani', sans-serif;
          overflow: hidden;
        }
        
        .cyberhub-main {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          border: 2px solid var(--glass-border);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .cyberhub-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          background: rgba(10, 14, 26, 0.9);
          border-bottom: 2px solid var(--neon-cyan);
          gap: 20px;
        }
        
        .cyberhub-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Orbitron', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--neon-cyan);
          padding: 10px 20px;
          border-radius: 8px;
          background: rgba(0, 217, 255, 0.1);
        }
        
        .title-icon {
          width: 32px;
          height: 32px;
        }
        
        .nav-tabs {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .nav-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: rgba(26, 31, 58, 0.8);
          border: 1px solid rgba(0, 217, 255, 0.3);
          border-radius: 8px;
          color: #ffffff;
          font-family: 'Orbitron', sans-serif;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .nav-tab:hover {
          background: rgba(0, 217, 255, 0.1);
          transform: translateY(-2px);
        }
        
        .nav-tab.active {
          background: rgba(0, 217, 255, 0.2);
          color: var(--neon-cyan);
        }
        
        .tab-icon {
          width: 18px;
          height: 18px;
        }
        
        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: rgba(255, 0, 128, 0.2);
          border: 1px solid var(--neon-pink);
          border-radius: 8px;
          color: var(--neon-pink);
          font-family: 'Orbitron', sans-serif;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .refresh-btn:hover {
          background: rgba(255, 0, 128, 0.3);
          transform: scale(1.05);
        }
        
        .refresh-icon {
          width: 18px;
          height: 18px;
        }
        
        .cyberhub-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          overflow-x: hidden;
        }
        
        .cyberhub-panel {
          padding: 20px;
        }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .panel-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: var(--neon-cyan);
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .last-update {
          font-family: 'Share Tech Mono', monospace;
          font-size: 14px;
          color: rgba(0, 217, 255, 0.6);
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }
        
        .metric-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .metric-icon {
          width: 24px;
          height: 24px;
        }
        
        .metric-label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .metric-value {
          font-family: 'Share Tech Mono', monospace;
          font-size: 24px;
          font-weight: 600;
          color: var(--neon-cyan);
        }
        
        .metric-sub {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .metric-bar {
          height: 4px;
          background: rgba(0, 217, 255, 0.2);
          border-radius: 2px;
          overflow: hidden;
        }
        
        .metric-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease;
        }
        
        .github-repos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .github-repo-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .repo-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .repo-icon {
          width: 24px;
          height: 24px;
        }
        
        .repo-name {
          font-family: 'Orbitron', sans-serif;
          font-size: 18px;
          color: var(--neon-cyan);
        }
        
        .repo-description {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;
        }
        
        .repo-stats {
          display: flex;
          gap: 15px;
          align-items: center;
        }
        
        .repo-stat {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 14px;
        }
        
        .stat-icon {
          width: 16px;
          height: 16px;
        }
        
        .repo-language {
          padding: 4px 8px;
          background: rgba(0, 217, 255, 0.2);
          border-radius: 4px;
          font-size: 12px;
          color: var(--neon-cyan);
        }
        
        .repo-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .repo-updated {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .repo-link {
          display: flex;
          align-items: center;
          gap: 5px;
          color: var(--neon-pink);
          text-decoration: none;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        
        .repo-link:hover {
          color: var(--neon-cyan);
          transform: translateX(5px);
        }
        
        .link-icon {
          width: 16px;
          height: 16px;
        }
        
        .weather-alerts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .weather-alert-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .alert-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .alert-icon {
          width: 24px;
          height: 24px;
        }
        
        .alert-type {
          font-family: 'Orbitron', sans-serif;
          font-size: 18px;
        }
        
        .alert-severity-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          color: #ffffff;
          font-weight: 600;
        }
        
        .alert-location {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .alert-description {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.5;
        }
        
        .alert-footer {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .footer-icon {
          width: 16px;
          height: 16px;
        }
        
        .alert-expires {
          font-size: 12px;
          color: rgba(0, 217, 255, 0.8);
        }
        
        .network-status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }
        
        .network-status-card,
        .network-metric-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .status-header {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .status-icon {
          width: 32px;
          height: 32px;
        }
        
        .status-label {
          font-family: 'Orbitron', sans-serif;
          font-size: 20px;
          color: var(--neon-cyan);
        }
        
        .tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        
        .tool-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .tool-card:hover {
          transform: translateY(-5px) scale(1.05);
        }
        
        .tool-icon {
          width: 40px;
          height: 40px;
        }
        
        .tool-name {
          font-family: 'Orbitron', sans-serif;
          font-size: 16px;
          color: var(--neon-cyan);
        }
        
        .tool-desc {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .loading-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 40px;
          color: var(--neon-cyan);
        }
        
        .spinning {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .neon-text {
          color: var(--neon-cyan);
        }
        
        .neon-cyan {
          color: var(--neon-cyan);
        }
        
        .neon-pink {
          color: var(--neon-pink);
        }
        
        .neon-green {
          color: var(--neon-green);
        }
        
        .neon-red {
          color: var(--neon-red);
        }
        
        /* 滚动条样式 */
        .cyberhub-content::-webkit-scrollbar {
          width: 8px;
        }
        
        .cyberhub-content::-webkit-scrollbar-track {
          background: rgba(10, 14, 26, 0.8);
        }
        
        .cyberhub-content::-webkit-scrollbar-thumb {
          background: var(--neon-cyan);
          border-radius: 4px;
        }
        
        .cyberhub-content::-webkit-scrollbar-thumb:hover {
          background: var(--neon-pink);
        }
      `}</style>
    </div>
  )
})