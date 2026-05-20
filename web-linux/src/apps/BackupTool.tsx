import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store'
import type { FileNode } from '../types'

interface BackupRecord {
  id: string
  name: string
  source: string
  destination: string
  type: 'full' | 'incremental'
  size: number
  compressedSize: number
  date: string
  status: 'completed' | 'failed' | 'in_progress'
  fileCount: number
  files: SerializedFile[]
  scheduleEnabled: boolean
}

interface SerializedFile {
  id: string
  name: string
  type: 'file' | 'folder'
  content?: string
  parentId: string | null
}

function serializeFiles(nodes: FileNode[]): SerializedFile[] {
  const result: SerializedFile[] = []
  const walk = (list: FileNode[]) => {
    for (const n of list) {
      result.push({ id: n.id, name: n.name, type: n.type, content: n.content, parentId: n.parentId })
      if (n.children) walk(n.children)
    }
  }
  walk(nodes)
  return result
}

function calcRawSize(files: SerializedFile[]): number {
  let total = 0
  for (const f of files) {
    total += f.name.length * 2
    if (f.content) total += f.content.length * 2
    total += 64
  }
  return total
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function getNextBackupTime(schedule: string): string {
  const now = new Date()
  const next = new Date(now)
  if (schedule === 'daily') {
    next.setHours(2, 0, 0, 0)
    if (next <= now) next.setDate(next.getDate() + 1)
  } else if (schedule === 'weekly') {
    next.setHours(2, 0, 0, 0)
    const daysUntilSun = (7 - next.getDay()) % 7 || 7
    next.setDate(next.getDate() + daysUntilSun)
  } else if (schedule === 'monthly') {
    next.setHours(2, 0, 0, 0)
    next.setDate(1)
    if (next <= now) next.setMonth(next.getMonth() + 1)
  }
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')} ${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`
}

const mockBackups: BackupRecord[] = [
  { id: '1', name: '系统备份 2024-01', source: '/home/user', destination: '/mnt/backup/sys', type: 'full', size: 47360000, compressedSize: 28416000, date: '2024-05-15 02:00', status: 'completed', fileCount: 12, files: [], scheduleEnabled: false },
  { id: '2', name: '增量备份 0516', source: '/home/user/文档', destination: '/mnt/backup/docs', type: 'incremental', size: 2200000, compressedSize: 1540000, date: '2024-05-16 02:00', status: 'completed', fileCount: 3, files: [], scheduleEnabled: false },
  { id: '3', name: '数据库备份', source: '/var/lib/postgresql', destination: '/mnt/backup/db', type: 'full', size: 13400000, compressedSize: 8040000, date: '2024-05-16 03:00', status: 'completed', fileCount: 5, files: [], scheduleEnabled: false },
  { id: '4', name: '配置文件备份', source: '/etc', destination: '/mnt/backup/etc', type: 'full', size: 256000, compressedSize: 179200, date: '2024-05-17 01:00', status: 'completed', fileCount: 2, files: [], scheduleEnabled: false },
  { id: '5', name: '增量备份 0517', source: '/home/user/下载', destination: '/mnt/backup/downloads', type: 'incremental', size: 5870000, compressedSize: 4403000, date: '2024-05-17 02:00', status: 'failed', fileCount: 0, files: [], scheduleEnabled: false },
]

export default function BackupTool() {
  const files = useStore((s) => s.files)
  const updateFileContent = useStore((s) => s.updateFileContent)

  const [backups, setBackups] = useState<BackupRecord[]>(mockBackups)
  const [source, setSource] = useState('/home/user')
  const [dest, setDest] = useState('/mnt/backup')
  const [backupType, setBackupType] = useState<'full' | 'incremental'>('full')
  const [schedule, setSchedule] = useState('daily')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [previewBackup, setPreviewBackup] = useState<string | null>(null)
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false)
  const [autoBackupSchedule, setAutoBackupSchedule] = useState('daily')
  const [nextBackupTime, setNextBackupTime] = useState('')
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (autoBackupEnabled) {
      setNextBackupTime(getNextBackupTime(autoBackupSchedule))
      const timer = setInterval(() => {
        setNextBackupTime(getNextBackupTime(autoBackupSchedule))
      }, 60000)
      return () => clearInterval(timer)
    } else {
      setNextBackupTime('')
    }
  }, [autoBackupEnabled, autoBackupSchedule])

  const startBackup = useCallback(() => {
    setRunning(true)
    setProgress(0)
    if (progressRef.current) clearInterval(progressRef.current)
    progressRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (progressRef.current) clearInterval(progressRef.current)
          setRunning(false)
          const serialized = serializeFiles(files)
          const rawSize = calcRawSize(serialized)
          const compressedSize = Math.round(rawSize * (0.55 + Math.random() * 0.15))
          const newBackup: BackupRecord = {
            id: `bk-${Date.now()}`,
            name: `${backupType === 'full' ? '完全' : '增量'}备份 ${new Date().toLocaleDateString('zh-CN')}`,
            source,
            destination: dest,
            type: backupType,
            size: rawSize,
            compressedSize,
            date: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-'),
            status: 'completed',
            fileCount: serialized.filter((f) => f.type === 'file').length,
            files: serialized,
            scheduleEnabled: false,
          }
          setBackups((prev) => [newBackup, ...prev])
          return 100
        }
        return prev + 1 + Math.random() * 3
      })
    }, 80)
  }, [files, source, dest, backupType])

  const restoreBackup = useCallback((backup: BackupRecord) => {
    if (backup.files.length === 0) return
    for (const f of backup.files) {
      if (f.type === 'file' && f.content !== undefined) {
        updateFileContent(f.id, f.content)
      }
    }
  }, [updateFileContent])

  const deleteBackup = useCallback((id: string) => {
    setBackups((prev) => prev.filter((b) => b.id !== id))
    if (previewBackup === id) setPreviewBackup(null)
  }, [previewBackup])

  const preview = backups.find((b) => b.id === previewBackup)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #313244' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>创建备份</div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '11px', color: '#a6adc8' }}>源目录</label>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              style={{
                width: '100%', padding: '6px 10px', background: '#313244', border: '1px solid #45475a',
                borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none', marginTop: '4px',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '11px', color: '#a6adc8' }}>目标目录</label>
            <input
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              style={{
                width: '100%', padding: '6px 10px', background: '#313244', border: '1px solid #45475a',
                borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none', marginTop: '4px',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#a6adc8' }}>备份类型</label>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <button
                onClick={() => setBackupType('full')}
                style={{
                  padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                  background: backupType === 'full' ? '#89b4fa' : '#313244',
                  color: backupType === 'full' ? '#1e1e2e' : '#cdd6f4', fontSize: '12px',
                }}
              >
                完全备份
              </button>
              <button
                onClick={() => setBackupType('incremental')}
                style={{
                  padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                  background: backupType === 'incremental' ? '#89b4fa' : '#313244',
                  color: backupType === 'incremental' ? '#1e1e2e' : '#cdd6f4', fontSize: '12px',
                }}
              >
                增量备份
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#a6adc8' }}>计划</label>
            <select
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              style={{
                padding: '6px 10px', background: '#313244', border: '1px solid #45475a',
                borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none', marginTop: '4px',
              }}
            >
              <option value="daily">每日</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
              <option value="manual">手动</option>
            </select>
          </div>
        </div>

        <button
          onClick={startBackup}
          disabled={running}
          style={{
            padding: '10px 24px', background: running ? '#45475a' : '#a6e3a1', color: '#1e1e2e',
            border: 'none', borderRadius: '6px', cursor: running ? 'not-allowed' : 'pointer',
            fontSize: '13px', fontWeight: 600,
          }}
        >
          {running ? `正在备份... ${Math.min(100, Math.floor(progress))}%` : '开始备份'}
        </button>

        {running && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ background: '#313244', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, progress)}%`, height: '100%',
                background: 'linear-gradient(90deg, #a6e3a1, #89b4fa)', transition: 'width 0.1s linear',
              }} />
            </div>
            <div style={{ fontSize: '11px', color: '#a6adc8', marginTop: '4px' }}>
              {Math.min(100, Math.floor(progress)) < 30 ? '正在扫描文件...' :
               Math.min(100, Math.floor(progress)) < 60 ? '正在压缩数据...' :
               Math.min(100, Math.floor(progress)) < 90 ? '正在写入备份...' : '正在完成...'}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid #313244', background: '#181825' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>自动备份计划</span>
          <button
            onClick={() => setAutoBackupEnabled(!autoBackupEnabled)}
            style={{
              width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
              background: autoBackupEnabled ? '#a6e3a1' : '#45475a', position: 'relative',
            }}
          >
            <div style={{
              width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
              position: 'absolute', top: '3px', left: autoBackupEnabled ? '21px' : '3px', transition: 'left 0.2s',
            }} />
          </button>
        </div>
        {autoBackupEnabled && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={autoBackupSchedule}
              onChange={(e) => setAutoBackupSchedule(e.target.value)}
              style={{
                padding: '4px 8px', background: '#313244', border: '1px solid #45475a',
                borderRadius: '4px', color: '#cdd6f4', fontSize: '11px', outline: 'none',
              }}
            >
              <option value="daily">每日</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
            </select>
            <span style={{ fontSize: '11px', color: '#a6adc8' }}>
              下次备份: <span style={{ color: '#89b4fa' }}>{nextBackupTime}</span>
            </span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>备份历史</div>
          {backups.map((b) => {
            const ratio = b.size > 0 ? ((1 - b.compressedSize / b.size) * 100).toFixed(1) : '0'
            return (
              <div
                key={b.id}
                style={{
                  display: 'flex', alignItems: 'center', padding: '10px 12px', background: previewBackup === b.id ? '#45475a' : '#313244',
                  borderRadius: '8px', marginBottom: '6px', fontSize: '12px', gap: '10px',
                }}
              >
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                  background: b.status === 'completed' ? '#a6e3a1' : b.status === 'failed' ? '#f38ba8' : '#f9e2af',
                }} />
                <span style={{ fontWeight: 600, flex: 1, cursor: 'pointer' }} onClick={() => setPreviewBackup(previewBackup === b.id ? null : b.id)}>
                  {b.name}
                </span>
                <span style={{ color: '#a6adc8' }}>{b.type === 'full' ? '完全' : '增量'}</span>
                <span style={{ color: '#89b4fa' }}>{formatSize(b.compressedSize)}</span>
                <span style={{ color: '#a6e3a1', fontSize: '10px' }}>-{ratio}%</span>
                <span style={{ color: '#6c7086' }}>{b.date}</span>
                <button
                  onClick={() => setPreviewBackup(previewBackup === b.id ? null : b.id)}
                  style={{
                    padding: '4px 8px', background: '#45475a', color: '#cdd6f4',
                    border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px',
                  }}
                >
                  预览
                </button>
                <button
                  onClick={() => restoreBackup(b)}
                  disabled={b.status !== 'completed' || b.files.length === 0}
                  style={{
                    padding: '4px 8px', background: b.status !== 'completed' || b.files.length === 0 ? '#45475a' : '#89b4fa', color: '#1e1e2e',
                    border: 'none', borderRadius: '4px', cursor: b.status !== 'completed' || b.files.length === 0 ? 'not-allowed' : 'pointer', fontSize: '10px',
                  }}
                >
                  恢复
                </button>
                <button
                  onClick={() => deleteBackup(b.id)}
                  style={{
                    padding: '4px 8px', background: '#f38ba8', color: '#1e1e2e',
                    border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px',
                  }}
                >
                  删除
                </button>
              </div>
            )
          })}
        </div>

        {preview && (
          <div style={{ width: '260px', borderLeft: '1px solid #313244', padding: '12px', overflowY: 'auto', background: '#181825' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>备份预览</div>
            <div style={{ fontSize: '11px', color: '#a6adc8', marginBottom: '6px' }}>
              <div>原始大小: <span style={{ color: '#cdd6f4' }}>{formatSize(preview.size)}</span></div>
              <div>压缩大小: <span style={{ color: '#89b4fa' }}>{formatSize(preview.compressedSize)}</span></div>
              <div>压缩率: <span style={{ color: '#a6e3a1' }}>{preview.size > 0 ? ((1 - preview.compressedSize / preview.size) * 100).toFixed(1) : '0'}%</span></div>
              <div>文件数: <span style={{ color: '#cdd6f4' }}>{preview.fileCount}</span></div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '8px', marginBottom: '6px' }}>包含文件</div>
            {preview.files.length > 0 ? preview.files.map((f) => (
              <div key={f.id} style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{f.type === 'folder' ? '📁' : '📄'}</span>
                <span style={{ color: '#cdd6f4' }}>{f.name}</span>
                {f.content !== undefined && <span style={{ color: '#6c7086', fontSize: '10px' }}>({formatSize(f.content.length * 2)})</span>}
              </div>
            )) : (
              <div style={{ fontSize: '11px', color: '#6c7086', padding: '8px' }}>此备份无文件预览数据</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
