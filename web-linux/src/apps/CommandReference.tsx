import { useState } from 'react'
import { useStore } from '../store'

interface Command {
  name: string
  description: string
  syntax: string
  example: string
  category: string
}

const commands: Command[] = [
  { name: 'ls', description: '列出目录内容', syntax: 'ls [选项] [路径]', example: 'ls -la /home', category: '文件操作' },
  { name: 'cd', description: '切换工作目录', syntax: 'cd [目录]', example: 'cd /var/log', category: '文件操作' },
  { name: 'pwd', description: '显示当前工作目录', syntax: 'pwd', example: 'pwd', category: '文件操作' },
  { name: 'mkdir', description: '创建目录', syntax: 'mkdir [选项] 目录名', example: 'mkdir -p /tmp/test/dir', category: '文件操作' },
  { name: 'rmdir', description: '删除空目录', syntax: 'rmdir 目录名', example: 'rmdir /tmp/empty_dir', category: '文件操作' },
  { name: 'rm', description: '删除文件或目录', syntax: 'rm [选项] 文件...', example: 'rm -rf /tmp/test', category: '文件操作' },
  { name: 'cp', description: '复制文件或目录', syntax: 'cp [选项] 源 目标', example: 'cp -r /src /backup', category: '文件操作' },
  { name: 'mv', description: '移动/重命名文件或目录', syntax: 'mv 源 目标', example: 'mv old.txt new.txt', category: '文件操作' },
  { name: 'touch', description: '创建空文件或更新时间戳', syntax: 'touch 文件名', example: 'touch newfile.txt', category: '文件操作' },
  { name: 'cat', description: '连接文件并打印到标准输出', syntax: 'cat [选项] 文件...', example: 'cat /etc/hostname', category: '文件操作' },
  { name: 'less', description: '分页查看文件内容', syntax: 'less 文件名', example: 'less /var/log/syslog', category: '文件操作' },
  { name: 'head', description: '输出文件的开头部分', syntax: 'head [选项] 文件', example: 'head -n 20 file.txt', category: '文件操作' },
  { name: 'tail', description: '输出文件的末尾部分', syntax: 'tail [选项] 文件', example: 'tail -f /var/log/syslog', category: '文件操作' },
  { name: 'find', description: '在目录中搜索文件', syntax: 'find 路径 [表达式]', example: 'find / -name "*.conf"', category: '文件操作' },
  { name: 'chmod', description: '修改文件权限', syntax: 'chmod 模式 文件', example: 'chmod 755 script.sh', category: '文件操作' },
  { name: 'chown', description: '修改文件所有者', syntax: 'chown 用户:组 文件', example: 'chown root:root file.txt', category: '文件操作' },

  { name: 'uname', description: '显示系统信息', syntax: 'uname [选项]', example: 'uname -a', category: '系统信息' },
  { name: 'hostname', description: '显示或设置主机名', syntax: 'hostname', example: 'hostname', category: '系统信息' },
  { name: 'df', description: '显示磁盘空间使用情况', syntax: 'df [选项]', example: 'df -h', category: '系统信息' },
  { name: 'du', description: '估算文件空间使用', syntax: 'du [选项] 路径', example: 'du -sh /home', category: '系统信息' },
  { name: 'free', description: '显示内存使用情况', syntax: 'free [选项]', example: 'free -h', category: '系统信息' },
  { name: 'uptime', description: '显示系统运行时间', syntax: 'uptime', example: 'uptime', category: '系统信息' },
  { name: 'whoami', description: '显示当前用户名', syntax: 'whoami', example: 'whoami', category: '系统信息' },
  { name: 'who', description: '显示已登录用户', syntax: 'who', example: 'who', category: '系统信息' },
  { name: 'id', description: '显示用户和组信息', syntax: 'id [用户名]', example: 'id root', category: '系统信息' },

  { name: 'ping', description: '测试网络连接', syntax: 'ping [选项] 主机', example: 'ping -c 4 google.com', category: '网络' },
  { name: 'curl', description: '传输数据（HTTP/FTP等）', syntax: 'curl [选项] URL', example: 'curl -I https://example.com', category: '网络' },
  { name: 'wget', description: '下载文件', syntax: 'wget [选项] URL', example: 'wget https://example.com/file.tar.gz', category: '网络' },
  { name: 'ssh', description: '远程登录', syntax: 'ssh [选项] 用户@主机', example: 'ssh user@192.168.1.100', category: '网络' },
  { name: 'scp', description: '安全复制文件', syntax: 'scp 源 用户@主机:目标', example: 'scp file.txt user@server:/tmp/', category: '网络' },
  { name: 'ip', description: '显示/管理路由、设备等', syntax: 'ip [选项] 对象 命令', example: 'ip addr show', category: '网络' },
  { name: 'netstat', description: '显示网络连接', syntax: 'netstat [选项]', example: 'netstat -tulnp', category: '网络' },
  { name: 'ss', description: '调查套接字', syntax: 'ss [选项]', example: 'ss -tulnp', category: '网络' },
  { name: 'nslookup', description: '查询DNS记录', syntax: 'nslookup 域名', example: 'nslookup google.com', category: '网络' },

  { name: 'ps', description: '报告当前进程状态', syntax: 'ps [选项]', example: 'ps aux | grep nginx', category: '进程' },
  { name: 'top', description: '显示系统任务', syntax: 'top [选项]', example: 'top', category: '进程' },
  { name: 'htop', description: '交互式进程查看器', syntax: 'htop', example: 'htop', category: '进程' },
  { name: 'kill', description: '向进程发送信号', syntax: 'kill [信号] PID', example: 'kill -9 1234', category: '进程' },
  { name: 'pkill', description: '按名称终止进程', syntax: 'pkill [选项] 模式', example: 'pkill -f nginx', category: '进程' },
  { name: 'nohup', description: '挂起后继续运行命令', syntax: 'nohup 命令 &', example: 'nohup ./server.sh &', category: '进程' },
  { name: 'bg', description: '将作业放到后台', syntax: 'bg [作业号]', example: 'bg %1', category: '进程' },
  { name: 'fg', description: '将作业放到前台', syntax: 'fg [作业号]', example: 'fg %1', category: '进程' },
  { name: 'jobs', description: '列出活动作业', syntax: 'jobs', example: 'jobs -l', category: '进程' },

  { name: 'grep', description: '搜索文本模式', syntax: 'grep [选项] 模式 文件', example: 'grep -r "error" /var/log/', category: '文本处理' },
  { name: 'sed', description: '流编辑器', syntax: 'sed [选项] 脚本 文件', example: "sed 's/old/new/g' file.txt", category: '文本处理' },
  { name: 'awk', description: '模式扫描和处理语言', syntax: 'awk 程序 文件', example: "awk '{print $1}' file.txt", category: '文本处理' },
  { name: 'sort', description: '对文本行排序', syntax: 'sort [选项] 文件', example: 'sort -n numbers.txt', category: '文本处理' },
  { name: 'uniq', description: '报告或省略重复行', syntax: 'uniq [选项] 文件', example: 'sort file.txt | uniq -c', category: '文本处理' },
  { name: 'wc', description: '统计行数、单词数、字节数', syntax: 'wc [选项] 文件', example: 'wc -l file.txt', category: '文本处理' },
  { name: 'diff', description: '比较文件差异', syntax: 'diff 文件1 文件2', example: 'diff -u old.txt new.txt', category: '文本处理' },
  { name: 'cut', description: '剪切文本列', syntax: 'cut [选项] 文件', example: 'cut -d: -f1 /etc/passwd', category: '文本处理' },
  { name: 'tar', description: '归档工具', syntax: 'tar [选项] 归档 文件...', example: 'tar -czf archive.tar.gz /dir', category: '归档压缩' },
  { name: 'gzip', description: '压缩工具', syntax: 'gzip [选项] 文件', example: 'gzip -9 file.txt', category: '归档压缩' },
  { name: 'zip', description: '打包压缩工具', syntax: 'zip [选项] 压缩包 文件', example: 'zip -r archive.zip /dir', category: '归档压缩' },
  { name: 'unzip', description: '解压zip文件', syntax: 'unzip 压缩包', example: 'unzip archive.zip', category: '归档压缩' },
]

