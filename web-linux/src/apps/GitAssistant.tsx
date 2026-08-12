import { useState, useMemo, useCallback } from 'react'
import { useStore } from '../store'
import {
  GitBranch,
  BookOpen,
  GitMerge,
  Wand2,
  ClipboardCheck,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Play,
  Sparkles,
  Terminal,
  Search,
  Star,
  X,
} from 'lucide-react'

/* ───────────────────────── 类型定义 ───────────────────────── */

type TabId = 'cheatsheet' | 'tutorial' | 'workflow' | 'generator' | 'convention'

interface CheatCommand {
  cmd: string
  desc: string
  category: string
  examples: string[]
}

interface TutorialStep {
  title: string
  desc: string
  commands: string[]
  hint?: string
}

interface WorkflowNode {
  id: string
  label: string
  type: 'commit' | 'branch' | 'merge' | 'base'
  x: number
  y: number
  branch: string
}

interface GenOption {
  key: string
  label: string
  type: 'select' | 'input'
  options?: string[]
  placeholder?: string
}

interface GenPreset {
  id: string
  label: string
  icon: string
  description: string
  template: string
  options: GenOption[]
}

/* ───────────────────────── 数据 ───────────────────────── */

const CHEAT_COMMANDS: CheatCommand[] = [
  { cmd: 'git init', desc: '初始化新仓库', category: '基础', examples: ['git init', 'git init my-project'] },
  { cmd: 'git clone', desc: '克隆远程仓库', category: '基础', examples: ['git clone <url>', 'git clone --depth 1 <url>'] },
  { cmd: 'git status', desc: '查看工作区状态', category: '基础', examples: ['git status', 'git status -sb'] },
  { cmd: 'git add', desc: '添加文件到暂存区', category: '基础', examples: ['git add .', 'git add src/*.ts'] },
  { cmd: 'git commit', desc: '提交修改', category: '基础', examples: ['git commit -m "msg"', 'git commit --amend'] },
  { cmd: 'git diff', desc: '查看差异', category: '基础', examples: ['git diff', 'git diff --staged'] },
  { cmd: 'git log', desc: '查看提交历史', category: '基础', examples: ['git log --oneline', 'git log --graph --all'] },
  { cmd: 'git branch', desc: '分支管理', category: '分支', examples: ['git branch', 'git branch -d <name>'] },
  { cmd: 'git checkout', desc: '切换分支/恢复文件', category: '分支', examples: ['git checkout <branch>', 'git checkout -b <name>'] },
  { cmd: 'git switch', desc: '切换分支(推荐)', category: '分支', examples: ['git switch <branch>', 'git switch -c <name>'] },
  { cmd: 'git merge', desc: '合并分支', category: '分支', examples: ['git merge <branch>', 'git merge --no-ff <branch>'] },
  { cmd: 'git rebase', desc: '变基操作', category: '分支', examples: ['git rebase <branch>', 'git rebase -i HEAD~3'] },
  { cmd: 'git remote', desc: '远程仓库管理', category: '远程', examples: ['git remote -v', 'git remote add <name> <url>'] },
  { cmd: 'git fetch', desc: '拉取远程更新', category: '远程', examples: ['git fetch origin', 'git fetch --all --prune'] },
  { cmd: 'git pull', desc: '拉取并合并', category: '远程', examples: ['git pull', 'git pull --rebase'] },
  { cmd: 'git push', desc: '推送到远程', category: '远程', examples: ['git push', 'git push -u origin <branch>'] },
  { cmd: 'git stash', desc: '暂存工作区修改', category: '暂存', examples: ['git stash', 'git stash pop'] },
  { cmd: 'git reset', desc: '撤销提交', category: '撤销', examples: ['git reset --soft HEAD~1', 'git reset --hard HEAD~1'] },
  { cmd: 'git revert', desc: '安全撤销提交', category: '撤销', examples: ['git revert <commit>'] },
  { cmd: 'git restore', desc: '丢弃修改', category: '撤销', examples: ['git restore <file>', 'git restore --staged <file>'] },
  { cmd: 'git tag', desc: '标签管理', category: '标签', examples: ['git tag', 'git tag -a v1.0 -m "msg"'] },
  { cmd: 'git blame', desc: '逐行查看作者', category: '调试', examples: ['git blame <file>', 'git blame -L 10,20 <file>'] },
  { cmd: 'git reflog', desc: '查看引用日志', category: '调试', examples: ['git reflog'] },
]

const CHEAT_CATEGORIES = ['全部', '基础', '分支', '远程', '暂存', '撤销', '标签', '调试']

