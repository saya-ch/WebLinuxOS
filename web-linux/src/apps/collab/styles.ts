import React from 'react'
import { PALETTE_GRADIENTS } from './types'

export function buildStyles(isDark: boolean, bgColor: string, tool: string) {
  const panelBg = isDark ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.75)'
  const borderColor = isDark ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.1)'
  const textColor = isDark ? '#f1f5f9' : '#0f172a'
  const subTextColor = isDark ? '#94a3b8' : '#64748b'
  const accent = '#6366f1'
  const bg = isDark
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)'

  return {
    app: {
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: bg, color: textColor, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      overflow: 'hidden', position: 'relative',
    } as React.CSSProperties,
    glow: {
      position: 'absolute', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.35,
      pointerEvents: 'none', zIndex: 0,
    } as React.CSSProperties,
    glass: {
      background: panelBg, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${borderColor}`, borderRadius: 16,
      boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.08)',
    } as React.CSSProperties,
    header: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px', gap: 16, flexShrink: 0, position: 'relative', zIndex: 10,
    } as React.CSSProperties,
    logo: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 700 } as React.CSSProperties,
    logoIcon: {
      width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: PALETTE_GRADIENTS[0], color: 'white',
      boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
    } as React.CSSProperties,
    headerRight: { display: 'flex', alignItems: 'center', gap: 10 } as React.CSSProperties,
    btn: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: '8px 14px', borderRadius: 10, border: `1px solid ${borderColor}`,
      background: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.6)',
      color: textColor, cursor: 'pointer', fontSize: 13, fontWeight: 500,
      transition: 'all 0.2s ease', backdropFilter: 'blur(10px)',
    } as React.CSSProperties,
    primaryBtn: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: '8px 16px', borderRadius: 10, border: 'none',
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600,
      boxShadow: '0 4px 14px rgba(99,102,241,0.4)', transition: 'all 0.2s ease',
    } as React.CSSProperties,
    iconBtn: {
      width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.5)',
      border: `1px solid ${borderColor}`, color: textColor, cursor: 'pointer',
      transition: 'all 0.2s ease',
    } as React.CSSProperties,
    body: {
      flex: 1, display: 'flex', overflow: 'hidden', gap: 12, padding: '0 20px 20px',
      position: 'relative', zIndex: 5,
    } as React.CSSProperties,
    sidebar: { width: 260, display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 } as React.CSSProperties,
    sideSection: { padding: 14 } as React.CSSProperties,
    sideTitle: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, color: subTextColor, marginBottom: 10 } as React.CSSProperties,
    mainArea: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } as React.CSSProperties,
    tabBar: { display: 'flex', gap: 4, padding: 6, marginBottom: 12 } as React.CSSProperties,
    tab: {
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
      background: 'transparent', border: 'none', color: subTextColor,
      fontSize: 14, fontWeight: 500, transition: 'all 0.2s ease',
    } as React.CSSProperties,
    tabActive: {
      background: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
      color: accent, boxShadow: '0 2px 8px rgba(99,102,241,0.15)',
    } as React.CSSProperties,
    canvasWrap: {
      flex: 1, position: 'relative', overflow: 'hidden', borderRadius: 14,
      background: bgColor, border: `1px solid ${borderColor}`,
    } as React.CSSProperties,
    canvas: { display: 'block', cursor: tool === 'eraser' ? 'cell' : tool === 'text' ? 'text' : 'crosshair' } as React.CSSProperties,
    toolBar: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', flexWrap: 'wrap' } as React.CSSProperties,
    toolBtn: {
      width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.5)',
      border: `1px solid ${borderColor}`, color: textColor, cursor: 'pointer',
      transition: 'all 0.15s ease',
    } as React.CSSProperties,
    toolActive: {
      background: isDark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.15)',
      borderColor: accent, color: accent,
      boxShadow: '0 0 0 2px rgba(99,102,241,0.3)',
    } as React.CSSProperties,
    colorSwatch: {
      width: 26, height: 26, borderRadius: 8, cursor: 'pointer',
      border: '2px solid transparent', transition: 'all 0.15s ease',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    } as React.CSSProperties,
    colorActive: {
      borderColor: 'white', transform: 'scale(1.15)',
      boxShadow: '0 0 0 2px rgba(99,102,241,0.5), 0 2px 8px rgba(0,0,0,0.3)',
    } as React.CSSProperties,
    slider: {
      width: '100%', height: 4, appearance: 'none', borderRadius: 2,
      background: isDark ? 'rgba(148,163,184,0.2)' : 'rgba(15,23,42,0.15)',
      outline: 'none', cursor: 'pointer',
    } as React.CSSProperties,
    input: {
      width: '100%', padding: '10px 14px', borderRadius: 10,
      background: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.8)',
      border: `1px solid ${borderColor}`, color: textColor,
      fontSize: 14, outline: 'none', transition: 'border-color 0.2s ease',
    } as React.CSSProperties,
    userChip: {
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
      borderRadius: 10, background: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.6)',
      border: `1px solid ${borderColor}`, fontSize: 12,
    } as React.CSSProperties,
    userAvatar: {
      width: 24, height: 24, borderRadius: '50%', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0,
    } as React.CSSProperties,
    codeArea: {
      flex: 1, width: '100%', resize: 'none', padding: 20, borderRadius: 14,
      background: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(15,23,42,0.05)',
      border: `1px solid ${borderColor}`, color: isDark ? '#e2e8f0' : '#1e293b',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      fontSize: 13, lineHeight: 1.6, outline: 'none',
    } as React.CSSProperties,
    notesArea: {
      flex: 1, width: '100%', resize: 'none', padding: 20, borderRadius: 14,
      background: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.7)',
      border: `1px solid ${borderColor}`, color: textColor,
      fontSize: 15, lineHeight: 1.7, outline: 'none',
      fontFamily: "'Georgia', 'Noto Serif', serif",
    } as React.CSSProperties,
    cursorOverlay: {
      position: 'absolute', top: 0, left: 0, pointerEvents: 'none',
      width: '100%', height: '100%', overflow: 'hidden',
    } as React.CSSProperties,
    remoteCursor: {
      position: 'absolute', width: 16, height: 22, pointerEvents: 'none',
      transform: 'translate(-2px, -4px)', transition: 'left 0.1s ease, top 0.1s ease',
    } as React.CSSProperties,
    cursorLabel: {
      position: 'absolute', top: 22, left: 10, padding: '2px 6px', borderRadius: 4,
      color: 'white', fontSize: 10, fontWeight: 60, whiteSpace: 'nowrap',
      transform: 'translateX(-50%)',
    } as React.CSSProperties,
    connectionBadge: {
      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 60,
    } as React.CSSProperties,
    dot: { width: 6, height: 6, borderRadius: '50%', display: 'inline-block' } as React.CSSProperties,
    keyframes: `
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes fadeInUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: ${isDark ? 'rgba(148,163,184,0.3)' : 'rgba(15,23,42,0.2)'}; border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: ${isDark ? 'rgba(148,163,184,0.5)' : 'rgba(15,23,42,0.3)'}; }
      input[type="range"]::-webkit-slider-thumb { appearance: none; width: 14px; height: 14px; background: #6366f1; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 6px rgba(99,102,241,0.5); }
      input[type="range"]::-moz-range-thumb { width: 14px; height: 14px; background: #6366f1; border-radius: 50%; cursor: pointer; border: none; box-shadow: 0 2px 6px rgba(99,102,241,0.5); }
    `,
  }
}
