import React, { useState, useCallback, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  timestamp: number
}

function ErrorBoundary({ children, fallback }: Props) {
  const [state, setState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorInfo: null,
    timestamp: 0,
  })
  const [showDetails, setShowDetails] = useState(false)

  const handleReset = useCallback(() => {
    setState({ hasError: false, error: null, errorInfo: null, timestamp: 0 })
  }, [])

  const handleReload = useCallback(() => {
    try {
      sessionStorage.clear()
    } catch {
      // ignore
    }
    window.location.reload()
  }, [])

  const handleClearCache = useCallback(() => {
    try {
      localStorage.clear()
      sessionStorage.clear()
      if ('caches' in window) {
        caches.keys().then(names => names.forEach(name => caches.delete(name)))
      }
    } catch {
      // ignore
    }
    window.location.reload()
  }, [])

  const copyErrorReport = useCallback(async () => {
    const report = [
      `WebLinuxOS Error Report`,
      `Time: ${new Date(state.timestamp).toISOString()}`,
      `Error: ${state.error?.message || 'Unknown'}`,
      `Stack: ${state.error?.stack || 'N/A'}`,
      `Component Stack: ${state.errorInfo?.componentStack || 'N/A'}`,
      `URL: ${window.location.href}`,
      `User Agent: ${navigator.userAgent}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(report)
    } catch {
      // fallback
    }
  }, [state])

  if (state.hasError) {
    if (fallback) {
      return fallback
    }

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        minHeight: 200,
        background: 'linear-gradient(135deg, rgba(30,30,50,0.95) 0%, rgba(26,26,46,0.95) 100%)',
        color: '#e0e0e8',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: 24,
        borderRadius: 12,
        boxSizing: 'border-box'
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>{'\u26A0\uFE0F'}</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#fff' }}>
          组件加载出错
        </h2>
        <p style={{ fontSize: 13, color: '#a0a0c8', marginBottom: 12, textAlign: 'center', maxWidth: 400 }}>
          {state.error?.message || '发生了未预期的错误'}
        </p>
        <p style={{ fontSize: 11, color: '#6a6a8a', marginBottom: 16 }}>
          {new Date(state.timestamp).toLocaleString()}
        </p>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #8b7cf0 0%, #a29bfe 100%)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          >
            重试
          </button>
          <button
            onClick={handleReload}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              color: '#e0e0e8',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)' }}
          >
            刷新页面
          </button>
          <button
            onClick={handleClearCache}
            style={{
              padding: '8px 16px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8,
              color: '#fca5a5',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.2)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)' }}
          >
            清除缓存并重载
          </button>
        </div>

        {/* 可折叠的诊断信息 */}
        <div style={{ marginTop: 16, width: '100%', maxWidth: 500 }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              width: '100%', padding: '6px 12px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6, color: '#a0a0c8', fontSize: 11, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span>诊断信息</span>
            <span style={{ transform: showDetails ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s', fontSize: 10 }}>
              {'\u25B6'}
            </span>
          </button>
          {showDetails && (
            <div style={{
              marginTop: 4, padding: 10, borderRadius: 6,
              background: 'rgba(0,0,0,0.4)', fontSize: 11,
              fontFamily: 'monospace', lineHeight: 1.6,
              maxHeight: 200, overflow: 'auto',
            }}>
              <div style={{ color: '#ef4444', marginBottom: 8 }}>
                {state.error?.name}: {state.error?.message}
              </div>
              <pre style={{
                margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                color: '#6a6a8a', fontSize: 10,
              }}>
                {state.error?.stack}
              </pre>
              {state.errorInfo?.componentStack && (
                <>
                  <div style={{ color: '#f59e0b', marginTop: 8, marginBottom: 4 }}>Component Stack:</div>
                  <pre style={{
                    margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                    color: '#6a6a8a', fontSize: 10,
                  }}>
                    {state.errorInfo.componentStack}
                  </pre>
                </>
              )}
              <button
                onClick={copyErrorReport}
                style={{
                  marginTop: 8, padding: '4px 10px',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 4, color: '#a0a0c8', fontSize: 10, cursor: 'pointer',
                }}
              >
                复制错误报告
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundaryHandler
      onError={(error: Error, errorInfo: ErrorInfo) => {
        console.error('[ErrorBoundary] caught an error:', error, errorInfo)
        setState({ hasError: true, error, errorInfo, timestamp: Date.now() })
      }}
    >
      {children}
    </ErrorBoundaryHandler>
  )
}

interface ErrorBoundaryHandlerProps {
  children: ReactNode
  onError: (error: Error, errorInfo: ErrorInfo) => void
}

class ErrorBoundaryHandler extends React.Component<ErrorBoundaryHandlerProps> {
  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  state = { error: null as Error | null }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError(error, errorInfo)
  }

  render() {
    if (this.state.error) {
      return null
    }
    return this.props.children
  }
}

export default ErrorBoundary
