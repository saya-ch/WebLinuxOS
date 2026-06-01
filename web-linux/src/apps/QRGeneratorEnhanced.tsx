import { useState, useEffect, useCallback, memo } from 'react'

interface QRCodeData {
  id: string
  content: string
  createdAt: number
  type: 'text' | 'url' | 'wifi' | 'vcard' | 'email' | 'sms'
}

const QRGenerator = memo(function QRGenerator() {
  const [inputText, setInputText] = useState('')
  const [qrType, setQrType] = useState<'text' | 'url' | 'wifi' | 'vcard' | 'email' | 'sms'>('text')
  const [wifiSSID, setWifiSSID] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA')
  const [vcardName, setVcardName] = useState('')
  const [vcardPhone, setVcardPhone] = useState('')
  const [vcardEmail, setVcardEmail] = useState('')
  const [vcardOrg, setVcardOrg] = useState('')
  const [qrSize, setQrSize] = useState(256)
  const [history, setHistory] = useState<QRCodeData[]>(() => {
    const saved = localStorage.getItem('weblinux-qr-history')
    return saved ? JSON.parse(saved) : []
  })
  const [showHistory, setShowHistory] = useState(false)
  const [error, setError] = useState('')

  const generateWifiString = () => {
    if (!wifiSSID) {
      setError('请输入WiFi名称')
      return ''
    }
    const encryption = wifiEncryption === 'nopass' ? '' : `T:${wifiEncryption};`
    const passwordPart = wifiPassword ? `P:${wifiPassword};` : ''
    return `WIFI:${encryption}${passwordPart}S:${wifiSSID};`
  }

  const generateVcardString = () => {
    const parts = ['BEGIN:VCARD', 'VERSION:3.0']
    if (vcardName) parts.push(`FN:${vcardName}`, `N:${vcardName}`)
    if (vcardPhone) parts.push(`TEL:${vcardPhone}`)
    if (vcardEmail) parts.push(`EMAIL:${vcardEmail}`)
    if (vcardOrg) parts.push(`ORG:${vcardOrg}`)
    parts.push('END:VCARD')
    return parts.join('\n')
  }

  const generateContent = useCallback(() => {
    switch (qrType) {
      case 'wifi':
        return generateWifiString()
      case 'vcard':
        return generateVcardString()
      case 'email':
        return `mailto:${inputText}`
      case 'sms':
        return `smsto:${inputText}`
      default:
        return inputText
    }
  }, [qrType, inputText, wifiSSID, wifiPassword, wifiEncryption, vcardName, vcardPhone, vcardEmail, vcardOrg])

  const generateQRCode = () => {
    const content = generateContent()
    if (!content) return null
    try {
      const encodedContent = encodeURIComponent(content)
      return `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodedContent}&format=png&margin=10`
    } catch (err) {
      setError('生成二维码失败')
      return null
    }
  }

  const handleSaveToHistory = () => {
    const content = generateContent()
    if (!content) return

    const newQR: QRCodeData = {
      id: Date.now().toString(),
      content,
      createdAt: Date.now(),
      type: qrType
    }

    const updatedHistory = [newQR, ...history.slice(0, 49)]
    setHistory(updatedHistory)
    localStorage.setItem('weblinux-qr-history', JSON.stringify(updatedHistory))
    setError('')
  }

  const handleClearHistory = () => {
    setHistory([])
    localStorage.removeItem('weblinux-qr-history')
  }

  const handleDownload = () => {
    const qrUrl = generateQRCode()
    if (!qrUrl) return

    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `qrcode-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    handleSaveToHistory()
  }

  const handleCopyToClipboard = async () => {
    const qrUrl = generateQRCode()
    if (!qrUrl) return

    try {
      const response = await fetch(qrUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      handleSaveToHistory()
      setError('')
    } catch (err) {
      setError('复制到剪贴板失败，请尝试下载')
    }
  }

  useEffect(() => {
    setError('')
  }, [inputText, qrType])

  const qrUrl = generateQRCode()

  return (
    <div style={{
      height: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 24,
      overflow: 'auto'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        padding: 24,
        maxWidth: 900,
        margin: '0 auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#333' }}>
            二维码生成器
          </h2>
          <p style={{ color: '#666', fontSize: 14 }}>
            支持文本、URL、WiFi、联系人等多种格式
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 16,
            color: '#c33',
            fontSize: 14
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#333' }}>
                二维码类型
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { value: 'text', label: '文本' },
                  { value: 'url', label: '网址' },
                  { value: 'wifi', label: 'WiFi' },
                  { value: 'vcard', label: '联系人' },
                  { value: 'email', label: '邮箱' },
                  { value: 'sms', label: '短信' }
                ].map(type => (
                  <button
                    key={type.value}
                    onClick={() => setQrType(type.value as any)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: qrType === type.value ? '#667eea' : '#f0f0f0',
                      color: qrType === type.value ? '#fff' : '#333',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                      transition: 'all 0.2s'
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {qrType === 'wifi' && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#333' }}>
                    WiFi名称 (SSID)
                  </label>
                  <input
                    type="text"
                    value={wifiSSID}
                    onChange={(e) => setWifiSSID(e.target.value)}
                    placeholder="请输入WiFi名称"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      fontSize: 14,
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#333' }}>
                    密码
                  </label>
                  <input
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="可选"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      fontSize: 14,
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#333' }}>
                    加密类型
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['WPA', 'WEP', 'nopass'] as const).map(enc => (
                      <button
                        key={enc}
                        onClick={() => setWifiEncryption(enc)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: 'none',
                          background: wifiEncryption === enc ? '#667eea' : '#f0f0f0',
                          color: wifiEncryption === enc ? '#fff' : '#333',
                          cursor: 'pointer',
                          fontSize: 13
                        }}
                      >
                        {enc === 'WPA' ? 'WPA/WPA2' : enc === 'WEP' ? 'WEP' : '无密码'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {qrType === 'vcard' && (
              <div style={{ marginBottom: 20 }}>
                {[
                  { label: '姓名', value: vcardName, setter: setVcardName, placeholder: '张三' },
                  { label: '电话', value: vcardPhone, setter: setVcardPhone, placeholder: '+86 13800138000' },
                  { label: '邮箱', value: vcardEmail, setter: setVcardEmail, placeholder: 'example@email.com' },
                  { label: '公司', value: vcardOrg, setter: setVcardOrg, placeholder: '公司名称' }
                ].map(field => (
                  <div key={field.label} style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#333' }}>
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                      placeholder={field.placeholder}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid #ddd',
                        fontSize: 14,
                        outline: 'none'
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {qrType !== 'wifi' && qrType !== 'vcard' && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#333' }}>
                  {qrType === 'url' ? '网址' : qrType === 'email' ? '邮箱地址' : qrType === 'sms' ? '手机号码' : '文本内容'}
                </label>
                {qrType === 'text' ? (
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="输入要生成二维码的内容"
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      fontSize: 14,
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                ) : (
                  <input
                    type={qrType === 'email' ? 'email' : qrType === 'sms' ? 'tel' : 'text'}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      qrType === 'url' ? 'https://example.com' :
                      qrType === 'email' ? 'example@email.com' :
                      qrType === 'sms' ? '13800138000' : ''
                    }
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      fontSize: 14,
                      outline: 'none'
                    }}
                  />
                )}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#333' }}>
                二维码大小: {qrSize}px
              </label>
              <input
                type="range"
                min="128"
                max="512"
                step="64"
                value={qrSize}
                onChange={(e) => setQrSize(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <div style={{
              background: '#fff',
              border: '2px dashed #ddd',
              borderRadius: 12,
              padding: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 300,
              marginBottom: 16
            }}>
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="QR Code"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: 8
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#999' }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>📱</div>
                  <p>预览区域</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleDownload}
                disabled={!qrUrl}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: qrUrl ? '#667eea' : '#ccc',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: qrUrl ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s'
                }}
              >
                下载二维码
              </button>
              <button
                onClick={handleCopyToClipboard}
                disabled={!qrUrl}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: qrUrl ? '#48bb78' : '#ccc',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: qrUrl ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s'
                }}
              >
                复制到剪贴板
              </button>
            </div>

            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                width: '100%',
                marginTop: 12,
                padding: '10px',
                borderRadius: 8,
                border: '1px solid #ddd',
                background: '#fff',
                color: '#333',
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              {showHistory ? '收起历史记录' : `查看历史记录 (${history.length})`}
            </button>

            {showHistory && history.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16, margin: 0, color: '#333' }}>历史记录</h3>
                  <button
                    onClick={handleClearHistory}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 4,
                      border: 'none',
                      background: '#fc8181',
                      color: '#fff',
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    清空
                  </button>
                </div>
                <div style={{ maxHeight: 200, overflow: 'auto' }}>
                  {history.map(item => (
                    <div
                      key={item.id}
                      style={{
                        padding: '8px 12px',
                        background: '#f7fafc',
                        borderRadius: 6,
                        marginBottom: 6,
                        fontSize: 13,
                        color: '#4a5568',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span style={{ fontSize: 11, color: '#718096', marginRight: 8 }}>
                        [{item.type}]
                      </span>
                      {item.content.substring(0, 50)}{item.content.length > 50 ? '...' : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

export default QRGenerator
