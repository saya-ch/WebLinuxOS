import { useState, useMemo, useCallback, useEffect } from 'react'

const COLORS = {
  bg: '#1a1a2e',
  sidebarBg: '#16162a',
  cardBg: '#0d1117',
  text: '#e6e6e6',
  textMuted: '#8b949e',
  accent: '#7c6cf0',
  accentLight: '#9580ff',
  border: 'rgba(255,255,255,0.08)',
  success: '#3fb950',
  codeBg: '#161b22',
  keywordColor: '#ff7b72',
  stringColor: '#a5d6ff',
  commentColor: '#8b949e',
  functionColor: '#d2a8ff',
}

interface CheatEntry {
  id: string
  title: string
  code: string
  description?: string
  category: string
}

const CATEGORY_ICONS: Record<string, string> = {
  'JavaScript / TypeScript': 'JS',
  'Python': 'PY',
  'Git': 'GI',
  'Linux / Unix': 'LU',
  'CSS': 'CS',
  'SQL': 'SQ',
  'Docker': 'DK',
  '正则表达式': 'RG',
}

const CATEGORY_COLORS: Record<string, string> = {
  'JavaScript / TypeScript': '#f7df1e',
  'Python': '#3776ab',
  'Git': '#f05032',
  'Linux / Unix': '#fcc624',
  'CSS': '#264de4',
  'SQL': '#e38c00',
  'Docker': '#2496ed',
  '正则表达式': '#3fb950',
}

