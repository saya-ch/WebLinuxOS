import{d as e,f as t,p as n}from"./index-C4Kd6qg6.js";var r=n(t(),1),i=e(),a=[{id:`1`,from:`张三 <zhangsan@example.com>`,to:`me@linux.local`,subject:`项目进度更新`,body:`你好，

本周项目进展顺利，前端部分已完成80%，预计下周可以进入测试阶段。

请查看附件中的详细进度报告。

此致
张三`,date:`2025-01-15 09:30`,read:!1,starred:!0,folder:`inbox`},{id:`2`,from:`李四 <lisi@example.com>`,to:`me@linux.local`,subject:`会议邀请：技术评审`,body:`你好，

诚邀你参加本周五下午2点的技术评审会议。

会议地点：3号会议室
议题：新架构方案讨论

请准时参加。

李四`,date:`2025-01-14 14:20`,read:!1,starred:!1,folder:`inbox`},{id:`3`,from:`系统通知 <noreply@system.local>`,to:`me@linux.local`,subject:`您的账户安全提醒`,body:`尊敬的用户，

我们检测到您的账户在新设备上登录。如果这不是您本人操作，请立即修改密码。

登录时间：2025-01-14 08:15
登录地点：北京
IP地址：192.168.1.100

安全团队`,date:`2025-01-14 08:15`,read:!0,starred:!1,folder:`inbox`},{id:`4`,from:`王五 <wangwu@example.com>`,to:`me@linux.local`,subject:`关于代码审查的反馈`,body:`你好，

我已审查了你提交的PR，总体写得很好。有几处建议：

1. 建议将工具函数提取到单独模块
2. 错误处理可以更完善
3. 建议增加单元测试

详细评论已在PR中标注。

王五`,date:`2025-01-13 16:45`,read:!0,starred:!0,folder:`inbox`},{id:`5`,from:`me@linux.local`,to:`zhangsan@example.com`,subject:`Re: 项目进度更新`,body:`张三你好，

收到进度报告，辛苦了！

关于测试阶段，建议提前准备测试用例。我这边会协调QA团队配合。

谢谢`,date:`2025-01-15 10:00`,read:!0,starred:!1,folder:`sent`},{id:`6`,from:`me@linux.local`,to:`team@example.com`,subject:`团队周报 - 第3周`,body:`各位同事，

本周工作总结：
1. 完成用户模块重构
2. 修复了5个关键bug
3. 性能优化提升30%

下周计划：
1. 完成支付模块开发
2. 集成测试
3. 文档更新

谢谢大家的努力！`,date:`2025-01-12 18:00`,read:!0,starred:!1,folder:`sent`}];function o(){let[e,t]=(0,r.useState)(a),[n,o]=(0,r.useState)(null),[c,l]=(0,r.useState)(`inbox`),[u,d]=(0,r.useState)(!1),[f,p]=(0,r.useState)(``),[m,h]=(0,r.useState)(``),[g,_]=(0,r.useState)(``),[v,y]=(0,r.useState)(``),[b,x]=(0,r.useState)(null),S=e.find(e=>e.id===n)||null,C=e.filter(e=>e.folder===c).filter(e=>!f||e.subject.toLowerCase().includes(f.toLowerCase())||e.from.toLowerCase().includes(f.toLowerCase())||e.body.toLowerCase().includes(f.toLowerCase())),w=e.filter(e=>e.folder===`inbox`&&!e.read).length,T=e=>{o(e),t(t=>t.map(t=>t.id===e?{...t,read:!0}:t))},E=(e,n)=>{n?.stopPropagation(),t(t=>t.map(t=>t.id===e?{...t,starred:!t.starred}:t))},D=e=>{t(t=>t.filter(t=>t.id!==e)),n===e&&o(null)},O=()=>{d(!0),x(null),h(``),_(``),y(``)},k=e=>{d(!0),x(e),h(e.from.includes(`<`)&&e.from.match(/<(.+)>/)?.[1]||e.from),_(`Re: ${e.subject.replace(/^Re:\s*/i,``)}`),y(`\n\n--- 原始邮件 ---\n发件人: ${e.from}\n日期: ${e.date}\n\n${e.body}`)};return(0,i.jsxs)(`div`,{style:{display:`flex`,height:`100%`,background:`#1e1e2e`,color:`#cdd6f4`,fontFamily:`sans-serif`,fontSize:13},children:[(0,i.jsxs)(`div`,{style:{width:160,background:`#181825`,borderRight:`1px solid #313244`,display:`flex`,flexDirection:`column`,flexShrink:0},children:[(0,i.jsx)(`div`,{style:{padding:12},children:(0,i.jsx)(`button`,{onClick:O,style:{width:`100%`,padding:`8px`,background:`#89b4fa`,color:`#1e1e2e`,border:`none`,borderRadius:6,cursor:`pointer`,fontWeight:600,fontSize:13},children:`✉️ 写邮件`})}),[{key:`inbox`,label:`收件箱`,icon:`📥`},{key:`sent`,label:`已发送`,icon:`📤`},{key:`drafts`,label:`草稿箱`,icon:`📝`}].map(e=>(0,i.jsxs)(`div`,{onClick:()=>{l(e.key),o(null)},style:{padding:`10px 16px`,cursor:`pointer`,display:`flex`,justifyContent:`space-between`,alignItems:`center`,background:c===e.key?`#313244`:`transparent`,borderLeft:c===e.key?`3px solid #89b4fa`:`3px solid transparent`},children:[(0,i.jsxs)(`span`,{children:[e.icon,` `,e.label]}),e.key===`inbox`&&w>0&&(0,i.jsx)(`span`,{style:{background:`#f38ba8`,color:`#1e1e2e`,borderRadius:10,padding:`1px 6px`,fontSize:11,fontWeight:600},children:w})]},e.key))]}),(0,i.jsxs)(`div`,{style:{width:280,borderRight:`1px solid #313244`,display:`flex`,flexDirection:`column`,flexShrink:0},children:[(0,i.jsx)(`div`,{style:{padding:`8px 10px`,borderBottom:`1px solid #313244`},children:(0,i.jsx)(`input`,{type:`text`,placeholder:`搜索邮件...`,value:f,onChange:e=>p(e.target.value),style:{width:`100%`,padding:`6px 10px`,borderRadius:4,border:`1px solid #45475a`,background:`#181825`,color:`#cdd6f4`,fontSize:12,boxSizing:`border-box`,outline:`none`}})}),(0,i.jsxs)(`div`,{style:{flex:1,overflow:`auto`},children:[C.map(e=>(0,i.jsxs)(`div`,{onClick:()=>T(e.id),style:{padding:`10px 12px`,cursor:`pointer`,borderBottom:`1px solid #313244`,background:n===e.id?`#313244`:e.read?`transparent`:`#1e1e2e`,borderLeft:e.read?`3px solid transparent`:`3px solid #89b4fa`},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,marginBottom:2},children:[(0,i.jsx)(`span`,{style:{fontWeight:e.read?400:700,fontSize:12,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`,flex:1},children:c===`sent`?e.to:e.from.split(`<`)[0].trim()}),(0,i.jsx)(`span`,{onClick:t=>E(e.id,t),style:{cursor:`pointer`,fontSize:12,flexShrink:0},children:e.starred?`⭐`:`☆`})]}),(0,i.jsx)(`div`,{style:{fontWeight:e.read?400:600,fontSize:12,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`,marginBottom:2},children:e.subject}),(0,i.jsx)(`div`,{style:{fontSize:11,color:`#6c7086`,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`},children:e.body.split(`
`)[0].substring(0,50)}),(0,i.jsx)(`div`,{style:{fontSize:10,color:`#585b70`,marginTop:4},children:e.date})]},e.id)),C.length===0&&(0,i.jsx)(`div`,{style:{padding:24,textAlign:`center`,color:`#6c7086`,fontSize:12},children:f?`未找到匹配的邮件`:`暂无邮件`})]})]}),(0,i.jsx)(`div`,{style:{flex:1,display:`flex`,flexDirection:`column`,overflow:`hidden`},children:u?(0,i.jsxs)(`div`,{style:{flex:1,display:`flex`,flexDirection:`column`,padding:16},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,marginBottom:12},children:[(0,i.jsx)(`span`,{style:{fontWeight:700,fontSize:16},children:b?`回复邮件`:`新邮件`}),(0,i.jsx)(`button`,{onClick:()=>{d(!1),x(null)},style:{background:`none`,border:`none`,color:`#6c7086`,cursor:`pointer`,fontSize:16},children:`✕`})]}),(0,i.jsx)(`div`,{style:{marginBottom:8},children:(0,i.jsx)(`input`,{type:`text`,placeholder:`收件人`,value:m,onChange:e=>h(e.target.value),style:{width:`100%`,padding:`8px 10px`,borderRadius:4,border:`1px solid #45475a`,background:`#181825`,color:`#cdd6f4`,fontSize:13,boxSizing:`border-box`,outline:`none`}})}),(0,i.jsx)(`div`,{style:{marginBottom:8},children:(0,i.jsx)(`input`,{type:`text`,placeholder:`主题`,value:g,onChange:e=>_(e.target.value),style:{width:`100%`,padding:`8px 10px`,borderRadius:4,border:`1px solid #45475a`,background:`#181825`,color:`#cdd6f4`,fontSize:13,boxSizing:`border-box`,outline:`none`}})}),(0,i.jsx)(`div`,{style:{flex:1,marginBottom:12},children:(0,i.jsx)(`textarea`,{placeholder:`正文...`,value:v,onChange:e=>y(e.target.value),style:{width:`100%`,height:`100%`,padding:`10px`,borderRadius:4,border:`1px solid #45475a`,background:`#181825`,color:`#cdd6f4`,fontSize:13,boxSizing:`border-box`,outline:`none`,resize:`none`,lineHeight:1.6}})}),(0,i.jsxs)(`div`,{style:{display:`flex`,gap:8},children:[(0,i.jsx)(`button`,{onClick:()=>{if(!m.trim()||!g.trim())return;let e={id:Date.now().toString(),from:`me@linux.local`,to:m,subject:g,body:v,date:new Date().toLocaleString(`zh-CN`),read:!0,starred:!1,folder:`sent`};t(t=>[e,...t]),d(!1),x(null),l(`sent`),o(e.id)},disabled:!m.trim()||!g.trim(),style:{padding:`8px 20px`,background:!m.trim()||!g.trim()?`#45475a`:`#89b4fa`,color:`#1e1e2e`,border:`none`,borderRadius:6,cursor:`pointer`,fontWeight:600,fontSize:13},children:`发送`}),(0,i.jsx)(`button`,{onClick:()=>{d(!1),x(null)},style:{padding:`8px 20px`,background:`transparent`,border:`1px solid #45475a`,color:`#cdd6f4`,borderRadius:6,cursor:`pointer`,fontSize:13},children:`取消`})]})]}):S?(0,i.jsxs)(`div`,{style:{flex:1,overflow:`auto`,padding:16},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`flex-start`,marginBottom:16},children:[(0,i.jsxs)(`div`,{children:[(0,i.jsx)(`h2`,{style:{margin:`0 0 8px`,fontSize:18,fontWeight:700},children:S.subject}),(0,i.jsxs)(`div`,{style:{fontSize:12,color:`#a6adc8`},children:[(0,i.jsxs)(`div`,{children:[`发件人: `,S.from]}),(0,i.jsxs)(`div`,{children:[`收件人: `,S.to]}),(0,i.jsxs)(`div`,{children:[`日期: `,S.date]})]})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,gap:6,flexShrink:0},children:[(0,i.jsx)(`button`,{onClick:()=>E(S.id),style:s,children:S.starred?`⭐`:`☆`}),(0,i.jsx)(`button`,{onClick:()=>k(S),style:s,children:`↩ 回复`}),(0,i.jsx)(`button`,{onClick:()=>D(S.id),style:{...s,color:`#f38ba8`},children:`🗑️`})]})]}),(0,i.jsx)(`div`,{style:{borderTop:`1px solid #313244`,paddingTop:16,whiteSpace:`pre-wrap`,lineHeight:1.8,fontSize:13},children:S.body})]}):(0,i.jsx)(`div`,{style:{flex:1,display:`flex`,alignItems:`center`,justifyContent:`center`,color:`#6c7086`},children:(0,i.jsxs)(`div`,{style:{textAlign:`center`},children:[(0,i.jsx)(`div`,{style:{fontSize:48,marginBottom:12},children:`📧`}),(0,i.jsx)(`div`,{style:{fontSize:14},children:`选择一封邮件查看`})]})})})]})}var s={padding:`4px 10px`,background:`transparent`,border:`1px solid #45475a`,color:`#cdd6f4`,borderRadius:4,cursor:`pointer`,fontSize:12};export{o as default};