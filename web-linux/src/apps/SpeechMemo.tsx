import { useState, useEffect, useRef, useCallback } from 'react'

interface Memo {
  id: string
  text: string
  timestamp: number
  duration: number
  audioDataUrl?: string
}

interface VoiceOption {
  voice: SpeechSynthesisVoice
  label: string
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognitionResult {
  0: { transcript: string }
  isFinal: boolean
  length: number
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
  length: number
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition
}

interface SpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

type Tab = 'tts' | 'record' | 'list'

export default function SpeechMemo() {
  const [activeTab, setActiveTab] = useState<Tab>('tts')

  // TTS state
  const [ttsText, setTtsText] = useState('')
  const [voices, setVoices] = useState<VoiceOption[]>([])
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0)
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [ttsStatus, setTtsStatus] = useState<'idle' | 'speaking' | 'paused'>('idle')
  const [ttsSupported, setTtsSupported] = useState(true)

  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingText, setRecordingText] = useState('')
  const [interimText, setInterimText] = useState('')
  const [recognitionSupported, setRecognitionSupported] = useState(true)
  const [recordStartTs, setRecordStartTs] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [recordingError, setRecordingError] = useState('')

  // Memos
  const [memos, setMemos] = useState<Memo[]>([])
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalTranscriptRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load memos from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('speech-memos')
      if (saved) {
        const parsed = JSON.parse(saved) as Memo[]
        // Strip audio data URLs from saved memos to save space, keep text
        const cleaned = parsed.map(m => ({ ...m, audioDataUrl: undefined }))
        setMemos(cleaned)
      }
    } catch {}
  }, [])

  // Persist memos (text-only) to localStorage
  useEffect(() => {
    const toSave = memos.map(m => ({ ...m, audioDataUrl: undefined }))
    try {
      localStorage.setItem('speech-memos', JSON.stringify(toSave))
    } catch {}
  }, [memos])

  // Load voices for TTS
  useEffect(() => {
    if (typeof speechSynthesis === 'undefined') {
      setTtsSupported(false)
      return
    }
    const loadVoices = () => {
      const available = speechSynthesis.getVoices()
      if (available.length === 0) return
      const opts: VoiceOption[] = available.map((v) => ({
        voice: v,
        label: `${v.name} (${v.lang})${v.default ? ' ★' : ''}`,
      }))
      setVoices(opts)
      const zhIdx = available.findIndex((v) => v.lang.startsWith('zh'))
      if (zhIdx >= 0) setSelectedVoiceIndex(zhIdx)
    }
    loadVoices()
    speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      speechSynthesis.cancel()
    }
  }, [])

  // SpeechRecognition support check
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setRecognitionSupported(false)
    }
  }, [])

  // TTS speak
  const speak = useCallback(() => {
    if (!ttsText.trim() || !ttsSupported) return
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(ttsText)
    if (voices.length > 0 && selectedVoiceIndex < voices.length) {
      u.voice = voices[selectedVoiceIndex].voice
    }
    u.rate = rate
    u.pitch = pitch
    u.onstart = () => setTtsStatus('speaking')
    u.onend = () => setTtsStatus('idle')
    u.onpause = () => setTtsStatus('paused')
    u.onresume = () => setTtsStatus('speaking')
    u.onerror = () => setTtsStatus('idle')
    speechSynthesis.speak(u)
  }, [ttsText, ttsSupported, voices, selectedVoiceIndex, rate, pitch])

  const stopTTS = useCallback(() => {
    speechSynthesis.cancel()
    setTtsStatus('idle')
  }, [])

  // Start recording
  const startRecording = useCallback(async () => {
    setRecordingError('')
    setRecordingText('')
    setInterimText('')
    finalTranscriptRef.current = ''
    setAudioChunks([])

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setRecordingError('浏览器不支持语音识别')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      const chunks: Blob[] = []
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      mr.onstop = () => {
        setAudioChunks(chunks)
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      setMediaRecorder(mr)

      const recognition = new SR()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'zh-CN'

      recognition.onstart = () => {
        setIsRecording(true)
        setRecordStartTs(Date.now())
        timerRef.current = setInterval(() => {
          setElapsedTime(Math.floor((Date.now() - recordStartTs) / 1000))
        }, 500)
      }

      recognition.onresult = (event) => {
        let final = ''
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript
          } else {
            interim += event.results[i][0].transcript
          }
        }
        if (final) {
          finalTranscriptRef.current += final
          setRecordingText(finalTranscriptRef.current)
        }
        setInterimText(interim)
      }

      recognition.onerror = (event) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setRecordingError(`识别错误: ${event.error}`)
        }
      }

      recognition.onend = () => {
        if (recognitionRef.current === recognition && isRecording) {
          try { recognition.start() } catch {}
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      setRecordingError('无法访问麦克风，请检查权限设置')
      setIsRecording(false)
    }
  }, [isRecording, recordStartTs])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRecording(false)

    recognitionRef.current?.stop()
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }

    // Save memo after short delay to let audio finalize
    setTimeout(() => {
      const fullText = finalTranscriptRef.current
      if (!fullText.trim() && audioChunks.length === 0) return

      let audioDataUrl: string | undefined
      if (audioChunks.length > 0) {
        const blob = new Blob(audioChunks, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onloadend = () => {
          audioDataUrl = reader.result as string
          const newMemo: Memo = {
            id: Date.now().toString(),
            text: fullText || '(无文字记录)',
            timestamp: Date.now(),
            duration: Math.floor((Date.now() - recordStartTs) / 1000),
            audioDataUrl,
          }
          setMemos(prev => [newMemo, ...prev])
          setAudioChunks([])
        }
        reader.readAsDataURL(blob)
      } else {
        const newMemo: Memo = {
          id: Date.now().toString(),
          text: fullText || '(无文字记录)',
          timestamp: Date.now(),
          duration: Math.floor((Date.now() - recordStartTs) / 1000),
        }
        setMemos(prev => [newMemo, ...prev])
      }

      setRecordingText('')
      setInterimText('')
      setElapsedTime(0)
    }, 300)
  }, [mediaRecorder, audioChunks, recordStartTs])

  // Play memo audio
  const playMemo = useCallback((memo: Memo) => {
    if (memo.audioDataUrl) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      audioRef.current = new Audio(memo.audioDataUrl)
      audioRef.current.onended = () => setPlayingId(null)
      audioRef.current.play()
      setPlayingId(memo.id)
    }
  }, [])

  const pauseMemo = useCallback(() => {
    audioRef.current?.pause()
    setPlayingId(null)
  }, [])

  const deleteMemo = useCallback((id: string) => {
    setMemos(prev => prev.filter(m => m.id !== id))
    if (playingId === id) {
      audioRef.current?.pause()
      setPlayingId(null)
    }
  }, [playingId])

  const downloadMemo = useCallback((memo: Memo) => {
    if (!memo.audioDataUrl) return
    const a = document.createElement('a')
    a.href = memo.audioDataUrl
    a.download = `memo-${memo.id}.webm`
    a.click()
  }, [])

  // Speak memo text
  const speakMemoText = useCallback((text: string) => {
    if (!text.trim()) return
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    if (voices.length > 0 && selectedVoiceIndex < voices.length) {
      u.voice = voices[selectedVoiceIndex].voice
    }
    u.rate = rate
    u.pitch = pitch
    speechSynthesis.speak(u)
  }, [voices, selectedVoiceIndex, rate, pitch])

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  const sliderStyle = (value: number, min: number, max: number): React.CSSProperties => ({
    width: '100%',
    height: 6,
    WebkitAppearance: 'none',
    appearance: 'none',
    background: `linear-gradient(to right, var(--accent, #6c5ce7) ${((value - min) / (max - min)) * 100}%, var(--window-border, #2d2d44) ${((value - min) / (max - min)) * 100}%)`,
    borderRadius: 3,
    outline: 'none',
    cursor: 'pointer',
  })

  const accent = 'var(--accent, #6c5ce7)'
  const bg = 'var(--window-bg, rgba(14,14,24,0.95))'
  const textPrimary = 'var(--text-primary, #cdd6f4)'
  const textSecondary = 'var(--text-secondary, #a0a0b8)'
  const borderColor = 'var(--window-border, rgba(108,92,231,0.2))'
  const cardBg = 'var(--accent-bg, rgba(30,30,50,0.6))'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: bg, color: textPrimary, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>🎙️</span>
        <span style={{ fontSize: 15, fontWeight: 700 }}>语音备忘录</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {(['tts', 'record', 'list'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '4px 12px',
                fontSize: 12,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === tab ? accent : 'transparent',
                color: activeTab === tab ? '#fff' : textSecondary,
                fontWeight: activeTab === tab ? 600 : 400,
                transition: 'all 0.2s',
              }}
            >
              {tab === 'tts' ? '🔊 朗读' : tab === 'record' ? '🎤 录音' : '📋 列表'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {activeTab === 'tts' && (
          <>
            {!ttsSupported && (
              <div style={{ padding: 20, textAlign: 'center', color: textSecondary }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🔇</div>
                浏览器不支持语音合成
              </div>
            )}
            {ttsSupported && (
              <>
                <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: accent }}>📝 输入文本</div>
                  <textarea
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    placeholder="输入要朗读的文本..."
                    style={{
                      width: '100%', minHeight: 100, maxHeight: 160, resize: 'vertical',
                      background: 'rgba(0,0,0,0.2)', border: `1px solid ${borderColor}`,
                      borderRadius: 8, padding: 10, color: textPrimary, fontSize: 13,
                      lineHeight: 1.5, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: textSecondary }}>
                    <span>{ttsText.length} 字</span>
                    <span style={{ color: accent, cursor: 'pointer' }} onClick={() => setTtsText('你好，欢迎使用语音备忘录应用。这是一个演示文本。')}>加载示例</span>
                  </div>
                </div>

                <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: accent }}>🎙️ 语音选择</div>
                  <select
                    value={selectedVoiceIndex}
                    onChange={(e) => setSelectedVoiceIndex(Number(e.target.value))}
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.2)',
                      border: `1px solid ${borderColor}`, borderRadius: 8,
                      padding: '6px 10px', color: textPrimary, fontSize: 12,
                      outline: 'none', cursor: 'pointer',
                    }}
                  >
                    {voices.map((v, i) => (
                      <option key={i} value={i} style={{ background: '#1e1e2e', color: textPrimary }}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: accent }}>⚙️ 参数调节</div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                      <span style={{ color: textSecondary }}>语速</span>
                      <span style={{ color: accent, fontWeight: 600 }}>{rate.toFixed(1)}x</span>
                    </div>
                    <input type="range" min={0.1} max={3} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} style={sliderStyle(rate, 0.1, 3)} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                      <span style={{ color: textSecondary }}>音调</span>
                      <span style={{ color: accent, fontWeight: 600 }}>{pitch.toFixed(1)}</span>
                    </div>
                    <input type="range" min={0} max={2} step={0.1} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} style={sliderStyle(pitch, 0, 2)} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button
                    onClick={speak}
                    disabled={!ttsText.trim()}
                    style={{
                      padding: '8px 24px', borderRadius: 8, border: 'none',
                      background: ttsStatus === 'speaking' ? '#2d2d44' : `linear-gradient(135deg, ${accent}, #a78bfa)`,
                      color: '#fff', fontSize: 13, fontWeight: 600,
                      cursor: !ttsText.trim() ? 'not-allowed' : 'pointer',
                      opacity: !ttsText.trim() ? 0.5 : 1, transition: 'all 0.2s',
                    }}
                  >
                    ▶ 朗读
                  </button>
                  <button
                    onClick={stopTTS}
                    disabled={ttsStatus === 'idle'}
                    style={{
                      padding: '8px 24px', borderRadius: 8,
                      border: `1px solid rgba(239,68,68,0.35)`,
                      background: 'rgba(239,68,68,0.15)', color: '#f87171',
                      fontSize: 13, fontWeight: 600,
                      cursor: ttsStatus === 'idle' ? 'not-allowed' : 'pointer',
                      opacity: ttsStatus === 'idle' ? 0.4 : 1, transition: 'all 0.2s',
                    }}
                  >
                    ⏹ 停止
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'record' && (
          <>
            {!recognitionSupported && (
              <div style={{ padding: 20, textAlign: 'center', color: textSecondary }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🎤</div>
                浏览器不支持语音识别，请使用 Chrome 或 Edge
              </div>
            )}
            {recognitionSupported && (
              <>
                <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{
                    fontSize: 40, marginBottom: 8,
                    color: isRecording ? '#f38ba8' : accent,
                    transition: 'color 0.2s',
                  }}>
                    {isRecording ? '🔴' : '🎤'}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    {isRecording ? '正在录音...' : '准备录音'}
                  </div>
                  <div style={{ fontSize: 22, fontFamily: 'monospace', color: isRecording ? '#f38ba8' : textPrimary }}>
                    {formatDuration(elapsedTime)}
                  </div>

                  {recordingError && (
                    <div style={{ color: '#f87171', fontSize: 12, marginTop: 8 }}>{recordingError}</div>
                  )}

                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    style={{
                      marginTop: 12, width: 64, height: 64, borderRadius: '50%',
                      border: 'none', cursor: 'pointer',
                      background: isRecording ? '#f38ba8' : accent,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, color: '#fff',
                      boxShadow: isRecording ? '0 0 20px rgba(243,139,168,0.5)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isRecording ? '⏹' : '🎤'}
                  </button>
                </div>

                {(recordingText || interimText) && (
                  <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: accent }}>📝 实时转写</div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: textPrimary, whiteSpace: 'pre-wrap' as const }}>
                      {recordingText}
                      <span style={{ color: textSecondary, opacity: 0.6 }}>{interimText}</span>
                    </div>
                  </div>
                )}

                <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: textSecondary, lineHeight: 1.6 }}>
                    💡 提示：点击按钮开始录音，说话时会实时转写为文字。再次点击停止并保存备忘录。录音需要麦克风权限。
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'list' && (
          <>
            {memos.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: textSecondary }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
                <div>还没有备忘录</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>切换到"录音"标签创建第一个语音备忘录</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {memos.map(memo => (
                  <div
                    key={memo.id}
                    style={{
                      background: cardBg, border: `1px solid ${borderColor}`,
                      borderRadius: 10, padding: 12, display: 'flex',
                      flexDirection: 'column', gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>🎵</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: textSecondary }}>
                          {formatDate(memo.timestamp)} · {formatDuration(memo.duration)}
                        </div>
                        <div
                          style={{
                            fontSize: 13, color: textPrimary, marginTop: 2,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}
                          title={memo.text}
                        >
                          {memo.text || '(无文字记录)'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      {memo.audioDataUrl ? (
                        <button
                          onClick={() => playingId === memo.id ? pauseMemo() : playMemo(memo)}
                          style={{
                            flex: 1, padding: '6px 10px', borderRadius: 6, border: 'none',
                            background: playingId === memo.id ? '#2d2d44' : accent,
                            color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          {playingId === memo.id ? '⏸ 暂停' : '▶ 播放'}
                        </button>
                      ) : (
                        <button
                          onClick={() => speakMemoText(memo.text)}
                          style={{
                            flex: 1, padding: '6px 10px', borderRadius: 6, border: 'none',
                            background: accent, color: '#fff', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.2s',
                          }}
                        >
                          🔊 朗读文字
                        </button>
                      )}
                      {memo.audioDataUrl && (
                        <button
                          onClick={() => downloadMemo(memo)}
                          style={{
                            padding: '6px 10px', borderRadius: 6,
                            border: `1px solid ${borderColor}`,
                            background: 'transparent', color: textPrimary,
                            fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
                          }}
                        >
                          ⬇ 下载
                        </button>
                      )}
                      <button
                        onClick={() => deleteMemo(memo.id)}
                        style={{
                          padding: '6px 10px', borderRadius: 6,
                          border: '1px solid rgba(239,68,68,0.35)',
                          background: 'rgba(239,68,68,0.1)', color: '#f87171',
                          fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        🗑 删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}