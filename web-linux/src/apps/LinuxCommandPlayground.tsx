import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStore } from '../store'
import {
  Search, Copy, Check, Terminal,
  FileText, Network, Cpu, Archive,
  BookOpen, Play, RotateCcw, Star, Clock, Trophy,
  FolderOpen, Settings, Zap, Layers,
  FileCode, Hash, Code2,
} from 'lucide-react'

interface CommandParam {
  name: string
  description: string
  required?: boolean
}

interface Command {
  name: string
  description: string
  category: string
  syntax: string
  params: CommandParam[]
  examples: string[]
}

const CATEGORIES: { id: string; name: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', name: '全部命令', icon: <Layers size={16} />, color: '#6366f1' },
  { id: 'file', name: '文件与目录', icon: <FolderOpen size={16} />, color: '#3b82f6' },
  { id: 'text', name: '文本处理', icon: <FileText size={16} />, color: '#10b981' },
  { id: 'system', name: '系统管理', icon: <Settings size={16} />, color: '#f59e0b' },
  { id: 'network', name: '网络工具', icon: <Network size={16} />, color: '#ef4444' },
  { id: 'archive', name: '压缩归档', icon: <Archive size={16} />, color: '#8b5cf6' },
  { id: 'process', name: '进程管理', icon: <Cpu size={16} />, color: '#ec4899' },
]