const ALL_DATA: CheatEntry[] = [
  // ─── JavaScript / TypeScript ───
  { id: 'js1', category: 'JavaScript / TypeScript', title: '变量声明', code: 'const name = "hello"\nlet count = 0\nvar legacy = true', description: 'const 常量 / let 块级变量 / var 函数作用域' },
  { id: 'js2', category: 'JavaScript / TypeScript', title: '箭头函数', code: 'const add = (a: number, b: number): number => a + b\nconst greet = (name) => `Hello, ${name}!`\nconst noop = () => {}', description: '简洁函数语法，自动绑定 this' },
  { id: 'js3', category: 'JavaScript / TypeScript', title: '解构赋值', code: 'const { name, age, ...rest } = user\nconst [first, second, ...rest] = arr\nconst { address: addr } = nestedObj', description: '对象/数组解构，重命名，剩余参数' },
  { id: 'js4', category: 'JavaScript / TypeScript', title: 'Promise / async-await', code: 'async function fetchData() {\n  try {\n    const res = await fetch(url)\n    const data = await res.json()\n    return data\n  } catch (err) {\n    console.error(err)\n  }\n}', description: '异步函数与 Promise 处理' },
  { id: 'js5', category: 'JavaScript / TypeScript', title: '数组高阶方法', code: 'const doubled = arr.map(x => x * 2)\nconst evens = arr.filter(x => x % 2 === 0)\nconst sum = arr.reduce((acc, x) => acc + x, 0)\nconst found = arr.find(x => x > 5)\nconst exists = arr.some(x => x > 5)', description: 'map / filter / reduce / find / some' },
  { id: 'js6', category: 'JavaScript / TypeScript', title: '展开运算符', code: 'const merged = { ...defaults, ...custom }\nconst copy = [...original]\nfunc(...args)', description: '对象合并、数组拷贝、参数展开' },
  { id: 'js7', category: 'JavaScript / TypeScript', title: '可选链与空值合并', code: 'const city = user?.address?.city\nconst name = user ?? "Anonymous"\nconst val = input || "default"', description: '?. 安全访问 / ?? 空值合并 / || 逻辑或' },
  { id: 'js8', category: 'JavaScript / TypeScript', title: 'Map / Set', code: 'const map = new Map<string, number>()\nmap.set("key", 42)\nconst val = map.get("key")\n\nconst set = new Set([1, 2, 3, 3])\nset.add(4)\nset.has(2) // true', description: '键值映射 / 唯一值集合' },
  { id: 'js9', category: 'JavaScript / TypeScript', title: '类型断言与泛型', code: 'const input = document.getElementById("el") as HTMLInputElement\n\nfunction identity<T>(arg: T): T {\n  return arg\n}\nconst num = identity<number>(42)', description: 'TypeScript 类型系统基础' },
  { id: 'js10', category: 'JavaScript / TypeScript', title: '模块导入导出', code: 'export const PI = 3.14\nexport default function calc() {}\n\nimport calc, { PI } from "./math"\nimport * as math from "./math"', description: 'ES Module 标准导入/导出方式' },

  // ─── Python ───
  { id: 'py1', category: 'Python', title: '变量与类型', code: 'name = "Alice"          # str\nage: int = 30           # type hint\npi = 3.14               # float\nis_valid = True         # bool\nitems = [1, 2, 3]       # list\ndata = {"key": "val"}   # dict\npair = (1, 2)           # tuple\nunique = {1, 2, 3}      # set', description: 'Python 基本类型与类型提示' },
  { id: 'py2', category: 'Python', title: '列表推导式', code: 'squares = [x**2 for x in range(10)]\nevens = [x for x in range(20) if x % 2 == 0]\ncoords = [(x, y) for x in range(3) for y in range(3)]\ndict_comp = {k: v for k, v in zip(keys, vals)}\nset_comp = {x % 5 for x in range(100)}', description: '列表/字典/集合推导式，简洁创建数据结构' },
  { id: 'py3', category: 'Python', title: '函数定义', code: 'def greet(name: str, greeting: str = "Hello") -> str:\n    return f"{greeting}, {name}!"\n\n# Lambda\ndouble = lambda x: x * 2\n\n# *args / **kwargs\ndef func(*args, **kwargs):\n    print(args, kwargs)', description: '默认参数、类型提示、Lambda、可变参数' },
  { id: 'py4', category: 'Python', title: '类与继承', code: 'class Animal:\n    def __init__(self, name: str):\n        self.name = name\n\n    def speak(self):\n        raise NotImplementedError\n\nclass Dog(Animal):\n    def speak(self):\n        return f"{self.name} says Woof!"', description: '类定义、构造函数、方法重写' },
  { id: 'py5', category: 'Python', title: '上下文管理器', code: 'with open("file.txt", "r") as f:\n    content = f.read()\n\n# 自定义上下文管理器\nclass Timer:\n    def __enter__(self):\n        import time\n        self.start = time.time()\n        return self\n    def __exit__(self, *args):\n        print(f"Elapsed: {time.time()-self.start:.2f}s")', description: 'with 语句、资源管理、自定义上下文' },
  { id: 'py6', category: 'Python', title: '异常处理', code: 'try:\n    result = risky_operation()\nexcept ValueError as e:\n    print(f"Value error: {e}")\nexcept Exception:\n    print("Unknown error")\nfinally:\n    cleanup()', description: 'try/except/finally 异常处理链' },
  { id: 'py7', category: 'Python', title: '装饰器', code: 'def timer(func):\n    import time\n    def wrapper(*args, **kwargs):\n        start = time.time()\n        result = func(*args, **kwargs)\n        print(f"{func.__name__} took {time.time()-start:.2f}s")\n        return result\n    return wrapper\n\n@timer\ndef slow():\n    import time; time.sleep(1)', description: '函数装饰器，AOP 编程模式' },
  { id: 'py8', category: 'Python', title: '文件操作', code: 'from pathlib import Path\n\n# 读取\ncontent = Path("file.txt").read_text()\n\n# 写入\nPath("output.txt").write_text("hello")\n\n# 遍历目录\nfor p in Path(".").rglob("*.py"):\n    print(p)', description: 'pathlib 现代文件操作方式' },
  { id: 'py9', category: 'Python', title: '类型提示与 Protocol', code: 'from typing import Protocol, Optional\nfrom dataclasses import dataclass\n\n@dataclass\nclass Point:\n    x: float\n    y: float\n\nclass Drawable(Protocol):\n    def draw(self) -> None: ...\n\ndef render(d: Drawable) -> None:\n    d.draw()', description: 'dataclass、Protocol、类型系统' },
  { id: 'py10', category: 'Python', title: '迭代器与生成器', code: 'def fibonacci():\n    a, b = 0, 1\n    while True:\n        yield a\n        a, b = b, a + b\n\nfib = fibonacci()\nfirst_10 = [next(fib) for _ in range(10)]\n\n# 生成器表达式\ngen = (x**2 for x in range(1000000))', description: 'yield 生成器、惰性求值' },

  // ─── Git ───
  { id: 'git1', category: 'Git', title: '基本工作流', code: 'git init\ngit add .\ngit commit -m "feat: add new feature"\ngit log --oneline --graph', description: '初始化、暂存、提交、查看历史' },
  { id: 'git2', category: 'Git', title: '分支操作', code: 'git branch feature/login\ngit checkout -b feature/signup\ngit switch main\ngit merge feature/login\ngit branch -d feature/login', description: '创建/切换/合并/删除分支' },
  { id: 'git3', category: 'Git', title: '远程仓库', code: 'git remote add origin <url>\ngit push -u origin main\ngit pull origin main\ngit fetch --all --prune\ngit push --force-with-lease', description: '远程添加、推送、拉取、安全强制推送' },
  { id: 'git4', category: 'Git', title: '撤销操作', code: 'git restore file.txt           # 撤销工作区修改\ngit restore --staged file.txt  # 取消暂存\ngit reset --soft HEAD~1        # 撤销提交保留暂存\ngit reset --hard HEAD~1        # 撤销提交丢弃修改\ngit revert <commit>            # 反向提交', description: '各种撤销场景的 Git 命令' },
  { id: 'git5', category: 'Git', title: '暂存工作区', code: 'git stash\ngit stash push -m "WIP: feature"\ngit stash list\ngit stash pop\ngit stash apply stash@{1}\ngit stash drop stash@{0}', description: '临时保存/恢复工作进度' },
  { id: 'git6', category: 'Git', title: '交互式 Rebase', code: 'git rebase -i HEAD~3\n\n# pick = 保留\ne\ndrop = 丢弃\n# squash = 合并到上一个\n# reword = 修改提交信息\n# fixup = 合并并丢弃提交信息', description: '编辑、合并、重排提交' },
  { id: 'git7', category: 'Git', title: '标签管理', code: 'git tag v1.0.0\ngit tag -a v2.0.0 -m "Release 2.0"\ngit push origin --tags\ngit tag -d v1.0.0\ngit push origin :refs/tags/v1.0.0', description: '创建/推送/删除标签' },
  { id: 'git8', category: 'Git', title: '查看差异', code: 'git diff\ngit diff --staged\ngit diff branch1..branch2\ngit diff HEAD~3\ngit diff --stat\ngit diff --name-only', description: '比较工作区、暂存区、分支之间的差异' },
  { id: 'git9', category: 'Git', title: 'Git 别名配置', code: 'git config --global alias.co checkout\ngit config --global alias.br branch\ngit config --global alias.st status\ngit config --global alias.lg "log --oneline --graph --all"\ngit config --global alias.unstage "restore --staged"', description: '常用 Git 命令别名' },

  // ─── Linux / Unix ───
  { id: 'lin1', category: 'Linux / Unix', title: '文件操作', code: 'ls -la                      # 列出所有文件\ncp -r src/ dest/            # 递归复制\nmv file.txt newname.txt     # 移动/重命名\nrm -rf dir/                 # 强制递归删除\nln -s target link           # 创建符号链接\nmkdir -p a/b/c              # 递归创建目录', description: 'ls / cp / mv / rm / ln / mkdir' },
  { id: 'lin2', category: 'Linux / Unix', title: '文本处理', code: 'cat file.txt                # 显示文件\nhead -n 20 file.txt         # 前 20 行\ntail -f /var/log/syslog     # 实时跟踪\nwc -l file.txt              # 行数统计\nsort file.txt | uniq -c     # 排序去重计数\ncut -d, -f1,3 data.csv      # 按分隔符切割', description: 'cat / head / tail / wc / sort / cut' },
  { id: 'lin3', category: 'Linux / Unix', title: '搜索与查找', code: 'grep -rn "pattern" dir/     # 递归搜索\nfind . -name "*.js" -mtime 7  # 查找7天内的js文件\nwhich python3               # 查找命令路径\nlocate filename             # 从数据库查找\nrg "pattern"               # ripgrep 高速搜索', description: 'grep / find / which / locate / ripgrep' },
  { id: 'lin4', category: 'Linux / Unix', title: '进程管理', code: 'ps aux | grep node          # 查找进程\nkill -9 <pid>               # 强制终止\nkill -15 <pid>              # 优雅终止\nhtop                        # 交互式进程查看\nnohup command &             # 后台运行\njobs / fg / bg              # 作业控制', description: 'ps / kill / htop / nohup / jobs' },
  { id: 'lin5', category: 'Linux / Unix', title: '网络工具', code: 'curl -s https://api.github.com  # HTTP 请求\nwget -O file.zip <url>          # 下载文件\nss -tlnp                      # 查看监听端口\nip addr show                  # 查看IP地址\nping -c 4 google.com          # 网络连通测试\ntraceroute google.com         # 路由追踪', description: 'curl / wget / ss / ip / ping / traceroute' },
  { id: 'lin6', category: 'Linux / Unix', title: '权限管理', code: 'chmod 755 file               # 设置权限\nchmod +x script.sh           # 添加执行权限\nchown user:group file        # 修改所有者\nsudo command                 # 以root执行\nvisudo                       # 安全编辑sudoers', description: 'chmod / chown / sudo 权限控制' },
  { id: 'lin7', category: 'Linux / Unix', title: '磁盘与存储', code: 'df -h                        # 磁盘使用概览\ndu -sh /var/log              # 目录大小\nlsblk                        # 块设备列表\nmount /dev/sdb1 /mnt         # 挂载\ncrontab -e                   # 编辑定时任务', description: 'df / du / lsblk / mount / crontab' },
  { id: 'lin8', category: 'Linux / Unix', title: '管道与重定向', code: 'command > file               # 输出重定向\ncommand >> file              # 追加输出\ncommand 2>&1                 # 合并错误输出\ncmd1 | cmd2                 # 管道连接\nxargs -I{} cmd {}            # 参数传递\ncmd1 && cmd2                 # 前者成功后执行', description: '重定向 / 管道 / xargs / 逻辑组合' },

  // ─── CSS ───
  { id: 'css1', category: 'CSS', title: 'Flexbox 布局', code: '.container {\n  display: flex;\n  justify-content: center;    /* 水平居中 */\n  align-items: center;        /* 垂直居中 */\n  gap: 1rem;                  /* 元素间距 */\n  flex-wrap: wrap;\n}\n.item {\n  flex: 1;                    /* 均分空间 */\n  flex-shrink: 0;             /* 不缩小 */\n}', description: '弹性盒子布局核心属性' },
  { id: 'css2', category: 'CSS', title: 'Grid 布局', code: '.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  grid-template-rows: auto 1fr auto;\n  gap: 16px;\n  padding: 20px;\n}\n.span-2 { grid-column: span 2; }', description: '二维网格布局系统' },
  { id: 'css3', category: 'CSS', title: '响应式断点', code: '/* Mobile First */\n.container { padding: 8px; }\n\n@media (min-width: 640px) {\n  .container { padding: 16px; }\n}\n@media (min-width: 1024px) {\n  .container { max-width: 1200px; margin: 0 auto; }\n}\n@media (min-width: 1280px) {\n  .container { padding: 32px; }\n}', description: '移动端优先的响应式设计' },
  { id: 'css4', category: 'CSS', title: 'CSS 变量', code: ':root {\n  --primary: #7c6cf0;\n  --bg: #1a1a2e;\n  --text: #e6e6e6;\n  --radius: 8px;\n}\n\n.card {\n  background: var(--bg);\n  color: var(--text);\n  border-radius: var(--radius);\n  border: 1px solid rgba(255,255,255,0.1);\n}', description: 'CSS 自定义属性（设计令牌）' },
  { id: 'css5', category: 'CSS', title: '过渡与动画', code: '.btn {\n  transition: all 0.3s ease;\n  transform: scale(1);\n}\n.btn:hover {\n  transform: scale(1.05);\n  box-shadow: 0 4px 20px rgba(0,0,0,0.3);\n}\n\n@keyframes fade-in {\n  from { opacity: 0; transform: translateY(10px); }\n  to   { opacity: 1; transform: translateY(0); }\n}\n.animate { animation: fade-in 0.5s ease; }', description: 'CSS 过渡与关键帧动画' },
  { id: 'css6', category: 'CSS', title: '伪类与伪元素', code: 'a:hover { color: var(--primary); }\ninput:focus { outline: 2px solid var(--accent); }\nli:first-child { font-weight: bold; }\nli:nth-child(even) { background: #f5f5f5; }\n\n::before { content: "→ "; color: var(--primary); }\n::after { content: " ✓"; color: green; }\n::placeholder { color: #999; }', description: '伪类选择器与伪元素' },
  { id: 'css7', category: 'CSS', title: '文本排版', code: '.text {\n  font-size: clamp(1rem, 2.5vw, 1.5rem);\n  line-height: 1.6;\n  letter-spacing: 0.02em;\n  text-align: center;\n  overflow-wrap: break-word;\n  display: -webkit-box;\n  -webkit-line-clamp: 3;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n}', description: '响应式字体、行高、文本截断' },
  { id: 'css8', category: 'CSS', title: '层叠与特异性', code: '/* 特异性从低到高 */\nbody .container p { }        /* 0-0-3 */\n.container .card p { }       /* 0-0-3 */\n.card > p.text { }           /* 0-0-3 */\np { }                        /* 0-0-1 */\n\n/* 覆盖框架样式 */\n.component :where(.btn) {\n  color: white;\n}', description: '选择器特异性与覆盖策略' },
  { id: 'css9', category: 'CSS', title: '暗色模式', code: '@media (prefers-color-scheme: dark) {\n  :root {\n    --bg: #0d1117;\n    --text: #c9d1d9;\n    --border: #30363d;\n  }\n}\n\n.dark-mode {\n  --bg: #0d1117;\n  background: var(--bg);\n  color-scheme: dark;\n}', description: '系统级与手动暗色模式切换' },

  // ─── SQL ───
  { id: 'sql1', category: 'SQL', title: '基本查询', code: "SELECT name, age\nFROM users\nWHERE age > 18\nORDER BY name ASC\nLIMIT 10 OFFSET 0;", description: 'SELECT / WHERE / ORDER BY / LIMIT' },
  { id: 'sql2', category: 'SQL', title: '聚合函数', code: "SELECT\n  department,\n  COUNT(*) as count,\n  AVG(salary) as avg_salary,\n  MAX(salary) as max_salary,\n  SUM(salary) as total_salary\nFROM employees\nGROUP BY department\nHAVING COUNT(*) > 5;", description: 'COUNT / AVG / MAX / SUM / GROUP BY / HAVING' },
  { id: 'sql3', category: 'SQL', title: 'JOIN 连接', code: "-- 内连接\nSELECT u.name, o.id\nFROM users u\nINNER JOIN orders o ON u.id = o.user_id\n\n-- 左连接\nSELECT u.name, COALESCE(o.total, 0)\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\n\n-- 多表连接\nSELECT u.name, o.total, p.title\nFROM users u\nJOIN orders o ON u.id = o.user_id\nJOIN products p ON o.product_id = p.id", description: 'INNER / LEFT / RIGHT / FULL JOIN' },
  { id: 'sql4', category: 'SQL', title: '插入与更新', code: "-- 插入\nINSERT INTO users (name, email)\nVALUES ('Alice', 'alice@example.com')\n\n-- 批量插入\nINSERT INTO users (name, email)\nVALUES ('Bob', 'bob@test.com'),\n       ('Carol', 'carol@test.com')\n\n-- 更新\nUPDATE users\nSET name = 'Alice Smith'\nWHERE id = 1\n\n-- 删除\nDELETE FROM users WHERE id = 1", description: 'INSERT / UPDATE / DELETE 操作' },
  { id: 'sql5', category: 'SQL', title: '子查询与 CTE', code: "-- 子查询\nSELECT * FROM users\nWHERE id IN (SELECT user_id FROM orders)\n\n-- CTE（公共表表达式）\nWITH active_users AS (\n  SELECT user_id, COUNT(*) as orders\n  FROM orders\n  WHERE created_at > '2024-01-01'\n  GROUP BY user_id\n  HAVING COUNT(*) > 3\n)\nSELECT u.*, au.orders\nFROM users u\nJOIN active_users au ON u.id = au.user_id", description: '子查询、WITH 子句 (CTE)' },
  { id: 'sql6', category: 'SQL', title: '索引与性能', code: "-- 创建索引\nCREATE INDEX idx_users_email ON users(email)\nCREATE UNIQUE INDEX idx_users_email ON users(email)\n\n-- 复合索引\nCREATE INDEX idx_orders_user_date\nON orders(user_id, created_at DESC)\n\n-- 查看执行计划\nEXPLAIN ANALYZE\nSELECT * FROM users WHERE email = 'a@b.com'", description: '索引创建与查询优化' },
  { id: 'sql7', category: 'SQL', title: '窗口函数', code: "SELECT\n  name,\n  department,\n  salary,\n  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as rank,\n  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rnk,\n  AVG(salary) OVER (PARTITION BY department) as dept_avg,\n  salary - LAG(salary) OVER (ORDER BY salary) as diff\nFROM employees", description: 'ROW_NUMBER / RANK / LAG / 聚合窗口' },
  { id: 'sql8', category: 'SQL', title: '事务处理', code: "BEGIN TRANSACTION;\n\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\n\n-- 检查约束\nDO $$\nBEGIN\n  IF (SELECT balance FROM accounts WHERE id = 1) < 0 THEN\n    RAISE EXCEPTION 'Insufficient funds';\n  END IF;\nEND $$;\n\nCOMMIT;", description: 'BEGIN / COMMIT / ROLLBACK 事务控制' },

  // ─── Docker ───
  { id: 'dk1', category: 'Docker', title: '基础操作', code: 'docker run -d --name app -p 8080:80 nginx\ndocker ps -a\ndocker stop app\ndocker rm app\ndocker logs -f app\ndocker exec -it app /bin/bash', description: '运行/查看/停止/删除/日志/进入容器' },
  { id: 'dk2', category: 'Docker', title: '镜像管理', code: 'docker build -t myapp:1.0 .\ndocker images\ndocker pull node:20-alpine\ndocker tag myapp:1.0 myapp:latest\ndocker push myrepo/myapp:1.0\ndocker rmi myapp:1.0\ndocker image prune -a', description: '构建/拉取/推送/清理镜像' },
  { id: 'dk3', category: 'Docker', title: 'Dockerfile 示例', code: 'FROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nRUN npm run build\n\nFROM node:20-alpine\nWORKDIR /app\nCOPY --from=builder /app/dist ./dist\nCOPY --from=builder /app/node_modules ./node_modules\nEXPOSE 3000\nCMD ["node", "dist/server.js"]', description: '多阶段构建 Dockerfile 模板' },
  { id: 'dk4', category: 'Docker', title: '数据卷管理', code: '# 命名卷\ndocker volume create mydata\ndocker run -v mydata:/app/data myimage\n\n# 绑定挂载\ndocker run -v $(pwd)/src:/app/src myimage\n\n# 查看卷\ndocker volume ls\ndocker volume inspect mydata\ndocker volume prune', description: '持久化存储与挂载' },
  { id: 'dk5', category: 'Docker', title: '网络管理', code: 'docker network create mynet\ndocker network ls\ndocker network inspect mynet\n\n# 连接容器到网络\ndocker run --network mynet --name db postgres\ndocker run --network mynet --name app myimage\n\n# 端口映射\ndocker run -p 8080:80 -p 3000:3000 myimage', description: '网络创建、容器互联、端口映射' },
  { id: 'dk6', category: 'Docker', title: 'Docker Compose', code: 'services:\n  web:\n    build: .\n    ports:\n      - "3000:3000"\n    depends_on:\n      - db\n    environment:\n      - DATABASE_URL=postgres://db:5432/mydb\n\n  db:\n    image: postgres:16-alpine\n    volumes:\n      - pgdata:/var/lib/postgresql/data\n    environment:\n      - POSTGRES_PASSWORD=secret\n\nvolumes:\n  pgdata:', description: 'docker-compose.yml 编排模板' },
  { id: 'dk7', category: 'Docker', title: 'Compose 常用命令', code: 'docker compose up -d\ndocker compose down\ndocker compose ps\ndocker compose logs -f web\ndocker compose exec web sh\ndocker compose build --no-cache\ndocker compose pull\ndocker compose restart web', description: '启动/停止/日志/构建/重启' },
  { id: 'dk8', category: 'Docker', title: '清理与调试', code: 'docker system df\ndocker system prune -af\ndocker inspect <container>\ndocker top <container>\ndocker stats\ndocker diff <container>\ndocker cp <container>:/app/log.txt ./', description: '磁盘清理、容器调试、文件拷贝' },

  // ─── 正则表达式 ───
  { id: 'rg1', category: '正则表达式', title: '基础匹配', code: '// 基本匹配\n/abc/        // 匹配 "abc"\n/^hello/     // 行首匹配\n/world$/     // 行尾匹配\n/^start.*end$/  // 行首到行尾\n\n// 量词\n/a{3}/       // 精确3次\n/a{2,4}/     // 2到4次\n/a+/         // 1次以上\n/a*/         // 0次以上\n/a?/         // 0或1次', description: '锚点、量词、贪婪/非贪婪' },
  { id: 'rg2', category: '正则表达式', title: '字符类', code: '/[abc]/      // 匹配 a 或 b 或 c\n/[a-z]/      // 小写字母\n/[A-Za-z]/   // 所有字母\n/[0-9]/      // 数字\\d\n/[^abc]/     // 非 a,b,c\\n/./          // 任意字符(除换行)\n/\\d/         // 数字\\n/\\w/         // 单词字符 [a-zA-Z0-9_]\n/\\s/         // 空白字符', description: '字符类、转义序列、预定义类' },
  { id: 'rg3', category: '正则表达式', title: '分组与捕获', code: '// 捕获组\n/(\\d{4})-(\\d{2})-(\\d{2})/\n// $1=年 $2=月 $3=日\n\n// 命名分组\n/(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})/\nmatch.groups.year\n\n// 非捕获组\n/(?:https?):\\/\\/[^\s]+/\n\n// 反向引用\n/(\\w+)\\s+\\1/  // 匹配重复单词', description: '捕获组、命名组、反向引用' },
  { id: 'rg4', category: '正则表达式', title: '常用正则模式', code: '// 邮箱\n/^[\\w.-]+@[\\w.-]+\\.\\w{2,}$/\n\n// URL\n/https?:\\/\\/[\\w\\-._~:/?#\\[\\]@!$&\'()*+,;=%]+/\n\n// 手机号(中国)\n/^1[3-9]\\d{9}$/\n\n// IPv4\n/^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$/\n\n// 中文\n/^[\\u4e00-\\u9fa5]+$/\n\n// 密码强度(>=8位,含大小写数字)\n/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$/', description: '邮箱、URL、手机号、IP、中文' },
  { id: 'rg5', category: '正则表达式', title: '前瞻与后顾', code: '// 正向前瞻：后面是 X\n/\\w+(?=\\d)/    // 后面跟数字的单词\n\n// 负向前瞻：后面不是 X\n/\\w+(?!\\d)/    // 后面不跟数字的单词\n\n// 正向后顾：前面是 X\n/(?<=\\$)\\d+/  // 前面是$的数字\n\n// 负向后顾：前面不是 X\n/(?<!\\#)\\w+/  // 前面不是#的单词', description: 'Lookahead / Lookbehind 断言' },
  { id: 'rg6', category: '正则表达式', title: '标志与替换', code: '// 常用标志\n/abc/gi   // g=全局 i=忽略大小写\n/abc/m    // m=多行模式\n/abc/s    // s=点号匹配换行\n\n// 字符串方法\n"hello world".match(/\\w+/g)\n"a1b2".replace(/\\d/g, "*")     // a*b*\n"a1b2".match(/(\\w)(\\d)/g)\n/abc/i.test("ABC")              // true', description: 'g/i/m/s 标志、match/replace/test' },
  { id: 'rg7', category: '正则表达式', title: '零宽断言详解', code: '// 密码验证示例\n// 至少一个大写、一个小写、一个数字、一个特殊字符\n/^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%]).{8,}$/\n\n// 格式化数字\n"1234567890".replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",")\n// → "1,234,567,890"\n\n// 匹配不在标签内的内容\n/<(?!\\/)[^>]+>([^<]+)/g', description: '复杂断言组合、实用技巧' },
]

