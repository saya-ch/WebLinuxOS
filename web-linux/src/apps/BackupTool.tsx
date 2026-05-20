import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store'
import type { FileNode } from '../types'

interface BackupRecord {
  id: string
  name: string
  type: 'full' | 'incremental'
  size: string
  compressedSize: string
  compressionRatio: string
  date: string
  status: 'completed' | 'failed' | 'in_progress'
  fileCount: number
  data: string
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

const countFiles = (nodes: FileNode[]): number => {
  let count = 0
  for (const node of nodes) {
    if (node.type === 'file') count++
    if (node.children) count += countFiles(node.children)
  }
  return count
}

const getNextBackupTime = (schedule: string): string => {
  const now = new Date()
  switch (schedule) {
    case 'daily': {
      const next = new Date(now)
      next.setDate(next.getDate() + 1)
      next.setHours(2, 0, 0, 0)
      return next.toLocaleString('zh-CN')
    }
    case 'weekly': {
      const next = new Date(now)
      const daysUntilSunday = (7 - next.getDay()) % 7 || 7
      next.setDate(next.getDate() + daysUntilSunday)
      next.setHours(2, 0, 0, 0)
      return next.toLocaleString('zh-CN')
    }
    case 'monthly': {
      const next = new Date(now)
      next.setMonth(next.getMonth() + 1, 1)
      next.setHours(2, 0, 0, 0)
      return next.toLocaleString('zh-CN')
    }
    default:
      return '未设置'
  }
}

export default function BackupTool() {
  const files = useStore((s) => s.files)
  const updateFileContent = useStore((s) => s.updateFileContent)

  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [backupType, setBackupType] = useState<'full' | 'incremental'>('full')
  const [schedule, setSchedule] = useState('daily')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [previewBackup, setPreviewBackup] = useState<BackupRecord | null>(null)
  const [nextBackup, setNextBackup] = useState('')
  const [restoring, setRestoring] = useState<string | null>(null)

  useEffect(() => {
    if (schedule !== 'manual') {
      setNextBackup(getNextBackupTime(schedule))
    } else {
      setNextBackup('未设置')
    }
  }, [schedule])

  const createBackup = useCallback(() => {
    setRunning(true)
    setProgress(0)
    const data = JSON.stringify(files)
    const rawSize = new Blob([data]).size
    const compressedSize = Math.floor(rawSize * 0.6)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setRunning(false)
          const record: BackupRecord = {
            id: Date.now().toString(),
            name: `备份_${new Date().toLocaleDateString('zh-CN')}`,
            type: backupType,
            size: formatSize(rawSize),
            compressedSize: formatSize(compressedSize),
            compressionRatio: ((1 - compressedSize / rawSize) * 100).toFixed(1) + '%',
            date: new Date().toLocaleString('zh-CN'),
            status: 'completed',
            fileCount: countFiles(files),
            data,
          }
          setBackups((prev) => [record, ...prev])
          return 100
        }
        return prev + Math.random() * 12
      })
    }, 80)
  }, [files, backupType])

  const restoreBackup = useCallback((backup: BackupRecord) => {
    setRestoring(backup.id)
    try {
      const restoredFiles = JSON.parse(backup.data) as FileNode[]
      const updateAll = (nodes: FileNode[]) => {
        for (const node of nodes) {
          if (node.type === 'file' && node.content !== undefined) {
            updateFileContent(node.id, node.content)
          }
          if (node.children) updateAll(node.children)
        }
      }
      updateAll(restoredFiles)
      setTimeout(() => setRestoring(null), 1500)
    } catch {
      setRestoring(null)
    }
  }, [updateFileContent])

  const deleteBackup = useCallback((id: string) => {
    setBackups((prev) => prev.filter((b) => b.id !== id))
    if (previewBackup?.id === id) setPreviewBackup(null)
  }, [previewBackup])

  const getPreviewFiles = (data: string): { name: string; size: string }[] => {
    try {
      const nodes = JSON.parse(data) as FileNode[]
      const result: { name: string; size: string }[] = []
      const walk = (ns: FileNode[], path: string) => {
        for (const n of ns) {
          if (n.type === 'file') {
            result.push({ name: path + n.name, size: formatSize(n.content?.length || 0) })
          }
          if (n.children) walk(n.children, path + n.name + '/')
        }
      }
      walk(nodes, '/')
      return result
    } catch {
      return []
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #313244' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>创建备份</div>

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
              <label style={{ fontSize: '11px', color: '#a6adc8' }}>自动备份计划</label>
              <select
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                style={{
                  padding: '6px 10px', background: '#313244', border: '1px solid #45475a',
                  borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none', marginTop: '4px', display: 'block',
                }}
              >
                <option value="daily">每日</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
                <option value="manual">手动</option>
              </select>
            </div>
          </div>

          {schedule !== 'manual' && (
            <div style={{ fontSize: '11px', color: '#a6adc8', marginBottom: '10px', background: '#313244', padding: '8px 12px', borderRadius: '6px' }}>
              下次自动备份: <span style={{ color: '#89b4fa' }}>{nextBackup}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '11px', color: '#a6adc8' }}>
            <span>文件数量: <span style={{ color: '#cdd6f4' }}>{countFiles(files)}</span></span>
            <span>原始大小: <span style={{ color: '#cdd6f4' }}>{formatSize(new Blob([JSON.stringify(files)]).size)}</span></span>
          </div>

          <button
            onClick={createBackup}
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
            <div style={{ marginTop: '8px', background: '#313244', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, progress)}%`, height: '100%',
                background: 'linear-gradient(90deg, #a6e3a1, #89b4fa)', transition: 'width 0.3s ease',
              }} />
            </div>
          )}
        </div>

        <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>备份历史</div>
          {backups.length === 0 && (
            <div style={{ textAlign: 'center', color: '#6c7086', padding: '40px 0', fontSize: '12px' }}>
              暂无备份记录
            </div>
          )}
          {backups.map((b) => (
            <div
              key={b.id}
              style={{
                display: 'flex', alignItems: 'center', padding: '10px 12px', background: '#313244',
                borderRadius: '8px', marginBottom: '6px', fontSize: '12px', gap: '12px',
                border: previewBackup?.id === b.id ? '1px solid #89b4fa' : '1px solid transparent',
                cursor: 'pointer',
              }}
              onClick={() => setPreviewBackup(previewBackup?.id === b.id ? null : b)}
            >
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                background: b.status === 'completed' ? '#a6e3a1' : b.status === 'failed' ? '#f38ba8' : '#f9e2af',
              }} />
              <span style={{ fontWeight: 600, flex: 1 }}>{b.name}</span>
              <span style={{ color: '#a6adc8' }}>{b.type === 'full' ? '完全' : '增量'}</span>
              <span style={{ color: '#89b4fa' }}>{b.compressedSize}</span>
              <span style={{ color: '#a6e3a1', fontSize: '10px' }}>{b.compressionRatio}</span>
              <span style={{ color: '#6c7086' }}>{b.date}</span>
              <button
                onClick={(e) => { e.stopPropagation(); restoreBackup(b) }}
                disabled={restoring === b.id}
                style={{
                  padding: '4px 10px', background: restoring === b.id ? '#45475a' : '#89b4fa', color: '#1e1e2e',
                  border: 'none', borderRadius: '4px', cursor: restoring === b.id ? 'not-allowed' : 'pointer', fontSize: '11px',
                }}
              >
                {restoring === b.id ? '恢复中...' : '恢复'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteBackup(b.id) }}
                style={{
                  padding: '4px 8px', background: '#f38ba8', color: '#1e1e2e',
                  border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
                }}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      </div>

      {previewBackup && (
        <div style={{
          width: '280px', borderLeft: '1px solid #313244', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #313244', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>备份预览</span>
            <button
              onClick={() => setPreviewBackup(null)}
              style={{ background: 'none', border: 'none', color: '#a6adc8', cursor: 'pointer', fontSize: '14px' }}
            >
              ✕
            </button>
          </div>
          <div style={{ padding: '12px 16px', fontSize: '11px', color: '#a6adc8', borderBottom: '1px solid #313244' }}>
            <div style={{ marginBottom: '6px' }}>名称: <span style={{ color: '#cdd6f4' }}>{previewBackup.name}</span></div>
            <div style={{ marginBottom: '6px' }}>类型: <span style={{ color: '#cdd6f4' }}>{previewBackup.type === 'full' ? '完全备份' : '增量备份'}</span></div>
            <div style={{ marginBottom: '6px' }}>原始大小: <span style={{ color: '#89b4fa' }}>{previewBackup.size}</span></div>
            <div style={{ marginBottom: '6px' }}>压缩后: <span style={{ color: '#a6e3a1' }}>{previewBackup.compressedSize}</span></div>
            <div style={{ marginBottom: '6px' }}>压缩率: <span style={{ color: '#a6e3a1' }}>{previewBackup.compressionRatio}</span></div>
            <div style={{ marginBottom: '6px' }}>文件数: <span style={{ color: '#cdd6f4' }}>{previewBackup.fileCount}</span></div>
            <div>时间: <span style={{ color: '#cdd6f4' }}>{previewBackup.date}</span></div>
          </div>
          <div style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 600, color: '#a6adc8', borderBottom: '1px solid #313244' }}>
            包含文件
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
            {getPreviewFiles(previewBackup.data).map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '11px', borderBottom: '1px solid #313244' }}>
                <span style={{ color: '#cdd6f4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>{f.name}</span>
                <span style={{ color: '#89b4fa', flexShrink: 0 }}>{f.size}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
