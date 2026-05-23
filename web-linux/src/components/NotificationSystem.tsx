import { memo, useState, useEffect, useCallback } from 'react'
import { useStore } from '../store'

export interface NotificationData {
  id: string
  title: string
  message: string
  icon?: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  timestamp?: Date
}

interface StoreType {
  notifications: NotificationData[]
  addNotification?: (notification: NotificationData) => void
  removeNotification?: (id: string) => void
}

interface NotificationItemProps {
  notification: NotificationData
  onClose: (id: string) => void
}

const NotificationItem = memo(function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
    
    const duration = notification.duration || 5000
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onClose(notification.id), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [notification, onClose])

  const getTypeStyles = () => {
    switch (notification.type) {
      case 'success':
        return { bg: 'rgba(46, 204, 113, 0.15)', border: 'rgba(46, 204, 113, 0.3)', icon: '✓' }
      case 'warning':
        return { bg: 'rgba(241, 196, 15, 0.15)', border: 'rgba(241, 196, 15, 0.3)', icon: '⚠' }
      case 'error':
        return { bg: 'rgba(231, 76, 60, 0.15)', border: 'rgba(231, 76, 60, 0.3)', icon: '✕' }
      default:
        return { bg: 'rgba(108, 92, 231, 0.15)', border: 'rgba(108, 92, 231, 0.3)', icon: 'ℹ' }
    }
  }

  const styles = getTypeStyles()

  return (
    <div
      style={{
        position: 'relative',
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '8px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        transform: isExiting ? 'translateX(100%)' : isVisible ? 'translateX(0)' : 'translateX(100%)',
        opacity: isExiting ? 0 : isVisible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          background: styles.border,
          borderRadius: '12px 0 0 12px',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: styles.border,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            flexShrink: 0,
          }}
        >
          {notification.icon || styles.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: '14px',
              marginBottom: '4px',
              color: 'var(--text-primary)',
            }}
          >
            {notification.title}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
            }}
          >
            {notification.message}
          </div>
        </div>
        <button
          onClick={() => {
            setIsExiting(true)
            setTimeout(() => onClose(notification.id), 300)
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            fontSize: '16px',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
})

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export const NotificationCenter = memo(function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const notifications = useStore((s: StoreType) => s.notifications || [])
  
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '60px',
        right: '16px',
        width: '380px',
        maxHeight: '600px',
        background: 'var(--panel-bg)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
        zIndex: 99998,
        overflow: 'hidden',
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: '16px', fontWeight: 600 }}>通知中心</div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '20px',
          }}
        >
          ✕
        </button>
      </div>
      <div
        style={{
          maxHeight: '500px',
          overflowY: 'auto',
          padding: '12px',
        }}
      >
        {notifications.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔔</div>
            <div>暂无通知</div>
          </div>
        ) : (
          notifications.map((notif: NotificationData) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onClose={(id) => {
                const store = useStore.getState() as StoreType
                if (store.removeNotification) {
                  store.removeNotification(id)
                }
              }}
            />
          ))
        )}
      </div>
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
})

export function useNotifications() {
  const addNotification = useCallback((data: Omit<NotificationData, 'id' | 'timestamp'>) => {
    const store = useStore.getState() as StoreType
    if (store.addNotification) {
      store.addNotification({
        ...data,
        id: `notif-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
      })
    }
  }, [])

  return { addNotification }
}
