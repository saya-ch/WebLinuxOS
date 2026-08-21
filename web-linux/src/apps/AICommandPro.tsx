import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  TerminalIcon, SparklesIcon, CopyIcon, PlayIcon, ShieldIcon, AlertTriangleIcon,
  CheckCircleIcon, SearchIcon, BookmarkIcon, ChevronRightIcon, InfoIcon,
  LanguagesIcon, ZapIcon, BookIcon, ClipboardIcon
} from '../icons'

type RiskLevel = 'safe' | 'warning' | 'danger'

interface CommandTemplate {
  id: string
  category: string
  name: string
  description: string
  natural: string
  command: string
  explanation: string
  risk: RiskLevel
}

interface HistoryItem {
  id: string
  timestamp: number
  mode: 'nl2cmd' | 'cmd2nl'
  input: string
  output: string
  risk?: RiskLevel
}

interface SavedItem {
  id: string
  savedAt: number
  title: string
  natural: string
  command: string
  explanation: string
  risk: RiskLevel
}

// 命令模板库：覆盖开发、运维、文件、网络、Git、系统六大类
const COMMAND_TEMPLATES: CommandTemplate[] = [
  // === 文件操作 ===
  { id: 'f1', category: '文件', name: '查找大文件', description: '查找当前目录下超过100MB的文件',
    natural: '找出当前目录中大于100MB的文件并按大小排序',
    command: 'find . -type f -size +100M -exec du -h {} \\; | sort -rh | head -20',
    explanation: '使用 find 定位超过100MB的文件，du显示人类可读大小，sort -rh按大小降序排列，取前20项。',
    risk: 'safe' },
  { id: 'f2', category: '文件', name: '清理DS_Store', description: '递归删除macOS生成的.DS_Store文件',
    natural: '递归删除当前目录下所有的.DS_Store文件',
    command: 'find . -name ".DS_Store" -type f -delete',
    explanation: 'find 递归匹配名为 .DS_Store 的普通文件，-delete 直接删除。不会影响其他文件。',
    risk: 'safe' },
  { id: 'f3', category: '文件', name: '批量重命名', description: '将目录下所有.txt文件改为.md',
    natural: '把当前目录所有.txt后缀改成.md后缀',
    command: 'for f in *.txt; do mv -- "$f" "${f%.txt}.md"; done',
    explanation: '使用 for 循环遍历每个 .txt 文件，参数扩展 ${f%.txt} 去掉末尾 .txt，再拼接 .md 后缀。',
    risk: 'warning' },
  { id: 'f4', category: '文件', name: '目录总大小', description: '以人类可读形式显示当前目录总大小',
    natural: '查看当前目录总共占用多少磁盘空间',
    command: 'du -sh .',
    explanation: '-s 汇总当前目录，-h 输出为人类可读单位（KB/MB/GB）。',
    risk: 'safe' },
  { id: 'f5', category: '文件', name: '按扩展名统计', description: '统计每种扩展名的文件数量',
    natural: '按扩展名统计当前目录下各类文件的数量，倒序排列',
    command: 'find . -type f | sed "s/.*\\.//" | sort | uniq -c | sort -rn | head -15',
    explanation: 'find 枚举所有文件，sed 提取最后一个点之后的扩展名，uniq -c 计数，sort -rn 按计数降序。',
    risk: 'safe' },

  // === 开发/搜索 ===
  { id: 'd1', category: '开发', name: '递归搜索关键词', description: '在源码中搜索 TODO 关键词（忽略 node_modules）',
    natural: '在当前项目所有源码文件里搜索 TODO，跳过 node_modules 目录，并显示行号',
    command: 'grep -rn "TODO" --include="*.{ts,tsx,js,jsx,py,go,rs,java}" --exclude-dir=node_modules .',
    explanation: '-r 递归，-n 显示行号；--include 限制扩展名；--exclude-dir 排除依赖目录避免噪音。',
    risk: 'safe' },
  { id: 'd2', category: '开发', name: '端口占用查询', description: '查询哪个进程占用了3000端口',
    natural: '查看哪个进程正在监听3000端口',
    command: 'lsof -i :3000 || ss -tlnp | grep 3000',
    explanation: 'lsof -i :3000 显示占用3000端口的进程；如果系统没有 lsof，则使用 ss -tlnp 作为回退。',
    risk: 'safe' },
  { id: 'd3', category: '开发', name: '杀掉占用端口进程', description: '强制释放8080端口占用',
    natural: '强制终止占用8080端口的所有进程',
    command: 'lsof -ti :8080 | xargs -r kill -9',
    explanation: 'lsof -t 只输出 PID，xargs -r 传递给 kill -9 强制终止。如果没有进程占用，-r 参数避免空执行报错。',
    risk: 'danger' },
  { id: 'd4', category: '开发', name: 'Curl测API耗时', description: '详细测量一次 HTTP 请求各阶段耗时',
    natural: '测试 https://api.example.com/health 接口的DNS/TCP/TLS/TTFB/总耗时',
    command: 'curl -s -o /dev/null -w "\\nDNS: %{time_namelookup}s\\nTCP: %{time_connect}s\\nTLS: %{time_appconnect}s\\nTTFB: %{time_starttransfer}s\\nTotal: %{time_total}s\\nStatus: %{http_code}\\n" https://api.example.com/health',
    explanation: '-w 自定义输出各阶段耗时（域名解析 / TCP 握手 / TLS 握手 / 首字节 / 总耗时 / HTTP 状态码），-o /dev/null 丢弃响应体。',
    risk: 'safe' },
  { id: 'd5', category: '开发', name: '实时看日志过滤', description: 'tail 实时观察日志并过滤 ERROR',
    natural: '实时跟踪 app.log 文件中包含 ERROR 的行，并在匹配时高亮',
    command: 'tail -f app.log | grep --line-buffered -i "ERROR"',
    explanation: 'tail -f 持续读取文件新增内容；grep -i 忽略大小写；--line-buffered 保证每行立即输出，不缓冲。',
    risk: 'safe' },

  // === Git ===
  { id: 'g1', category: 'Git', name: '撤销最后一次提交（保留改动）', description: '回退最后一次提交但保留工作区改动',
    natural: '撤销上一次 git commit，但不要丢弃已修改的文件内容',
    command: 'git reset --soft HEAD~1',
    explanation: '--soft 只移动 HEAD 指针，已暂存的内容和工作区改动都保留。如果使用 --mixed 还会取消暂存。',
    risk: 'warning' },
  { id: 'g2', category: 'Git', name: '丢弃工作区所有未提交改动', description: '永久丢弃未提交的改动（谨慎）',
    natural: '丢弃所有未提交的修改，让工作区回到上一次提交时的干净状态',
    command: 'git reset --hard HEAD && git clean -fd',
    explanation: 'reset --hard HEAD 还原已跟踪文件；clean -fd 删除未跟踪的文件和目录。此操作不可恢复！',
    risk: 'danger' },
  { id: 'g3', category: 'Git', name: '查看贡献排行榜', description: '统计当前仓库每位作者的提交数',
    natural: '按提交次数排序，列出本仓库贡献最多的前10位作者',
    command: 'git shortlog -sn --all | head -10',
    explanation: 'shortlog -s 汇总、-n 按数量排序；--all 包含所有分支。',
    risk: 'safe' },
  { id: 'g4', category: 'Git', name: '交互式变基最近5次', description: 'rebase -i 合并/修改最近5次提交',
    natural: '用交互模式修改、合并或重新排列最近 5 次 commit',
    command: 'git rebase -i HEAD~5',
    explanation: '-i 进入交互界面，可以 pick / reword / squash / fixup 等方式改写提交历史。**不要对已 push 到共享分支的提交使用**。',
    risk: 'warning' },
  { id: 'g5', category: 'Git', name: '放弃分支本地改动', description: '放弃本地分支，和远端保持一致',
    natural: '把本地 main 分支强制同步为 origin/main，丢掉本地所有差异',
    command: 'git fetch origin && git checkout main && git reset --hard origin/main',
    explanation: '先 fetch 最新远端，切回 main，reset --hard 强制对齐 origin/main。本地未推送的提交和改动都会丢失！',
    risk: 'danger' },

  // === 网络/运维 ===
  { id: 'n1', category: '网络', name: 'HTTP头信息', description: '只查看响应头，不下载内容',
    natural: '查看 https://example.com 的响应头、状态码和Cookie信息',
    command: 'curl -I https://example.com',
    explanation: '-I 发送 HEAD 请求，仅返回响应头，不包含响应体。可快速观察 Server、Cache-Control、CSP 等头部。',
    risk: 'safe' },
  { id: 'n2', category: '网络', name: '本机IP地址', description: '显示本机所有公网/局域网IP地址',
    natural: '查看本机的对外公网IP，以及所有网卡的局域网地址',
    command: 'echo "公网IP: $(curl -s https://api.ipify.org)"; hostname -I; ip addr show | grep "inet "',
    explanation: '先用 curl 调用公开 IP 查询服务获得出口公网IP；hostname -I 和 ip addr 列出本机网卡地址。',
    risk: 'safe' },
  { id: 'n3', category: '网络', name: '持续Ping监控', description: '发送 20 个 ICMP 包并汇总丢包率',
    natural: '向 8.8.8.8 发送 20 个 ping 包，观察网络丢包与延迟',
    command: 'ping -c 20 -i 0.5 8.8.8.8 | tail -5',
    explanation: '-c 20 发送 20 个包，-i 0.5 每 500ms 一次；tail -5 显示最终丢包统计与 RTT 分布。',
    risk: 'safe' },
  { id: 'n4', category: '网络', name: '列出当前监听端口', description: '列出所有正在监听的TCP/UDP端口和对应进程',
    natural: '查看所有正在监听的TCP/UDP端口、进程名和PID',
    command: 'ss -tulnp || netstat -tulpn',
    explanation: '-t TCP / -u UDP / -l 监听中 / -n 数字端口 / -p 进程信息；现代 Linux 推荐 ss，旧系统回退 netstat。',
    risk: 'safe' },
  { id: 'n5', category: '网络', name: 'SSH端口测试', description: '不登录SSH只测试22端口是否可达',
    natural: '测试远程服务器的 SSH 22 端口是否能连通（不进入交互）',
    command: 'timeout 5 bash -c "</dev/tcp/remote.example.com/22" && echo "SSH端口可达" || echo "连接失败"',
    explanation: '使用 bash 内置的 /dev/tcp 伪设备进行 TCP 连接测试；timeout 5 防止长时间卡住。无需安装 nmap/telnet。',
    risk: 'safe' },

  // === 系统 ===
  { id: 's1', category: '系统', name: 'Top 10 占用内存进程', description: '按内存占用排序显示前10个进程',
    natural: '查看当前最占内存的前 10 个进程及其百分比',
    command: 'ps aux --sort=-%mem | head -11',
    explanation: 'ps aux 输出所有进程；--sort=-%mem 按内存百分比降序；head -11 保留表头 + 10 个进程。',
    risk: 'safe' },
  { id: 's2', category: '系统', name: '磁盘健康概览', description: '显示所有挂载点的使用率，并标红超80%的项',
    natural: '查看所有磁盘分区使用率，突出显示使用量超过 80% 的分区',
    command: 'df -h | awk \'NR==1 || $5+0>=80 {print}\' | (head -1 && grep -v Filesystem | sort -t" " -k5 -rn)',
    explanation: 'df -h 人类可读；awk 过滤表头 + 使用率≥80% 的分区；sort 按使用率倒序。快速定位潜在磁盘问题。',
    risk: 'safe' },
  { id: 's3', category: '系统', name: '历史命令Top10', description: '统计你最常使用的10个命令',
    natural: '从 bash/zsh 历史中统计使用频率最高的前 10 条命令',
    command: 'history | awk \'{print $2}\' | sort | uniq -c | sort -rn | head -10',
    explanation: 'history 读取 ~/.bash_history 或等价；awk 取命令名（第2列）；uniq -c 统计数量；倒序排序。',
    risk: 'safe' },
  { id: 's4', category: '系统', name: '僵尸进程清理', description: '查找并报告僵尸(Z)状态进程',
    natural: '查找系统里处于僵尸状态的进程，列出其父进程 ID',
    command: 'ps aux | awk \'$8~/Z/ {print $2, $3, $8, $11}\'',
    explanation: '过滤 $8（状态列）匹配 Z（Zombie / 僵尸）。僵尸进程需通过重启或杀死其父进程来清理，不能直接 kill。',
    risk: 'warning' },
  { id: 's5', category: '系统', name: '30秒CPU负载采样', description: '30秒内每秒输出一次 CPU 空闲率',
    natural: '连续 30 秒、每秒采样一次 CPU 空闲率，观察是否有持续高占用',
    command: 'for i in $(seq 1 30); do echo -n "[$(date +%H:%M:%S)] "; top -bn1 | grep "Cpu(s)" | awk \'{print "idle: " $8}\'; sleep 1; done',
    explanation: 'seq 1 30 循环30次；top -bn1 非交互批量模式；取 idle 空闲百分比。idle 越低说明 CPU 越忙。',
    risk: 'safe' },
]

