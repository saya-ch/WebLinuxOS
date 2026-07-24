import { useState, useEffect, useRef, useCallback } from 'react'

type SpeechStatus = 'idle' | 'speaking' | 'paused'

interface VoiceOption {
  voice: SpeechSynthesisVoice
  label: string
}

export default function WebSpeechSynth() {
  const [text, setText] = useState('')
  const [voices, setVoices] = useState<VoiceOption[]>([])
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0)
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [volume, setVolume] = useState(1)
  const [status, setStatus] = useState<SpeechStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [supported, setSupported] = useState(true)
  const [wordHighlight, setWordHighlight] = useState<number>(-1)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (typeof speechSynthesis === 'undefined') {
      setSupported(false)
      return
    }
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices()
      if (availableVoices.length === 0) return
      const voiceOptions: VoiceOption[] = availableVoices.map((v) => ({
        voice: v,
        label: `${v.name} (${v.lang})${v.default ? ' ★' : ''}`,
      }))
      setVoices(voiceOptions)
      const zhIdx = availableVoices.findIndex((v) => v.lang.startsWith('zh'))
      if (zhIdx >= 0) setSelectedVoiceIndex(zhIdx)
    }
    loadVoices()
    speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      speechSynthesis.cancel()
    }
  }, [])

  const startProgressTimer = useCallback(
    (totalLen: number) => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      const estimatedDuration = (totalLen / (10 * rate)) * 1000
      const interval = 50
      let elapsed = 0
      progressTimerRef.current = setInterval(() => {
        elapsed += interval
        const pct = Math.min((elapsed / estimatedDuration) * 100, 99)
        setProgress(pct)
        setCharIndex(Math.floor((pct / 100) * totalLen))
        setWordHighlight(Math.floor((pct / 100) * totalLen))
      }, interval)
    },
    [rate]
  )

  const stopProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
  }, [])

  const speak = useCallback(() => {
    if (!text.trim() || !supported) return
    speechSynthesis.cancel()
    stopProgressTimer()

    const utterance = new SpeechSynthesisUtterance(text)
    utteranceRef.current = utterance

    if (voices.length > 0 && selectedVoiceIndex < voices.length) {
      utterance.voice = voices[selectedVoiceIndex].voice
    }
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume

    utterance.onstart = () => {
      setStatus('speaking')
      startProgressTimer(text.length)
    }
    utterance.onend = () => {
      setStatus('idle')
      setProgress(100)
      setCharIndex(text.length)
      setWordHighlight(-1)
      stopProgressTimer()
      setTimeout(() => setProgress(0), 1500)
    }
    utterance.onpause = () => {
      setStatus('paused')
      stopProgressTimer()
    }
    utterance.onresume = () => {
      setStatus('speaking')
      startProgressTimer(text.length)
    }
    utterance.onerror = () => {
      setStatus('idle')
      stopProgressTimer()
      setProgress(0)
    }

    speechSynthesis.speak(utterance)
  }, [text, voices, selectedVoiceIndex, rate, pitch, volume, supported, startProgressTimer, stopProgressTimer])

  const pause = useCallback(() => {
    speechSynthesis.pause()
  }, [])

  const resume = useCallback(() => {
    speechSynthesis.resume()
  }, [])

  const stop = useCallback(() => {
    speechSynthesis.cancel()
    setStatus('idle')
    stopProgressTimer()
    setProgress(0)
    setCharIndex(0)
    setWordHighlight(-1)
  }, [stopProgressTimer])

  const statusLabel: Record<SpeechStatus, string> = {
    idle: '已停止',
    speaking: '正在朗读',
    paused: '已暂停',
  }
  const statusColor: Record<SpeechStatus, string> = {
    idle: '#a0a0b8',
    speaking: '#22c55e',
    paused: '#f59e0b',
  }

  const renderHighlightedText = () => {
    if (wordHighlight < 0 || status === 'idle') {
      return text
    }
    const before = text.slice(0, charIndex)
    const current = text.slice(charIndex, charIndex + 1)
    const after = text.slice(charIndex + 1)
    return (
      <>
        <span>{before}</span>
        <span style={{ backgroundColor: 'rgba(108,92,231,0.4)', borderRadius: 2 }}>{current}</span>
        <span>{after}</span>
      </>
    )
  }

  const sliderStyle = (value: number, min: number, max: number): React.CSSProperties => ({
    width: '100%',
    height: 6,
    WebkitAppearance: 'none',
    appearance: 'none',
    background: `linear-gradient(to right, #6c5ce7 ${((value - min) / (max - min)) * 100}%, #2d2d44 ${((value - min) / (max - min)) * 100}%)`,
    borderRadius: 3,
    outline: 'none',
    cursor: 'pointer',
  })

  if (!supported) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,14,24,0.95)', color: '#a0a0b8', padding: 40, textAlign: 'center' as const }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔇</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#cdd6f4' }}>浏览器不支持语音合成</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>请使用 Chrome、Edge 或 Safari 浏览器访问</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(14,14,24,0.95)', color: '#cdd6f4', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(108,92,231,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>🔊</span>
        <span style={{ fontSize: 16, fontWeight: 700 }}>语音合成阅读器</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColor[status], boxShadow: status === 'speaking' ? `0 0 8px ${statusColor[status]}` : 'none', transition: 'all 0.3s' }} />
          <span style={{ fontSize: 12, color: statusColor[status], fontWeight: 600 }}>{statusLabel[status]}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Text Input */}
        <div style={{ background: 'rgba(30,30,50,0.6)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 10, padding: 14, backdropFilter: 'blur(12px)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#a78bfa' }}>📝 输入文本</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="请输入要朗读的文本内容..."
            style={{
              width: '100%',
              minHeight: 120,
              maxHeight: 200,
              resize: 'vertical',
              background: 'rgba(14,14,24,0.8)',
              border: '1px solid rgba(108,92,231,0.15)',
              borderRadius: 8,
              padding: 12,
              color: '#cdd6f4',
              fontSize: 14,
              lineHeight: 1.6,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#6c7086' }}>
            <span>字数: {text.length}</span>
            <span style={{ color: '#a78bfa', cursor: 'pointer' }} onClick={() => setText('《静夜思》— 李白\n床前明月光，疑是地上霜。\n举头望明月，低头思故乡。')}>加载示例</span>
          </div>
        </div>

        {/* Highlighted Text Preview */}
        {status !== 'idle' && (
          <div style={{ background: 'rgba(30,30,50,0.6)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 10, padding: 14, backdropFilter: 'blur(12px)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#a78bfa' }}>📖 朗读进度</div>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: '#cdd6f4', whiteSpace: 'pre-wrap' as const, wordBreak: 'break-all' as const }}>
              {renderHighlightedText()}
            </div>
            <div style={{ marginTop: 10, height: 4, background: '#2d2d44', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #6c5ce7, #a78bfa)', borderRadius: 2, transition: 'width 0.1s linear' }} />
            </div>
          </div>
        )}

        {/* Voice Selection */}
        <div style={{ background: 'rgba(30,30,50,0.6)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 10, padding: 14, backdropFilter: 'blur(12px)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#a78bfa' }}>🎙️ 语音选择</div>
          <select
            value={selectedVoiceIndex}
            onChange={(e) => setSelectedVoiceIndex(Number(e.target.value))}
            style={{
              width: '100%',
              background: 'rgba(14,14,24,0.8)',
              border: '1px solid rgba(108,92,231,0.2)',
              borderRadius: 8,
              padding: '8px 12px',
              color: '#cdd6f4',
              fontSize: 13,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {voices.map((v, i) => (
              <option key={i} value={i} style={{ background: '#1e1e2e', color: '#cdd6f4' }}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {/* Controls */}
        <div style={{ background: 'rgba(30,30,50,0.6)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 10, padding: 14, backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>⚙️ 参数调节</div>

          {/* Rate */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: '#a0a0b8' }}>语速</span>
              <span style={{ color: '#6c5ce7', fontWeight: 600 }}>{rate.toFixed(1)}x</span>
            </div>
            <input type="range" min={0.1} max={3} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} style={sliderStyle(rate, 0.1, 3)} />
          </div>

          {/* Pitch */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: '#a0a0b8' }}>音调</span>
              <span style={{ color: '#6c5ce7', fontWeight: 600 }}>{pitch.toFixed(1)}</span>
            </div>
            <input type="range" min={0} max={2} step={0.1} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} style={sliderStyle(pitch, 0, 2)} />
          </div>

          {/* Volume */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
              <span style={{ color: '#a0a0b8' }}>音量</span>
              <span style={{ color: '#6c5ce7', fontWeight: 600 }}>{Math.round(volume * 100)}%</span>
            </div>
            <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(Number(e.target.value))} style={sliderStyle(volume, 0, 1)} />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={speak}
            disabled={status === 'speaking' || !text.trim()}
            style={{
              padding: '10px 28px',
              borderRadius: 8,
              border: 'none',
              background: status === 'speaking' ? '#2d2d44' : 'linear-gradient(135deg, #6c5ce7, #a78bfa)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: status === 'speaking' || !text.trim() ? 'not-allowed' : 'pointer',
              opacity: status === 'speaking' || !text.trim() ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            ▶ 播放
          </button>
          <button
            onClick={status === 'paused' ? resume : pause}
            disabled={status === 'idle'}
            style={{
              padding: '10px 28px',
              borderRadius: 8,
              border: '1px solid rgba(108,92,231,0.35)',
              background: 'rgba(30,30,50,0.6)',
              color: '#cdd6f4',
              fontSize: 14,
              fontWeight: 600,
              cursor: status === 'idle' ? 'not-allowed' : 'pointer',
              opacity: status === 'idle' ? 0.4 : 1,
              transition: 'all 0.2s',
              backdropFilter: 'blur(8px)',
            }}
          >
            {status === 'paused' ? '▶ 继续' : '⏸ 暂停'}
          </button>
          <button
            onClick={stop}
            disabled={status === 'idle'}
            style={{
              padding: '10px 28px',
              borderRadius: 8,
              border: '1px solid rgba(239,68,68,0.35)',
              background: 'rgba(239,68,68,0.15)',
              color: '#f87171',
              fontSize: 14,
              fontWeight: 600,
              cursor: status === 'idle' ? 'not-allowed' : 'pointer',
              opacity: status === 'idle' ? 0.4 : 1,
              transition: 'all 0.2s',
            }}
          >
            ⏹ 停止
          </button>
        </div>
      </div>
    </div>
  )
}