const COMMANDS: Command[] = [
  { name: 'ls', description: '列出目录内容', category: 'file', syntax: 'ls [选项] [路径]', params: [
    { name: '-l', description: '使用长格式列出信息' },
    { name: '-a', description: '显示所有文件（包括以.开头的隐藏文件）' },
    { name: '-h', description: '以人类可读的方式显示大小' },
    { name: '-t', description: '按修改时间排序' },
    { name: '-r', description: '逆序排列' },
  ], examples: ['ls', 'ls -la /etc', 'ls -lh /home/user'] },
  { name: 'cd', description: '切换工作目录', category: 'file', syntax: 'cd [目录]', params: [
    { name: '..', description: '返回上一级目录' },
    { name: '~', description: '切换到用户主目录' },
    { name: '-', description: '切换到上一次的目录' },
  ], examples: ['cd /var/log', 'cd ..', 'cd ~/projects'] },
  { name: 'pwd', description: '显示当前工作目录的绝对路径', category: 'file', syntax: 'pwd', params: [], examples: ['pwd'] },
  { name: 'mkdir', description: '创建一个或多个目录', category: 'file', syntax: 'mkdir [选项] 目录名', params: [
    { name: '-p', description: '创建多级目录，父目录不存在则一并创建' },
    { name: '-m', description: '设置目录的权限模式' },
  ], examples: ['mkdir test', 'mkdir -p /a/b/c', 'mkdir -m 755 mydir'] },
  { name: 'rm', description: '删除文件或目录', category: 'file', syntax: 'rm [选项] 文件...', params: [
    { name: '-r', description: '递归删除目录及其内容' },
    { name: '-f', description: '强制删除，不提示确认' },
    { name: '-i', description: '删除前逐一确认' },
    { name: '-v', description: '显示详细删除过程' },
  ], examples: ['rm file.txt', 'rm -rf /tmp/test', 'rm -i *.log'] },
  { name: 'cp', description: '复制文件或目录', category: 'file', syntax: 'cp [选项] 源 目标', params: [
    { name: '-r', description: '递归复制目录' },
    { name: '-i', description: '覆盖前提示确认' },
    { name: '-v', description: '显示复制过程' },
    { name: '-p', description: '保留文件属性' },
  ], examples: ['cp file.txt /backup/', 'cp -r src/ dest/', 'cp -iv *.txt /arch/'] },
  { name: 'mv', description: '移动或重命名文件/目录', category: 'file', syntax: 'mv [选项] 源 目标', params: [
    { name: '-i', description: '覆盖前提示确认' },
    { name: '-v', description: '显示移动过程' },
    { name: '-f', description: '强制覆盖不提示' },
  ], examples: ['mv old.txt new.txt', 'mv file.txt /dest/', 'mv -i *.log /archive/'] },
  { name: 'touch', description: '创建空文件或更新文件时间戳', category: 'file', syntax: 'touch [选项] 文件名', params: [
    { name: '-a', description: '仅修改访问时间' },
    { name: '-m', description: '仅修改修改时间' },
    { name: '-r', description: '使用参考文件的时间' },
  ], examples: ['touch newfile.txt', 'touch -t 202401010000 file.txt', 'touch -r ref.txt file.txt'] },
  { name: 'cat', description: '连接文件并打印到标准输出', category: 'file', syntax: 'cat [选项] 文件...', params: [
    { name: '-n', description: '显示行号' },
    { name: '-b', description: '仅对非空行编号' },
    { name: '-A', description: '显示所有控制字符' },
    { name: '>', description: '重定向输出到文件' },
  ], examples: ['cat file.txt', 'cat -n /etc/hosts', 'cat file1.txt file2.txt > merged.txt'] },
  { name: 'head', description: '输出文件的开头部分', category: 'file', syntax: 'head [选项] 文件', params: [
    { name: '-n', description: '显示前 N 行（默认10）' },
    { name: '-c', description: '显示前 N 字节' },
  ], examples: ['head file.txt', 'head -n 20 log.txt', 'head -c 512 file.bin'] },
  { name: 'tail', description: '输出文件的末尾部分', category: 'file', syntax: 'tail [选项] 文件', params: [
    { name: '-n', description: '显示后 N 行（默认10）' },
    { name: '-f', description: '实时跟踪文件新增内容' },
    { name: '-c', description: '显示后 N 字节' },
  ], examples: ['tail file.txt', 'tail -f /var/log/syslog', 'tail -n 20 access.log'] },
  { name: 'less', description: '分页查看文件内容', category: 'file', syntax: 'less [选项] 文件名', params: [
    { name: '-N', description: '显示行号' },
    { name: '-F', description: '如果文件能一次显示则直接退出' },
    { name: '+F', description: '实时跟踪模式（类似 tail -f）' },
  ], examples: ['less /etc/passwd', 'less -N largefile.log', 'less +F /var/log/app.log'] },
  { name: 'find', description: '在目录层次结构中搜索文件', category: 'file', syntax: 'find 路径 [表达式]', params: [
    { name: '-name', description: '按文件名模式搜索' },
    { name: '-type', description: '按类型过滤（f文件/d目录/l链接）' },
    { name: '-size', description: '按大小过滤' },
    { name: '-mtime', description: '按修改时间过滤（天）' },
    { name: '-exec', description: '对匹配文件执行命令' },
  ], examples: ['find / -name "*.conf"', 'find . -type f -name "*.js"', 'find /var -size +100M'] },

  { name: 'grep', description: '使用正则表达式搜索文本行', category: 'text', syntax: 'grep [选项] 模式 文件', params: [
    { name: '-r', description: '递归搜索目录' },
    { name: '-i', description: '忽略大小写' },
    { name: '-n', description: '显示行号' },
    { name: '-v', description: '反转匹配（显示不匹配的行）' },
    { name: '-E', description: '使用扩展正则表达式' },
    { name: '-c', description: '仅显示匹配行数' },
  ], examples: ['grep "error" log.txt', 'grep -rn "TODO" src/', 'grep -v "^#" config.conf'] },
  { name: 'sed', description: '流编辑器，用于过滤和转换文本', category: 'text', syntax: "sed [选项] 脚本 文件", params: [
    { name: 's/pattern/replacement/', description: '替换文本' },
    { name: 'g', description: '全局替换标志' },
    { name: '-i', description: '直接修改源文件' },
    { name: '-n', description: '仅打印匹配行' },
    { name: '-e', description: '执行多个编辑命令' },
  ], examples: ["sed 's/old/new/g' file.txt", "sed -i 's/foo/bar/g' config.conf", "sed -n '1,5p' file.txt"] },
  { name: 'awk', description: '模式扫描和文本处理语言', category: 'text', syntax: 'awk 程序 文件', params: [
    { name: '-F', description: '设置字段分隔符' },
    { name: '-f', description: '从文件读取程序' },
    { name: '{print $1}', description: '打印第一列' },
    { name: 'NR', description: '内置变量：当前行号' },
    { name: 'NF', description: '内置变量：当前行列数' },
  ], examples: ["awk '{print $1}' file.txt", "awk -F: '{print $1, $3}' /etc/passwd", "awk '/error/ {print NR\": \"$0}' log.txt"] },
  { name: 'sort', description: '对文本文件行进行排序', category: 'text', syntax: 'sort [选项] 文件', params: [
    { name: '-n', description: '按数值排序' },
    { name: '-r', description: '逆序排序' },
    { name: '-k', description: '指定排序键和位置' },
    { name: '-t', description: '指定字段分隔符' },
    { name: '-u', description: '排序并去重' },
  ], examples: ['sort file.txt', 'sort -n numbers.txt', 'sort -t, -k2 data.csv'] },
  { name: 'uniq', description: '报告或省略重复行', category: 'text', syntax: 'uniq [选项] 文件', params: [
    { name: '-c', description: '显示每行出现次数' },
    { name: '-d', description: '仅显示重复行' },
    { name: '-u', description: '仅显示唯一行' },
    { name: '-f', description: '忽略前 N 个字段' },
  ], examples: ['sort file.txt | uniq', 'sort file.txt | uniq -c', 'sort file.txt | uniq -d'] },
  { name: 'wc', description: '统计文件的行数、单词数和字节数', category: 'text', syntax: 'wc [选项] 文件', params: [
    { name: '-l', description: '仅统计行数' },
    { name: '-w', description: '仅统计单词数' },
    { name: '-c', description: '仅统计字节数' },
    { name: '-m', description: '统计字符数（支持多字节）' },
  ], examples: ['wc file.txt', 'wc -l *.log', 'cat file.txt | wc -w'] },
  { name: 'cut', description: '从文件的每行中剪切出选定字段', category: 'text', syntax: 'cut [选项] 文件', params: [
    { name: '-d', description: '设置字段分隔符' },
    { name: '-f', description: '选择指定字段' },
    { name: '-c', description: '选择指定字符位置' },
    { name: '--complement', description: '选择未选中的字段/字符' },
  ], examples: ['cut -d: -f1 /etc/passwd', 'cut -c1-50 file.txt', 'cut -d, -f1,3,5 data.csv'] },
  { name: 'paste', description: '合并文件行', category: 'text', syntax: 'paste [选项] 文件...', params: [
    { name: '-d', description: '指定分隔符（默认Tab）' },
    { name: '-s', description: '串行模式，将所有行合并为一行' },
  ], examples: ['paste file1.txt file2.txt', 'paste -d, names.txt scores.txt', 'paste -s file.txt'] },
  { name: 'tr', description: '替换或删除字符', category: 'text', syntax: 'tr [选项] 集合1 [集合2]', params: [
    { name: '-d', description: '删除指定字符' },
    { name: '-s', description: '压缩连续重复字符' },
    { name: '-d "\\n"', description: '删除换行符' },
  ], examples: ['tr a-z A-Z < file.txt', 'tr -d "[:space:]" < file.txt', 'tr -s " " < file.txt'] },

  { name: 'ps', description: '报告当前进程状态', category: 'process', syntax: 'ps [选项]', params: [
    { name: 'aux', description: '显示所有进程的详细信息' },
    { name: '-e', description: '显示所有进程' },
    { name: '-f', description: '完整格式显示' },
    { name: '--sort', description: '按指定字段排序' },
  ], examples: ['ps aux', 'ps -ef', 'ps aux | grep nginx'] },
  { name: 'top', description: '实时显示系统中各个进程的资源占用情况', category: 'process', syntax: 'top [选项]', params: [
    { name: '-c', description: '显示完整命令行' },
    { name: '-u', description: '仅显示指定用户的进程' },
    { name: '-p', description: '仅监视指定PID的进程' },
    { name: '-n', description: '更新次数后退出' },
  ], examples: ['top', 'top -u root', 'top -p 1234'] },
  { name: 'kill', description: '向进程发送信号', category: 'process', syntax: 'kill [选项] PID', params: [
    { name: '-9', description: '强制终止进程（SIGKILL）' },
    { name: '-1', description: '重新加载配置（SIGHUP）' },
    { name: '-15', description: '正常终止（SIGTERM，默认）' },
    { name: '-l', description: '列出所有信号名称' },
  ], examples: ['kill 1234', 'kill -9 1234', 'kill -l'] },
  { name: 'nice', description: '以调整后的优先级运行程序', category: 'process', syntax: 'nice [选项] 命令', params: [
    { name: '-n', description: '指定优先级（-20到19，越大越友好）' },
    { name: '--adjustment', description: '设置调整值' },
  ], examples: ['nice -n 10 ./backup.sh', 'nice --5 ./render.sh'] },
  { name: 'nohup', description: '在挂断后继续运行命令', category: 'process', syntax: 'nohup 命令 [参数] &', params: [
    { name: '&', description: '在后台运行' },
    { name: '> nohup.out', description: '将输出重定向到文件' },
  ], examples: ['nohup ./server.sh &', 'nohup python3 app.py > app.log 2>&1 &'] },

  { name: 'chmod', description: '修改文件的访问权限', category: 'system', syntax: 'chmod [选项] 模式 文件', params: [
    { name: '755', description: '所有者可读写执行，其他用户可读执行' },
    { name: '644', description: '所有者可读写，其他用户可读' },
    { name: '+x', description: '为所有用户添加执行权限' },
    { name: '-R', description: '递归修改目录及其内容' },
  ], examples: ['chmod 755 script.sh', 'chmod +x run.sh', 'chmod -R 644 /var/www/'] },
  { name: 'chown', description: '修改文件的所有者和所属组', category: 'system', syntax: 'chown [选项] 用户[:组] 文件', params: [
    { name: '-R', description: '递归修改' },
    { name: '--reference', description: '使用参考文件的所有者' },
  ], examples: ['chown root:root file.txt', 'chown -R www-data:www-data /var/www/', 'chown --reference=ref.txt file.txt'] },
  { name: 'df', description: '显示文件系统的磁盘空间使用情况', category: 'system', syntax: 'df [选项]', params: [
    { name: '-h', description: '以人类可读格式显示' },
    { name: '-T', description: '显示文件系统类型' },
    { name: '-i', description: '显示 inode 使用情况' },
  ], examples: ['df -h', 'df -T', 'df -i /home'] },
  { name: 'du', description: '估算文件空间使用量', category: 'system', syntax: 'du [选项] 路径', params: [
    { name: '-h', description: '以人类可读格式显示' },
    { name: '-s', description: '仅显示总计' },
    { name: '-c', description: '显示总计行' },
    { name: '--max-depth', description: '限制显示深度' },
  ], examples: ['du -sh /home', 'du -h --max-depth=1 /var', 'du -sh * | sort -rh'] },
  { name: 'free', description: '显示系统内存使用情况', category: 'system', syntax: 'free [选项]', params: [
    { name: '-h', description: '以人类可读格式显示' },
    { name: '-m', description: '以 MB 为单位显示' },
    { name: '-g', description: '以 GB 为单位显示' },
  ], examples: ['free -h', 'free -m'] },
  { name: 'uptime', description: '显示系统运行时间和负载', category: 'system', syntax: 'uptime', params: [], examples: ['uptime'] },
  { name: 'uname', description: '显示系统信息', category: 'system', syntax: 'uname [选项]', params: [
    { name: '-a', description: '显示所有信息' },
    { name: '-r', description: '仅显示内核版本号' },
    { name: '-m', description: '仅显示机器硬件名' },
    { name: '-s', description: '仅显示内核名称' },
  ], examples: ['uname -a', 'uname -r'] },

  { name: 'ping', description: '测试网络连接及可达性', category: 'network', syntax: 'ping [选项] 主机', params: [
    { name: '-c', description: '发送指定数量的数据包' },
    { name: '-i', description: '设置发送间隔（秒）' },
    { name: '-W', description: '设置超时时间（秒）' },
    { name: '-4', description: '强制使用 IPv4' },
    { name: '-6', description: '强制使用 IPv6' },
  ], examples: ['ping -c 4 google.com', 'ping -i 0.5 192.168.1.1', 'ping -c 10 -W 2 example.com'] },
  { name: 'curl', description: '传输数据，支持多种协议', category: 'network', syntax: 'curl [选项] URL', params: [
    { name: '-I', description: '仅获取响应头（HEAD请求）' },
    { name: '-o', description: '将输出写入文件' },
    { name: '-O', description: '使用远程文件名保存' },
    { name: '-s', description: '静默模式，不显示进度' },
    { name: '-w', description: '显示传输完成后的统计信息' },
    { name: '-X', description: '指定请求方法' },
  ], examples: ['curl -I https://example.com', 'curl -o file.zip https://...', 'curl -s https://api.example.com/data'] },
  { name: 'wget', description: '从网络下载文件', category: 'network', syntax: 'wget [选项] URL', params: [
    { name: '-O', description: '指定输出文件名' },
    { name: '-c', description: '断点续传' },
    { name: '-q', description: '静默模式' },
    { name: '--spider', description: '不下载内容，仅检查' },
    { name: '--timeout', description: '设置超时时间' },
  ], examples: ['wget https://example.com/file.zip', 'wget -O output.zip https://...', 'wget -c https://...'] },
  { name: 'netstat', description: '显示网络连接、路由和接口统计', category: 'network', syntax: 'netstat [选项]', params: [
    { name: '-t', description: '显示 TCP 连接' },
    { name: '-u', description: '显示 UDP 连接' },
    { name: '-l', description: '仅显示监听中的端口' },
    { name: '-n', description: '以数字形式显示地址和端口' },
    { name: '-p', description: '显示进程名和 PID' },
    { name: '-s', description: '显示各种协议的统计信息' },
  ], examples: ['netstat -tulnp', 'netstat -an | grep 80', 'netstat -s'] },
  { name: 'ifconfig', description: '查看和配置网络接口', category: 'network', syntax: 'ifconfig [接口] [选项]', params: [
    { name: '-a', description: '显示所有接口' },
    { name: 'up', description: '启用接口' },
    { name: 'down', description: '关闭接口' },
    { name: 'inet', description: '设置 IPv4 地址' },
    { name: 'netmask', description: '设置子网掩码' },
  ], examples: ['ifconfig', 'ifconfig eth0 up', 'ifconfig eth0 192.168.1.100 netmask 255.255.255.0'] },
  { name: 'ssh', description: '安全远程登录工具', category: 'network', syntax: 'ssh [选项] 用户@主机', params: [
    { name: '-p', description: '指定端口号（默认22）' },
    { name: '-i', description: '指定私钥文件' },
    { name: '-L', description: '设置本地端口转发' },
    { name: '-R', description: '设置远程端口转发' },
    { name: '-D', description: '设置 SOCKS 代理' },
  ], examples: ['ssh user@192.168.1.100', 'ssh -p 2222 user@host', 'ssh -i key.pem user@host'] },
  { name: 'scp', description: '通过 SSH 安全复制文件', category: 'network', syntax: 'scp [选项] 源 用户@主机:目标', params: [
    { name: '-r', description: '递归复制目录' },
    { name: '-P', description: '指定 SSH 端口' },
    { name: '-i', description: '指定私钥文件' },
    { name: '-o', description: '指定 SSH 选项' },
  ], examples: ['scp file.txt user@server:/tmp/', 'scp -r ./dir user@host:/path/', 'scp user@host:file.txt ./'] },

  { name: 'tar', description: '归档工具，用于打包和展开归档文件', category: 'archive', syntax: 'tar [选项] 归档 文件...', params: [
    { name: '-c', description: '创建新归档' },
    { name: '-x', description: '从归档中提取文件' },
    { name: '-t', description: '列出归档内容' },
    { name: '-z', description: '通过 gzip 过滤' },
    { name: '-j', description: '通过 bzip2 过滤' },
    { name: '-f', description: '指定归档文件名' },
    { name: '-v', description: '详细显示处理的文件' },
  ], examples: ['tar -czf archive.tar.gz dir/', 'tar -xzf archive.tar.gz', 'tar -tvf archive.tar'] },
  { name: 'gzip', description: '压缩文件，使用 LZ77 算法', category: 'archive', syntax: 'gzip [选项] 文件', params: [
    { name: '-1', description: '最快压缩（最低压缩率）' },
    { name: '-9', description: '最佳压缩（最慢）' },
    { name: '-d', description: '解压缩（等价于 gunzip）' },
    { name: '-k', description: '保留原文件' },
    { name: '-r', description: '递归处理目录' },
  ], examples: ['gzip file.txt', 'gzip -9 largefile', 'gzip -dk file.txt'] },
  { name: 'gunzip', description: '解压缩 gzip 文件', category: 'archive', syntax: 'gunzip [选项] 文件.gz', params: [
    { name: '-k', description: '保留原压缩文件' },
    { name: '-r', description: '递归处理目录' },
    { name: '-f', description: '强制覆盖现有文件' },
  ], examples: ['gunzip file.gz', 'gunzip -k archive.gz', 'gzip -d file.gz'] },
  { name: 'zip', description: '打包压缩工具', category: 'archive', syntax: 'zip [选项] 压缩包 文件', params: [
    { name: '-r', description: '递归压缩目录' },
    { name: '-9', description: '最佳压缩率' },
    { name: '-e', description: '加密压缩包' },
    { name: '-q', description: '静默模式' },
    { name: '-x', description: '排除指定文件' },
  ], examples: ['zip archive.zip file.txt', 'zip -r archive.zip dir/', 'zip -9 archive.zip *.txt'] },
  { name: 'unzip', description: '解压缩 zip 文件', category: 'archive', syntax: 'unzip [选项] 压缩包', params: [
    { name: '-l', description: '列出压缩包内容' },
    { name: '-d', description: '指定解压目录' },
    { name: '-o', description: '覆盖现有文件不提示' },
    { name: '-q', description: '静默模式' },
    { name: '-x', description: '排除指定文件' },
  ], examples: ['unzip archive.zip', 'unzip -d /output archive.zip', 'unzip -l archive.zip'] },
]