const TUTORIALS: TutorialStep[][] = [
  [
    { title: '初始化仓库', desc: '在项目目录创建 Git 仓库并做首次提交', commands: ['git init', 'git add .', 'git commit -m "feat: 初始提交"'] },
    { title: '创建开发分支', desc: '基于 main 创建 feature 分支进行开发', commands: ['git checkout -b feature/login', 'git add .', 'git commit -m "feat: 实现登录功能"'] },
    { title: '推送到远程', desc: '首次推送并设置上游分支', commands: ['git remote add origin <url>', 'git push -u origin feature/login'] },
    { title: '创建 Pull Request', desc: '在 GitHub/GitLab 上发起 PR，代码审查后合并', commands: ['git checkout main', 'git pull', 'git merge feature/login', 'git push'] },
  ],
  [
    { title: '功能开发工作流', desc: '新功能开发的完整流程', commands: ['git checkout main', 'git pull origin main', 'git checkout -b feature/new-feature'] },
    { title: '编码与提交', desc: '完成功能开发，阶段性提交代码', commands: ['git add .', 'git commit -m "feat: 添加新功能"'] },
    { title: '保持分支更新', desc: '同步 main 分支最新代码，避免冲突', commands: ['git fetch origin', 'git rebase origin/main'] },
    { title: '完成合并', desc: '功能完成后合并回 main 分支', commands: ['git checkout main', 'git pull', 'git merge feature/new-feature', 'git push'] },
  ],
  [
    { title: 'Hotfix 紧急修复', desc: '线上 Bug 修复的快速流程', commands: ['git checkout main', 'git pull', 'git checkout -b hotfix/bug-fix'] },
    { title: '修复并提交', desc: '修复 Bug 并提交', commands: ['git add .', 'git commit -m "fix: 修复登录崩溃"'] },
    { title: '快速合并发布', desc: '合并到 main 并打标签发布', commands: ['git checkout main', 'git merge --no-ff hotfix/bug-fix', 'git tag -a v1.0.1 -m "fix 登录崩溃"', 'git push --tags'] },
  ],
]

const WORKFLOW_DATA: WorkflowNode[] = [
  { id: 'c1', label: 'commit 1', type: 'commit', x: 60, y: 100, branch: 'main' },
  { id: 'c2', label: 'commit 2', type: 'commit', x: 180, y: 100, branch: 'main' },
  { id: 'c3', label: 'commit 3', type: 'commit', x: 300, y: 100, branch: 'main' },
  { id: 'b1', label: 'feature', type: 'branch', x: 180, y: 220, branch: 'feature' },
  { id: 'c4', label: 'commit 4', type: 'commit', x: 300, y: 220, branch: 'feature' },
  { id: 'c5', label: 'commit 5', type: 'commit', x: 420, y: 220, branch: 'feature' },
  { id: 'm1', label: 'merge', type: 'merge', x: 420, y: 100, branch: 'main' },
]

const GEN_PRESETS: GenPreset[] = [
  {
    id: 'commit',
    label: '提交',
    icon: '💾',
    description: '生成 git commit 命令',
    template: 'git commit -m "{{type}}: {{message}}"',
    options: [
      { key: 'type', label: '提交类型', type: 'select', options: ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'] },
      { key: 'message', label: '提交信息', type: 'input', placeholder: '简要描述本次修改' },
    ],
  },
  {
    id: 'branch',
    label: '分支操作',
    icon: '🌿',
    description: '创建/切换/删除分支',
    template: '{{command}} {{branch}}',
    options: [
      { key: 'command', label: '操作', type: 'select', options: ['git checkout -b', 'git checkout', 'git switch -c', 'git switch', 'git branch -d', 'git branch'] },
      { key: 'branch', label: '分支名', type: 'input', placeholder: '如 feature/login' },
    ],
  },
  {
    id: 'remote',
    label: '远程操作',
    icon: '☁️',
    description: 'push/pull/fetch',
    template: 'git {{action}} {{remote}} {{branch}}',
    options: [
      { key: 'action', label: '操作', type: 'select', options: ['push', 'push -u', 'pull', 'pull --rebase', 'fetch'] },
      { key: 'remote', label: '远程', type: 'input', placeholder: 'origin' },
      { key: 'branch', label: '分支', type: 'input', placeholder: 'main' },
    ],
  },
  {
    id: 'merge',
    label: '合并/变基',
    icon: '🔀',
    description: 'merge / rebase / cherry-pick',
    template: 'git {{command}} {{target}}',
    options: [
      { key: 'command', label: '命令', type: 'select', options: ['merge', 'merge --no-ff', 'rebase', 'rebase -i HEAD~3', 'cherry-pick', 'reset --soft HEAD~1', 'reset --hard HEAD~1'] },
      { key: 'target', label: '目标', type: 'input', placeholder: '分支名或 commit hash' },
    ],
  },
  {
    id: 'undo',
    label: '撤销操作',
    icon: '↩️',
    description: 'restore / reset / revert',
    template: 'git {{command}} {{target}}',
    options: [
      { key: 'command', label: '命令', type: 'select', options: ['restore', 'restore --staged', 'reset --soft HEAD~1', 'reset --mixed HEAD~1', 'reset --hard HEAD~1', 'revert'] },
      { key: 'target', label: '目标', type: 'input', placeholder: '文件路径或 commit hash' },
    ],
  },
  {
    id: 'stash',
    label: '暂存操作',
    icon: '📦',
    description: 'stash 工作区修改',
    template: 'git stash {{action}} "{{message}}"',
    options: [
      { key: 'action', label: '操作', type: 'select', options: ['push -m', 'push -u -m', 'pop', 'apply', 'list', 'drop'] },
      { key: 'message', label: '说明', type: 'input', placeholder: 'WIP 正在开发的功能' },
    ],
  },
]

const CONVENTIONAL_TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert']
const CONVENTIONAL_SCOPES = ['core', 'ui', 'api', 'auth', 'db', 'docs', 'tests', 'config', 'deps']

const TAB_DEFS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'cheatsheet', label: '命令速查', icon: <Terminal size={14} /> },
  { id: 'tutorial', label: '交互教程', icon: <BookOpen size={14} /> },
  { id: 'workflow', label: '工作流', icon: <GitMerge size={14} /> },
  { id: 'generator', label: '命令生成', icon: <Wand2 size={14} /> },
  { id: 'convention', label: '提交规范', icon: <ClipboardCheck size={14} /> },
]

