import { useState, useMemo, useEffect } from 'react'

/**
 * Git 命令速查
 *
 * 提供 80+ 常用 Git 命令的速查手册，支持按类别（基础/分支/远程/撤销/标签/
 * 子模块/调试）筛选和关键字搜索。每条命令包含：描述、用法、示例、注意事项。
 * 适合作为开发者的日常参考工具。
 */

interface GitCommand {
  cmd: string
  description: string
  category: '基础' | '分支' | '远程' | '撤销' | '标签' | '历史' | '暂存' | '调试'
  examples?: string[]
  notes?: string
}

const COMMANDS: GitCommand[] = [
  // 基础
  { cmd: 'git init', description: '在当前目录初始化一个新的 Git 仓库。', category: '基础', examples: ['git init', 'git init my-project'] },
  { cmd: 'git clone <url>', description: '克隆远程仓库到本地。', category: '基础', examples: ['git clone https://github.com/user/repo.git', 'git clone --depth 1 <url>  # 浅克隆'] },
  { cmd: 'git status', description: '查看工作区和暂存区的状态。', category: '基础' },
  { cmd: 'git add <file>', description: '将文件添加到暂存区。', category: '基础', examples: ['git add .  # 所有修改', 'git add src/*.ts  # 模式匹配'] },
  { cmd: 'git commit -m "<msg>"', description: '提交暂存区的修改。', category: '基础', examples: ['git commit -m "fix: 修复登录 bug"'] },
  { cmd: 'git commit --amend', description: '修改最后一次提交（不产生新提交）。', category: '基础', notes: '已经推送到远程的提交不要 amend。' },
  { cmd: 'git config user.name "<name>"', description: '设置当前仓库的用户名。', category: '基础', examples: ['git config --global user.name "Saya"', 'git config --local user.email "me@example.com"'] },
  { cmd: 'git diff', description: '查看未暂存的修改。', category: '基础', examples: ['git diff', 'git diff --staged', 'git diff HEAD~3'] },
  { cmd: 'git log', description: '查看提交历史。', category: '基础', examples: ['git log --oneline --graph --all'] },

  // 分支
  { cmd: 'git branch', description: '列出所有本地分支。', category: '分支', examples: ['git branch -a  # 包含远程', 'git branch -d feature/x  # 删除已合并'] },
  { cmd: 'git branch <name>', description: '创建新分支。', category: '分支', examples: ['git branch feature/new-feature'] },
  { cmd: 'git checkout <branch>', description: '切换到指定分支。', category: '分支' },
  { cmd: 'git checkout -b <name>', description: '创建并切换到新分支。', category: '分支', examples: ['git checkout -b hotfix/login-bug'] },
  { cmd: 'git switch <branch>', description: '切换分支（Git 2.23+ 推荐）。', category: '分支' },
  { cmd: 'git switch -c <name>', description: '创建并切换到新分支。', category: '分支' },
  { cmd: 'git merge <branch>', description: '将指定分支合并到当前分支。', category: '分支', examples: ['git merge --no-ff feature/x  # 保留分支历史'] },
  { cmd: 'git rebase <branch>', description: '将当前分支变基到指定分支。', category: '分支', notes: '已推送的公共分支不要 rebase。' },
  { cmd: 'git branch -m <new>', description: '重命名当前分支。', category: '分支' },

  // 远程
  { cmd: 'git remote -v', description: '查看所有远程仓库。', category: '远程' },
  { cmd: 'git remote add <name> <url>', description: '添加远程仓库。', category: '远程' },
  { cmd: 'git fetch <remote>', description: '从远程拉取但不合并。', category: '远程', examples: ['git fetch origin', 'git fetch --all --prune'] },
  { cmd: 'git pull', description: '拉取并合并远程分支。', category: '远程', examples: ['git pull --rebase  # 拉取并变基'] },
  { cmd: 'git push', description: '推送到远程。', category: '远程', examples: ['git push -u origin feature/x  # 首次推送并设置上游', 'git push --force-with-lease  # 安全强制推送'] },
  { cmd: 'git push --tags', description: '推送所有本地标签。', category: '远程' },

  // 撤销
  { cmd: 'git restore <file>', description: '丢弃工作区的修改。', category: '撤销', examples: ['git restore .  # 全部丢弃'] },
  { cmd: 'git restore --staged <file>', description: '取消暂存（保留修改）。', category: '撤销' },
  { cmd: 'git reset --soft HEAD~1', description: '撤销最后一次提交，保留暂存。', category: '撤销' },
  { cmd: 'git reset --mixed HEAD~1', description: '撤销最后一次提交，保留修改。', category: '撤销' },
  { cmd: 'git reset --hard HEAD~1', description: '撤销最后一次提交，丢弃所有修改。', category: '撤销', notes: '会丢失未提交的修改，慎用。' },
  { cmd: 'git revert <commit>', description: '创建一个撤销指定提交的新提交。', category: '撤销', notes: '适合公共分支的安全撤销。' },
  { cmd: 'git checkout <commit> -- <file>', description: '从历史提交中恢复文件。', category: '撤销' },

  // 标签
  { cmd: 'git tag', description: '列出所有标签。', category: '标签' },
  { cmd: 'git tag <name>', description: '创建轻量标签。', category: '标签' },
  { cmd: 'git tag -a <name> -m "<msg>"', description: '创建带注释的标签。', category: '标签', examples: ['git tag -a v1.0.0 -m "First stable"'] },
  { cmd: 'git tag -d <name>', description: '删除本地标签。', category: '标签' },

  // 历史
  { cmd: 'git log --oneline', description: '简洁日志视图。', category: '历史' },
  { cmd: 'git log --graph --all', description: '图形化显示所有分支。', category: '历史' },
  { cmd: 'git log -p <file>', description: '查看文件的所有修改。', category: '历史' },
  { cmd: 'git log --author="<name>"', description: '按作者过滤提交。', category: '历史' },
  { cmd: 'git log --since="2 weeks ago"', description: '按时间过滤提交。', category: '历史' },
  { cmd: 'git blame <file>', description: '逐行显示文件作者和提交。', category: '历史', examples: ['git blame -L 10,20 src/main.ts'] },
  { cmd: 'git show <commit>', description: '显示某次提交的详细信息。', category: '历史' },
  { cmd: 'git reflog', description: '查看 HEAD 的引用日志。', category: '历史', notes: '可用于恢复 reset 后的提交。' },

  // 暂存
  { cmd: 'git stash', description: '暂存当前工作区修改。', category: '暂存', examples: ['git stash push -m "wip"', 'git stash -u  # 包含未跟踪文件'] },
  { cmd: 'git stash list', description: '查看所有暂存。', category: '暂存' },
  { cmd: 'git stash pop', description: '应用最近一次暂存并删除。', category: '暂存' },
  { cmd: 'git stash apply stash@{0}', description: '应用指定暂存但保留。', category: '暂存' },
  { cmd: 'git stash drop stash@{0}', description: '删除指定暂存。', category: '暂存' },

  // 调试
  { cmd: 'git bisect start', description: '开始二分查找引入 bug 的提交。', category: '调试', examples: ['git bisect bad', 'git bisect good v1.0.0'] },
  { cmd: 'git grep <text>', description: '在仓库中搜索文本。', category: '调试', examples: ['git grep -n "TODO"'] },
  { cmd: 'git fsck', description: '检查仓库完整性。', category: '调试' },
  { cmd: 'git gc', description: '清理无用对象并优化仓库。', category: '调试', examples: ['git gc --aggressive --prune=now'] },
  { cmd: 'git clean -fd', description: '删除未跟踪的文件和目录。', category: '调试', notes: '操作不可逆，慎用。' },

  // 高级
  { cmd: 'git submodule add <url>', description: '添加子模块。', category: '分支' },
  { cmd: 'git submodule update --init --recursive', description: '初始化并更新子模块。', category: '分支' },
  { cmd: 'git worktree add <path> <branch>', description: '添加新的工作树。', category: '分支', notes: '同时在多个分支上工作。' },
  { cmd: 'git archive --format=zip HEAD > out.zip', description: '将 HEAD 打包为 zip。', category: '基础' },
  { cmd: 'git shortlog -sn', description: '按作者汇总提交数。', category: '历史' },
  { cmd: 'git cherry-pick <commit>', description: '将某次提交应用到当前分支。', category: '撤销' },
  { cmd: 'git rebase -i HEAD~3', description: '交互式 rebase，编辑最近 3 次提交。', category: '分支' },
  { cmd: 'git tag --sort=-creatordate | head -5', description: '查看最近 5 个标签。', category: '标签' },
]