const CHEAT_SHEET_COMMANDS = [
  { name: 'ls -la', desc: '详细列出目录内容' },
  { name: 'cd ~', desc: '返回主目录' },
  { name: 'pwd', desc: '显示当前路径' },
  { name: 'mkdir -p dir', desc: '创建多级目录' },
  { name: 'rm -rf dir', desc: '强制递归删除' },
  { name: 'cp -r src dst', desc: '递归复制目录' },
  { name: 'grep -rn "text" .', desc: '递归搜索文本' },
  { name: 'find / -name "*.log"', desc: '按名称查找文件' },
  { name: 'ps aux | grep nginx', desc: '查找进程' },
  { name: 'kill -9 PID', desc: '强制终止进程' },
  { name: 'tar -czf a.tgz dir', desc: '创建压缩归档' },
  { name: 'tar -xzf a.tgz', desc: '解压归档' },
  { name: 'df -h', desc: '查看磁盘使用' },
  { name: 'free -h', desc: '查看内存使用' },
  { name: 'top', desc: '实时进程监控' },
  { name: 'chmod 755 file', desc: '修改文件权限' },
  { name: 'ssh user@host', desc: '远程登录' },
  { name: 'scp file user@host:/', desc: '远程复制' },
  { name: 'curl -I URL', desc: '检查HTTP响应头' },
  { name: 'ping -c 4 host', desc: '测试网络连通' },
]

