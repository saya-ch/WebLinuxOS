import{c as e,l as t,s as n}from"./index-Bwu-xPn1.js";var r=t(e(),1),i=n(),a=[{id:`e1`,from:`张伟`,fromAvatar:`👨`,subject:`项目进度更新`,preview:`本周项目进展顺利，已经完成了前端界面的初步设计...`,date:`10:30`,read:!1,starred:!0,folder:`inbox`,body:`你好！

本周项目进展顺利，已经完成了前端界面的初步设计。

我们计划在下周开始后端API的集成工作。如果你有任何建议或疑问，欢迎随时提出。

祝好，
张伟`},{id:`e2`,from:`李娜`,fromAvatar:`👩`,subject:`会议纪要 - 2024年Q2规划`,preview:`感谢大家参加今天的会议，以下是会议要点总结...`,date:`09:15`,read:!1,starred:!1,folder:`inbox`,body:`大家好，

感谢大家参加今天的会议。以下是会议要点总结：

1. Q2目标：完成核心功能开发
2. 时间节点：6月底前完成测试
3. 资源分配：增加2名开发人员

请各团队按照分工推进。

李娜`},{id:`e3`,from:`王强`,fromAvatar:`🧔`,subject:`代码审查请求`,preview:`请帮忙审查一下我提交的代码，主要涉及用户认证模块...`,date:`昨天`,read:!0,starred:!1,folder:`inbox`,body:`你好，

请帮忙审查一下我提交的代码，主要涉及用户认证模块的重构。

PR链接：https://github.com/example/pr/123

主要改动：
- 重构了登录逻辑
- 添加了JWT token刷新机制
- 修复了remember me功能

谢谢！
王强`},{id:`e4`,from:`赵敏`,fromAvatar:`👱`,subject:`设计稿已更新`,preview:`根据上次反馈，我已经更新了首页的设计稿，请查看附件...`,date:`昨天`,read:!0,starred:!0,folder:`inbox`,body:`Hi，

根据上次反馈，我已经更新了首页的设计稿。

主要调整：
1. 优化了导航栏的布局
2. 调整了配色方案
3. 增加了动画过渡效果

设计稿链接：https://figma.com/example

期待你的反馈！
赵敏`},{id:`e5`,from:`系统通知`,fromAvatar:`🧑`,subject:`安全更新提醒`,preview:`您的系统有3个安全更新等待安装，请及时更新...`,date:`周一`,read:!0,starred:!1,folder:`inbox`,body:`系统通知

您的系统有3个安全更新等待安装：

1. OpenSSL 安全补丁 (CVE-2024-1234)
2. 内核更新 5.15.0-91
3. 系统库 libc 更新

请及时更新以确保系统安全。

-- Web Linux 系统管理`},{id:`e6`,from:`陈明`,fromAvatar:`👴`,subject:`生日快乐！`,preview:`祝生日快乐！希望新的一年里事事顺心，阖家幸福...`,date:`周一`,read:!0,starred:!1,folder:`inbox`,body:`生日快乐！🎂

希望新的一年里事事顺心，阖家幸福。

有空一起吃饭聚聚！

陈明`},{id:`e7`,from:`你`,fromAvatar:`👤`,subject:`Re: 项目进度更新`,preview:`收到，整体进展不错，继续保持这个节奏...`,date:`10:45`,read:!0,starred:!1,folder:`sent`,body:`收到，整体进展不错，继续保持这个节奏。

后端API方面有什么需要协调的随时沟通。

另外请关注一下性能优化的需求。`},{id:`e8`,from:`你`,fromAvatar:`👤`,subject:`草稿：周报`,preview:`本周工作总结：1.完成前端框架搭建 2.修复了3个...`,date:`未发送`,read:!0,starred:!1,folder:`drafts`,body:`本周工作总结：
1.完成前端框架搭建
2.修复了3个关键bug
3.代码审查完成
4.下周计划...

（待补充）`},{id:`e9`,from:`未知发件人`,fromAvatar:`👵`,subject:`恭喜！您中奖了！`,preview:`恭喜您获得了100万大奖！请点击链接领取...`,date:`3天前`,read:!0,starred:!1,folder:`spam`,body:`恭喜！您中奖了！

您获得了我们平台的100万大奖！

请点击以下链接领取：
http://fake-spam-site.example.com

（此为垃圾邮件示例）`}];function o(){let[e]=(0,r.useState)(a),[t,n]=(0,r.useState)(`inbox`),[o,l]=(0,r.useState)(null),[u,d]=(0,r.useState)(!1),[f,p]=(0,r.useState)(``),[m,h]=(0,r.useState)(new Set(e.filter(e=>e.read).map(e=>e.id))),g=e.filter(e=>e.folder===t).filter(e=>{if(!f)return!0;let t=f.toLowerCase();return e.subject.toLowerCase().includes(t)||e.from.toLowerCase().includes(t)||e.preview.toLowerCase().includes(t)}),_=o?e.find(e=>e.id===o):null,v=[{id:`inbox`,name:`收件箱`,icon:`📥`,count:e.filter(e=>e.folder===`inbox`&&!m.has(e.id)).length},{id:`sent`,name:`已发送`,icon:`📤`,count:e.filter(e=>e.folder===`sent`).length},{id:`drafts`,name:`草稿箱`,icon:`📝`,count:e.filter(e=>e.folder===`drafts`).length},{id:`spam`,name:`垃圾邮件`,icon:`🚫`,count:e.filter(e=>e.folder===`spam`).length}],y=e=>{l(e),h(t=>new Set([...t,e]))};return(0,i.jsxs)(`div`,{style:{display:`flex`,height:`100%`,background:`#1e1e1e`,color:`#d4d4d4`,fontFamily:`sans-serif`},children:[(0,i.jsxs)(`div`,{style:{width:180,background:`#252526`,borderRight:`1px solid #333`,display:`flex`,flexDirection:`column`,flexShrink:0},children:[(0,i.jsx)(`div`,{style:{padding:`12px 12px 8px`},children:(0,i.jsx)(`button`,{onClick:()=>d(!u),style:{width:`100%`,padding:`8px 16px`,background:`#007acc`,border:`none`,borderRadius:4,color:`#fff`,cursor:`pointer`,fontSize:13,fontWeight:600},children:`✏️ 新建邮件`})}),(0,i.jsx)(`div`,{style:{padding:`0 8px`},children:(0,i.jsx)(`input`,{value:f,onChange:e=>p(e.target.value),placeholder:`搜索邮件...`,style:{width:`100%`,padding:`5px 10px`,border:`1px solid #444`,borderRadius:4,background:`#1e1e1e`,color:`#ccc`,fontSize:12,outline:`none`,boxSizing:`border-box`}})}),(0,i.jsx)(`div`,{style:{padding:`8px 0`,flex:1,overflow:`auto`},children:v.map(e=>(0,i.jsxs)(`div`,{style:{padding:`7px 14px`,cursor:`pointer`,display:`flex`,alignItems:`center`,gap:8,background:t===e.id?`#094771`:`transparent`,borderLeft:t===e.id?`3px solid #007acc`:`3px solid transparent`,fontSize:13},onClick:()=>{n(e.id),l(null)},onMouseEnter:n=>{t!==e.id&&(n.currentTarget.style.background=`#2a2d2e`)},onMouseLeave:n=>{t!==e.id&&(n.currentTarget.style.background=`transparent`)},children:[(0,i.jsx)(`span`,{children:e.icon}),(0,i.jsx)(`span`,{style:{flex:1},children:e.name}),e.count>0&&(0,i.jsx)(`span`,{style:{background:`#007acc`,color:`#fff`,borderRadius:10,padding:`1px 7px`,fontSize:10,fontWeight:600},children:e.count})]},e.id))})]}),(0,i.jsxs)(`div`,{style:{width:320,background:`#1e1e1e`,borderRight:`1px solid #333`,display:`flex`,flexDirection:`column`,overflow:`hidden`,flexShrink:0},children:[(0,i.jsxs)(`div`,{style:{padding:`10px 14px`,fontWeight:600,fontSize:14,borderBottom:`1px solid #333`,display:`flex`,alignItems:`center`,justifyContent:`space-between`},children:[(0,i.jsx)(`span`,{children:v.find(e=>e.id===t)?.name}),(0,i.jsxs)(`span`,{style:{fontSize:11,color:`#888`},children:[g.length,` 封`]})]}),(0,i.jsxs)(`div`,{style:{flex:1,overflow:`auto`},children:[g.map(e=>(0,i.jsxs)(`div`,{style:{padding:`10px 14px`,cursor:`pointer`,borderBottom:`1px solid #333`,background:o===e.id?`#094771`:`transparent`,display:`flex`,gap:10},onClick:()=>y(e.id),onMouseEnter:t=>{o!==e.id&&(t.currentTarget.style.background=`#252526`)},onMouseLeave:t=>{o!==e.id&&(t.currentTarget.style.background=`transparent`)},children:[(0,i.jsx)(`div`,{style:{fontSize:20,flexShrink:0},children:e.fromAvatar}),(0,i.jsxs)(`div`,{style:{flex:1,overflow:`hidden`},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:6,marginBottom:2},children:[(0,i.jsx)(`span`,{style:{fontSize:13,fontWeight:m.has(e.id)?400:700,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`,flex:1},children:e.from}),e.starred&&(0,i.jsx)(`span`,{style:{fontSize:12},children:`⭐`}),!m.has(e.id)&&(0,i.jsx)(`span`,{style:{width:8,height:8,borderRadius:`50%`,background:`#007acc`,flexShrink:0}}),(0,i.jsx)(`span`,{style:{fontSize:10,color:`#888`,flexShrink:0},children:e.date})]}),(0,i.jsx)(`div`,{style:{fontSize:12,fontWeight:m.has(e.id)?400:600,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`,marginBottom:2},children:e.subject}),(0,i.jsx)(`div`,{style:{fontSize:11,color:`#888`,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`},children:e.preview})]})]},e.id)),g.length===0&&(0,i.jsx)(`div`,{style:{padding:30,textAlign:`center`,color:`#666`,fontSize:13},children:`没有邮件`})]})]}),(0,i.jsx)(`div`,{style:{flex:1,display:`flex`,flexDirection:`column`,overflow:`hidden`},children:_&&!u?(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(`div`,{style:{padding:`14px 20px`,borderBottom:`1px solid #333`},children:[(0,i.jsx)(`div`,{style:{fontSize:18,fontWeight:600,marginBottom:8},children:_.subject}),(0,i.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:10},children:[(0,i.jsx)(`span`,{style:{fontSize:24},children:_.fromAvatar}),(0,i.jsxs)(`div`,{style:{flex:1},children:[(0,i.jsx)(`div`,{style:{fontSize:13,fontWeight:600},children:_.from}),(0,i.jsx)(`div`,{style:{fontSize:11,color:`#888`},children:_.date})]}),(0,i.jsx)(`button`,{onClick:()=>l(null),style:s,children:`✕`})]})]}),(0,i.jsx)(`div`,{style:{flex:1,padding:`20px 24px`,overflow:`auto`,whiteSpace:`pre-wrap`,fontSize:14,lineHeight:1.8},children:_.body})]}):u?(0,i.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,height:`100%`,padding:16},children:[(0,i.jsx)(`div`,{style:{fontSize:16,fontWeight:600,marginBottom:14},children:`新建邮件`}),(0,i.jsx)(`input`,{placeholder:`收件人`,style:c}),(0,i.jsx)(`input`,{placeholder:`主题`,style:c}),(0,i.jsx)(`textarea`,{placeholder:`邮件内容...`,style:{...c,flex:1,resize:`none`,fontFamily:`sans-serif`}}),(0,i.jsxs)(`div`,{style:{display:`flex`,gap:8,marginTop:10},children:[(0,i.jsx)(`button`,{onClick:()=>d(!1),style:{...c,width:`auto`,padding:`8px 24px`,background:`#007acc`,border:`none`,color:`#fff`,cursor:`pointer`,borderRadius:4},children:`发送`}),(0,i.jsx)(`button`,{onClick:()=>d(!1),style:{...c,width:`auto`,padding:`8px 24px`,background:`#555`,border:`none`,color:`#ccc`,cursor:`pointer`,borderRadius:4},children:`取消`})]})]}):(0,i.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,justifyContent:`center`,height:`100%`,color:`#666`,fontSize:14,flexDirection:`column`,gap:8},children:[(0,i.jsx)(`div`,{style:{fontSize:48,opacity:.3},children:`📧`}),(0,i.jsx)(`div`,{children:`选择一封邮件查看内容`}),(0,i.jsx)(`div`,{style:{fontSize:11,color:`#444`},children:`或点击"新建邮件"开始撰写`})]})})]})}var s={background:`transparent`,border:`1px solid #555`,color:`#aaa`,cursor:`pointer`,padding:`3px 10px`,borderRadius:3,fontSize:14},c={width:`100%`,padding:`8px 12px`,border:`1px solid #444`,borderRadius:4,background:`#2d2d2d`,color:`#d4d4d4`,fontSize:13,outline:`none`,marginBottom:8,boxSizing:`border-box`};export{o as default};