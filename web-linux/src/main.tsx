import { StrictMode, useEffect, useState, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './aesthetic-upgrade.css'
import App from './App.tsx'
import BootAnimation from './components/BootAnimation'

// 全局错误处理器：捕获未处理的 JavaScript 异常
// 在开发环境下通过 console 详细记录，便于调试
if (typeof window !== 'undefined') {
  // 安全序列化任意值，防止循环引用导致 JSON.stringify 崩溃
  function safeSerializeReason(v: unknown, depth = 0): unknown {
    const MAX_DEPTH = 4
    if (v === null || v === undefined) return v
    if (typeof v !== 'object') return v
    if (depth > MAX_DEPTH) return '[MaxDepthReached]'
    try {
      if (v instanceof Error) {
        return {
          _type: 'Error',
          name: v.name,
          message: v.message,
          stack: v.stack,
        }
      }
      if (Array.isArray(v)) {
        return v.map((item) => safeSerializeReason(item, depth + 1)).slice(0, 50)
      }
      if (v instanceof Promise) return '[Promise]'
      if (typeof (v as { toJSON?: () => unknown }).toJSON === 'function') {
        return (v as { toJSON: () => unknown }).toJSON()
      }
      const out: Record<string, unknown> = {}
      let count = 0
      for (const k of Object.keys(v as Record<string, unknown>)) {
        if (count++ > 100) break
        try {
          out[k] = safeSerializeReason((v as Record<string, unknown>)[k], depth + 1)
        } catch {
          out[k] = '[Unserializable]'
        }
      }
      return out
    } catch {
      return String(v)
    }
  }

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
      // 尽可能提取出可读的错误详情，避免控制台中显示为无法展开的空对象
      const r = event.reason
      let reasonInfo: Record<string, unknown> = { raw: typeof r === 'object' ? JSON.stringify(safeSerializeReason(r), null, 2) : String(r) }
      if (r instanceof Error) {
        reasonInfo = {
          name: r.name,
          message: r.message,
          stack: r.stack,
          cause: safeSerializeReason((r as unknown as { cause?: unknown }).cause),
        }
      } else if (r && typeof r === 'object') {
        try {
          const keys = Object.keys(r)
          if (keys.length === 0) {
            reasonInfo = { emptyObject: true, toString: String(r) }
          } else {
            reasonInfo = Object.fromEntries(
              keys.map((k) => [k, safeSerializeReason((r as Record<string, unknown>)[k])]),
            ) as Record<string, unknown>
          }
        } catch {
          reasonInfo = { note: '无法序列化 reason', toString: String(r) }
        }
      }
      console.error('[WebLinuxOS] 未处理的 Promise rejection：', {
        reason: reasonInfo,
        timestamp: new Date().toISOString(),
      })
    } else {
      console.error('[WebLinuxOS] Promise rejection 未处理')
    }
  })

  // CSP meta 标签已移至 index.html <head> 中，确保在页面加载前即生效
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    // 使用 import.meta.env.BASE_URL 适配 VITE_BASE_PATH 自定义部署
    const swUrl = `${import.meta.env.BASE_URL}sw.js`
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(swUrl)
        .then((registration) => {
          console.log('[WebLinuxOS] Service Worker 注册成功:', registration.scope)

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[WebLinuxOS] 发现新版本，正在更新...')
                  newWorker.postMessage({ type: 'SKIP_WAITING' })
                }
              })
            }
          })

          // 检查更新（每小时一次）
          setInterval(() => {
            registration.update().catch(() => { /* 静默忽略更新检查错误 */ })
          }, 60 * 60 * 1000)
        })
        .catch((err) => {
          console.warn('[WebLinuxOS] Service Worker 注册失败:', err)
        })
    })

    // 监听控制器变更，自动重载以应用新版本
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })
  }

  // 离线/在线状态提示
  window.addEventListener('online', () => {
    console.log('[WebLinuxOS] 网络已恢复')
  })
  window.addEventListener('offline', () => {
    console.log('[WebLinuxOS] 已离线，部分功能可能不可用')
  })
}

registerServiceWorker()

function RootApp() {
  const [bootComplete, setBootComplete] = useState(false)
  const [appReady, setAppReady] = useState(false)

  useEffect(() => {
    const tryRemove = () => {
      const preload =
        document.getElementById('preload') ||
        document.querySelector('.preload') ||
        document.querySelector('[data-preload]')
      if (preload && preload.parentNode) {
        preload.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
        preload.style.opacity = '0'
        preload.style.pointerEvents = 'none'
        setTimeout(() => {
          try {
            if (preload.parentNode) {
              preload.parentNode.removeChild(preload)
            }
          } catch (err) {
            console.warn('[WebLinuxOS] 移除 preload 元素失败：', err)
          }
        }, 600)
      }
    }

    tryRemove()
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryRemove, { once: true })
    } else {
      setTimeout(tryRemove, 100)
    }
  }, [])

  // 启动动画完成后，平滑过渡到主应用
  const handleBootComplete = useCallback(() => {
    setBootComplete(true)
    // 使用 requestAnimationFrame 确保 DOM 更新后再触发过渡
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAppReady(true)
      })
    })
  }, [])

  return (
    <StrictMode>
      {!bootComplete && <BootAnimation onComplete={handleBootComplete} />}
      {bootComplete && (
        <div
          className={appReady ? 'app-root-ready' : 'app-root-entering'}
          style={{ width: '100%', height: '100%' }}
        >
          <App />
        </div>
      )}
    </StrictMode>
  )
}

createRoot(document.getElementById('root')!).render(<RootApp />)
