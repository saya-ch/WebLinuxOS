import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen, Mic, Volume2, ChevronRight,
  RotateCcw, CheckCircle, XCircle, Star, Brain, Layers,
  Sparkles, Target,
  PenTool,
  Globe, Languages, Lightbulb, Send,
  Play,
} from 'lucide-react'
import { useStore } from '../store'

type LangKey = 'en' | 'ja' | 'ko' | 'fr' | 'de' | 'es'
type ViewMode = 'dashboard' | 'lessons' | 'flashcards' | 'exercise' | 'pronunciation'

interface Language {
  key: LangKey
  name: string
  flag: string
  nativeName: string
  code: string
}

const LANGUAGES: Language[] = [
  { key: 'en', name: '英语', flag: '🇺🇸', nativeName: 'English', code: 'en-US' },
  { key: 'ja', name: '日语', flag: '🇯🇵', nativeName: '日本語', code: 'ja-JP' },
  { key: 'ko', name: '韩语', flag: '🇰🇷', nativeName: '한국어', code: 'ko-KR' },
  { key: 'fr', name: '法语', flag: '🇫🇷', nativeName: 'Français', code: 'fr-FR' },
  { key: 'de', name: '德语', flag: '🇩🇪', nativeName: 'Deutsch', code: 'de-DE' },
  { key: 'es', name: '西班牙语', flag: '🇪🇸', nativeName: 'Español', code: 'es-ES' },
]

interface Lesson {
  id: string
  lang: LangKey
  title: string
  level: '入门' | '初级' | '中级' | '高级'
  description: string
  vocabulary: { word: string; translation: string; example?: string; exampleTranslation?: string }[]
  grammar: { rule: string; explanation: string; example: string; translation: string }[]
  exercises: {
    type: 'fill' | 'translate' | 'choice'
    question: string
    options?: string[]
    answer: string
    hint?: string
  }[]
}