const categories = ['全部', '文件操作', '系统信息', '网络', '进程', '文本处理', '归档压缩']

export default function CommandReference() {
  const { theme } = useStore()
  const isDark = theme === 'dark'
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('全部')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const bg = isDark ? '#1a1a2e' : '#f5f5f5'
  const textColor = isDark ? '#e0e0e0' : '#333'
  const inputBg = isDark ? '#0f3460' : '#fff'
  const borderColor = isDark ? '#2a2a4a' : '#ddd'
  const cardBg = isDark ? '#16213e' : '#fff'
  const accent = isDark ? '#4fc3f7' : '#1976d2'
  const codeBg = isDark ? '#0d1b2a' : '#263238'

  const filtered = commands.filter((c) => {
    const matchSearch = c.name.includes(searchQuery.toLowerCase()) ||
      c.description.includes(searchQuery) || c.syntax.includes(searchQuery)
    const matchCategory = activeCategory === '全部' || c.category === activeCategory
    return matchSearch && matchCategory
  })

  const toggleExpand = (name: string) => {
    setExpandedId(expandedId === name ? null : name)
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: bg, color: textColor, fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
      <div style={{ width: 180, background: isDark ? '#16213e' : '#e8e8e8', borderRight: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: 10 }}>
          <input
            type="text" placeholder="搜索命令..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: 12, boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '0 8px' }}>
          {categories.map((cat) => (
            <div key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: '7px 12px', borderRadius: 6, cursor: 'pointer', marginBottom: 2,
              background: activeCategory === cat ? (isDark ? '#0f3460' : '#bbdefb') : 'transparent',
              color: activeCategory === cat ? accent : textColor, fontWeight: activeCategory === cat ? 600 : 400,
              fontSize: 12,
            }}>{cat}</div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${borderColor}`, fontSize: 12, color: isDark ? '#9ca3af' : '#888' }}>
          共 {filtered.length} 个命令
        </div>
        <div style={{ padding: '8px 12px' }}>
          {filtered.map((cmd) => (
            <div key={cmd.name} style={{
              marginBottom: 4, background: cardBg, borderRadius: 6, border: `1px solid ${borderColor}`,
              overflow: 'hidden',
            }}>
              <div onClick={() => toggleExpand(cmd.name)} style={{
                padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <code style={{
                  fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: accent,
                  background: codeBg, padding: '2px 8px', borderRadius: 4,
                }}>{cmd.name}</code>
                <span style={{ flex: 1, fontSize: 13 }}>{cmd.description}</span>
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 8, background: isDark ? '#0f3460' : '#e3f2fd',
                  color: isDark ? '#4fc3f7' : '#1976d2',
                }}>{cmd.category}</span>
                <span style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#999', transform: expandedId === cmd.name ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
              </div>
              {expandedId === cmd.name && (
                <div style={{ padding: '8px 16px 12px', borderTop: `1px solid ${borderColor}`, background: isDark ? '#0d1b2a' : '#fafafa' }}>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: isDark ? '#9ca3af' : '#888', marginBottom: 2 }}>语法</div>
                    <code style={{
                      fontFamily: 'monospace', fontSize: 13, background: codeBg, padding: '6px 10px',
                      borderRadius: 4, display: 'block', color: isDark ? '#a5d6a7' : '#2e7d32',
                    }}>{cmd.syntax}</code>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: isDark ? '#9ca3af' : '#888', marginBottom: 2 }}>示例</div>
                    <code style={{
                      fontFamily: 'monospace', fontSize: 13, background: codeBg, padding: '6px 10px',
                      borderRadius: 4, display: 'block', color: isDark ? '#ffcc80' : '#e65100',
                    }}>{cmd.example}</code>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}