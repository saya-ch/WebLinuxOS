import { useState } from 'react'

interface BluetoothDevice {
  id: string
  name: string
  type: string
  paired: boolean
  connected: boolean
  battery?: number
  signal: number
}

const mockDevices: BluetoothDevice[] = [
  { id: '1', name: 'WH-1000XM5', type: '耳机', paired: true, connected: true, battery: 85, signal: 4 },
  { id: '2', name: 'MX Keys', type: '键盘', paired: true, connected: true, battery: 60, signal: 5 },
  { id: '3', name: 'MX Master 3S', type: '鼠标', paired: true, connected: true, battery: 45, signal: 4 },
  { id: '4', name: 'Galaxy Watch', type: '手表', paired: true, connected: false, battery: 72, signal: 0 },
  { id: '5', name: 'JBL Flip 6', type: '音箱', paired: false, connected: false, signal: 3 },
  { id: '6', name: 'AirPods Pro', type: '耳机', paired: false, connected: false, signal: 2 },
  { id: '7', name: 'Logitech C920', type: '其他', paired: false, connected: false, signal: 1 },
]

export default function BluetoothManager() {
  const [bluetoothOn, setBluetoothOn] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [devices, setDevices] = useState(mockDevices)
  const [selected, setSelected] = useState<BluetoothDevice | null>(null)

  const toggleBluetooth = () => {
    setBluetoothOn(!bluetoothOn)
    if (bluetoothOn) {
      setDevices((prev) => prev.map((d) => ({ ...d, connected: false })))
    }
  }

  const toggleScan = () => {
    setScanning(true)
    setTimeout(() => setScanning(false), 3000)
  }

  const toggleConnect = (id: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, connected: !d.connected, paired: true } : d
      )
    )
  }

  const signalBars = (level: number) => '▁▂▃▄▅▆▇█'.slice(0, level) || '—'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #313244', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>蓝牙</span>
          <button
            onClick={toggleBluetooth}
            style={{
              width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer',
              background: bluetoothOn ? '#89b4fa' : '#45475a', position: 'relative', transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
              position: 'absolute', top: '3px', left: bluetoothOn ? '25px' : '3px', transition: 'left 0.2s',
            }} />
          </button>
          <span style={{ fontSize: '12px', color: bluetoothOn ? '#a6e3a1' : '#f38ba8' }}>
            {bluetoothOn ? '已开启' : '已关闭'}
          </span>
        </div>
        <button
          onClick={toggleScan}
          disabled={!bluetoothOn || scanning}
          style={{
            padding: '6px 12px', background: scanning ? '#45475a' : '#313244', color: '#cdd6f4',
            border: '1px solid #45475a', borderRadius: '6px', cursor: scanning ? 'not-allowed' : 'pointer',
            fontSize: '12px',
          }}
        >
          {scanning ? '扫描中...' : '扫描设备'}
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          <div style={{ fontSize: '12px', color: '#a6adc8', padding: '4px 8px', fontWeight: 600 }}>已配对设备</div>
          {devices.filter((d) => d.paired).map((device) => (
            <div
              key={device.id}
              onClick={() => setSelected(device)}
              style={{
                display: 'flex', alignItems: 'center', padding: '10px 12px', cursor: 'pointer',
                borderRadius: '8px', marginBottom: '4px',
                background: selected?.id === device.id ? '#313244' : 'transparent',
                gap: '10px', fontSize: '12px',
              }}
            >
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: device.connected ? '#a6e3a1' : '#6c7086',
              }} />
              <span style={{ fontWeight: 600, flex: 1 }}>{device.name}</span>
              <span style={{ color: '#a6adc8' }}>{device.type}</span>
              {device.battery && <span style={{ color: '#f9e2af' }}>🔋{device.battery}%</span>}
              <button
                onClick={(e) => { e.stopPropagation(); toggleConnect(device.id) }}
                style={{
                  padding: '4px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
                  background: device.connected ? '#f38ba8' : '#a6e3a1',
                  color: '#1e1e2e',
                }}
              >
                {device.connected ? '断开' : '连接'}
              </button>
            </div>
          ))}

          <div style={{ fontSize: '12px', color: '#a6adc8', padding: '4px 8px', fontWeight: 600, marginTop: '12px' }}>可用设备</div>
          {devices.filter((d) => !d.paired).map((device) => (
            <div
              key={device.id}
              onClick={() => setSelected(device)}
              style={{
                display: 'flex', alignItems: 'center', padding: '10px 12px', cursor: 'pointer',
                borderRadius: '8px', marginBottom: '4px',
                background: selected?.id === device.id ? '#313244' : 'transparent',
                gap: '10px', fontSize: '12px',
              }}
            >
              <span style={{ fontWeight: 600, flex: 1 }}>{device.name}</span>
              <span style={{ color: '#a6adc8' }}>{device.type}</span>
              <span style={{ color: '#89b4fa', fontSize: '10px' }}>{signalBars(device.signal)}</span>
              <button
                onClick={(e) => { e.stopPropagation(); toggleConnect(device.id) }}
                style={{
                  padding: '4px 10px', background: '#89b4fa', color: '#1e1e2e',
                  border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
                }}
              >
                配对
              </button>
            </div>
          ))}
        </div>

        {selected && (
          <div style={{ width: '220px', borderLeft: '1px solid #313244', padding: '12px', fontSize: '12px' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>{selected.name}</div>
            <div style={{ color: '#a6adc8', marginBottom: '12px' }}>{selected.type}</div>
            {[
              { label: '状态', value: selected.connected ? '已连接' : selected.paired ? '已配对' : '未配对' },
              { label: '信号强度', value: signalBars(selected.signal) },
              { label: '电量', value: selected.battery ? `${selected.battery}%` : '—' },
              { label: '地址', value: `XX:XX:XX:${selected.id.padStart(2, '0')}:XX` },
            ].map((item) => (
              <div key={item.label} style={{ marginBottom: '6px' }}>
                <span style={{ color: '#6c7086' }}>{item.label}: </span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}