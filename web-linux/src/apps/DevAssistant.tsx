import { useState } from 'react'

export default function DevAssistant() {
  const [activeTab, setActiveTab] = useState('welcome')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState<string[]>([])

  const tools = [
    { id: 'code-gen', name: '代码生成', icon: '💻', desc: '快速生成常用代码片段' },
    { id: 'regex-test', name: '正则测试', icon: '🔍', desc: '测试和调试正则表达式' },
    { id: 'color-pick', name: '颜色选择', icon: '🎨', desc: '选择和转换颜色格式' },
    { id: 'json-format', name: 'JSON 格式化', icon: '📋', desc: '格式化和验证 JSON 数据' },
  ]

  const addOutput = (text: string) => {
    setOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${text}`])
  }

  const handleCommand = (cmd: string) => {
    setInput('')
    addOutput(`> ${cmd}`)
    switch (cmd.trim()) {
      case 'help':
        addOutput('可用命令: help, clear, about, tips')
        break
      case 'clear':
        setOutput([])
        break
      case 'about':
        addOutput('开发助手 v1.0 - 提升您的开发效率')
        break
      case 'tips':
        addOutput('提示: 使用 Ctrl+P 打开命令面板')
        break
      default:
        addOutput('未知命令，输入 help 查看帮助')
    }
  }

  const tabs = [
    { id: 'welcome', name: '欢迎' },
    { id: 'tools', name: '工具集' },
    { id: 'console', name: '控制台' },
    { id: 'snippets', name: '代码片段' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e2e', color: '#cdd6f4' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #313244', background: '#181825' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700 }}>👨‍💻 开发助手</h1>
        <p style={{ margin: 0, fontSize: '12px', color: '#a6adc8' }}>提升您的开发效率，一站式开发工具</p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #313244', background: '#181825' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: activeTab === t.id ? '#313244' : 'transparent',
              color: activeTab === t.id ? '#89b4fa' : '#a6adc8',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === t.id ? 600 : 400,
              borderBottom: activeTab === t.id ? '2px solid #89b4fa' : '2px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {activeTab === 'welcome' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'linear-gradient(135deg, #313244 0%, #45475a 100%)', borderRadius: '12px', padding: '20px' }}>
              <h2 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>欢迎使用开发助手!</h2>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#a6adc8' }}>选择一个工具开始您的开发之旅，或者查看控制台快速执行命令。</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                {tools.map(t => (
                  <div key={t.id} style={{ background: '#1e1e2e', borderRadius: '10px', padding: '14px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>{t.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{t.name}</div>
                    <div style={{ fontSize: '11px', color: '#a6adc8' }}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {[
                { title: '快捷键', value: 'Ctrl+P - 命令面板', color: '#89b4fa' },
                { title: '快速启动', value: 'Ctrl+Shift+L - 应用启动', color: '#a6e3a1' },
                { title: '终端', value: 'Super+T - 打开终端', color: '#f5c2e7' },
                { title: '代码编辑器', value: 'Super+G - 编辑代码', color: '#f9e2af' },
              ].map((item, i) => (
                <div key={i} style={{ background: '#313244', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', color: '#a6adc8', marginBottom: '4px' }}>{item.title}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tools.map(t => (
              <div key={t.id} style={{ background: '#313244', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ fontSize: '28px' }}>{t.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{t.name}</div>
                  <div style={{ fontSize: '12px', color: '#a6adc8' }}>{t.desc}</div>
                </div>
                <button style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #89b4fa 0%, #74c7ec 100%)', border: 'none', borderRadius: '8px', color: '#1e1e2e', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>打开</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'console' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
            <div style={{ flex: 1, background: '#181825', borderRadius: '10px', padding: '12px', fontFamily: 'monospace', fontSize: '12px', overflow: 'auto' }}>
              {output.length === 0 ? (
                <div style={{ color: '#6c7086', fontStyle: 'italic' }}>控制台就绪，输入命令开始...</div>
              ) : (
                output.map((line, i) => <div key={i}>{line}</div>)
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCommand(input)} style={{ flex: 1, padding: '10px 14px', background: '#313244', border: '1px solid #45475a', borderRadius: '8px', color: '#cdd6f4', fontSize: '13px' }} placeholder="输入命令 (help)..." />
              <button onClick={() => handleCommand(input)} style={{ padding: '10px 20px', background: '#89b4fa', border: 'none', borderRadius: '8px', color: '#1e1e2e', fontWeight: 600, cursor: 'pointer' }}>执行</button>
            </div>
          </div>
        )}

        {activeTab === 'snippets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { title: 'React 组件', code: 'function Component() {\n  return <div>Hello World</div>;\n}' },
              { title: 'CSS Flexbox', code: '.flex {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}' },
              { title: 'Fetch API', code: 'fetch("/api/data")\n  .then(r => r.json())\n  .then(d => console.log(d));' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#313244', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>{s.title}</div>
                <pre style={{ background: '#181825', padding: '12px', borderRadius: '8px', fontSize: '11px', overflow: 'auto', margin: 0 }}><code>{s.code}</code></pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