/* ───────────────────────── 工具函数 ───────────────────────── */

const GLASS: React.CSSProperties = {
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid var(--window-border)',
}

const CARD: React.CSSProperties = {
  ...GLASS,
  borderRadius: 12,
  padding: 14,
  marginBottom: 10,
  transition: 'all 0.2s ease',
}

const CODE_BLOCK: React.CSSProperties = {
  background: 'rgba(0,0,0,0.25)',
  borderRadius: 8,
  padding: '8px 12px',
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: 12,
  color: '#a5d6ff',
  border: '1px solid rgba(255,255,255,0.06)',
  overflow: 'auto',
  whiteSpace: 'pre',
  lineHeight: 1.6,
}

function highlightCode(code: string) {
  return code.replace(
    /\b(git|add|commit|push|pull|merge|rebase|checkout|branch|switch|remote|fetch|stash|reset|revert|restore|diff|log|init|clone|tag|blame|reflog|rm|mv|config|diff)\b/g,
    '<span style="color:#f97583;font-weight:600">$1</span>'
  ).replace(
    /("[^"]*")/g,
    '<span style="color:#89ddff">$1</span>'
  ).replace(
    /\b(-{1,2}\w+)\b/g,
    '<span style="color:#ffb86c">$1</span>'
  )
}

/* ───────────────────────── 主组件 ───────────────────────── */