const CATEGORIES = [...new Set(ALL_DATA.map(d => d.category))]

// ─── 语法高亮 ───
function highlightCode(code: string, category: string): { __html: string } {
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 注释 (单行 // 或 --)
  escaped = escaped.replace(/(\/\/.*$|--.*$)/gm, `<span style="color:${COLORS.commentColor}">$1</span>`)

  // 字符串 (单引号、双引号、模板字符串)
  escaped = escaped.replace(/(&quot;[^&]*?&quot;|'[^']*?'|"[^"]*?"|`[^`]*?`)/g, `<span style="color:${COLORS.stringColor}">$1</span>`)
  escaped = escaped.replace(/((?:&quot;|'|")[^<]*?(?:&quot;|'|"))/g, (match) => {
    if (match.includes('span')) return match
    return `<span style="color:${COLORS.stringColor}">${match}</span>`
  })

  // 关键字
  const jsKw = 'const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|extends|new|this|import|export|default|from|async|await|try|catch|finally|throw|typeof|instanceof|in|of|void|delete|yield|super|static|get|set|as|type|interface|enum|implements|abstract|readonly|private|public|protected'
  const pyKw = 'def|class|return|if|elif|else|for|while|import|from|as|with|try|except|finally|raise|pass|break|continue|and|or|not|in|is|lambda|yield|global|nonlocal|assert|del|print|self|True|False|None|async|await'
  const shellKw = 'git|docker|sudo|chmod|chown|mkdir|cp|mv|rm|ls|cat|grep|find|kill|curl|wget|ssh|scp|tar|zip|unzip|cd|pwd|echo|export|alias|source|pip|npm|node|python'
  const sqlKw = 'SELECT|FROM|WHERE|AND|OR|NOT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|ALTER|DROP|TABLE|INDEX|JOIN|INNER|LEFT|RIGHT|FULL|ON|GROUP|BY|HAVING|ORDER|ASC|DESC|LIMIT|OFFSET|AS|IN|EXISTS|BETWEEN|LIKE|IS|NULL|CASE|WHEN|THEN|ELSE|END|UNION|ALL|WITH|RECURSIVE|EXPLAIN|ANalyze|BEGIN|COMMIT|ROLLBACK|DO|RAISE|PARTITION|OVER|ROW_NUMBER|RANK|LAG|LEAD|AVG|COUNT|SUM|MAX|MIN|DISTINCT'
  const cssKw = 'display|flex|grid|justify-content|align-items|gap|flex-wrap|padding|margin|border|border-radius|background|color|font-size|line-height|text-align|overflow|width|height|position|top|left|right|bottom|z-index|transform|transition|animation|opacity|box-shadow|max-width|min-width|grid-template-columns|grid-template-rows'

  let keywords: string
  if (category === 'JavaScript / TypeScript') {
    keywords = jsKw
  } else if (category === 'Python') {
    keywords = pyKw
  } else if (category === 'SQL') {
    keywords = sqlKw
  } else if (category === 'CSS') {
    keywords = cssKw
  } else {
    keywords = shellKw
  }

  const kwRegex = new RegExp(`\\b(${keywords})\\b`, 'g')
  escaped = escaped.replace(kwRegex, (match) => {
    return `<span style="color:${COLORS.keywordColor}">${match}</span>`
  })

  // 数字
  escaped = escaped.replace(/\b(\d+\.?\d*)\b/g, `<span style="color:#79c0ff">$1</span>`)

  // 函数名 (后跟括号)
  escaped = escaped.replace(/\b([a-zA-Z_]\w*)\s*(?=\()/g, (match, name) => {
    if (keywords.split('|').includes(name)) return match
    return `<span style="color:${COLORS.functionColor}">${name}</span>`
  })

  return { __html: escaped }
}

// ─── 搜索高亮 ───
function highlightSearch(text: string, query: string): { __html: string } {
  if (!query) return { __html: text }
  const escaped = text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c))
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return { __html: escaped.replace(regex, '<mark style="background:#7c6cf0;color:#fff;padding:0 2px;border-radius:2px">$1</mark>') }
}

// ─── 图标组件 ───
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
)

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
  </svg>
)

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#f59e0b' : 'none'} stroke={filled ? '#f59e0b' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
  </svg>
)

