import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

const cheatSheets: Record<string, { title: string; content: string[] }> = {
  git: {
    title: 'Git 常用命令',
    content: [
      '基础操作:',
      '  git init                    初始化仓库',
      '  git clone <url>             克隆仓库',
      '  git status                  查看状态',
      '  git add <file>              暂存文件',
      '  git add .                   暂存所有更改',
      '',
      '提交:',
      '  git commit -m "message"     提交更改',
      '  git commit --amend          修改最后一次提交',
      '',
      '分支:',
      '  git branch                  列出分支',
      '  git branch <name>           创建分支',
      '  git checkout <branch>       切换分支',
      '  git merge <branch>          合并分支',
      '',
      '远程:',
      '  git push origin <branch>    推送到远程',
      '  git pull origin <branch>    拉取远程',
      '  git fetch                   获取远程更新',
      '',
      '撤销:',
      '  git checkout -- <file>      撤销工作区更改',
      '  git reset HEAD <file>       撤销暂存区',
      '  git revert <commit>         撤销提交',
    ],
  },
  linux: {
    title: 'Linux 常用命令',
    content: [
      '文件系统:',
      '  ls                          列出文件',
      '  ls -la                      详细列表',
      '  cd <dir>                    切换目录',
      '  pwd                         显示当前路径',
      '  mkdir <dir>                 创建目录',
      '  rm <file>                   删除文件',
      '  rm -rf <dir>                删除目录',
      '',
      '文件操作:',
      '  cat <file>                  查看文件',
      '  head <file>                 查看头部',
      '  tail <file>                 查看尾部',
      '  tail -f <file>              实时跟踪',
      '  cp <src> <dest>             复制文件',
      '  mv <src> <dest>             移动文件',
      '',
      '搜索:',
      '  grep <pattern> <file>       搜索内容',
      '  find <dir> -name <pattern>  查找文件',
      '',
      '系统:',
      '  ps aux                      查看进程',
      '  top                         进程监控',
      '  df -h                       磁盘使用',
      '  free -h                     内存使用',
      '',
      '网络:',
      '  ping <host>                 测试连通性',
      '  curl <url>                  发送请求',
      '  wget <url>                  下载文件',
    ],
  },
  npm: {
    title: 'npm 常用命令',
    content: [
      '安装:',
      '  npm install                 安装依赖',
      '  npm install <pkg>           安装包',
      '  npm install -D <pkg>        开发依赖',
      '  npm install -g <pkg>        全局安装',
      '',
      '脚本:',
      '  npm run <script>            运行脚本',
      '  npm start                   启动项目',
      '  npm test                    运行测试',
      '  npm run build               构建项目',
      '',
      '发布:',
      '  npm publish                 发布包',
      '  npm version <patch/minor/major>',
      '',
      '其他:',
      '  npm list                    列出依赖',
      '  npm outdated                检查更新',
      '  npm update <pkg>            更新包',
      '  npm uninstall <pkg>         卸载包',
    ],
  },
  python: {
    title: 'Python 常用命令',
    content: [
      '运行:',
      '  python <file>.py            运行脚本',
      '  python -m <module>          运行模块',
      '  python -c "code"            执行代码',
      '',
      '虚拟环境:',
      '  python -m venv <dir>        创建虚拟环境',
      '  source <dir>/bin/activate   激活(linux)',
      '  <dir>\\Scripts\\activate     激活(windows)',
      '',
      '包管理:',
      '  pip install <pkg>           安装包',
      '  pip install -r requirements.txt',
      '  pip freeze > requirements.txt',
      '  pip uninstall <pkg>         卸载包',
      '',
      '其他:',
      '  python -h                   帮助',
      '  python -V                   版本',
      '  python -m pip install --upgrade pip',
    ],
  },
  react: {
    title: 'React 开发常用',
    content: [
      '创建项目:',
      '  npx create-react-app <name>',
      '  npx create-next-app <name>',
      '  npx create-vite@6.5.0 . --template react',
      '',
      'Hooks:',
      '  useState                    状态管理',
      '  useEffect                   副作用',
      '  useContext                  上下文',
      '  useReducer                  复杂状态',
      '  useMemo/useCallback         性能优化',
      '',
      '命令:',
      '  npm start                   开发模式',
      '  npm run build               生产构建',
      '  npm test                    运行测试',
      '',
      '路由:',
      '  react-router-dom            官方路由',
      '  useNavigate                 导航',
      '  useParams                   URL参数',
    ],
  },
  typescript: {
    title: 'TypeScript 常用',
    content: [
      '初始化:',
      '  tsc --init                  创建配置',
      '',
      '编译:',
      '  tsc <file>.ts               编译文件',
      '  tsc                         项目编译',
      '  tsc --watch                 监听模式',
      '',
      '基础类型:',
      '  string, number, boolean     基础类型',
      '  array, tuple, enum          复合类型',
      '  any, unknown, never         特殊类型',
      '',
      '高级:',
      '  interface                   接口',
      '  type                        类型别名',
      '  generics                    泛型',
      '  utility types               工具类型',
      '',
      '配置:',
      '  tsconfig.json               配置文件',
      '  strict: true                严格模式',
      '  target: ESNext              目标版本',
    ],
  },
}

