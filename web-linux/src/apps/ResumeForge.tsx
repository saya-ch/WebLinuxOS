import { useState, useEffect, useRef, useCallback } from 'react'
import {
  User, Mail, Phone, MapPin, Globe, Briefcase, GraduationCap,
  Code2, Award, FileText, Plus, Trash2, Eye, Download,
  Copy, Check, ChevronLeft, Sparkles, Printer,
  Upload, Settings, FolderOpen, Save
} from 'lucide-react'

interface PersonalInfo {
  name: string
  title: string
  email: string
  phone: string
  location: string
  website: string
  summary: string
  avatar?: string
}

interface Experience {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  current: boolean
  description: string
  bullets: string[]
}

interface Education {
  id: string
  school: string
  degree: string
  field: string
  startDate: string
  endDate: string
  gpa?: string
  description: string
}

interface Skill {
  id: string
  name: string
  level: number // 1-5
  category: string
}

interface Project {
  id: string
  name: string
  link: string
  description: string
  tech: string[]
  highlights: string[]
}

interface Language {
  id: string
  name: string
  level: string
}

interface ResumeData {
  personal: PersonalInfo
  experiences: Experience[]
  education: Education[]
  skills: Skill[]
  projects: Project[]
  languages: Language[]
  awards: { id: string; title: string; issuer: string; date: string; description: string }[]
  templateId: string
  accentColor: string
}

type SectionKey = 'personal' | 'experience' | 'education' | 'skills' | 'projects' | 'languages' | 'awards'

const SECTIONS: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
  { key: 'personal', label: '个人信息', icon: <User size={16} /> },
  { key: 'experience', label: '工作经历', icon: <Briefcase size={16} /> },
  { key: 'education', label: '教育背景', icon: <GraduationCap size={16} /> },
  { key: 'skills', label: '技能专长', icon: <Code2 size={16} /> },
  { key: 'projects', label: '项目作品', icon: <FolderOpen size={16} /> },
  { key: 'languages', label: '语言能力', icon: <Globe size={16} /> },
  { key: 'awards', label: '奖项荣誉', icon: <Award size={16} /> },
]

const TEMPLATES = [
  { id: 'classic', name: '经典商务', desc: '简约专业，万能通用' },
  { id: 'modern', name: '现代极简', desc: '留白优雅，强调内容' },
  { id: 'tech', name: '技术极客', desc: '两栏布局，技能突出' },
  { id: 'creative', name: '创意设计', desc: '色彩点缀，设计师风' },
]

const ACCENT_COLORS = ['#2563eb', '#0ea5e9', '#0891b2', '#059669', '#0d9488', '#4f46e5', '#7c3aed', '#db2777', '#dc2626', '#ea580c']

const STORAGE_KEY = 'resumeforge-data-v1'
const uid = () => Math.random().toString(36).slice(2, 10)

const DEFAULT_DATA: ResumeData = {
  personal: {
    name: '张小明',
    title: '全栈开发工程师',
    email: 'xiaoming.zhang@example.com',
    phone: '+86 138-0000-0000',
    location: '北京市 · 朝阳区',
    website: 'https://github.com/yourname',
    summary: '5年前端+全栈开发经验，精通 React 生态系统和 TypeScript，有大型 SaaS 产品架构经验。热爱开源，注重代码质量和用户体验，擅长带领团队高效交付复杂项目。'
  },
  experiences: [
    {
      id: uid(),
      company: '某知名互联网科技公司',
      position: '高级前端工程师 / 技术负责人',
      startDate: '2022-03',
      endDate: '',
      current: true,
      description: '负责企业级 SaaS 平台前端架构与核心模块开发',
      bullets: [
        '主导微前端架构升级，构建效率提升 65%，首屏加载时间减少 48%',
        '设计并落地组件库（80+ 组件），覆盖 5 条产品线 30+ 业务场景',
        '带领 6 人前端团队交付关键项目，代码评审覆盖率 100%',
        '引入性能监控体系，建立 P90/P95/P99 指标看板和告警机制'
      ]
    },
    {
      id: uid(),
      company: '某创业公司',
      position: '全栈开发工程师',
      startDate: '2019-07',
      endDate: '2022-02',
      current: false,
      description: '0-1 搭建公司产品技术体系，前后端全栈开发',
      bullets: [
        '独立完成 Web 端从 0 到 1 的架构设计与开发',
        '使用 Node.js + PostgreSQL 设计并实现 RESTful API 服务',
        '接入 5+ 第三方支付和开放平台，支撑千万级流水交易',
        '优化 SQL 查询和 Redis 缓存，接口 P95 响应时间 < 200ms'
      ]
    }
  ],
  education: [
    {
      id: uid(),
      school: '北京理工大学',
      degree: '硕士',
      field: '计算机科学与技术',
      startDate: '2017-09',
      endDate: '2019-06',
      gpa: '3.8/4.0',
      description: '研究方向：分布式系统与前端工程化。发表论文 2 篇，国家奖学金获得者。'
    },
    {
      id: uid(),
      school: '西安电子科技大学',
      degree: '学士',
      field: '软件工程',
      startDate: '2013-09',
      endDate: '2017-06',
      gpa: '3.6/4.0',
      description: 'ACM-ICPC 亚洲区域赛铜牌；校优秀毕业生。'
    }
  ],
  skills: [
    { id: uid(), name: 'React / Next.js', level: 5, category: '前端框架' },
    { id: uid(), name: 'TypeScript', level: 5, category: '编程语言' },
    { id: uid(), name: 'Node.js', level: 4, category: '编程语言' },
    { id: uid(), name: 'Vue 3 / Nuxt', level: 4, category: '前端框架' },
    { id: uid(), name: 'PostgreSQL', level: 4, category: '数据库' },
    { id: uid(), name: 'Redis', level: 3, category: '数据库' },
    { id: uid(), name: 'Docker / K8s', level: 3, category: 'DevOps' },
    { id: uid(), name: 'AWS / 阿里云', level: 3, category: '云服务' },
    { id: uid(), name: '系统设计', level: 4, category: '综合能力' },
    { id: uid(), name: '团队管理', level: 4, category: '软技能' },
  ],
  projects: [
    {
      id: uid(),
      name: 'WebLinuxOS · 浏览器 Linux 桌面环境',
      link: 'https://github.com/saya-ch/WebLinuxOS',
      description: '在浏览器中打造的完整 Linux 桌面，350+ 应用，真实功能而非模拟。',
      tech: ['React 19', 'TypeScript', 'Vite', 'Zustand', 'Monaco Editor'],
      highlights: [
        'GitHub ⭐ 高星项目，社区活跃贡献者 20+',
        '完整窗口管理系统：拖拽、缩放、虚拟桌面、任务栏',
        '终端支持管道、重定向、90+ 真实命令'
      ]
    },
    {
      id: uid(),
      name: '企业级组件库 UIForge',
      link: '',
      description: '自研 React 组件库，覆盖表单、图表、数据展示三大类 80+ 组件',
      tech: ['React', 'TypeScript', 'Vite', 'Storybook', 'Rollup'],
      highlights: [
        '完善的无障碍支持 (WAI-ARIA)，键盘操作全流程可用',
        '按需加载 + Tree Shaking，平均首屏组件体积下降 40%',
        '配套文档站 + 在线 Playground，月均文档访问 5k+'
      ]
    }
  ],
  languages: [
    { id: uid(), name: '中文', level: '母语' },
    { id: uid(), name: '英语', level: '流利（CET-6 / IELTS 7.0）' },
    { id: uid(), name: '日语', level: '基础（N3）' },
  ],
  awards: [
    { id: uid(), title: '公司年度最佳技术贡献奖', issuer: '某互联网科技公司', date: '2023-12', description: '因架构升级和组件库建设获全公司级表彰' },
    { id: uid(), title: 'ACM-ICPC 亚洲区域赛铜牌', issuer: 'ACM', date: '2015-11', description: '算法竞赛获奖' },
    { id: uid(), title: '国家奖学金', issuer: '教育部', date: '2018-10', description: '研究生国家奖学金，排名前 1%' },
  ],
  templateId: 'tech',
  accentColor: '#2563eb'
}

