import { useState, useRef, useCallback, useEffect } from 'react'
import { useStore } from '../store'
import type { FileNode } from '../types'

interface ArchiveContent {
  name: string
  size: number
  type: 'file' | 'folder'
}

interface ArchiveFile {
  name: string
  type: string
  originalSize: number
  compressedSize: number
  files: number
  path: string
  contents: ArchiveContent[]
  sourceIds: string[]
}

const supportedFormats = ['zip', 'tar.gz', 'tar.bz2', 'tar.xz', '7z', 'rar']

function getTypeIcon(type: string): string {
  if (type === 'zip') return '📦'
  if (type.includes('tar')) return '🗜️'
  if (type === '7z') return '📚'
  if (type === 'rar') return '📁'
  return '📄'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function computeCompressionRatio(original: number, compressed: number): number {
  if (original === 0) return 0
  return Math.round((1 - compressed / original) * 100)
}

function flattenTree(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = []
  for (const n of nodes) {
    result.push(n)
    if (n.children) result.push(...flattenTree(n.children))
  }
  return result
}

function FileSelector({ files, selectedIds, onToggle, onConfirm, onCancel, archiveName, onNameChange }: {
  files: FileNode[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onConfirm: () => void
  onCancel: () => void
  archiveName: string
  onNameChange: (name: string) => void
}) {
  const allNodes = flattenTree(files)

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#1e1e2e', borderRadius: '12px', padding: '20px', width: '400px', maxHeight: '80%', display: 'flex', flexDirection: 'column', border: '1px solid #313244' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>选择文件创建归档</div>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#a6adc8', marginBottom: '4px' }}>归档名称</div>
          <input
            value={archiveName}
            onChange={(e) => onNameChange(e.target.value)}
            style={{
              width: '100%', padding: '6px 10px', background: '#11111b',
              border: '1px solid #45475a', borderRadius: '6px', color: '#cdd6f4', fontSize: '12px', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', background: '#11111b', borderRadius: '8px', padding: '8px', marginBottom: '12px' }}>
          {allNodes.map((node) => (
            <div
              key={node.id}
              onClick={() => onToggle(node.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px',
                borderRadius: '4px', cursor: 'pointer', fontSize: '12px',
                background: selectedIds.has(node.id) ? '#313244' : 'transparent',
              }}
            >
              <input type="checkbox" checked={selectedIds.has(node.id)} readOnly style={{ accentColor: '#89b4fa' }} />
              <span>{node.type === 'folder' ? '📁' : '📄'}</span>
              <span style={{ flex: 1 }}>{node.name}</span>
              <span style={{ color: '#6c7086', fontSize: '10px' }}>{node.type === 'folder' ? '目录' : '文件'}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#a6adc8' }}>已选择 {selectedIds.size} 项</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onCancel} style={{ padding: '8px 16px', background: '#313244', color: '#cdd6f4', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
              取消
            </button>
            <button
              onClick={onConfirm}
              disabled={selectedIds.size === 0}
              style={{
                padding: '8px 16px', background: selectedIds.size > 0 ? '#a6e3a1' : '#45475a',
                color: '#1e1e2e', border: 'none', borderRadius: '6px',
                cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 600,
              }}
            >
              创建归档
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ArchiveManager() {
  const files = useStore((s) => s.files)
  const addFile = useStore((s) => s.addFile)
  const [archives, setArchives] = useState<ArchiveFile[]>([
    {
      name: 'project-source.zip', type: 'zip', originalSize: 26500000, compressedSize: 13400000,
      files: 342, path: '/home/user/下载/project-source.zip',
      contents: [
        { name: 'src/', size: 0, type: 'folder' },
        { name: 'src/index.ts', size: 2300, type: 'file' },
        { name: 'src/utils.ts', size: 5100, type: 'file' },
        { name: 'src/main.ts', size: 12800, type: 'file' },
        { name: 'package.json', size: 1200, type: 'file' },
        { name: 'README.md', size: 500, type: 'file' },
        { name: 'tsconfig.json', size: 3400, type: 'file' },
        { name: 'data.csv', size: 15200, type: 'file' },
      ],
      sourceIds: [],
    },
    {
      name: 'backup-2024.tar.gz', type: 'tar.gz', originalSize: 163800000, compressedSize: 93800000,
      files: 1205, path: '/home/user/backup-2024.tar.gz',
      contents: [
        { name: 'home/', size: 0, type: 'folder' },
        { name: 'home/user/', size: 0, type: 'folder' },
        { name: 'home/user/docs/', size: 0, type: 'folder' },
        { name: 'home/user/docs/report.pdf', size: 4500000, type: 'file' },
        { name: 'home/user/docs/data.xlsx', size: 2300000, type: 'file' },
        { name: 'home/user/config/', size: 0, type: 'folder' },
        { name: 'home/user/config/settings.json', size: 8900, type: 'file' },
      ],
      sourceIds: [],
    },
  ])
  const [selected, setSelected] = useState<ArchiveFile | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [extractProgress, setExtractProgress] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [createProgress, setCreateProgress] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [archiveName, setArchiveName] = useState('archive.zip')
  const createTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const extractTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (createTimerRef.current) clearInterval(createTimerRef.current)
      if (extractTimerRef.current) clearInterval(extractTimerRef.current)
    }
  }, [])

  const handleExtract = useCallback(() => {
    if (!selected) return
    setExtracting(true)
    setExtractProgress(0)
    if (extractTimerRef.current) clearInterval(extractTimerRef.current)
    extractTimerRef.current = setInterval(() => {
      setExtractProgress((prev) => {
        if (prev >= 100) {
          if (extractTimerRef.current) clearInterval(extractTimerRef.current)
          setExtracting(false)
          const downloadFolderId = 'downloads'
          for (const content of selected.contents.filter((c) => c.type === 'file')) {
            addFile(downloadFolderId, content.name, 'file')
          }
          return 100
        }
        return prev + Math.random() * 6 + 2
      })
    }, 60)
  }, [selected, addFile])

  const handleCreateArchive = useCallback(() => {
    if (selectedFileIds.size === 0) return
    setCreating(true)
    setCreateProgress(0)
    if (createTimerRef.current) clearInterval(createTimerRef.current)
    createTimerRef.current = setInterval(() => {
      setCreateProgress((prev) => {
        if (prev >= 100) {
          if (createTimerRef.current) clearInterval(createTimerRef.current)
          setCreating(false)
          setShowCreateModal(false)
          const allNodes = flattenTree(files)
          const selectedNodes = allNodes.filter((n) => selectedFileIds.has(n.id))
          const contents: ArchiveContent[] = selectedNodes.map((n) => ({
            name: n.name,
            size: n.type === 'file' && n.content ? new Blob([n.content]).size : 0,
            type: n.type,
          }))
          const originalSize = contents.reduce((s, c) => s + c.size, 0)
          const compressionRatio = 0.4 + Math.random() * 0.3
          const compressedSize = Math.round(originalSize * compressionRatio)
          const newArchive: ArchiveFile = {
            name: archiveName || 'archive.zip',
            type: archiveName.endsWith('.tar.gz') ? 'tar.gz' : archiveName.endsWith('.7z') ? '7z' : 'zip',
            originalSize,
            compressedSize,
            files: contents.filter((c) => c.type === 'file').length,
            path: `/home/user/下载/${archiveName || 'archive.zip'}`,
            contents,
            sourceIds: Array.from(selectedFileIds),
          }
          setArchives((prev) => [...prev, newArchive])
          setSelectedFileIds(new Set())
          setSelected(newArchive)
          return 100
        }
        return prev + Math.random() * 5 + 2
      })
    }, 60)
  }, [selectedFileIds, files, archiveName])

  const toggleFileSelection = (id: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      const contents: ArchiveContent[] = Array.from(droppedFiles).map((f) => ({
        name: f.name,
        size: f.size,
        type: 'file' as const,
      }))
      const originalSize = contents.reduce((s, c) => s + c.size, 0)
      const compressionRatio = 0.4 + Math.random() * 0.3
      const compressedSize = Math.round(originalSize * compressionRatio)
      const archiveNameFromDrop = `${droppedFiles[0].name.split('.')[0] || 'archive'}.zip`
      const newArchive: ArchiveFile = {
        name: archiveNameFromDrop,
        type: 'zip',
        originalSize,
        compressedSize,
        files: contents.length,
        path: `/home/user/下载/${archiveNameFromDrop}`,
        contents,
        sourceIds: [],
      }
      setArchives((prev) => [...prev, newArchive])
      setSelected(newArchive)
    }
  }

  return (
    <div
      style={{ display: 'flex', height: '100%', background: '#1e1e2e', color: '#cdd6f4', position: 'relative' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(137, 180, 250, 0.1)',
          border: '2px dashed #89b4fa', borderRadius: '8px', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 40,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>📦</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#89b4fa' }}>拖放文件到此处创建归档</div>
          </div>
        </div>
      )}

      <div style={{ width: '240px', borderRight: '1px solid #313244', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #313244' }}>
          <button
            onClick={() => { setShowCreateModal(true); setArchiveName('archive.zip'); }}
            style={{
              width: '100%', padding: '8px', background: '#89b4fa', color: '#1e1e2e',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            }}
          >
            + 创建归档
          </button>
        </div>
        <div style={{ fontSize: '13px', fontWeight: 600, padding: '8px 12px', color: '#a6adc8' }}>归档文件</div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px' }}>
          {archives.map((archive) => (
            <div
              key={archive.name}
              onClick={() => { setSelected(archive); setShowPreview(false); }}
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
                {formatSize(archive.compressedSize)} · {archive.type}
              </div>
              <div style={{ color: '#6c7086', fontSize: '10px', marginTop: '1px' }}>
                压缩率 {computeCompressionRatio(archive.originalSize, archive.compressedSize)}%
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 12px', borderTop: '1px solid #313244', fontSize: '10px', color: '#6c7086' }}>
          支持格式: {supportedFormats.join(', ')}
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        {selected ? (
          <>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              {getTypeIcon(selected.type)} {selected.name}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: '原始大小', value: formatSize(selected.originalSize), color: '#89b4fa' },
                { label: '压缩后', value: formatSize(selected.compressedSize), color: '#a6e3a1' },
                { label: '压缩率', value: `${computeCompressionRatio(selected.originalSize, selected.compressedSize)}%`, color: '#f9e2af' },
                { label: '文件数', value: String(selected.files), color: '#cba6f7' },
                { label: '格式', value: selected.type, color: '#f5c2e7' },
                { label: '路径', value: selected.path, color: '#94e2d5' },
              ].map((item) => (
                <div key={item.label} style={{ background: '#313244', borderRadius: '6px', padding: '8px 12px' }}>
                  <div style={{ fontSize: '11px', color: '#a6adc8' }}>{item.label}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: item.color, wordBreak: 'break-all' }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#313244', borderRadius: '6px', padding: '8px 12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#a6adc8', marginBottom: '4px' }}>压缩对比</div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <div style={{ flex: selected.originalSize, background: '#89b4fa', borderRadius: '3px', height: '12px', position: 'relative' }}>
                  <span style={{ position: 'absolute', right: '4px', top: '-1px', fontSize: '9px', fontWeight: 600, color: '#1e1e2e', lineHeight: '14px' }}>
                    {formatSize(selected.originalSize)}
                  </span>
                </div>
                <div style={{ flex: selected.compressedSize, background: '#a6e3a1', borderRadius: '3px', height: '12px', position: 'relative' }}>
                  <span style={{ position: 'absolute', right: '4px', top: '-1px', fontSize: '9px', fontWeight: 600, color: '#1e1e2e', lineHeight: '14px' }}>
                    {formatSize(selected.compressedSize)}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={handleExtract}
                disabled={extracting}
                style={{
                  padding: '10px 20px', background: extracting ? '#45475a' : '#a6e3a1', color: '#1e1e2e',
                  border: 'none', borderRadius: '6px', cursor: extracting ? 'not-allowed' : 'pointer',
                  fontSize: '13px', fontWeight: 600,
                }}
              >
                {extracting ? `解压中 ${Math.min(100, Math.round(extractProgress))}%` : '解压到下载'}
              </button>
              <button
                onClick={() => setShowPreview(!showPreview)}
                style={{
                  padding: '10px 20px', background: showPreview ? '#89b4fa' : '#313244',
                  color: showPreview ? '#1e1e2e' : '#cdd6f4',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
                }}
              >
                {showPreview ? '隐藏预览' : '预览内容'}
              </button>
            </div>

            {extracting && (
              <div style={{ background: '#313244', borderRadius: '6px', height: '8px', marginBottom: '16px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, extractProgress)}%`, height: '100%',
                  background: 'linear-gradient(90deg, #a6e3a1, #89b4fa)',
                  transition: 'width 0.1s',
                }} />
              </div>
            )}

            {showPreview && (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>归档内容预览</div>
                <div style={{ background: '#313244', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#a6adc8', maxHeight: '200px', overflowY: 'auto' }}>
                  {selected.contents.map((content, i) => (
                    <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #45475a', display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        {content.type === 'folder' ? '📁' : '📄'} {content.name}
                      </span>
                      <span style={{ color: '#6c7086' }}>
                        {content.type === 'folder' ? '目录' : formatSize(content.size)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6c7086' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗜️</div>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>选择一个归档文件查看详情</div>
              <div style={{ fontSize: '11px', marginBottom: '16px' }}>支持的格式: {supportedFormats.join(', ')}</div>
              <div style={{ fontSize: '11px', color: '#89b4fa' }}>拖拽文件到此处创建归档</div>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <FileSelector
          files={files}
          selectedIds={selectedFileIds}
          onToggle={toggleFileSelection}
          onCancel={() => { setShowCreateModal(false); setSelectedFileIds(new Set()); }}
          onConfirm={handleCreateArchive}
          archiveName={archiveName}
          onNameChange={setArchiveName}
        />
      )}

      {creating && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60,
        }}>
          <div style={{ background: '#1e1e2e', borderRadius: '12px', padding: '24px', width: '320px', border: '1px solid #313244' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>正在创建归档...</div>
            <div style={{ background: '#313244', borderRadius: '6px', height: '12px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{
                width: `${Math.min(100, createProgress)}%`, height: '100%',
                background: 'linear-gradient(90deg, #89b4fa, #a6e3a1)',
                transition: 'width 0.1s',
              }} />
            </div>
            <div style={{ fontSize: '12px', color: '#a6adc8', textAlign: 'center' }}>
              {Math.min(100, Math.round(createProgress))}%
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