const STORAGE_KEY_PROGRESS = 'linux-cmd-playground-progress'
const STORAGE_KEY_LEARNED = 'linux-cmd-playground-learned'

interface SimulatorFile {
  path: string
  content: string
  type: 'file' | 'dir'
  children?: SimulatorFile[]
}

const initialFS: SimulatorFile = {
  path: '/home/user',
  content: '',
  type: 'dir',
  children: [
    { path: '/home/user/documents', content: '', type: 'dir', children: [
      { path: '/home/user/documents/report.txt', content: '这是一份季度报告。\n销售额增长了20%。\n客户满意度达到95%。', type: 'file' },
      { path: '/home/user/documents/notes.txt', content: '学习笔记：\n1. Linux基础\n2. Shell编程\n3. 系统管理', type: 'file' },
    ]},
    { path: '/home/user/projects', content: '', type: 'dir', children: [
      { path: '/home/user/projects/main.py', content: 'def hello():\n    print("Hello, Linux!")\n\nhello()', type: 'file' },
      { path: '/home/user/projects/config.yaml', content: 'server:\n  host: 0.0.0.0\n  port: 8080\ndatabase:\n  name: mydb', type: 'file' },
    ]},
    { path: '/home/user/readme.md', content: '# 我的项目\n\n这是一个示例项目。', type: 'file' },
    { path: '/home/user/.bashrc', content: '# ~/.bashrc\nexport PATH=$PATH:/usr/local/bin\nalias ll="ls -la"', type: 'file' },
  ],
}

function findNode(path: string, node: SimulatorFile = initialFS): SimulatorFile | null {
  if (node.path === path) return node
  if (!node.children) return null
  for (const child of node.children) {
    const found = findNode(path, child)
    if (found) return found
  }
  return null
}

