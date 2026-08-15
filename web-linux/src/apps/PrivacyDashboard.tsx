import { useState, useEffect, useCallback } from 'react'

interface PrivacyScore {
  score: number
  level: string
  color: string
  issues: string[]
  recommendations: string[]
}

interface StorageInfo {
  localStorage: number
  sessionStorage: number
  cookies: number
  indexedDB: number
}

interface PermissionInfo {
  name: string
  state: string
  description: string
}

const PERMISSIONS_LIST = [
  { name: 'geolocation', desc: '地理位置访问权限' },
  { name: 'notifications', desc: '通知推送权限' },
  { name: 'camera', desc: '摄像头访问权限' },
  { name: 'microphone', desc: '麦克风访问权限' },
  { name: 'clipboard-read', desc: '剪贴板读取权限' },
  { name: 'clipboard-write', desc: '剪贴板写入权限' },
] as const

type PermissionName = typeof PERMISSIONS_LIST[number]['name']

function PrivacyDashboard() {
  const [privacyScore, setPrivacyScore] = useState<PrivacyScore | null>(null)
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    localStorage: 0,
    sessionStorage: 0,
    cookies: 0,
    indexedDB: 0,
  })
  const [permissions, setPermissions] = useState<PermissionInfo[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanHistory, setScanHistory] = useState<{ time: string; score: number }[]>([])

  const calculateStorageSize = useCallback(() => {
    let localStorageSize = 0
    let sessionStorageSize = 0

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key) || ''
          localStorageSize += new Blob([key + value]).size
        }
      }
    } catch {}

    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key) {
          const value = sessionStorage.getItem(key) || ''
          sessionStorageSize += new Blob([key + value]).size
        }
      }
    } catch {}

    return {
      localStorage: Math.round(localStorageSize / 1024),
      sessionStorage: Math.round(sessionStorageSize / 1024),
      cookies: document.cookie ? document.cookie.split(';').filter(c => c.trim()).length : 0,
      indexedDB: 0,
    }
  }, [])

  const checkPermissions = useCallback(async () => {
    const results: PermissionInfo[] = []

    for (const perm of PERMISSIONS_LIST) {
      try {
        const status = await navigator.permissions.query({
          name: perm.name as PermissionName,
        } as PermissionDescriptor)
        results.push({
          name: perm.desc,
          state: status.state,
          description: perm.desc,
        })
      } catch {
        results.push({
          name: perm.desc,
          state: 'unsupported',
          description: perm.desc,
        })
      }
    }

    return results
  }, [])

  const calculatePrivacyScore = useCallback(
    (perms: PermissionInfo[], storage: StorageInfo): PrivacyScore => {
      let score = 100
      const issues: string[] = []
      const recommendations: string[] = []

      // 检查位置权限
      const geoPerm = perms.find(p => p.description.includes('地理位置'))
      if (geoPerm?.state === 'granted') {
        score -= 15
        issues.push('地理位置权限已授予')
        recommendations.push('在不需要时撤销地理位置权限')
      }

      // 检查通知权限
      const notifPerm = perms.find(p => p.description.includes('通知'))
      if (notifPerm?.state === 'granted') {
        score -= 5
        issues.push('通知权限已授予')
        recommendations.push('考虑是否真的需要通知权限')
      }

      // 检查摄像头权限
      const cameraPerm = perms.find(p => p.description.includes('摄像头'))
      if (cameraPerm?.state === 'granted') {
        score -= 10
        issues.push('摄像头权限已授予')
        recommendations.push('确保在可信的网站上才授予摄像头权限')
      }

      // 检查本地存储大小
      const totalStorage = storage.localStorage + storage.sessionStorage
      if (totalStorage > 1024) {
        score -= 10
        issues.push(`本地存储使用 ${totalStorage}KB，占用较多空间`)
        recommendations.push('定期清理不需要的网站数据')
      }

      // 检查Cookie数量
      if (storage.cookies > 20) {
        score -= 5
        issues.push(`Cookie 数量较多 (${storage.cookies}个)`)
        recommendations.push('使用隐私模式或定期清理Cookie')
      }

      // 检查第三方Cookie
      if (document.cookie.includes('_ga') || document.cookie.includes('_gid')) {
        score -= 10
        issues.push('检测到 Google Analytics Cookie')
        recommendations.push('考虑使用隐私保护浏览器扩展')
      }

      score = Math.max(0, score)

      let level = '中等'
      let color = '#f59e0b'
      if (score >= 80) {
        level = '优秀'
        color = '#10b981'
      } else if (score >= 60) {
        level = '良好'
        color = '#0ea5e9'
      } else if (score >= 40) {
        level = '中等'
        color = '#f59e0b'
      } else {
        level = '较差'
        color = '#ef4444'
      }

      return { score, level, color, issues, recommendations }
    },
    []
  )

  const runPrivacyScan = useCallback(async () => {
    setIsScanning(true)
    try {
      const storage = calculateStorageSize()
      setStorageInfo(storage)

      const perms = await checkPermissions()
      setPermissions(perms)

      const score = calculatePrivacyScore(perms, storage)
      setPrivacyScore(score)

      setScanHistory(prev => [
        { time: new Date().toLocaleString('zh-CN'), score: score.score },
        ...prev.slice(0, 4),
      ])
    } finally {
      setIsScanning(false)
    }
  }, [calculateStorageSize, checkPermissions, calculatePrivacyScore])

  useEffect(() => {
    runPrivacyScan()
  }, [runPrivacyScan])

  const clearStorage = () => {
    if (confirm('确定要清除所有本地存储数据吗？此操作不可撤销！')) {
      localStorage.clear()
      sessionStorage.clear()
      runPrivacyScan()
    }
  }

  const formatSize = (kb: number) => {
    if (kb < 1024) return `${kb} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      padding: 20,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#e2e8f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'auto',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h1 style={{ fontSize: 28, margin: 0, color: '#f1f5f9' }}>
            🔒 隐私与安全中心
          </h1>
          <p style={{ color: '#94a3b8', marginTop: 8 }}>
            浏览器隐私状态实时监控与分析
          </p>
        </div>

        {/* Privacy Score Card */}
        {privacyScore && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            borderRadius: 16,
            padding: 30,
            marginBottom: 24,
            border: `2px solid ${privacyScore.color}`,
            boxShadow: `0 0 30px ${privacyScore.color}33`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
              {/* Circular Score */}
              <div style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                background: `conic-gradient(${privacyScore.color} ${privacyScore.score * 3.6}deg, #334155 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <div style={{
                  width: 110,
                  height: 110,
                  borderRadius: '50%',
                  background: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                }}>
                  <div style={{ fontSize: 36, fontWeight: 'bold', color: privacyScore.color }}>
                    {privacyScore.score}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>隐私评分</div>
                </div>
              </div>

              {/* Score Details */}
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: `${privacyScore.color}22`,
                  color: privacyScore.color,
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 12,
                }}>
                  {privacyScore.level}
                </div>
                <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>隐私状况 {privacyScore.level}</h2>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>
                  共发现 {privacyScore.issues.length} 个需要关注的问题
                </p>
                <button
                  onClick={runPrivacyScan}
                  disabled={isScanning}
                  style={{
                    marginTop: 16,
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: isScanning ? '#475569' : privacyScore.color,
                    color: '#fff',
                    cursor: isScanning ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {isScanning ? '扫描中...' : '🔄 重新扫描'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Storage Analysis */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            borderRadius: 12,
            padding: 20,
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#f1f5f9' }}>
              💾 存储分析
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={storageRowStyle}>
                <span>LocalStorage</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                  {formatSize(storageInfo.localStorage)}
                </span>
              </div>
              <div style={storageRowStyle}>
                <span>SessionStorage</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                  {formatSize(storageInfo.sessionStorage)}
                </span>
              </div>
              <div style={storageRowStyle}>
                <span>Cookie 数量</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                  {storageInfo.cookies} 个
                </span>
              </div>
            </div>
            <button
              onClick={clearStorage}
              style={{
                marginTop: 16,
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: '1px solid #ef4444',
                background: 'transparent',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              🗑️ 清除所有存储数据
            </button>
          </div>

          {/* Permissions */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            borderRadius: 12,
            padding: 20,
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#f1f5f9' }}>
              🔐 权限状态
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {permissions.map((perm, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderRadius: 6,
                }}>
                  <span style={{ fontSize: 13 }}>{perm.description}</span>
                  <span style={{
                    fontSize: 12,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: perm.state === 'granted' ? '#ef444433' :
                      perm.state === 'denied' ? '#10b98133' : '#64748b33',
                    color: perm.state === 'granted' ? '#ef4444' :
                      perm.state === 'denied' ? '#10b981' : '#94a3b8',
                  }}>
                    {perm.state === 'granted' ? '已授予' :
                     perm.state === 'denied' ? '已拒绝' :
                     perm.state === 'prompt' ? '待确认' : '不支持'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Issues & Recommendations */}
        {privacyScore && privacyScore.issues.length > 0 && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            borderRadius: 12,
            padding: 20,
            marginTop: 20,
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#f1f5f9' }}>
              ⚠️ 发现的问题
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {privacyScore.issues.map((issue, i) => (
                <div key={i} style={{
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderLeft: '3px solid #ef4444',
                  borderRadius: 4,
                  fontSize: 13,
                }}>
                  {issue}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {privacyScore && privacyScore.recommendations.length > 0 && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            borderRadius: 12,
            padding: 20,
            marginTop: 20,
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#f1f5f9' }}>
              💡 隐私建议
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {privacyScore.recommendations.map((rec, i) => (
                <div key={i} style={{
                  padding: '10px 14px',
                  background: 'rgba(14, 165, 233, 0.1)',
                  borderLeft: '3px solid #0ea5e9',
                  borderRadius: 4,
                  fontSize: 13,
                }}>
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.6)',
            borderRadius: 12,
            padding: 20,
            marginTop: 20,
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#f1f5f9' }}>
              📊 扫描历史
            </h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {scanHistory.map((record, i) => (
                <div key={i} style={{
                  padding: '8px 14px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderRadius: 6,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{record.time}</div>
                  <div style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: record.score >= 70 ? '#10b981' :
                      record.score >= 50 ? '#f59e0b' : '#ef4444',
                  }}>
                    {record.score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Educational Tips */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.4)',
          borderRadius: 12,
          padding: 20,
          marginTop: 20,
          border: '1px dashed #475569',
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#94a3b8' }}>
            📚 隐私小贴士
          </h3>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#64748b', fontSize: 12, lineHeight: 1.8 }}>
            <li>使用浏览器的隐私模式可以防止存储被长期保留</li>
            <li>定期检查和撤销不必要的网站权限</li>
            <li>考虑使用隐私保护浏览器如 Firefox 或 Brave</li>
            <li>使用 VPN 可以隐藏你的真实 IP 地址</li>
            <li>注意公共 Wi-Fi 网络上的数据传输安全</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

const storageRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  background: 'rgba(15, 23, 42, 0.5)',
  borderRadius: 8,
  fontSize: 14,
}

export default PrivacyDashboard
