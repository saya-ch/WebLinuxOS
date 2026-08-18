import { useState, useRef, useEffect, useCallback } from 'react'

// ============================================================
// Types
// ============================================================

type AuthMethod = 'password' | 'key'
type ColorScheme = 'green' | 'amber' | 'white' | 'cyberpunk' | 'solarized'
type PanelView = 'terminal' | 'sftp' | 'portForward' | 'connectionLog'

interface SSHProfile {
  id: string
  name: string
  host: string
  port: number
  username: string
  authMethod: AuthMethod
  password?: string
  privateKey?: string
  lastConnected?: number
}

interface VFSNode {
  type: 'file' | 'directory'
  name: string
  content?: string
  permissions: string
  owner: string
  group: string
  size: number
  modified: string
  children?: Record<string, VFSNode>
}

interface ShellState {
  cwd: string
  env: Record<string, string>
  homeDir: string
  user: string
  hostname: string
  history: string[]
  historyIndex: number
  alias: Record<string, string>
  processes: SimProcess[]
}

interface SimProcess {
  pid: number
  user: string
  cpu: number
  mem: number
  command: string
  startTime: string
}

interface TerminalLine {
  id: number
  content: string
  isCommand?: boolean
  timestamp?: number
}

interface SSHSession {
  id: string
  profileId: string
  profile: SSHProfile
  connected: boolean
  shell: ShellState
  terminalLines: TerminalLine[]
  lineCounter: number
  createdAt: number
}

interface ConnectionLogEntry {
  id: number
  timestamp: number
  type: 'connect' | 'disconnect' | 'command' | 'error' | 'auth'
  message: string
  sessionId?: string
}

interface PortForwardRule {
  id: string
  type: 'local' | 'remote' | 'dynamic'
  sourceHost: string
  sourcePort: number
  destHost: string
  destPort: number
  enabled: boolean
}

interface SFTPEntry {
  name: string
  type: 'file' | 'directory' | 'symlink'
  size: number
  permissions: string
  modified: string
  owner: string
  group: string
}

// ============================================================
// Color Schemes
// ============================================================

const COLOR_SCHEMES: Record<ColorScheme, {
  bg: string; text: string; prompt: string; accent: string; error: string;
  success: string; dim: string; border: string; inputBg: string; selection: string;
  tabBg: string; tabActive: string; tabText: string; cursor: string;
}> = {
  green: {
    bg: '#0a0a0a', text: '#00ff41', prompt: '#00ff41', accent: '#00cc33',
    error: '#ff4444', success: '#00ff41', dim: '#006622', border: '#003311',
    inputBg: '#0d0d0d', selection: '#004411', tabBg: '#111111',
    tabActive: '#1a1a1a', tabText: '#00cc33', cursor: '#00ff41',
  },
  amber: {
    bg: '#0a0a0a', text: '#ffb000', prompt: '#ffb000', accent: '#cc8800',
    error: '#ff4444', success: '#ffb000', dim: '#665500', border: '#332200',
    inputBg: '#0d0d0d', selection: '#443300', tabBg: '#111111',
    tabActive: '#1a1a1a', tabText: '#cc8800', cursor: '#ffb000',
  },
  white: {
    bg: '#0a0a0a', text: '#e0e0e0', prompt: '#569cd6', accent: '#569cd6',
    error: '#f44747', success: '#6a9955', dim: '#666666', border: '#333333',
    inputBg: '#111111', selection: '#264f78', tabBg: '#111111',
    tabActive: '#1e1e1e', tabText: '#cccccc', cursor: '#e0e0e0',
  },
  cyberpunk: {
    bg: '#0d001a', text: '#e0e0ff', prompt: '#ff00ff', accent: '#00ffff',
    error: '#ff3366', success: '#00ffaa', dim: '#6633aa', border: '#330066',
    inputBg: '#120022', selection: '#330066', tabBg: '#0a0015',
    tabActive: '#1a0033', tabText: '#cc99ff', cursor: '#ff00ff',
  },
  solarized: {
    bg: '#002b36', text: '#839496', prompt: '#268bd2', accent: '#2aa198',
    error: '#dc322f', success: '#859900', dim: '#586e75', border: '#073642',
    inputBg: '#073642', selection: '#073642', tabBg: '#073642',
    tabActive: '#0a3646', tabText: '#93a1a1', cursor: '#268bd2',
  },
}

// ============================================================
// ANSI Color Processing
// ============================================================

const ANSI_COLORS_MAP: Record<string, string> = {
  '30': '#1e1e1e', '31': '#f44747', '32': '#6a9955', '33': '#dcdcaa',
  '34': '#569cd6', '35': '#c586c0', '36': '#4ec9b0', '37': '#e0e0e0',
  '90': '#666666', '91': '#ff6666', '92': '#66ff66', '93': '#ffff66',
  '94': '#6666ff', '95': '#ff66ff', '96': '#66ffff', '97': '#ffffff',
}

function processAnsiText(text: string, defaultColor: string): React.ReactNode[] {
  const ESC = '\x1b'
  const regex = new RegExp(`(${ESC}\\[[0-9;]*m)`, 'g')
  const parts = text.split(regex)
  const result: React.ReactNode[] = []
  let currentStyle: React.CSSProperties = { color: defaultColor }

  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith(ESC + '[')) {
      const code = parts[i].replace(ESC + '[', '').replace('m', '')
      if (code === '0' || code === '') {
        currentStyle = { color: defaultColor }
      } else {
        const codes = code.split(';')
        for (const c of codes) {
          if (c === '1') currentStyle = { ...currentStyle, fontWeight: 'bold' }
          else if (c === '4') currentStyle = { ...currentStyle, textDecoration: 'underline' }
          else if (ANSI_COLORS_MAP[c]) currentStyle = { ...currentStyle, color: ANSI_COLORS_MAP[c] }
        }
      }
    } else if (parts[i]) {
      result.push(<span key={i} style={currentStyle}>{parts[i]}</span>)
    }
  }
  return result
}

// ============================================================
// Virtual Filesystem
// ============================================================

function createInitialVFS(): VFSNode {
  const file = (name: string, content: string, perms = '644', owner = 'root', group = 'root', size?: number): VFSNode => ({
    type: 'file', name, content, permissions: perms, owner, group,
    size: size ?? content.length, modified: '2026-08-15 10:30',
  })
  const dir = (name: string, children: Record<string, VFSNode>, perms = '755', owner = 'root', group = 'root'): VFSNode => ({
    type: 'directory', name, children, permissions: perms, owner, group,
    size: 4096, modified: '2026-08-15 10:30',
  })

  return dir('/', {
    home: dir('home', {
      user: dir('user', {
        'Documents': dir('Documents', {
          'readme.txt': file('readme.txt', 'Welcome to WebLinuxOS SSH Terminal!\nThis is a simulated SSH environment.\nYou can practice Linux commands here.', '644', 'user', 'user'),
          'notes.md': file('notes.md', '# My Notes\n\n- Learn Linux commands\n- Practice shell scripting\n- Explore the filesystem', '644', 'user', 'user'),
          'report.txt': file('report.txt', 'System Status Report\n===================\nAll services running normally.\nUptime: 42 days\nLoad: 0.23', '644', 'user', 'user'),
        }),
        'Downloads': dir('Downloads', {
          'package.tar.gz': file('package.tar.gz', '[binary data]', '644', 'user', 'user', 2048576),
          'setup.sh': file('setup.sh', '#!/bin/bash\necho "Installing..."\napt update && apt upgrade -y\necho "Done!"', '755', 'user', 'user'),
        }),
        'Pictures': dir('Pictures', {
          'wallpaper.png': file('wallpaper.png', '[binary image data]', '644', 'user', 'user', 307200),
        }),
        '.bashrc': file('.bashrc', '# ~/.bashrc\nexport PATH=$PATH:/usr/local/bin\nalias ll="ls -la"\nalias la="ls -a"\nalias l="ls -CF"\nexport PS1="\\u@\\h:\\w\\$ "', '644', 'user', 'user'),
        '.bash_history': file('.bash_history', 'ls -la\ncd /etc\n cat hostname\nps aux\ndf -h\n', '600', 'user', 'user'),
        '.ssh': dir('.ssh', {
          'id_rsa': file('id_rsa', '-----BEGIN RSA PRIVATE KEY-----\n[redacted]\n-----END RSA PRIVATE KEY-----', '600', 'user', 'user'),
          'id_rsa.pub': file('id_rsa.pub', 'ssh-rsa AAAAB3... user@weblinux', '644', 'user', 'user'),
          'authorized_keys': file('authorized_keys', 'ssh-rsa AAAAB3... user@weblinux', '600', 'user', 'user'),
          'known_hosts': file('known_hosts', '192.168.1.1 ssh-rsa AAAAB3...\n10.0.0.1 ssh-rsa AAAAB3...', '644', 'user', 'user'),
          'config': file('config', 'Host web-server\n  HostName 192.168.1.1\n  User admin\n  Port 22\n  IdentityFile ~/.ssh/id_rsa', '644', 'user', 'user'),
        }, '700', 'user', 'user'),
        '.config': dir('.config', {}, '755', 'user', 'user'),
        '.local': dir('.local', {
          'share': dir('share', {}, '755', 'user', 'user'),
        }, '755', 'user', 'user'),
        'projects': dir('projects', {
          'webapp': dir('webapp', {
            'index.html': file('index.html', '<!DOCTYPE html>\n<html><head><title>My App</title></head>\n<body><h1>Hello World</h1></body></html>', '644', 'user', 'user'),
            'style.css': file('style.css', 'body { margin: 0; font-family: sans-serif; }\nh1 { color: #333; }', '644', 'user', 'user'),
            'app.js': file('app.js', 'console.log("Hello from WebLinuxOS!");\nconst app = { version: "1.0.0" };', '644', 'user', 'user'),
          }),
        }),
      }, '755', 'user', 'user'),
    }),
    etc: dir('etc', {
      'hostname': file('hostname', 'weblinux-server', '644'),
      'hosts': file('hosts', '127.0.0.1\tlocalhost\n127.0.1.1\tweblinux-server\n::1\t\tlocalhost ip6-localhost', '644'),
      'passwd': file('passwd', 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:User:/home/user:/bin/bash\nnobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin', '644'),
      'shadow': file('shadow', 'root:*:19000:0:99999:7:::\nuser:*:19000:0:99999:7:::', '640'),
      'group': file('group', 'root:x:0:\nuser:x:1000:\nsudo:x:27:user', '644'),
      'fstab': file('fstab', '# /etc/fstab: static file system information.\nUUID=abc123  /  ext4  errors=remount-ro  0  1\n/dev/sda1   /boot  ext2  defaults  0  2', '644'),
      'resolv.conf': file('resolv.conf', 'nameserver 8.8.8.8\nnameserver 8.8.4.4\nsearch localdomain', '644'),
      'os-release': file('os-release', 'NAME="WebLinuxOS"\nVERSION="1.0"\nID=weblinux\nPRETTY_NAME="WebLinuxOS 1.0"\nHOME_URL="https://weblinux.os"', '644'),
      'ssh': dir('ssh', {
        'sshd_config': file('sshd_config', 'Port 22\nPermitRootLogin no\nPubkeyAuthentication yes\nPasswordAuthentication yes\nX11Forwarding no', '644'),
      }, '755'),
      'nginx': dir('nginx', {
        'nginx.conf': file('nginx.conf', 'worker_processes auto;\nevents { worker_connections 1024; }\nhttp { include mime.types; server { listen 80; } }', '644'),
      }, '755'),
      'crontab': file('crontab', '# m h dom mon dow command\n0 2 * * * /usr/bin/backup.sh\n*/5 * * * * /usr/bin/health-check.sh', '644'),
      'network': dir('network', {
        'interfaces': file('interfaces', 'auto lo\niface lo inet loopback\nauto eth0\niface eth0 inet dhcp', '644'),
      }, '755'),
      'systemd': dir('systemd', {}, '755'),
      'apt': dir('apt', {
        'sources.list': file('sources.list', 'deb http://archive.ubuntu.com/ubuntu focal main restricted\ndeb http://archive.ubuntu.com/ubuntu focal-updates main restricted', '644'),
      }, '755'),
    }),
    var: dir('var', {
      log: dir('log', {
        'syslog': file('syslog', 'Aug 15 10:00:01 weblinux systemd[1]: Started Session 1 of user user.\nAug 15 10:00:02 weblinux sshd[1234]: Accepted password for user from 192.168.1.100 port 54321 ssh2\nAug 15 10:05:00 weblinux CRON[5678]: (root) CMD (/usr/bin/health-check.sh)', '644', 'syslog', 'adm', 45056),
        'auth.log': file('auth.log', 'Aug 15 10:00:02 weblinux sshd[1234]: Accepted password for user from 192.168.1.100 port 54321 ssh2\nAug 15 10:00:02 weblinux sshd[1234]: pam_unix(sshd:session): session opened for user user', '640', 'syslog', 'adm'),
        'dmesg': file('dmesg', '[    0.000000] Linux version 5.15.0-weblinux\n[    0.000000] Command line: BOOT_IMAGE=/vmlinuz root=UUID=abc123 ro quiet', '644', 'root', 'adm'),
        'nginx': dir('nginx', {
          'access.log': file('access.log', '192.168.1.100 - - [15/Aug/2026:10:00:01 +0800] "GET / HTTP/1.1" 200 612', '644', 'www-data', 'adm'),
        }, '755', 'www-data', 'adm'),
      }, '755', 'syslog', 'adm'),
      tmp: dir('tmp', {}, '1777'),
      www: dir('www', {
        'html': dir('html', {
          'index.html': file('index.html', '<html><body><h1>Welcome to WebLinuxOS</h1></body></html>', '644', 'www-data', 'www-data'),
        }, '755', 'www-data', 'www-data'),
      }, '755', 'www-data', 'www-data'),
      cache: dir('cache', {
        'apt': dir('apt', {}, '755', 'root', 'root'),
      }, '755'),
      lib: dir('lib', {}, '755'),
    }),
    usr: dir('usr', {
      bin: dir('bin', {}, '755'),
      lib: dir('lib', {}, '755'),
      local: dir('local', {
        bin: dir('bin', {}, '755'),
        lib: dir('lib', {}, '755'),
        share: dir('share', {}, '755'),
      }, '755'),
      share: dir('share', {
        'doc': dir('doc', {}, '755'),
        'man': dir('man', {}, '755'),
      }, '755'),
      include: dir('include', {}, '755'),
      src: dir('src', {}, '755'),
    }),
    bin: dir('bin', {}, '755'),
    sbin: dir('sbin', {}, '755'),
    lib: dir('lib', {}, '755'),
    opt: dir('opt', {}, '755'),
    tmp: dir('tmp', {}, '1777'),
    dev: dir('dev', {}, '755'),
    proc: dir('proc', {
      'cpuinfo': file('cpuinfo', 'processor\t: 0\nvendor_id\t: GenuineIntel\nmodel name\t: Intel(R) Core(TM) i7-10700K\nMHz\t\t: 3800.000\ncache size\t: 16384 KB', '444'),
      'meminfo': file('meminfo', 'MemTotal:       16384000 kB\nMemFree:         8234400 kB\nMemAvailable:   12056000 kB\nBuffers:          524288 kB\nCached:         3072000 kB\nSwapTotal:       4096000 kB\nSwapFree:        4096000 kB', '444'),
      'version': file('version', 'Linux version 5.15.0-weblinux (gcc version 11.2.0) #1 SMP PREEMPT', '444'),
      'uptime': file('uptime', '3628800.00 7257600.00', '444'),
    }, '555'),
    sys: dir('sys', {}, '555'),
    boot: dir('boot', {
      'vmlinuz': file('vmlinuz', '[kernel binary]', '644', 'root', 'root', 8912896),
      'initrd.img': file('initrd.img', '[initrd binary]', '644', 'root', 'root', 52428800),
      'grub': dir('grub', {
        'grub.cfg': file('grub.cfg', 'set default=0\nmenuentry "WebLinuxOS" { linux /vmlinuz root=UUID=abc123 ro }', '644'),
      }, '755'),
    }, '755'),
    mnt: dir('mnt', {}, '755'),
    media: dir('media', {}, '755'),
    run: dir('run', {}, '755'),
    srv: dir('srv', {}, '755'),
    root: dir('root', {
      '.bashrc': file('.bashrc', '# ~/.bashrc\nexport PS1="\\[\\e[1;31m\\]\\u@\\h\\[\\e[0m\\]:\\[\\e[1;34m\\]\\w\\[\\e[0m\\]\\$ "', '644'),
    }, '700'),
  })
}

// ============================================================
// VFS Operations
// ============================================================

function resolvePath(cwd: string, path: string): string {
  if (path.startsWith('/')) return normalizePath(path)
  if (path === '~') return '/home/user'
  if (path.startsWith('~/')) return normalizePath('/home/user/' + path.slice(2))
  const parts = cwd.split('/').filter(Boolean)
  for (const seg of path.split('/')) {
    if (seg === '' || seg === '.') continue
    if (seg === '..') { parts.pop(); continue }
    parts.push(seg)
  }
  return '/' + parts.join('/')
}

function normalizePath(p: string): string {
  const parts = p.split('/').filter(Boolean)
  const result: string[] = []
  for (const seg of parts) {
    if (seg === '.') continue
    if (seg === '..') { result.pop(); continue }
    result.push(seg)
  }
  return '/' + result.join('/')
}

function getNode(fs: VFSNode, path: string): VFSNode | null {
  if (path === '/') return fs
  const parts = path.split('/').filter(Boolean)
  let current = fs
  for (const part of parts) {
    if (current.type !== 'directory' || !current.children || !current.children[part]) return null
    current = current.children[part]
  }
  return current
}

function getParentAndName(fs: VFSNode, path: string): { parent: VFSNode; name: string } | null {
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 0) return null
  const name = parts.pop()!
  const parentPath = '/' + parts.join('/')
  const parent = getNode(fs, parentPath || '/')
  if (!parent || parent.type !== 'directory') return null
  return { parent, name }
}

