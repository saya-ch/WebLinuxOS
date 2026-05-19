export default function About() {
  const techStack = [
    { name: 'React', version: '19.x', icon: '⚛️', desc: '用户界面框架' },
    { name: 'TypeScript', version: '5.x', icon: '🔷', desc: '类型安全编程语言' },
    { name: 'Zustand', version: '5.x', icon: '🐻', desc: '轻量级状态管理' },
    { name: 'Vite', version: '6.x', icon: '⚡', desc: '快速构建工具' },
  ]

  const specs = [
    { label: '系统名称', value: 'Web Linux' },
    { label: '版本号', value: '1.0.0-beta' },
    { label: '内核版本', value: 'Web Linux 6.8.0' },
    { label: '架构', value: 'x86_64 (Browser)' },
    { label: '桌面环境', value: 'Web DE 1.0' },
    { label: '窗口系统', value: 'Web Window Manager' },
    { label: '应用数量', value: '50+' },
    { label: '许可证', value: 'MIT' },
  ]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e',
      color: '#cdd6f4', overflowY: 'auto', padding: '20px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🐧</div>
        <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700 }}>Web Linux</h1>
        <div style={{ fontSize: '13px', color: '#a6adc8' }}>浏览器中的 Linux 桌面环境</div>
      </div>

      <div style={{
        background: '#313244', borderRadius: '12px', padding: '16px 20px',
        marginBottom: '16px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#89b4fa' }}>
          关于 Web Linux
        </div>
        <p style={{ fontSize: '12px', color: '#bac2de', lineHeight: 1.7, margin: 0 }}>
          Web Linux 是一个纯前端实现的 Linux 桌面环境模拟器。它提供了完整的窗口管理系统、
          丰富的系统工具、办公应用、网络工具、多媒体播放器和经典游戏。所有功能均在浏览器中运行，
          无需后端服务器支持。项目旨在展示现代 Web 技术的强大能力，同时提供一个有趣且实用的桌面环境体验。
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {specs.map((spec) => (
          <div key={spec.label} style={{ background: '#313244', borderRadius: '8px', padding: '10px 14px' }}>
            <div style={{ fontSize: '11px', color: '#a6adc8' }}>{spec.label}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#89b4fa' }}>{spec.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: '#a6adc8' }}>
          技术栈
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
          {techStack.map((tech) => (
            <div
              key={tech.name}
              style={{
                background: '#313244', borderRadius: '8px', padding: '14px',
                textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px',
              }}
            >
              <span style={{ fontSize: '28px' }}>{tech.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{tech.name}</span>
              <span style={{ fontSize: '11px', color: '#89b4fa' }}>{tech.version}</span>
              <span style={{ fontSize: '10px', color: '#6c7086' }}>{tech.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '11px', color: '#6c7086', lineHeight: 1.8 }}>
        <div>Web Linux &copy; 2024</div>
        <div>基于 Web 技术构建 · 使用 React + TypeScript + Zustand + Vite</div>
        <div>开源项目 · MIT License</div>
        <div style={{ marginTop: '4px', color: '#585b70' }}>
          感谢所有开源项目的贡献者们
        </div>
      </div>
    </div>
  )
}