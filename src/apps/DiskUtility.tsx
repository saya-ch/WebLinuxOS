import { useState } from 'react'

interface DiskInfo {
  name: string
  device: string
  size: string
  type: string
  mountPoint: string
  used: string
  available: string
  health: 'good' | 'warning' | 'bad'
  smartTemp: number
  smartPowerOn: string
  partitions: { name: string; size: string; type: string; flags: string }[]
}

const disks: DiskInfo[] = [
  {
    name: '主系统盘', device: '/dev/sda', size: '256 GB', type: 'SSD', mountPoint: '/',
    used: '156 GB', available: '100 GB', health: 'good', smartTemp: 42, smartPowerOn: '1,234 小时',
    partitions: [
      { name: '/dev/sda1', size: '512 MB', type: 'EFI System', flags: 'boot, esp' },
      { name: '/dev/sda2', size: '255.5 GB', type: 'Linux filesystem', flags: '' },
    ],
  },
  {
    name: '数据盘', device: '/dev/sdb', size: '1 TB', type: 'HDD', mountPoint: '/mnt/data',
    used: '650 GB', available: '350 GB', health: 'warning', smartTemp: 55, smartPowerOn: '8,760 小时',
    partitions: [
      { name: '/dev/sdb1', size: '1 TB', type: 'Linux filesystem', flags: '' },
    ],
  },
  {
    name: '外置备份盘', device: '/dev/sdc', size: '2 TB', type: 'HDD (USB)', mountPoint: '/mnt/backup',
    used: '1.2 TB', available: '800 GB', health: 'good', smartTemp: 38, smartPowerOn: '2,500 小时',
    partitions: [
      { name: '/dev/sdc1', size: '2 TB', type: 'NTFS', flags: '' },
    ],
  },
]

export default function DiskUtility() {
  const [selectedDisk, setSelectedDisk] = useState<DiskInfo>(disks[0])
  const [showFormat, setShowFormat] = useState(false)

  return (
    <div style={{ display: 'flex', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ width: '220px', borderRight: '1px solid #313244', padding: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#a6adc8' }}>磁盘列表</div>
        {disks.map((disk) => (
          <div
            key={disk.device}
            onClick={() => { setSelectedDisk(disk); setShowFormat(false) }}
            style={{
              padding: '10px 12px', cursor: 'pointer', borderRadius: '6px', marginBottom: '4px',
              background: selectedDisk.device === disk.device ? '#313244' : 'transparent',
              fontSize: '12px',
            }}
          >
            <div style={{ fontWeight: 600 }}>{disk.name}</div>
            <div style={{ color: '#a6adc8' }}>{disk.device} - {disk.size}</div>
            <div style={{ color: disk.health === 'good' ? '#a6e3a1' : disk.health === 'warning' ? '#f9e2af' : '#f38ba8' }}>
              {disk.health === 'good' ? '● 良好' : disk.health === 'warning' ? '● 注意' : '● 警告'}
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
          {selectedDisk.name} ({selectedDisk.device})
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: '设备路径', value: selectedDisk.device },
            { label: '类型', value: selectedDisk.type },
            { label: '总容量', value: selectedDisk.size },
            { label: '挂载点', value: selectedDisk.mountPoint },
            { label: '已使用', value: selectedDisk.used },
            { label: '可用', value: selectedDisk.available },
          ].map((item) => (
            <div key={item.label} style={{ background: '#313244', borderRadius: '6px', padding: '8px 12px' }}>
              <div style={{ fontSize: '11px', color: '#a6adc8' }}>{item.label}</div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px' }}>分区信息</div>
        <div style={{ background: '#313244', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ display: 'flex', padding: '8px 12px', fontSize: '11px', color: '#a6adc8', borderBottom: '1px solid #45475a' }}>
            <span style={{ width: '140px' }}>分区</span>
            <span style={{ width: '100px' }}>大小</span>
            <span style={{ width: '160px' }}>类型</span>
            <span>标志</span>
          </div>
          {selectedDisk.partitions.map((part) => (
            <div key={part.name} style={{ display: 'flex', padding: '8px 12px', fontSize: '12px', borderBottom: '1px solid #45475a' }}>
              <span style={{ width: '140px', color: '#89b4fa' }}>{part.name}</span>
              <span style={{ width: '100px' }}>{part.size}</span>
              <span style={{ width: '160px', color: '#a6adc8' }}>{part.type}</span>
              <span style={{ color: '#a6adc8' }}>{part.flags || '-'}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px' }}>SMART 状态</div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <div style={{ flex: 1, background: '#313244', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#a6adc8' }}>健康状态</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: selectedDisk.health === 'good' ? '#a6e3a1' : '#f9e2af' }}>
              {selectedDisk.health === 'good' ? '良好' : '注意'}
            </div>
          </div>
          <div style={{ flex: 1, background: '#313244', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#a6adc8' }}>温度</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: selectedDisk.smartTemp > 50 ? '#f38ba8' : '#a6e3a1' }}>
              {selectedDisk.smartTemp}°C
            </div>
          </div>
          <div style={{ flex: 1, background: '#313244', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#a6adc8' }}>通电时间</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{selectedDisk.smartPowerOn}</div>
          </div>
        </div>

        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px' }}>操作</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowFormat(!showFormat)}
            style={{
              padding: '8px 16px', background: '#45475a', color: '#cdd6f4', border: 'none',
              borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
            }}
          >
            格式化
          </button>
          <button style={{ padding: '8px 16px', background: '#313244', color: '#cdd6f4', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
            检查文件系统
          </button>
          <button style={{ padding: '8px 16px', background: '#313244', color: '#cdd6f4', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
            SMART 测试
          </button>
        </div>

        {showFormat && (
          <div style={{ marginTop: '12px', background: '#313244', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>格式化选项</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              {['ext4', 'NTFS', 'FAT32', 'exFAT', 'btrfs'].map((fs) => (
                <button key={fs} style={{
                  padding: '6px 12px', background: '#45475a', color: '#cdd6f4',
                  border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
                }}>
                  {fs}
                </button>
              ))}
            </div>
            <button style={{
              padding: '8px 20px', background: '#f38ba8', color: '#1e1e2e',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            }}>
              确认格式化
            </button>
          </div>
        )}
      </div>
    </div>
  )
}