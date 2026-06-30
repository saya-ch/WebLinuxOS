import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

registerCommand('git', {
  handler: (context: CommandContext): CommandResult => {
    const { args, cwd } = context
    
    if (args.length === 0) {
      return { output: '用法: git <子命令> [选项]\n\n可用子命令:\n  status     显示仓库状态\n  log        显示提交日志\n  clone      克隆仓库\n  commit     提交更改\n  push       推送更改\n  pull       拉取更改\n  branch     管理分支\n  checkout   切换分支\n  init       初始化仓库\n  add        添加文件\n  diff       显示差异\n  stash      暂存更改\n  merge      合并分支\n  remote     管理远程仓库\n  help       显示帮助' }
    }
    
    const subcommand = args[0].toLowerCase()
    const restArgs = args.slice(1)
    
    switch (subcommand) {
      case 'status':
        return handleGitStatus(context)
      case 'log':
        return handleGitLog(context)
      case 'clone':
        return handleGitClone(restArgs)
      case 'commit':
        return handleGitCommit(restArgs)
      case 'push':
        return handleGitPush(restArgs)
      case 'pull':
        return handleGitPull()
      case 'branch':
        return handleGitBranch(restArgs)
      case 'checkout':
        return handleGitCheckout(restArgs)
      case 'init':
        return handleGitInit(cwd)
      case 'add':
        return handleGitAdd(restArgs)
      case 'diff':
        return handleGitDiff()
      case 'stash':
        return handleGitStash(restArgs)
      case 'merge':
        return handleGitMerge(restArgs)
      case 'remote':
        return handleGitRemote(restArgs)
      case 'help':
        return handleGitHelp()
      default:
        return { output: `git: '${subcommand}' 不是一个 git 命令。参见 'git --help'` }
    }
  },
  description: 'Git版本控制系统',
  usage: 'git <子命令> [选项]',
  examples: ['git status', 'git log --oneline', 'git clone https://github.com/user/repo']
})

function handleGitStatus(context: CommandContext): CommandResult {
  const { cwd } = context
  
  const status = {
    branch: 'main',
    ahead: 0,
    behind: 0,
    untracked: ['newfile.txt'],
    modified: ['README.md', 'src/index.ts'],
    staged: ['package.json'],
    conflicts: [],
  }
  
  const output: string[] = []
  output.push(`位于分支 ${status.branch}`)
  
  if (status.ahead > 0) output.push(`您的分支领先 'origin/${status.branch}' ${status.ahead} 个提交。`)
  if (status.behind > 0) output.push(`您的分支落后 'origin/${status.branch}' ${status.behind} 个提交。`)
  
  output.push('')
  
  if (status.staged.length > 0) {
    output.push('要提交的更改:')
    output.push('  (使用 "git restore --staged <文件>..." 取消暂存)')
    status.staged.forEach(file => output.push(`    修改:     ${file}`))
    output.push('')
  }
  
  if (status.modified.length > 0) {
    output.push('修改尚未加入提交:')
    output.push('  (使用 "git add <文件>..." 更新要提交的内容)')
    output.push('  (使用 "git checkout -- <文件>..." 丢弃工作区的改动)')
    status.modified.forEach(file => output.push(`    修改:     ${file}`))
    output.push('')
  }
  
  if (status.untracked.length > 0) {
    output.push('未跟踪的文件:')
    output.push('  (使用 "git add <文件>..." 将其纳入提交)')
    status.untracked.forEach(file => output.push(`    ${file}`))
    output.push('')
  }
  
  if (status.conflicts.length > 0) {
    output.push('合并冲突:')
    status.conflicts.forEach(file => output.push(`    ${file}`))
    output.push('')
  }
  
  output.push(`所在目录: ${cwd}`)
  output.push('提示: 输入 "git add <文件>" 暂存文件，"git commit" 提交更改')
  
  return { output: output.join('\n') }
}

