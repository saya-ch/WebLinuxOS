import { useState } from 'react'
import { useStore } from '../store'

export default function PDFViewer() {
  const { theme } = useStore()
  const isDark = theme === 'dark'
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [showThumbnails, setShowThumbnails] = useState(true)

  const totalPages = 12

  const bg = isDark ? '#1a1a2e' : '#f5f5f5'
  const sidebarBg = isDark ? '#16213e' : '#e8e8e8'
  const textColor = isDark ? '#e0e0e0' : '#333'
  const inputBg = isDark ? '#0f3460' : '#fff'
  const borderColor = isDark ? '#2a2a4a' : '#ddd'
  const pageBg = isDark ? '#242424' : '#fff'
  const pageTextColor = isDark ? '#ccc' : '#333'

  const prevPage = () => setPage(Math.max(1, page - 1))
  const nextPage = () => setPage(Math.min(totalPages, page + 1))
  const zoomIn = () => setZoom(Math.min(200, zoom + 25))
  const zoomOut = () => setZoom(Math.max(25, zoom - 25))

  const pageContent = (p: number) => {
    const contents = [
      'Web Linux 系统\n用户手册 v1.0',
      '目录\n\n1. 快速入门\n2. 桌面环境\n3. 文件管理器\n4. 终端使用\n5. 应用程序\n6. 系统设置\n7. 网络配置\n8. 安全指南\n9. 常见问题\n10. 附录',
      '第一章 快速入门\n\n欢迎使用 Web Linux 系统。本系统是一个基于 Web 技术的 Linux 桌面环境模拟器。\n\nWeb Linux 提供了完整的桌面操作体验，包括窗口管理、文件系统、终端模拟器以及丰富的应用程序。\n\n您可以通过双击桌面图标或从开始菜单中启动应用程序。',
      '第二章 桌面环境\n\nWeb Linux 的桌面环境模仿了传统 Linux 桌面环境的布局：\n\n- 桌面：放置常用应用程序图标\n- 任务栏：显示正在运行的应用程序\n- 开始菜单：快速启动所有已安装的应用\n- 系统托盘：显示时间和系统状态',
      '第三章 文件管理器\n\n文件管理器允许您浏览和管理文件系统。\n\n功能包括：\n- 浏览目录结构\n- 创建、重命名、删除文件和文件夹\n- 复制、移动文件\n- 查看文件属性\n- 支持多种文件类型',
      '第四章 终端使用\n\n终端是 Web Linux 的核心组件之一。它模拟了一个完整的命令行界面。\n\n常用命令：\n- ls: 列出文件\n- cd: 切换目录\n- pwd: 显示当前路径\n- mkdir: 创建目录\n- rm: 删除文件\n- cat: 查看文件内容',
      '第五章 应用程序\n\nWeb Linux 包含 50+ 个功能齐全的应用程序：\n\n办公类：文本编辑器、电子表格、演示文稿、笔记、日历\n网络类：浏览器、邮件客户端、即时通讯\n开发类：代码编辑器、终端、命令参考\n工具类：计算器、密码管理器、翻译器',
      '第六章 系统设置\n\n系统设置允许您自定义 Web Linux 的行为和外观。\n\n可配置项：\n- 主题：切换深色/浅色模式\n- 壁纸：自定义桌面背景\n- 语言：界面显示语言\n- 通知：管理通知偏好',
      '第七章 网络配置\n\nWeb Linux 模拟了完整的网络环境。\n\n网络功能：\n- Wi-Fi 管理：连接无线网络\n- 防火墙：配置网络安全规则\n- 代理设置：配置 HTTP/HTTPS 代理\n- 网络监控：实时查看网络流量',
      '第八章 安全指南\n\n为保护您的数据安全，建议：\n\n1. 定期备份重要文件\n2. 使用密码管理器管理凭据\n3. 保持系统更新\n4. 配置防火墙规则\n5. 谨慎处理敏感信息',
      '第九章 常见问题\n\nQ: 如何切换主题？\nA: 打开设置应用，选择"外观"选项卡。\n\nQ: 终端支持哪些命令？\nA: 支持大部分常用 Linux 命令。\n\nQ: 可以同时打开多个窗口吗？\nA: 可以，Web Linux 支持多窗口操作。',
      '第十章 附录\n\n系统版本：v1.0.0\n内核版本：Web Linux Kernel 1.0\n浏览器要求：Chrome 90+, Firefox 88+, Edge 90+\n\n© 2025 Web Linux Project\n保留所有权利',
    ]
    return contents[(p - 1) % contents.length]
  }

  return (
    <div style={{ height: '100%', background: bg, color: textColor, fontFamily: 'system-ui, sans-serif', fontSize: 13, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${borderColor}`, background: sidebarBg }}>
        <button onClick={() => setShowThumbnails(!showThumbnails)} style={{
          padding: '5px 10px', borderRadius: 4, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, cursor: 'pointer', fontSize: 12,
        }}>{showThumbnails ? '隐藏' : '显示'}缩略图</button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: 12 }}>Web Linux 用户手册.pdf</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={zoomOut} style={{ width: 28, height: 28, borderRadius: 4, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>−</button>
          <span style={{ fontSize: 12, minWidth: 40, textAlign: 'center' }}>{zoom}%</span>
          <button onClick={zoomIn} style={{ width: 28, height: 28, borderRadius: 4, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>+</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {showThumbnails && (
          <div style={{
            width: 120, overflow: 'auto', background: isDark ? '#12121e' : '#ddd',
            borderRight: `1px solid ${borderColor}`, flexShrink: 0,
          }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <div key={p} onClick={() => setPage(p)} style={{
                margin: '6px 8px', padding: '6px', background: page === p ? (isDark ? '#0f3460' : '#bbdefb') : (isDark ? '#1a1a2e' : '#eee'),
                border: page === p ? `2px solid ${isDark ? '#4fc3f7' : '#1976d2'}` : `1px solid transparent`,
                borderRadius: 4, cursor: 'pointer', textAlign: 'center',
              }}>
                <div style={{
                  aspectRatio: '0.75', background: pageBg, borderRadius: 2, marginBottom: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, color: pageTextColor, padding: 4, overflow: 'hidden',
                }}>
                  {pageContent(p).split('\n').slice(0, 4).join('\n')}
                </div>
                <div style={{ fontSize: 10, color: isDark ? '#9ca3af' : '#888' }}>第 {p} 页</div>
              </div>
            ))}
          </div>
        )}

        <div style={{
          flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center',
          background: isDark ? '#2a2a2a' : '#e0e0e0', padding: 16,
        }}>
          <div style={{
            width: `${(550 * zoom) / 100}px`,
            minHeight: `${(750 * zoom) / 100}px`,
            background: pageBg, color: pageTextColor,
            padding: `${(40 * zoom) / 100}px`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            borderRadius: 4, whiteSpace: 'pre-wrap', lineHeight: 1.8,
            fontSize: `${(12 * zoom) / 100}px`,
            fontFamily: '"Noto Sans SC", system-ui, sans-serif',
          }}>
            <div style={{
              textAlign: 'center', borderBottom: `2px solid ${isDark ? '#444' : '#ccc'}`,
              paddingBottom: `${(16 * zoom) / 100}px`, marginBottom: `${(16 * zoom) / 100}px`,
            }}>
              <div style={{ fontSize: `${(20 * zoom) / 100}px`, fontWeight: 700 }}>{pageContent(page).split('\n')[0]}</div>
            </div>
            <div style={{ fontSize: `${(13 * zoom) / 100}px` }}>
              {pageContent(page).split('\n').slice(1).map((line, i) => (
                <div key={i} style={{ marginBottom: `${(4 * zoom) / 100}px` }}>{line}</div>
              ))}
            </div>
            <div style={{
              textAlign: 'center', marginTop: `${(20 * zoom) / 100}px`,
              fontSize: `${(10 * zoom) / 100}px`, color: isDark ? '#666' : '#aaa',
            }}>
              — {page} / {totalPages} —
            </div>
          </div>
        </div>
      </div>

      <div style={{
        padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        borderTop: `1px solid ${borderColor}`, background: sidebarBg,
      }}>
        <button onClick={() => setPage(1)} disabled={page === 1} style={{
          padding: '4px 10px', borderRadius: 4, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, cursor: page === 1 ? 'default' : 'pointer', fontSize: 12, opacity: page === 1 ? 0.5 : 1,
        }}>⏮</button>
        <button onClick={prevPage} disabled={page === 1} style={{
          padding: '4px 14px', borderRadius: 4, border: 'none', background: page === 1 ? (isDark ? '#1a3a5c' : '#ccc') : (isDark ? '#0f3460' : '#1976d2'), color: '#fff', cursor: page === 1 ? 'default' : 'pointer', fontSize: 12,
        }}>上一页</button>
        <span style={{ fontSize: 12, minWidth: 80, textAlign: 'center' }}>
          {page} / {totalPages}
        </span>
        <button onClick={nextPage} disabled={page === totalPages} style={{
          padding: '4px 14px', borderRadius: 4, border: 'none', background: page === totalPages ? (isDark ? '#1a3a5c' : '#ccc') : (isDark ? '#0f3460' : '#1976d2'), color: '#fff', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12,
        }}>下一页</button>
        <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{
          padding: '4px 10px', borderRadius: 4, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12, opacity: page === totalPages ? 0.5 : 1,
        }}>⏭</button>
      </div>
    </div>
  )
}