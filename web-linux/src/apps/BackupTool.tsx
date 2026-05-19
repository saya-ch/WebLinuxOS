import { useState } from 'react'

interface BackupRecord {
  id: string
  name: string
  source: string
  destination: string
  type: 'full' | 'incremental'
  size: string
  date: string
  status: 'completed' | 'failed' | 'in_progress'
}

const mockBackups: BackupRecord[] = [
  { id: '1', name: '系统备份 2024-01', source: '/home/user', destination: '/mnt/backup/sys', type: 'full', size: '45.2 GB', date: '2024-05-15 02:00', status: 'completed' },
  { id: '2', name: '增量备份 0516', source: '/home/user/文档', destination: '/mnt/backup/docs', type: 'incremental', size: '2.1 GB', date: '2024-05-16 02:00', status: 'completed' },
  { id: '3', name: '数据库备份', source: '/var/lib/postgresql', destination: '/mnt/backup/db', type: 'full', size: '12.8 GB', date: '2024-05-16 03:00', status: 'completed' },
  { id: '4', name: '配置文件备份', source: '/etc', destination: '/mnt/backup/etc', type: 'full', size: '256 MB', date: '2024-05-17 01:00', status: 'completed' },
  { id: '5', name: '增量备份 0517', source: '/home/user/下载', destination: '/mnt/backup/downloads', type: 'incremental', size: '5.6 GB', date: '2024-05-17 02:00', status: 'failed' },
]

export default function BackupTool() {
  const [backups] = useState<BackupRecord[]>(mockBackups)
  const [source, setSource] = useState('/home/user')
  const [dest, setDest] = useState('/mnt/backup')
  const [backupType, setBackupType] = useState<'full' | 'incremental'>('full')
  const [schedule, setSchedule] = useState('daily')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  const startBackup = () => {
    setRunning(true)
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setRunning(false)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 300)
  }

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
          <div style={{ marginTop: '8px', background: '#313244', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, progress)}%`, height: '100%',
              background: 'linear-gradient(90deg, #a6e3a1, #89b4fa)', transition: 'width 0.3s',
            }} />
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>备份历史</div>
        {backups.map((b) => (
          <div
            key={b.id}
            style={{
              display: 'flex', alignItems: 'center', padding: '10px 12px', background: '#313244',
              borderRadius: '8px', marginBottom: '6px', fontSize: '12px', gap: '12px',
            }}
          >
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: b.status === 'completed' ? '#a6e3a1' : b.status === 'failed' ? '#f38ba8' : '#f9e2af',
            }} />
            <span style={{ fontWeight: 600, flex: 1 }}>{b.name}</span>
            <span style={{ color: '#a6adc8' }}>{b.type === 'full' ? '完全' : '增量'}</span>
            <span style={{ color: '#89b4fa' }}>{b.size}</span>
            <span style={{ color: '#6c7086' }}>{b.date}</span>
            <button style={{
              padding: '4px 10px', background: '#45475a', color: '#cdd6f4',
              border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
            }}>
              恢复
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}