function handleGitLog(context: CommandContext): CommandResult {
  const { args } = context
  const oneline = args.includes('--oneline') || args.includes('-1')
  
  const commits = [
    { hash: 'a1b2c3d', shortHash: 'a1b2c3d', message: 'feat: 添加新功能模块', author: 'user', date: '2小时前', changes: '+245 -12' },
    { hash: 'e4f5g6h', shortHash: 'e4f5g6h', message: 'fix: 修复登录页面bug', author: 'user', date: '昨天', changes: '+45 -28' },
    { hash: 'i7j8k9l', shortHash: 'i7j8k9l', message: 'refactor: 重构API层代码', author: 'user', date: '2天前', changes: '+180 -150' },
    { hash: 'm0n1o2p', shortHash: 'm0n1o2p', message: 'docs: 更新README文档', author: 'user', date: '3天前', changes: '+60 -20' },
    { hash: 'q3r4s5t', shortHash: 'q3r4s5t', message: 'chore: 更新依赖版本', author: 'user', date: '1周前', changes: '+5 -5' },
    { hash: 'u6v7w8x', shortHash: 'u6v7w8x', message: 'feat: 添加WebSocket支持', author: 'user', date: '1周前', changes: '+320 -45' },
    { hash: 'y9z0a1b', shortHash: 'y9z0a1b', message: 'perf: 优化首页加载速度', author: 'user', date: '2周前', changes: '+20 -80' },
    { hash: 'c2d3e4f', shortHash: 'c2d3e4f', message: 'test: 添加单元测试', author: 'user', date: '2周前', changes: '+450 -0' },
  ]
  
  const output: string[] = []
  
  if (oneline) {
    commits.forEach(commit => {
      output.push(`${commit.shortHash} ${commit.message}`)
    })
  } else {
    commits.forEach(commit => {
      output.push(`commit ${commit.hash}`)
      output.push(`Author: ${commit.author} <${commit.author}@web-linux.local>`)
      output.push(`Date:   ${commit.date}`)
      output.push('')
      output.push(`    ${commit.message}`)
      output.push(`    ${commit.changes}`)
      output.push('')
    })
  }
  
  return { output: output.join('\n') }
}

function handleGitClone(args: string[]): CommandResult {
  if (args.length === 0) {
    return { output: '用法: git clone <仓库URL> [目录]' }
  }
  
  const url = args[0]
  const dir = args[1] || url.split('/').pop()?.replace('.git', '') || 'repo'
  
  return { output: `正在克隆到 '${dir}'...\nremote: Enumerating objects: 1,234, done.\nremote: Counting objects: 100% (1,234/1,234), done.\nremote: Compressing objects: 100% (890/890), done.\n接收对象中: 100% (1,234/1,234), 456.78 KiB | 1.2 MiB/s, done.\n解析引用中: 100% (56/56), done.\n克隆完成！` }
}

function handleGitCommit(args: string[]): CommandResult {
  const message = args.includes('-m') ? args.slice(args.indexOf('-m') + 1).join(' ') : ''
  
  if (!message) {
    return { output: '用法: git commit -m "提交信息"' }
  }
  
  return { output: `[main abc1234] ${message}\n 3 files changed, 45 insertions(+), 12 deletions(-)\n create mode 100644 newfile.txt\n modify mode 100644 README.md\n modify mode 100644 package.json` }
}

function handleGitPush(args: string[]): CommandResult {
  const branch = args[0] || 'main'
  
  return { output: `枚举对象中...\n计数对象中: 100% (5/5), 完成。\nDelta compression using up to 4 threads\n压缩对象中: 100% (3/3), 完成。\n写入对象中: 100% (3/3), 3.45 KiB | 3.45 MiB/s, 完成。\nTotal 3 (delta 2), reused 0 (delta 0), pack-reused 0\nTo https://github.com/user/repo.git\n   abc1234..def5678  ${branch} -> ${branch}` }
}

function handleGitPull(): CommandResult {
  return { output: 'remote: Enumerating objects: 12, done.\nremote: Counting objects: 100% (12/12), done.\nremote: Compressing objects: 100% (4/4), done.\n接收对象中: 100% (8/8), 1.23 KiB | 1.23 MiB/s, done.\n来自 https://github.com/user/repo\n   def5678..ghi9012  main       -> origin/main\n更新 def5678..ghi9012\nFast-forward\n README.md |  5 +++++\n src/app.ts | 10 ++++++++++\n 2 files changed, 15 insertions(+)' }
}

