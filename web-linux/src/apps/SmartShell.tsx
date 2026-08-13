import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  Terminal, Sparkles, Copy, Check, Trash2, ChevronRight,
  Search, Clock, X, Play, History as HistoryIcon, Layers, FileText,
  FileSearch, Cpu, HardDrive, Network, Activity,
  User, Shield, Archive, Wrench, Calendar, Hash, Star,
} from 'lucide-react'

type CategoryId =
  | 'all' | 'files' | 'system' | 'network' | 'process'
  | 'text' | 'permission' | 'archive' | 'dev' | 'datetime'
  | 'user' | 'disk' | 'misc'

interface Category {
  id: CategoryId
  name: string
  icon: React.ReactNode
  color: string
}

interface CommandPattern {
  id: string
  pattern: RegExp
  command: string | ((m: RegExpMatchArray) => string)
  explanation: string
  category: Exclude<CategoryId, 'all'>
  example: string
}

interface HistoryEntry {
  id: string
  input: string
  command: string
  explanation: string
  category: string
  timestamp: number
}

interface SavedCommand {
  id: string
  name: string
  input: string
  command: string
  category: string
  createdAt: number
}

const CATEGORIES: Category[] = [
  { id: 'all', name: '全部', icon: <Layers size={16} />, color: '#7c6cf0' },
  { id: 'files', name: '文件操作', icon: <FileText size={16} />, color: '#22c55e' },
  { id: 'system', name: '系统信息', icon: <Cpu size={16} />, color: '#3b82f6' },
  { id: 'network', name: '网络', icon: <Network size={16} />, color: '#06b6d4' },
  { id: 'process', name: '进程管理', icon: <Activity size={16} />, color: '#f97316' },
  { id: 'text', name: '文本处理', icon: <FileSearch size={16} />, color: '#ec4899' },
  { id: 'permission', name: '文件权限', icon: <Shield size={16} />, color: '#eab308' },
  { id: 'archive', name: '压缩归档', icon: <Archive size={16} />, color: '#a855f7' },
  { id: 'dev', name: '开发工具', icon: <Wrench size={16} />, color: '#14b8a6' },
  { id: 'datetime', name: '时间日期', icon: <Calendar size={16} />, color: '#f43f5e' },
  { id: 'user', name: '用户管理', icon: <User size={16} />, color: '#6366f1' },
  { id: 'disk', name: '磁盘操作', icon: <HardDrive size={16} />, color: '#64748b' },
  { id: 'misc', name: '其他', icon: <Hash size={16} />, color: '#94a3b8' },
]