function loadData(): ResumeData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_DATA, ...parsed }
    }
  } catch {/* noop */}
  return JSON.parse(JSON.stringify(DEFAULT_DATA))
}

export default function ResumeForge() {
  const [data, setData] = useState<ResumeData>(() => loadData())
  const [activeSection, setActiveSection] = useState<SectionKey>('personal')
  const [previewMode, setPreviewMode] = useState<'split' | 'edit' | 'preview'>('split')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [_savedCount, setSavedCount] = useState(0)
  const previewRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto save
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        setSaved(true)
        setSavedCount(n => n + 1)
        setTimeout(() => setSaved(false), 1500)
      } catch {/* noop */}
    }, 600)
    return () => clearTimeout(timer)
  }, [data])

  const updatePersonal = useCallback((patch: Partial<PersonalInfo>) => {
    setData(d => ({ ...d, personal: { ...d.personal, ...patch } }))
  }, [])

  const addExperience = () => setData(d => ({
    ...d,
    experiences: [...d.experiences, {
      id: uid(), company: '', position: '', startDate: '', endDate: '', current: false, description: '', bullets: ['']
    }]
  }))
  const updateExperience = (id: string, patch: Partial<Experience>) =>
    setData(d => ({ ...d, experiences: d.experiences.map(e => e.id === id ? { ...e, ...patch } : e) }))
  const removeExperience = (id: string) => setData(d => ({ ...d, experiences: d.experiences.filter(e => e.id !== id) }))
  const updateExpBullet = (expId: string, i: number, val: string) =>
    setData(d => ({
      ...d,
      experiences: d.experiences.map(e =>
        e.id === expId ? { ...e, bullets: e.bullets.map((b, j) => j === i ? val : b) } : e
      )
    }))
  const addExpBullet = (expId: string) =>
    setData(d => ({
      ...d,
      experiences: d.experiences.map(e => e.id === expId ? { ...e, bullets: [...e.bullets, ''] } : e)
    }))
  const removeExpBullet = (expId: string, i: number) =>
    setData(d => ({
      ...d,
      experiences: d.experiences.map(e =>
        e.id === expId ? { ...e, bullets: e.bullets.filter((_, j) => j !== i) } : e
      )
    }))

  const addEducation = () => setData(d => ({
    ...d,
    education: [...d.education, {
      id: uid(), school: '', degree: '学士', field: '', startDate: '', endDate: '', description: ''
    }]
  }))
  const updateEducation = (id: string, patch: Partial<Education>) =>
    setData(d => ({ ...d, education: d.education.map(e => e.id === id ? { ...e, ...patch } : e) }))
  const removeEducation = (id: string) => setData(d => ({ ...d, education: d.education.filter(e => e.id !== id) }))

  const addSkill = () => setData(d => ({
    ...d,
    skills: [...d.skills, { id: uid(), name: '', level: 3, category: '编程语言' }]
  }))
  const updateSkill = (id: string, patch: Partial<Skill>) =>
    setData(d => ({ ...d, skills: d.skills.map(s => s.id === id ? { ...s, ...patch } : s) }))
  const removeSkill = (id: string) => setData(d => ({ ...d, skills: d.skills.filter(s => s.id !== id) }))

  const addProject = () => setData(d => ({
    ...d,
    projects: [...d.projects, { id: uid(), name: '', link: '', description: '', tech: [], highlights: [] }]
  }))
  const updateProject = (id: string, patch: Partial<Project>) =>
    setData(d => ({ ...d, projects: d.projects.map(p => p.id === id ? { ...p, ...patch } : p) }))
  const removeProject = (id: string) => setData(d => ({ ...d, projects: d.projects.filter(p => p.id !== id) }))

  const addLanguage = () => setData(d => ({
    ...d, languages: [...d.languages, { id: uid(), name: '', level: '流利' }]
  }))
  const updateLanguage = (id: string, patch: Partial<Language>) =>
    setData(d => ({ ...d, languages: d.languages.map(l => l.id === id ? { ...l, ...patch } : l) }))
  const removeLanguage = (id: string) => setData(d => ({ ...d, languages: d.languages.filter(l => l.id !== id) }))

  const addAward = () => setData(d => ({
    ...d, awards: [...d.awards, { id: uid(), title: '', issuer: '', date: '', description: '' }]
  }))
  const updateAward = (id: string, patch: Partial<{ title: string; issuer: string; date: string; description: string }>) =>
    setData(d => ({ ...d, awards: d.awards.map(a => a.id === id ? { ...a, ...patch } : a) }))
  const removeAward = (id: string) => setData(d => ({ ...d, awards: d.awards.filter(a => a.id !== id) }))

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resume-${data.personal.name || 'resume'}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJSON = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        setData({ ...DEFAULT_DATA, ...parsed })
      } catch {
        alert('文件格式错误，无法导入')
      }
    }
    reader.readAsText(file)
  }

  const exportHTML = () => {
    if (!previewRef.current) return
    const styles = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif; color: #1f2937; padding: 24px; max-width: 850px; margin: 0 auto; line-height: 1.6; }
        h1 { font-size: 28px; font-weight: 700; }
        h2 { font-size: 15px; font-weight: 600; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 2px solid ${data.accentColor}; color: ${data.accentColor}; }
        h3 { font-size: 15px; font-weight: 600; color: #111827; }
        p, li { font-size: 13px; color: #374151; }
        ul { padding-left: 20px; }
        li { margin: 3px 0; }
        .meta { font-size: 12px; color: #6b7280; }
        .chip { display: inline-block; padding: 2px 8px; margin: 2px; background: ${data.accentColor}15; color: ${data.accentColor}; border-radius: 4px; font-size: 12px; }
        @media print { body { padding: 0; } }
      </style>
    `
    const html = `<html><head><meta charset="utf-8"><title>${data.personal.name} - 简历</title>${styles}</head><body>${previewRef.current.innerHTML}</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `简历-${data.personal.name}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportMarkdown = () => {
    const p = data.personal
    let md = `# ${p.name}\n**${p.title}**\n\n📧 ${p.email} | 📱 ${p.phone} | 📍 ${p.location}${p.website ? ' | 🌐 ' + p.website : ''}\n\n> ${p.summary}\n\n`
    if (data.experiences.length) {
      md += '## 工作经历\n\n'
      data.experiences.forEach(e => {
        md += `### ${e.position} · ${e.company}\n*${e.startDate} - ${e.current ? '至今' : e.endDate}*\n\n${e.description}\n`
        e.bullets.filter(Boolean).forEach(b => { md += `- ${b}\n` })
        md += '\n'
      })
    }
    if (data.education.length) {
      md += '## 教育背景\n\n'
      data.education.forEach(ed => {
        md += `### ${ed.school}\n${ed.degree} · ${ed.field}${ed.gpa ? ' · GPA ' + ed.gpa : ''}\n*${ed.startDate} - ${ed.endDate}*\n\n${ed.description}\n\n`
      })
    }
    if (data.skills.length) {
      md += '## 技能专长\n\n'
      const cats = new Set(data.skills.map(s => s.category))
      cats.forEach(c => {
        md += `**${c}：** ${data.skills.filter(s => s.category === c).map(s => s.name).join('、')}\n\n`
      })
    }
    if (data.projects.length) {
      md += '## 项目作品\n\n'
      data.projects.forEach(pj => {
        md += `### ${pj.name}${pj.link ? '（' + pj.link + '）' : ''}\n${pj.description}\n技术栈：${pj.tech.join(' / ')}\n`
        pj.highlights.filter(Boolean).forEach(h => { md += `- ${h}\n` })
        md += '\n'
      })
    }
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `简历-${data.personal.name}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyAsMarkdown = () => {
    const p = data.personal
    let md = `# ${p.name}\n**${p.title}**\n\n📧 ${p.email} | 📱 ${p.phone} | 📍 ${p.location}\n\n> ${p.summary}\n\n`
    data.experiences.forEach(e => {
      md += `## ${e.position} @ ${e.company}\n${e.startDate} - ${e.current ? '至今' : e.endDate}\n`
      e.bullets.filter(Boolean).forEach(b => { md += `- ${b}\n` })
    })
    navigator.clipboard?.writeText(md).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500)
    })
  }

  const resetDefaults = () => {
    if (confirm('确定要恢复为默认示例数据吗？当前内容将被覆盖。')) {
      setData(JSON.parse(JSON.stringify(DEFAULT_DATA)))
    }
  }

  // ========== Editor components ==========
  const renderEditor = () => {
    switch (activeSection) {
      case 'personal':
        return (
          <div className="space-y-3">
            {[
              { k: 'name', label: '姓名', icon: <User size={14} />, ph: '你的姓名' },
              { k: 'title', label: '求职目标 / 职位', icon: <Briefcase size={14} />, ph: '例：高级前端工程师' },
              { k: 'email', label: '邮箱', icon: <Mail size={14} />, ph: 'you@example.com' },
              { k: 'phone', label: '电话', icon: <Phone size={14} />, ph: '+86 xxx xxxx xxxx' },
              { k: 'location', label: '所在地', icon: <MapPin size={14} />, ph: '城市 · 区' },
              { k: 'website', label: '个人网站 / GitHub / 作品集', icon: <Globe size={14} />, ph: 'https://...' },
            ].map(({ k, label, icon, ph }) => (
              <div key={k}>
                <label className="flex items-center gap-1.5 text-xs font-medium mb-1" style={{ color: '#9090c0' }}>
                  {icon} {label}
                </label>
                <input
                  value={(data.personal as unknown as Record<string, string>)[k] || ''}
                  onChange={e => updatePersonal({ [k]: e.target.value } as Partial<PersonalInfo>)}
                  placeholder={ph}
                  className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }}
                />
              </div>
            ))}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium mb-1" style={{ color: '#9090c0' }}>
                <FileText size={14} /> 个人简介（2-4 句，突出你的核心价值）
              </label>
              <textarea
                value={data.personal.summary}
                onChange={e => updatePersonal({ summary: e.target.value })}
                rows={5}
                placeholder="N 年 X 领域经验，精通 A/B/C，主导过 N 个 XX 项目…"
                className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all resize-none"
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }}
              />
            </div>
          </div>
        )

      case 'experience':
        return (
          <div className="space-y-5">
            {data.experiences.map((exp, i) => (
              <div key={exp.id} className="p-4 rounded-lg space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold" style={{ color: '#b8a8ff' }}>经历 #{i + 1}</div>
                  <button onClick={() => removeExperience(exp.id)} className="p-1.5 rounded transition-all hover:opacity-80"
                    style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input value={exp.position} onChange={e => updateExperience(exp.id, { position: e.target.value })}
                    placeholder="职位名称" className="px-3 py-2 rounded-md text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
                  <input value={exp.company} onChange={e => updateExperience(exp.id, { company: e.target.value })}
                    placeholder="公司名称" className="px-3 py-2 rounded-md text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
                  <input type="month" value={exp.startDate} onChange={e => updateExperience(exp.id, { startDate: e.target.value })}
                    className="px-3 py-2 rounded-md text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
                  <input type="month" value={exp.endDate} disabled={exp.current}
                    onChange={e => updateExperience(exp.id, { endDate: e.target.value })}
                    placeholder="结束日期" className="px-3 py-2 rounded-md text-sm outline-none disabled:opacity-40"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
                </div>
                <label className="flex items-center gap-2 text-xs" style={{ color: '#9090c0' }}>
                  <input type="checkbox" checked={exp.current}
                    onChange={e => updateExperience(exp.id, { current: e.target.checked, endDate: e.target.checked ? '' : exp.endDate })} />
                  目前仍在此职位
                </label>
                <textarea value={exp.description} onChange={e => updateExperience(exp.id, { description: e.target.value })}
                  rows={2} placeholder="一句话描述这个职位的整体职责" className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium" style={{ color: '#9090c0' }}>成果 / 亮点（每点一行，推荐 STAR 法则）</label>
                    <button onClick={() => addExpBullet(exp.id)} className="text-xs px-2 py-1 rounded transition-all hover:opacity-80"
                      style={{ background: 'rgba(0,214,193,0.1)', color: '#00d6c1' }}>
                      <Plus size={12} className="inline mr-1" />添加一条
                    </button>
                  </div>
                  <div className="space-y-2">
                    {exp.bullets.map((b, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full mt-2.5 flex-shrink-0" style={{ background: '#00d6c1' }} />
                        <input value={b} onChange={e => updateExpBullet(exp.id, j, e.target.value)}
                          placeholder="例：将首屏加载时间从 3.2s 优化到 0.7s，提升 78%"
                          className="flex-1 px-3 py-2 rounded-md text-sm outline-none"
                          style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
                        <button onClick={() => removeExpBullet(exp.id, j)} className="p-1.5 rounded mt-1 transition-all hover:opacity-80"
                          style={{ color: '#888' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addExperience} className="w-full py-2.5 rounded-lg text-sm font-medium border-2 border-dashed transition-all hover:opacity-80 flex items-center justify-center gap-2"
              style={{ borderColor: 'rgba(124,108,240,0.35)', color: '#b8a8ff', background: 'rgba(124,108,240,0.04)' }}>
              <Plus size={15} /> 添加一段工作经历
            </button>
          </div>
        )

      case 'education':
        return (
          <div className="space-y-4">
            {data.education.map((ed) => (
              <div key={ed.id} className="p-4 rounded-lg space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between items-center">
                  <div className="text-xs font-semibold" style={{ color: '#b8a8ff' }}><GraduationCap size={14} className="inline mr-1" />教育经历</div>
                  <button onClick={() => removeEducation(ed.id)} className="p-1.5 rounded" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input value={ed.school} onChange={e => updateEducation(ed.id, { school: e.target.value })} placeholder="学校名称" className="px-3 py-2 rounded-md text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
                  <select value={ed.degree} onChange={e => updateEducation(ed.id, { degree: e.target.value })}
                    className="px-3 py-2 rounded-md text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }}>
                    {['大专', '学士', '硕士', '博士', 'MBA', '其他'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <input value={ed.field} onChange={e => updateEducation(ed.id, { field: e.target.value })} placeholder="专业" className="px-3 py-2 rounded-md text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
                  <input value={ed.gpa || ''} onChange={e => updateEducation(ed.id, { gpa: e.target.value })} placeholder="GPA（可选）" className="px-3 py-2 rounded-md text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
                  <input type="month" value={ed.startDate} onChange={e => updateEducation(ed.id, { startDate: e.target.value })}
                    className="px-3 py-2 rounded-md text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
                  <input type="month" value={ed.endDate} onChange={e => updateEducation(ed.id, { endDate: e.target.value })}
                    className="px-3 py-2 rounded-md text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
                </div>
                <textarea value={ed.description} onChange={e => updateEducation(ed.id, { description: e.target.value })}
                  rows={2} placeholder="主修课程、研究方向、获奖、论文等" className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
              </div>
            ))}
            <button onClick={addEducation} className="w-full py-2.5 rounded-lg text-sm font-medium border-2 border-dashed flex items-center justify-center gap-2"
              style={{ borderColor: 'rgba(124,108,240,0.35)', color: '#b8a8ff', background: 'rgba(124,108,240,0.04)' }}>
              <Plus size={15} /> 添加教育背景
            </button>
          </div>
        )

      case 'skills':
        return (
          <div className="space-y-3">
            {data.skills.map(s => (
              <div key={s.id} className="p-3 rounded-lg flex items-center gap-3"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <input value={s.name} onChange={e => updateSkill(s.id, { name: e.target.value })} placeholder="技能名（如 React、Python）"
                  className="flex-1 px-3 py-1.5 rounded-md text-sm outline-none"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
                <select value={s.category} onChange={e => updateSkill(s.id, { category: e.target.value })}
                  className="px-2 py-1.5 rounded-md text-xs outline-none"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff', width: 110 }}>
                  {['编程语言', '前端框架', '后端框架', '数据库', 'DevOps', '云服务', '综合能力', '软技能'].map(o => <option key={o}>{o}</option>)}
                </select>
                <div className="flex items-center gap-1" title="熟练度">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => updateSkill(s.id, { level: n })}
                      className="w-5 h-5 rounded-sm transition-all"
                      style={{ background: n <= s.level ? '#00d6c1' : 'rgba(255,255,255,0.08)' }} />
                  ))}
                </div>
                <button onClick={() => removeSkill(s.id)} className="p-1.5 rounded" style={{ color: '#ef4444' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button onClick={addSkill} className="w-full py-2.5 rounded-lg text-sm font-medium border-2 border-dashed flex items-center justify-center gap-2"
              style={{ borderColor: 'rgba(0,214,193,0.35)', color: '#8ff0e5', background: 'rgba(0,214,193,0.04)' }}>
              <Plus size={15} /> 添加技能
            </button>
          </div>
        )

      case 'projects':
        return (
          <div className="space-y-4">
            {data.projects.map(p => (
              <div key={p.id} className="p-4 rounded-lg space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between items-center">
                  <div className="text-xs font-semibold" style={{ color: '#b8a8ff' }}><FolderOpen size={14} className="inline mr-1" />项目</div>
                  <button onClick={() => removeProject(p.id)} className="p-1.5 rounded" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input value={p.name} onChange={e => updateProject(p.id, { name: e.target.value })} placeholder="项目名称"
                    className="px-3 py-2 rounded-md text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
                  <input value={p.link} onChange={e => updateProject(p.id, { link: e.target.value })} placeholder="项目链接（GitHub / Demo）"
                    className="px-3 py-2 rounded-md text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
                </div>
                <textarea value={p.description} onChange={e => updateProject(p.id, { description: e.target.value })}
                  rows={2} placeholder="项目简介（1-2 句）" className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
                <input value={p.tech.join(', ')}
                  onChange={e => updateProject(p.id, { tech: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  placeholder="技术栈（逗号分隔，如：React, TypeScript, Vite, Node.js）"
                  className="w-full px-3 py-2 rounded-md text-sm outline-none"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
                <input value={p.highlights.join('\n')}
                  onChange={e => updateProject(p.id, { highlights: e.target.value.split('\n').filter(Boolean) })}
                  placeholder="项目亮点，每行一条（产出、数据、影响力）"
                  className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff', minHeight: 72 }} />
              </div>
            ))}
            <button onClick={addProject} className="w-full py-2.5 rounded-lg text-sm font-medium border-2 border-dashed flex items-center justify-center gap-2"
              style={{ borderColor: 'rgba(124,108,240,0.35)', color: '#b8a8ff', background: 'rgba(124,108,240,0.04)' }}>
              <Plus size={15} /> 添加项目作品
            </button>
          </div>
        )

      case 'languages':
        return (
          <div className="space-y-3">
            {data.languages.map(l => (
              <div key={l.id} className="p-3 rounded-lg flex items-center gap-3"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Globe size={16} style={{ color: '#00d6c1' }} />
                <input value={l.name} onChange={e => updateLanguage(l.id, { name: e.target.value })} placeholder="语言名（中文、英语...）"
                  className="flex-1 px-3 py-1.5 rounded-md text-sm outline-none"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
                <select value={l.level} onChange={e => updateLanguage(l.id, { level: e.target.value })}
                  className="px-3 py-1.5 rounded-md text-xs outline-none"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }}>
                  {['母语', '精通', '流利', '熟练', '日常交流', '基础'].map(o => <option key={o}>{o}</option>)}
                </select>
                <button onClick={() => removeLanguage(l.id)} className="p-1.5 rounded" style={{ color: '#ef4444' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button onClick={addLanguage} className="w-full py-2.5 rounded-lg text-sm font-medium border-2 border-dashed flex items-center justify-center gap-2"
              style={{ borderColor: 'rgba(0,214,193,0.35)', color: '#8ff0e5', background: 'rgba(0,214,193,0.04)' }}>
              <Plus size={15} /> 添加语言
            </button>
          </div>
        )

      case 'awards':
        return (
          <div className="space-y-4">
            {data.awards.map(a => (
              <div key={a.id} className="p-4 rounded-lg space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between items-center">
                  <div className="text-xs font-semibold" style={{ color: '#b8a8ff' }}><Award size={14} className="inline mr-1" />奖项 / 荣誉</div>
                  <button onClick={() => removeAward(a.id)} className="p-1.5 rounded" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input value={a.title} onChange={e => updateAward(a.id, { title: e.target.value })} placeholder="奖项名称"
                    className="px-3 py-2 rounded-md text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
                  <input value={a.issuer} onChange={e => updateAward(a.id, { issuer: e.target.value })} placeholder="颁发机构"
                    className="px-3 py-2 rounded-md text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
                  <input value={a.date} onChange={e => updateAward(a.id, { date: e.target.value })} placeholder="获奖时间（如 2023-12）"
                    className="px-3 py-2 rounded-md text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
                </div>
                <textarea value={a.description} onChange={e => updateAward(a.id, { description: e.target.value })}
                  rows={2} placeholder="补充说明（可选）" className="w-full px-3 py-2 rounded-md text-sm outline-none resize-none"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(124,108,240,0.2)', color: '#e8e8ff' }} />
              </div>
            ))}
            <button onClick={addAward} className="w-full py-2.5 rounded-lg text-sm font-medium border-2 border-dashed flex items-center justify-center gap-2"
              style={{ borderColor: 'rgba(124,108,240,0.35)', color: '#b8a8ff', background: 'rgba(124,108,240,0.04)' }}>
              <Plus size={15} /> 添加奖项
            </button>
          </div>
        )
    }
  }

  // ========== Preview (tech template) ==========
  const renderPreview = () => {
    const p = data.personal
    const accent = data.accentColor
    const template = data.templateId

    return (
      <div ref={previewRef} style={{
        background: '#ffffff',
        color: '#1f2937',
        padding: template === 'modern' ? '48px 56px' : '36px 44px',
        minHeight: '100%',
        fontFamily: template === 'classic'
          ? "'Times New Roman', 'Noto Serif SC', serif"
          : "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', 'PingFang SC', sans-serif",
        lineHeight: 1.62,
        fontSize: 13.5
      }}>
        {/* Header */}
        <div style={{ textAlign: template === 'creative' ? 'center' : 'left' }}>
          <h1 style={{
            fontSize: template === 'modern' ? 36 : 30,
            fontWeight: 800,
            letterSpacing: template === 'classic' ? 0 : -0.5,
            color: template === 'creative' ? accent : '#111827',
            marginBottom: 6
          }}>{p.name || '你的姓名'}</h1>
          <div style={{
            fontSize: 16, fontWeight: 600, color: accent, marginBottom: 10
          }}>{p.title || '求职目标'}</div>
          <div style={{
            fontSize: 12.5, color: '#4b5563', display: 'flex',
            justifyContent: template === 'creative' ? 'center' : 'flex-start',
            flexWrap: 'wrap', gap: '6px 18px'
          }}>
            {p.email && <span>📧 {p.email}</span>}
            {p.phone && <span>📱 {p.phone}</span>}
            {p.location && <span>📍 {p.location}</span>}
            {p.website && <span>🌐 {p.website}</span>}
          </div>
        </div>

        {/* 两栏布局（tech/creative） */}
        <div style={{
          display: template === 'tech' || template === 'creative' ? 'grid' : 'block',
          gridTemplateColumns: template === 'tech' ? '240px 1fr' : (template === 'creative' ? '280px 1fr' : '1fr'),
          gap: 28,
          marginTop: 22
        }}>
          {/* 左侧栏 (两栏模板) */}
          {(template === 'tech' || template === 'creative') && (
            <div style={{
              padding: template === 'creative' ? '20px 18px' : '18px 16px',
              background: template === 'creative'
                ? `linear-gradient(180deg, ${accent}0d, #ffffff00)`
                : '#f8fafc',
              borderRadius: 10,
              borderTop: template === 'tech' ? `3px solid ${accent}` : undefined,
              fontSize: 12.5
            }}>
              {data.skills.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{
                    fontSize: 13, fontWeight: 700, color: accent,
                    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10
                  }}>核心技能</h3>
                  <div>
                    {Array.from(new Set(data.skills.map(s => s.category))).map(cat => (
                      <div key={cat} style={{ marginBottom: 10 }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: '#374151', marginBottom: 4 }}>{cat}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {data.skills.filter(s => s.category === cat).map(s => (
                            <span key={s.id} style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              fontSize: 11,
                              borderRadius: 3,
                              background: `${accent}12`,
                              color: '#374151'
                            }}>{s.name}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.education.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{
                    fontSize: 13, fontWeight: 700, color: accent,
                    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10
                  }}>教育背景</h3>
                  {data.education.map(ed => (
                    <div key={ed.id} style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: 600, fontSize: 12.5, color: '#111827' }}>{ed.school}</div>
                      <div style={{ fontSize: 11.5, color: '#6b7280' }}>
                        {ed.degree} · {ed.field}
                        {ed.gpa && <span> · GPA {ed.gpa}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{ed.startDate} - {ed.endDate}</div>
                    </div>
                  ))}
                </div>
              )}
              {data.languages.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{
                    fontSize: 13, fontWeight: 700, color: accent,
                    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10
                  }}>语言能力</h3>
                  {data.languages.map(l => (
                    <div key={l.id} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '3px 0', fontSize: 12,
                      borderBottom: '1px dashed #e5e7eb'
                    }}>
                      <span style={{ color: '#374151' }}>{l.name}</span>
                      <span style={{ color: '#6b7280' }}>{l.level}</span>
                    </div>
                  ))}
                </div>
              )}
              {data.awards.length > 0 && (
                <div>
                  <h3 style={{
                    fontSize: 13, fontWeight: 700, color: accent,
                    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10
                  }}>奖项荣誉</h3>
                  {data.awards.map(a => (
                    <div key={a.id} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{a.title}</div>
                      <div style={{ fontSize: 10.5, color: '#6b7280' }}>{a.issuer} · {a.date}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 主内容区 */}
          <div>
            {p.summary && (
              <div style={{
                padding: template === 'modern' ? '16px 20px' : '14px 18px',
                background: template === 'modern' ? `${accent}08` : '#f9fafb',
                borderLeft: `4px solid ${accent}`,
                borderRadius: template === 'creative' ? 10 : 4,
                marginBottom: 22,
                fontSize: 13.5,
                color: '#374151',
                fontStyle: template === 'classic' ? 'italic' : 'normal'
              }}>
                {p.summary}
              </div>
            )}

            {/* 单栏模式：这些section在左侧；两栏模式：在主内容 */}
            {(template === 'classic' || template === 'modern') && (
              <>
                {data.skills.length > 0 && (
                  <Section title="技能专长" accent={accent}>
                    <div>
                      {Array.from(new Set(data.skills.map(s => s.category))).map(cat => (
                        <div key={cat} style={{ marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, color: '#374151', fontSize: 13 }}>{cat}：</span>
                          <span style={{ color: '#4b5563' }}>
                            {data.skills.filter(s => s.category === cat).map(s => s.name).join('、')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}
              </>
            )}

            {data.experiences.length > 0 && (
              <Section title="工作经历" accent={accent}>
                {data.experiences.map(e => (
                  <div key={e.id} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 14.5, color: '#111827' }}>{e.position || '职位'}</span>
                        <span style={{ color: '#6b7280', margin: '0 8px' }}>@</span>
                        <span style={{ fontWeight: 600, color: accent }}>{e.company || '公司'}</span>
                      </div>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        {e.startDate} - {e.current ? '至今' : e.endDate}
                      </span>
                    </div>
                    {e.description && <div style={{ margin: '4px 0 6px', color: '#4b5563', fontSize: 13 }}>{e.description}</div>}
                    {e.bullets.filter(Boolean).length > 0 && (
                      <ul style={{ paddingLeft: 18, margin: 0 }}>
                        {e.bullets.filter(Boolean).map((b, i) => (
                          <li key={i} style={{ color: '#374151', margin: '3px 0', lineHeight: 1.65 }}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </Section>
            )}

            {data.projects.length > 0 && (
              <Section title="项目作品" accent={accent}>
                {data.projects.map(pj => (
                  <div key={pj.id} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{pj.name || '项目名'}</span>
                      {pj.link && <a style={{ fontSize: 12, color: accent, textDecoration: 'none' }}>{pj.link}</a>}
                    </div>
                    {pj.description && <div style={{ margin: '3px 0', color: '#4b5563', fontSize: 13 }}>{pj.description}</div>}
                    {pj.tech.length > 0 && (
                      <div style={{ margin: '6px 0', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {pj.tech.map((t, i) => (
                          <span key={i} style={{
                            display: 'inline-block',
                            padding: '1px 8px',
                            background: `${accent}10`,
                            color: accent,
                            fontSize: 11,
                            borderRadius: 3,
                            fontWeight: 500
                          }}>{t}</span>
                        ))}
                      </div>
                    )}
                    {pj.highlights.filter(Boolean).length > 0 && (
                      <ul style={{ paddingLeft: 18, margin: 0 }}>
                        {pj.highlights.filter(Boolean).map((h, i) => (
                          <li key={i} style={{ color: '#374151', lineHeight: 1.65 }}>{h}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </Section>
            )}

            {(template === 'classic' || template === 'modern') && (
              <>
                {data.education.length > 0 && (
                  <Section title="教育背景" accent={accent}>
                    {data.education.map(ed => (
                      <div key={ed.id} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                          <div>
                            <span style={{ fontWeight: 700, color: '#111827' }}>{ed.school}</span>
                            <span style={{ color: '#6b7280', margin: '0 6px' }}>·</span>
                            <span style={{ color: '#4b5563' }}>{ed.degree} · {ed.field}</span>
                            {ed.gpa && <span style={{ color: accent, marginLeft: 8, fontSize: 12 }}>GPA {ed.gpa}</span>}
                          </div>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>{ed.startDate} - {ed.endDate}</span>
                        </div>
                        {ed.description && <div style={{ marginTop: 3, color: '#4b5563', fontSize: 12.5 }}>{ed.description}</div>}
                      </div>
                    ))}
                  </Section>
                )}
                {data.languages.length > 0 && (
                  <Section title="语言能力" accent={accent}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
                      {data.languages.map(l => (
                        <div key={l.id}>
                          <span style={{ fontWeight: 600 }}>{l.name}</span>
                          <span style={{ color: '#6b7280' }}> · {l.level}</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}
                {data.awards.length > 0 && (
                  <Section title="奖项荣誉" accent={accent}>
                    {data.awards.map(a => (
                      <div key={a.id} style={{ marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>{a.title}</span>
                        <span style={{ color: '#6b7280' }}> — {a.issuer} · {a.date}</span>
                      </div>
                    ))}
                  </Section>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col" style={{
      background: 'linear-gradient(135deg, #0f0f23 0%, #151533 50%, #0f1830 100%)',
      color: '#e8e8ff'
    }}>
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(124,108,240,0.2)', background: 'rgba(124,108,240,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00d6c1, #2563eb)' }}>
            <FileText size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight flex items-center gap-2">
              ResumeForge · 简历工坊
              <Sparkles size={16} style={{ color: '#fcd34d' }} />
            </div>
            <div className="text-xs" style={{ color: '#8888aa' }}>
              4 种专业模板 · 实时预览 · HTML / MD / JSON 三种导出 · 自动保存 {saved && <Check size={11} className="inline ml-1" style={{ color: '#10b981' }} />}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            {(['edit', 'split', 'preview'] as const).map(m => (
              <button key={m} onClick={() => setPreviewMode(m)} className="px-3 py-1.5 text-xs transition-all"
                style={{
                  background: previewMode === m ? 'rgba(124,108,240,0.25)' : 'transparent',
                  color: previewMode === m ? '#b8a8ff' : '#8888aa',
                  fontWeight: previewMode === m ? 600 : 400
                }}>
                {m === 'edit' && <><ChevronLeft size={11} className="inline mr-1" />编辑</>}
                {m === 'split' && '分屏'}
                {m === 'preview' && <>预览<Eye size={11} className="inline ml-1" /></>}
              </button>
            ))}
          </div>
          <div className="w-px h-6 mx-1" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <button onClick={() => window.print()} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#aaaacc', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Printer size={13} /> 打印 / 另存 PDF
          </button>
          <div className="relative group">
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:opacity-80"
              style={{ background: 'linear-gradient(135deg, #7c6cf0, #00d6c1)', color: '#fff' }}>
              <Download size={13} /> 导出 ▾
            </button>
            <div className="absolute right-0 mt-2 w-48 rounded-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50"
              style={{ background: '#1a1a2e', border: '1px solid rgba(124,108,240,0.25)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
              {[
                { fn: exportHTML, label: '导出为 HTML（可浏览器打开）', icon: <Globe size={13} /> },
                { fn: exportMarkdown, label: '导出为 Markdown', icon: <FileText size={13} /> },
                { fn: exportJSON, label: '导出 JSON（可再次导入）', icon: <Save size={13} /> },
              ].map((item, i) => (
                <button key={i} onClick={item.fn} className="w-full px-3 py-2 text-xs text-left flex items-center gap-2 hover:opacity-80 transition-all"
                  style={{ color: '#c0c0ee' }}>
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={copyAsMarkdown} className="p-1.5 rounded-md transition-all hover:opacity-80" title="复制 Markdown"
            style={{ background: 'rgba(0,214,193,0.1)', color: copied ? '#10b981' : '#00d6c1' }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden"
            onChange={e => e.target.files?.[0] && importJSON(e.target.files[0])} />
          <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-md transition-all hover:opacity-80" title="导入 JSON"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#aaaacc' }}>
            <Upload size={14} />
          </button>
          <button onClick={resetDefaults} className="p-1.5 rounded-md transition-all hover:opacity-80" title="重置示例"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Sub header: template + color */}
      <div className="px-5 py-3 border-b flex items-center justify-between flex-wrap gap-3"
        style={{ borderColor: 'rgba(124,108,240,0.12)', background: 'rgba(0,0,0,0.15)' }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium" style={{ color: '#8888aa' }}>简历模板：</span>
          {TEMPLATES.map(t => (
            <button key={t.id} onClick={() => setData(d => ({ ...d, templateId: t.id }))}
              className="px-3 py-1.5 rounded-md text-xs transition-all flex flex-col items-start"
              style={{
                background: data.templateId === t.id ? 'rgba(0,214,193,0.12)' : 'rgba(255,255,255,0.02)',
                color: data.templateId === t.id ? '#8ff0e5' : '#aaaacc',
                border: data.templateId === t.id ? '1px solid rgba(0,214,193,0.3)' : '1px solid rgba(255,255,255,0.06)',
                minWidth: 110
              }}>
              <span className="font-semibold">{t.name}</span>
              <span className="text-[10px] opacity-70 mt-0.5">{t.desc}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: '#8888aa' }}>主题色：</span>
          {ACCENT_COLORS.map(c => (
            <button key={c} onClick={() => setData(d => ({ ...d, accentColor: c }))}
              className="w-6 h-6 rounded-full transition-all"
              style={{
                background: c,
                transform: data.accentColor === c ? 'scale(1.25)' : 'scale(1)',
                boxShadow: data.accentColor === c ? `0 0 0 2px ${c}55, 0 0 15px ${c}88` : 'none',
                border: data.accentColor === c ? '2px solid #fff' : '2px solid rgba(255,255,255,0.1)'
              }} />
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sections sidebar (editor mode) */}
        {previewMode !== 'preview' && (
          <div className="w-48 flex-shrink-0 border-r p-3 overflow-y-auto"
            style={{ borderColor: 'rgba(124,108,240,0.12)', background: 'rgba(0,0,0,0.15)' }}>
            {SECTIONS.map(s => {
              const countMap: Record<string, number> = {
                personal: 1,
                experience: data.experiences.length,
                education: data.education.length,
                skills: data.skills.length,
                projects: data.projects.length,
                languages: data.languages.length,
                awards: data.awards.length,
              }
              return (
                <button key={s.key} onClick={() => setActiveSection(s.key)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-xs mb-1 transition-all text-left"
                  style={{
                    background: activeSection === s.key ? 'rgba(124,108,240,0.2)' : 'transparent',
                    color: activeSection === s.key ? '#e8e8ff' : '#9090c0',
                    fontWeight: activeSection === s.key ? 600 : 400,
                    borderLeft: activeSection === s.key ? '3px solid #b8a8ff' : '3px solid transparent'
                  }}>
                  <span style={{ color: activeSection === s.key ? '#00d6c1' : '#6666aa' }}>{s.icon}</span>
                  <span className="flex-1">{s.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>{countMap[s.key]}</span>
                </button>
              )
            })}
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="text-[10px] mb-2 px-2" style={{ color: '#555577' }}>💡 小贴士</div>
              <div className="text-[11px] leading-relaxed px-2 space-y-1.5" style={{ color: '#666688' }}>
                <div>• 内容 600ms 自动保存至浏览器</div>
                <div>• 导出 JSON 随时备份迁移</div>
                <div>• 打印 → 另存为 PDF 即可投递</div>
                <div>• 点击「载入示例」可快速体验</div>
              </div>
            </div>
          </div>
        )}

        {/* Editor panel */}
        {previewMode !== 'preview' && (
          <div className="flex-1 min-w-0 overflow-y-auto p-5" style={{
            borderRight: previewMode === 'split' ? '1px solid rgba(124,108,240,0.12)' : undefined
          }}>
            <div className="max-w-2xl mx-auto">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#f0f0ff' }}>
                {SECTIONS.find(s => s.key === activeSection)?.icon}
                {SECTIONS.find(s => s.key === activeSection)?.label}
              </h2>
              {renderEditor()}
            </div>
          </div>
        )}

        {/* Preview panel */}
        {previewMode !== 'edit' && (
          <div className="flex-1 min-w-0 overflow-auto p-6" style={{ background: '#e5e7eb' }}>
            <div className="mx-auto" style={{
              maxWidth: 850,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              {renderPreview()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h2 style={{
        fontSize: 15,
        fontWeight: 700,
        color: accent,
        paddingBottom: 5,
        marginBottom: 12,
        borderBottom: `2px solid ${accent}`,
        letterSpacing: 0.3,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <span style={{
          display: 'inline-block', width: 5, height: 15, background: accent, borderRadius: 2
        }} />
        {title}
      </h2>
      {children}
    </section>
  )
}
