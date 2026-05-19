import { useState } from 'react'

interface WiFiNetwork {
  id: string
  ssid: string
  signal: number
  security: string
  saved: boolean
  connected: boolean
}

const mockNetworks: WiFiNetwork[] = [
  { id: '1', ssid: 'Home-Network-5G', signal: 5, security: 'WPA3', saved: true, connected: true },
  { id: '2', ssid: 'Home-Network-2.4G', signal: 3, security: 'WPA2', saved: true, connected: false },
  { id: '3', ssid: 'Office-WiFi', signal: 2, security: 'WPA2-Enterprise', saved: true, connected: false },
  { id: '4', ssid: 'Coffee-Shop', signal: 1, security: 'WPA2', saved: false, connected: false },
  { id: '5', ssid: 'Neighbor-Net', signal: 2, security: 'WPA2', saved: false, connected: false },
  { id: '6', ssid: 'Public-Library', signal: 1, security: 'None', saved: false, connected: false },
  { id: '7', ssid: 'Guest-Network', signal: 4, security: 'WPA2', saved: false, connected: false },
  { id: '8', ssid: 'IoT-Devices', signal: 3, security: 'WPA3', saved: true, connected: false },
]

const networkInfo = {
  ipv4: '192.168.1.100',
  ipv6: 'fe80::1a2b:3c4d:5e6f:7890',
  gateway: '192.168.1.1',
  dns: '8.8.8.8, 1.1.1.1',
  subnet: '255.255.255.0',
  mac: 'AA:BB:CC:DD:EE:FF',
}

export default function WiFiManager() {
  const [wifiOn, setWifiOn] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [networks, setNetworks] = useState(mockNetworks)
  const [showDetail, setShowDetail] = useState(false)
  const [, setSelectedNetwork] = useState<WiFiNetwork | null>(null)

  const toggleWiFi = () => {
    setWifiOn(!wifiOn)
    if (wifiOn) {
      setNetworks((prev) => prev.map((n) => ({ ...n, connected: false })))
    }
  }

  const toggleScan = () => {
    setScanning(true)
    setTimeout(() => setScanning(false), 2500)
  }

  const connectToNetwork = (id: string) => {
    setNetworks((prev) =>
      prev.map((n) => ({ ...n, connected: n.id === id, saved: n.id === id ? true : n.saved }))
    )
  }

  const signalIcon = (level: number) => {
    const bars = ['▁', '▂', '▃', '▄', '▅']
    return bars[level - 1] || '▁'
  }

  const signalColor = (level: number) => {
    if (level >= 4) return '#a6e3a1'
    if (level >= 2) return '#f9e2af'
    return '#f38ba8'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #313244', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Wi-Fi</span>
          <button
            onClick={toggleWiFi}
            style={{
              width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer',
              background: wifiOn ? '#89b4fa' : '#45475a', position: 'relative',
            }}
          >
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
              position: 'absolute', top: '3px', left: wifiOn ? '25px' : '3px', transition: 'left 0.2s',
            }} />
          </button>
          <span style={{ fontSize: '12px', color: wifiOn ? '#a6e3a1' : '#f38ba8' }}>
            {wifiOn ? '已开启' : '已关闭'}
          </span>
        </div>
        <button
          onClick={toggleScan}
          disabled={!wifiOn || scanning}
          style={{
            padding: '6px 12px', background: scanning ? '#45475a' : '#313244', color: '#cdd6f4',
            border: '1px solid #45475a', borderRadius: '6px', cursor: scanning ? 'not-allowed' : 'pointer',
            fontSize: '12px',
          }}
        >
          {scanning ? '扫描中...' : '扫描'}
        </button>
        <button
          onClick={() => setShowDetail(!showDetail)}
          style={{
            padding: '6px 12px', background: '#313244', color: '#cdd6f4',
            border: '1px solid #45475a', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
          }}
        >
          网络详情
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {networks
          .sort((a, b) => {
            if (a.connected) return -1
            if (b.connected) return 1
            return b.signal - a.signal
          })
          .map((network) => (
            <div
              key={network.id}
              onClick={() => { setSelectedNetwork(network); setShowDetail(false) }}
              style={{
                display: 'flex', alignItems: 'center', padding: '12px', cursor: 'pointer',
                borderRadius: '8px', marginBottom: '4px',
                background: network.connected ? '#313244' : 'transparent',
                border: network.connected ? '1px solid #89b4fa' : '1px solid transparent',
                gap: '10px', fontSize: '12px',
              }}
            >
              <span style={{ color: signalColor(network.signal), fontSize: '18px' }}>
                {network.connected ? '📶' : ''}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{network.ssid}</div>
                <div style={{ fontSize: '11px', color: '#a6adc8' }}>
                  {network.security} {network.saved ? '· 已保存' : ''}
                </div>
              </div>
              <span style={{ color: signalColor(network.signal), fontSize: '14px', fontWeight: 700 }}>
                {signalIcon(network.signal)}
              </span>
              {network.connected ? (
                <button
                  onClick={(e) => { e.stopPropagation(); connectToNetwork(network.id) }}
                  style={{
                    padding: '4px 10px', background: '#f38ba8', color: '#1e1e2e',
                    border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
                  }}
                >
                  断开
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); connectToNetwork(network.id) }}
                  style={{
                    padding: '4px 10px', background: '#a6e3a1', color: '#1e1e2e',
                    border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
                  }}
                >
                  连接
                </button>
              )}
            </div>
          ))}
      </div>

      {showDetail && (
        <div style={{ borderTop: '1px solid #313244', padding: '12px 16px', fontSize: '12px' }}>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>网络详情</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {Object.entries(networkInfo).map(([key, value]) => (
              <div key={key}>
                <span style={{ color: '#6c7086' }}>{key.toUpperCase()}: </span>
                <span style={{ color: '#89b4fa' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}