const RISK_META: Record<RiskLevel, { label: string; Icon: typeof ShieldIcon; className: string; ring: string }> = {
  safe:    { label: '安全',   Icon: CheckCircleIcon, className: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', ring: 'ring-emerald-400/30' },
  warning: { label: '谨慎',   Icon: ShieldIcon,      className: 'text-amber-400   bg-amber-400/10   border-amber-400/20',   ring: 'ring-amber-400/30'   },
  danger:  { label: '高风险', Icon: AlertTriangleIcon, className: 'text-rose-400    bg-rose-400/10    border-rose-400/20',    ring: 'ring-rose-400/30'    },
}

const CATEGORIES = ['全部', '文件', '开发', 'Git', '网络', '系统'] as const
type Category = typeof CATEGORIES[number]

const STORAGE_HISTORY = 'aicmdpro-history-v1'
const STORAGE_SAVED   = 'aicmdpro-saved-v1'

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveJSON<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* 忽略存储超限 */ }
}

function uid(): string { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4) }

// ========== 规则型 NLP → 命令 映射（本地推理，不依赖网络） ==========
interface NLRule {
  match: RegExp
  extract?: (match: RegExpMatchArray) => Record<string, string>
  build: (vars: Record<string, string>) => { command: string; explanation: string; risk: RiskLevel }
}
const NL_RULES: NLRule[] = [
  { match: /超过|大于|\b(\d+)MB/, extract: m => ({ size: m[1] || '100' }),
    build: v => ({ command: `find . -type f -size +${v.size}M -exec du -h {} \\; | sort -rh | head -20`,
      explanation: `使用 find 查找大于 ${v.size}MB 的文件，通过 du -h 显示可读大小并按大小降序取前20。`, risk: 'safe' }) },
  { match: /占用|监听|端口.*(\d{2,5})/, extract: m => ({ port: m[1] || '3000' }),
    build: v => ({ command: `lsof -i :${v.port} || ss -tlnp | grep ${v.port}`,
      explanation: `查询占用 ${v.port} 端口的进程，优先 lsof，无 lsof 则回退 Linux 原生 ss。`, risk: 'safe' }) },
  { match: /杀掉|释放|强制.*端口/, extract: m => ({ port: (m[1] || '8080') }),
    build: v => ({ command: `lsof -ti :${v.port} | xargs -r kill -9`,
      explanation: `提取占用 ${v.port} 端口的 PID，使用 kill -9 强制终止。无法恢复！建议先用查询命令确认 PID。`, risk: 'danger' }) },
  { match: /\.DS_Store/,
    build: () => ({ command: 'find . -name ".DS_Store" -type f -delete', explanation: '递归删除 macOS 产生的 .DS_Store 元数据文件。', risk: 'safe' }) },
  { match: /重命名.*\.(txt|md|jpg|png)\s*(?:改成|改为|转成)\s*\.(txt|md|jpg|png)/i,
    extract: m => ({ from: (m[1] || 'txt').toLowerCase(), to: (m[2] || 'md').toLowerCase() }),
    build: v => ({ command: `for f in *.${v.from}; do mv -- "$f" "\${f%.${v.from}}.${v.to}"; done`,
      explanation: `遍历当前目录每个 .${v.from} 文件，截去原后缀后拼接 .${v.to}。注意：仅处理当前目录，不递归。`, risk: 'warning' }) },
  { match: /撤销.*(?:最后|上一)次.*提交|回退.*commit/,
    build: () => ({ command: 'git reset --soft HEAD~1', explanation: '回退最后一次 commit，但保留暂存区和工作区改动，方便修改后重新提交。', risk: 'warning' }) },
  { match: /丢弃.*(?:未提交|改动|修改)|(?:强制|完全)*重置/,
    build: () => ({ command: 'git reset --hard HEAD && git clean -fd', explanation: '永久丢弃所有未提交的改动和未跟踪文件，操作不可恢复！', risk: 'danger' }) },
  { match: /公网IP|本机IP|出口|外网地址/,
    build: () => ({ command: 'echo "公网IP: $(curl -s https://api.ipify.org)"; hostname -I; ip addr show | grep "inet "',
      explanation: '先用 ipify 获得出口公网 IP，再列出本机网卡地址。', risk: 'safe' }) },
  { match: /TODO|待办|FIXME/,
    build: () => ({ command: 'grep -rn "TODO\\|FIXME" --include="*.{ts,tsx,js,jsx,py,go,rs,java}" --exclude-dir=node_modules --exclude-dir=.git .',
      explanation: '在所有主流源码文件中递归搜索 TODO/FIXME，忽略依赖和 .git 目录。', risk: 'safe' }) },
  { match: /磁盘|硬盘|空间|使用率|df/,
    build: () => ({ command: 'df -h | awk \'NR==1 || $5+0>=80 {print}\' | (head -1 && grep -v Filesystem | sort -t" " -k5 -rn)',
      explanation: '列出所有分区使用率，优先展示使用率 ≥80% 的高风险磁盘。', risk: 'safe' }) },
  { match: /日志|ERROR|错误.*行/,
    build: () => ({ command: 'tail -f app.log | grep --line-buffered -i "ERROR"', explanation: '实时跟踪日志文件中的 ERROR 行，忽略大小写、行缓冲即时输出。', risk: 'safe' }) },
  { match: /(?:僵尸|zombie)/i,
    build: () => ({ command: 'ps aux | awk \'$8~/Z/ {print $2, $3, $8, $11}\'', explanation: '列出状态为 Zombie 的进程 PID、父进程和命令。需处理父进程才能清理。', risk: 'warning' }) },
]