function deepCloneVFS(node: VFSNode): VFSNode {
  const clone: VFSNode = { ...node }
  if (node.children) {
    clone.children = {}
    for (const [k, v] of Object.entries(node.children)) {
      clone.children[k] = deepCloneVFS(v)
    }
  }
  return clone
}

// ============================================================
// Simulated Shell Commands
// ============================================================

function createShellState(user: string, hostname: string): ShellState {
  return {
    cwd: user === 'root' ? '/root' : '/home/user',
    env: {
      HOME: user === 'root' ? '/root' : '/home/user',
      USER: user,
      SHELL: '/bin/bash',
      PATH: '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
      LANG: 'en_US.UTF-8',
      TERM: 'xterm-256color',
      HOSTNAME: hostname,
      EDITOR: 'nano',
      PAGER: 'less',
    },
    homeDir: user === 'root' ? '/root' : '/home/user',
    user,
    hostname,
    history: [],
    historyIndex: -1,
    alias: { ll: 'ls -la', la: 'ls -a', l: 'ls -CF', '..': 'cd ..', cls: 'clear' },
    processes: [
      { pid: 1, user: 'root', cpu: 0.1, mem: 0.3, command: '/sbin/init', startTime: '10:00' },
      { pid: 2, user: 'root', cpu: 0.0, mem: 0.0, command: '[kthreadd]', startTime: '10:00' },
      { pid: 256, user: 'root', cpu: 0.2, mem: 1.2, command: '/usr/sbin/sshd -D', startTime: '10:00' },
      { pid: 300, user: 'root', cpu: 0.5, mem: 2.1, command: '/usr/sbin/nginx', startTime: '10:01' },
      { pid: 312, user: user, cpu: 0.0, mem: 0.5, command: '-bash', startTime: '10:02' },
      { pid: 400, user: 'root', cpu: 0.1, mem: 0.8, command: '/usr/sbin/cron', startTime: '10:00' },
      { pid: 500, user: 'www-data', cpu: 0.3, mem: 1.5, command: 'nginx: worker process', startTime: '10:01' },
    ],
  }
}

function formatPermissions(node: VFSNode): string {
  const type = node.type === 'directory' ? 'd' : (node.name.endsWith('.sh') || node.permissions.includes('5') ? '-' : '-')
  const perms = node.permissions
  const toStr = (n: number): string => {
    const r = n & 4 ? 'r' : '-'
    const w = n & 2 ? 'w' : '-'
    const x = n & 1 ? 'x' : '-'
    return r + w + x
  }
  return type + toStr(parseInt(perms[0])) + toStr(parseInt(perms[1])) + toStr(parseInt(perms[2]))
}

function formatSize(size: number): string {
  if (size < 1024) return size.toString()
  if (size < 1048576) return (size / 1024).toFixed(1) + 'K'
  if (size < 1073741824) return (size / 1048576).toFixed(1) + 'M'
  return (size / 1073741824).toFixed(1) + 'G'
}