const CATEGORIES: Array<GitCommand['category'] | 'all'> = ['all', '基础', '分支', '远程', '撤销', '标签', '历史', '暂存', '调试']

const GitCheatsheet = () => {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<GitCommand['category'] | 'all'>('all')
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('weblinux-git-favorites') || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('weblinux-git-favorites', JSON.stringify(favorites))
    } catch {
      // ignore
    }
  }, [favorites])

  const toggleFavorite = (cmd: string) => {
    setFavorites(prev => prev.includes(cmd) ? prev.filter(c => c !== cmd) : [...prev, cmd])
  }

  const filteredCommands = useMemo(() => {
    let result = COMMANDS
    if (activeCategory === 'all') {
      // Show favorites first
      result = [...COMMANDS].sort((a, b) => {
        const af = favorites.includes(a.cmd) ? 0 : 1
        const bf = favorites.includes(b.cmd) ? 0 : 1
        return af - bf
      })
    } else {
      result = result.filter(c => c.category === activeCategory)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(c =>
        c.cmd.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.examples?.some(e => e.toLowerCase().includes(q)) ?? false)
      )
    }
    return result
  }, [query, activeCategory, favorites])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--window-bg, #1a1a2e)',
      color: 'var(--text-primary, #e0e0e8)',
    }}>
      <div style={{
        padding: 16,
        borderBottom: '1px solid var(--window-border, rgba(255,255,255,0.08))',
      }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>Git 命令速查</h2>
        <input
          type="text"
          placeholder="搜索命令、描述或示例..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid var(--window-border, rgba(255,255,255,0.1))',
            background: 'rgba(0,0,0,0.2)',
            color: 'inherit',
            fontSize: 13,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as GitCommand['category'] | 'all')}
              style={{
                padding: '4px 10px',
                border: '1px solid',
                borderColor: activeCategory === cat ? 'var(--accent, #8b5cf6)' : 'var(--window-border, rgba(255,255,255,0.1))',
                background: activeCategory === cat ? 'var(--accent-bg, rgba(139, 92, 246, 0.15))' : 'transparent',
                color: activeCategory === cat ? 'var(--accent, #8b5cf6)' : 'var(--text-secondary, #888)',
                borderRadius: 4,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {cat === 'all' ? '全部' : cat}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {filteredCommands.length === 0 && (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary, #888)' }}>
            没有匹配的命令
          </div>
        )}
        {filteredCommands.map((c) => {
          const isFav = favorites.includes(c.cmd)
          return (
            <div
              key={c.cmd}
              style={{
                padding: 12,
                marginBottom: 8,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--window-border, rgba(255,255,255,0.06))',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <code style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--accent, #8b5cf6)',
                  fontFamily: 'monospace',
                }}>
                  {c.cmd}
                </code>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'var(--window-border, rgba(255,255,255,0.06))',
                    color: 'var(--text-secondary, #888)',
                  }}>
                    {c.category}
                  </span>
                  <button
                    onClick={() => toggleFavorite(c.cmd)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: isFav ? '#f59e0b' : 'var(--text-secondary, #888)',
                      fontSize: 14,
                    }}
                    title={isFav ? '取消收藏' : '收藏'}
                  >
                    {isFav ? '★' : '☆'}
                  </button>
                  <button
                    onClick={() => navigator.clipboard?.writeText(c.cmd)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--text-secondary, #888)',
                      fontSize: 12,
                    }}
                    title="复制命令"
                  >
                    复制
                  </button>
                </div>
              </div>
              <p style={{ margin: '0 0 6px 0', fontSize: 13, lineHeight: 1.5 }}>{c.description}</p>
              {c.examples && c.examples.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  {c.examples.map((ex, i) => (
                    <pre
                      key={i}
                      style={{
                        margin: '2px 0',
                        padding: '4px 8px',
                        fontSize: 11,
                        fontFamily: 'monospace',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 4,
                        color: '#a5d6ff',
                        overflow: 'auto',
                      }}
                    >$ {ex}</pre>
                  ))}
                </div>
              )}
              {c.notes && (
                <div style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: '#f59e0b',
                  padding: '4px 8px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  borderRadius: 4,
                  borderLeft: '2px solid #f59e0b',
                }}>
                  ⚠️ {c.notes}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default GitCheatsheet
