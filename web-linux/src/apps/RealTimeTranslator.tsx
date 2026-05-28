import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
];

interface TranslationHistory {
  id: string;
  from: string;
  to: string;
  sourceText: string;
  translatedText: string;
  timestamp: Date;
}

export default function RealTimeTranslator() {
  const { theme } = useStore();
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('zh');
  const [targetLang, setTargetLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [history, setHistory] = useState<TranslationHistory[]>(() => {
    try {
      const saved = localStorage.getItem('weblinux-translator-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const isDark = theme === 'dark';
  const bg = isDark ? '#1e1e2e' : '#f7f7fa';
  const cardBg = isDark ? '#252536' : '#ffffff';
  const border = isDark ? '#3a3a5c' : '#e0e0e6';
  const text = isDark ? '#e0e0e8' : '#1c1c1e';
  const accent = isDark ? '#6c5ce7' : '#007aff';

  const translateText = async (text: string) => {
    if (!text.trim()) {
      setTranslatedText('');
      return;
    }

    setIsTranslating(true);
    
    try {
      // 使用模拟翻译（实际项目中可以接入真实的翻译API）
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 简单的模拟翻译逻辑
      const mockTranslation = `[${targetLang.toUpperCase()}] ${text}`;
      setTranslatedText(mockTranslation);
      
      // 保存到历史记录
      const newHistory: TranslationHistory = {
        id: Date.now().toString(),
        from: sourceLang,
        to: targetLang,
        sourceText: text,
        translatedText: mockTranslation,
        timestamp: new Date(),
      };
      
      const updatedHistory = [newHistory, ...history].slice(0, 50);
      setHistory(updatedHistory);
      localStorage.setItem('weblinux-translator-history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const swapLanguages = () => {
    const tempLang = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tempLang);
    
    const tempText = sourceText;
    setSourceText(translatedText);
    setTranslatedText(tempText);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // 可以添加通知提示
    });
  };

  const clearHistory = () => {
    if (confirm('确定要清空翻译历史吗？')) {
      setHistory([]);
      localStorage.removeItem('weblinux-translator-history');
    }
  };

  const startRecording = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = sourceLang;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        
        setSourceText(transcript);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
      
      recognitionRef.current.start();
      setIsRecording(true);
    } else {
      alert('您的浏览器不支持语音识别功能');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      translateText(sourceText);
    }, 800);
    
    return () => clearTimeout(debounceTimer);
  }, [sourceText, sourceLang, targetLang]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: bg,
      color: text,
    }}>
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${border}`,
        background: cardBg,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🌐</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>实时翻译助手</div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>多语言即时翻译</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: cardBg,
            borderRadius: '16px',
            border: `1px solid ${border}`,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${border}`,
              background: isDark ? '#1a1a2e' : '#f0f0f5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${border}`,
                  background: cardBg,
                  color: text,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSourceText('')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'transparent',
                    color: text,
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  🗑️ 清空
                </button>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: isRecording ? '#e74c3c' : 'transparent',
                    color: isRecording ? '#fff' : text,
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  {isRecording ? '⏹️ 停止' : '🎤 语音'}
                </button>
              </div>
            </div>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="输入要翻译的文本..."
              style={{
                width: '100%',
                minHeight: '150px',
                padding: '16px',
                border: 'none',
                background: 'transparent',
                color: text,
                fontSize: '16px',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <button
              onClick={swapLanguages}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                border: `1px solid ${border}`,
                background: cardBg,
                color: accent,
                fontSize: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              ↺
            </button>
          </div>

          <div style={{
            background: cardBg,
            borderRadius: '16px',
            border: `1px solid ${border}`,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${border}`,
              background: isDark ? '#1a1a2e' : '#f0f0f5',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${border}`,
                  background: cardBg,
                  color: text,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
              <button
                onClick={() => copyToClipboard(translatedText)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: text,
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                📋 复制
              </button>
            </div>
            <div style={{
              minHeight: '150px',
              padding: '16px',
              fontSize: '16px',
              position: 'relative',
            }}>
              {isTranslating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
                  <span>翻译中</span>
                  <span>...</span>
                </div>
              ) : translatedText ? (
                translatedText
              ) : (
                <div style={{ opacity: 0.5 }}>翻译结果将显示在这里</div>
              )}
            </div>
          </div>

          {history.length > 0 && (
            <div style={{
              background: cardBg,
              borderRadius: '16px',
              border: `1px solid ${border}`,
            }}>
              <div style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>翻译历史</span>
                <button
                  onClick={clearHistory}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    background: 'transparent',
                    color: '#e74c3c',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  清空
                </button>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {history.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSourceLang(item.from);
                      setTargetLang(item.to);
                      setSourceText(item.sourceText);
                      setTranslatedText(item.translatedText);
                    }}
                    style={{
                      padding: '12px 16px',
                      borderBottom: `1px solid ${border}`,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      fontSize: '14px',
                      marginBottom: '4px',
                      opacity: 0.7,
                    }}>
                      {item.from} → {item.to}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.sourceText}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: accent,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.translatedText}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