registerCommand('cheat', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    
    if (args.length === 0) {
      const output: string[] = []
      output.push('📖 命令速查手册')
      output.push('═'.repeat(50))
      output.push('')
      output.push('用法: cheat <主题>')
      output.push('')
      output.push('可用主题:')
      Object.keys(cheatSheets).forEach(key => {
        output.push(`  ${key.padEnd(12)} - ${cheatSheets[key].title}`)
      })
      output.push('')
      output.push('示例:')
      output.push('  cheat git')
      output.push('  cheat linux')
      output.push('  cheat npm')
      output.push('')
      return { output: output.join('\n') }
    }
    
    const topic = args[0].toLowerCase()
    
    if (!cheatSheets[topic]) {
      return {
        output: [
          `⚠️ 未找到 "${topic}" 的速查手册`,
          '',
          '可用主题:',
          Object.keys(cheatSheets).map(k => `  ${k}`).join('\n'),
          '',
        ].join('\n')
      }
    }
    
    const sheet = cheatSheets[topic]
    const output: string[] = []
    
    output.push(`📖 ${sheet.title}`)
    output.push('═'.repeat(60))
    output.push('')
    
    sheet.content.forEach(line => {
      output.push(line)
    })
    
    output.push('')
    output.push('提示: 使用 cheat <主题> 查看其他主题')
    
    return { output: output.join('\n') }
  },
  description: '查看常用技术命令速查手册',
  usage: 'cheat <主题>',
  examples: ['cheat git', 'cheat linux', 'cheat npm', 'cheat python', 'cheat react', 'cheat typescript'],
})

registerCommand('tips', {
  handler: (): CommandResult => {
    const tips = [
      { category: '快捷键', tip: 'Ctrl + T 快速打开终端' },
      { category: '快捷键', tip: 'Ctrl + E 快速打开文件管理器' },
      { category: '快捷键', tip: 'Ctrl + B 快速打开浏览器' },
      { category: '快捷键', tip: 'Ctrl + K 打开全局搜索' },
      { category: '快捷键', tip: 'Ctrl + P 打开命令面板' },
      { category: '快捷键', tip: 'Ctrl + Q 关闭当前窗口' },
      { category: '快捷键', tip: 'Ctrl + M 最小化当前窗口' },
      { category: '快捷键', tip: 'Alt + Tab 切换窗口' },
      { category: '快捷键', tip: 'Ctrl + Alt + 1-9 切换工作区' },
      { category: '快捷键', tip: 'Ctrl + Shift + ? 查看所有快捷键' },
      { category: '终端', tip: '输入 help 查看所有终端命令' },
      { category: '终端', tip: '使用上下箭头键浏览历史命令' },
      { category: '终端', tip: '输入 weather 查看天气' },
      { category: '终端', tip: '输入 crypto 查看加密货币行情' },
      { category: '终端', tip: '输入 news 查看热门新闻' },
      { category: '终端', tip: '输入 cheat git 查看 Git 速查手册' },
      { category: '文件', tip: '右键桌面可打开上下文菜单' },
      { category: '文件', tip: '支持文件的复制、移动、重命名操作' },
      { category: '文件', tip: '支持撤销/重做文件操作 (Ctrl+Z/Ctrl+Shift+Z)' },
      { category: '系统', tip: '点击任务栏时钟显示日历' },
      { category: '系统', tip: '点击网络图标查看网络状态' },
      { category: '系统', tip: '支持深色/浅色主题切换' },
      { category: '系统', tip: '支持多个工作区管理' },
    ]
    
    const randomTip = tips[Math.floor(Math.random() * tips.length)]
    
    return {
      output: [
        '💡 每日技巧',
        '═'.repeat(40),
        '',
        `${randomTip.category}: ${randomTip.tip}`,
        '',
        '输入 tips 查看更多技巧',
        '',
      ].join('\n')
    }
  },
  description: '显示随机使用技巧',
  usage: 'tips',
  examples: ['tips'],
})