export default function GitAssistant() {
  const { theme } = useStore()
  const isDark = theme === 'dark'
  const [activeTab, setActiveTab] = useState<TabId>('cheatsheet')

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: isDark
          ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
          : 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes ga-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ga-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes ga-flow { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }
        .ga-fade-in { animation: ga-fade-in 0.35s ease-out; }
        .ga-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .ga-scroll::-webkit-scrollbar-track { background: transparent; }
        .ga-scroll::-webkit-scrollbar-thumb { background: var(--window-border); border-radius: 3px; }
        .ga-scroll::-webkit-scrollbar-thumb:hover { background: var(--accent); }
        .ga-flow-line { stroke-dasharray: 6 4; animation: ga-flow 1s linear infinite; }
      `}</style>

      <Header isDark={isDark} />
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} />

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div key={activeTab} style={{ height: '100%', padding: '16px 20px', overflow: 'auto' }} className="ga-scroll ga-fade-in">
          {activeTab === 'cheatsheet' && <CheatPanel isDark={isDark} />}
          {activeTab === 'tutorial' && <TutorialPanel isDark={isDark} />}
          {activeTab === 'workflow' && <WorkflowPanel isDark={isDark} />}
          {activeTab === 'generator' && <GeneratorPanel isDark={isDark} />}
          {activeTab === 'convention' && <ConventionPanel isDark={isDark} />}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── Header ───────────────────────── */

function Header({ isDark }: { isDark: boolean }) {
  return (
    <div
      style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        borderBottom: '1px solid var(--window-border)',
        background: isDark
          ? 'rgba(15,12,41,0.6)'
          : 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #f05032 0%, #f29237 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(240,80,50,0.35)',
        }}
      >
        <GitBranch size={20} color="white" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>Git 助手</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>版本控制全能工具 · 命令速查 / 教程 / 可视化 / 生成 / 规范</div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          padding: '6px 12px',
          borderRadius: 20,
          background: isDark ? 'rgba(240,80,50,0.12)' : 'rgba(240,80,50,0.08)',
          border: '1px solid rgba(240,80,50,0.2)',
          fontSize: 11,
          color: '#f29237',
        }}
      >
        <Sparkles size={12} /> 5 合 1 工具
      </div>
    </div>
  )
}

/* ───────────────────────── Tab Bar ───────────────────────── */

function TabBar({
  activeTab,
  setActiveTab,
  isDark,
}: {
  activeTab: TabId
  setActiveTab: (t: TabId) => void
  isDark: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        padding: '10px 16px',
        borderBottom: '1px solid var(--window-border)',
        background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        flexShrink: 0,
        overflowX: 'auto',
      }}
    >
      {TAB_DEFS.map((tab) => {
        const active = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: active
                ? '1px solid var(--accent)'
                : '1px solid transparent',
              background: active
                ? 'var(--accent-bg)'
                : 'transparent',
              color: active ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

/* ───────────────────────── 速查面板 ───────────────────────── */

function CheatPanel({ isDark }: { isDark: boolean }) {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('全部')
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return CHEAT_COMMANDS.filter((c) => {
      const matchCat = cat === '全部' || c.category === cat
      const q = query.toLowerCase()
      const matchQuery =
        !q ||
        c.cmd.toLowerCase().includes(q) ||
        c.desc.toLowerCase().includes(q) ||
        c.examples.some((e) => e.toLowerCase().includes(q))
      return matchCat && matchQuery
    })
  }, [query, cat])

  const copy = useCallback(async (cmd: string) => {
    await navigator.clipboard?.writeText(cmd)
    setCopiedCmd(cmd)
    setTimeout(() => setCopiedCmd(null), 1500)
  }, [])

  const accent = isDark ? '#f29237' : '#f05032'

  return (
    <div>
      <div style={{ ...CARD, display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <Search size={16} style={{ color: 'var(--text-secondary)' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索命令、描述或示例..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'inherit',
            fontSize: 13,
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {CHEAT_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              border: `1px solid ${cat === c ? accent : 'var(--window-border)'}`,
              background: cat === c ? `${accent}22` : 'transparent',
              color: cat === c ? accent : 'var(--text-secondary)',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((c) => (
          <div
            key={c.cmd}
            style={{
              ...CARD,
              padding: 14,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <code
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: accent,
                  fontFamily: '"JetBrains Mono", monospace',
                }}
                dangerouslySetInnerHTML={{ __html: highlightCode(c.cmd) }}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: 'var(--window-border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {c.category}
                </span>
                <button
                  onClick={() => copy(c.cmd)}
                  style={{
                    border: 'none',
                    background: copiedCmd === c.cmd ? 'var(--accent-bg)' : 'transparent',
                    color: copiedCmd === c.cmd ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: 4,
                    borderRadius: 6,
                  }}
                  title="复制命令"
                >
                  {copiedCmd === c.cmd ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: 13, lineHeight: 1.6 }}>{c.desc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {c.examples.map((ex, i) => (
                <pre
                  key={i}
                  style={{
                    ...CODE_BLOCK,
                    margin: 0,
                    padding: '6px 10px',
                    fontSize: 11,
                  }}
                  dangerouslySetInnerHTML={{ __html: '$ ' + highlightCode(ex) }}
                />
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
            没有匹配的命令
          </div>
        )}
      </div>
    </div>
  )
}

/* ───────────────────────── 教程面板 ───────────────────────── */

function TutorialPanel({ isDark }: { isDark: boolean }) {
  const [tutorialIdx, setTutorialIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [copied, setCopied] = useState<number | null>(null)

  const tutorial = TUTORIALS[tutorialIdx]
  const step = tutorial[stepIdx]
  const accent = isDark ? '#f29237' : '#f05032'

  const nextStep = () => {
    if (stepIdx < tutorial.length - 1) setStepIdx(stepIdx + 1)
    else if (tutorialIdx < TUTORIALS.length - 1) {
      setTutorialIdx(tutorialIdx + 1)
      setStepIdx(0)
      setRevealed(new Set())
    }
  }

  const prevStep = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1)
    else if (tutorialIdx > 0) {
      setTutorialIdx(tutorialIdx - 1)
      setStepIdx(TUTORIALS[tutorialIdx - 1].length - 1)
      setRevealed(new Set())
    }
  }

  const copy = async (text: string, idx: number) => {
    await navigator.clipboard?.writeText(text)
    setCopied(idx)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {TUTORIALS.map((_, i) => (
          <button
            key={i}
            onClick={() => { setTutorialIdx(i); setStepIdx(0); setRevealed(new Set()) }}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: `1px solid ${tutorialIdx === i ? accent : 'var(--window-border)'}`,
              background: tutorialIdx === i ? `${accent}22` : 'transparent',
              color: tutorialIdx === i ? accent : 'var(--text-secondary)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            教程 {i + 1}
          </button>
        ))}
      </div>

      <div style={{ ...CARD, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
              步骤 {stepIdx + 1} / {tutorial.length}
            </div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{step.title}</h3>
          </div>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: accent,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {stepIdx + 1}
          </div>
        </div>

        <p style={{ margin: '0 0 16px 0', fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          {step.desc}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {step.commands.map((cmd, i) => {
            const isRevealed = revealed.has(i)
            return (
              <div key={i} style={{ position: 'relative' }}>
                <pre
                  style={{
                    ...CODE_BLOCK,
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    border: isRevealed ? `1px solid ${accent}44` : undefined,
                  }}
                >
                  <code
                    style={{
                      flex: 1,
                      opacity: isRevealed ? 1 : 0.35,
                      transition: 'opacity 0.3s ease',
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 12,
                    }}
                    dangerouslySetInnerHTML={{ __html: '$ ' + highlightCode(cmd) }}
                  />
                  <div style={{ display: 'flex', gap: 4, marginLeft: 8, flexShrink: 0 }}>
                    {!isRevealed && (
                      <button
                        onClick={() => setRevealed(new Set([...revealed, i]))}
                        style={{
                          border: 'none',
                          background: 'rgba(255,255,255,0.06)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          padding: 4,
                          borderRadius: 4,
                        }}
                        title="显示"
                      >
                        <Play size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => copy(cmd, i)}
                      style={{
                        border: 'none',
                        background: copied === i ? 'var(--accent-bg)' : 'rgba(255,255,255,0.06)',
                        color: copied === i ? 'var(--accent)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: 4,
                        borderRadius: 4,
                      }}
                      title="复制"
                    >
                      {copied === i ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </pre>
              </div>
            )
          })}
        </div>

        {step.hint && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 14px',
              borderRadius: 8,
              background: isDark ? 'rgba(242,146,55,0.1)' : 'rgba(240,80,50,0.06)',
              border: `1px solid ${accent}33`,
              fontSize: 12,
              color: accent,
            }}
          >
            💡 {step.hint}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button
          onClick={prevStep}
          disabled={tutorialIdx === 0 && stepIdx === 0}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 10,
            border: '1px solid var(--window-border)',
            background: 'var(--glass-bg)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: 13,
            opacity: tutorialIdx === 0 && stepIdx === 0 ? 0.4 : 1,
          }}
        >
          <ChevronLeft size={16} /> 上一步
        </button>
        <button
          onClick={nextStep}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 10,
            border: 'none',
            background: `linear-gradient(135deg, #f05032 0%, #f29237 100%)`,
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          下一步 <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

/* ───────────────────────── 工作流可视化 ───────────────────────── */

function WorkflowPanel({ isDark }: { isDark: boolean }) {
  const [animating, setAnimating] = useState(false)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const accent = isDark ? '#f29237' : '#f05032'
  const mainColor = isDark ? '#4fc3f7' : '#2196f3'
  const featColor = isDark ? '#81c784' : '#4caf50'

  const branchColors: Record<string, string> = { main: mainColor, feature: featColor }

  const edges = [
    { from: 'c1', to: 'c2', branch: 'main' },
    { from: 'c2', to: 'c3', branch: 'main' },
    { from: 'c2', to: 'b1', branch: 'feature' },
    { from: 'b1', to: 'c4', branch: 'feature' },
    { from: 'c4', to: 'c5', branch: 'feature' },
    { from: 'c3', to: 'm1', branch: 'main' },
    { from: 'c5', to: 'm1', branch: 'feature' },
  ]

  const nodeMap = Object.fromEntries(WORKFLOW_DATA.map((n) => [n.id, n]))

  const startAnim = () => {
    setAnimating(false)
    setTimeout(() => setAnimating(true), 50)
  }

  return (
    <div>
      <div style={{ ...CARD, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>分支合并流程</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              可视化展示 feature 分支如何合并回 main 分支
            </p>
          </div>
          <button
            onClick={startAnim}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: `linear-gradient(135deg, ${accent} 0%, #f29237 100%)`,
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Play size={14} /> 播放动画
          </button>
        </div>

        <div
          style={{
            borderRadius: 12,
            background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
            border: '1px solid var(--window-border)',
            padding: 20,
            overflow: 'hidden',
          }}
        >
          <svg width="100%" height="300" viewBox="0 0 540 300" style={{ display: 'block' }}>
            {/* Main branch baseline */}
            <line
              x1="40" y1="100" x2="500" y2="100"
              stroke={mainColor}
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity={0.3}
            />
            {/* Feature branch baseline */}
            <line
              x1="160" y1="220" x2="480" y2="220"
              stroke={featColor}
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity={0.3}
            />

            {/* Edges */}
            {edges.map((e, i) => {
              const from = nodeMap[e.from]
              const to = nodeMap[e.to]
              if (!from || !to) return null
              const color = branchColors[e.branch] || accent
              return (
                <line
                  key={i}
                  x1={from.x + 16}
                  y1={from.y}
                  x2={to.x - 16}
                  y2={to.y}
                  stroke={color}
                  strokeWidth="2.5"
                  className={animating ? 'ga-flow-line' : ''}
                  opacity={0.8}
                />
              )
            })}

            {/* Nodes */}
            {WORKFLOW_DATA.map((n) => {
              const color = n.type === 'merge' ? accent : branchColors[n.branch] || accent
              const isHighlighted = highlightedId === n.id
              return (
                <g
                  key={n.id}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHighlightedId(n.id)}
                  onMouseLeave={() => setHighlightedId(null)}
                >
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={isHighlighted ? 22 : 18}
                    fill={isDark ? 'rgba(0,0,0,0.4)' : 'white'}
                    stroke={color}
                    strokeWidth="2.5"
                    style={{ transition: 'all 0.2s ease' }}
                  />
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={10}
                    fill={color}
                    opacity={0.9}
                  />
                  <text
                    x={n.x}
                    y={n.y + 36}
                    textAnchor="middle"
                    fill="var(--text-primary)"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {n.label}
                  </text>
                  <text
                    x={n.x}
                    y={n.y - 26}
                    textAnchor="middle"
                    fill={color}
                    fontSize="9"
                    opacity={0.7}
                  >
                    {n.branch}
                  </text>
                </g>
              )
            })}

            {/* Branch labels */}
            <text x="40" y="80" fill={mainColor} fontSize="12" fontWeight="700">
              main
            </text>
            <text x="160" y="250" fill={featColor} fontSize="12" fontWeight="700">
              feature/login
            </text>
          </svg>
        </div>
      </div>

      <div style={{ ...CARD, padding: 16, marginTop: 14 }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 600 }}>合并流程说明</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { step: '1', text: 'main 分支上已有 commit 1、2、3', color: mainColor },
            { step: '2', text: '从 commit 2 处创建 feature 分支', color: featColor },
            { step: '3', text: '在 feature 分支上完成 commit 4、5', color: featColor },
            { step: '4', text: '将 feature 分支合并回 main (merge commit)', color: accent },
          ].map((item) => (
            <div key={item.step} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: item.color,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {item.step}
              </div>
              <span style={{ fontSize: 13 }}>{item.text}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>对应命令：</div>
          <pre style={{ ...CODE_BLOCK, margin: 0, padding: '10px 14px' }}>
            <code
              dangerouslySetInnerHTML={{
                __html:
                  highlightCode('git checkout main') +
                  '\n' +
                  highlightCode('git checkout -b feature/login') +
                  '\n' +
                  '# 开发并提交...' +
                  '\n' +
                  highlightCode('git checkout main') +
                  '\n' +
                  highlightCode('git merge --no-ff feature/login'),
              }}
            />
          </pre>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── 命令生成器 ───────────────────────── */

function GeneratorPanel({ isDark }: { isDark: boolean }) {
  const [presetId, setPresetId] = useState(GEN_PRESETS[0].id)
  const [values, setValues] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)

  const preset = GEN_PRESETS.find((p) => p.id === presetId)!

  const command = useMemo(() => {
    let result = preset.template
    const match = preset.template.match(/\{\{(\w+)\}\}/g) || []
    match.forEach((placeholder) => {
      const key = placeholder.slice(2, -2)
      const val = values[key] || ''
      result = result.replace(placeholder, val)
    })
    return result
  }, [preset, values])

  const copy = useCallback(async () => {
    await navigator.clipboard?.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [command])

  const accent = isDark ? '#f29237' : '#f05032'

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {GEN_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => { setPresetId(p.id); setValues({}) }}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: `1px solid ${presetId === p.id ? accent : 'var(--window-border)'}`,
              background: presetId === p.id ? `${accent}22` : 'var(--glass-bg)',
              color: presetId === p.id ? accent : 'var(--text-primary)',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: presetId === p.id ? 600 : 400,
            }}
          >
            <span>{p.icon}</span> {p.label}
          </button>
        ))}
      </div>

      <div style={{ ...CARD, padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 20 }}>{preset.icon}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{preset.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{preset.description}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
        {preset.options.map((opt) => (
          <div key={opt.key}>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: 'var(--text-secondary)' }}>
              {opt.label}
            </label>
            {opt.type === 'select' ? (
              <select
                value={values[opt.key] || ''}
                onChange={(e) => setValues((v) => ({ ...v, [opt.key]: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--window-border)',
                  background: 'var(--glass-bg)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="" disabled>选择...</option>
                {opt.options?.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={values[opt.key] || ''}
                onChange={(e) => setValues((v) => ({ ...v, [opt.key]: e.target.value }))}
                placeholder={opt.placeholder}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--window-border)',
                  background: 'var(--glass-bg)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: '"JetBrains Mono", monospace',
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          ...CARD,
          padding: 16,
          background: isDark
            ? 'linear-gradient(135deg, rgba(240,80,50,0.08) 0%, rgba(79,195,247,0.08) 100%)'
            : 'linear-gradient(135deg, rgba(240,80,50,0.06) 0%, rgba(33,150,243,0.06) 100%)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>生成的命令</span>
          <button
            onClick={copy}
            disabled={!command || command.includes('{{')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              background: copied ? 'var(--accent)' : accent,
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              opacity: command.includes('{{') ? 0.5 : 1,
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? '已复制' : '复制命令'}
          </button>
        </div>
        <pre
          style={{
            ...CODE_BLOCK,
            margin: 0,
            padding: '12px 16px',
            fontSize: 13,
            minHeight: 48,
          }}
          dangerouslySetInnerHTML={{
            __html: command
              ? '$ ' + highlightCode(command)
              : '<span style="color:var(--text-secondary)">填写上方选项生成命令...</span>',
          }}
        />
      </div>
    </div>
  )
}

/* ───────────────────────── 提交规范检查 ───────────────────────── */

interface CheckResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  parsed?: {
    type: string
    typeLabel?: string
    scope?: string
    subject: string
    body?: string
    breaking?: boolean
  }
}

function checkConventional(input: string): CheckResult {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []

  const trimmed = input.trim()
  if (!trimmed) {
    return { valid: false, errors: ['提交信息不能为空'], warnings: [], suggestions: ['请输入符合规范的提交信息'] }
  }

  // Check footer keywords (simplified)
  // Format: type(scope)!: subject or type(scope): subject or type!: subject or type: subject
  const conventionalRegex = /^(?:(\w+)(?:\(([^)]*)\))?([!])?:\s*(.+))$/
  const match = trimmed.match(conventionalRegex)

  if (!match) {
    errors.push('提交信息格式不符合 Conventional Commits 规范')
    suggestions.push('正确格式: type(scope)!: subject')
    suggestions.push('示例: feat(auth): 添加登录功能')
    return { valid: false, errors, warnings, suggestions }
  }

  const [, type, scope, breaking, subject] = match

  if (!CONVENTIONAL_TYPES.includes(type)) {
    errors.push(`未知的提交类型 "${type}"，允许的类型: ${CONVENTIONAL_TYPES.join(', ')}`)
  }

  if (scope && !CONVENTIONAL_SCOPES.includes(scope)) {
    warnings.push(`scope "${scope}" 不在预定义列表中，但自定义 scope 也是允许的`)
  }

  if (subject.length > 100) {
    warnings.push('subject 建议不超过 100 个字符')
  }

  if (subject.length === 0) {
    errors.push('subject（冒号后的描述）不能为空')
  }

  if (/[.。]$/.test(subject)) {
    warnings.push('subject 结尾不应有句号')
  }

  if (/\s{2,}/.test(subject)) {
    warnings.push('subject 中有多余的空格')
  }

  const typeLabels: Record<string, string> = {
    feat: '新功能',
    fix: 'Bug 修复',
    docs: '文档',
    style: '代码风格',
    refactor: '重构',
    perf: '性能优化',
    test: '测试',
    build: '构建',
    ci: 'CI/CD',
    chore: '杂项',
    revert: '回退',
  }

  if (breaking === '!') {
    warnings.push('⚠️ 这是一个破坏性变更 (BREAKING CHANGE)，请确保已在 CHANGELOG 中记录')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions: errors.length === 0
      ? []
      : ['参考格式: type(scope)!: subject', '更多规范请访问 https://www.conventionalcommits.org/'],
    parsed: {
      type,
      typeLabel: typeLabels[type] || type,
      scope,
      subject,
      breaking: breaking === '!',
      body: undefined,
    },
  }
}

function ConventionPanel({ isDark }: { isDark: boolean }) {
  const [input, setInput] = useState('feat(auth): 添加登录功能')
  const [result, setResult] = useState<CheckResult>(() => checkConventional('feat(auth): 添加登录功能'))
  const [copied, setCopied] = useState(false)

  const accent = isDark ? '#f29237' : '#f05032'
  const success = isDark ? '#4caf50' : '#2e7d32'

  const runCheck = useCallback(() => {
    setResult(checkConventional(input))
  }, [input])

  const copy = async () => {
    await navigator.clipboard?.writeText(`git commit -m "${input}"`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const presets = [
    'feat(auth): 添加登录功能',
    'fix(api): 修复数据获取超时',
    'docs(readme): 更新安装说明',
    'refactor(core): 优化状态管理逻辑',
    'feat!: 重构 API 接口 (破坏性变更)',
    'chore(deps): 升级依赖版本',
  ]

  return (
    <div>
      <div style={{ ...CARD, padding: 16 }}>
        <h3 style={{ margin: '0 0 6px 0', fontSize: 15, fontWeight: 700 }}>提交信息输入</h3>
        <p style={{ margin: '0 0 12px 0', fontSize: 12, color: 'var(--text-secondary)' }}>
          格式: <code style={{ color: accent }}>type(scope)!: subject</code>
        </p>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyUp={runCheck}
          rows={3}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 10,
            border: `1px solid ${result.valid ? success : '#f44336'}55`,
            background: 'var(--glass-bg)',
            color: 'var(--text-primary)',
            fontSize: 14,
            fontFamily: '"JetBrains Mono", monospace',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s ease',
          }}
          placeholder="feat(auth): 添加登录功能"
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button
            onClick={runCheck}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: accent,
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <ClipboardCheck size={14} /> 检查规范
          </button>
          <button
            onClick={copy}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--window-border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
            }}
          >
            {copied ? <Check size={14} color={success} /> : <Copy size={14} />}
            {copied ? '已复制' : '复制命令'}
          </button>
        </div>
      </div>

      {/* 检查结果 */}
      <div
        style={{
          ...CARD,
          padding: 16,
          background: result.valid
            ? isDark ? 'rgba(76,175,80,0.1)' : 'rgba(46,125,50,0.06)'
            : isDark ? 'rgba(244,67,54,0.1)' : 'rgba(198,40,40,0.06)',
          borderColor: result.valid ? `${success}55` : '#f4433655',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: result.valid ? success : '#f44336',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {result.valid ? <Check size={16} /> : <X size={16} />}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              {result.valid ? '✅ 符合 Conventional Commits 规范' : '❌ 格式不符合规范'}
            </div>
            {result.parsed && (
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                类型: <strong style={{ color: accent }}>{result.parsed.type}</strong>
                {result.parsed.scope && <> · 范围: <strong>{result.parsed.scope}</strong></>}
                {result.parsed.breaking && <span style={{ color: '#ff9800', marginLeft: 4 }}>⚠️ 破坏性变更</span>}
              </div>
            )}
          </div>
        </div>

        {result.errors.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#f44336', marginBottom: 6 }}>错误:</div>
            {result.errors.map((err, i) => (
              <div key={i} style={{ fontSize: 12, padding: '4px 0', color: '#f44336' }}>• {err}</div>
            ))}
          </div>
        )}

        {result.warnings.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#ff9800', marginBottom: 6 }}>警告:</div>
            {result.warnings.map((warn, i) => (
              <div key={i} style={{ fontSize: 12, padding: '4px 0', color: '#ff9800' }}>• {warn}</div>
            ))}
          </div>
        )}

        {result.suggestions.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#2196f3', marginBottom: 6 }}>建议:</div>
            {result.suggestions.map((s, i) => (
              <div key={i} style={{ fontSize: 12, padding: '4px 0', color: 'var(--text-secondary)' }}>• {s}</div>
            ))}
          </div>
        )}
      </div>

      {/* 快速预设 */}
      <div style={{ ...CARD, padding: 16, marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Star size={14} style={{ color: '#ff9800' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>快速预设</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => { setInput(p); setResult(checkConventional(p)) }}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--window-border)',
                background: 'var(--glass-bg)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: '"JetBrains Mono", monospace',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = accent)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--window-border)')}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 类型说明 */}
      <div style={{ ...CARD, padding: 16, marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <BookOpen size={14} style={{ color: accent }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>提交类型说明</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
          {[
            { type: 'feat', desc: '新功能' },
            { type: 'fix', desc: 'Bug 修复' },
            { type: 'docs', desc: '文档' },
            { type: 'style', desc: '代码风格' },
            { type: 'refactor', desc: '重构' },
            { type: 'perf', desc: '性能优化' },
            { type: 'test', desc: '测试' },
            { type: 'build', desc: '构建' },
            { type: 'ci', desc: 'CI/CD' },
            { type: 'chore', desc: '杂项' },
            { type: 'revert', desc: '回退' },
          ].map((item) => (
            <div
              key={item.type}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                background: 'var(--glass-bg)',
                border: '1px solid var(--window-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <code
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: accent,
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {item.type}
              </code>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}