function naturalToCommand(natural: string): { command: string; explanation: string; risk: RiskLevel; source: string } {
  const n = natural.trim()
  if (!n) return { command: '', explanation: '请输入自然语言描述。', risk: 'safe', source: '空输入' }

  // 1. 遍历模板库，基于 description/name/natural 做子串匹配
  const hits = COMMAND_TEMPLATES
    .map(t => ({ t, score: (t.natural.includes(n) || n.includes(t.natural) ? 100 : 0)
      + (t.name.includes(n) ? 80 : 0)
      + (t.description.includes(n) ? 60 : 0)
      + Array.from(new Set([...n.toLowerCase().split(/[\s，。,.？！：:]+/)]))
          .filter(w => w.length >= 2)
          .reduce((s, w) => s + (t.description.toLowerCase().includes(w) ? 5 : 0)
                        + (t.natural.toLowerCase().includes(w) ? 7 : 0)
                        + (t.category.toLowerCase().includes(w) ? 4 : 0), 0) }))
    .filter(h => h.score > 0)
    .sort((a, b) => b.score - a.score)
  if (hits.length > 0) {
    const top = hits[0].t
    return { command: top.command, explanation: top.explanation + `\n\n（匹配模板：${top.category} · ${top.name} · 分数 ${hits[0].score}）`, risk: top.risk, source: `模板库: ${top.name}` }
  }

  // 2. 规则正则匹配（可提取变量）
  for (const rule of NL_RULES) {
    const m = n.match(rule.match)
    if (m) {
      const vars = rule.extract ? rule.extract(m) : {}
      const result = rule.build(vars)
      return { ...result, source: '规则引擎' }
    }
  }

  // 3. 兜底：给出通用启发式命令 + 提示
  let guessCmd = ''
  let guessExpl = ''
  let guessRisk: RiskLevel = 'safe'
  if (/(查找|搜索|grep)/i.test(n)) {
    guessCmd = 'grep -rn "关键词" .'
    guessExpl = '最通用的递归搜索模板：把 "关键词" 替换为你要查找的字符串即可。加 -i 忽略大小写、--include 限定文件类型。'
  } else if (/(删除|remove|删|rm)/i.test(n)) {
    guessCmd = 'rm -i 目标文件'
    guessExpl = '建议始终使用 rm -i 进入交互确认模式，避免误删。**绝对不要在不熟悉时使用 rm -rf /**'
    guessRisk = 'warning'
  } else if (/(压缩|打包|tar|zip)/i.test(n)) {
    guessCmd = 'tar -czvf archive.tar.gz 目录名'
    guessExpl = '创建 gzip 压缩的 tar 归档，-c 创建 / -z gzip / -v 显示进度 / -f 文件名。'
  } else if (/(安装|install|apt|brew)/i.test(n)) {
    guessCmd = '# Debian/Ubuntu\nsudo apt update && sudo apt install 包名\n# macOS Homebrew\nbrew install 包名'
    guessExpl = '请根据系统选择对应的包管理器，安装前建议先更新软件索引。'
  } else {
    guessCmd = '# 没有精确匹配。以下是常用命令速查:\n# 目录导航: cd / pwd / ls -lah\n# 文件查看: cat / less / head / tail\n# 进程: ps aux / top / htop\n# 下载: curl -LO URL / wget URL'
    guessExpl = '建议：①从左侧"模板库"分类浏览 ②使用更具体的关键词（如"删除大于500M"、"查占用8080端口"、"看日志ERROR"）。'
  }
  return { command: guessCmd, explanation: guessExpl, risk: guessRisk, source: '兜底启发式' }
}

