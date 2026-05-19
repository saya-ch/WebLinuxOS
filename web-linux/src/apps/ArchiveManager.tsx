import { useState } from 'react'

interface ArchiveFile {
  name: string
  type: string
  size: string
  compressed: string
  files: number
  path: string
}

const archives: ArchiveFile[] = [
  { name: 'project-source.zip', type: 'zip', size: '25.3 MB', compressed: '12.8 MB', files: 342, path: '/home/user/下载/project-source.zip' },
  { name: 'backup-2024.tar.gz', type: 'tar.gz', size: '156.2 MB', compressed: '89.5 MB', files: 1205, path: '/home/user/backup-2024.tar.gz' },
  { name: 'photos.7z', type: '7z', size: '512.0 MB', compressed: '256.3 MB', files: 450, path: '/home/user/图片/photos.7z' },
  { name: 'documents.rar', type: 'rar', size: '8.7 MB', compressed: '5.2 MB', files: 56, path: '/home/user/文档/documents.rar' },
  { name: 'logs.tar.gz', type: 'tar.gz', size: '45.0 MB', compressed: '18.2 MB', files: 89, path: '/var/log/archives/logs.tar.gz' },
  { name: 'music-collection.zip', type: 'zip', size: '780.0 MB', compressed: '650.0 MB', files: 210, path: '/home/user/音乐/music-collection.zip' },
]

const supportedFormats = ['zip', 'tar.gz', 'tar.bz2', 'tar.xz', '7z', 'rar']

function getTypeIcon(type: string): string {
  if (type === 'zip') return '📦'
  if (type.includes('tar')) return '🗜️'
  if (type === '7z') return '📚'
  if (type === 'rar') return '📁'
  return '📄'
}

export default function ArchiveManager() {
  const [selected, setSelected] = useState<ArchiveFile | null>(null)
  const [extracting, setExtracting] = useState(false)

  const handleExtract = () => {
    setExtracting(true)
    setTimeout(() => setExtracting(false), 1500)
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ width: '240px', borderRight: '1px solid #313244', padding: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#a6adc8' }}>归档文件</div>
        {archives.map((archive) => (
          <div
            key={archive.name}
            onClick={() => setSelected(archive)}
            style={{
              padding: '10px 12px', cursor: 'pointer', borderRadius: '6px', marginBottom: '4px',
              background: selected?.name === archive.name ? '#313244' : 'transparent',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{getTypeIcon(archive.type)}</span>
              <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {archive.name}
              </span>
            </div>
            <div style={{ color: '#a6adc8', fontSize: '11px', marginTop: '2px' }}>
              {archive.size} · {archive.type}
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, padding: '16px' }}>
        {selected ? (
          <>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              {getTypeIcon(selected.type)} {selected.name}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: '原始大小', value: selected.size },
                { label: '压缩后', value: selected.compressed },
                { label: '文件数', value: String(selected.files) },
                { label: '格式', value: selected.type },
                { label: '路径', value: selected.path },
                { label: '压缩率', value: `${Math.round((1 - parseFloat(selected.compressed) / parseFloat(selected.size)) * 100)}%` },
              ].map((item) => (
                <div key={item.label} style={{ background: '#313244', borderRadius: '6px', padding: '8px 12px' }}>
                  <div style={{ fontSize: '11px', color: '#a6adc8' }}>{item.label}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, wordBreak: 'break-all' }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={() => handleExtract()}
                disabled={extracting}
                style={{
                  padding: '10px 20px', background: extracting ? '#45475a' : '#a6e3a1', color: '#1e1e2e',
                  border: 'none', borderRadius: '6px', cursor: extracting ? 'not-allowed' : 'pointer',
                  fontSize: '13px', fontWeight: 600,
                }}
              >
                {extracting ? '解压中...' : '解压'}
              </button>
              <button style={{
                padding: '10px 20px', background: '#313244', color: '#cdd6f4',
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
              }}>
                预览内容
              </button>
            </div>

            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>文件预览</div>
            <div style={{ background: '#313244', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#a6adc8', maxHeight: '150px', overflowY: 'auto' }}>
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #45475a' }}>
                  {selected.type.includes('tar') ? '📄' : '📄'} {['index.html', 'style.css', 'main.js', 'package.json', 'README.md', 'config.json', 'utils.py', 'data.csv'][i]}
                  <span style={{ float: 'right', color: '#6c7086' }}>
                    {['2.3 KB', '5.1 KB', '12.8 KB', '1.2 KB', '0.5 KB', '3.4 KB', '8.9 KB', '15.2 KB'][i]}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6c7086' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗜️</div>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>选择一个归档文件查看详情</div>
              <div style={{ fontSize: '11px' }}>支持的格式: {supportedFormats.join(', ')}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}