import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorCount: number
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorCount: 0 }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }))
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '24px',
            background: 'var(--window-bg)',
            borderRadius: '8px',
          }}
          role="alert"
          aria-live="assertive"
        >
          <span style={{ fontSize: '64px', marginBottom: '20px' }} aria-hidden="true">⚠️</span>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '18px', fontWeight: 600 }}>
            应用加载出错
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px', textAlign: 'center', maxWidth: '400px' }}>
            {this.state.error?.message || '发生了一个未知错误'}
          </p>
          {this.state.errorCount > 1 && (
            <p style={{ color: 'var(--accent)', fontSize: '12px', marginBottom: '16px' }}>
              错误已连续发生 {this.state.errorCount} 次
            </p>
          )}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'background 0.2s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'var(--accent)'}
            >
              重试
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: '1px solid var(--window-border)',
                background: 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--titlebar-button-hover)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              重新加载页面
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary