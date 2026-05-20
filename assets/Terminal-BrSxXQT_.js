import{d as e,f as t,n,p as r}from"./index-C4Kd6qg6.js";var i=r(t(),1),a=e();function o(e,t){if(t===`/`||t===``)return e[0];let n=t.replace(/^\//,``).split(`/`),r=e[0];for(let e of n)if(!(!e||!r?.children)&&(r=r.children.find(t=>t.name===e)||null,!r))return null;return r}function s(e,t){if(t.startsWith(`/`))return t;let n=(e+`/`+t).split(`/`).filter(Boolean),r=[];for(let e of n)e===`..`?r.pop():e!==`.`&&r.push(e);return`/`+r.join(`/`)}function c(e,t){let n=o(e,t);return!n||n.type!==`folder`?`ls: 无法访问'${t}': 没有那个文件或目录`:!n.children||n.children.length===0?``:n.children.map(e=>e.name+(e.type===`folder`?`/`:``)).join(`  `)}function l(e){let t=e.split(/(\x1b\[[0-9;]*m)/),n=[],r={};for(let e=0;e<t.length;e++)if(t[e].startsWith(`\x1B[`)){let n=t[e].replace(`\x1B[`,``).replace(`m`,``);n===`0`?r={}:n===`34`?r={color:`#569cd6`}:n===`32`?r={color:`#6a9955`}:n===`31`?r={color:`#f44747`}:n===`33`?r={color:`#dcdcaa`}:n===`1`&&(r={...r,fontWeight:`bold`})}else n.push((0,a.jsx)(`span`,{style:r,children:t[e]},e));return n}async function u(){if(window.__pyodide__)return window.__pyodide__;if(window.__pyodideLoading__){for(;!window.__pyodide__;)await new Promise(e=>setTimeout(e,200));return window.__pyodide__}window.__pyodideLoading__=!0;let e=document.createElement(`script`);e.src=`https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js`,document.head.appendChild(e),await new Promise((t,n)=>{e.onload=()=>t(),e.onerror=()=>n(Error(`Failed to load Pyodide`))});let t=await window.loadPyodide({indexURL:`https://cdn.jsdelivr.net/pyodide/v0.25.1/full/`});return await t.runPythonAsync(`
import sys
sys.version_info
`),window.__pyodide__=t,window.__pyodideLoading__=!1,t}function d(){let e=n(e=>e.files),t=n(e=>e.addFile),r=n(e=>e.deleteFile),d=n(e=>e.theme),[f,p]=(0,i.useState)(`/home/user`),[m,h]=(0,i.useState)(``),[g,_]=(0,i.useState)([{input:``,output:`Web Linux 终端 v2.0
输入 "help" 查看可用命令
输入 "python" 进入 Python 环境`}]),[v,y]=(0,i.useState)([]),[b,x]=(0,i.useState)(-1),[S,C]=(0,i.useState)(!1),[w,T]=(0,i.useState)(!1),[E,D]=(0,i.useState)(!1),[O,k]=(0,i.useState)([]),A=(0,i.useRef)(null),j=(0,i.useRef)(null),M=(0,i.useRef)(null);(0,i.useEffect)(()=>{j.current&&(j.current.scrollTop=j.current.scrollHeight)},[g]),(0,i.useEffect)(()=>{A.current?.focus()},[]);let N=(0,i.useCallback)(async e=>{try{M.current||(D(!0),_(t=>[...t,{input:e,output:`⏳ 正在加载 Python 环境 (首次约需10秒)...`,isPython:!0}]),M.current=await u(),T(!0),D(!1));let t=M.current;t.globals.set(`__user_code__`,e);let n=await t.runPythonAsync(`
import sys, io
__stdout_capture__ = io.StringIO()
__stderr_capture__ = io.StringIO()
__old_stdout__ = sys.stdout
__old_stderr__ = sys.stderr
sys.stdout = __stdout_capture__
sys.stderr = __stderr_capture__
__result__ = None
__error__ = None
try:
    __result__ = eval(__user_code__)
except SyntaxError:
    try:
        exec(__user_code__)
    except Exception as e:
        __error__ = e
except Exception as e:
    __error__ = e
sys.stdout = __old_stdout__
sys.stderr = __old_stderr__
__output__ = __stdout_capture__.getvalue()
__err_output__ = __stderr_capture__.getvalue()
if __error__:
    __output__ + __err_output__ + str(type(__error__).__name__) + ': ' + str(__error__)
elif __result__ is not None:
    __output__ + __err_output__ + str(__result__)
else:
    __output__ + __err_output__
`);return String(n)||``}catch(e){return`Error: ${e.message||String(e)}`}},[]),P=(0,i.useCallback)(async n=>{let i=n.trim(),a=i.split(/\s+/),l=a[0],m=a.slice(1);if(S){if(i===`exit()`||i===`quit()`||i===`exit`||i===`quit`){C(!1),k([]),_(e=>[...e,{input:i,output:`退出 Python 环境`,isPython:!0}]);return}let e=[...O,i];k(e);let t=await N(e.join(`
`));k([]),_(e=>[...e,{input:`>>> ${i}`,output:t,isPython:!0}]);return}let h=``;switch(l){case``:break;case`python`:case`python3`:if(m.length>0&&m[0].endsWith(`.py`)){let t=o(e,s(f,m[0]));if(!t||t.type!==`file`){h=`python: 无法打开文件'${m[0]}': 没有那个文件或目录`;break}let n=t.content||``;_(e=>[...e,{input:i,output:`⏳ 正在运行 ${m[0]}...`}]);let r=await N(n);_(e=>[...e,{input:``,output:r||`(程序执行完毕，无输出)`}]);return}if(C(!0),k([]),!M.current&&!E){_(e=>[...e,{input:i,output:`Python 3.11.3 (Pyodide)
输入 Python 代码执行，输入 exit() 退出
⏳ Python 环境将在首次执行代码时加载...`,isPython:!0}]);try{D(!0),M.current=await u(),T(!0),D(!1),_(e=>[...e,{input:``,output:`✅ Python ${M.current.runPython(`import sys; sys.version.split()[0]`)} 已就绪！\n>>> `,isPython:!0}])}catch{D(!1),_(e=>[...e,{input:``,output:`❌ Python 环境加载失败，请检查网络连接`,isPython:!0}])}}else _(e=>[...e,{input:i,output:`Python 3.11.3 (Pyodide)\n输入 Python 代码执行，输入 exit() 退出${w?`
✅ Python 环境已就绪`:``}`,isPython:!0}]);return;case`help`:h=`可用命令:
  文件操作:  ls, cd, pwd, cat, echo, mkdir, touch, rm, cp, mv, find, grep
  系统信息:  uname, hostname, whoami, date, ps, top, df, free, neofetch
  网络:      ping, curl, ifconfig
  其他:      clear, history, lsb_release, tree, wc, head, tail, sort, uniq
  🐍 Python: python / python3  进入 Python 交互环境`;break;case`clear`:_([]);return;case`pwd`:h=f;break;case`whoami`:h=`user`;break;case`hostname`:h=`web-linux`;break;case`date`:h=new Date().toString();break;case`uname`:h=m.includes(`-a`)?`Linux web-linux 6.1.0-web x86_64 GNU/Linux`:`Linux`;break;case`lsb_release`:h=m.includes(`-a`)?`Distributor ID: WebLinux
Description:    Web Linux 2.0
Release:        2.0
Codename:       web`:`Web Linux 2.0`;break;case`neofetch`:h=[`            .-/+oossssoo+/-.               user@web-linux`,"        `:+ssssssssssssssssss+:`           -------------",`      -+ssssssssssssssssssssssso+-         OS: Web Linux 2.0`,`    /osssssssssssssssssssssssssso/        Kernel: 6.1.0-web`,`  /ossssssssssssssssssssssssssssso/       Shell: bash 5.2`,` :sssssssssssssssssssssssssssssssss:      DE: WebDE`,` ossssssssssssssssssssssssssssssssso      Theme: `+d,` ossssssssssssssssssssssssssssssssso      Python: 3.11.3 (Pyodide)`,` :sssssssssssssssssssssssssssssssss:      Packages: `+Math.floor(Math.random()*500+100),`  /ossssssssssssssssssssssssssssso/       Memory: `+Math.floor(Math.random()*4096+1024)+`MB / 8192MB`,`    /osssssssssssssssssssssssssso/`,`      -+ssssssssssssssssssssssso+-`,"        `:+ssssssssssssssssss+:`",`            .-/+oossssoo+/-.`].join(`
`);break;case`ls`:h=c(e,m[0]?s(f,m[0]):f);break;case`cd`:if(m.length===0)p(`/home/user`);else{let t=s(f,m[0]),n=o(e,t);n&&n.type===`folder`?p(t):h=`cd: ${m[0]}: 没有那个文件或目录`}break;case`cat`:if(m.length===0)h=`cat: 缺少操作数`;else{let t=o(e,s(f,m[0]));h=t&&t.type===`file`?t.content||``:`cat: ${m[0]}: 没有那个文件或目录`}break;case`echo`:h=m.join(` `);break;case`mkdir`:{if(m.length===0){h=`mkdir: 缺少操作数`;break}let n=s(f,m[0]).split(`/`).filter(Boolean),r=`/`+n.slice(0,-1).join(`/`)||`/`,i=n[n.length-1],a=o(e,r);a?t(a.id,i,`folder`):h=`mkdir: 无法创建目录'${m[0]}': 没有那个文件或目录`;break}case`touch`:{if(m.length===0){h=`touch: 缺少操作数`;break}let n=s(f,m[0]),r=n.split(`/`).filter(Boolean),i=`/`+r.slice(0,-1).join(`/`)||`/`,a=r[r.length-1],c=o(e,i);!o(e,n)&&c?t(c.id,a,`file`):c||(h=`touch: 无法创建'${m[0]}': 没有那个文件或目录`);break}case`rm`:{if(m.length===0){h=`rm: 缺少操作数`;break}let t=o(e,s(f,m[0]));t?r(t.id):h=`rm: 无法删除'${m[0]}': 没有那个文件或目录`;break}case`cp`:h=m.length>=2?`已复制 '${m[0]}' -> '${m[1]}'`:`cp: 用法: cp 源 目标`;break;case`mv`:h=m.length>=2?`已移动 '${m[0]}' -> '${m[1]}'`:`mv: 用法: mv 源 目标`;break;case`find`:h=m.length>0?`./${m[0]}\n./home/user/documents/${m[0]}`:`find: 缺少操作数`;break;case`grep`:h=m.length>=2?`匹配到 3 行结果:\n  第10行: ...包含"${m[0]}"的内容...\n  第25行: ...包含"${m[0]}"的内容...\n  第42行: ...包含"${m[0]}"的内容...`:`grep: 用法: grep 模式 文件`;break;case`tree`:{let t=m[0]?s(f,m[0]):f,n=o(e,t);if(!n||n.type!==`folder`){h=`tree: ${t}: 不是目录`;break}let r=(e,t)=>{if(!e.children||e.children.length===0)return``;let n=``;return e.children.forEach((i,a)=>{let o=a===e.children.length-1;n+=t+(o?`└── `:`├── `)+i.name+(i.type===`folder`?`/`:``)+`
`,i.type===`folder`&&(n+=r(i,t+(o?`    `:`│   `)))}),n};h=t+`
`+r(n,``);break}case`wc`:h=m.length>0?`  ${Math.floor(Math.random()*100+10)}  ${Math.floor(Math.random()*500+50)}  ${Math.floor(Math.random()*3e3+100)} ${m[0]}`:`wc: 缺少操作数`;break;case`head`:if(m.length===0){h=`head: 缺少操作数`;break}{let t=o(e,s(f,m[m.length-1]));if(t&&t.type===`file`){let e=(t.content||``).split(`
`),n=m.includes(`-n`)&&parseInt(m[m.indexOf(`-n`)+1])||10;h=e.slice(0,n).join(`
`)}else h=`head: ${m[m.length-1]}: 没有那个文件或目录`}break;case`tail`:if(m.length===0){h=`tail: 缺少操作数`;break}{let t=o(e,s(f,m[m.length-1]));if(t&&t.type===`file`){let e=(t.content||``).split(`
`),n=m.includes(`-n`)&&parseInt(m[m.indexOf(`-n`)+1])||10;h=e.slice(-n).join(`
`)}else h=`tail: ${m[m.length-1]}: 没有那个文件或目录`}break;case`sort`:h=m.length>0?`(排序输出)`:`sort: 缺少操作数`;break;case`uniq`:h=m.length>0?`(去重输出)`:`uniq: 缺少操作数`;break;case`ps`:h=`  PID TTY          TIME CMD
    1 ?        00:00:01 systemd
  234 ?        00:00:00 terminal
  567 ?        00:00:05 browser
  890 ?        00:00:02 file-manager`;break;case`top`:h=`top - ${new Date().toLocaleTimeString()} up ${Math.floor(Math.random()*24)}:${String(Math.floor(Math.random()*60)).padStart(2,`0`)}, 1 user\nTasks: ${Math.floor(Math.random()*50+50)} total\n%Cpu(s): ${(Math.random()*20+5).toFixed(1)} us, ${(Math.random()*5).toFixed(1)} sy\nMiB Mem: ${(Math.random()*2e3+6e3).toFixed(1)} total, ${(Math.random()*3e3).toFixed(1)} free`;break;case`df`:h=`文件系统           大小  已用  可用 使用%
/dev/sda1          50G   12G   38G   24%
tmpfs             3.9G  1.2M  3.9G    1%`;break;case`free`:h=`              总计         已用         空闲\n内存:       ${Math.floor(Math.random()*4e3+4e3)}MB      ${Math.floor(Math.random()*3e3)}MB      ${Math.floor(Math.random()*3e3)}MB\n交换:       ${Math.floor(Math.random()*2e3+1e3)}MB           0MB      ${Math.floor(Math.random()*2e3+1e3)}MB`;break;case`history`:h=v.map((e,t)=>`  ${t+1}  ${e}`).join(`
`);break;case`ping`:if(m.length===0){h=`ping: 用法: ping 目标地址`;break}h=`PING ${m[0]} 56(84) bytes of data.\n64 bytes from ${m[0]}: icmp_seq=1 ttl=64 time=${(Math.random()*30+10).toFixed(1)} ms\n64 bytes from ${m[0]}: icmp_seq=2 ttl=64 time=${(Math.random()*30+10).toFixed(1)} ms\n64 bytes from ${m[0]}: icmp_seq=3 ttl=64 time=${(Math.random()*30+10).toFixed(1)} ms`;break;case`curl`:h=m.length>0?`curl: (模拟) 请求 ${m[0]}...\n<html><body><h1>模拟响应</h1></body></html>`:`curl: 用法: curl URL`;break;case`ifconfig`:h=`eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.100  netmask 255.255.255.0
        inet6 fe80::1  prefixlen 64
        ether 00:11:22:33:44:55  txqueuelen 1000
lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0`;break;case`which`:if(m.length===0){h=`which: 缺少参数`;break}h=[`python`,`python3`,`ls`,`cd`,`cat`,`echo`,`mkdir`,`rm`,`grep`,`find`,`curl`,`ping`].includes(m[0])?`/usr/bin/${m[0]}`:`${m[0]} not found`;break;case`env`:h=`USER=user
HOME=/home/user
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
LANG=zh_CN.UTF-8
TERM=xterm-256color
PYTHON_VERSION=3.11.3`;break;case`export`:h=m.length>0?`已设置环境变量: ${m[0]}`:`export: 缺少参数`;break;case`chmod`:h=m.length>=2?`已更改 '${m[1]}' 权限为 ${m[0]}`:`chmod: 用法: chmod 权限 文件`;break;case`man`:h=m.length>0?`${m[0].toUpperCase()}(1)\n\n名称\n    ${m[0]} - 系统命令\n\n描述\n    请使用 --help 查看详细帮助`:`你想查看哪个命令的手册？`;break;case`apt`:case`apt-get`:h=m.includes(`update`)?`正在读取软件包列表... 完成
正在分析软件包的依赖关系树... 完成
所有软件包均为最新版本。`:m.includes(`install`)?`正在读取软件包列表... 完成\n正在安装 ${m[m.indexOf(`install`)+1]||`软件包`}...\n已设置 ${m[m.indexOf(`install`)+1]||`软件包`}。`:`apt: 用法: apt [update|install|remove] [软件包]`;break;case`pip`:case`pip3`:if(m.length===0){h=`pip: 用法: pip [install|list|show] [包名]`;break}h=m[0]===`list`?`Package          Version
---------------- -------
numpy            1.24.3
pandas           2.0.3
matplotlib       3.7.2
requests         2.31.0
flask            3.0.0`:m[0]===`install`?`Collecting ${m[1]||`package`}\n  Downloading ${m[1]||`package`}-latest.tar.gz\nInstalling collected packages: ${m[1]||`package`}\nSuccessfully installed ${m[1]||`package`}-latest`:`pip: 未知命令`;break;case`git`:h=m.length===0?`usage: git [--version] [--help] <command> [<args>]

常用命令:
   init       创建新仓库
   clone      克隆仓库
   add        添加到暂存区
   commit     提交更改
   push       推送到远程
   pull       拉取远程更改
   log        查看提交历史
   status     查看工作区状态`:m[0]===`version`?`git version 2.40.0`:m[0]===`status`?`On branch main
nothing to commit, working tree clean`:m[0]===`log`?`commit a1b2c3d (HEAD -> main)
Author: user <user@web-linux>
Date:   `+new Date().toISOString().slice(0,10)+`

    Initial commit`:m[0]===`init`?`已初始化 Git 仓库于 /home/user/.git/`:`git: '${m[0]}' 已模拟执行`;break;case`node`:h=m.length===0?`Welcome to Node.js v20.10.0
> `:`Node.js 执行: ${m.join(` `)}\n(模拟输出)`;break;case`npm`:h=m.length===0?`npm v10.2.0`:`npm ${m[0]}: 已模拟执行`;break;default:h=`bash: ${l}: 未找到命令。输入 'help' 查看可用命令`}_(e=>[...e,{input:i,output:h}])},[f,e,t,r,v,d,S,E,w,N,O]);return(0,a.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,height:`100%`,background:`#1a1a2e`,color:`#e0e0e0`,fontFamily:`"Fira Code", "Cascadia Code", Consolas, monospace`,fontSize:13,overflow:`hidden`},onClick:()=>A.current?.focus(),children:[(0,a.jsx)(`div`,{ref:j,style:{flex:1,overflowY:`auto`,padding:`12px 16px`,whiteSpace:`pre-wrap`,wordBreak:`break-all`,lineHeight:1.5},children:g.map((e,t)=>(0,a.jsxs)(`div`,{style:{marginBottom:2},children:[e.input&&(0,a.jsxs)(`div`,{children:[!e.isPython&&(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(`span`,{style:{color:`#569cd6`},children:`user@`}),(0,a.jsx)(`span`,{style:{color:`#6a9955`},children:`web-linux`}),(0,a.jsx)(`span`,{style:{color:`#d4d4d4`},children:`:`}),(0,a.jsx)(`span`,{style:{color:`#569cd6`},children:f}),(0,a.jsx)(`span`,{style:{color:`#d4d4d4`},children:`$ `})]}),(0,a.jsx)(`span`,{style:e.isPython?{color:`#ffd700`}:void 0,children:e.input})]}),e.output&&(0,a.jsx)(`div`,{style:{color:e.isPython?`#e0e0e0`:void 0},children:l(e.output)})]},t))}),(0,a.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,padding:`4px 16px 8px`,borderTop:`1px solid rgba(255,255,255,0.06)`},children:[S?(0,a.jsx)(`span`,{style:{color:`#ffd700`,whiteSpace:`nowrap`},children:`>>> `}):(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(`span`,{style:{color:`#569cd6`,whiteSpace:`nowrap`},children:`user@`}),(0,a.jsx)(`span`,{style:{color:`#6a9955`,whiteSpace:`nowrap`},children:`web-linux`}),(0,a.jsx)(`span`,{style:{color:`#d4d4d4`,whiteSpace:`nowrap`},children:`:`}),(0,a.jsx)(`span`,{style:{color:`#569cd6`,whiteSpace:`nowrap`},children:f}),(0,a.jsx)(`span`,{style:{color:`#d4d4d4`,whiteSpace:`nowrap`},children:`$\xA0`})]}),(0,a.jsx)(`input`,{ref:A,type:`text`,value:m,onChange:e=>h(e.target.value),onKeyDown:e=>{if(e.key===`Enter`){let e=m.trim();e&&(y(t=>[...t,e]),x(-1)),P(e),h(``)}else if(e.key===`ArrowUp`){if(e.preventDefault(),v.length>0){let e=b===-1?v.length-1:Math.max(0,b-1);x(e),h(v[e])}}else if(e.key===`ArrowDown`){if(e.preventDefault(),b>=0){let e=b+1;e>=v.length?(x(-1),h(``)):(x(e),h(v[e]))}}else if(e.key===`Tab`){e.preventDefault();let t=`ls.cd.pwd.cat.echo.mkdir.touch.rm.cp.mv.find.grep.python.python3.clear.help.history.tree.head.tail.ps.top.df.free.ping.curl.ifconfig.git.node.npm.pip.pip3.apt.man.which.env.export.chmod.uname.whoami.date.hostname.neofetch.sort.uniq.wc`.split(`.`),n=m.trim();if(n){let e=t.filter(e=>e.startsWith(n));e.length===1?h(e[0]+` `):e.length>1&&_(t=>[...t,{input:``,output:e.join(`  `)}])}}},style:{flex:1,background:`transparent`,border:`none`,outline:`none`,color:S?`#ffd700`:`#00ff00`,fontFamily:`inherit`,fontSize:`inherit`,caretColor:S?`#ffd700`:`#00ff00`},spellCheck:!1,placeholder:S?`输入 Python 代码...`:``}),E&&(0,a.jsx)(`span`,{style:{color:`#ffd700`,fontSize:11,animation:`blink 1s infinite`},children:`⏳ 加载Python...`}),S&&w&&(0,a.jsx)(`span`,{style:{color:`#4ecca3`,fontSize:11},children:`🐍 Python就绪`})]}),(0,a.jsx)(`style`,{children:`@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`})]})}export{d as default};