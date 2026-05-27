import { useState, useCallback } from 'react'
import { Download, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { useStore } from '../store'

type BackupData = {
  version: string
  timestamp: number
  files: any
  notes: any
  settings: any
  activities: any
  [key: string]: any
}

export default function DataExporter() {
  const [status, setStatus] = useState<'idle' | 'exporting' | 'importing' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  const store = useStore((s) => s)

  const exportData = useCallback(() => {
    setStatus('exporting')
    setStatusMessage('正在准备导出数据...')

    try {
      const data: BackupData = {
        version: '1.0.0',
        timestamp: Date.now(),
        files: (store as any).fileSystem || {},
        notes: (store as any).notes || [],
        settings: {
          theme: store.theme,
          currentDesktop: store.currentDesktop,
          totalDesktops: store.totalDesktops
        },
        activities: (store as any).activities || []
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `weblinux-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setStatus('success')
      setStatusMessage('数据导出成功！')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (e) {
      setStatus('error')
      setStatusMessage('导出失败：' + (e as Error).message)
    }
  }, [store])

  const importData = useCallback((file: File) => {
    setStatus('importing')
    setStatusMessage('正在导入数据...')

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData
        if (!data.version) throw new Error('无效的备份文件')

        if (data.files) {
          (store as any).setFileSystem?.(data.files)
        }
        if (data.settings) {
          if (data.settings.theme) store.setTheme(data.settings.theme)
        }

        localStorage.setItem('weblinux-backup-restore', JSON.stringify(data))

        setStatus('success')
        setStatusMessage('数据导入成功！页面将在 3 秒后刷新。')
        setTimeout(() => window.location.reload(), 3000)
      } catch (err) {
        setStatus('error')
        setStatusMessage('导入失败：' + (err as Error).message)
      }
    }
    reader.readAsText(file)
  }, [store])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      importData(file)
    }
  }

  return (
    <div style={{
      padding: '24px',
      height: '100%',
      overflow: 'auto',
      background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
      color: '#e2e8f0'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '16px'
        }}>
          <FileText size={32} color="white" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>数据导入导出</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#94a3b8' }}>
            备份和恢复您的 WebLinux 数据
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Download size={24} color="#3b82f6" />
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>导出数据</h2>
          </div>
          <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px' }}>
            将您的所有数据（文件、笔记、设置等）导出为 JSON 文件，以便安全备份。
          </p>
          <button
            onClick={exportData}
            disabled={status === 'exporting'}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: status === 'exporting' ? '#334155' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: status === 'exporting' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Download size={18} />
            {status === 'exporting' ? '导出中...' : '导出所有数据'}
          </button>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Upload size={24} color="#10b981" />
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>导入数据</h2>
          </div>
          <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px' }}>
            从之前导出的备份文件恢复您的数据。此操作将覆盖现有数据。
          </p>
          <label style={{
            display: 'block',
            width: '100%',
            padding: '14px 20px',
            background: status === 'importing' ? '#334155' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontSize: '15px',
            fontWeight: '600',
            cursor: status === 'importing' ? 'not-allowed' : 'pointer',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              disabled={status === 'importing'}
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Upload size={18} />
              {status === 'importing' ? '导入中...' : '选择备份文件'}
            </div>
          </label>
          <p style={{
            marginTop: '12px',
            fontSize: '12px',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertCircle size={14} />
            注意：导入操作会覆盖现有数据，请确保已备份！
          </p>
        </div>
      </div>

      {status === 'success' && (
        <div style={{
          marginTop: '24px',
          padding: '16px 20px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle size={20} color="#10b981" />
          <span style={{ color: '#10b981', fontWeight: '500' }}>{statusMessage}</span>
        </div>
      )}

      {status === 'error' && (
        <div style={{
          marginTop: '24px',
          padding: '16px 20px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={20} color="#ef4444" />
          <span style={{ color: '#ef4444', fontWeight: '500' }}>{statusMessage}</span>
        </div>
      )}

      <div style={{
        marginTop: '32px',
        padding: '20px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px'
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>备份包含的内容</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#94a3b8', lineHeight: '2' }}>
          <li>虚拟文件系统中的所有文件和文件夹</li>
          <li>SmartNotes 笔记和待办事项</li>
          <li>系统设置（主题、桌面配置等）</li>
          <li>活动追踪器数据</li>
        </ul>
      </div>
    </div>
  )
}
