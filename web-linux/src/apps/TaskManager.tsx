import { useMemo } from 'react'
import { useStore } from '../store'

export default function TaskManager() {
  const windows = useStore((s) => s.windows)
  const closeWindow = useStore((s) => s.closeWindow)
  const apps = useStore((s) => s.apps)

  const processes = useMemo(() => {
    return windows.map((w) => {
      const app = apps.find((a) => a.id === w.appId)
      return {
        id: w.id,
        name: app?.name || w.title,
        appId: w.appId,
        cpu: Math.round((Math.random() * 8 + 0.1) * 10) / 10,
        memory: Math.round((Math.random() * 200 + 10) * 10) / 10,
        status: w.minimized ? '后台' : '运行中',
        windowId: w.id,
      }
    })
  }, [windows, apps])

  const totalCpu = useMemo(() => processes.reduce((s, p) => s + p.cpu, 0), [processes])
  const totalMemory = useMemo(() => processes.reduce((s, p) => s + p.memory, 0), [processes])

  function handleEndProcess(windowId: string) {
    closeWindow(windowId)
  }

  return (
    <div className="app-container app-task-manager" style={{ background: '#1e1e1e', color: '#fff', padding: 16, overflow: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 14, background: '#2d2d2d', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>进程数</div>
          <div style={{ fontSize: 28, fontWeight: 300 }}>{processes.length}</div>
        </div>
        <div style={{ padding: 14, background: '#2d2d2d', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>CPU</div>
          <div style={{ fontSize: 28, fontWeight: 300 }}>{totalCpu.toFixed(1)}%</div>
        </div>
        <div style={{ padding: 14, background: '#2d2d2d', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>内存</div>
          <div style={{ fontSize: 28, fontWeight: 300 }}>{totalMemory.toFixed(0)} MB</div>
        </div>
      </div>

      <div style={{ background: '#2d2d2d', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #444', fontSize: 14, fontWeight: 600 }}>
          应用程序 ({processes.length})
        </div>
        {processes.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#666', fontSize: 13 }}>
            没有正在运行的应用
          </div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: '#888', borderBottom: '1px solid #444' }}>
              <th style={{ textAlign: 'left', padding: '8px 16px' }}>名称</th>
              <th style={{ textAlign: 'center', padding: '8px 16px' }}>状态</th>
              <th style={{ textAlign: 'right', padding: '8px 16px' }}>CPU</th>
              <th style={{ textAlign: 'right', padding: '8px 16px' }}>内存</th>
              <th style={{ textAlign: 'center', padding: '8px 16px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((proc) => (
              <tr key={proc.id} style={{ borderBottom: '1px solid #3a3a3a' }}>
                <td style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{proc.name}</span>
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: proc.status === '运行中' ? '#4caf50' : '#ff9800',
                    marginRight: 4,
                  }} />
                  {proc.status}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{proc.cpu}%</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{proc.memory} MB</td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleEndProcess(proc.windowId)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 4,
                      border: '1px solid #f44747',
                      background: 'rgba(244,71,71,0.15)',
                      color: '#f44747',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    结束进程
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}