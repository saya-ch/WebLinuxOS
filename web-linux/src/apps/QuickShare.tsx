import { useState, useRef, useCallback } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { Share2, Copy, Download, Upload, Image, FileText, Check, Link, Sparkles, QrCode, Globe, Smartphone, X } from 'lucide-react'

interface ShareItem {
  id: string
  type: 'text' | 'file' | 'image'
  content: string
  name?: string
  size?: number
  createdAt: number
}

const STORAGE_KEY = 'quickshare-items'

function loadItems(): ShareItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveItems(items: ShareItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50)))
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function generateShareLink(item: ShareItem): string {
  const encoded = btoa(encodeURIComponent(JSON.stringify({
    t: item.type,
    c: item.content.slice(0, 1000),
    n: item.name,
    s: item.size,
  })))
  return `${window.location.origin}${window.location.pathname}?share=${encoded}`
}

export default function QuickShare() {
  const [items, setItems] = useState<ShareItem[]>(() => loadItems())
  const [text, setText] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [shareMode, setShareMode] = useState<'local' | 'link' | 'qr'>('local')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addItem = useCallback((item: Omit<ShareItem, 'id' | 'createdAt'>) => {
    const newItem: ShareItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: Date.now(),
    }
    const updated = [newItem, ...items]
    setItems(updated)
    saveItems(updated)
    return newItem
  }, [items])

  const handleTextSubmit = () => {
    if (!text.trim()) return
    addItem({
      type: 'text',
      content: text.trim(),
      name: 'Text Note',
    })
    setText('')
  }

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.size > 1024 * 1024) {
      alert('文件大小不能超过 1MB（受浏览器 localStorage 限制）')
      return
    }
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result as string
      const isImage = file.type.startsWith('image/')
      addItem({
        type: isImage ? 'image' : 'file',
        content,
        name: file.name,
        size: file.size,
      })
    }
    reader.readAsDataURL(file)
  }, [addItem])

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    files.forEach(handleFileUpload)
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(handleFileUpload)
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {}
  }

  const downloadItem = (item: ShareItem) => {
    if (item.type === 'text') {
      const blob = new Blob([item.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${item.name || 'note'}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const a = document.createElement('a')
      a.href = item.content
      a.download = item.name || 'file'
      a.click()
    }
  }

  const deleteItem = (id: string) => {
    const updated = items.filter(i => i.id !== id)
    setItems(updated)
    saveItems(updated)
  }

  const clearAll = () => {
    if (confirm('确定要清除所有分享记录吗？')) {
      setItems([])
      saveItems([])
    }
  }

  const shareViaNative = async (item: ShareItem) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.name || 'Shared from WebLinuxOS',
          text: item.type === 'text' ? item.content : `Check out this file: ${item.name}`,
          url: window.location.href,
        })
      } catch {}
    } else {
      copyToClipboard(item.content, item.id)
    }
  }

  const generateQRCode = (text: string) => {
    const encoded = encodeURIComponent(text)
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#fff',
      padding: 24,
      overflow: 'auto',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Share2 size={24} />
          QuickShare 快速分享
        </h1>
        <p style={{ opacity: 0.6, fontSize: 13, marginTop: 4 }}>
          文本、文件、图片 - 快速分享与保存
        </p>
      </div>

      {/* Share Mode Tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
      }}>
        {[
          { id: 'local', label: '本地存储', icon: Share2 },
          { id: 'link', label: '分享链接', icon: Link },
          { id: 'qr', label: '二维码', icon: QrCode },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setShareMode(id as 'local' | 'link' | 'qr')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              background: shareMode === id ? '#3b82f6' : 'transparent',
              color: shareMode === id ? '#fff' : 'rgba(255,255,255,0.7)',
              transition: 'all 0.2s',
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Input Section */}
      <div style={{ marginBottom: 20 }}>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: dragOver ? '2px dashed #3b82f6' : '2px dashed rgba(255,255,255,0.2)',
            borderRadius: 16,
            padding: 24,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: dragOver ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)',
            marginBottom: 16,
          }}
        >
          <Upload size={32} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
          <p style={{ margin: 0, fontSize: 14 }}>拖拽文件到这里，或点击选择</p>
          <p style={{ opacity: 0.5, fontSize: 12, marginTop: 4 }}>支持图片、文档等（最大 1MB）</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 16,
        }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入要分享的文本内容..."
            style={{
              width: '100%',
              minHeight: 80,
              background: 'transparent',
              border: 'none',
              borderRadius: 8,
              padding: 12,
              color: '#fff',
              fontSize: 14,
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleTextSubmit}
            disabled={!text.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: text.trim() ? 'pointer' : 'not-allowed',
              fontSize: 13,
              fontWeight: 500,
              background: text.trim() ? '#3b82f6' : 'rgba(255,255,255,0.1)',
              color: text.trim() ? '#fff' : 'rgba(255,255,255,0.5)',
              marginLeft: 'auto',
            }}
          >
            <Sparkles size={14} />
            添加到分享
          </button>
        </div>
      </div>

      {/* Items List */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            分享记录 ({items.length})
          </h3>
          {items.length > 0 && (
            <button
              onClick={clearAll}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                background: 'rgba(239,68,68,0.2)',
                color: '#ef4444',
              }}
            >
              清空全部
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 40,
            opacity: 0.5,
          }}>
            <Globe size={40} style={{ margin: '0 auto 8px' }} />
            <p>还没有分享内容</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: 16,
                  position: 'relative',
                }}
              >
                <button
                  onClick={() => deleteItem(item.id)}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={14} />
                </button>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {item.type === 'image' && item.content.startsWith('data:') ? (
                    <img
                      src={item.content}
                      alt={item.name}
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: 'cover',
                        borderRadius: 8,
                      }}
                    />
                  ) : item.type === 'image' ? (
                    <Image size={40} style={{ opacity: 0.6 }} />
                  ) : (
                    <FileText size={40} style={{ opacity: 0.6 }} />
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 500,
                      marginBottom: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.name}
                    </div>
                    <div style={{
                      fontSize: 12,
                      opacity: 0.6,
                      marginBottom: 8,
                      maxHeight: 60,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {item.type === 'text' ? item.content : `${formatSize(item.size || 0)} · Base64 编码`}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => copyToClipboard(
                          item.type === 'text' ? item.content : generateShareLink(item),
                          item.id
                        )}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 12,
                          background: 'rgba(255,255,255,0.1)',
                          color: '#fff',
                        }}
                      >
                        {copiedId === item.id ? <Check size={12} /> : <Copy size={12} />}
                        {copiedId === item.id ? '已复制' : '复制'}
                      </button>
                      <button
                        onClick={() => downloadItem(item)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 12,
                          background: 'rgba(34,197,94,0.2)',
                          color: '#22c55e',
                        }}
                      >
                        <Download size={12} />
                        下载
                      </button>
                      {typeof navigator.share === 'function' && (
                        <button
                          onClick={() => shareViaNative(item)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 12,
                            background: 'rgba(59,130,246,0.2)',
                            color: '#3b82f6',
                          }}
                        >
                          <Smartphone size={12} />
                          分享
                        </button>
                      )}
                    </div>

                    {shareMode === 'qr' && item.type === 'text' && (
                      <div style={{ marginTop: 12, textAlign: 'center' }}>
                        <img
                          src={generateQRCode(item.content)}
                          alt="QR Code"
                          style={{ width: 120, height: 120, borderRadius: 8 }}
                        />
                        <p style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>扫描二维码快速分享</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