function listChildren(path: string): string[] {
  const node = findNode(path)
  if (!node || !node.children) return []
  return node.children.map(c => `${c.type === 'dir' ? 'd' : '-'}rw-r--r--  user  user  ${String(c.content?.length || 0).padStart(6)}  ${c.path.split('/').pop()}`)
}

function resolvePath(cwd: string, input: string): string {
  if (input.startsWith('/')) return input.replace(/\/$/, '') || '/'
  const parts = cwd.split('/').filter(Boolean)
  for (const part of input.split('/')) {
    if (part === '..') parts.pop()
    else if (part === '.' || part === '~') { /* skip or replace */ }
    else parts.push(part)
  }
  return '/' + parts.join('/')
}

function runSimulatedCommand(input: string, cwd: string, _fs: SimulatorFile): { output: string; newCwd?: string } {
  const trimmed = input.trim()
  if (!trimmed) return { output: '' }

  const parts = trimmed.split(/\s+/)
  const cmd = parts[0]
  const args = parts.slice(1)

  switch (cmd) {
    case 'help':
    case '?':
      return {
        output: [
          '可用命令：',
          '  ls [路径]          - 列出目录内容',
          '  cd <目录>          - 切换目录',
          '  pwd                - 显示当前路径',
          '  cat <文件>         - 查看文件内容',
          '  head [-n N] <文件> - 查看文件前N行',
          '  tail [-n N] <文件> - 查看文件后N行',
          '  mkdir <目录>       - 创建目录',
          '  touch <文件>       - 创建空文件',
          '  echo <文本>        - 输出文本',
          '  grep <关键字> <文件> - 搜索文本',
          '  find <路径> <模式> - 查找文件',
          '  ps                 - 显示进程',
          '  df -h              - 磁盘空间',
          '  free -h            - 内存信息',
          '  date               - 当前日期',
          '  whoami             - 当前用户',
          '  uname -a           - 系统信息',
          '  clear              - 清屏',
          '  history            - 命令历史',
        ].join('\n'),
      }
    case 'ls': {
      const target = args.length > 0 && !args[0].startsWith('-') ? resolvePath(cwd, args[0]) : cwd
      const flags = args.filter(a => a.startsWith('-')).join('')
      if (flags.includes('l')) {
        const items = listChildren(target)
        return { output: `total ${items.length}\n${items.join('\n')}` }
      }
      const node = findNode(target)
      if (!node) return { output: `ls: 无法访问 '${target}': 没有那个文件或目录` }
      if (!node.children) return { output: '' }
      return { output: node.children.map(c => c.path.split('/').pop()).join('  ') }
    }
    case 'cd': {
      if (args.length === 0 || args[0] === '~') return { output: '', newCwd: '/home/user' }
      if (args[0] === '..') {
        const parts = cwd.split('/').filter(Boolean)
        parts.pop()
        return { output: '', newCwd: '/' + parts.join('/') }
      }
      if (args[0] === '-') return { output: 'cd: 缺少前一个目录记录' }
      const newPath = resolvePath(cwd, args[0])
      const node = findNode(newPath)
      if (!node) return { output: `cd: ${args[0]}: 没有那个文件或目录` }
      if (node.type !== 'dir') return { output: `cd: ${args[0]}: 不是目录` }
      return { output: '', newCwd: newPath }
    }
    case 'pwd':
      return { output: cwd }
    case 'cat': {
      if (args.length === 0) return { output: 'cat: 缺少操作数' }
      const filePath = resolvePath(cwd, args[args.length - 1])
      const node = findNode(filePath)
      if (!node) return { output: `cat: ${args[args.length - 1]}: 没有那个文件或目录` }
      if (node.type !== 'file') return { output: `cat: ${args[args.length - 1]}: 是目录` }
      return { output: node.content || '' }
    }
    case 'head': {
      const nFlag = args.find(a => a.startsWith('-n'))
      const n = nFlag ? parseInt(nFlag.slice(2)) : 10
      const fileArg = args.find(a => !a.startsWith('-'))
      if (!fileArg) return { output: 'head: 缺少操作数' }
      const node = findNode(resolvePath(cwd, fileArg))
      if (!node || node.type !== 'file') return { output: `head: ${fileArg}: 没有那个文件` }
      const lines = (node.content || '').split('\n').slice(0, n)
      return { output: lines.join('\n') }
    }
    case 'tail': {
      const nFlag = args.find(a => a.startsWith('-n'))
      const n = nFlag ? parseInt(nFlag.slice(2)) : 10
      const fileArg = args.find(a => !a.startsWith('-'))
      if (!fileArg) return { output: 'tail: 缺少操作数' }
      const node = findNode(resolvePath(cwd, fileArg))
      if (!node || node.type !== 'file') return { output: `tail: ${fileArg}: 没有那个文件` }
      const lines = (node.content || '').split('\n')
      return { output: lines.slice(-n).join('\n') }
    }
    case 'echo':
      return { output: args.join(' ') }
    case 'date':
      return { output: new Date().toString() }
    case 'whoami':
      return { output: 'user' }
    case 'uname':
      if (args.includes('-a')) {
        return { output: 'Linux web-linux 5.15.0 #1 SMP x86_64 GNU/Linux' }
      }
      return { output: 'Linux' }
    case 'df':
      return {
        output: [
          '文件系统       1K-块    已用 可用 已用% 挂载点',
          '/dev/root      5242880 2097152 3145728  40% /',
          '/dev/sda1       524288   262144  262144  50% /boot',
          'tmpfs          1048576       0 1048576   0% /dev/shm',
        ].join('\n'),
      }
    case 'free':
      return {
        output: [
          '              total        used        free      shared  buff/cache   available',
          'Mem:        2097152     524288    1048576      65536     524288    1572864',
          'Swap:       4194304           0     4194304',
        ].join('\n'),
      }
    case 'ps':
      return {
        output: [
          '  PID TTY          TIME CMD',
          '    1 ?        00:00:01 systemd',
          '  100 ?        00:00:00 bash',
          '  200 pts/0    00:00:00 node',
          '  300 pts/0    00:00:00 python3',
        ].join('\n'),
      }
    case 'grep': {
      const keyword = args[0]
      const fileArg = args[1]
      if (!keyword || !fileArg) return { output: '用法: grep <关键字> <文件>' }
      const node = findNode(resolvePath(cwd, fileArg))
      if (!node || node.type !== 'file') return { output: `grep: ${fileArg}: 没有那个文件` }
      const lines = (node.content || '').split('\n').filter(l => l.includes(keyword))
      return { output: lines.length > 0 ? lines.join('\n') : '' }
    }
    case 'find': {
      const path = args[0] || '.'
      const pattern = args.find(a => a.startsWith('-name'))
      if (!pattern) return { output: '用法: find <路径> -name <模式>' }
      return { output: `${path}/${pattern}` }
    }
    case 'clear':
      return { output: '\x00' }
    case 'history':
      return { output: '1  help\n2  ls -la\n3  cd /home/user\n4  cat readme.md\n5  pwd' }
    case 'mkdir':
      return { output: `mkdir: 已创建目录 "${args[0] || 'newdir'}"` }
    case 'touch':
      return { output: `touch: 已创建空文件 "${args[0] || 'file'}"` }
    default:
      return { output: `${cmd}: 命令未找到。输入 'help' 查看可用命令。` }
  }
}

