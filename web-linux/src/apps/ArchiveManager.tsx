import { useState, useCallback } from 'react'
import { useStore } from '../store'
import type { FileNode } from '../types'

interface ArchiveFileData {
  id: string
  name: string
  type: 'file' | 'folder'
  content: string | undefined
}

interface Archive {
  id: string
  name: string
  size: string
  compressedSize: string
  ratio: string
  date: string
  files: ArchiveFileData[]
  fileCount: number
}

function flattenFiles(nodes: FileNode[], prefix = ''): { id: string; name: string; path: string; type: string; size: number }[] {
  const result: { id: string; name: string; path: string; type: string; size: number }[] = []
  for (const node of nodes) {
    const path = prefix ? `${prefix}/${node.name}` : node.name
    if (node.type === 'file') {
      result.push({ id: node.id, name: node.name, path, type: 'file', size: (node.content || '').length })
    }
    if (node.children) {
      result.push({ id: node.id, name: node.name, path, type: 'folder', size: 0 })
      result.push(...flattenFiles(node.children, path))
    }
  }
  return result
}

function findFileById(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findFileById(node.children, id)
      if (found) return found
    }
  }
  return null
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function ArchiveManager() {
  const files = useStore(s => s.files)
  const addFile = useStore(s => s.addFile)

  const [archives, setArchives] = useState<Archive[]>([])
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [archiveName, setArchiveName] = useState('archive')
  const [creating, setCreating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedArchive, setSelectedArchive] = useState<Archive | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [view, setView] = useState<'list' | 'create'>('list')

  const allFiles = flattenFiles(files)

  const toggleFile = (id: string) => {
    setSelectedFiles(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  }

  const createArchive = () => {
    if (selectedFiles.length === 0) return
    setCreating(true)
    setProgress(0)
    const archiveData = selectedFiles.map(id => {
      const file = findFileById(files, id)
      return file ? { id: file.id, name: file.name, type: file.type, content: file.content } : null
    }).filter((x): x is NonNullable<typeof x> => x !== null) as ArchiveFileData[]
    const rawSize = JSON.stringify(archiveData).length
    const compressedSize = Math.floor(rawSize * 0.55)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setCreating(false)
          const archive: Archive = {
            id: Date.now().toString(),
            name: archiveName + '.zip',
            size: formatSize(rawSize),
            compressedSize: formatSize(compressedSize),
            ratio: ((1 - compressedSize / rawSize) * 100).toFixed(1) + '%',
            date: new Date().toLocaleString('zh-CN'),
            files: archiveData,
            fileCount: archiveData.length,
          }
          setArchives(prev => [archive, ...prev])
          setSelectedFiles([])
          setView('list')
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 80)
  }

  const extractArchive = (archive: Archive) => {
    archive.files.forEach(f => {
      if (f.type === 'file') {
        addFile('downloads', f.name, 'file')
      }
    })
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      const baseName = droppedFiles[0].name.replace(/\.[^.]+$/, '') || 'archive'
      setArchiveName(baseName)
      setView('create')
    }
  }, [])

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4', position: 'relative' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(137, 180, 250, 0.1)', border: '2px dashed #89b4fa',
          borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>📦</div>
            <div style={{ fontSize: '14px', color: '#89b4fa', fontWeight: 600 }}>拖拽文件到此处创建归档</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', borderBottom: '1px solid #313244' }}>
        <button
          onClick={() => setView('list')}
          style={{
            flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
            background: view === 'list' ? '#313244' : 'transparent',
            color: view === 'list' ? '#89b4fa' : '#a6adc8',
            fontSize: '12px', fontWeight: view === 'list' ? 600 : 400,
            borderBottom: view === 'list' ? '2px solid #89b4fa' : '2px solid transparent',
          }}
        >
          归档列表
        </button>
        <button
          onClick={() => setView('create')}
          style={{
            flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
            background: view === 'create' ? '#313244' : 'transparent',
            color: view === 'create' ? '#89b4fa' : '#a6adc8',
            fontSize: '12px', fontWeight: view === 'create' ? 600 : 400,
            borderBottom: view === 'create' ? '2px solid #89b4fa' : '2px solid transparent',
          }}
        >
          创建归档
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {view === 'list' ? (
          archives.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6c7086' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗜️</div>
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>暂无归档文件</div>
                <div style={{ fontSize: '11px' }}>点击"创建归档"或拖拽文件来创建</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', height: '100%' }}>
              <div style={{ width: '200px', overflowY: 'auto', borderRight: '1px solid #313244', paddingRight: '8px' }}>
                {archives.map(a => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedArchive(a)}
                    style={{
                      padding: '8px 10px', cursor: 'pointer', borderRadius: '6px', marginBottom: '4px',
                      background: selectedArchive?.id === a.id ? '#313244' : 'transparent',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      📦 {a.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#6c7086', marginTop: '2px' }}>{a.compressedSize} · {a.fileCount} 文件</div>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {selectedArchive ? (
                  <>
                    <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>📦 {selectedArchive.name}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                      {[
                        { label: '原始大小', value: selectedArchive.size },
                        { label: '压缩后', value: selectedArchive.compressedSize },
                        { label: '压缩率', value: selectedArchive.ratio },
                        { label: '文件数', value: String(selectedArchive.fileCount) },
                        { label: '创建时间', value: selectedArchive.date },
                        { label: '格式', value: 'ZIP' },
                      ].map(item => (
                        <div key={item.label} style={{ background: '#313244', borderRadius: '6px', padding: '8px 12px' }}>
                          <div style={{ fontSize: '10px', color: '#a6adc8' }}>{item.label}</div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <button
                        onClick={() => extractArchive(selectedArchive)}
                        style={{
                          padding: '8px 16px', background: '#a6e3a1', color: '#1e1e2e',
                          border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                        }}
                      >
                        解压到下载文件夹
                      </button>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>归档内容</div>
                    <div style={{ background: '#313244', borderRadius: '8px', padding: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                      {selectedArchive.files.map((f, i) => (
                        <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #45475a', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{f.type === 'folder' ? '📁' : '📄'} {f.name}</span>
                          <span style={{ color: '#6c7086' }}>{f.type}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6c7086', fontSize: '13px' }}>
                    选择一个归档查看详情
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          <>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#a6adc8' }}>归档名称</div>
              <input
                value={archiveName}
                onChange={e => setArchiveName(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', background: '#313244', border: '1px solid #45475a',
                  borderRadius: '6px', color: '#cdd6f4', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#a6adc8' }}>
              选择文件 ({selectedFiles.length} 已选)
            </div>
            <div style={{ background: '#313244', borderRadius: '8px', maxHeight: '250px', overflowY: 'auto', marginBottom: '12px' }}>
              {allFiles.map(f => (
                <div
                  key={f.id}
                  onClick={() => toggleFile(f.id)}
                  style={{
                    padding: '8px 12px', cursor: 'pointer', fontSize: '12px',
                    background: selectedFiles.includes(f.id) ? 'rgba(137, 180, 250, 0.15)' : 'transparent',
                    borderBottom: '1px solid #45475a',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}
                >
                  <span style={{
                    width: '16px', height: '16px',
                    border: `2px solid ${selectedFiles.includes(f.id) ? '#89b4fa' : '#6c7086'}`,
                    borderRadius: '3px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', color: '#89b4fa', flexShrink: 0,
                  }}>
                    {selectedFiles.includes(f.id) ? '✓' : ''}
                  </span>
                  <span>{f.type === 'folder' ? '📁' : '📄'}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.path}</span>
                  {f.type === 'file' && <span style={{ color: '#6c7086', fontSize: '10px', flexShrink: 0 }}>{formatSize(f.size)}</span>}
                </div>
              ))}
            </div>
            {creating && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#a6adc8', marginBottom: '4px' }}>压缩中... {Math.min(Math.round(progress), 100)}%</div>
                <div style={{ background: '#313244', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', background: '#89b4fa', borderRadius: '4px', transition: 'width 0.08s' }} />
                </div>
              </div>
            )}
            <button
              onClick={createArchive}
              disabled={creating || selectedFiles.length === 0}
              style={{
                width: '100%', padding: '10px',
                background: creating || selectedFiles.length === 0 ? '#45475a' : '#89b4fa',
                color: creating || selectedFiles.length === 0 ? '#a6adc8' : '#1e1e2e',
                border: 'none', borderRadius: '6px',
                cursor: creating || selectedFiles.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '13px', fontWeight: 600,
              }}
            >
              {creating ? '创建中...' : `创建归档 (${selectedFiles.length} 个文件)`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
