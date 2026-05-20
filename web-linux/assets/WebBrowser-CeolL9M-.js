import{f as e,m as t,p as n}from"./index-BKI3LvoG.js";var r=t(n(),1),i=e(),a=`
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: #fff; }
    .container { text-align: center; max-width: 600px; padding: 40px; }
    h1 { font-size: 36px; margin-bottom: 12px; background: linear-gradient(90deg, #e94560, #f5c542, #4ecca3); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .search-box { display: flex; margin: 24px 0; background: rgba(255,255,255,0.1); border-radius: 24px; padding: 4px; }
    .search-box input { flex: 1; padding: 12px 20px; border: none; outline: none; background: transparent; color: #fff; font-size: 16px; }
    .search-box button { padding: 10px 24px; border: none; border-radius: 20px; background: #e94560; color: #fff; cursor: pointer; font-size: 14px; }
    .links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 32px; }
    .link-card { padding: 16px; border-radius: 12px; background: rgba(255,255,255,0.08); cursor: pointer; transition: 0.2s; text-decoration: none; color: #ccc; text-align: left; }
    .link-card:hover { background: rgba(255,255,255,0.15); }
    .link-card .title { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 4px; }
    .link-card .url { font-size: 11px; color: #888; }
  </style>
  <title>Web Linux 浏览器</title>
</head>
<body>
  <div class="container">
    <h1>🌐 Web Linux 浏览器</h1>
    <p style="color:#aaa;margin-bottom:8px;">欢迎使用内置浏览器</p>
    <div class="search-box">
      <input type="text" placeholder="输入网址或搜索内容..." id="urlInput" />
      <button onclick="navigate()">前往</button>
    </div>
    <div class="links">
      <div class="link-card"><div class="title">📚 文档</div><div class="url">docs.example.com</div></div>
      <div class="link-card"><div class="title">💬 社区</div><div class="url">community.example.com</div></div>
      <div class="link-card"><div class="title">📦 资源</div><div class="url">resources.example.com</div></div>
      <div class="link-card"><div class="title">⚙️ 设置</div><div class="url">settings.example.com</div></div>
    </div>
  </div>
</body>
</html>`,o=[{name:`🏠 主页`,url:`about:blank`},{name:`🔍 搜索`,url:`https://www.google.com`},{name:`📖 文档`,url:`https://developer.mozilla.org`},{name:`💻 GitHub`,url:`https://github.com`},{name:`📰 新闻`,url:`https://news.ycombinator.com`}];function s(){let[,e]=(0,r.useState)(`about:blank`),[t,n]=(0,r.useState)(``),[s,l]=(0,r.useState)([]),[u,d]=(0,r.useState)(-1),[f]=(0,r.useState)(o),[p,m]=(0,r.useState)([{id:`tab-1`,title:`新标签页`,url:`about:blank`}]),[h,g]=(0,r.useState)(`tab-1`),[_,v]=(0,r.useState)({"tab-1":a}),[y,b]=(0,r.useState)(!1),x=(0,r.useRef)(1),S=(0,r.useRef)(null),C=p.find(e=>e.id===h),w=(0,r.useCallback)(t=>{let r=t.trim();r===`about:blank`||!/^https?:\/\//i.test(r)&&!r.startsWith(`about:`)&&(r=`https://`+r),e(r),n(r);let i=s.slice(0,u+1);i.push(r),l(i),d(i.length-1),m(e=>e.map(e=>e.id===h?{...e,url:r,title:r}:e)),b(!0),setTimeout(()=>b(!1),800)},[s,u,h]),T=()=>{if(u>0){let t=u-1;d(t),e(s[t]),n(s[t])}},E=()=>{if(u<s.length-1){let t=u+1;d(t),e(s[t]),n(s[t])}},D=()=>{b(!0),setTimeout(()=>b(!1),600)},O=()=>{e(`about:blank`),n(`about:blank`),m(e=>e.map(e=>e.id===h?{...e,url:`about:blank`,title:`新标签页`}:e))},k=()=>{x.current++;let e=`tab-${x.current}`;m(t=>[...t,{id:e,title:`新标签页`,url:`about:blank`}]),v(t=>({...t,[e]:a})),g(e)},A=e=>{if(p.length<=1)return;let t=p.findIndex(t=>t.id===e);if(m(t=>t.filter(t=>t.id!==e)),v(t=>{let n={...t};return delete n[e],n}),h===e){let e=p[t+1]||p[t-1];e&&g(e.id)}};return(0,i.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,height:`100%`,background:`#1e1e1e`,color:`#d4d4d4`},children:[(0,i.jsxs)(`div`,{style:{display:`flex`,background:`#252526`,borderBottom:`1px solid #333`},children:[p.map(e=>(0,i.jsxs)(`div`,{style:{padding:`6px 12px`,cursor:`pointer`,fontSize:12,background:e.id===h?`#1e1e1e`:`#2d2d2d`,borderRight:`1px solid #333`,borderTop:e.id===h?`2px solid #007acc`:`2px solid transparent`,display:`flex`,alignItems:`center`,gap:6,whiteSpace:`nowrap`,maxWidth:160,overflow:`hidden`,textOverflow:`ellipsis`},onClick:()=>g(e.id),children:[(0,i.jsx)(`span`,{style:{overflow:`hidden`,textOverflow:`ellipsis`},children:e.title}),(0,i.jsx)(`span`,{style:{fontSize:14,lineHeight:1,cursor:`pointer`,opacity:.5,flexShrink:0},onClick:t=>{t.stopPropagation(),A(e.id)},children:`×`})]},e.id)),(0,i.jsx)(`div`,{style:{padding:`6px 10px`,cursor:`pointer`,fontSize:14,color:`#888`},onClick:k,children:`+`})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:4,padding:`6px 8px`,background:`#2d2d2d`,borderBottom:`1px solid #333`},children:[(0,i.jsx)(`button`,{onClick:T,title:`后退`,style:c,children:`◀`}),(0,i.jsx)(`button`,{onClick:E,title:`前进`,style:c,children:`▶`}),(0,i.jsx)(`button`,{onClick:D,title:`刷新`,style:c,children:`🔄`}),(0,i.jsx)(`button`,{onClick:O,title:`主页`,style:c,children:`🏠`}),(0,i.jsx)(`span`,{style:{color:`#555`,fontSize:14,margin:`0 4px`},children:`🔒`}),(0,i.jsx)(`input`,{value:t,onChange:e=>n(e.target.value),onKeyDown:e=>{e.key===`Enter`&&w(t)},style:{flex:1,padding:`5px 10px`,border:`1px solid #555`,borderRadius:16,background:`#1e1e1e`,color:`#d4d4d4`,fontSize:13,outline:`none`},placeholder:`输入网址或搜索...`})]}),y&&(0,i.jsxs)(`div`,{style:{height:3,background:`#333`,position:`relative`,overflow:`hidden`},children:[(0,i.jsx)(`div`,{style:{height:`100%`,width:`60%`,background:`linear-gradient(90deg, #007acc, #4ecca3)`,animation:`progress 1.5s ease-in-out infinite`,borderRadius:2}}),(0,i.jsx)(`style`,{children:`@keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }`})]}),(0,i.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:2,padding:`3px 8px`,background:`#252526`,borderBottom:`1px solid #333`,overflow:`hidden`},children:[(0,i.jsx)(`span`,{style:{fontSize:11,color:`#888`,marginRight:6},children:`📑`}),f.map((e,t)=>(0,i.jsx)(`span`,{style:{padding:`3px 10px`,cursor:`pointer`,fontSize:11,borderRadius:12,background:`#333`,whiteSpace:`nowrap`},onClick:()=>{n(e.url),e.url===`about:blank`?O():w(e.url)},onMouseEnter:e=>e.currentTarget.style.background=`#444`,onMouseLeave:e=>e.currentTarget.style.background=`#333`,children:e.name},t))]}),(0,i.jsx)(`div`,{style:{flex:1,overflow:`hidden`,position:`relative`},children:C&&C.url===`about:blank`?(0,i.jsx)(`iframe`,{ref:S,srcDoc:_[h]||a,style:{width:`100%`,height:`100%`,border:`none`},title:`browser-content`,sandbox:`allow-scripts`}):(0,i.jsx)(`iframe`,{ref:S,src:C?.url,style:{width:`100%`,height:`100%`,border:`none`},title:`browser-content`,sandbox:`allow-scripts allow-same-origin allow-forms`})})]})}var c={background:`transparent`,border:`none`,color:`#ccc`,cursor:`pointer`,padding:`4px 8px`,borderRadius:3,fontSize:12};export{s as default};