export default function LinuxCommandPlayground() {
  const { resolvedTheme } = useStore()
  const isDark = resolvedTheme === 'dark'

  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null)
  const [learnedCommands, setLearnedCommands] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LEARNED)
      return raw ? new Set(JSON.parse(raw)) : new Set()
    } catch { return new Set() }
  })
  const [viewCount, setViewCount] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROGRESS)
      return raw ? JSON.parse(raw) : {}
    } catch { return {} }
  })
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [simInput, setSimInput] = useState('')
  const [simHistory, setSimHistory] = useState<{ input: string; output: string }[]>([])
  const [simCwd, setSimCwd] = useState('/home/user')
  const [activeTab, setActiveTab] = useState<'learn' | 'simulator' | 'cheatsheet'>('learn')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LEARNED, JSON.stringify([...learnedCommands]))
  }, [learnedCommands])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(viewCount))
  }, [viewCount])

  useEffect(() => {
    if (selectedCommand) {
      setViewCount(prev => ({ ...prev, [selectedCommand.name]: (prev[selectedCommand.name] || 0) + 1 }))
    }
  }, [selectedCommand])

  const filteredCommands = useMemo(() => {
    return COMMANDS.filter(c => {
      const matchCat = activeCategory === 'all' || c.category === activeCategory
      const q = searchQuery.toLowerCase()
      const matchSearch = !q ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.syntax.toLowerCase().includes(q) ||
        c.examples.some(e => e.toLowerCase().includes(q))
      return matchCat && matchSearch
    })
  }, [activeCategory, searchQuery])

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }, [])

  const toggleLearned = useCallback((name: string) => {
    setLearnedCommands(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  const runSimulator = useCallback(() => {
    const trimmed = simInput.trim()
    if (!trimmed) return
    const result = runSimulatedCommand(trimmed, simCwd, initialFS)
    setSimHistory(prev => [...prev, { input: trimmed, output: result.output }])
    if (result.newCwd) setSimCwd(result.newCwd)
    setSimInput('')
  }, [simInput, simCwd])

  const totalCommands = COMMANDS.length
  const learnedCount = learnedCommands.size
  const progressPercent = Math.round((learnedCount / totalCommands) * 100)

  const bg = isDark
    ? 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)'
    : 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ef 100%)'
  const glassBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)'
  const glassBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
  const textPrimary = isDark ? '#e0e0e8' : '#1a1a2e'
  const textSecondary = isDark ? '#9ca3af' : '#6b7280'
  const accentColor = isDark ? '#818cf8' : '#6366f1'
  const accentBg = isDark ? 'rgba(129,140,248,0.15)' : 'rgba(99,102,241,0.1)'
  const hoverBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'
  const codeBg = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.05)'
  const divider = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const successBg = isDark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.1)'
  const successColor = isDark ? '#4ade80' : '#16a34a'

  return (
    <div style={{
      height: '100%',
      background: bg,
      color: textPrimary,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      fontSize: 13,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: glassBg,
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${glassBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `linear-gradient(135deg, ${accentColor}, #a78bfa)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 12px ${isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.3)'}`,
          }}>
            <Terminal size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Linux 命令实验场</div>
            <div style={{ fontSize: 12, color: textSecondary }}>学习 Linux 命令 · 实践操作 · 进度跟踪</div>
          </div>
        </div>

        {/* Progress */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '8px 16px',
          background: glassBg,
          backdropFilter: 'blur(8px)',
          border: `1px solid ${glassBorder}`,
          borderRadius: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy size={16} color={accentColor} />
            <span style={{ fontSize: 12, color: textSecondary }}>学习进度</span>
          </div>
          <div style={{
            width: 100, height: 6, borderRadius: 3,
            background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progressPercent}%`, height: '100%',
              background: `linear-gradient(90deg, ${accentColor}, #a78bfa)`,
              borderRadius: 3,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: accentColor }}>
            {learnedCount}/{totalCommands}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', padding: '0 20px',
        borderBottom: `1px solid ${divider}`,
        flexShrink: 0,
      }}>
        {([
          { id: 'learn', label: '命令学习', icon: <BookOpen size={14} /> },
          { id: 'simulator', label: '命令模拟器', icon: <Play size={14} /> },
          { id: 'cheatsheet', label: '速查表', icon: <Zap size={14} /> },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '12px 16px',
            background: 'transparent', border: 'none',
            color: activeTab === tab.id ? accentColor : textSecondary,
            borderBottom: activeTab === tab.id ? `2px solid ${accentColor}` : '2px solid transparent',
            cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
            transition: 'all 0.2s',
          }}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {activeTab === 'learn' && (
          <>
            {/* Sidebar */}
            <div style={{
              width: 240, flexShrink: 0,
              borderRight: `1px solid ${divider}`,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}>
              <div style={{ padding: 12 }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    color: textSecondary,
                  }} />
                  <input
                    type="text" placeholder="搜索命令..." value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 10px 8px 30px',
                      borderRadius: 10, border: `1px solid ${glassBorder}`,
                      background: glassBg, color: textPrimary,
                      fontSize: 12, outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 12px' }}>
                {CATEGORIES.map(cat => {
                  const count = cat.id === 'all'
                    ? COMMANDS.length
                    : COMMANDS.filter(c => c.category === cat.id).length
                  return (
                    <div key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', borderRadius: 8,
                      cursor: 'pointer', marginBottom: 2,
                      background: activeCategory === cat.id ? accentBg : 'transparent',
                      color: activeCategory === cat.id ? cat.color : textPrimary,
                      fontWeight: activeCategory === cat.id ? 600 : 400,
                      fontSize: 12,
                      transition: 'all 0.15s',
                    }}
                      onMouseEnter={(e) => { if (activeCategory !== cat.id) e.currentTarget.style.background = hoverBg }}
                      onMouseLeave={(e) => { if (activeCategory !== cat.id) e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ color: cat.color }}>{cat.icon}</span>
                      <span style={{ flex: 1 }}>{cat.name}</span>
                      <span style={{
                        fontSize: 10, padding: '1px 6px', borderRadius: 6,
                        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                        color: textSecondary,
                      }}>{count}</span>
                    </div>
                  )
                })}

                <div style={{
                  marginTop: 16, padding: 12,
                  background: glassBg, borderRadius: 10,
                  border: `1px solid ${glassBorder}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Trophy size={14} color={accentColor} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>学习统计</span>
                  </div>
                  <div style={{ fontSize: 11, color: textSecondary, lineHeight: 1.6 }}>
                    已学习: <span style={{ color: successColor, fontWeight: 600 }}>{learnedCount}</span> 个命令<br />
                    已查看: <span style={{ color: accentColor, fontWeight: 600 }}>{Object.keys(viewCount).length}</span> 个命令<br />
                    总命令数: <span style={{ fontWeight: 600 }}>{totalCommands}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Command list */}
            <div style={{
              width: 320, flexShrink: 0,
              borderRight: `1px solid ${divider}`,
              overflow: 'auto',
            }}>
              <div style={{
                padding: '10px 16px',
                borderBottom: `1px solid ${divider}`,
                fontSize: 12, color: textSecondary,
              }}>
                共 {filteredCommands.length} 个命令
              </div>
              {filteredCommands.map(cmd => {
                const learned = learnedCommands.has(cmd.name)
                const viewed = viewCount[cmd.name] || 0
                return (
                  <div key={cmd.name} onClick={() => setSelectedCommand(cmd)} style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${divider}`,
                    background: selectedCommand?.name === cmd.name ? accentBg : 'transparent',
                    borderLeft: selectedCommand?.name === cmd.name ? `3px solid ${accentColor}` : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={(e) => { if (selectedCommand?.name !== cmd.name) e.currentTarget.style.background = hoverBg }}
                    onMouseLeave={(e) => { if (selectedCommand?.name !== cmd.name) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <code style={{
                        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                        fontSize: 14, fontWeight: 700,
                        color: accentColor,
                        background: codeBg,
                        padding: '2px 8px', borderRadius: 4,
                      }}>{cmd.name}</code>
                      {learned && <Check size={14} color={successColor} />}
                    </div>
                    <div style={{ fontSize: 12, color: textSecondary, lineHeight: 1.4 }}>{cmd.description}</div>
                    {viewed > 0 && (
                      <div style={{ fontSize: 10, color: textSecondary, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} /> 已查看 {viewed} 次
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Detail panel */}
            <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
              {selectedCommand ? (
                <div>
                  {/* Header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    marginBottom: 20,
                  }}>
                    <div style={{
                      padding: '8px 14px',
                      background: codeBg,
                      borderRadius: 10,
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 22, fontWeight: 700,
                      color: accentColor,
                    }}>{selectedCommand.name}</div>
                    <div style={{
                      padding: '4px 10px',
                      background: accentBg,
                      borderRadius: 8,
                      fontSize: 11, color: accentColor, fontWeight: 600,
                    }}>
                      {CATEGORIES.find(c => c.id === selectedCommand.category)?.name}
                    </div>
                    <button onClick={() => toggleLearned(selectedCommand.name)} style={{
                      marginLeft: 'auto',
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px',
                      background: learnedCommands.has(selectedCommand.name) ? successBg : glassBg,
                      border: `1px solid ${learnedCommands.has(selectedCommand.name) ? successColor : glassBorder}`,
                      borderRadius: 8,
                      color: learnedCommands.has(selectedCommand.name) ? successColor : textPrimary,
                      cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      backdropFilter: 'blur(8px)',
                    }}>
                      {learnedCommands.has(selectedCommand.name) ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={14} /> 已学习</span> : <><Star size={14} /> 标记已学习</>}
                    </button>
                  </div>

                  <p style={{ color: textSecondary, fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                    {selectedCommand.description}
                  </p>

                  {/* Syntax */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Code2 size={14} color={accentColor} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>语法</span>
                      <button onClick={() => copyToClipboard(selectedCommand.syntax, 'syntax')} style={{
                        marginLeft: 'auto',
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px',
                        background: glassBg,
                        border: `1px solid ${glassBorder}`,
                        borderRadius: 6,
                        color: textSecondary,
                        cursor: 'pointer', fontSize: 11,
                      }}>
                        {copiedId === 'syntax' ? <Check size={12} color={successColor} /> : <Copy size={12} />}
                        {copiedId === 'syntax' ? '已复制' : '复制'}
                      </button>
                    </div>
                    <code style={{
                      display: 'block', padding: '14px 18px',
                      background: codeBg, borderRadius: 10,
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                      fontSize: 14, color: isDark ? '#a5d6a7' : '#2e7d32',
                      border: `1px solid ${glassBorder}`,
                      overflow: 'auto',
                    }}>{selectedCommand.syntax}</code>
                  </div>

                  {/* Parameters */}
                  {selectedCommand.params.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Hash size={14} color={accentColor} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>参数说明</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {selectedCommand.params.map((param, idx) => (
                          <div key={idx} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 14px',
                            background: glassBg,
                            border: `1px solid ${glassBorder}`,
                            borderRadius: 8,
                          }}>
                            <code style={{
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: 12, fontWeight: 700,
                              color: accentColor,
                              minWidth: 120,
                            }}>{param.name}</code>
                            <span style={{ fontSize: 12, color: textSecondary }}>{param.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Examples */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <FileCode size={14} color={accentColor} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>使用示例</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selectedCommand.examples.map((example, idx) => (
                        <div key={idx} style={{
                          background: codeBg,
                          border: `1px solid ${glassBorder}`,
                          borderRadius: 10,
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '6px 12px',
                            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                            borderBottom: `1px solid ${glassBorder}`,
                          }}>
                            <span style={{ fontSize: 11, color: textSecondary, fontWeight: 600 }}>示例 {idx + 1}</span>
                            <button onClick={() => copyToClipboard(example, `ex-${idx}`)} style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '3px 8px',
                              background: 'transparent',
                              border: 'none',
                              color: textSecondary,
                              cursor: 'pointer', fontSize: 11,
                            }}>
                              {copiedId === `ex-${idx}` ? <Check size={12} color={successColor} /> : <Copy size={12} />}
                              {copiedId === `ex-${idx}` ? '已复制' : '复制'}
                            </button>
                          </div>
                          <code style={{
                            display: 'block', padding: '12px 16px',
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            fontSize: 13, color: isDark ? '#ffcc80' : '#e65100',
                            whiteSpace: 'pre-wrap',
                          }}>{example}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  height: '100%', color: textSecondary, gap: 12,
                }}>
                  <Terminal size={48} style={{ opacity: 0.3 }} />
                  <div style={{ fontSize: 14 }}>从左侧列表选择一个命令开始学习</div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'simulator' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${divider}`,
              display: 'flex', alignItems: 'center', gap: 12,
              flexShrink: 0,
            }}>
              <Terminal size={18} color={accentColor} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>交互式命令模拟器</span>
              <span style={{ fontSize: 11, color: textSecondary, marginLeft: 'auto' }}>
                输入 help 查看可用命令
              </span>
              <button onClick={() => { setSimHistory([]); setSimCwd('/home/user') }} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 12px',
                background: glassBg, border: `1px solid ${glassBorder}`,
                borderRadius: 8, color: textSecondary,
                cursor: 'pointer', fontSize: 12,
              }}>
                <RotateCcw size={12} /> 重置
              </button>
            </div>

            <div style={{
              flex: 1, overflow: 'auto',
              padding: '16px 20px',
              background: codeBg,
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: 13,
            }}>
              {simHistory.length === 0 && (
                <div style={{ color: textSecondary, marginBottom: 12, lineHeight: 1.8 }}>
                  <div style={{ color: accentColor, marginBottom: 4 }}>WebLinux 命令模拟器 v1.0</div>
                  <div>在下方输入命令来体验 Linux 命令的效果。</div>
                  <div>试试: <code style={{ color: '#ffcc80' }}>ls</code>, <code style={{ color: '#ffcc80' }}>pwd</code>, <code style={{ color: '#ffcc80' }}>cat readme.md</code></div>
                </div>
              )}
              {simHistory.map((entry, idx) => (
                <div key={idx} style={{ marginBottom: 12 }}>
                  <div>
                    <span style={{ color: isDark ? '#569cd6' : '#0066cc' }}>user@web-linux</span>
                    <span style={{ color: textSecondary }}>:</span>
                    <span style={{ color: isDark ? '#ce9178' : '#d17a00' }}>{simCwd}</span>
                    <span style={{ color: textSecondary }}>$ </span>
                    <span>{entry.input}</span>
                  </div>
                  {entry.output && entry.output !== '\x00' && (
                    <pre style={{
                      margin: '4px 0 0',
                      whiteSpace: 'pre-wrap',
                      color: isDark ? '#d4d4d4' : '#333',
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}>{entry.output}</pre>
                  )}
                  {entry.output === '\x00' && (
                    <div style={{ color: textSecondary, fontSize: 11, fontStyle: 'italic' }}>[屏幕已清空]</div>
                  )}
                </div>
              ))}
            </div>

            <div style={{
              padding: '12px 20px',
              borderTop: `1px solid ${divider}`,
              display: 'flex', alignItems: 'center', gap: 10,
              flexShrink: 0,
              background: glassBg,
              backdropFilter: 'blur(8px)',
            }}>
              <span style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 13, color: isDark ? '#569cd6' : '#0066cc',
                whiteSpace: 'nowrap',
              }}>user@web-linux:{simCwd}$</span>
              <input
                type="text"
                value={simInput}
                onChange={(e) => setSimInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') runSimulator() }}
                placeholder="输入命令..."
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  color: textPrimary, fontFamily: 'inherit', fontSize: 13,
                  outline: 'none', caretColor: accentColor,
                }}
                spellCheck={false}
              />
              <button onClick={runSimulator} style={{
                padding: '6px 14px',
                background: `linear-gradient(135deg, ${accentColor}, #a78bfa)`,
                border: 'none', borderRadius: 8,
                color: '#fff', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Play size={12} /> 执行
              </button>
            </div>
          </div>
        )}

        {activeTab === 'cheatsheet' && (
          <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Zap size={18} color={accentColor} />
              <span style={{ fontSize: 16, fontWeight: 700 }}>Linux 命令速查表</span>
              <span style={{ fontSize: 12, color: textSecondary, marginLeft: 'auto' }}>
                {CHEAT_SHEET_COMMANDS.length} 条常用命令
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}>
              {CHEAT_SHEET_COMMANDS.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  background: glassBg,
                  border: `1px solid ${glassBorder}`,
                  borderRadius: 10,
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = accentColor
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = glassBorder
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <code style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 13, fontWeight: 700,
                    color: accentColor,
                    background: codeBg,
                    padding: '4px 10px', borderRadius: 6,
                    whiteSpace: 'nowrap',
                  }}>{item.name}</code>
                  <span style={{ flex: 1, fontSize: 12, color: textSecondary }}>{item.desc}</span>
                  <button onClick={() => copyToClipboard(item.name, `cs-${idx}`)} style={{
                    padding: '4px',
                    background: 'transparent', border: 'none',
                    color: textSecondary, cursor: 'pointer',
                  }}
                    title="复制命令"
                  >
                    {copiedId === `cs-${idx}` ? <Check size={14} color={successColor} /> : <Copy size={14} />}
                  </button>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 24, padding: '16px 20px',
              background: glassBg,
              border: `1px solid ${glassBorder}`,
              borderRadius: 12,
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <BookOpen size={16} color={accentColor} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>学习提示</span>
              </div>
              <div style={{ fontSize: 12, color: textSecondary, lineHeight: 1.8 }}>
                · 点击命令卡片右侧的复制按钮可快速复制命令<br />
                · 在"命令学习"标签页中点击"标记已学习"来跟踪进度<br />
                · 在"命令模拟器"中实际体验命令的执行效果<br />
                · 所有学习数据保存在本地浏览器中
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}