const LESSONS: Lesson[] = [
  {
    id: 'en-1', lang: 'en', title: '日常问候', level: '入门',
    description: '学习最基本的英语问候语和自我介绍',
    vocabulary: [
      { word: 'Hello', translation: '你好', example: 'Hello, my name is Tom.', exampleTranslation: '你好，我叫汤姆。' },
      { word: 'Good morning', translation: '早上好' },
      { word: 'Nice to meet you', translation: '很高兴见到你' },
      { word: 'How are you?', translation: '你好吗？' },
      { word: 'Goodbye', translation: '再见' },
    ],
    grammar: [
      { rule: 'be 动词用法', explanation: 'I am / You are / He is 用于表示状态', example: 'I am a student.', translation: '我是一名学生。' },
    ],
    exercises: [
      { type: 'choice', question: '____, my name is Alice.', options: ['Hello', 'Goodbye', 'Sorry', 'Please'], answer: 'Hello', hint: '最常用的问候语' },
      { type: 'fill', question: 'Good ____ (早上)', answer: 'morning' },
      { type: 'translate', question: '翻译：很高兴见到你', answer: 'Nice to meet you' },
    ],
  },
  {
    id: 'en-2', lang: 'en', title: '旅行必备', level: '初级',
    description: '在机场、酒店和餐厅使用的英语',
    vocabulary: [
      { word: 'Airport', translation: '机场' },
      { word: 'Hotel', translation: '酒店' },
      { word: 'Reservation', translation: '预订' },
      { word: 'Passport', translation: '护照' },
      { word: 'Delicious', translation: '美味的' },
    ],
    grammar: [
      { rule: 'Could you + 动词原形', explanation: '用于礼貌地请求', example: 'Could you help me?', translation: '你能帮我吗？' },
    ],
    exercises: [
      { type: 'choice', question: 'I have a ____ for two nights.', options: ['reservation', 'reserve', 'reserved', 'reserving'], answer: 'reservation' },
      { type: 'translate', question: '翻译：请给我菜单', answer: 'Could I have the menu, please?' },
    ],
  },
  {
    id: 'ja-1', lang: 'ja', title: '基础问候', level: '入门',
    description: '日语基础问候和日常用语',
    vocabulary: [
      { word: 'こんにちは', translation: '你好', example: 'こんにちは、田中さん。', exampleTranslation: '你好，田中先生。' },
      { word: 'おはよう', translation: '早上好' },
      { word: 'さようなら', translation: '再见' },
      { word: 'ありがとう', translation: '谢谢' },
      { word: 'はい', translation: '是' },
    ],
    grammar: [
      { rule: 'です/だ 敬语', explanation: 'です用于正式场合，だ用于非正式', example: '私は学生です。', translation: '我是学生。' },
    ],
    exercises: [
      { type: 'choice', question: '____、田中さん。', options: ['こんにちは', 'さようなら', 'ありがとう', 'はい'], answer: 'こんにちは' },
      { type: 'fill', question: '翻译：谢谢 (平假名)', answer: 'ありがとう' },
    ],
  },
  {
    id: 'ja-2', lang: 'ja', title: '数字与时间', level: '初级',
    description: '日语数字表达和时间说法',
    vocabulary: [
      { word: '一 (いち)', translation: '1' },
      { word: '二 (に)', translation: '2' },
      { word: '三 (さん)', translation: '3' },
      { word: '時間 (じかん)', translation: '小时' },
      { word: '何時 (なんじ)', translation: '几点' },
    ],
    grammar: [
      { rule: '时间表达', explanation: '～時～分 表示几点几分', example: '七時半です。', translation: '七点半。' },
    ],
    exercises: [
      { type: 'translate', question: '翻译：现在几点了？', answer: '今、何時ですか？' },
      { type: 'choice', question: '三 的读音是？', options: ['いち', 'に', 'さん', 'よん'], answer: 'さん' },
    ],
  },
  {
    id: 'fr-1', lang: 'fr', title: '日常用语', level: '入门',
    description: '法语基础问候',
    vocabulary: [
      { word: 'Bonjour', translation: '你好/白天好' },
      { word: 'Merci', translation: '谢谢' },
      { word: 'Au revoir', translation: '再见' },
      { word: 'Oui', translation: '是' },
      { word: 'Non', translation: '不' },
    ],
    grammar: [
      { rule: '冠词', explanation: 'Le/La/Les 表示特指', example: 'Le livre est sur la table.', translation: '书在桌子上。' },
    ],
    exercises: [
      { type: 'choice', question: '____, comment allez-vous?', options: ['Bonjour', 'Merci', 'Au revoir', 'Oui'], answer: 'Bonjour' },
      { type: 'translate', question: '翻译：谢谢', answer: 'Merci' },
    ],
  },
  {
    id: 'ko-1', lang: 'ko', title: '基础问候', level: '入门',
    description: '韩语基本问候语',
    vocabulary: [
      { word: '안녕하세요', translation: '你好' },
      { word: '감사합니다', translation: '谢谢' },
      { word: '안녕히 가세요', translation: '再见 (对离开的人)' },
      { word: '네', translation: '是' },
      { word: '아니요', translation: '不是' },
    ],
    grammar: [
      { rule: '敬语', explanation: '韩语有严格的敬语体系，对长辈要用敬语', example: '안녕하세요.', translation: '您好。' },
    ],
    exercises: [
      { type: 'choice', question: '____, 만나서 반갑습니다.', options: ['안녕하세요', '감사합니다', '네', '아니요'], answer: '안녕하세요' },
      { type: 'translate', question: '翻译：谢谢', answer: '감사합니다' },
    ],
  },
]

const STORAGE_KEY = 'weblinux-langlab-data-v1'

interface UserData {
  xp: number
  streak: number
  lastActive: string
  completedLessons: string[]
  flashcards: Flashcard[]
  srsData: Record<string, { interval: number; dueDate: number; reps: number }>
  dailyGoal: number
  todayProgress: number
}

interface Flashcard {
  id: string
  lang: LangKey
  word: string
  translation: string
  example?: string
  status: 'new' | 'learning' | 'review'
  createdAt: number
}