export default function DeveloperCheatSheet() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0])
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('dev-cheatsheet-favorites')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  useEffect(() => {
    localStorage.setItem('dev-cheatsheet-favorites', JSON.stringify([...favorites]))
  }, [favorites])

  const toggleCard = useCallback((id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const copyCode = useCallback(async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    }
  }, [])

  const filteredData = useMemo(() => {
    let data = ALL_DATA
    if (showFavoritesOnly) {
      data = data.filter(d => favorites.has(d.id))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      data = data.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q)) ||
        d.category.toLowerCase().includes(q)
      )
    }
    return data
  }, [searchQuery, favorites, showFavoritesOnly])

  const categorizedData = useMemo(() => {
    const map: Record<string, CheatEntry[]> = {}
    for (const cat of CATEGORIES) map[cat] = []
    for (const entry of filteredData) {
      if (map[entry.category]) map[entry.category].push(entry)
    }
    return map
  }, [filteredData])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cat of CATEGORIES) {
      counts[cat] = categorizedData[cat].length
    }
    return counts
  }, [categorizedData])

  const activeEntries = categorizedData[activeCategory] || []

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      background: COLORS.bg,
      color: COLORS.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
      fontSize: 13,
      overflow: 'hidden',
    }}>
      {/* ── 侧边栏 ── */}
      <aside style={{
        width: 220,
        minWidth: 220,
        background: COLORS.sidebarBg,
        borderRight: `1px solid ${COLORS.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* 搜索栏 */}
        <div style={{ padding: '12px 10px 8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 8,
            padding: '7px 10px',
            border: `1px solid ${COLORS.border}`,
          }}>
            <span style={{ color: COLORS.textMuted, display: 'flex' }}><SearchIcon /></span>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索命令/语法..."
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: COLORS.text,
                fontSize: 12,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none', border: 'none', color: COLORS.textMuted,
                  cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1,
                }}
              >×</button>
            )}
          </div>
        </div>

        {/* 收藏筛选 */}
        <div style={{ padding: '0 10px 8px' }}>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: showFavoritesOnly ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${showFavoritesOnly ? 'rgba(245,158,11,0.3)' : COLORS.border}`,
              borderRadius: 6,
              padding: '6px 10px',
              color: showFavoritesOnly ? '#f59e0b' : COLORS.textMuted,
              cursor: 'pointer',
              fontSize: 12,
              width: '100%',
              textAlign: 'left',
            }}
          >
            <HeartIcon filled={showFavoritesOnly} />
            <span>{showFavoritesOnly ? '显示全部' : '仅看收藏'}</span>
            {favorites.size > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: 'rgba(245,158,11,0.2)',
                color: '#f59e0b',
                borderRadius: 10,
                padding: '1px 6px',
                fontSize: 10,
              }}>{favorites.size}</span>
            )}
          </button>
        </div>

        {/* 分类列表 */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0 6px 10px' }}>
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat && !showFavoritesOnly
            const count = showFavoritesOnly
              ? filteredData.filter(d => d.category === cat).length
              : categoryCounts[cat]
            const catColor = CATEGORY_COLORS[cat] || COLORS.accent

            return (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setShowFavoritesOnly(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 10px',
                  marginBottom: 2,
                  border: 'none',
                  borderRadius: 6,
                  background: isActive
                    ? 'rgba(124,108,240,0.15)'
                    : 'transparent',
                  color: isActive ? COLORS.accentLight : COLORS.text,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.target as HTMLElement).style.background = 'transparent'
                }}
              >
                <span style={{
                  width: 24, height: 24,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 5,
                  background: isActive ? catColor : 'rgba(255,255,255,0.06)',
                  color: isActive ? '#fff' : catColor,
                  fontSize: 9, fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {CATEGORY_ICONS[cat]}
                </span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
                <span style={{
                  fontSize: 10,
                  color: COLORS.textMuted,
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 8,
                  padding: '1px 6px',
                  flexShrink: 0,
                }}>{count}</span>
              </button>
            )
          })}
        </nav>

        {/* 底部统计 */}
        <div style={{
          padding: '10px 12px',
          borderTop: `1px solid ${COLORS.border}`,
          fontSize: 11,
          color: COLORS.textMuted,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <BookIcon />
          <span>共 {ALL_DATA.length} 条速查条目</span>
        </div>
      </aside>

      {/* ── 主内容区 ── */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        padding: 20,
      }}>
        {/* 顶部标题区 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.text }}>
              {showFavoritesOnly ? '★ 收藏的速查条目' : activeCategory}
            </h1>
            <span style={{
              fontSize: 11,
              color: COLORS.textMuted,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 10,
              padding: '2px 8px',
            }}>
              {activeEntries.length} 条
            </span>
          </div>
          {!showFavoritesOnly && (
            <p style={{ margin: 0, fontSize: 12, color: COLORS.textMuted }}>
              {getCategoryDesc(activeCategory)}
            </p>
          )}
          {searchQuery && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: COLORS.accentLight }}>
              搜索 "{searchQuery}" — 找到 {filteredData.length} 个结果
            </p>
          )}
        </div>

        {/* 搜索栏（移动端可见，桌面端也可用） */}
        <div style={{
          marginBottom: 14,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: COLORS.cardBg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            padding: '8px 12px',
          }}>
            <span style={{ color: COLORS.textMuted, display: 'flex' }}><SearchIcon /></span>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索命令、语法、关键字..."
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: COLORS.text,
                fontSize: 13,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none', border: 'none', color: COLORS.textMuted,
                  cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1,
                }}
              >×</button>
            )}
          </div>
        </div>

        {/* 条目卡片列表 */}
        {activeEntries.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: COLORS.textMuted,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              {showFavoritesOnly ? '☆' : '🔍'}
            </div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>
              {showFavoritesOnly ? '暂无收藏的条目' : '没有找到匹配的结果'}
            </div>
            <div style={{ fontSize: 12 }}>
              {showFavoritesOnly ? '点击条目上的星标即可收藏' : '尝试其他搜索关键词'}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activeEntries.map(entry => {
            const isExpanded = expandedCards.has(entry.id) || !!searchQuery
            const isFav = favorites.has(entry.id)
            const isCopied = copiedId === entry.id
            const catColor = CATEGORY_COLORS[entry.category] || COLORS.accent

            return (
              <div
                key={entry.id}
                style={{
                  background: COLORS.cardBg,
                  borderRadius: 10,
                  border: `1px solid ${isExpanded ? catColor + '40' : COLORS.border}`,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* 卡片头部 */}
                <div
                  onClick={() => toggleCard(entry.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <ChevronIcon expanded={isExpanded} />

                  <span
                    style={{ fontSize: 13, fontWeight: 600, flex: 1, color: COLORS.text }}
                    dangerouslySetInnerHTML={highlightSearch(entry.title, searchQuery)}
                  />

                  {/* 操作按钮 */}
                  <button
                    onClick={e => { e.stopPropagation(); toggleFavorite(entry.id) }}
                    title={isFav ? '取消收藏' : '收藏'}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 4,
                      color: isFav ? '#f59e0b' : COLORS.textMuted,
                      transition: 'color 0.15s',
                    }}
                  >
                    <HeartIcon filled={isFav} />
                  </button>

                  <button
                    onClick={e => { e.stopPropagation(); copyCode(entry.id, entry.code) }}
                    title="复制代码"
                    style={{
                      background: isCopied ? 'rgba(63,185,80,0.15)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${isCopied ? 'rgba(63,185,80,0.3)' : COLORS.border}`,
                      cursor: 'pointer',
                      padding: '3px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      borderRadius: 5,
                      color: isCopied ? COLORS.success : COLORS.textMuted,
                      fontSize: 11,
                      transition: 'all 0.15s',
                    }}
                  >
                    {isCopied ? <CheckIcon /> : <CopyIcon />}
                    {isCopied ? '已复制' : '复制'}
                  </button>
                </div>

                {/* 卡片内容 */}
                {isExpanded && (
                  <div style={{ padding: '0 14px 12px' }}>
                    {entry.description && (
                      <div style={{
                        fontSize: 12,
                        color: COLORS.textMuted,
                        marginBottom: 8,
                        paddingLeft: 24,
                        lineHeight: 1.5,
                      }}>
                        {entry.description}
                      </div>
                    )}
                    <div style={{
                      background: COLORS.codeBg,
                      borderRadius: 8,
                      border: `1px solid ${COLORS.border}`,
                      overflow: 'auto',
                      maxHeight: 400,
                    }}>
                      <pre style={{
                        margin: 0,
                        padding: '12px 14px',
                        fontSize: 12,
                        lineHeight: 1.6,
                        fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
                        whiteSpace: 'pre',
                        color: COLORS.text,
                      }}>
                        <code dangerouslySetInnerHTML={highlightCode(entry.code, entry.category)} />
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 底部间距 */}
        <div style={{ height: 40 }} />
      </main>
    </div>
  )
}

function getCategoryDesc(category: string): string {
  const descs: Record<string, string> = {
    'JavaScript / TypeScript': 'JavaScript 与 TypeScript 常用语法、ES6+ 特性、类型系统',
    'Python': 'Python 常用语法、数据结构、装饰器、类型提示',
    'Git': 'Git 版本控制常用命令与工作流',
    'Linux / Unix': 'Linux/Unix 系统常用命令与工具',
    'CSS': 'CSS 布局、响应式设计、动画、变量',
    'SQL': 'SQL 查询语言、聚合、JOIN、事务',
    'Docker': 'Docker 容器化、Compose 编排、镜像管理',
    '正则表达式': '正则表达式语法、常用模式、JavaScript/Python 正则方法',
  }
  return descs[category] || ''
}
