import { useState, useEffect } from 'react'

interface NetworkInterface {
  name: string
  ip: string
  mac: string
  status: 'connected' | 'disconnected'
  type: 'wifi' | 'ethernet' | 'loopback'
  speed: string
}

const interfaces: NetworkInterface[] = [
  { name: 'eth0', ip: '192.168.1.100', mac: '00:1A:2B:3C:4D:5E', status: 'connected', type: 'ethernet', speed: '1000 Mbps' },
  { name: 'wlan0', ip: '192.168.1.101', mac: 'AA:BB:CC:DD:EE:FF', status: 'connected', type: 'wifi', speed: '866 Mbps' },
  { name: 'lo', ip: '127.0.0.1', mac: '00:00:00:00:00:00', status: 'connected', type: 'loopback', speed: '-' },
]

export default function NetworkMonitor() {
  const [downloadSpeed, setDownloadSpeed] = useState(45.2)
  const [uploadSpeed, setUploadSpeed] = useState(12.8)
  const [totalDown, setTotalDown] = useState(1024.5)
  const [totalUp, setTotalUp] = useState(512.3)
  const [trafficHistory, setTrafficHistory] = useState<{ down: number; up: number }[]>(
    Array.from({ length: 30 }, () => ({ down: 0, up: 0 }))
  )

  useEffect(() => {
    const interval = setInterval(() => {
      const down = +(Math.random() * 80 + 10).toFixed(1)
      const up = +(Math.random() * 30 + 2).toFixed(1)
      setDownloadSpeed(down)
      setUploadSpeed(up)
      setTotalDown((prev) => +(prev + down / 60).toFixed(1))
      setTotalUp((prev) => +(prev + up / 60).toFixed(1))
      setTrafficHistory((prev) => [...prev.slice(1), { down, up }])
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const maxTraffic = Math.max(...trafficHistory.flatMap((t) => [t.down, t.up]), 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #313244' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>网络接口</div>
        {interfaces.map((iface) => (
          <div
            key={iface.name}
            style={{
              display: 'flex', alignItems: 'center', padding: '10px 12px', background: '#313244',
              borderRadius: '8px', marginBottom: '8px', fontSize: '12px', gap: '16px',
            }}
          >
            <span style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: iface.status === 'connected' ? '#a6e3a1' : '#f38ba8',
            }} />
            <span style={{ fontWeight: 600, minWidth: '60px' }}>{iface.name}</span>
            <span style={{ color: '#a6adc8' }}>{iface.type === 'ethernet' ? '以太网' : iface.type === 'wifi' ? 'Wi-Fi' : '回环'}</span>
            <span style={{ flex: 1, color: '#89b4fa' }}>{iface.ip}</span>
            <span style={{ color: '#6c7086' }}>{iface.mac}</span>
            <span style={{ color: '#a6adc8' }}>{iface.speed}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid #313244' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>实时流量</div>
        <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', gap: '2px', background: '#181825', borderRadius: '6px', padding: '8px' }}>
          {trafficHistory.map((t, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '1px', height: '100%' }}>
              <div style={{ height: `${(t.down / maxTraffic) * 50}%`, background: '#89b4fa', borderRadius: '1px', minHeight: '1px' }} />
              <div style={{ height: `${(t.up / maxTraffic) * 50}%`, background: '#a6e3a1', borderRadius: '1px', minHeight: '1px' }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '11px' }}>
          <span><span style={{ color: '#89b4fa' }}>▼</span> 下载: {downloadSpeed} MB/s</span>
          <span><span style={{ color: '#a6e3a1' }}>▲</span> 上传: {uploadSpeed} MB/s</span>
        </div>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>网络统计</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ background: '#313244', borderRadius: '6px', padding: '10px' }}>
            <div style={{ fontSize: '11px', color: '#a6adc8' }}>总下载量</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#89b4fa' }}>{totalDown.toFixed(1)} MB</div>
          </div>
          <div style={{ background: '#313244', borderRadius: '6px', padding: '10px' }}>
            <div style={{ fontSize: '11px', color: '#a6adc8' }}>总上传量</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#a6e3a1' }}>{totalUp.toFixed(1)} MB</div>
          </div>
          <div style={{ background: '#313244', borderRadius: '6px', padding: '10px' }}>
            <div style={{ fontSize: '11px', color: '#a6adc8' }}>活跃连接数</div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>{Math.floor(Math.random() * 20 + 5)}</div>
          </div>
          <div style={{ background: '#313244', borderRadius: '6px', padding: '10px' }}>
            <div style={{ fontSize: '11px', color: '#a6adc8' }}>数据包丢失率</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#a6e3a1' }}>0.1%</div>
          </div>
        </div>
      </div>
    </div>
  )
}