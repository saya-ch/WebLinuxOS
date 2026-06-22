import React, { useState, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

function ErrorBoundary({ children, fallback }: Props) {
  const [state, setState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorInfo: null,
  })

  const handleReset = () => {
    setState({ hasError: false, error: null, errorInfo: null })
  }

  const handleReload = () => {
    try {
      sessionStorage.clear()
    } catch {
    }
    window.location.reload()
  }

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
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#fff' }}>
          组件加载出错
        </h2>
        <p style={{ fontSize: 13, color: '#a0a0c8', marginBottom: 20, textAlign: 'center' }}>
          {state.error?.message || '发生了未预期的错误'}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
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
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1'
            }}
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
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'
            }}
          >
            刷新页面
          </button>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundaryHandler
      onError={(error: Error, errorInfo: ErrorInfo) => {
        console.error('[ErrorBoundary] caught an error:', error, errorInfo)
        setState({ hasError: true, error, errorInfo })
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