function handleGitBranch(args: string[]): CommandResult {
  const branchName = args[0]
  
  if (!branchName) {
    return { output: '* main\n  feature/new-ui\n  bugfix/login\n  develop' }
  }
  
  if (args.includes('-d')) {
    return { output: `已删除分支 ${branchName}（曾为 abc1234）。` }
  }
  
  return { output: `已创建分支 '${branchName}'。\n切换到分支 '${branchName}'。` }
}

function handleGitCheckout(args: string[]): CommandResult {
  const target = args[0]
  
  if (!target) {
    return { output: '用法: git checkout <分支名> 或 git checkout <文件>' }
  }
  
  if (args.includes('-b')) {
    return { output: `已创建并切换到分支 '${target}'。` }
  }
  
  return { output: `切换到分支 '${target}'。\n您的分支与 'origin/${target}' 一致。` }
}

function handleGitInit(cwd: string): CommandResult {
  return { output: `初始化空的 Git 仓库于 ${cwd}/.git/\n\n提示: 使用以下命令开始:\n  git add <文件>\n  git commit -m "初始提交"` }
}

function handleGitAdd(args: string[]): CommandResult {
  const files = args.length > 0 ? args.join(' ') : '.'
  
  return { output: `已暂存以下文件:\n  ${files === '.' ? '所有修改的文件' : files}\n\n提示: 使用 "git commit" 提交更改` }
}

function handleGitDiff(): CommandResult {
  const diff = `diff --git a/README.md b/README.md
index abc1234..def5678 100644
--- a/README.md
+++ b/README.md
@@ -1,3 +1,5 @@
 # WebLinuxOS
 
 > 基于Web的Linux桌面环境
+
+## 新功能
+
+\`\`\`bash
+git clone https://github.com/saya-ch/WebLinuxOS.git
+\`\`\`
diff --git a/package.json b/package.json
index 123abc..456def 100644
--- a/package.json
+++ b/package.json
@@ -1,6 +1,6 @@
 {
   "name": "weblinuxos",
-  "version": "1.0.0",
+  "version": "2.0.0",
   "description": "Web-based Linux desktop environment"
 }`
  
  return { output: diff }
}

function handleGitStash(args: string[]): CommandResult {
  if (args.includes('pop')) {
    return { output: '已恢复暂存的更改。' }
  }
  
  if (args.includes('list')) {
    return { output: 'stash@{0}: WIP on main: abc1234 feat: 添加新功能\nstash@{1}: WIP on feature: def5678 fix: 修复bug' }
  }
  
  return { output: 'Saved working directory and index state WIP on main: abc1234 feat: 添加新功能' }
}

function handleGitMerge(args: string[]): CommandResult {
  const branch = args[0]
  
  if (!branch) {
    return { output: '用法: git merge <分支名>' }
  }
  
  return { output: `合并分支 '${branch}' 到 main\n\nFast-forward\n src/app.ts | 20 ++++++++++++++++++++\n 1 file changed, 20 insertions(+)` }
}

function handleGitRemote(args: string[]): CommandResult {
  if (args.length === 0) {
    return { output: 'origin  https://github.com/saya-ch/WebLinuxOS.git (fetch)\norigin  https://github.com/saya-ch/WebLinuxOS.git (push)' }
  }
  
  if (args[0] === 'add') {
    return { output: `已添加远程仓库 '${args[1] || 'origin'}'` }
  }
  
  return { output: `用法: git remote [add|remove|rename|set-url]` }
}

function handleGitHelp(): CommandResult {
  return { output: `Git 命令帮助
=============

基本命令:
  git init        初始化仓库
  git clone URL   克隆仓库
  git add 文件    添加文件到暂存区
  git commit      提交更改
  git push        推送更改
  git pull        拉取更改

分支管理:
  git branch      查看/创建分支
  git checkout    切换分支
  git merge       合并分支
  git stash       暂存更改

查看信息:
  git status      查看状态
  git log         查看日志
  git diff        查看差异

远程操作:
  git remote      管理远程仓库

获取更多帮助:
  git help <命令>` }
}