const COMMAND_PATTERNS: CommandPattern[] = [
  { id: 'f1', pattern: /list files/i, command: 'ls -la', explanation: '列出所有文件（含隐藏文件）', category: 'files', example: 'list files' },
  { id: 'f2', pattern: /list (all\s+)?files? in (.*)/i, command: (m) => `ls -la ${m[2]}`, explanation: '列出指定目录的文件', category: 'files', example: 'list files in /home' },
  { id: 'f3', pattern: /show (me )?(the )?(current )?(directory|path|folder)/i, command: 'pwd', explanation: '显示当前工作目录', category: 'files', example: 'show current directory' },
  { id: 'f4', pattern: /(go to|cd|change to|navigate to) (.*)/i, command: (m) => `cd ${m[2]}`, explanation: '切换到指定目录', category: 'files', example: 'go to /var/log' },
  { id: 'f5', pattern: /create (?:a )?(file|directory|folder|dir) (?:called )?(.*)/i, command: (m) => (m[1] === 'file' ? `touch ${m[2]}` : `mkdir -p ${m[2]}`), explanation: '创建文件或目录', category: 'files', example: 'create file test.txt' },
  { id: 'f6', pattern: /make (?:a )?(directory|folder|dir) (?:called )?(.*)/i, command: (m) => `mkdir -p ${m[2]}`, explanation: '创建目录', category: 'files', example: 'make directory projects' },
  { id: 'f7', pattern: /(delete|remove|rm) (?:a )?(file|folder|directory|dir) (?:called )?(.*)/i, command: (m) => (m[2] === 'file' ? `rm ${m[3]}` : `rm -rf ${m[3]}`), explanation: '删除文件或目录', category: 'files', example: 'remove file old.txt' },
  { id: 'f8', pattern: /copy (?:the )?(file|folder|directory) (.*) (?:to|into) (.*)/i, command: (m) => `cp ${m[2]} ${m[3]}`, explanation: '复制文件或目录', category: 'files', example: 'copy file report.txt to backup/' },
  { id: 'f9', pattern: /move (?:the )?(file|folder|directory) (.*) (?:to|into) (.*)/i, command: (m) => `mv ${m[2]} ${m[3]}`, explanation: '移动或重命名文件', category: 'files', example: 'move file old.txt to new.txt' },
  { id: 'f10', pattern: /rename (?:the )?(file|folder|directory) (.*) (?:to|as) (.*)/i, command: (m) => `mv ${m[2]} ${m[3]}`, explanation: '重命名文件或目录', category: 'files', example: 'rename file old.txt to new.txt' },
  { id: 'f11', pattern: /(view|read|cat|show|display) (?:the )?(file|content of|contents of) (.*)/i, command: (m) => `cat ${m[3] || m[2]}`, explanation: '查看文件内容', category: 'files', example: 'view file readme.txt' },
  { id: 'f12', pattern: /find (?:all )?(.*) files?/i, command: (m) => `find . -name "*.${m[1]}"`, explanation: '查找所有指定扩展名的文件', category: 'files', example: 'find all txt files' },
  { id: 'f13', pattern: /search for (.*) in (?:all )?files?/i, command: (m) => `grep -r "${m[1]}" .`, explanation: '在文件中递归搜索文本', category: 'files', example: 'search for error in files' },
  { id: 'f14', pattern: /find (?:files? )?(containing|with) (.*)/i, command: (m) => `grep -rl "${m[2]}" .`, explanation: '查找包含指定文本的文件', category: 'files', example: 'find files containing hello' },
  { id: 'f15', pattern: /show hidden files/i, command: 'ls -la', explanation: '显示隐藏文件', category: 'files', example: 'show hidden files' },
  { id: 'f16', pattern: /show file (?:details|info|properties) (?:for )?(.*)/i, command: (m) => `ls -la ${m[1]}`, explanation: '显示文件详细信息', category: 'files', example: 'show file details report.txt' },
  { id: 'f17', pattern: /create (?:a )?(?:new )?(?:empty )?(file|text file) (?:called )?(.*)/i, command: (m) => `touch ${m[3] || m[2]}`, explanation: '创建空文件', category: 'files', example: 'create empty file note.txt' },
  { id: 'f18', pattern: /write (?:to )?(?:a )?(file) (.*) (?:with )?(?:content )?(.*)/i, command: (m) => `echo "${m[3]}" > ${m[2]}`, explanation: '写入内容到文件', category: 'files', example: 'write to file test.txt hello world' },
  { id: 'f19', pattern: /append (?:to )?(file) (.*) (?:with )?(?:content )?(.*)/i, command: (m) => `echo "${m[3]}" >> ${m[2]}`, explanation: '追加内容到文件', category: 'files', example: 'append to file log.txt new entry' },
  { id: 'f20', pattern: /count (?:the )?(lines|words|characters) (?:in )?(?:file )?(.*)/i, command: (m) => `wc ${m[1].startsWith('line') ? '-l' : m[1].startsWith('word') ? '-w' : '-c'} ${m[2]}`, explanation: '统计文件行数/词数/字符数', category: 'files', example: 'count lines in file data.txt' },

  { id: 's1', pattern: /(system info|system information|about system|what system)/i, command: 'uname -a', explanation: '显示系统内核信息', category: 'system', example: 'system info' },
  { id: 's2', pattern: /(what'?s )?my (hostname|computer name)/i, command: 'hostname', explanation: '显示主机名', category: 'system', example: "what's my hostname" },
  { id: 's3', pattern: /(who am i|whoami|my username|current user)/i, command: 'whoami', explanation: '显示当前用户名', category: 'system', example: 'who am i' },
  { id: 's4', pattern: /(memory|ram) (usage|info|status|stats)/i, command: 'free -h', explanation: '显示内存使用情况', category: 'system', example: 'memory usage' },
  { id: 's5', pattern: /cpu (info|usage|stats|load)/i, command: 'top -bn1 | head -20', explanation: '显示CPU使用情况', category: 'system', example: 'cpu info' },
  { id: 's6', pattern: /(kernel|os) (info|version|release)/i, command: 'uname -r', explanation: '显示内核版本', category: 'system', example: 'kernel version' },
  { id: 's7', pattern: /system (uptime|running time)/i, command: 'uptime', explanation: '显示系统运行时间', category: 'system', example: 'system uptime' },
  { id: 's8', pattern: /(login|logged in) users/i, command: 'who', explanation: '显示登录用户', category: 'system', example: 'logged in users' },
  { id: 's9', pattern: /(system )?(environment )?variables?/i, command: 'env', explanation: '显示环境变量', category: 'system', example: 'environment variables' },
  { id: 's10', pattern: /(where is|find) (?:the )?(?:command|binary) (.*)/i, command: (m) => `which ${m[2]}`, explanation: '查找命令路径', category: 'system', example: 'where is python' },
  { id: 's11', pattern: /(what )?(packages?|software) (?:are )?installed/i, command: 'dpkg -l | head -30', explanation: '列出已安装的软件包', category: 'system', example: 'what packages are installed' },
  { id: 's12', pattern: /system (info|dashboard|overview)/i, command: 'neofetch', explanation: '显示系统信息概览', category: 'system', example: 'system overview' },

  { id: 'n1', pattern: /(network|internet) (info|status|config|interface)/i, command: 'ifconfig', explanation: '显示网络接口信息', category: 'network', example: 'network info' },
  { id: 'n2', pattern: /ping (.*)/i, command: (m) => `ping -c 4 ${m[1]}`, explanation: '测试网络连通性', category: 'network', example: 'ping google.com' },
  { id: 'n3', pattern: /(what'?s )?my (ip|ip address|public ip)/i, command: 'curl ifconfig.me', explanation: '获取公网IP地址', category: 'network', example: "what's my ip" },
  { id: 'n4', pattern: /download (?:a )?(file from )?(.*)/i, command: (m) => `wget ${m[1]}`, explanation: '下载文件', category: 'network', example: 'download file from https://example.com' },
  { id: 'n5', pattern: /(fetch|get|curl) (?:url )?(.*)/i, command: (m) => `curl -L ${m[1]}`, explanation: '获取URL内容', category: 'network', example: 'fetch https://example.com' },
  { id: 'n6', pattern: /(dns|nslookup) (?:for )?(.*)/i, command: (m) => `nslookup ${m[1]}`, explanation: 'DNS查询', category: 'network', example: 'dns google.com' },
  { id: 'n7', pattern: /(netstat|network connections)/i, command: 'netstat -tuln', explanation: '显示网络连接', category: 'network', example: 'netstat' },
  { id: 'n8', pattern: /(ports? (?:are )?(open|listening)|listening ports?)/i, command: 'netstat -tlnp', explanation: '显示监听端口', category: 'network', example: 'open ports' },
  { id: 'n9', pattern: /traceroute (?:to )?(.*)/i, command: (m) => `traceroute ${m[1]}`, explanation: '路由追踪', category: 'network', example: 'traceroute google.com' },
  { id: 'n10', pattern: /(wifi|wireless) (?:status|info|scan)/i, command: 'iwconfig', explanation: '显示无线网卡状态', category: 'network', example: 'wifi status' },

  { id: 'p1', pattern: /(processes?|running processes?|task list)/i, command: 'ps aux', explanation: '列出所有进程', category: 'process', example: 'list processes' },
  { id: 'p2', pattern: /(kill|stop|terminate) (?:process )?(.*)/i, command: (m) => `kill ${m[1]}`, explanation: '终止进程', category: 'process', example: 'kill 1234' },
  { id: 'p3', pattern: /force (?:kill|stop|terminate) (?:process )?(.*)/i, command: (m) => `kill -9 ${m[1]}`, explanation: '强制终止进程', category: 'process', example: 'force kill process 1234' },
  { id: 'p4', pattern: /(top|monitor) (?:processes?|system)/i, command: 'top', explanation: '实时进程监控', category: 'process', example: 'top processes' },
  { id: 'p5', pattern: /(killall|stop all) (?:processes? )?(called )?(.*)/i, command: (m) => `killall ${m[1]}`, explanation: '按名称终止进程', category: 'process', example: 'killall chrome' },
  { id: 'p6', pattern: /find process (?:by name )?(.*)/i, command: (m) => `ps aux | grep ${m[1]}`, explanation: '按名称查找进程', category: 'process', example: 'find process python' },
  { id: 'p7', pattern: /(nice|priority) (?:process )?(.*) to (.*)/i, command: (m) => `renice ${m[2]} -p ${m[1]}`, explanation: '调整进程优先级', category: 'process', example: 'nice process 1234 to 5' },
  { id: 'p8', pattern: /(background|bg) (?:processes?)?/i, command: 'jobs', explanation: '列出后台任务', category: 'process', example: 'background jobs' },
  { id: 'p9', pattern: /(foreground|fg) (?:job )?(.*)/i, command: (m) => `fg %${m[1]}`, explanation: '将后台任务调到前台', category: 'process', example: 'fg %1' },
  { id: 'p10', pattern: /(suspend|pause) (?:process )?(.*)/i, command: (m) => `kill -STOP ${m[1]}`, explanation: '暂停进程', category: 'process', example: 'suspend process 1234' },

  { id: 't1', pattern: /(sort )?(lines? of )?(file )?(.*)/i, command: (m) => `sort ${m[3]}`, explanation: '对文件行排序', category: 'text', example: 'sort file data.txt' },
  { id: 't2', pattern: /remove duplicate (?:lines? )?(from )?(file )?(.*)/i, command: (m) => `sort ${m[3]} | uniq`, explanation: '去除重复行', category: 'text', example: 'remove duplicates from file data.txt' },
  { id: 't3', pattern: /(unique|distinct) lines? (?:in )?(file )?(.*)/i, command: (m) => `sort ${m[2]} | uniq`, explanation: '显示唯一行', category: 'text', example: 'unique lines in data.txt' },
  { id: 't4', pattern: /(first|head) (?:\d+ )?lines? of (?:file )?(.*)/i, command: (m) => `head -n 10 ${m[2]}`, explanation: '显示文件前10行', category: 'text', example: 'first 10 lines of file log.txt' },
  { id: 't5', pattern: /(last|tail) (?:\d+ )?lines? of (?:file )?(.*)/i, command: (m) => `tail -n 10 ${m[2]}`, explanation: '显示文件后10行', category: 'text', example: 'last 10 lines of file log.txt' },
  { id: 't6', pattern: /(search|grep|find) (?:for )?(.*) (?:in )?(?:file )?(.*)/i, command: (m) => `grep "${m[1]}" ${m[2]}`, explanation: '在文件中搜索文本', category: 'text', example: 'grep error in log.txt' },
  { id: 't7', pattern: /(replace|substitute) (?:text )?(.*) (?:with )?(.*) (?:in )?(?:file )?(.*)/i, command: (m) => `sed -i 's/${m[1]}/${m[2]}/g' ${m[3]}`, explanation: '替换文件中的文本', category: 'text', example: 'replace foo with bar in file.txt' },
  { id: 't8', pattern: /(merge|combine|concat) (?:files? )?(.*)/i, command: (m) => `cat ${m[1]}`, explanation: '合并多个文件', category: 'text', example: 'merge file1 file2' },
  { id: 't9', pattern: /(word count|count words|wc) (?:of )?(?:file )?(.*)/i, command: (m) => `wc -w ${m[1]}`, explanation: '统计词数', category: 'text', example: 'word count of file.txt' },
  { id: 't10', pattern: /(uppercase|to upper|convert to uppercase) (?:file )?(.*)/i, command: (m) => `tr '[:lower:]' '[:upper:]' < ${m[1]}`, explanation: '转换为大写', category: 'text', example: 'uppercase file text.txt' },

  { id: 'perm1', pattern: /(change|set) (?:permissions?|permission) (?:of )?(?:file )?(.*) to (.*)/i, command: (m) => `chmod ${m[2]} ${m[1]}`, explanation: '修改文件权限', category: 'permission', example: 'change permission of file.txt to 755' },
  { id: 'perm2', pattern: /(make )?(file|script) (.*) (executable|runable)/i, command: (m) => `chmod +x ${m[2]}`, explanation: '设置文件为可执行', category: 'permission', example: 'make script.sh executable' },
  { id: 'perm3', pattern: /(remove )?(write )?(permission) (?:from )?(?:file )?(.*)/i, command: (m) => `chmod -w ${m[1]}`, explanation: '移除写权限', category: 'permission', example: 'remove write permission from file.txt' },
  { id: 'perm4', pattern: /(add )?(read )?(permission) (?:to )?(?:file )?(.*)/i, command: (m) => `chmod +r ${m[1]}`, explanation: '添加读权限', category: 'permission', example: 'add read permission to file.txt' },
  { id: 'perm5', pattern: /(change|set) (?:owner|ownership) (?:of )?(?:file )?(.*) to (.*)/i, command: (m) => `chown ${m[2]} ${m[1]}`, explanation: '修改文件所有者', category: 'permission', example: 'change owner of file.txt to user' },
  { id: 'perm6', pattern: /(change|set) (?:group )?(owner|ownership) (?:of )?(?:file )?(.*) to (.*)/i, command: (m) => `chown :${m[2]} ${m[1]}`, explanation: '修改文件组', category: 'permission', example: 'change group owner of file.txt to admin' },
  { id: 'perm7', pattern: /(permission|access) (?:of|for )?(?:file )?(.*)/i, command: (m) => `ls -la ${m[1]}`, explanation: '查看文件权限', category: 'permission', example: 'permission of file.txt' },
  { id: 'perm8', pattern: /(default|umask) (?:permission)/i, command: 'umask', explanation: '显示默认权限掩码', category: 'permission', example: 'default permission' },

  { id: 'a1', pattern: /compress (?:file|folder|directory) (.*)/i, command: (m) => `tar -czf ${m[1]}.tar.gz ${m[1]}`, explanation: '压缩文件/目录为tar.gz', category: 'archive', example: 'compress folder projects' },
  { id: 'a2', pattern: /extract (?:file )?(.*)\.(tar\.gz|tgz|tar)/i, command: (m) => `tar -xzf ${m[1]}.${m[2]}`, explanation: '解压tar.gz文件', category: 'archive', example: 'extract file archive.tar.gz' },
  { id: 'a3', pattern: /extract (?:file )?(.*)\.(zip)/i, command: (m) => `unzip ${m[1]}.zip`, explanation: '解压zip文件', category: 'archive', example: 'extract file archive.zip' },
  { id: 'a4', pattern: /compress (?:to )?zip (?:file )?(.*)/i, command: (m) => `zip -r ${m[1]}.zip ${m[1]}`, explanation: '压缩为zip', category: 'archive', example: 'compress to zip folder' },
  { id: 'a5', pattern: /list (?:contents? of )?(?:archive )?(.*)\.(tar\.gz|tgz)/i, command: (m) => `tar -tzf ${m[1]}.${m[2]}`, explanation: '列出压缩包内容', category: 'archive', example: 'list archive.tar.gz' },
  { id: 'a6', pattern: /compress (?:file )?(.*) with gzip/i, command: (m) => `gzip ${m[1]}`, explanation: '使用gzip压缩', category: 'archive', example: 'compress file.txt with gzip' },
  { id: 'a7', pattern: /decompress (?:file )?(.*)\.(gz)/i, command: (m) => `gunzip ${m[1]}.gz`, explanation: '解压gzip文件', category: 'archive', example: 'decompress file.txt.gz' },
  { id: 'a8', pattern: /compress (?:file )?(.*) with bzip2/i, command: (m) => `bzip2 ${m[1]}`, explanation: '使用bzip2压缩', category: 'archive', example: 'compress file.txt with bzip2' },

  { id: 'd1', pattern: /(make|build|compile) (?:project)?/i, command: 'make', explanation: '构建项目', category: 'dev', example: 'make' },
  { id: 'd2', pattern: /(install|npm install) (?:dependencies|packages)?/i, command: 'npm install', explanation: '安装依赖', category: 'dev', example: 'npm install' },
  { id: 'd3', pattern: /(run|start|npm start) (?:project|app|server)?/i, command: 'npm start', explanation: '启动项目', category: 'dev', example: 'npm start' },
  { id: 'd4', pattern: /(git )?(status|git status)/i, command: 'git status', explanation: '查看Git状态', category: 'dev', example: 'git status' },
  { id: 'd5', pattern: /(git )?(commit|git commit)/i, command: 'git commit -m "update"', explanation: '提交更改', category: 'dev', example: 'git commit' },
  { id: 'd6', pattern: /(git )?(push|git push)/i, command: 'git push', explanation: '推送到远程仓库', category: 'dev', example: 'git push' },
  { id: 'd7', pattern: /(git )?(pull|git pull)/i, command: 'git pull', explanation: '从远程仓库拉取', category: 'dev', example: 'git pull' },
  { id: 'd8', pattern: /(git )?(log|git log)/i, command: 'git log --oneline -10', explanation: '查看Git日志', category: 'dev', example: 'git log' },
  { id: 'd9', pattern: /(git )?(branch|git branch)/i, command: 'git branch', explanation: '查看分支', category: 'dev', example: 'git branch' },
  { id: 'd10', pattern: /(python|python3) (?:script )?(.*)/i, command: (m) => `python3 ${m[1]}`, explanation: '运行Python脚本', category: 'dev', example: 'python3 script.py' },

  { id: 'dt1', pattern: /(what'?s )?(today'?s )?date/i, command: 'date', explanation: '显示当前日期', category: 'datetime', example: "what's today's date" },
  { id: 'dt2', pattern: /(what )?time (?:is )?it/i, command: 'date +%H:%M:%S', explanation: '显示当前时间', category: 'datetime', example: 'what time is it' },
  { id: 'dt3', pattern: /(show )?calendar/i, command: 'cal', explanation: '显示日历', category: 'datetime', example: 'show calendar' },
  { id: 'dt4', pattern: /(show )?calendar for (.*)/i, command: (m) => `cal ${m[1]}`, explanation: '显示指定月份日历', category: 'datetime', example: 'calendar for march' },
  { id: 'dt5', pattern: /(date )?(difference between|diff) (.*) and (.*)/i, command: (m) => `echo $(( ($(date -d "${m[3]}" +%s) - $(date -d "${m[2]}" +%s)) / 86400 )) days`, explanation: '计算日期差', category: 'datetime', example: 'date diff 2024-01-01 and 2024-12-31' },
  { id: 'dt6', pattern: /(timestamp|unix time|epoch)/i, command: 'date +%s', explanation: '显示Unix时间戳', category: 'datetime', example: 'unix timestamp' },
  { id: 'dt7', pattern: /(countdown|days until) (.*)/i, command: (m) => `echo $(( ($(date -d "${m[1]}" +%s) - $(date +%s)) / 86400 )) days until ${m[1]}`, explanation: '计算倒数天数', category: 'datetime', example: 'days until 2025-01-01' },
  { id: 'dt8', pattern: /(timezone|time zone)/i, command: 'date +%Z', explanation: '显示当前时区', category: 'datetime', example: 'timezone' },

  { id: 'u1', pattern: /(list )?(users?|all users)/i, command: 'cat /etc/passwd', explanation: '列出系统用户', category: 'user', example: 'list users' },
  { id: 'u2', pattern: /(current user|my info|user info)/i, command: 'id', explanation: '显示当前用户信息', category: 'user', example: 'user info' },
  { id: 'u3', pattern: /(add|create) user (.*)/i, command: (m) => `useradd -m ${m[1]}`, explanation: '创建新用户', category: 'user', example: 'add user john' },
  { id: 'u4', pattern: /(delete|remove) user (.*)/i, command: (m) => `userdel ${m[1]}`, explanation: '删除用户', category: 'user', example: 'delete user john' },
  { id: 'u5', pattern: /(add to|join) group (.*)/i, command: (m) => `groupadd ${m[1]}`, explanation: '创建新组', category: 'user', example: 'add group developers' },
  { id: 'u6', pattern: /(list )?(groups?|all groups)/i, command: 'cat /etc/group', explanation: '列出系统组', category: 'user', example: 'list groups' },
  { id: 'u7', pattern: /(who is|show user) (.*)/i, command: (m) => `grep ${m[1]} /etc/passwd`, explanation: '显示用户详情', category: 'user', example: 'show user john' },
  { id: 'u8', pattern: /(sudo|superuser|root) (.*)/i, command: (m) => `sudo ${m[1]}`, explanation: '以root权限执行', category: 'user', example: 'sudo apt update' },

  { id: 'dk1', pattern: /(disk|disc) (usage|space|info)/i, command: 'df -h', explanation: '显示磁盘使用情况', category: 'disk', example: 'disk usage' },
  { id: 'dk2', pattern: /(directory|folder) (size|usage|space)/i, command: 'du -sh ./*', explanation: '显示目录大小', category: 'disk', example: 'directory size' },
  { id: 'dk3', pattern: /(disk )?(free space|available space|remaining)/i, command: 'df -h .', explanation: '显示可用空间', category: 'disk', example: 'free space' },
  { id: 'dk4', pattern: /(analyze|check) (?:disk|storage|space)/i, command: 'du -sh ./* | sort -rh | head -10', explanation: '分析空间使用', category: 'disk', example: 'analyze disk space' },
  { id: 'dk5', pattern: /(largest|biggest) (?:files? )?(in )?(?:directory )?(.*)/i, command: (m) => `find ${m[1] || '.'} -type f -exec du -h {} + | sort -rh | head -10`, explanation: '查找最大文件', category: 'disk', example: 'largest files in /home' },
  { id: 'dk6', pattern: /(clean|clear|free) (?:disk|space|storage)/i, command: 'apt-get autoremove && apt-get autoclean', explanation: '清理磁盘空间', category: 'disk', example: 'clean disk space' },
  { id: 'dk7', pattern: /(format|mkfs) (?:disk|partition|drive)/i, command: 'lsblk', explanation: '查看磁盘列表', category: 'disk', example: 'list disks' },

  { id: 'misc1', pattern: /(clear|cls|reset) (?:screen|terminal|console)/i, command: 'clear', explanation: '清空终端屏幕', category: 'misc', example: 'clear screen' },
  { id: 'misc2', pattern: /(help|what can you do|show commands|list commands)/i, command: 'help', explanation: '显示帮助信息', category: 'misc', example: 'help' },
  { id: 'misc3', pattern: /(history|command history|past commands)/i, command: 'history', explanation: '显示命令历史', category: 'misc', example: 'command history' },
  { id: 'misc4', pattern: /(echo|print|output) (.*)/i, command: (m) => `echo "${m[1]}"`, explanation: '输出文本', category: 'misc', example: 'echo hello world' },
  { id: 'misc5', pattern: /(reboot|restart|shutdown|poweroff)/i, command: 'sudo shutdown now', explanation: '关机/重启', category: 'misc', example: 'shutdown' },
  { id: 'misc6', pattern: /(sleep|wait|delay) (?:for )?(.*)/i, command: (m) => `sleep ${m[1]}`, explanation: '延时等待', category: 'misc', example: 'sleep 5 seconds' },
  { id: 'misc7', pattern: /(calendar|crontab|scheduled task|cron job)/i, command: 'crontab -l', explanation: '查看定时任务', category: 'misc', example: 'crontab' },
  { id: 'misc8', pattern: /(env|environment|export) (?:variable )?(.*)/i, command: (m) => `export ${m[1]}`, explanation: '设置环境变量', category: 'misc', example: 'export PATH' },
]

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
}

function naturalLanguageToCommand(input: string): {
  command: string
  explanation: string
  category: string
} | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  for (const item of COMMAND_PATTERNS) {
    const match = trimmed.match(item.pattern)
    if (match) {
      const cmd = typeof item.command === 'function' ? item.command(match) : item.command
      const cat = CATEGORIES.find((c) => c.id === item.category)
      return { command: cmd, explanation: item.explanation, category: cat?.name || '其他' }
    }
  }
  return null
}

const quickExamples = [
  'list files', 'who am i', 'ping google.com', 'find all pdf files',
  'what time is it', 'system info', 'largest files in /var', 'make script.sh executable',
]

export default function SmartShell() {
  const [input, setInput] = useState('')
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [savedCommands, setSavedCommands] = useState<SavedCommand[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'translator' | 'patterns' | 'history'>('translator')
  const [isTranslating, setIsTranslating] = useState(false)
  const [lastResult, setLastResult] = useState<{ command: string; explanation: string; category: string } | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [newCommandName, setNewCommandName] = useState('')
  const [hoveredExample, setHoveredExample] = useState<string | null>(null)
  const [hoveredCopy, setHoveredCopy] = useState<string | null>(null)
  const [hoveredCategory, setHoveredCategory] = useState<CategoryId | null>(null)
  const [hoveredIconBtn, setHoveredIconBtn] = useState<string | null>(null)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('smartshell-history')
    if (saved) {
      try { setHistory(JSON.parse(saved)) } catch { /* ignore */ }
    }
    const savedCmds = localStorage.getItem('smartshell-saved')
    if (savedCmds) {
      try { setSavedCommands(JSON.parse(savedCmds)) } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('smartshell-history', JSON.stringify(history.slice(-50)))
  }, [history])

  useEffect(() => {
    localStorage.setItem('smartshell-saved', JSON.stringify(savedCommands))
  }, [savedCommands])

  const filteredPatterns = useMemo(() => {
    let patterns = COMMAND_PATTERNS
    if (activeCategory !== 'all') {
      patterns = patterns.filter((p) => p.category === activeCategory)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      patterns = patterns.filter(
        (p) =>
          p.explanation.toLowerCase().includes(q) ||
          p.example.toLowerCase().includes(q) ||
          (typeof p.command === 'string' && p.command.toLowerCase().includes(q))
      )
    }
    return patterns
  }, [activeCategory, searchQuery])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of COMMAND_PATTERNS) {
      counts[p.category] = (counts[p.category] || 0) + 1
    }
    return counts
  }, [])

  const handleTranslate = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed) return
    setIsTranslating(true)
    setTimeout(() => {
      const result = naturalLanguageToCommand(trimmed)
      if (result) {
        setLastResult({ command: result.command, explanation: result.explanation, category: result.category })
        const entry: HistoryEntry = {
          id: generateId(),
          input: trimmed,
          command: result.command,
          explanation: result.explanation,
          category: result.category,
          timestamp: Date.now(),
        }
        setHistory((prev) => [entry, ...prev].slice(0, 50))
      } else {
        setLastResult({ command: '# command not found', explanation: '未识别的自然语言输入，请尝试其他表达方式', category: '未识别' })
      }
      setIsTranslating(false)
    }, 300)
  }, [input])

  const copyCommand = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    })
  }, [])

  const saveCommand = useCallback(() => {
    if (!lastResult) return
    const name = newCommandName.trim() || `Saved ${savedCommands.length + 1}`
    const newSaved: SavedCommand = {
      id: generateId(),
      name,
      input: input.trim(),
      command: lastResult.command,
      category: lastResult.category,
      createdAt: Date.now(),
    }
    setSavedCommands((prev) => [newSaved, ...prev])
    setNewCommandName('')
    setShowSaveModal(false)
  }, [lastResult, input, savedCommands])

  const deleteHistoryItem = useCallback((id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id))
  }, [])

  const clearHistory = useCallback(() => { setHistory([]) }, [])

  const deleteSavedItem = useCallback((id: string) => {
    setSavedCommands((prev) => prev.filter((s) => s.id !== id))
  }, [])
  void deleteSavedItem

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTranslate()
    }
  }

  const activeCatInfo = CATEGORIES.find((c) => c.id === activeCategory)

  // ---- STYLES ----
  const S: Record<string, React.CSSProperties> = {
    container: {
      height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg, #0a0a12 0%, #0f0f1a 50%, #14142a 100%)',
      color: '#e0e0e0', fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
      overflow: 'hidden',
    },
    header: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 20px', background: 'rgba(20, 20, 35, 0.7)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)', flexShrink: 0,
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
    title: {
      fontSize: 17, fontWeight: 700,
      background: 'linear-gradient(135deg, #7c6cf0 0%, #06b6d4 100%)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      backgroundClip: 'text', letterSpacing: '0.5px',
    },
    subtitle: { fontSize: 12, color: '#888', marginLeft: 4 },
    tabs: { display: 'flex', gap: 4, background: 'rgba(255, 255, 255, 0.04)', padding: 4, borderRadius: 10 },
    tab: {
      padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
      color: '#888', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
      border: 'none', background: 'transparent', fontFamily: 'inherit',
    },
    tabActive: {
      background: 'linear-gradient(135deg, rgba(124, 108, 240, 0.3) 0%, rgba(6, 182, 212, 0.3) 100%)',
      color: '#7c6cf0', boxShadow: '0 0 12px rgba(124, 108, 240, 0.3)',
    },
    body: { flex: 1, display: 'flex', overflow: 'hidden' },
    sidebar: {
      width: 220, background: 'rgba(15, 15, 25, 0.5)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.06)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    },
    sidebarHeader: {
      padding: '12px 14px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    sidebarTitle: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#888' },
    categoryList: { flex: 1, overflowY: 'auto', padding: '6px' },
    categoryItem: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '7px 10px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
      marginBottom: 2, border: 'none', background: 'transparent', width: '100%',
      color: '#ccc', fontSize: 12, fontFamily: 'inherit',
    },
    categoryItemActive: {
      background: 'linear-gradient(135deg, rgba(124, 108, 240, 0.25) 0%, rgba(6, 182, 212, 0.15) 100%)',
      color: '#fff', boxShadow: 'inset 0 0 0 1px rgba(124, 108, 240, 0.3)',
    },
    categoryCount: {
      fontSize: 10, color: '#666', background: 'rgba(255, 255, 255, 0.08)',
      padding: '2px 6px', borderRadius: 10, minWidth: 18, textAlign: 'center',
    },
    mainContent: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    inputSection: {
      padding: '18px 20px', background: 'rgba(15, 15, 25, 0.4)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)', flexShrink: 0,
    },
    inputWrapper: { display: 'flex', gap: 12, alignItems: 'flex-start' },
    iconLeft: { marginTop: 12, color: '#7c6cf0', flexShrink: 0 },
    input: {
      flex: 1, background: 'rgba(10, 10, 20, 0.6)', backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: 12, padding: '12px 16px', color: '#e0e0e0', fontSize: 14,
      fontFamily: 'inherit', resize: 'none', minHeight: 44, maxHeight: 120,
      outline: 'none', transition: 'all 0.2s',
    },
    translateBtn: {
      display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px',
      background: 'linear-gradient(135deg, #7c6cf0 0%, #06b6d4 100%)',
      border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600,
      cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
      boxShadow: '0 4px 20px rgba(124, 108, 240, 0.3)', fontFamily: 'inherit',
    },
    examples: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    exampleChip: {
      padding: '4px 10px', background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 16, fontSize: 12,
      color: '#aaa', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
    },
    resultSection: { flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 },
    resultCard: {
      background: 'rgba(20, 20, 35, 0.6)', backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: 16, padding: 20, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    },
    resultHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    resultCategory: {
      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20,
      fontSize: 12, fontWeight: 600, background: 'rgba(124, 108, 240, 0.2)',
      color: '#c4b5fd', border: '1px solid rgba(124, 108, 240, 0.3)',
    },
    resultBadge: {
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8,
      fontSize: 11, fontWeight: 500, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80',
    },
    resultLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#666', marginBottom: 6 },
    resultText: { color: '#ccc', fontSize: 14, lineHeight: 1.6, wordBreak: 'break-word' },
    resultCommand: {
      background: 'rgba(10, 10, 20, 0.8)', border: '1px solid rgba(124, 108, 240, 0.3)',
      borderRadius: 10, padding: '14px 16px', marginTop: 10, display: 'flex',
      alignItems: 'center', justifyContent: 'space-between', gap: 12,
    },
    commandText: {
      color: '#7c6cf0', fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace", wordBreak: 'break-all', flex: 1,
    },
    actionBtns: { display: 'flex', gap: 8 },
    copyBtn: {
      display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
      background: 'rgba(124, 108, 240, 0.2)', border: '1px solid rgba(124, 108, 240, 0.3)',
      borderRadius: 8, color: '#c4b5fd', fontSize: 12, cursor: 'pointer',
      transition: 'all 0.15s', fontFamily: 'inherit',
    },
    saveBtn: {
      display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
      background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)',
      borderRadius: 8, color: '#fbbf24', fontSize: 12, cursor: 'pointer',
      transition: 'all 0.15s', fontFamily: 'inherit',
    },
    emptyState: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 40, color: '#555', gap: 16, minHeight: 300,
    },
    emptyIcon: {
      width: 72, height: 72, borderRadius: '50%',
      background: 'rgba(124, 108, 240, 0.1)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', color: '#7c6cf0', marginBottom: 8,
    },
    emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 1.6 },
    emptySubtext: { fontSize: 12, color: '#444', textAlign: 'center', marginTop: 4 },
    patternSearch: { padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', flexShrink: 0 },
    patternSearchInput: {
      width: '100%', background: 'rgba(10, 10, 20, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: 10, padding: '10px 14px', color: '#e0e0e0', fontSize: 13,
      fontFamily: 'inherit', outline: 'none',
    },
    patternCount: { fontSize: 11, color: '#666', padding: '8px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', flexShrink: 0 },
    patternCard: {
      background: 'rgba(20, 20, 35, 0.5)', border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: 12, padding: 14, marginBottom: 8, transition: 'all 0.15s',
    },
    patternHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    patternExplanation: { fontSize: 13, color: '#ddd', fontWeight: 500 },
    patternExample: { fontSize: 11, color: '#666', marginTop: 4 },
    patternCommand: {
      marginTop: 8, padding: '8px 12px', background: 'rgba(10, 10, 20, 0.6)',
      borderRadius: 8, fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 12, color: '#4ade80', wordBreak: 'break-all',
    },
    patternActions: { display: 'flex', gap: 6, marginTop: 10 },
    historyItem: {
      background: 'rgba(20, 20, 35, 0.4)', border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: 10, padding: 12, marginBottom: 8, transition: 'all 0.15s',
    },
    historyHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    historyInput: { fontSize: 12, color: '#888' },
    historyCommand: {
      fontSize: 13, color: '#7c6cf0', fontFamily: "'JetBrains Mono', monospace",
      marginTop: 4, wordBreak: 'break-all',
    },
    historyFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
    historyTime: { fontSize: 10, color: '#555', display: 'flex', alignItems: 'center', gap: 4 },
    historyCategory: {
      fontSize: 10, padding: '2px 8px', borderRadius: 10,
      background: 'rgba(124, 108, 240, 0.15)', color: '#c4b5fd',
    },
    iconBtn: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24,
      background: 'rgba(255, 255, 255, 0.06)', border: 'none', borderRadius: 6,
      color: '#888', cursor: 'pointer', transition: 'all 0.15s',
    },
    footer: {
      padding: '10px 20px', background: 'rgba(15, 15, 25, 0.6)',
      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontSize: 11, color: '#555', flexShrink: 0,
    },
    stats: { display: 'flex', gap: 16 },
    statItem: { display: 'flex', alignItems: 'center', gap: 6 },
    modal: {
      position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    },
    modalContent: {
      background: 'rgba(20, 20, 35, 0.95)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 16,
      padding: 24, width: 360, boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    },
    modalTitle: { fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#fff' },
    modalInput: {
      width: '100%', background: 'rgba(10, 10, 20, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: 10, padding: '10px 14px', color: '#e0e0e0', fontSize: 13,
      fontFamily: 'inherit', outline: 'none', marginBottom: 16, boxSizing: 'border-box',
    },
    modalActions: { display: 'flex', gap: 8, justifyContent: 'flex-end' },
    cancelBtn: {
      padding: '8px 16px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: 8, color: '#aaa', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
    },
    confirmBtn: {
      padding: '8px 16px', background: 'linear-gradient(135deg, #7c6cf0 0%, #06b6d4 100%)',
      border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600,
      cursor: 'pointer', fontFamily: 'inherit',
    },
    savedItem: {
      background: 'rgba(20, 20, 35, 0.4)', border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: 10, padding: 12, marginBottom: 8,
    },
    savedHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    savedName: { fontSize: 13, fontWeight: 600, color: '#fbbf24' },
    savedCommand: {
      fontSize: 12, color: '#7c6cf0', fontFamily: "'JetBrains Mono', monospace",
      wordBreak: 'break-all',
    },
  }

  const hoverStyle = (base: React.CSSProperties, hover: React.CSSProperties, isHover: boolean): React.CSSProperties => ({
    ...base, ...(isHover ? hover : {}),
  })

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #7c6cf0 0%, #06b6d4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(124, 108, 240, 0.3)',
          }}>
            <Terminal size={18} color="#fff" />
          </div>
          <div>
            <span style={S.title}>SmartShell</span>
            <span style={S.subtitle}>自然语言 Shell 命令翻译器</span>
          </div>
        </div>
        <div style={S.tabs}>
          {(['translator', 'patterns', 'history'] as const).map((tab) => (
            <button
              key={tab}
              style={{
                ...S.tab,
                ...(activeTab === tab ? S.tabActive : {}),
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'translator' && <Sparkles size={14} />}
              {tab === 'translator' && '翻译器'}
              {tab === 'patterns' && <Layers size={14} />}
              {tab === 'patterns' && `命令模式 (${COMMAND_PATTERNS.length})`}
              {tab === 'history' && <HistoryIcon size={14} />}
              {tab === 'history' && `历史 (${history.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={S.body}>
        {/* Sidebar */}
        <div style={S.sidebar}>
          <div style={S.sidebarHeader}>
            <span style={S.sidebarTitle}>分类</span>
            <span style={{ fontSize: 10, color: '#555' }}>{COMMAND_PATTERNS.length} 模式</span>
          </div>
          <div style={S.categoryList}>
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  style={hoverStyle(
                    { ...S.categoryItem, ...(isActive ? S.categoryItemActive : {}) },
                    { background: 'rgba(255, 255, 255, 0.05)' },
                    hoveredCategory === cat.id && !isActive
                  )}
                  onMouseEnter={() => setHoveredCategory(cat.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: isActive ? cat.color : undefined }}>
                    {cat.icon}
                    {cat.name}
                  </span>
                  <span style={S.categoryCount}>
                    {cat.id === 'all' ? COMMAND_PATTERNS.length : (categoryCounts[cat.id] || 0)}
                  </span>
                </button>
              )
            })}
          </div>

          {savedCommands.length > 0 && (
            <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#fbbf24', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Star size={12} />
                已保存 ({savedCommands.length})
              </div>
              <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                {savedCommands.slice(0, 5).map((cmd) => (
                  <div
                    key={cmd.id}
                    style={{
                      padding: '6px 8px', borderRadius: 6, marginBottom: 4,
                      background: 'rgba(255, 191, 36, 0.08)', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onClick={() => { setInput(cmd.input) }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 191, 36, 0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 191, 36, 0.08)')}
                  >
                    <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 500 }}>{cmd.name}</div>
                    <div style={{ fontSize: 10, color: '#666', fontFamily: "'JetBrains Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cmd.command}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div style={S.mainContent}>
          {activeTab === 'translator' && (
            <>
              <div style={S.inputSection}>
                <div style={S.inputWrapper}>
                  <Sparkles size={20} style={S.iconLeft} />
                  <textarea
                    ref={inputRef}
                    style={{
                      ...S.input,
                      ...(input ? {
                        borderColor: 'rgba(124, 108, 240, 0.5)',
                        boxShadow: '0 0 0 3px rgba(124, 108, 240, 0.12)',
                      } : {}),
                    }}
                    placeholder="用自然语言描述你想执行的操作，例如：find all pdf files"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    style={hoverStyle(
                      { ...S.translateBtn, ...(isTranslating || !input.trim() ? { opacity: 0.6, cursor: 'not-allowed' } : {}) },
                      { transform: 'translateY(-1px)', boxShadow: '0 6px 24px rgba(124, 108, 240, 0.4)' },
                      !isTranslating && !!input.trim()
                    )}
                    disabled={isTranslating || !input.trim()}
                    onClick={handleTranslate}
                  >
                    {isTranslating ? (
                      <>
                        <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                        翻译中
                      </>
                    ) : (
                      <>
                        <Play size={14} />
                        翻译
                      </>
                    )}
                  </button>
                </div>
                <div style={S.examples}>
                  <span style={{ fontSize: 11, color: '#555', marginRight: 4, alignSelf: 'center' }}>试试：</span>
                  {quickExamples.map((ex) => (
                    <button
                      key={ex}
                      style={hoverStyle(S.exampleChip, { background: 'rgba(124, 108, 240, 0.15)', borderColor: 'rgba(124, 108, 240, 0.4)', color: '#c4b5fd' }, hoveredExample === ex)}
                      onMouseEnter={() => setHoveredExample(ex)}
                      onMouseLeave={() => setHoveredExample(null)}
                      onClick={() => setInput(ex)}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <div ref={resultRef} style={S.resultSection}>
                {lastResult ? (
                  <div style={S.resultCard}>
                    <div style={S.resultHeader}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={S.resultCategory}>
                          {activeCatInfo?.icon}
                          {lastResult.category}
                        </span>
                        <span style={lastResult.command.startsWith('#') ? { ...S.resultBadge, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' } : S.resultBadge}>
                          {lastResult.command.startsWith('#') ? '未识别' : '已识别'}
                        </span>
                      </div>
                      <button
                        style={hoverStyle(S.iconBtn, { background: 'rgba(255,255,255,0.1)', color: '#fff' }, hoveredIconBtn === 'close')}
                        onClick={() => setLastResult(null)}
                        onMouseEnter={() => setHoveredIconBtn('close')}
                        onMouseLeave={() => setHoveredIconBtn(null)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div>
                      <div style={S.resultLabel}>说明</div>
                      <div style={S.resultText}>{lastResult.explanation}</div>
                    </div>
                    <div style={S.resultCommand}>
                      <code style={S.commandText}>{lastResult.command}</code>
                      <div style={S.actionBtns}>
                        <button
                          style={hoverStyle(S.copyBtn, S.copyBtn, hoveredCopy === 'result')}
                          onMouseEnter={() => setHoveredCopy('result')}
                          onMouseLeave={() => setHoveredCopy(null)}
                          onClick={() => copyCommand(lastResult.command, 'result')}
                        >
                          {copiedId === 'result' ? <Check size={12} /> : <Copy size={12} />}
                          {copiedId === 'result' ? '已复制' : '复制'}
                        </button>
                        {!lastResult.command.startsWith('#') && (
                          <button style={S.saveBtn} onClick={() => setShowSaveModal(true)}>
                            <Star size={12} />
                            保存
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={S.emptyState}>
                    <div style={S.emptyIcon}>
                      <Terminal size={32} />
                    </div>
                    <div>
                      <div style={S.emptyText}>输入自然语言，自动翻译为 Shell 命令</div>
                      <div style={S.emptySubtext}>支持 {COMMAND_PATTERNS.length}+ 命令模式，覆盖文件操作、系统信息、网络、进程管理等</div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'patterns' && (
            <>
              <div style={S.patternSearch}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                  <input
                    style={{ ...S.patternSearchInput, paddingLeft: 36 }}
                    placeholder="搜索命令模式..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div style={S.patternCount}>
                找到 {filteredPatterns.length} 个模式
                {activeCategory !== 'all' && ` · ${activeCatInfo?.name}`}
              </div>
              <div style={{ ...S.resultSection, padding: '12px 16px' }}>
                {filteredPatterns.length === 0 ? (
                  <div style={S.emptyState}>
                    <div style={S.emptyText}>未找到匹配的命令模式</div>
                  </div>
                ) : (
                  filteredPatterns.map((p) => (
                    <div
                      key={p.id}
                      style={hoverStyle(S.patternCard, { borderColor: 'rgba(124, 108, 240, 0.3)', background: 'rgba(20, 20, 35, 0.7)' }, false)}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(124, 108, 240, 0.3)'; e.currentTarget.style.background = 'rgba(20, 20, 35, 0.7)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.background = 'rgba(20, 20, 35, 0.5)' }}
                    >
                      <div style={S.patternHeader}>
                        <span style={S.patternExplanation}>{p.explanation}</span>
                        <ChevronRight size={14} color="#555" />
                      </div>
                      <div style={S.patternExample}>示例: {p.example}</div>
                      <div style={S.patternCommand}>
                        → {typeof p.command === 'string' ? p.command : '(动态生成)'}
                      </div>
                      <div style={S.patternActions}>
                        <button
                          style={hoverStyle(S.copyBtn, S.copyBtn, hoveredCopy === p.id)}
                          onMouseEnter={() => setHoveredCopy(p.id)}
                          onMouseLeave={() => setHoveredCopy(null)}
                          onClick={() => copyCommand(typeof p.command === 'string' ? p.command : p.example, p.id)}
                        >
                          {copiedId === p.id ? <Check size={12} /> : <Copy size={12} />}
                          {copiedId === p.id ? '已复制' : '复制示例'}
                        </button>
                        <button
                          style={{ ...S.copyBtn, background: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}
                          onClick={() => setInput(p.example)}
                        >
                          <Play size={12} />
                          使用
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <div style={{ ...S.resultSection, padding: '16px 20px' }}>
              {history.length === 0 ? (
                <div style={S.emptyState}>
                  <div style={S.emptyIcon}>
                    <HistoryIcon size={32} />
                  </div>
                  <div>
                    <div style={S.emptyText}>暂无命令历史</div>
                    <div style={S.emptySubtext}>翻译过的命令将在此处显示</div>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                    <button
                      style={{ ...S.copyBtn, background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}
                      onClick={clearHistory}
                    >
                      <Trash2 size={12} />
                      清空历史
                    </button>
                  </div>
                  {history.map((h) => (
                    <div
                      key={h.id}
                      style={hoverStyle(S.historyItem, { borderColor: 'rgba(124, 108, 240, 0.2)' }, false)}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(124, 108, 240, 0.2)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)' }}
                    >
                      <div style={S.historyHeader}>
                        <span style={S.historyInput}>{h.input}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            style={hoverStyle(S.iconBtn, S.iconBtn, hoveredIconBtn === h.id + '-copy')}
                            onMouseEnter={() => setHoveredIconBtn(h.id + '-copy')}
                            onMouseLeave={() => setHoveredIconBtn(null)}
                            onClick={() => copyCommand(h.command, h.id)}
                          >
                            {copiedId === h.id ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                          <button
                            style={hoverStyle(S.iconBtn, { background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }, hoveredIconBtn === h.id + '-del')}
                            onMouseEnter={() => setHoveredIconBtn(h.id + '-del')}
                            onMouseLeave={() => setHoveredIconBtn(null)}
                            onClick={() => deleteHistoryItem(h.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div style={S.historyCommand}>→ {h.command}</div>
                      <div style={S.historyFooter}>
                        <span style={S.historyTime}>
                          <Clock size={10} />
                          {formatTime(h.timestamp)}
                        </span>
                        <span style={S.historyCategory}>{h.category}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={S.footer}>
        <div style={S.stats}>
          <div style={S.statItem}>
            <Sparkles size={12} style={{ color: '#7c6cf0' }} />
            <span>{COMMAND_PATTERNS.length} 命令模式</span>
          </div>
          <div style={S.statItem}>
            <HistoryIcon size={12} style={{ color: '#06b6d4' }} />
            <span>{history.length} 条历史</span>
          </div>
          <div style={S.statItem}>
            <Star size={12} style={{ color: '#fbbf24' }} />
            <span>{savedCommands.length} 个保存</span>
          </div>
        </div>
        <div>SmartShell v1.0 · 自然语言 → Shell 命令</div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div style={S.modal} onClick={() => setShowSaveModal(false)}>
          <div style={S.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalTitle}>
              <Star size={16} style={{ color: '#fbbf24', display: 'inline', marginRight: 8 }} />
              保存命令
            </div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
              <div style={{ marginBottom: 4 }}>输入: <span style={{ color: '#ccc' }}>{input}</span></div>
              <div style={{ marginBottom: 4 }}>命令: <span style={{ color: '#7c6cf0', fontFamily: "'JetBrains Mono', monospace" }}>{lastResult?.command}</span></div>
              <div>分类: <span style={{ color: '#c4b5fd' }}>{lastResult?.category}</span></div>
            </div>
            <input
              style={S.modalInput}
              placeholder="为这个命令命名"
              value={newCommandName}
              onChange={(e) => setNewCommandName(e.target.value)}
              autoFocus
            />
            <div style={S.modalActions}>
              <button style={S.cancelBtn} onClick={() => setShowSaveModal(false)}>取消</button>
              <button style={S.confirmBtn} onClick={saveCommand}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}