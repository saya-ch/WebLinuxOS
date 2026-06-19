import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 全局错误处理器：捕获未处理的 JavaScript 异常
// 在开发环境下通过 console 详细记录，便于调试
if (typeof window !== 'undefined') {
  // 保存原始 onerror 以便在需要时恢复或链式调用
  const originalOnError = window.onerror

  window.onerror = (message, source, lineno, colno, error) => {
    // 开发环境下将错误详细信息打印到控制台
    if (import.meta.env.DEV) {
      console.error('[WebLinuxOS] 未捕获的异常：', {
        message,
        source,
        lineno,
        colno,
        error,
        stack: error?.stack,
        timestamp: new Date().toISOString(),
      })
    } else {
      // 生产环境：简洁记录，避免敏感信息泄露
      console.error('[WebLinuxOS] 运行时错误')
    }

    // 若存在原始处理器，继续调用
    if (typeof originalOnError === 'function') {
      try {
        return originalOnError.call(window, message, source, lineno, colno, error)
      } catch {
        /* 忽略原始处理器的异常 */
      }
    }
    return false
  }

  // 未处理的 Promise rejection 处理器
  window.addEventListener('unhandledrejection', (event) => {
    if (import.meta.env.DEV) {
      console.error('[WebLinuxOS] 未处理的 Promise rejection：', {
        reason: event.reason,
        timestamp: new Date().toISOString(),
      })
    } else {
      console.error('[WebLinuxOS] Promise rejection 未处理')
    }
  })

  // 动态设置内容安全策略（CSP）meta 标签
  // 注：此 meta 标签仅作为浏览器端策略提示；生产环境应主要依赖服务器响应头
  try {
    const cspMeta = document.createElement('meta')
    cspMeta.httpEquiv = 'Content-Security-Policy'
    // 允许同域资源、内联样式与脚本；严格限制外部脚本与 unsafe-eval
    cspMeta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' wss: ws:",
      "media-src 'self' blob:",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ')
    // 避免重复插入
    const existing = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
    if (!existing) {
      document.head.appendChild(cspMeta)
    }
  } catch (err) {
    console.warn('[WebLinuxOS] 无法设置 CSP meta 标签：', err)
  }
}

function RootApp() {
  // 移除加载预加载遮罩层，确保逻辑健壮：
  // - 同时支持 #preload 与 .preload 两种命名
  // - 延迟执行以便动画平滑过渡
  useEffect(() => {
    const tryRemove = () => {
      const preload =
        document.getElementById('preload') ||
        document.querySelector('.preload') ||
        document.querySelector('[data-preload]')
      if (preload && preload.parentNode) {
        preload.style.transition = 'opacity 0.5s ease'
        preload.style.opacity = '0'
        setTimeout(() => {
          try {
            if (preload.parentNode) {
              preload.parentNode.removeChild(preload)
            }
          } catch (err) {
            console.warn('[WebLinuxOS] 移除 preload 元素失败：', err)
          }
        }, 500)
      }
    }

    // 立即尝试一次，同时在 DOMContentLoaded 后再尝试一次，提升健壮性
    tryRemove()
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryRemove, { once: true })
    } else {
      setTimeout(tryRemove, 100)
    }
  }, [])

  return (
    <StrictMode>
      <App />
    </StrictMode>
  )
}

createRoot(document.getElementById('root')!).render(<RootApp />)