function executeCommand(
  rawInput: string,
  shell: ShellState,
  fs: VFSNode,
  setFs: (fs: VFSNode) => void,
  addOutput: (text: string) => void,
): void {
  // Expand aliases
  let input = rawInput.trim()
  const firstWord = input.split(/\s+/)[0]
  if (shell.alias[firstWord]) {
    input = shell.alias[firstWord] + input.slice(firstWord.length)
  }

  // Expand environment variables
  input = input.replace(/\$(\w+)/g, (_, name) => shell.env[name] || '')

  // Handle pipes simply (just chain basic commands)
  const pipeParts = input.split('|').map(p => p.trim())
  let pipedInput = ''

  for (let pipeIdx = 0; pipeIdx < pipeParts.length; pipeIdx++) {
    const cmdLine = pipeParts[pipeIdx]
    const tokens = cmdLine.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || []
    const cmd = tokens[0]
    const args = tokens.slice(1).map(a => a.replace(/^["']|["']$/g, ''))

    if (!cmd) continue

    if (pipeIdx > 0 && pipedInput) {
      // Simulate piping by passing previous output
      if (cmd === 'grep') {
        args.push('--pipe-input', pipedInput)
      } else if (cmd === 'head') {
        args.push('--pipe-input', pipedInput)
      } else if (cmd === 'tail') {
        args.push('--pipe-input', pipedInput)
      } else if (cmd === 'wc') {
        args.push('--pipe-input', pipedInput)
      } else if (cmd === 'sort') {
        args.push('--pipe-input', pipedInput)
      } else if (cmd === 'awk') {
        args.push('--pipe-input', pipedInput)
      } else if (cmd === 'sed') {
        args.push('--pipe-input', pipedInput)
      } else if (cmd === 'cut') {
        args.push('--pipe-input', pipedInput)
      } else if (cmd === 'tr') {
        args.push('--pipe-input', pipedInput)
      }
    }

    const output = runSingleCommand(cmd, args, shell, fs, setFs)
    if (pipeIdx < pipeParts.length - 1) {
      pipedInput = output
    } else {
      if (output) addOutput(output)
    }
  }
}

function runSingleCommand(
  cmd: string,
  args: string[],
  shell: ShellState,
  fs: VFSNode,
  setFs: (fs: VFSNode) => void,
): string {
  const ESC = '\x1b'
  const bold = (s: string) => `${ESC}[1m${s}${ESC}[0m`
  const blue = (s: string) => `${ESC}[1;34m${s}${ESC}[0m`
  const green = (s: string) => `${ESC}[1;32m${s}${ESC}[0m`
  const cyan = (s: string) => `${ESC}[1;36m${s}${ESC}[0m`
  const dim = (s: string) => `${ESC}[2m${s}${ESC}[0m`

  const getPipeInput = (): string | null => {
    const idx = args.indexOf('--pipe-input')
    if (idx >= 0 && idx + 1 < args.length) {
      args.splice(idx, 2)
      return args.splice(idx - 1, 1)[0]
    }
    return null
  }

  switch (cmd) {
    case 'ls': {
      const showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al')
      const longFormat = args.includes('-l') || args.includes('-la') || args.includes('-al')
      const targetArg = args.find(a => !a.startsWith('-') && a !== '--pipe-input' && a !== getPipeInput())
      const targetPath = targetArg ? resolvePath(shell.cwd, targetArg) : shell.cwd
      const node = getNode(fs, targetPath)
      if (!node) return `ls: cannot access '${targetArg || targetPath}': No such file or directory`
      if (node.type === 'file') {
        if (longFormat) return `${formatPermissions(node)} 1 ${node.owner} ${node.group} ${String(node.size).padStart(8)} ${node.modified} ${node.name}`
        return node.name
      }
      const entries = Object.values(node.children || {})
        .filter(e => showHidden || !e.name.startsWith('.'))
        .sort((a, b) => a.name.localeCompare(b.name))
      if (entries.length === 0) return ''
      if (!longFormat) {
        return entries.map(e => e.type === 'directory' ? blue(e.name + '/') : (e.permissions.includes('1') || e.permissions.includes('3') || e.permissions.includes('5') || e.permissions.includes('7') ? green(e.name + '*') : e.name)).join('  ')
      }
      const lines = [`total ${entries.length * 4}`]
      if (showHidden) {
        lines.push(`${formatPermissions(node)} ${String(Object.keys(node.children || {}).length + 2).padStart(2)} ${node.owner} ${node.group} ${String(node.size).padStart(8)} ${node.modified} .`)
        lines.push(`${formatPermissions(node)} ${String(Object.keys(node.children || {}).length + 2).padStart(2)} ${node.owner} ${node.group} ${String(node.size).padStart(8)} ${node.modified} ..`)
      }
      for (const e of entries) {
        const perm = formatPermissions(e)
        const linkCount = e.type === 'directory' ? String(Object.keys(e.children || {}).length + 2) : '1'
        lines.push(`${perm} ${linkCount.padStart(2)} ${e.owner.padEnd(6)} ${e.group.padEnd(6)} ${String(e.size).padStart(8)} ${e.modified} ${e.type === 'directory' ? blue(e.name) : e.name}`)
      }
      return lines.join('\n')
    }

    case 'cd': {
      const target = args[0] || '~'
      const newPath = resolvePath(shell.cwd, target)
      const node = getNode(fs, newPath)
      if (!node) return `bash: cd: ${target}: No such file or directory`
      if (node.type !== 'directory') return `bash: cd: ${target}: Not a directory`
      shell.cwd = newPath
      return ''
    }

    case 'pwd':
      return shell.cwd

    case 'cat': {
      if (args.length === 0) return getPipeInput() || ''
      const results: string[] = []
      for (const arg of args) {
        if (arg.startsWith('-') || arg === '--pipe-input') continue
        const path = resolvePath(shell.cwd, arg)
        const node = getNode(fs, path)
        if (!node) { results.push(`cat: ${arg}: No such file or directory`); continue }
        if (node.type === 'directory') { results.push(`cat: ${arg}: Is a directory`); continue }
        results.push(node.content || '')
      }
      return results.join('\n')
    }

    case 'head': {
      const pipeIn = getPipeInput()
      const nArg = args.indexOf('-n')
      let count = 10
      if (nArg >= 0 && args[nArg + 1]) count = parseInt(args[nArg + 1]) || 10
      let content = pipeIn || ''
      if (!content && args.length > 0) {
        const fArg = args.find(a => !a.startsWith('-'))
        if (fArg) {
          const path = resolvePath(shell.cwd, fArg)
          const node = getNode(fs, path)
          if (node && node.type === 'file') content = node.content || ''
          else return `head: cannot open '${fArg}' for reading: No such file or directory`
        }
      }
      return content.split('\n').slice(0, count).join('\n')
    }

    case 'tail': {
      const pipeIn = getPipeInput()
      const nArg = args.indexOf('-n')
      let count = 10
      if (nArg >= 0 && args[nArg + 1]) count = parseInt(args[nArg + 1]) || 10
      let content = pipeIn || ''
      if (!content && args.length > 0) {
        const fArg = args.find(a => !a.startsWith('-'))
        if (fArg) {
          const path = resolvePath(shell.cwd, fArg)
          const node = getNode(fs, path)
          if (node && node.type === 'file') content = node.content || ''
          else return `tail: cannot open '${fArg}' for reading: No such file or directory`
        }
      }
      const lines = content.split('\n')
      return lines.slice(-count).join('\n')
    }

    case 'wc': {
      const pipeIn = getPipeInput()
      let content = pipeIn || ''
      if (!content && args.length > 0) {
        const fArg = args.find(a => !a.startsWith('-'))
        if (fArg) {
          const path = resolvePath(shell.cwd, fArg)
          const node = getNode(fs, path)
          if (node && node.type === 'file') content = node.content || ''
          else return `wc: ${fArg}: No such file or directory`
        }
      }
      const lines = content.split('\n').length
      const words = content.split(/\s+/).filter(Boolean).length
      const chars = content.length
      return `  ${lines}  ${words} ${chars}`
    }

    case 'mkdir': {
      const parents = args.includes('-p')
      for (const arg of args) {
        if (arg.startsWith('-')) continue
        const path = resolvePath(shell.cwd, arg)
        if (getNode(fs, path)) return `mkdir: cannot create directory '${arg}': File exists`
        const parts = path.split('/').filter(Boolean)
        let current = fs
        for (let i = 0; i < parts.length; i++) {
          if (!current.children) current.children = {}
          if (current.children[parts[i]]) {
            current = current.children[parts[i]]
            if (current.type !== 'directory' && !parents) return `mkdir: cannot create directory '${arg}': Not a directory`
          } else {
            const newDir: VFSNode = {
              type: 'directory', name: parts[i], children: {},
              permissions: '755', owner: shell.user, group: shell.user,
              size: 4096, modified: new Date().toISOString().slice(0, 16).replace('T', ' '),
            }
            current.children[parts[i]] = newDir
            current = newDir
          }
        }
        setFs(deepCloneVFS(fs))
      }
      return ''
    }

    case 'rmdir': {
      for (const arg of args) {
        if (arg.startsWith('-')) continue
        const path = resolvePath(shell.cwd, arg)
        const info = getParentAndName(fs, path)
        const node = getNode(fs, path)
        if (!node) return `rmdir: failed to remove '${arg}': No such file or directory`
        if (node.type !== 'directory') return `rmdir: failed to remove '${arg}': Not a directory`
        if (Object.keys(node.children || {}).length > 0) return `rmdir: failed to remove '${arg}': Directory not empty`
        if (info) { delete info.parent.children![info.name]; setFs(deepCloneVFS(fs)) }
      }
      return ''
    }

    case 'rm': {
      const recursive = args.includes('-r') || args.includes('-rf') || args.includes('-fr')
      const force = args.includes('-f') || args.includes('-rf') || args.includes('-fr')
      for (const arg of args) {
        if (arg.startsWith('-')) continue
        const path = resolvePath(shell.cwd, arg)
        const info = getParentAndName(fs, path)
        const node = getNode(fs, path)
        if (!node) { if (!force) return `rm: cannot remove '${arg}': No such file or directory`; continue }
        if (node.type === 'directory' && !recursive) return `rm: cannot remove '${arg}': Is a directory`
        if (info) { delete info.parent.children![info.name]; setFs(deepCloneVFS(fs)) }
      }
      return ''
    }

    case 'cp': {
      const srcArg = args.find(a => !a.startsWith('-'))
      const destArg = args.find((a, i) => i > 0 && !a.startsWith('-'))
      if (!srcArg || !destArg) return 'cp: missing operand'
      const srcPath = resolvePath(shell.cwd, srcArg)
      const srcNode = getNode(fs, srcPath)
      if (!srcNode) return `cp: cannot stat '${srcArg}': No such file or directory`
      const destPath = resolvePath(shell.cwd, destArg)
      let destNode = getNode(fs, destPath)
      let finalDestPath = destPath
      if (destNode && destNode.type === 'directory') {
        finalDestPath = destPath + '/' + srcNode.name
        destNode = getNode(fs, finalDestPath)
      }
      const destInfo = getParentAndName(fs, finalDestPath)
      if (destInfo) {
        const clone: VFSNode = { ...deepCloneVFS(srcNode), name: srcNode.name }
        clone.modified = new Date().toISOString().slice(0, 16).replace('T', ' ')
        destInfo.parent.children![destInfo.name] = clone
        setFs(deepCloneVFS(fs))
      }
      return ''
    }

    case 'mv': {
      const srcArg = args[0]
      const destArg = args[1]
      if (!srcArg || !destArg) return 'mv: missing operand'
      const srcPath = resolvePath(shell.cwd, srcArg)
      const srcInfo = getParentAndName(fs, srcPath)
      const srcNode = getNode(fs, srcPath)
      if (!srcNode || !srcInfo) return `mv: cannot stat '${srcArg}': No such file or directory`
      const destPath = resolvePath(shell.cwd, destArg)
      let destNode = getNode(fs, destPath)
      let finalName: string
      let destParent: VFSNode
      if (destNode && destNode.type === 'directory') {
        destParent = destNode
        finalName = srcNode.name
      } else {
        const destInfo = getParentAndName(fs, destPath)
        if (!destInfo) return `mv: cannot move '${srcArg}' to '${destArg}'`
        destParent = destInfo.parent
        finalName = destInfo.name
      }
      if (!destParent.children) destParent.children = {}
      const moved = deepCloneVFS(srcNode)
      moved.name = finalName
      moved.modified = new Date().toISOString().slice(0, 16).replace('T', ' ')
      destParent.children[finalName] = moved
      delete srcInfo.parent.children![srcInfo.name]
      setFs(deepCloneVFS(fs))
      return ''
    }

    case 'touch': {
      for (const arg of args) {
        if (arg.startsWith('-')) continue
        const path = resolvePath(shell.cwd, arg)
        const existing = getNode(fs, path)
        if (existing) {
          existing.modified = new Date().toISOString().slice(0, 16).replace('T', ' ')
        } else {
          const info = getParentAndName(fs, path)
          if (info) {
            info.parent.children![info.name] = {
              type: 'file', name: info.name, content: '',
              permissions: '644', owner: shell.user, group: shell.user,
              size: 0, modified: new Date().toISOString().slice(0, 16).replace('T', ' '),
            }
            setFs(deepCloneVFS(fs))
          }
        }
      }
      return ''
    }

    case 'echo': {
      const noNewline = args.includes('-n')
      let text = args.filter(a => !a.startsWith('-')).join(' ')
      // Handle $() subshells minimally
      text = text.replace(/\$\(whoami\)/g, shell.user)
      text = text.replace(/\$\(hostname\)/g, shell.hostname)
      text = text.replace(/\$\(pwd\)/g, shell.cwd)
      text = text.replace(/\$\(date\)/g, new Date().toString())
      text = text.replace(/\$\(uname -r\)/g, '5.15.0-weblinux')
      // Handle redirect
      const redirectIdx = text.indexOf('>')
      if (redirectIdx >= 0) {
        const append = text[redirectIdx + 1] === '>'
        const content = text.slice(0, redirectIdx).trim()
        const filePath = (append ? text.slice(redirectIdx + 2) : text.slice(redirectIdx + 1)).trim()
        if (filePath) {
          const path = resolvePath(shell.cwd, filePath)
          const info = getParentAndName(fs, path)
          if (info) {
            const existing = info.parent.children![info.name]
            if (existing && existing.type === 'file' && append) {
              existing.content = (existing.content || '') + content + '\n'
              existing.size = existing.content.length
            } else {
              info.parent.children![info.name] = {
                type: 'file', name: info.name, content: content + '\n',
                permissions: '644', owner: shell.user, group: shell.user,
                size: content.length + 1, modified: new Date().toISOString().slice(0, 16).replace('T', ' '),
              }
            }
            setFs(deepCloneVFS(fs))
          }
        }
        return ''
      }
      return noNewline ? text : text
    }

    case 'grep': {
      const pipeIn = getPipeInput()
      const ignoreCase = args.includes('-i')
      const lineNum = args.includes('-n')
      const pattern = args.find(a => !a.startsWith('-') && a !== '--pipe-input')
      if (!pattern) return 'Usage: grep [options] PATTERN [FILE...]'
      const flags = ignoreCase ? 'i' : ''
      let regex: RegExp
      try { regex = new RegExp(pattern, flags) } catch { return `grep: invalid regex '${pattern}'` }
      let content = pipeIn || ''
      if (!content) {
        const fileArgs = args.filter(a => !a.startsWith('-') && a !== pattern)
        for (const f of fileArgs) {
          const path = resolvePath(shell.cwd, f)
          const node = getNode(fs, path)
          if (node && node.type === 'file') content += (node.content || '') + '\n'
          else return `grep: ${f}: No such file or directory`
        }
      }
      const lines = content.split('\n')
      const matches = lines.filter(Boolean).map((line, idx) => {
        if (regex.test(line)) {
          const match = line.replace(regex, (m) => `${ESC}[1;31m${m}${ESC}[0m`)
          return lineNum ? `${cyan(String(idx + 1))}:${match}` : match
        }
        return null
      }).filter(Boolean) as string[]
      return matches.join('\n') || ''
    }

    case 'find': {
      const startPath = args[0] && !args[0].startsWith('-') ? resolvePath(shell.cwd, args[0]) : shell.cwd
      const nameIdx = args.indexOf('-name')
      const typeIdx = args.indexOf('-type')
      const namePattern = nameIdx >= 0 ? args[nameIdx + 1] : null
      const typeFilter = typeIdx >= 0 ? args[typeIdx + 1] : null
      const results: string[] = []

      function walk(node: VFSNode, path: string) {
        let include = true
        if (namePattern) {
          const regex = new RegExp('^' + namePattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$')
          include = regex.test(node.name)
        }
        if (typeFilter) include = include && ((typeFilter === 'f' && node.type === 'file') || (typeFilter === 'd' && node.type === 'directory'))
        if (include) results.push(path)
        if (node.type === 'directory' && node.children) {
          for (const [name, child] of Object.entries(node.children)) {
            walk(child, path === '/' ? '/' + name : path + '/' + name)
          }
        }
      }

      const startNode = getNode(fs, startPath)
      if (!startNode) return `find: '${startPath}': No such file or directory`
      walk(startNode, startPath === '/' ? '/' : startPath)
      return results.join('\n')
    }

    case 'chmod': {
      const mode = args[0]
      const target = args[1]
      if (!mode || !target) return 'Usage: chmod MODE FILE...'
      const path = resolvePath(shell.cwd, target)
      const node = getNode(fs, path)
      if (!node) return `chmod: cannot access '${target}': No such file or directory`
      node.permissions = mode
      setFs(deepCloneVFS(fs))
      return ''
    }

    case 'chown': {
      const ownerArg = args[0]
      const target = args[1]
      if (!ownerArg || !target) return 'Usage: chown OWNER[:GROUP] FILE...'
      const [owner, group] = ownerArg.split(':')
      const path = resolvePath(shell.cwd, target)
      const node = getNode(fs, path)
      if (!node) return `chown: cannot access '${target}': No such file or directory`
      node.owner = owner
      if (group) node.group = group
      setFs(deepCloneVFS(fs))
      return ''
    }

    case 'ps': {
      const aux = args.includes('aux') || args.includes('-aux') || args.includes('ef') || args.includes('-ef')
      if (aux) {
        const header = `${'USER'.padEnd(8)} ${'PID'.padStart(6)} ${'%CPU'.padStart(5)} ${'%MEM'.padStart(5)} ${'COMMAND'.padStart(2)}`
        const lines = shell.processes.map(p =>
          `${p.user.padEnd(8)} ${String(p.pid).padStart(6)} ${p.cpu.toFixed(1).padStart(5)} ${p.mem.toFixed(1).padStart(5)} ${p.command}`
        )
        return header + '\n' + lines.join('\n')
      }
      const header = `  ${'PID'.padStart(5)} TTY      TIME CMD`
      const lines = shell.processes.map(p => `  ${String(p.pid).padStart(5)} pts/0  00:00:0${Math.floor(Math.random() * 9)} ${p.command.split('/').pop()}`)
      return header + '\n' + lines.join('\n')
    }

    case 'top': {
      const now = new Date()
      const uptime = Math.floor((now.getTime() - new Date('2026-07-04').getTime()) / 1000)
      const days = Math.floor(uptime / 86400)
      const hours = Math.floor((uptime % 86400) / 3600)
      const mins = Math.floor((uptime % 3600) / 60)
      const lines = [
        `top - ${now.toTimeString().slice(0, 8)} up ${days} days, ${hours}:${String(mins).padStart(2, '0')},  1 user,  load average: 0.23, 0.18, 0.15`,
        `Tasks: ${shell.processes.length} total,   1 running,  ${shell.processes.length - 1} sleeping,   0 stopped,   0 zombie`,
        `%Cpu(s):  3.2 us,  1.1 sy,  0.0 ni, 95.4 id,  0.2 wa,  0.0 hi,  0.1 si,  0.0 st`,
        `MiB Mem :  16000.0 total,   8234.4 free,   3072.0 used,   4693.6 buff/cache`,
        `MiB Swap:   4096.0 total,   4096.0 free,      0.0 used.  12056.0 avail Mem`,
        '',
        `${'PID'.padStart(7)} ${'USER'.padEnd(8)} ${'PR'.padStart(3)} ${'NI'.padStart(3)}    ${'VIRT'.padEnd(5)} ${'RES'.padEnd(5)} ${'SHR'.padEnd(5)} S ${'%CPU'.padStart(4)} ${'%MEM'.padStart(4)}    ${'COMMAND'.padEnd(5)}`,
        ...shell.processes.map(p =>
          `${String(p.pid).padStart(7)} ${p.user.padEnd(8)}  20   0    ${String(Math.floor(Math.random() * 500 + 50) * 4).padEnd(5)} ${String(Math.floor(p.mem * 10 + 1) * 4).padEnd(5)} ${String(Math.floor(Math.random() * 20 + 1) * 4).padEnd(5)} S ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)}    ${p.command}`
        ),
      ]
      return lines.join('\n')
    }

    case 'df': {
      const human = args.includes('-h')
      if (human) {
        return `Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   18G   30G  38% /\ntmpfs           7.8G     0  7.8G   0% /dev/shm\n/dev/sda2       100G   42G   54G  44% /home\n/dev/sda3        20G  1.2G   18G   7% /var`
      }
      return `Filesystem     1K-blocks    Used Available Use% Mounted on\n/dev/sda1       52428800 18874368 33554432  38% /\ntmpfs            8173568        0   8173568   0% /dev/shm\n/dev/sda2      104857600 44040192 56623104  44% /home\n/dev/sda3       20971520  1258296 19713224   7% /var`
    }

    case 'du': {
      const human = args.includes('-h')
      const summary = args.includes('-s')
      const target = args.find(a => !a.startsWith('-')) || '.'
      const path = resolvePath(shell.cwd, target)
      const node = getNode(fs, path)
      if (!node) return `du: cannot access '${target}': No such file or directory`

      function calcSize(n: VFSNode): number {
        if (n.type === 'file') return n.size
        return Object.values(n.children || {}).reduce((s, c) => s + calcSize(c), 4096)
      }

      if (summary) {
        const size = calcSize(node)
        return human ? `${formatSize(size)}\t${target}` : `${size}\t${target}`
      }

      const results: string[] = []
      function walk(n: VFSNode, p: string) {
        if (n.type === 'directory' && n.children) {
          for (const [name, child] of Object.entries(n.children)) {
            walk(child, p + '/' + name)
          }
        }
        const size = calcSize(n)
        results.push((human ? formatSize(size) : String(size)) + '\t' + p)
      }
      walk(node, target === '.' ? shell.cwd : target)
      return results.join('\n')
    }

    case 'whoami':
      return shell.user

    case 'id': {
      const uid = shell.user === 'root' ? 0 : 1000
      const gid = shell.user === 'root' ? 0 : 1000
      return `uid=${uid}(${shell.user}) gid=${gid}(${shell.user}) groups=${gid}(${shell.user})${uid === 0 ? ',27(sudo)' : ''}`
    }

    case 'hostname':
      if (args[0] === '-I' || args[0] === '-i') return '192.168.1.100 10.0.0.1'
      return shell.hostname

    case 'uname': {
      if (args.includes('-a')) return 'Linux weblinux-server 5.15.0-weblinux #1 SMP PREEMPT x86_64 GNU/Linux'
      let result = 'Linux'
      if (args.includes('-s')) result = 'Linux'
      if (args.includes('-n')) result = shell.hostname
      if (args.includes('-r')) result = '5.15.0-weblinux'
      if (args.includes('-m')) result = 'x86_64'
      if (args.includes('-o')) result = 'GNU/Linux'
      if (args.includes('-v')) result = '#1 SMP PREEMPT'
      if (args.length === 0) result = 'Linux'
      return result
    }

    case 'ifconfig':
    case 'ip': {
      if (cmd === 'ip' && args[0] === 'addr') {
        return `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500\n    inet 192.168.1.100/24 brd 192.168.1.255 scope global eth0\n3: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500\n    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0`
      }
      return `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255\n        inet6 fe80::a00:27ff:fe4e:66a9  prefixlen 64  scopeid 0x20<link>\n        ether 08:00:27:4e:66:a9  txqueuelen 1000  (Ethernet)\n        RX packets 1048576  bytes 536870912 (512.0 MB)\n        TX packets 524288  bytes 268435456 (256.0 MB)\n\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0\n        inet6 ::1  prefixlen 128  scopeid 0x10<host>\n        RX packets 65536  bytes 33554432 (32.0 MB)\n        TX packets 65536  bytes 33554432 (32.0 MB)`
    }

    case 'ping': {
      const target = args.find(a => !a.startsWith('-')) || ''
      if (!target) return 'ping: usage: ping [-c count] destination'
      const countArg = args.indexOf('-c')
      const count = countArg >= 0 ? parseInt(args[countArg + 1]) || 4 : 4
      const lines = [`PING ${target} (${target.includes('.') ? target : '93.184.216.34'}) 56(84) bytes of data.`]
      for (let i = 1; i <= count; i++) {
        const time = (Math.random() * 50 + 5).toFixed(1)
        lines.push(`64 bytes from ${target}: icmp_seq=${i} ttl=64 time=${time} ms`)
      }
      const avg = (Math.random() * 30 + 10).toFixed(1)
      lines.push(`\n--- ${target} ping statistics ---`)
      lines.push(`${count} packets transmitted, ${count} received, 0% packet loss`)
      lines.push(`rtt min/avg/max/mdev = ${(parseFloat(avg) - 2).toFixed(3)}/${avg}/${(parseFloat(avg) + 5).toFixed(3)}/${(Math.random() * 3).toFixed(3)} ms`)
      return lines.join('\n')
    }

    case 'traceroute': {
      const target = args[0] || ''
      if (!target) return 'Usage: traceroute host'
      const lines = [`traceroute to ${target} (${target.includes('.') ? target : '93.184.216.34'}), 30 hops max, 60 byte packets`]
      const hopCount = Math.floor(Math.random() * 8) + 5
      for (let i = 1; i <= hopCount; i++) {
        const ip = i === hopCount ? target : `10.0.${Math.floor(i / 10)}.${i * 3}`
        const t1 = (Math.random() * 20 + i * 2).toFixed(3)
        const t2 = (Math.random() * 20 + i * 2).toFixed(3)
        const t3 = (Math.random() * 20 + i * 2).toFixed(3)
        lines.push(` ${String(i).padStart(2)}  ${ip.padEnd(16)} ${t1} ms  ${t2} ms  ${t3} ms`)
      }
      return lines.join('\n')
    }

    case 'curl': {
      const url = args.find(a => !a.startsWith('-')) || ''
      if (!url) return 'curl: try \'curl --help\' for more information'
      if (args.includes('-I') || args.includes('--head')) {
        return `HTTP/1.1 200 OK\nServer: nginx/1.21.0\nDate: ${new Date().toUTCString()}\nContent-Type: text/html; charset=UTF-8\nContent-Length: 612\nConnection: keep-alive\nX-Powered-By: WebLinuxOS`
      }
      return `<!DOCTYPE html>\n<html><head><title>${url}</title></head>\n<body><h1>Simulated Response from ${url}</h1><p>This is a simulated curl response from the WebLinuxOS SSH Terminal.</p></body></html>`
    }

    case 'wget': {
      const url = args.find(a => !a.startsWith('-')) || ''
      if (!url) return 'wget: missing URL'
      return `--${new Date().toISOString().slice(0, 19)}--  ${url}\nResolving ${url}... 93.184.216.34\nConnecting to ${url}... connected.\nHTTP request sent, awaiting response... 200 OK\nLength: 612 [text/html]\nSaving to: 'index.html'\n\nindex.html          100%[===================>]     612  --.-KB/s    in 0s\n\n${new Date().toISOString().slice(0, 19)} - 'index.html' saved [612/612]`
    }

    case 'ssh': {
      const target = args.find(a => !a.startsWith('-')) || ''
      return `ssh: connect to host ${target || 'unknown'} port 22: Connection timed out\n(Note: Nested SSH connections are not supported in this simulated environment)`
    }

    case 'scp': {
      return 'scp: Simulated SCP is not available. Use the SFTP panel for file transfers.'
    }

    case 'env':
      return Object.entries(shell.env).map(([k, v]) => `${k}=${v}`).join('\n')

    case 'export': {
      for (const arg of args) {
        const eq = arg.indexOf('=')
        if (eq > 0) {
          const key = arg.slice(0, eq)
          const val = arg.slice(eq + 1)
          shell.env[key] = val
        }
      }
      return ''
    }

    case 'set':
      if (args.length === 0) return Object.entries(shell.env).map(([k, v]) => `${k}=${v}`).join('\n')
      return ''

    case 'unset': {
      for (const arg of args) delete shell.env[arg]
      return ''
    }

    case 'alias': {
      if (args.length === 0) return Object.entries(shell.alias).map(([k, v]) => `alias ${k}='${v}'`).join('\n')
      for (const arg of args) {
        const eq = arg.indexOf('=')
        if (eq > 0) shell.alias[arg.slice(0, eq)] = arg.slice(eq + 1).replace(/^['"]|['"]$/g, '')
      }
      return ''
    }

    case 'unalias': {
      for (const arg of args) delete shell.alias[arg]
      return ''
    }

    case 'history':
      return shell.history.map((h, i) => `  ${String(i + 1).padStart(4)}  ${h}`).join('\n')

    case 'which': {
      const commands = ['ls', 'cd', 'pwd', 'cat', 'mkdir', 'rm', 'cp', 'mv', 'echo', 'grep', 'find', 'chmod', 'chown', 'ps', 'top', 'df', 'du', 'whoami', 'hostname', 'uname', 'ifconfig', 'ping', 'curl', 'wget', 'nano', 'vim', 'ssh', 'scp', 'bash', 'sh', 'python3', 'node', 'git', 'make', 'gcc']
      return args.map(a => commands.includes(a) ? `/usr/bin/${a}` : `${a} not found`).join('\n')
    }

    case 'type': {
      return args.map(a => {
        if (shell.alias[a]) return `${a} is aliased to \`${shell.alias[a]}'`
        return `${a} is /usr/bin/${a}`
      }).join('\n')
    }

    case 'date':
      return new Date().toString()

    case 'uptime': {
      const now = new Date()
      const uptimeSec = Math.floor((now.getTime() - new Date('2026-07-04').getTime()) / 1000)
      const days = Math.floor(uptimeSec / 86400)
      const hours = Math.floor((uptimeSec % 86400) / 3600)
      const mins = Math.floor((uptimeSec % 3600) / 60)
      return ` ${now.toTimeString().slice(0, 8)} up ${days} days, ${hours}:${String(mins).padStart(2, '0')},  1 user,  load average: 0.23, 0.18, 0.15`
    }

    case 'free': {
      const human = args.includes('-h')
      if (human) return `              total        used        free      shared  buff/cache   available\nMem:           16Gi       3.0Gi       8.0Gi       256Mi       4.6Gi        12Gi\nSwap:         4.0Gi          0B       4.0Gi`
      return `              total        used        free      shared  buff/cache   available\nMem:        16384000     3072000     8234400      262144     4693184    12582912\nSwap:        4096000           0     4096000`
    }

    case 'clear':
      return '\x1b[CLEAR]'

    case 'reset':
      return '\x1b[CLEAR]'

    case 'exit':
      return '\x1b[EXIT]'

    case 'logout':
      return '\x1b[EXIT]'

    case 'nano':
    case 'vim':
    case 'vi': {
      const target = args.find(a => !a.startsWith('-')) || ''
      if (!target) return `[${cmd}] Starting ${cmd} editor...\n(Interactive editors are not supported in this terminal. Use 'cat' to view files or 'echo > file' to write.)`
      const path = resolvePath(shell.cwd, target)
      const node = getNode(fs, path)
      if (node && node.type === 'file') {
        return `[${cmd}] Opening ${target} (${node.content?.length || 0} bytes)\n(Interactive editors are not supported. File content below:)\n${'─'.repeat(40)}\n${node.content}\n${'─'.repeat(40)}\nUse 'echo \"content\" > ${target}' to overwrite, or 'echo \"content\" >> ${target}' to append.`
      }
      return `[${cmd}] New file: ${target}\n(Interactive editors are not supported. Use 'echo \"content\" > ${target}' to create and write.)`
    }

    case 'less':
    case 'more': {
      const target = args.find(a => !a.startsWith('-')) || ''
      if (!target) return `Usage: ${cmd} [file]`
      const path = resolvePath(shell.cwd, target)
      const node = getNode(fs, path)
      if (!node) return `${cmd}: cannot open '${target}': No such file or directory`
      if (node.type !== 'file') return `${cmd}: '${target}' is a directory`
      return node.content || ''
    }

    case 'tree': {
      const target = args.find(a => !a.startsWith('-')) || '.'
      const path = resolvePath(shell.cwd, target)
      const node = getNode(fs, path)
      if (!node) return `tree: '${target}': No such file or directory`
      const lines: string[] = [path]
      let dirCount = 0, fileCount = 0

      function walk(n: VFSNode, prefix: string) {
        const entries = Object.values(n.children || {}).sort((a, b) => a.name.localeCompare(b.name))
        entries.forEach((e, i) => {
          const isLast = i === entries.length - 1
          const connector = isLast ? '└── ' : '├── '
          const name = e.type === 'directory' ? blue(e.name) : e.name
          lines.push(prefix + connector + name)
          if (e.type === 'directory') {
            dirCount++
            walk(e, prefix + (isLast ? '    ' : '│   '))
          } else {
            fileCount++
          }
        })
      }

      if (node.type === 'directory') walk(node, '')
      return lines.join('\n') + `\n\n${dirCount} directories, ${fileCount} files`
    }

    case 'ln': {
      const symbolic = args.includes('-s')
      const target = args.find(a => !a.startsWith('-'))
      const linkName = args.find((a, i) => i > args.indexOf(target!) && !a.startsWith('-'))
      if (!target || !linkName) return 'ln: missing file operand'
      if (symbolic) return `ln: created symbolic link '${linkName}' -> '${target}' (simulated)`
      return `ln: cannot create hard link '${linkName}' to '${target}': Operation not permitted`
    }

    case 'stat': {
      const target = args.find(a => !a.startsWith('-')) || ''
      if (!target) return 'stat: missing operand'
      const path = resolvePath(shell.cwd, target)
      const node = getNode(fs, path)
      if (!node) return `stat: cannot stat '${target}': No such file or directory`
      return `  File: ${node.name}\n  Size: ${node.size}\tBlocks: ${Math.ceil(node.size / 512)}\tIO Block: 4096\t${node.type}\nAccess: (${node.permissions}/${formatPermissions(node)})\tUid: (${node.owner})\tGid: (${node.group})\nModify: ${node.modified}`
    }

    case 'file': {
      const target = args.find(a => !a.startsWith('-')) || ''
      if (!target) return 'Usage: file FILE'
      const path = resolvePath(shell.cwd, target)
      const node = getNode(fs, path)
      if (!node) return `${target}: cannot open (No such file or directory)`
      if (node.type === 'directory') return `${target}: directory`
      if (node.name.endsWith('.sh')) return `${target}: Bourne-Again shell script, ASCII text executable`
      if (node.name.endsWith('.js')) return `${target}: JavaScript source, ASCII text`
      if (node.name.endsWith('.html')) return `${target}: HTML document, ASCII text`
      if (node.name.endsWith('.css')) return `${target}: CSS source, ASCII text`
      if (node.name.endsWith('.md')) return `${target}: Markdown text, UTF-8`
      if (node.name.endsWith('.py')) return `${target}: Python script, ASCII text executable`
      if (node.name.endsWith('.conf')) return `${target}: ASCII text`
      if (node.name.endsWith('.tar.gz')) return `${target}: gzip compressed data`
      if (node.name.endsWith('.png')) return `${target}: PNG image data`
      return `${target}: ASCII text`
    }

    case 'sort': {
      const pipeIn = getPipeInput()
      let content = pipeIn || ''
      if (!content && args.length > 0) {
        const fArg = args.find(a => !a.startsWith('-'))
        if (fArg) {
          const path = resolvePath(shell.cwd, fArg)
          const node = getNode(fs, path)
          if (node && node.type === 'file') content = node.content || ''
        }
      }
      const reverse = args.includes('-r')
      const numeric = args.includes('-n')
      let lines = content.split('\n').filter(Boolean)
      lines.sort((a, b) => numeric ? parseFloat(a) - parseFloat(b) : a.localeCompare(b))
      if (reverse) lines.reverse()
      return lines.join('\n')
    }

    case 'uniq': {
      const pipeIn = getPipeInput()
      let content = pipeIn || ''
      if (!content && args.length > 0) {
        const fArg = args.find(a => !a.startsWith('-'))
        if (fArg) {
          const path = resolvePath(shell.cwd, fArg)
          const node = getNode(fs, path)
          if (node && node.type === 'file') content = node.content || ''
        }
      }
      const lines = content.split('\n')
      const unique: string[] = []
      for (const line of lines) {
        if (unique[unique.length - 1] !== line) unique.push(line)
      }
      return unique.join('\n')
    }

    case 'diff': {
      const f1 = args[0], f2 = args[1]
      if (!f1 || !f2) return 'diff: missing operand'
      const n1 = getNode(fs, resolvePath(shell.cwd, f1))
      const n2 = getNode(fs, resolvePath(shell.cwd, f2))
      if (!n1 || n1.type !== 'file') return `diff: ${f1}: No such file`
      if (!n2 || n2.type !== 'file') return `diff: ${f2}: No such file`
      const l1 = (n1.content || '').split('\n')
      const l2 = (n2.content || '').split('\n')
      const max = Math.max(l1.length, l2.length)
      const result: string[] = []
      for (let i = 0; i < max; i++) {
        if (l1[i] !== l2[i]) {
          if (i < l1.length) result.push(`< ${l1[i]}`)
          if (i < l2.length) result.push(`> ${l2[i]}`)
        }
      }
      return result.length ? result.join('\n') : ''
    }

    case 'awk': {
      const pipeIn = getPipeInput()
      if (!pipeIn && args.length < 2) return 'awk: not enough arguments'
      const program = args[0]
      let content = pipeIn || ''
      if (!content) {
        const fArg = args[args.length - 1]
        const node = getNode(fs, resolvePath(shell.cwd, fArg))
        if (node && node.type === 'file') content = node.content || ''
      }
      if (program === '{print $1}') return content.split('\n').map(l => l.split(/\s+/)[0]).filter(Boolean).join('\n')
      if (program === '{print $NF}') return content.split('\n').map(l => { const p = l.split(/\s+/); return p[p.length - 1] }).filter(Boolean).join('\n')
      if (program === '{print NR, $0}') return content.split('\n').map((l, i) => `${i + 1} ${l}`).join('\n')
      return content
    }

    case 'sed': {
      const pipeIn = getPipeInput()
      const expr = args[0]
      let content = pipeIn || ''
      if (!content && args.length > 1) {
        const fArg = args[1]
        const node = getNode(fs, resolvePath(shell.cwd, fArg))
        if (node && node.type === 'file') content = node.content || ''
      }
      if (expr && expr.startsWith('s/')) {
        const parts = expr.split('/')
        const pattern = parts[1]
        const replacement = parts[2]
        const flags = parts[3] || ''
        try {
          const regex = new RegExp(pattern, flags.includes('g') ? 'g' : '')
          return content.split('\n').map(l => l.replace(regex, replacement)).join('\n')
        } catch { return content }
      }
      return content
    }

    case 'cut': {
      const pipeIn = getPipeInput()
      let content = pipeIn || ''
      const dIdx = args.indexOf('-d')
      const fIdx = args.indexOf('-f')
      const delim = dIdx >= 0 ? args[dIdx + 1] : '\t'
      const fields = fIdx >= 0 ? args[fIdx + 1]?.split(',').map(Number) : [1]
      return content.split('\n').map(line => {
        const parts = line.split(delim)
        return fields.map(f => parts[f - 1] || '').join(delim)
      }).join('\n')
    }

    case 'tr': {
      const pipeIn = getPipeInput()
      if (!pipeIn) return 'tr: missing operand'
      const set1 = args[0], set2 = args[1]
      if (set1 && set2) return pipeIn.split('').map(c => { const i = set1.indexOf(c); return i >= 0 ? set2[i] || c : c }).join('')
      if (args.includes('-d') && set1) return pipeIn.split('').filter(c => !set1.includes(c)).join('')
      return pipeIn
    }

    case 'tee': {
      const files = args.filter(a => !a.startsWith('-'))
      return `tee: simulated. Output would be written to: ${files.join(', ')}`
    }

    case 'xargs': {
      const pipeIn = getPipeInput()
      if (!pipeIn || !args[0]) return ''
      return `[simulated] Would run: ${args[0]} ${pipeIn.split('\n').filter(Boolean).join(' ')}`
    }

    case 'passwd':
      return 'Changing password for user.\n(current) UNIX password: \nNew password: \nRetype new password: \npasswd: password updated successfully'

    case 'su': {
      return `Password: \nsu: Authentication failure (simulated)\nHint: Use 'sudo' for elevated privileges`
    }

    case 'sudo': {
      if (args.length === 0) return 'usage: sudo [-hHlLvV] [-u user] command'
      if (args[0] === '-l') return `User ${shell.user} may run the following commands:\n    (ALL : ALL) ALL`
      return `[sudo] password for ${shell.user}: \n${bold('Note: ')} sudo is simulated. Running: ${args.join(' ')}\n${runSingleCommand(args[0], args.slice(1), { ...shell, user: 'root' }, fs, setFs)}`
    }

    case 'reboot':
    case 'shutdown':
      return `${cmd}: Need to be root.\n(Note: System restart is simulated)`

    case 'service':
    case 'systemctl': {
      const action = args[0]
      const service = args[1]
      if (!action || !service) return `Usage: ${cmd} [start|stop|restart|status] SERVICE`
      if (action === 'status') return `● ${service} - ${service} daemon\n   Loaded: loaded\n   Active: active (running) since Mon 2026-08-15 10:00:01\n   Main PID: ${Math.floor(Math.random() * 1000 + 100)}\n   CGroup: /system.slice/${service}.service`
      return `${service} ${action === 'start' ? 'started' : action === 'stop' ? 'stopped' : 'restarted'}. (simulated)`
    }

    case 'journalctl': {
      return `-- Logs begin at Mon 2026-08-15 10:00:01 --\nAug 15 10:00:01 weblinux systemd[1]: Started System Logging Service.\nAug 15 10:00:01 weblinux systemd[1]: Started OpenSSH Server.\nAug 15 10:00:02 weblinux sshd[1234]: Server listening on 0.0.0.0 port 22.\nAug 15 10:00:02 weblinux systemd[1]: Started nginx.\nAug 15 10:05:00 weblinux CRON[5678]: (root) CMD (/usr/bin/health-check.sh)`
    }

    case 'dmesg':
      return getNode(fs, '/var/log/dmesg')?.content || ''

    case 'mount':
      return `/dev/sda1 on / type ext4 (rw,relatime,errors=remount-ro)\ntmpfs on /dev/shm type tmpfs (rw,nosuid,nodev)\n/dev/sda2 on /home type ext4 (rw,relatime)\n/dev/sda3 on /var type ext4 (rw,relatime)`

    case 'fdisk':
    case 'lsblk':
      return `NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT\nsda      8:0    0    50G  0 disk \n├─sda1   8:1    0    50G  0 part /\nsdb      8:16   0   100G  0 disk\n├─sdb1   8:17   0   100G  0 part /home\nsdc      8:32   0    20G  0 disk\n├─sdc1   8:33   0    20G  0 part /var`

    case 'crontab': {
      if (args.includes('-l')) {
        const node = getNode(fs, '/etc/crontab')
        return node?.content || 'no crontab for user'
      }
      if (args.includes('-e')) return 'crontab: editing crontab (Interactive editing not supported)'
      return 'no crontab for user'
    }

    case 'tar': {
      const extract = args.includes('-x') || args.includes('-xvf')
      const list = args.includes('-t') || args.includes('-tvf')
      if (list) return `drwxr-xr-x user/user     0 2026-08-15 10:30 ./\n-rw-r--r-- user/user   256 2026-08-15 10:30 ./readme.txt\n-rw-r--r-- user/user   128 2026-08-15 10:30 ./config.json`
      if (extract) return `tar: simulated extraction complete`
      return `tar: simulated archive creation complete`
    }

    case 'zip':
    case 'unzip':
      return `${cmd}: simulated operation complete`

    case 'man': {
      const topic = args[0]
      if (!topic) return 'What manual page do you want?'
      const manPages: Record<string, string> = {
        ls: 'LS(1)\n\nNAME\n       ls - list directory contents\n\nSYNOPSIS\n       ls [OPTION]... [FILE]...\n\nDESCRIPTION\n       List information about the FILEs.\n       -a     do not ignore entries starting with .\n       -l     use a long listing format',
        cd: 'CD(1)\n\nNAME\n       cd - change the working directory\n\nSYNOPSIS\n       cd [dir]\n\nDESCRIPTION\n       Change the current directory to dir.',
        grep: 'GREP(1)\n\nNAME\n       grep - print lines matching a pattern\n\nSYNOPSIS\n       grep [OPTIONS] PATTERN [FILE...]\n\nDESCRIPTION\n       Search for PATTERN in each FILE.\n       -i     ignore case distinctions\n       -n     print line numbers',
      }
      return manPages[topic] || `No manual entry for ${topic}`
    }

    case 'info':
      return `info: No info file for ${args[0] || ''}`

    case 'help': {
      return `${bold('WebLinuxOS SSH Terminal - Simulated Shell Commands:')}

${cyan('File Operations:')}
  ls, cd, pwd, cat, head, tail, touch, mkdir, rmdir, rm, cp, mv, ln
  chmod, chown, stat, file, find, tree, diff, wc

${cyan('Text Processing:')}
  echo, grep, sed, awk, cut, tr, sort, uniq, tee, xargs

${cyan('System Info:')}
  whoami, id, hostname, uname, date, uptime, free, df, du, ps, top
  lsb_release, lscpu

${cyan('Network:')}
  ifconfig, ip, ping, traceroute, curl, wget, ssh, scp, nslookup, dig, netstat, ss

${cyan('Editors:')}
  nano, vim, vi, less, more

${cyan('Process/Service:')}
  ps, top, kill, systemctl, service, journalctl, dmesg, crontab

${cyan('Shell:')}
  env, export, set, unset, alias, unalias, history, which, type, source
  echo, clear, exit, logout, su, sudo

${cyan('Disk:')}
  mount, fdisk, lsblk, tar, zip, unzip

${cyan('Other:')}
  man, help, date, cal, seq, sleep, yes, true, false, test`
    }

    case 'lsb_release':
      if (args.includes('-a')) return `Distributor ID:\tWebLinuxOS\nDescription:\tWebLinuxOS 1.0\nRelease:\t1.0\nCodename:\tstable`
      return 'WebLinuxOS'

    case 'lscpu':
      return `Architecture:                    x86_64\nCPU op-mode(s):                  32-bit, 64-bit\nByte Order:                      Little Endian\nCPU(s):                          8\nThread(s) per core:              2\nCore(s) per socket:              4\nSocket(s):                       1\nModel name:                      Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz\nCPU MHz:                         3800.000\nL2 cache:                        256K\nL3 cache:                        16384K`

    case 'cal': {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      const header = `    ${monthNames[month]} ${year}`
      const days = 'Su Mo Tu We Th Fr Sa'
      const firstDay = new Date(year, month, 1).getDay()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const lines: string[] = [header, days]
      let line = '   '.repeat(firstDay)
      for (let d = 1; d <= daysInMonth; d++) {
        line += (d < 10 ? ' ' : '') + d + ' '
        if ((firstDay + d) % 7 === 0 || d === daysInMonth) { lines.push(line.trimEnd()); line = '' }
      }
      return lines.join('\n')
    }

    case 'seq': {
      const last = parseInt(args[args.length - 1])
      const first = args.length > 1 ? parseInt(args[0]) : 1
      const step = args.length > 2 ? parseInt(args[1]) : 1
      if (isNaN(last)) return ''
      const result: number[] = []
      for (let i = first; i <= last; i += step) result.push(i)
      return result.join('\n')
    }

    case 'sleep':
      return '' // no-op in simulated env

    case 'yes':
      return 'y\ny\ny\ny\ny\n(Use Ctrl+C to stop)'

    case 'true':
      return ''

    case 'false':
      return '\x1b[1]'

    case 'test':
    case '[':
      return ''

    case 'source':
    case '.': {
      const target = args[0]
      if (!target) return `bash: ${cmd}: filename argument required`
      const path = resolvePath(shell.cwd, target)
      const node = getNode(fs, path)
      if (!node || node.type !== 'file') return `bash: ${target}: No such file or directory`
      return `bash: ${target}: sourced (simulated - variables/aliases not persisted)`
    }

    case 'kill': {
      const pid = parseInt(args[args.length - 1])
      if (isNaN(pid)) return 'kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]'
      return `kill: signal sent to PID ${pid} (simulated)`
    }

    case 'nslookup':
    case 'dig': {
      const target = args.find(a => !a.startsWith('-')) || ''
      if (!target) return `; <<>> ${cmd} <<>>\n;; connection timed out; no servers could be reached`
      return `; <<>> ${cmd} 9.16.1 <<>>\n;; global options: +cmd\n;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR\n${target}.\t\t300\tIN\tA\t93.184.216.34\n\n;; Query time: 42 msec\n;; SERVER: 8.8.8.8#53(8.8.8.8)`
    }

    case 'netstat':
    case 'ss': {
      return `Netid  State   Recv-Q  Send-Q   Local Address:Port    Peer Address:Port\ntcp    ESTAB    0       0        192.168.1.100:22      192.168.1.1:54321\ntcp    ESTAB    0       0        192.168.1.100:80      192.168.1.1:8080\ntcp    LISTEN   0       128      0.0.0.0:22            0.0.0.0:*\ntcp    LISTEN   0       511      0.0.0.0:80            0.0.0.0:*\ntcp    LISTEN   0       128      0.0.0.0:443           0.0.0.0:*`
    }

    case 'arp':
      return `? (192.168.1.1) at aa:bb:cc:dd:ee:ff [ether] on eth0\n? (192.168.1.254) at 11:22:33:44:55:66 [ether] on eth0`

    case 'route':
    case 'ip': {
      if (cmd === 'route' || (cmd === 'ip' && args[0] === 'route')) {
        return `default via 192.168.1.1 dev eth0\n192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.100\n172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1`
      }
      return runSingleCommand('ip', ['addr'], shell, fs, setFs)
    }

    case 'nmap': {
      const target = args.find(a => !a.startsWith('-')) || 'localhost'
      return `Starting Nmap 7.80 ( https://nmap.org )\nNmap scan report for ${target}\nHost is up (0.00023s latency).\nNot shown: 997 filtered ports\nPORT     STATE SERVICE\n22/tcp   open  ssh\n80/tcp   open  http\n443/tcp  open  https\n\nNmap done: 1 IP address (1 host up) scanned in 1.23 seconds`
    }

    case 'git': {
      const sub = args[0]
      if (!sub) return 'usage: git [--version] [--help] [-C <path>] <command> [<args>]'
      if (sub === 'status') return `On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean`
      if (sub === 'log') return `commit abc123def456 (HEAD -> main, origin/main)\nAuthor: User <user@weblinux>\nDate:   Mon Aug 15 10:30:00 2026\n\n    Initial commit`
      if (sub === 'branch') return '* main'
      if (sub === 'remote') return 'origin\tgit@github.com:user/repo.git (fetch)\norigin\tgit@github.com:user/repo.git (push)'
      return `git: '${sub}' simulated`
    }

    case 'python3':
    case 'python':
      return `Python 3.10.12 (main, Jun 11 2026, 15:24:39) [GCC 11.2.0] on linux\nType "help", "copyright" for more information.\n(Interactive Python is not supported in this terminal)`

    case 'node':
      return `Welcome to Node.js v18.17.0.\nType ".help" for more information.\n(Interactive Node.js REPL is not supported in this terminal)`

    case 'gcc':
      return 'gcc: fatal error: no input files\ncompilation terminated.'

    case 'make':
      return 'make: *** No targets specified and no makefile found.  Stop.'

    case 'bash':
    case 'sh':
      if (args.length === 0) return 'Interactive sub-shell not supported'
      return runSingleCommand(args[0], args.slice(1), shell, fs, setFs)

    case 'neofetch':
      return `${cyan('        .--.        ')} ${bold(shell.user + '@' + shell.hostname)}
${cyan('       |o_o |       ')} ${dim('-----------------')}
${cyan('       |:_/ |       ')} OS: WebLinuxOS 1.0 x86_64
${cyan('      //   \\ \\      ')} Host: Virtual Machine
${cyan('     (|     | )     ')} Kernel: 5.15.0-weblinux
${cyan("    /'\\_   _/`\\     ")} Uptime: 42 days, 3 hours
${cyan('    \\___)=(___/     ')} Shell: bash 5.1.16
${cyan('                    ')} Terminal: xterm-256color
${cyan('                    ')} CPU: Intel i7-10700K (8) @ 3.80GHz
${cyan('                    ')} Memory: 3072MiB / 16384MiB`

    case 'screen':
    case 'tmux':
      return `${cmd}: simulated. Terminal multiplexing is not supported in this environment.`

    case 'base64': {
      const decode = args.includes('-d')
      const target = args.find(a => !a.startsWith('-'))
      if (!target) return 'base64: missing operand'
      if (decode) {
        try { return atob(target) } catch { return 'base64: invalid input' }
      }
      return btoa(target)
    }

    case 'md5sum':
    case 'sha256sum':
    case 'sha1sum': {
      const target = args[0]
      if (!target) return `${cmd}: missing operand`
      const hash = Array.from({ length: cmd === 'md5sum' ? 32 : cmd === 'sha1sum' ? 40 : 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      return `${hash}  ${target}`
    }

    case 'xxd':
    case 'hexdump': {
      const target = args.find(a => !a.startsWith('-')) || ''
      if (!target) return `${cmd}: missing operand`
      const path = resolvePath(shell.cwd, target)
      const node = getNode(fs, path)
      if (!node || node.type !== 'file') return `${cmd}: ${target}: No such file`
      const content = node.content || ''
      const lines: string[] = []
      for (let i = 0; i < Math.min(content.length, 256); i += 16) {
        const chunk = content.slice(i, i + 16)
        const hex = Array.from(chunk).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ')
        const ascii = Array.from(chunk).map(c => { const code = c.charCodeAt(0); return code >= 32 && code < 127 ? c : '.' }).join('')
        lines.push(`${i.toString(16).padStart(8, '0')}: ${hex.padEnd(48)}  ${ascii}`)
      }
      if (content.length > 256) lines.push('... (truncated)')
      return lines.join('\n')
    }

    case 'jq': {
      const target = args.find(a => !a.startsWith('-')) || ''
      if (!target) return 'jq - commandline JSON processor'
      return `jq: error: Simulated jq does not process real data`
    }

    case 'curl': {
      const url = args.find(a => !a.startsWith('-')) || ''
      if (!url) return 'curl: try \'curl --help\' for more information'
      if (args.includes('-I') || args.includes('--head')) {
        return `HTTP/1.1 200 OK\nServer: nginx/1.21.0\nDate: ${new Date().toUTCString()}\nContent-Type: text/html; charset=UTF-8\nContent-Length: 612\nConnection: keep-alive\nX-Powered-By: WebLinuxOS`
      }
      return `<!DOCTYPE html>\n<html><head><title>${url}</title></head>\n<body><h1>Simulated Response from ${url}</h1><p>This is a simulated curl response from the WebLinuxOS SSH Terminal.</p></body></html>`
    }

    default:
      return `bash: ${cmd}: command not found`
  }
}

// ============================================================
// Tab Completion
// ============================================================

function getCompletions(input: string, shell: ShellState, fs: VFSNode): string[] {
  if (!input) return []
  const tokens = input.split(/\s+/)
  const isFirstToken = tokens.length <= 1

  if (isFirstToken) {
    const commands = [
      'ls', 'cd', 'pwd', 'cat', 'head', 'tail', 'touch', 'mkdir', 'rmdir', 'rm', 'cp', 'mv',
      'echo', 'grep', 'find', 'chmod', 'chown', 'ps', 'top', 'df', 'du', 'whoami', 'hostname',
      'uname', 'ifconfig', 'ping', 'curl', 'wget', 'nano', 'vim', 'ssh', 'scp', 'bash', 'sh',
      'env', 'export', 'alias', 'history', 'which', 'type', 'date', 'uptime', 'free', 'clear',
      'exit', 'logout', 'su', 'sudo', 'less', 'more', 'tree', 'stat', 'file', 'diff', 'wc',
      'sort', 'uniq', 'awk', 'sed', 'cut', 'tr', 'ln', 'tar', 'zip', 'unzip', 'man', 'help',
      'git', 'python3', 'node', 'make', 'gcc', 'kill', 'systemctl', 'service', 'mount', 'lsblk',
      'cal', 'seq', 'neofetch', 'screen', 'tmux', 'id', 'passwd', 'crontab', 'journalctl',
      'dmesg', 'traceroute', 'nmap', 'nslookup', 'dig', 'netstat', 'ss', 'arp', 'route',
      'base64', 'md5sum', 'sha256sum', 'hexdump', 'xxd', 'jq', 'source',
    ]
    const partial = tokens[0]
    return [...commands, ...Object.keys(shell.alias)].filter(c => c.startsWith(partial))
  }

  // File/directory completion
  const partial = tokens[tokens.length - 1]
  const lastSlash = partial.lastIndexOf('/')
  const dirPart = lastSlash >= 0 ? partial.slice(0, lastSlash + 1) : ''
  const prefix = lastSlash >= 0 ? partial.slice(lastSlash + 1) : partial
  const dirPath = resolvePath(shell.cwd, dirPart || '.')
  const dirNode = getNode(fs, dirPath)
  if (!dirNode || dirNode.type !== 'directory') return []
  return Object.keys(dirNode.children || {})
    .filter(name => name.startsWith(prefix))
    .map(name => {
      const child = dirNode.children![name]
      const suffix = child.type === 'directory' ? '/' : ' '
      return tokens.slice(0, -1).join(' ') + ' ' + dirPart + name + suffix
    })
}

// ============================================================
// Main Component
// ============================================================

export default function WebSSHTerminal() {
  // State
  const [colorScheme, setColorScheme] = useState<ColorScheme>('green')
  const [activePanel, setActivePanel] = useState<PanelView>('terminal')
  const [sessions, setSessions] = useState<SSHSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<SSHProfile[]>([
    { id: 'default-1', name: 'Local Server', host: '192.168.1.100', port: 22, username: 'user', authMethod: 'password', lastConnected: Date.now() - 86400000 },
    { id: 'default-2', name: 'Production', host: '10.0.0.1', port: 22, username: 'admin', authMethod: 'key', lastConnected: Date.now() - 172800000 },
    { id: 'default-3', name: 'Dev Server', host: '172.16.0.50', port: 2222, username: 'developer', authMethod: 'password' },
  ])
  const [showConnectDialog, setShowConnectDialog] = useState(true)
  const [connectForm, setConnectForm] = useState({ host: '', port: '22', username: 'root', authMethod: 'password' as AuthMethod, password: '', privateKey: '', name: '' })
  const [connectionLogs, setConnectionLogs] = useState<ConnectionLogEntry[]>([])
  const [, setLogCounter] = useState(0)
  const [portForwards, setPortForwards] = useState<PortForwardRule[]>([])
  const [sftpPath, setSftpPath] = useState('/')
  const [cursorVisible, setCursorVisible] = useState(true)
  const [fontSize, setFontSize] = useState(14)

  // Refs
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const vfsRef = useRef<VFSNode>(createInitialVFS())
  const tabCompleteRef = useRef<string[]>([])
  const tabCompleteIdxRef = useRef(0)

  const colors = COLOR_SCHEMES[colorScheme]
  const activeSession = sessions.find(s => s.id === activeSessionId)

  // Cursor blink
  useEffect(() => {
    const timer = setInterval(() => setCursorVisible(v => !v), 530)
    return () => clearInterval(timer)
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [activeSession?.terminalLines.length, activeSession?.lineCounter])

  // Focus input
  useEffect(() => {
    if (activeSession && activePanel === 'terminal') {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [activeSessionId, activePanel, activeSession?.connected])

  const addLog = useCallback((type: ConnectionLogEntry['type'], message: string, sessionId?: string) => {
    setLogCounter(c => {
      const newId = c + 1
      setConnectionLogs(logs => [...logs, { id: newId, timestamp: Date.now(), type, message, sessionId }])
      return newId
    })
  }, [])

  const addTerminalLine = useCallback((sessionId: string, content: string, isCommand?: boolean) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s
      const newCounter = s.lineCounter + 1
      return {
        ...s,
        terminalLines: [...s.terminalLines, { id: newCounter, content, isCommand, timestamp: Date.now() }],
        lineCounter: newCounter,
      }
    }))
  }, [])

  const connectSession = useCallback((profile: SSHProfile) => {
    const sessionId = 'session-' + Date.now()
    const shell = createShellState(profile.username, profile.host.replace(/\./g, '-').replace(/[^a-zA-Z0-9-]/g, '') || 'weblinux-server')
    const session: SSHSession = {
      id: sessionId,
      profileId: profile.id,
      profile,
      connected: true,
      shell,
      terminalLines: [],
      lineCounter: 0,
      createdAt: Date.now(),
    }
    setSessions(prev => [...prev, session])
    setActiveSessionId(sessionId)
    setShowConnectDialog(false)
    addLog('connect', `Connected to ${profile.username}@${profile.host}:${profile.port}`, sessionId)
    addLog('auth', `Authenticated using ${profile.authMethod}`, sessionId)

    // Welcome message
    setTimeout(() => {
      const welcome = [
        `WebLinuxOS SSH Terminal v1.0`,
        `Connected to ${profile.host}:${profile.port} as ${profile.username}`,
        `Last login: ${new Date().toDateString()} from 192.168.1.1`,
        `Type 'help' for available commands.`,
        '',
      ].join('\n')
      addTerminalLine(sessionId, welcome)
    }, 100)
  }, [addLog, addTerminalLine])

  const disconnectSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, connected: false } : s))
    const session = sessions.find(s => s.id === sessionId)
    if (session) addLog('disconnect', `Disconnected from ${session.profile.host}`, sessionId)
  }, [sessions, addLog])

  const removeSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    if (activeSessionId === sessionId) {
      setActiveSessionId(null)
    }
  }, [activeSessionId])

  const handleCommand = useCallback((input: string) => {
    if (!activeSession || !activeSession.connected) return
    const sessionId = activeSession.id

    // Display the command
    const prompt = `${activeSession.shell.user}@${activeSession.shell.hostname}:${activeSession.shell.cwd}${activeSession.shell.user === 'root' ? '#' : '$'} `
    addTerminalLine(sessionId, prompt + input, true)

    if (input.trim()) {
      // Update history
      setSessions(prev => prev.map(s => {
        if (s.id !== sessionId) return s
        return {
          ...s,
          shell: { ...s.shell, history: [...s.shell.history, input.trim()], historyIndex: -1 },
        }
      }))
      addLog('command', `${prompt}${input}`, sessionId)
    }

    // Process command
    const outputLines: string[] = []
    const addOutput = (text: string) => { outputLines.push(text) }

    // Get current session state
    const currentSession = sessions.find(s => s.id === sessionId)
    if (!currentSession) return

    executeCommand(input, currentSession.shell, vfsRef.current, (newFs) => { vfsRef.current = newFs }, addOutput)

    const output = outputLines.join('\n')
    if (output) {
      if (output.includes('\x1b[CLEAR]')) {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, terminalLines: [] } : s))
      } else if (output.includes('\x1b[EXIT]')) {
        disconnectSession(sessionId)
      } else {
        addTerminalLine(sessionId, output)
      }
    }

    // Update shell state (cwd may have changed)
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s
      return { ...s, shell: { ...currentSession.shell } }
    }))
  }, [activeSession, sessions, addTerminalLine, addLog, disconnectSession])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!activeSession) return
    const shell = activeSession.shell

    if (e.key === 'Enter') {
      e.preventDefault()
      const val = (e.target as HTMLInputElement).value
      handleCommand(val)
      ;(e.target as HTMLInputElement).value = ''
      tabCompleteRef.current = []
      tabCompleteIdxRef.current = 0
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const newIdx = shell.historyIndex === -1 ? shell.history.length - 1 : Math.max(0, shell.historyIndex - 1)
      if (shell.history[newIdx]) {
        ;(e.target as HTMLInputElement).value = shell.history[newIdx]
        setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, shell: { ...s.shell, historyIndex: newIdx } } : s))
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (shell.historyIndex === -1) return
      const newIdx = shell.historyIndex + 1
      if (newIdx >= shell.history.length) {
        ;(e.target as HTMLInputElement).value = ''
        setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, shell: { ...s.shell, historyIndex: -1 } } : s))
      } else {
        ;(e.target as HTMLInputElement).value = shell.history[newIdx]
        setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, shell: { ...s.shell, historyIndex: newIdx } } : s))
      }
      return
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      const val = (e.target as HTMLInputElement).value
      if (tabCompleteRef.current.length === 0 || val !== tabCompleteRef.current[tabCompleteIdxRef.current]) {
        const completions = getCompletions(val, shell, vfsRef.current)
        tabCompleteRef.current = completions
        tabCompleteIdxRef.current = 0
      } else {
        tabCompleteIdxRef.current = (tabCompleteIdxRef.current + 1) % tabCompleteRef.current.length
      }
      if (tabCompleteRef.current.length > 0) {
        ;(e.target as HTMLInputElement).value = tabCompleteRef.current[tabCompleteIdxRef.current]
      }
      return
    }

    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      if (activeSessionId) {
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, terminalLines: [] } : s))
      }
      return
    }

    // Reset tab completion on any other key
    tabCompleteRef.current = []
    tabCompleteIdxRef.current = 0
  }, [activeSession, activeSessionId, handleCommand])

  // SFTP helpers
  const getSftpEntries = useCallback((path: string): SFTPEntry[] => {
    const node = getNode(vfsRef.current, path)
    if (!node || node.type !== 'directory') return []
    return Object.values(node.children || {}).map(child => ({
      name: child.name,
      type: child.type,
      size: child.size,
      permissions: child.permissions,
      modified: child.modified,
      owner: child.owner,
      group: child.group,
    })).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }, [])

  // ============================================================
  // Render - Connect Dialog
  // ============================================================

  const renderConnectDialog = () => (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', zIndex: 100,
    }}>
      <div style={{
        background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8,
        padding: 24, minWidth: 480, maxWidth: 600, maxHeight: '90%', overflow: 'auto',
        boxShadow: `0 0 40px ${colors.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ color: colors.text, margin: 0, fontSize: 18, fontWeight: 600 }}>SSH 连接</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['green', 'amber', 'white', 'cyberpunk', 'solarized'] as ColorScheme[]).map(scheme => (
              <button key={scheme} onClick={() => setColorScheme(scheme)} style={{
                width: 16, height: 16, borderRadius: '50%', border: `2px solid ${colorScheme === scheme ? colors.accent : 'transparent'}`,
                background: COLOR_SCHEMES[scheme].text, cursor: 'pointer', padding: 0,
              }} title={scheme} />
            ))}
          </div>
        </div>

        {/* Saved Profiles */}
        {profiles.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: colors.dim, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>已保存的连接</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {profiles.map(p => (
                <button key={p.id} onClick={() => connectSession(p)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  background: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: 4,
                  color: colors.text, cursor: 'pointer', textAlign: 'left', fontSize: 13,
                }}>
                  <span style={{ color: colors.prompt, fontSize: 16 }}>⌨</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{p.name || `${p.username}@${p.host}`}</div>
                    <div style={{ color: colors.dim, fontSize: 11 }}>{p.username}@{p.host}:{p.port} · {p.authMethod === 'key' ? '密钥认证' : '密码认证'}</div>
                  </div>
                  {p.lastConnected && <span style={{ color: colors.dim, fontSize: 10 }}>
                    {Math.floor((Date.now() - p.lastConnected) / 86400000)}天前
                  </span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: 1, background: colors.border, margin: '12px 0' }} />

        {/* New Connection Form */}
        <div style={{ color: colors.dim, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>新建连接</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8, marginBottom: 8 }}>
          <div>
            <label style={{ color: colors.dim, fontSize: 11, display: 'block', marginBottom: 2 }}>主机</label>
            <input value={connectForm.host} onChange={e => setConnectForm(f => ({ ...f, host: e.target.value }))} placeholder="192.168.1.100" style={{
              width: '100%', padding: '6px 8px', background: colors.inputBg, border: `1px solid ${colors.border}`,
              borderRadius: 3, color: colors.text, fontSize: 13, fontFamily: 'monospace', outline: 'none',
            }} />
          </div>
          <div>
            <label style={{ color: colors.dim, fontSize: 11, display: 'block', marginBottom: 2 }}>端口</label>
            <input value={connectForm.port} onChange={e => setConnectForm(f => ({ ...f, port: e.target.value }))} style={{
              width: '100%', padding: '6px 8px', background: colors.inputBg, border: `1px solid ${colors.border}`,
              borderRadius: 3, color: colors.text, fontSize: 13, fontFamily: 'monospace', outline: 'none',
            }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <div>
            <label style={{ color: colors.dim, fontSize: 11, display: 'block', marginBottom: 2 }}>用户名</label>
            <input value={connectForm.username} onChange={e => setConnectForm(f => ({ ...f, username: e.target.value }))} placeholder="root" style={{
              width: '100%', padding: '6px 8px', background: colors.inputBg, border: `1px solid ${colors.border}`,
              borderRadius: 3, color: colors.text, fontSize: 13, fontFamily: 'monospace', outline: 'none',
            }} />
          </div>
          <div>
            <label style={{ color: colors.dim, fontSize: 11, display: 'block', marginBottom: 2 }}>认证方式</label>
            <select value={connectForm.authMethod} onChange={e => setConnectForm(f => ({ ...f, authMethod: e.target.value as AuthMethod }))} style={{
              width: '100%', padding: '6px 8px', background: colors.inputBg, border: `1px solid ${colors.border}`,
              borderRadius: 3, color: colors.text, fontSize: 13, outline: 'none',
            }}>
              <option value="password">密码</option>
              <option value="key">密钥</option>
            </select>
          </div>
        </div>
        {connectForm.authMethod === 'password' ? (
          <div style={{ marginBottom: 8 }}>
            <label style={{ color: colors.dim, fontSize: 11, display: 'block', marginBottom: 2 }}>密码</label>
            <input type="password" value={connectForm.password} onChange={e => setConnectForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" style={{
              width: '100%', padding: '6px 8px', background: colors.inputBg, border: `1px solid ${colors.border}`,
              borderRadius: 3, color: colors.text, fontSize: 13, fontFamily: 'monospace', outline: 'none',
            }} />
          </div>
        ) : (
          <div style={{ marginBottom: 8 }}>
            <label style={{ color: colors.dim, fontSize: 11, display: 'block', marginBottom: 2 }}>私钥</label>
            <textarea value={connectForm.privateKey} onChange={e => setConnectForm(f => ({ ...f, privateKey: e.target.value }))} placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----" rows={4} style={{
              width: '100%', padding: '6px 8px', background: colors.inputBg, border: `1px solid ${colors.border}`,
              borderRadius: 3, color: colors.text, fontSize: 12, fontFamily: 'monospace', outline: 'none', resize: 'vertical',
            }} />
          </div>
        )}
        <div style={{ marginBottom: 12 }}>
          <label style={{ color: colors.dim, fontSize: 11, display: 'block', marginBottom: 2 }}>连接名称 (可选)</label>
          <input value={connectForm.name} onChange={e => setConnectForm(f => ({ ...f, name: e.target.value }))} placeholder="My Server" style={{
            width: '100%', padding: '6px 8px', background: colors.inputBg, border: `1px solid ${colors.border}`,
            borderRadius: 3, color: colors.text, fontSize: 13, fontFamily: 'monospace', outline: 'none',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => {
            const profile: SSHProfile = {
              id: 'profile-' + Date.now(),
              name: connectForm.name || `${connectForm.username}@${connectForm.host}`,
              host: connectForm.host || 'localhost',
              port: parseInt(connectForm.port) || 22,
              username: connectForm.username || 'root',
              authMethod: connectForm.authMethod,
              password: connectForm.password,
              privateKey: connectForm.privateKey,
            }
            setProfiles(p => [...p, profile])
            connectSession(profile)
          }} style={{
            flex: 1, padding: '8px 16px', background: colors.accent, color: '#000', border: 'none',
            borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>连接</button>
          <button onClick={() => setShowConnectDialog(false)} style={{
            padding: '8px 16px', background: 'transparent', color: colors.dim, border: `1px solid ${colors.border}`,
            borderRadius: 4, fontSize: 13, cursor: 'pointer',
          }}>取消</button>
        </div>
      </div>
    </div>
  )

  // ============================================================
  // Render - SFTP Panel
  // ============================================================

  const renderSFTPPanel = () => {
    const entries = getSftpEntries(sftpPath)
    return (
      <div style={{ padding: 8, overflow: 'auto', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ color: colors.dim, fontSize: 11 }}>远程路径:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, background: colors.inputBg, padding: '4px 8px', borderRadius: 3, border: `1px solid ${colors.border}` }}>
            <span style={{ color: colors.prompt, fontFamily: 'monospace', fontSize: 12 }}>{sftpPath}</span>
          </div>
          <button onClick={() => {
            const parent = sftpPath.split('/').slice(0, -1).join('/') || '/'
            setSftpPath(parent)
          }} style={{ background: 'none', border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 3, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}>↑</button>
        </div>

        <div style={{ border: `1px solid ${colors.border}`, borderRadius: 3, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 70px 80px 60px', padding: '4px 8px', background: colors.tabBg, fontSize: 11, color: colors.dim, borderBottom: `1px solid ${colors.border}` }}>
            <span></span><span>名称</span><span>大小</span><span>权限</span><span>所有者</span>
          </div>
          {/* Entries */}
          {entries.map(entry => (
            <div key={entry.name} onDoubleClick={() => {
              if (entry.type === 'directory') setSftpPath(sftpPath === '/' ? '/' + entry.name : sftpPath + '/' + entry.name)
            }} style={{
              display: 'grid', gridTemplateColumns: '24px 1fr 70px 80px 60px', padding: '4px 8px',
              fontSize: 12, color: entry.name.startsWith('.') ? colors.dim : colors.text,
              borderBottom: `1px solid ${colors.border}`, cursor: entry.type === 'directory' ? 'pointer' : 'default',
              fontFamily: 'monospace',
            }}>
              <span style={{ color: entry.type === 'directory' ? colors.prompt : colors.dim }}>
                {entry.type === 'directory' ? '📁' : entry.name.endsWith('.sh') ? '⚙' : '📄'}
              </span>
              <span style={{ color: entry.type === 'directory' ? colors.prompt : colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.name}
              </span>
              <span style={{ color: colors.dim }}>{entry.type === 'directory' ? '-' : formatSize(entry.size)}</span>
              <span style={{ color: colors.dim }}>{entry.permissions}</span>
              <span style={{ color: colors.dim }}>{entry.owner}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 8, padding: 8, background: colors.tabBg, borderRadius: 4, border: `1px solid ${colors.border}` }}>
          <div style={{ color: colors.dim, fontSize: 11, marginBottom: 4 }}>SFTP 操作</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {['上传', '下载', '删除', '重命名', '新建目录', '修改权限'].map(op => (
              <button key={op} style={{
                padding: '3px 8px', background: colors.inputBg, border: `1px solid ${colors.border}`,
                color: colors.text, borderRadius: 3, fontSize: 11, cursor: 'pointer',
              }}>{op}</button>
            ))}
          </div>
          <div style={{ color: colors.dim, fontSize: 10, marginTop: 6, lineHeight: 1.4 }}>
            提示: 双击目录进入，SFTP为模拟面板用于演示文件传输功能。
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // Render - Port Forwarding
  // ============================================================

  const renderPortForwardPanel = () => (
    <div style={{ padding: 12, overflow: 'auto', height: '100%' }}>
      <div style={{ color: colors.text, fontWeight: 600, marginBottom: 8, fontSize: 14 }}>端口转发</div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {(['local', 'remote', 'dynamic'] as const).map(type => (
          <button key={type} onClick={() => {
            setPortForwards(pf => [...pf, {
              id: 'pf-' + Date.now(), type,
              sourceHost: 'localhost', sourcePort: 8080,
              destHost: 'localhost', destPort: 80,
              enabled: true,
            }])
          }} style={{
            padding: '4px 10px', background: colors.inputBg, border: `1px solid ${colors.border}`,
            color: colors.text, borderRadius: 3, fontSize: 11, cursor: 'pointer',
          }}>+ {type === 'local' ? '本地' : type === 'remote' ? '远程' : '动态'}</button>
        ))}
      </div>

      {portForwards.length === 0 ? (
        <div style={{ color: colors.dim, fontSize: 12, padding: 16, textAlign: 'center', background: colors.tabBg, borderRadius: 4, border: `1px solid ${colors.border}` }}>
          暂无端口转发规则
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {portForwards.map(pf => (
            <div key={pf.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
              background: colors.tabBg, border: `1px solid ${colors.border}`, borderRadius: 3, fontSize: 12,
            }}>
              <span style={{ color: pf.type === 'local' ? colors.success : pf.type === 'remote' ? colors.prompt : colors.accent, fontWeight: 600, fontSize: 10 }}>
                {pf.type === 'local' ? 'L' : pf.type === 'remote' ? 'R' : 'D'}
              </span>
              <span style={{ color: colors.text, fontFamily: 'monospace' }}>
                {pf.sourceHost}:{pf.sourcePort} → {pf.destHost}:{pf.destPort}
              </span>
              <button onClick={() => setPortForwards(pfs => pfs.filter(p => p.id !== pf.id))} style={{
                marginLeft: 'auto', background: 'none', border: 'none', color: colors.error, cursor: 'pointer', fontSize: 12,
              }}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, padding: 8, background: colors.tabBg, borderRadius: 4, border: `1px solid ${colors.border}`, fontSize: 11, color: colors.dim, lineHeight: 1.5 }}>
        <div style={{ fontWeight: 600, color: colors.text, marginBottom: 4 }}>端口转发说明</div>
        <div><b style={{ color: colors.success }}>本地转发 (L):</b> 将本地端口转发到远程服务器。访问本地端口时，请求通过SSH隧道转发到远程目标。</div>
        <div><b style={{ color: colors.prompt }}>远程转发 (R):</b> 将远程端口转发到本地。远程服务器上的请求通过SSH隧道转发到本地。</div>
        <div><b style={{ color: colors.accent }}>动态转发 (D):</b> 创建SOCKS代理，动态转发流量。可用于浏览器代理等场景。</div>
        <div style={{ marginTop: 4 }}>⚠ 此面板为UI演示，实际的SSH隧道需要真实的SSH连接支持。</div>
      </div>
    </div>
  )

  // ============================================================
  // Render - Connection Log
  // ============================================================

  const renderConnectionLog = () => (
    <div style={{ padding: 8, overflow: 'auto', height: '100%' }}>
      <div style={{ color: colors.text, fontWeight: 600, marginBottom: 8, fontSize: 14 }}>连接日志</div>
      {connectionLogs.length === 0 ? (
        <div style={{ color: colors.dim, fontSize: 12, textAlign: 'center', padding: 16 }}>暂无日志</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {connectionLogs.slice().reverse().map(log => (
            <div key={log.id} style={{
              display: 'flex', gap: 6, padding: '3px 6px', fontSize: 11, fontFamily: 'monospace',
              background: log.type === 'error' ? 'rgba(255,0,0,0.1)' : 'transparent',
              borderLeft: `2px solid ${log.type === 'connect' ? colors.success : log.type === 'disconnect' ? colors.error : log.type === 'auth' ? colors.prompt : colors.dim}`,
            }}>
              <span style={{ color: colors.dim, whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span style={{ color: log.type === 'error' ? colors.error : log.type === 'command' ? colors.dim : colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ============================================================
  // Main Render
  // ============================================================

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: colors.bg, color: colors.text, fontFamily: 'monospace',
      fontSize: fontSize, position: 'relative', userSelect: 'text',
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '4px 8px',
        background: colors.tabBg, borderBottom: `1px solid ${colors.border}`,
        minHeight: 36, gap: 4,
      }}>
        {/* Session Tabs */}
        {sessions.map(session => (
          <div key={session.id} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px',
            background: session.id === activeSessionId ? colors.tabActive : colors.tabBg,
            border: `1px solid ${session.id === activeSessionId ? colors.accent : colors.border}`,
            borderRadius: 3, cursor: 'pointer', fontSize: 11, maxWidth: 200,
          }} onClick={() => setActiveSessionId(session.id)}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: session.connected ? colors.success : colors.error }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: colors.tabText }}>
              {session.profile.name || `${session.profile.username}@${session.profile.host}`}
            </span>
            <button onClick={(e) => { e.stopPropagation(); removeSession(session.id) }} style={{
              background: 'none', border: 'none', color: colors.dim, cursor: 'pointer', fontSize: 10, padding: 0, lineHeight: 1,
            }}>✕</button>
          </div>
        ))}

        {/* New Session Button */}
        <button onClick={() => setShowConnectDialog(true)} style={{
          padding: '3px 6px', background: 'none', border: `1px solid ${colors.border}`,
          color: colors.tabText, borderRadius: 3, cursor: 'pointer', fontSize: 14, lineHeight: 1,
        }}>+</button>

        <div style={{ flex: 1 }} />

        {/* Panel Tabs */}
        {([
          { key: 'terminal' as PanelView, label: '终端', icon: '⌨' },
          { key: 'sftp' as PanelView, label: 'SFTP', icon: '📁' },
          { key: 'portForward' as PanelView, label: '转发', icon: '↗' },
          { key: 'connectionLog' as PanelView, label: '日志', icon: '📋' },
        ]).map(({ key, label, icon }) => (
          <button key={key} onClick={() => setActivePanel(key)} style={{
            padding: '2px 8px', background: activePanel === key ? colors.tabActive : 'none',
            border: `1px solid ${activePanel === key ? colors.accent : 'transparent'}`,
            color: activePanel === key ? colors.text : colors.dim, borderRadius: 3,
            cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span>{icon}</span><span>{label}</span>
          </button>
        ))}

        {/* Font Size */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 8 }}>
          <button onClick={() => setFontSize(s => Math.max(10, s - 1))} style={{
            background: 'none', border: `1px solid ${colors.border}`, color: colors.dim,
            borderRadius: 2, cursor: 'pointer', fontSize: 10, padding: '1px 4px', lineHeight: 1,
          }}>-</button>
          <span style={{ color: colors.dim, fontSize: 10, minWidth: 20, textAlign: 'center' }}>{fontSize}</span>
          <button onClick={() => setFontSize(s => Math.min(24, s + 1))} style={{
            background: 'none', border: `1px solid ${colors.border}`, color: colors.dim,
            borderRadius: 2, cursor: 'pointer', fontSize: 10, padding: '1px 4px', lineHeight: 1,
          }}>+</button>
        </div>
      </div>

      {/* Main Content */}
      {activePanel === 'terminal' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeSession ? (
            activeSession.connected ? (
              <>
                {/* Terminal Output */}
                <div ref={terminalRef} onClick={() => inputRef.current?.focus()} style={{
                  flex: 1, overflowY: 'auto', padding: '8px 12px', lineHeight: 1.5,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}>
                  {activeSession.terminalLines.map(line => (
                    <div key={line.id} style={{ minHeight: '1.5em' }}>
                      {line.isCommand ? (
                        <span>
                          <span style={{ color: colors.prompt }}>
                            {line.content.split('$ ')[0]}{line.content.includes('$ ') ? '$ ' : line.content.includes('# ') ? '# ' : ''}
                          </span>
                          <span style={{ color: colors.text }}>
                            {line.content.includes('$ ') ? line.content.split('$ ').slice(1).join('$ ') : line.content.includes('# ') ? line.content.split('# ').slice(1).join('# ') : line.content}
                          </span>
                        </span>
                      ) : (
                        <span>{processAnsiText(line.content, colors.text)}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Input Line */}
                <div style={{
                  display: 'flex', alignItems: 'center', padding: '4px 12px',
                  background: colors.inputBg, borderTop: `1px solid ${colors.border}`,
                }}>
                  <span style={{ color: colors.prompt, whiteSpace: 'nowrap', marginRight: 4 }}>
                    {activeSession.shell.user}@{activeSession.shell.hostname}:{activeSession.shell.cwd}{activeSession.shell.user === 'root' ? '#' : '$'}
                  </span>
                  <input
                    ref={inputRef}
                    onKeyDown={handleKeyDown}
                    style={{
                      flex: 1, background: 'transparent', border: 'none', color: colors.text,
                      fontFamily: 'monospace', fontSize: fontSize, outline: 'none', caretColor: colors.cursor,
                    }}
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                    autoCapitalize="off"
                  />
                  <span style={{
                    width: 8, height: fontSize + 2, background: cursorVisible ? colors.cursor : 'transparent',
                    marginLeft: 1, animation: 'none',
                  }} />
                </div>
              </>
            ) : (
              /* Disconnected */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ color: colors.error, fontSize: 24 }}>⌨</div>
                <div style={{ color: colors.error, fontSize: 14 }}>连接已断开</div>
                <div style={{ color: colors.dim, fontSize: 12 }}>
                  {activeSession.profile.username}@{activeSession.profile.host}:{activeSession.profile.port}
                </div>
                <button onClick={() => {
                  const reconnected: SSHSession = {
                    ...activeSession,
                    connected: true,
                    terminalLines: [],
                    lineCounter: 0,
                    shell: createShellState(activeSession.profile.username, activeSession.profile.host.replace(/\./g, '-') || 'weblinux-server'),
                  }
                  setSessions(prev => prev.map(s => s.id === activeSession.id ? reconnected : s))
                  addLog('connect', `Reconnected to ${activeSession.profile.host}`, activeSession.id)
                }} style={{
                  padding: '6px 16px', background: colors.accent, color: '#000', border: 'none',
                  borderRadius: 4, fontSize: 12, cursor: 'pointer', fontWeight: 600,
                }}>重新连接</button>
              </div>
            )
          ) : (
            /* No Session */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div style={{ color: colors.dim, fontSize: 48 }}>⌨</div>
              <div style={{ color: colors.dim, fontSize: 14 }}>没有活动的 SSH 会话</div>
              <button onClick={() => setShowConnectDialog(true)} style={{
                padding: '8px 24px', background: colors.accent, color: '#000', border: 'none',
                borderRadius: 4, fontSize: 13, cursor: 'pointer', fontWeight: 600,
              }}>新建连接</button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto' }}>
          {activePanel === 'sftp' && renderSFTPPanel()}
          {activePanel === 'portForward' && renderPortForwardPanel()}
          {activePanel === 'connectionLog' && renderConnectionLog()}
        </div>
      )}

      {/* Status Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '2px 8px',
        background: colors.tabBg, borderTop: `1px solid ${colors.border}`,
        fontSize: 10, color: colors.dim, gap: 12,
      }}>
        {activeSession && (
          <>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: activeSession.connected ? colors.success : colors.error }} />
              {activeSession.connected ? '已连接' : '已断开'}
            </span>
            <span>{activeSession.profile.username}@{activeSession.profile.host}:{activeSession.profile.port}</span>
            <span>cwd: {activeSession.shell.cwd}</span>
          </>
        )}
        <span style={{ flex: 1 }} />
        <span>配色: {colorScheme}</span>
        <span>字体: {fontSize}px</span>
        <span>{sessions.length} 会话</span>
        <span>WebLinuxOS SSH Terminal</span>
      </div>

      {/* Connect Dialog */}
      {showConnectDialog && renderConnectDialog()}
    </div>
  )
}