function commandToNatural(cmd: string): { natural: string; risk: RiskLevel; warnings: string[] } {
  const c = cmd.trim()
  if (!c) return { natural: '请输入命令。', risk: 'safe', warnings: [] }
  const warnings: string[] = []
  let risk: RiskLevel = 'safe'
  const parts: string[] = []

  // 风险检测
  if (/rm\s+-rf?\s+(\/|\*|~)/.test(c)) { risk = 'danger'; warnings.push('⚠ 检测到 `rm -rf` 作用于根目录、全量或家目录，这是毁灭性操作！请勿在真实机器上执行。') }
  else if (/rm\s+-rf/.test(c)) { risk = 'danger'; warnings.push('⚠ 使用 `rm -rf` 会直接递归强制删除，无法恢复。建议先改为 `rm -ri` 做交互确认。') }
  else if (/\brm\b/.test(c) && !/-i\b/.test(c)) { risk = 'warning'; warnings.push('提示：删除文件建议加上 -i 交互确认，避免手滑。') }
  if (/git\s+reset\s+--hard/.test(c)) { risk = 'danger'; warnings.push('⚠ `git reset --hard` 会永久丢弃工作区改动，若未 push 到远端将无法恢复。') }
  if (/git\s+rebase\s+-i\s+HEAD~\d/.test(c) && /push|origin/.test(c)) { risk = 'warning'; warnings.push('不要对已经 push 到共享分支的 commit 做 rebase，否则会破坏他人历史。') }
  if (/kill\s+-9/.test(c)) { risk = 'warning'; warnings.push('`kill -9` 是强制终止，不给进程清理资源的机会。优先尝试 `kill`（SIGTERM）。') }
  if (/\|.*(sudo\b|> \/etc|> \/usr\/|chmod 777)/.test(c)) { risk = 'danger'; warnings.push('检测到管道接 sudo 或写入系统目录或 777 权限，执行前请审查每一段。') }

  // 基于关键字的自然语言描述
  const tokens = c.split(/\s+/)
  const base = tokens[0]
  switch (base) {
    case 'find': parts.push('递归搜索文件系统'); break
    case 'grep': parts.push('在文件/流中按行匹配文本'); break
    case 'du':   parts.push('统计目录/文件磁盘占用'); break
    case 'df':   parts.push('展示挂载点剩余空间'); break
    case 'ps':   parts.push('列出进程快照'); break
    case 'top': case 'htop': parts.push('实时观察进程/CPU/内存'); break
    case 'ls':   parts.push('列出目录内容'); break
    case 'cd':   parts.push('切换当前工作目录'); break
    case 'curl': parts.push('发起 HTTP(S) / FTP 等网络请求'); break
    case 'tar':  parts.push('创建或提取 tar 归档'); break
    case 'ssh':  parts.push('通过安全 Shell 连接远程主机'); break
    case 'git':  parts.push(`执行 Git 子命令 <${tokens[1] || '…'}>`); break
    case 'ping': parts.push('发送 ICMP 包测试网络连通与延迟'); break
    case 'tail': parts.push('查看文件末尾；加 -f 可实时跟踪新增'); break
    case 'awk':  parts.push('按列/规则处理文本流，做统计或转换'); break
    case 'chmod':parts.push('修改文件/目录的权限位'); break
    case 'chown':parts.push('修改文件/目录的属主与属组'); break
    case 'sudo': parts.push('以超级用户/指定身份执行后续命令'); break
    case 'for':  parts.push('shell 循环控制结构，批量迭代参数执行'); break
    case 'kill': parts.push('向进程发送信号（默认 SIGTERM）'); break
    case 'lsof': parts.push('列出打开的文件与网络套接字'); break
    case 'ss': case 'netstat': parts.push('列出网络套接字（TCP/UDP/UNIX）'); break
    case 'docker': parts.push('操作 Docker 容器 / 镜像 / 网络 / 卷'); break
    case 'history': parts.push('读取 shell 历史命令'); break
    default: parts.push(`调用程序 \`${base}\``)
  }

  if (/-r\b|--recursive/.test(c)) parts.push('递归进入子目录')
  if (/-f\b|--force/.test(c)) parts.push('强制模式，跳过交互确认')
  if (/-i\b/.test(c)) parts.push('交互模式（操作前逐一确认）')
  if (/-h\b|--human-readable/.test(c)) parts.push('输出转换为 KB/MB/GB 可读单位')
  if (/-n\b/.test(c) && base === 'grep') parts.push('输出时显示行号')
  if (/\bxargs\b/.test(c)) parts.push('把前一条命令的输出作为参数逐条传给后续命令')
  if (/^[^#]*>/.test(c)) parts.push('（含重定向 >：stdout 覆盖写入文件，注意目标文件原有内容会丢失）')
  if (/>>/.test(c)) parts.push('（含重定向 >>：stdout 追加写入文件）')
  if (/\|/.test(c)) parts.push('（含管道 |：前一个命令 stdout 直接作为下一个命令的 stdin，组合多步处理）')

  const natural = parts.length > 0 ? parts.join('；') + '。' : '这是一条 shell 命令，建议先在沙盒或 dry-run 环境执行。'
  return { natural, risk, warnings }
}

// ========== 组件 ==========
export default function AICommandPro() {
  const [tab, setTab] = useState<'nl' | 'cmd' | 'lib' | 'hist'>('nl')
  const [natural, setNatural] = useState('找出当前目录中大于500MB的日志文件')
  const [nlResult, setNlResult] = useState<{ command: string; explanation: string; risk: RiskLevel; source: string } | null>(null)
  const [cmdInput, setCmdInput] = useState('ps aux --sort=-%mem | head -11')
  const [cmdResult, setCmdResult] = useState<ReturnType<typeof commandToNatural> | null>(null)
  const [category, setCategory] = useState<Category>('全部')
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>(() => loadJSON<HistoryItem[]>(STORAGE_HISTORY, []))
  const [saved, setSaved] = useState<SavedItem[]>(() => loadJSON<SavedItem[]>(STORAGE_SAVED, []))
  const [toast, setToast] = useState<string>('')
  const toastTimerRef = useRef<number | null>(null)

  useEffect(() => { saveJSON(STORAGE_HISTORY, history) }, [history])
  useEffect(() => { saveJSON(STORAGE_SAVED, saved) }, [saved])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => setToast(''), 1800)
  }, [])

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase()
    return COMMAND_TEMPLATES.filter(t => {
      if (category !== '全部' && t.category !== category) return false
      if (!q) return true
      return (t.name + t.description + t.natural + t.command + t.category).toLowerCase().includes(q)
    })
  }, [category, query])

  const runNL = useCallback(() => {
    const r = naturalToCommand(natural)
    setNlResult(r)
    setHistory(h => [{
      id: uid(), timestamp: Date.now(), mode: 'nl2cmd' as const,
      input: natural, output: r.command, risk: r.risk
    }, ...h].slice(0, 100))
  }, [natural])

  const runCmd = useCallback(() => {
    const r = commandToNatural(cmdInput)
    setCmdResult(r)
    setHistory(h => [{
      id: uid(), timestamp: Date.now(), mode: 'cmd2nl' as const,
      input: cmdInput, output: r.natural, risk: r.risk
    }, ...h].slice(0, 100))
  }, [cmdInput])

  const copy = useCallback(async (text: string, label = '已复制') => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      showToast(label + ' ✔')
    } catch {
      showToast('复制失败：剪贴板不可用')
    }
  }, [showToast])

  const useTemplate = useCallback((t: CommandTemplate) => {
    setNatural(t.natural)
    setTab('nl')
    const r = { command: t.command, explanation: t.explanation, risk: t.risk, source: `模板: ${t.name}` }
    setNlResult(r)
    setHistory(h => [{ id: uid(), timestamp: Date.now(), mode: 'nl2cmd' as const, input: t.natural, output: t.command, risk: t.risk }, ...h].slice(0, 100))
  }, [])

  const save = useCallback((title: string, natural: string, command: string, explanation: string, risk: RiskLevel) => {
    setSaved(list => [{ id: uid(), savedAt: Date.now(), title, natural, command, explanation, risk }, ...list])
    showToast('已加入收藏')
  }, [showToast])

  const RiskBadge = ({ level, size = 'sm' }: { level: RiskLevel; size?: 'sm' | 'md' }) => {
    const meta = RISK_META[level]
    const Icon = meta.Icon
    const pad = size === 'md' ? 'px-3 py-1.5 gap-2' : 'px-2 py-0.5 gap-1 text-[11px]'
    return (
      <span className={`inline-flex items-center ${pad} rounded-full border font-medium ${meta.className}`}>
        <Icon width={size === 'md' ? 16 : 12} height={size === 'md' ? 16 : 12} />
        {meta.label}
      </span>
    )
  }

  return (
    <div className="h-full w-full flex flex-col text-[13px] text-slate-200"
      style={{
        background: 'linear-gradient(180deg, #0b0f1a 0%, #0a0e18 100%)',
        fontFamily: "'Noto Sans SC', 'JetBrains Mono', system-ui, sans-serif",
      }}>
      {/* 顶部 Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5" style={{
        background: 'linear-gradient(90deg, rgba(124,58,237,0.08) 0%, rgba(56,189,248,0.04) 50%, transparent 100%)'
      }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #38bdf8 100%)',
          boxShadow: '0 8px 24px rgba(124,58,237,0.28), inset 0 1px 0 rgba(255,255,255,0.18)'
        }}>
          <TerminalIcon width={18} height={18} color="white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight" style={{ fontSize: 15, letterSpacing: '-0.01em' }}>AICommand Pro</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">v124 · 智能命令中心</span>
            <SparklesIcon width={12} height={12} className="text-amber-400/80" />
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">自然语言 ⇄ Shell 命令 双向转换 · 风险等级评估 · 6×25 模板库 · 纯本地引擎 · 零网络依赖</div>
        </div>
        <button
          onClick={() => { setNatural(''); setCmdInput(''); setNlResult(null); setCmdResult(null); showToast('已清空输入与结果') }}
          className="text-[11px] px-2.5 py-1 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition">
          清空当前
        </button>
      </div>

      {/* 标签栏 */}
      <div className="flex items-center gap-1 px-4 pt-2 border-b border-white/5">
        {[
          { id: 'nl' as const, label: '自然语言 → 命令', Icon: LanguagesIcon, hint: '说人话生成命令' },
          { id: 'cmd' as const, label: '命令 → 解释 & 风险', Icon: ShieldIcon, hint: '解析命令含义' },
          { id: 'lib' as const, label: `命令模板库 (${COMMAND_TEMPLATES.length})`, Icon: BookIcon, hint: '精选常用场景' },
          { id: 'hist' as const, label: `历史 / 收藏 (${history.length}/${saved.length})`, Icon: ZapIcon, hint: '最近使用和收藏' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            title={t.hint}
            className={`flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-t-lg border-b-2 transition ${
              tab === t.id
                ? 'border-violet-500 text-white bg-white/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}>
            <t.Icon width={13} height={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* 主内容 */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {tab === 'nl' && (
          <div className="p-5 grid grid-cols-1 xl:grid-cols-[1fr_1.05fr] gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LanguagesIcon width={14} height={14} className="text-slate-400" />
                  <span className="text-[12px] text-slate-300 font-medium">自然语言描述</span>
                </div>
                <span className="text-[10px] text-slate-500">可以用中文、越具体越好</span>
              </div>
              <textarea
                value={natural} onChange={e => setNatural(e.target.value)}
                onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runNL() } }}
                rows={5}
                placeholder="例：查看当前目录中所有大于 200MB 的 .log 文件并按大小排序；或者：撤销最后一次 git commit 但保留改动"
                className="w-full resize-none rounded-xl p-3 text-[13px] leading-6 outline-none bg-white/[0.03] border border-white/10 focus:border-violet-500/50 focus:bg-white/[0.05] placeholder:text-slate-600 transition"
              />
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  '查找 >1G 大文件',
                  '查占用 3000 端口进程',
                  '撤销最后一次 git commit',
                  '查看公网IP',
                  '看 app.log 里的 ERROR',
                  '列出监听端口',
                  '磁盘空间 >=80% 的分区',
                ].map(s => (
                  <button key={s} onClick={() => setNatural(s)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-slate-400 hover:text-slate-200 transition">
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button onClick={runNL}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-white shadow-lg shadow-violet-900/20 transition hover:brightness-110 active:scale-[0.99]"
                  style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #38bdf8 100%)' }}>
                  <SparklesIcon width={14} height={14} />
                  生成命令
                  <span className="text-[10px] opacity-70 ml-1">Ctrl+Enter</span>
                </button>
                {nlResult && (
                  <>
                    <button onClick={() => copy(nlResult.command, '命令已复制')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-[12px] transition">
                      <CopyIcon width={13} height={13} /> 复制命令
                    </button>
                    <button onClick={() => {
                      const t = natural.slice(0, 28) + (natural.length > 28 ? '…' : '')
                      save(t || '自定义查询', natural, nlResult.command, nlResult.explanation, nlResult.risk)
                    }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-[12px] transition">
                      <BookmarkIcon width={13} height={13} /> 收藏
                    </button>
                    <button onClick={() => {
                      showToast('已发送到终端（模拟）：可在真实终端粘贴执行')
                    }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-[12px] transition">
                      <PlayIcon width={13} height={13} /> 在终端执行
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TerminalIcon width={14} height={14} className="text-slate-400" />
                  <span className="text-[12px] text-slate-300 font-medium">生成结果</span>
                </div>
                {nlResult && <span className="text-[10px] text-slate-500">来源：{nlResult.source}</span>}
              </div>
              <div className="min-h-[180px] rounded-xl border border-white/10 p-0 overflow-hidden"
                style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(124,58,237,0.08), transparent 60%), #05080f' }}>
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                    <span className="ml-2 text-[10px] text-slate-500">$ bash · 执行预览</span>
                  </div>
                  {nlResult && <RiskBadge level={nlResult.risk} size="md" />}
                </div>
                {nlResult ? (
                  <>
                    <pre className="p-4 text-[13px] leading-7 whitespace-pre-wrap break-words font-mono"
                      style={{ color: '#c4b5fd' }}>
{nlResult.command}
                    </pre>
                    <div className="border-t border-white/5 p-4 space-y-2" style={{ fontSize: 12 }}>
                      <div className="flex items-start gap-2 text-slate-300">
                        <InfoIcon width={13} height={13} className="mt-0.5 text-sky-400 shrink-0" />
                        <div className="leading-6 whitespace-pre-wrap">{nlResult.explanation}</div>
                      </div>
                      {nlResult.risk === 'danger' && (
                        <div className="mt-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[12px] leading-6">
                          <strong>高风险提醒：</strong>此命令可能导致<strong>不可逆</strong>的数据丢失或系统损坏。<br/>
                          ① 先在测试环境验证 ② 关键数据先备份 ③ 能用交互版（如 rm -i、reset --soft）就不要用强制版。
                        </div>
                      )}
                      {nlResult.risk === 'warning' && (
                        <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[12px] leading-6">
                          <strong>操作前请确认：</strong>理解每个参数的作用，不清楚时先在沙盒目录执行或加上 dry-run / 交互参数。
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-10 text-center text-slate-500">
                    <SearchIcon width={28} height={28} className="mx-auto mb-3 opacity-40" />
                    输入左侧的自然语言描述，点击「生成命令」即可获得可用的 Shell 命令与详细解释。
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'cmd' && (
          <div className="p-5 grid grid-cols-1 xl:grid-cols-[1fr_1.05fr] gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TerminalIcon width={14} height={14} className="text-slate-400" />
                <span className="text-[12px] text-slate-300 font-medium">输入命令</span>
                <span className="text-[10px] text-slate-500 ml-auto">支持管道、重定向、git/curl/find/ps 等常见语法</span>
              </div>
              <textarea
                value={cmdInput} onChange={e => setCmdInput(e.target.value)}
                onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runCmd() } }}
                rows={6}
                placeholder="示例：du -sh .  ；或：find . -name '*.log' -mtime +30 | xargs rm ；或：git reset --hard HEAD~5"
                className="w-full resize-none rounded-xl p-3 outline-none bg-white/[0.03] border border-white/10 focus:border-sky-500/50 focus:bg-white/[0.05] placeholder:text-slate-600 transition font-mono text-[13px] leading-6"
              />
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  'find . -name ".DS_Store" -delete',
                  'du -sh .',
                  'ps aux --sort=-%mem | head -11',
                  'grep -rn "TODO" --include="*.ts*" .',
                  'git reset --soft HEAD~1',
                  'curl -I https://example.com',
                  'ss -tulnp',
                  'rm -rf /tmp/*',
                ].map(s => (
                  <button key={s} onClick={() => setCmdInput(s)}
                    className="font-mono text-[10.5px] px-2.5 py-1 rounded-md border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-slate-400 hover:text-slate-200 transition truncate max-w-[340px]">
                    {s}
                  </button>
                ))}
              </div>
              <button onClick={runCmd}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-white shadow-lg shadow-sky-900/20 transition hover:brightness-110 active:scale-[0.99]"
                style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)' }}>
                <InfoIcon width={14} height={14} />
                解析 & 风险评估
                <span className="text-[10px] opacity-70 ml-1">Ctrl+Enter</span>
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ClipboardIcon width={14} height={14} className="text-slate-400" />
                <span className="text-[12px] text-slate-300 font-medium">自然语言解释</span>
              </div>
              {cmdResult ? (
                <div className="rounded-xl border border-white/10 p-5 space-y-4 overflow-hidden"
                  style={{ background: 'radial-gradient(ellipse at 100% 0%, rgba(56,189,248,0.08), transparent 60%), #05080f' }}>
                  <div className="flex items-center justify-between">
                    <RiskBadge level={cmdResult.risk} size="md" />
                    <button onClick={() => copy(cmdResult.natural, '解释已复制')}
                      className="text-[11px] px-2.5 py-1 rounded-md border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition">
                      复制解释
                    </button>
                  </div>
                  <div className="text-[13.5px] leading-7 text-slate-200">{cmdResult.natural}</div>
                  {cmdResult.warnings.length > 0 && (
                    <div className="space-y-2">
                      {cmdResult.warnings.map((w, i) => (
                        <div key={i} className={`p-3 rounded-lg text-[12.5px] leading-6 border ${
                          cmdResult.risk === 'danger'
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                        }`}>{w}</div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 p-10 text-center text-slate-500">
                  <ShieldIcon width={28} height={28} className="mx-auto mb-3 opacity-40" />
                  粘贴任何命令，我们会翻译成人类语言并标注潜在风险。
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'lib' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 rounded-xl border border-white/10 p-1 bg-white/[0.03]">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] transition ${
                      category === c
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}>{c}</button>
                ))}
              </div>
              <div className="relative flex-1 min-w-[240px]">
                <SearchIcon width={14} height={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="搜索模板：名称、命令、关键词..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-[12.5px] bg-white/[0.03] border border-white/10 focus:border-violet-500/50 outline-none placeholder:text-slate-600 transition" />
              </div>
              <div className="text-[11px] text-slate-500">{filteredTemplates.length} / {COMMAND_TEMPLATES.length} 条模板</div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3">
              {filteredTemplates.map(t => {
                return (
                  <div key={t.id} className="group rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition overflow-hidden">
                    <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-white/5">
                      <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">{t.category}</span>
                      <span className="text-[13px] font-medium text-slate-100">{t.name}</span>
                      <div className="ml-auto flex items-center gap-1.5">
                        <RiskBadge level={t.risk} />
                        <button onClick={() => {
                          save(t.name, t.natural, t.command, t.explanation, t.risk)
                        }} title="收藏"
                          className="opacity-70 group-hover:opacity-100 hover:text-amber-400 transition">
                          <BookmarkIcon width={13} height={13} />
                        </button>
                        <button onClick={() => copy(t.command, `${t.name} 命令已复制`)} title="复制命令"
                          className="opacity-70 group-hover:opacity-100 hover:text-sky-400 transition">
                          <CopyIcon width={13} height={13} />
                        </button>
                      </div>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      <div className="text-[11.5px] text-slate-400 leading-5">{t.description}</div>
                      <pre className="p-2.5 rounded-lg text-[11.5px] leading-5 break-all whitespace-pre-wrap font-mono"
                        style={{ background: '#05070c', color: '#a5b4fc', border: '1px solid rgba(255,255,255,0.05)' }}>
{t.command}</pre>
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <ChevronRightIcon width={12} height={12} /> {t.natural.length > 38 ? t.natural.slice(0, 38) + '…' : t.natural}
                        </div>
                        <button onClick={() => useTemplate(t)}
                          className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-violet-500/20 hover:text-white transition text-slate-300 border border-white/10">
                          <ZapIcon width={11} height={11} /> 使用
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {filteredTemplates.length === 0 && (
                <div className="col-span-full p-10 text-center text-slate-500 rounded-xl border border-dashed border-white/10">
                  没有匹配的模板。试试换个关键词或类别？
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'hist' && (
          <div className="p-5 grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <ZapIcon width={14} height={14} className="text-slate-400" />
                  <span className="text-[12px] text-slate-300 font-medium">最近使用（最多100条）</span>
                </div>
                <button onClick={() => { if (confirm('确认清空历史？')) { setHistory([]); showToast('历史已清空') } }}
                  className="text-[11px] text-slate-500 hover:text-rose-400 transition">清空</button>
              </div>
              <div className="rounded-xl border border-white/10 overflow-hidden max-h-[64vh] overflow-y-auto divide-y divide-white/[0.06]">
                {history.length === 0 && (
                  <div className="p-10 text-center text-slate-500 text-[12.5px]">
                    暂无记录，切换到其他标签运行几次转换就会出现在这里。
                  </div>
                )}
                {history.map(h => (
                  <div key={h.id} className="px-4 py-3 hover:bg-white/[0.03] transition">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10.5px] px-1.5 py-0.5 rounded ${
                        h.mode === 'nl2cmd'
                          ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                          : 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                      }`}>{h.mode === 'nl2cmd' ? '自然 → 命令' : '命令 → 解释'}</span>
                      {h.risk && <RiskBadge level={h.risk} />}
                      <span className="ml-auto text-[10.5px] text-slate-500">{new Date(h.timestamp).toLocaleTimeString()}</span>
                      <button onClick={() => copy(h.output, '已复制结果')}
                        className="text-slate-500 hover:text-sky-400 transition">
                        <CopyIcon width={12} height={12} />
                      </button>
                    </div>
                    <div className="text-[12px] text-slate-400 line-clamp-1">{h.input}</div>
                    <div className="mt-1 text-[12px] font-mono text-slate-200 line-clamp-2 break-all">{h.output}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <BookmarkIcon width={14} height={14} className="text-amber-400/80" />
                  <span className="text-[12px] text-slate-300 font-medium">收藏夹（{saved.length}）</span>
                </div>
                {saved.length > 0 && (
                  <button onClick={() => { if (confirm('确认清空收藏？')) { setSaved([]); showToast('收藏已清空') } }}
                    className="text-[11px] text-slate-500 hover:text-rose-400 transition">清空</button>
                )}
              </div>
              <div className="rounded-xl border border-white/10 overflow-hidden max-h-[64vh] overflow-y-auto divide-y divide-white/[0.06]">
                {saved.length === 0 && (
                  <div className="p-10 text-center text-slate-500 text-[12.5px]">
                    还没有收藏。在「自然语言 → 命令」结果或「模板库」中点击书签图标即可保存。
                  </div>
                )}
                {saved.map(s => (
                  <div key={s.id} className="px-4 py-3 hover:bg-white/[0.03] transition group">
                    <div className="flex items-center gap-2 mb-1">
                      <RiskBadge level={s.risk} />
                      <span className="text-[12.5px] text-slate-100 font-medium truncate">{s.title || '未命名'}</span>
                      <span className="ml-auto flex items-center gap-1.5">
                        <button onClick={() => copy(s.command, s.title + '已复制')} title="复制命令"
                          className="opacity-70 group-hover:opacity-100 hover:text-sky-400 transition">
                          <CopyIcon width={12} height={12} />
                        </button>
                        <button onClick={() => { setNatural(s.natural); setNlResult({ command: s.command, explanation: s.explanation, risk: s.risk, source: '收藏' }); setTab('nl') }} title="载入编辑"
                          className="opacity-70 group-hover:opacity-100 hover:text-violet-400 transition">
                          <ZapIcon width={12} height={12} />
                        </button>
                        <button onClick={() => { setSaved(list => list.filter(x => x.id !== s.id)); showToast('已取消收藏') }} title="删除"
                          className="opacity-40 group-hover:opacity-100 hover:text-rose-400 transition">
                          ×
                        </button>
                      </span>
                    </div>
                    <div className="text-[11.5px] text-slate-500 mb-1 line-clamp-1">{s.natural}</div>
                    <pre className="p-2 rounded-md text-[11.5px] font-mono leading-5 break-all whitespace-pre-wrap"
                      style={{ background: '#05070c', color: '#a5b4fc', border: '1px solid rgba(255,255,255,0.05)' }}>
{s.command}</pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute left-1/2 bottom-5 -translate-x-1/2 px-4 py-2 rounded-lg text-[12.5px] shadow-2xl z-20 pointer-events-none"
          style={{
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid rgba(124, 58, 237, 0.35)',
            backdropFilter: 'blur(14px)',
            color: '#e9d5ff',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset',
          }}>
          {toast}
        </div>
      )}
    </div>
  )
}