function loadData(): UserData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    xp: 0, streak: 1, lastActive: new Date().toDateString(),
    completedLessons: [], flashcards: [], srsData: {},
    dailyGoal: 50, todayProgress: 0,
  }
}

function saveData(d: UserData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)) } catch {}
}

function calculateSRS(quality: number, reps: number): { interval: number; dueDate: number } {
  let interval: number
  if (quality >= 3) {
    const intervals = [1, 3, 7, 14, 30]
    interval = intervals[Math.min(reps, intervals.length - 1)]
  } else {
    interval = 1
  }
  const dueDate = Date.now() + interval * 24 * 60 * 60 * 1000
  return { interval, dueDate }
}

export default function LanguageLab() {
  const addNotification = useStore((s) => s.addNotification)
  const [userData, setUserData] = useState<UserData>(loadData)
  const [activeLang, setActiveLang] = useState<LangKey>('en')
  const [view, setView] = useState<ViewMode>('dashboard')
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [exerciseAnswer, setExerciseAnswer] = useState('')
  const [exerciseResult, setExerciseResult] = useState<'correct' | 'wrong' | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [pronunciationText, setPronunciationText] = useState('')
  const [recognitionResult, setRecognitionResult] = useState('')

  useEffect(() => {
    saveData(userData)
  }, [userData])

  useEffect(() => {
    const today = new Date().toDateString()
    if (userData.lastActive !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      const newStreak = userData.lastActive === yesterday ? userData.streak + 1 : 1
      setUserData((d) => ({ ...d, lastActive: today, streak: newStreak, todayProgress: 0 }))
    }
  }, [])

  const speak = useCallback((text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) {
      addNotification({ title: '不支持', message: '浏览器不支持语音合成', type: 'warning', duration: 2000 })
      return
    }
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = langCode
    utter.rate = 0.9
    utter.pitch = 1
    window.speechSynthesis.speak(utter)
  }, [addNotification])

  const startRecognition = useCallback(() => {
    const lang = LANGUAGES.find((l) => l.key === activeLang)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      addNotification({ title: '不支持', message: '浏览器不支持语音识别', type: 'warning', duration: 2000 })
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = lang?.code || 'en-US'
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onstart = () => setSpeaking(true)
    recognition.onend = () => setSpeaking(false)
    recognition.onerror = () => setSpeaking(false)
    recognition.onresult = (event: any) => {
      let result = ''
      for (let i = 0; i < event.results.length; i++) {
        result += event.results[i][0].transcript
      }
      setRecognitionResult(result)
    }
    recognition.start()
  }, [activeLang, addNotification])

  const addXp = (amount: number) => {
    setUserData((d) => ({
      ...d,
      xp: d.xp + amount,
      todayProgress: Math.min(d.todayProgress + amount, d.dailyGoal),
    }))
  }

  const completeExercise = (lessonId: string) => {
    if (!userData.completedLessons.includes(lessonId)) {
      setUserData((d) => ({
        ...d,
        completedLessons: [...d.completedLessons, lessonId],
        xp: d.xp + 50,
        todayProgress: Math.min(d.todayProgress + 50, d.dailyGoal),
      }))
      addNotification({ title: '课程完成!', message: '+50 XP 已获得', type: 'success', duration: 3000 })
    }
  }

  const addFlashcard = (word: string, translation: string, example?: string) => {
    const card: Flashcard = {
      id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      lang: activeLang, word, translation, example,
      status: 'new', createdAt: Date.now(),
    }
    setUserData((d) => ({ ...d, flashcards: [...d.flashcards, card] }))
    addNotification({ title: '已添加', message: `新卡片: ${word}`, type: 'success', duration: 2000 })
  }

  const reviewFlashcard = (cardId: string, quality: number) => {
    setUserData((d) => {
      const card = d.flashcards.find((c) => c.id === cardId)
      if (!card) return d
      const srsKey = cardId
      const prevSrs = d.srsData[srsKey] || { interval: 0, dueDate: Date.now(), reps: 0 }
      const reps = quality >= 3 ? prevSrs.reps + 1 : 0
      const { interval, dueDate } = calculateSRS(quality, reps)
      return {
        ...d,
        srsData: { ...d.srsData, [srsKey]: { interval, dueDate, reps } },
        flashcards: d.flashcards.map((c) =>
          c.id === cardId
            ? { ...c, status: quality >= 3 ? 'review' : 'learning' }
            : c
        ),
      }
    })
  }

  const checkAnswer = (lesson: Lesson) => {
    const ex = lesson.exercises[exerciseIndex]
    const correct = exerciseAnswer.trim().toLowerCase() === ex.answer.trim().toLowerCase()
    setExerciseResult(correct ? 'correct' : 'wrong')
    setShowAnswer(true)
    if (correct) addXp(10)
  }

  const nextExercise = () => {
    if (currentLesson && exerciseIndex < currentLesson.exercises.length - 1) {
      setExerciseIndex(exerciseIndex + 1)
      setExerciseAnswer('')
      setExerciseResult(null)
      setShowAnswer(false)
    } else if (currentLesson) {
      completeExercise(currentLesson.id)
      setView('lessons')
      setCurrentLesson(null)
    }
  }

  const resetExercise = () => {
    setExerciseAnswer('')
    setExerciseResult(null)
    setShowAnswer(false)
  }

  const currentLangData = LANGUAGES.find((l) => l.key === activeLang)!
  const availableLessons = LESSONS.filter((l) => l.lang === activeLang)
  const completedCount = availableLessons.filter((l) => userData.completedLessons.includes(l.id)).length
  const todayPct = Math.round((userData.todayProgress / userData.dailyGoal) * 100)

  const c: React.CSSProperties = {
    width: '100%', height: '100%',
    background: 'linear-gradient(160deg, rgba(16,185,129,0.06) 0%, rgba(99,102,241,0.05) 100%)',
    display: 'flex', flexDirection: 'column', color: 'var(--text-primary)',
    fontFamily: 'inherit', overflow: 'hidden',
  }
  const hdr: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px', borderBottom: '1px solid var(--window-border)',
    background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)',
  }
  const bb: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px',
    borderRadius: 8, border: '1px solid var(--window-border)',
    background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)',
    cursor: 'pointer', fontSize: 12, transition: 'all 0.18s ease',
  }
  const card: React.CSSProperties = {
    background: 'var(--window-bg)', border: '1px solid var(--window-border)',
    borderRadius: 14, padding: 16, backdropFilter: 'blur(10px)',
  }

  return (
    <div style={c}>
      <div style={hdr}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: 'linear-gradient(135deg, #10b981, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
          }}>
            <Languages size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>语言实验室</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              已掌握 {userData.completedLessons.length} 课 · {userData.flashcards.length} 张卡片 · 连续学习 {userData.streak} 天
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.key}
              onClick={() => setActiveLang(lang.key)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: activeLang === lang.key ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                color: activeLang === lang.key ? '#fff' : 'var(--text-secondary)',
                fontSize: 13, transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <span>{lang.flag}</span> {lang.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {([
            { key: 'dashboard' as ViewMode, label: '总览', icon: <Brain size={14} /> },
            { key: 'lessons' as ViewMode, label: '课程', icon: <BookOpen size={14} /> },
            { key: 'flashcards' as ViewMode, label: '闪卡', icon: <Layers size={14} /> },
            { key: 'exercise' as ViewMode, label: '练习', icon: <PenTool size={14} /> },
            { key: 'pronunciation' as ViewMode, label: '发音', icon: <Mic size={14} /> },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              style={{
                ...bb, padding: '8px 14px',
                background: view === t.key ? 'rgba(16,185,129,0.2)' : undefined,
                color: view === t.key ? '#fff' : undefined,
                borderColor: view === t.key ? 'rgba(16,185,129,0.5)' : undefined,
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {view === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ ...card, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔥</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#f97316' }}>{userData.streak}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>连续学习天数</div>
            </div>
            <div style={{ ...card, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>⭐</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>{userData.xp}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>总经验值</div>
            </div>
            <div style={{ ...card, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📚</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#6366f1' }}>{completedCount}/{availableLessons.length}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>已完成课程</div>
            </div>

            <div style={{ ...card, gridColumn: 'span 3' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={16} style={{ color: '#10b981' }} /> 今日目标
              </div>
              <div style={{
                height: 24, background: 'rgba(255,255,255,0.08)', borderRadius: 12,
                overflow: 'hidden', position: 'relative',
              }}>
                <div style={{
                  height: '100%',
                  width: `${todayPct}%`,
                  background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                  borderRadius: 12,
                  transition: 'width 0.5s',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  paddingRight: 10,
                }}>
                  {todayPct > 20 && <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>{todayPct}%</span>}
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                已获得 {userData.todayProgress} / {userData.dailyGoal} XP
              </div>
            </div>

            <div style={{ ...card, gridColumn: 'span 3' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} style={{ color: '#fbbf24' }} /> 推荐课程
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                {availableLessons.slice(0, 4).map((lesson) => {
                  const completed = userData.completedLessons.includes(lesson.id)
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => { setCurrentLesson(lesson); setExerciseIndex(0); setExerciseAnswer(''); setExerciseResult(null); setShowAnswer(false); setView('exercise') }}
                      style={{
                        padding: 14, borderRadius: 10, border: '1px solid var(--window-border)',
                        background: completed ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                        display: 'flex', flexDirection: 'column', gap: 6,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                          {lesson.level}
                        </span>
                        {completed && <CheckCircle size={16} style={{ color: '#10b981' }} />}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{lesson.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{lesson.description}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {view === 'lessons' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {currentLangData.flag} {currentLangData.nativeName} 课程
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {completedCount} / {availableLessons.length} 已完成
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {availableLessons.map((lesson) => {
                const completed = userData.completedLessons.includes(lesson.id)
                return (
                  <div key={lesson.id} style={{
                    ...card, cursor: 'pointer', transition: 'all 0.2s',
                    borderColor: completed ? 'rgba(16,185,129,0.4)' : 'var(--window-border)',
                  }}
                  onClick={() => { setCurrentLesson(lesson); setExerciseIndex(0); setExerciseAnswer(''); setExerciseResult(null); setShowAnswer(false); setView('exercise') }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 6,
                        background: lesson.level === '入门' ? 'rgba(16,185,129,0.2)' : lesson.level === '初级' ? 'rgba(59,130,246,0.2)' : lesson.level === '中级' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                        color: lesson.level === '入门' ? '#10b981' : lesson.level === '初级' ? '#3b82f6' : lesson.level === '中级' ? '#f59e0b' : '#ef4444',
                      }}>{lesson.level}</span>
                      {completed ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10b981', fontSize: 11 }}>
                          <CheckCircle size={14} /> 已完成
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {lesson.exercises.length} 练习
                        </div>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{lesson.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>{lesson.description}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setView('exercise'); setCurrentLesson(lesson); setExerciseIndex(0); setExerciseAnswer(''); setExerciseResult(null); setShowAnswer(false) }}
                        style={{ ...bb, flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff', border: 'none' }}
                      >
                        <Play size={12} /> 开始学习
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {view === 'exercise' && currentLesson && (
          <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button style={bb} onClick={() => { setView('lessons'); setCurrentLesson(null) }}>
                ← 返回课程
              </button>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                第 {exerciseIndex + 1} / {currentLesson.exercises.length} 题
              </div>
            </div>

            <div style={{ ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {currentLesson.exercises[exerciseIndex].type === 'fill' ? <PenTool size={18} color="#fff" /> :
                    currentLesson.exercises[exerciseIndex].type === 'translate' ? <Globe size={18} color="#fff" /> :
                      <Target size={18} color="#fff" />}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{currentLesson.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {currentLesson.exercises[exerciseIndex].type === 'fill' ? '填空题' :
                      currentLesson.exercises[exerciseIndex].type === 'translate' ? '翻译题' : '选择题'}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 16, padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                {currentLesson.exercises[exerciseIndex].question}
              </div>

              {currentLesson.exercises[exerciseIndex].type === 'choice' && currentLesson.exercises[exerciseIndex].options ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {currentLesson.exercises[exerciseIndex].options.map((opt, i) => (
                    <button
                      key={i}
                      disabled={showAnswer}
                      onClick={() => setExerciseAnswer(opt)}
                      style={{
                        padding: '12px 16px', borderRadius: 10,
                        border: `1px solid ${exerciseAnswer === opt && showAnswer ? (exerciseResult === 'correct' ? '#10b981' : '#ef4444') : 'var(--window-border)'}`,
                        background: exerciseAnswer === opt ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                        color: 'var(--text-primary)', cursor: showAnswer ? 'default' : 'pointer',
                        textAlign: 'left', fontSize: 14, transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ display: 'inline-block', width: 24, color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  value={exerciseAnswer}
                  onChange={(e) => setExerciseAnswer(e.target.value)}
                  placeholder="在此输入你的答案…"
                  disabled={showAnswer}
                  style={{
                    width: '100%', minHeight: 80,
                    background: 'rgba(0,0,0,0.2)', border: '1px solid var(--window-border)',
                    borderRadius: 10, color: 'var(--text-primary)', padding: '12px',
                    fontSize: 14, resize: 'vertical', outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              )}

              {currentLesson.exercises[exerciseIndex].hint && !showAnswer && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lightbulb size={13} /> 提示: {currentLesson.exercises[exerciseIndex].hint}
                </div>
              )}

              {showAnswer && (
                <div style={{
                  marginTop: 14, padding: 14, borderRadius: 10,
                  background: exerciseResult === 'correct' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  border: `1px solid ${exerciseResult === 'correct' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    {exerciseResult === 'correct' ? (
                      <><CheckCircle size={18} style={{ color: '#10b981' }} /> <span style={{ color: '#10b981', fontWeight: 600 }}>回答正确! +10 XP</span></>
                    ) : (
                      <><XCircle size={18} style={{ color: '#ef4444' }} /> <span style={{ color: '#ef4444', fontWeight: 600 }}>答案不对</span></>
                    )}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    正确答案: <strong>{currentLesson.exercises[exerciseIndex].answer}</strong>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                {!showAnswer ? (
                  <button
                    style={{
                      ...bb, flex: 1, padding: '12px', justifyContent: 'center',
                      background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff', border: 'none', fontWeight: 600,
                    }}
                    onClick={() => checkAnswer(currentLesson)}
                    disabled={!exerciseAnswer.trim()}
                  >
                    <Send size={14} /> 提交答案
                  </button>
                ) : (
                  <>
                    <button style={{ ...bb, flex: 1, padding: '12px', justifyContent: 'center' }} onClick={resetExercise}>
                      <RotateCcw size={14} /> 重做
                    </button>
                    <button
                      style={{
                        ...bb, flex: 1, padding: '12px', justifyContent: 'center',
                        background: 'linear-gradient(135deg, #6366f1, #06b6d4)', color: '#fff', border: 'none', fontWeight: 600,
                      }}
                      onClick={nextExercise}
                    >
                      {exerciseIndex < currentLesson.exercises.length - 1 ? '下一题' : '完成课程'} <ChevronRight size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div style={{ ...card }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={14} /> 词汇表
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {currentLesson.vocabulary.slice(0, 8).map((v, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)',
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{v.word}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 12, marginLeft: 10 }}>{v.translation}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ ...bb, padding: '4px 8px', fontSize: 11 }} onClick={() => speak(v.word, currentLangData.code)}>
                        <Volume2 size={12} />
                      </button>
                      <button
                        style={{ ...bb, padding: '4px 8px', fontSize: 11 }}
                        onClick={() => addFlashcard(v.word, v.translation, v.example)}
                      >
                        <Star size={12} /> 闪卡
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'flashcards' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>我的闪卡 ({userData.flashcards.length})</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>基于 SRS 间隔重复算法</div>
            </div>
            {userData.flashcards.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📇</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>还没有闪卡</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>在练习中点击"闪卡"按钮来添加词汇</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {userData.flashcards.map((card) => {
                  const lang = LANGUAGES.find((l) => l.key === card.lang)
                  return (
                    <div key={card.id} style={{ ...card, padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.2)' }}>
                          {lang?.flag} {lang?.name}
                        </span>
                        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => speak(card.word, lang?.code || 'en-US')}>
                          <Volume2 size={14} color="var(--text-secondary)" />
                        </button>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{card.word}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>{card.translation}</div>
                      {card.example && (
                        <div style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--text-secondary)', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, marginBottom: 10 }}>
                          "{card.example}"
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          style={{ ...bb, flex: 1, padding: '6px', justifyContent: 'center', background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: 'none', fontSize: 11 }}
                          onClick={() => reviewFlashcard(card.id, 1)}
                        >
                          困难
                        </button>
                        <button
                          style={{ ...bb, flex: 1, padding: '6px', justifyContent: 'center', background: 'rgba(16,185,129,0.2)', color: '#10b981', border: 'none', fontSize: 11 }}
                          onClick={() => reviewFlashcard(card.id, 5)}
                        >
                          记住了
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {view === 'pronunciation' && (
          <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ ...card }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mic size={16} style={{ color: '#6366f1' }} /> 发音练习
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                输入或选择要练习的文本，然后点击麦克风按钮开始语音练习
              </div>
              <textarea
                value={pronunciationText}
                onChange={(e) => setPronunciationText(e.target.value)}
                placeholder={`输入${currentLangData.name}文本进行发音练习…`}
                style={{
                  width: '100%', minHeight: 80,
                  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--window-border)',
                  borderRadius: 10, color: 'var(--text-primary)', padding: '12px',
                  fontSize: 14, resize: 'vertical', outline: 'none',
                  fontFamily: 'inherit', marginBottom: 12,
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button
                  style={{ ...bb, flex: 1, justifyContent: 'center', background: 'rgba(99,102,241,0.15)' }}
                  onClick={() => speak(pronunciationText || 'Hello', currentLangData.code)}
                  disabled={!pronunciationText.trim()}
                >
                  <Volume2 size={14} /> 播放示范
                </button>
                <button
                  style={{
                    ...bb, flex: 1, justifyContent: 'center',
                    background: speaking ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #6366f1, #06b6d4)',
                    color: '#fff', border: 'none',
                  }}
                  onClick={startRecognition}
                  disabled={speaking}
                >
                  <Mic size={14} /> {speaking ? '聆听中…' : '开始录音'}
                </button>
              </div>
              {speaking && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[10, 20, 30, 20, 10, 25, 15, 30, 20, 10].map((h, i) => (
                      <div key={i} style={{
                        width: 4, height: h, background: '#ef4444', borderRadius: 2,
                        animation: `pulse 0.6s ease-in-out ${i * 0.1}s infinite alternate`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              {recognitionResult && (
                <div style={{
                  padding: 12, borderRadius: 10, background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.3)',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>识别结果:</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{recognitionResult}</div>
                </div>
              )}
            </div>

            <div style={{ ...card }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} style={{ color: '#fbbf24' }} /> 常用短语
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {LESSONS.filter((l) => l.lang === activeLang && l.vocabulary.length > 0).flatMap((l) => l.vocabulary.slice(0, 2)).slice(0, 8).map((v, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)',
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{v.word}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 12, marginLeft: 10 }}>{v.translation}</span>
                    </div>
                    <button style={{ ...bb, padding: '4px 8px', fontSize: 11 }} onClick={() => speak(v.word, currentLangData.code)}>
                      <Volume2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { from { transform: scaleY(0.5); } to { transform: scaleY(1.5); } }
      `}</style>
    </div>
  )
}