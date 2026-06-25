import React, { useEffect, useRef, useState } from 'react'
import { IconDot, IconPeer, IconHost } from './Icons'

interface Props {
  activeFile: string | null
  isTyping: boolean
  connectedPeers: number
  isHost: boolean
  isClientConnected: boolean
  gitChanges: number
  activePeer: string | null
}

export default function StatusBar({ activeFile, isTyping, connectedPeers, isHost, isClientConnected, gitChanges, activePeer }: Props) {
  const [barWidth, setBarWidth] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Animate bar when typing
  useEffect(() => {
    if (isTyping) {
      if (animRef.current) return
      let w = 0
      let dir = 1
      animRef.current = setInterval(() => {
        w += dir * 3
        if (w >= 100) { w = 100; dir = -1 }
        if (w <= 0)   { w = 0;   dir = 1 }
        setBarWidth(w)
      }, 20)
    } else {
      // fade out
      if (animRef.current) { clearInterval(animRef.current); animRef.current = null }
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setBarWidth(0), 800)
    }
    return () => {
      if (animRef.current) clearInterval(animRef.current)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isTyping])

  const networkStatus = isHost ? 'Host' : isClientConnected ? 'Connected' : 'Offline'
  const networkColor  = isHost ? 'var(--accent)' : isClientConnected ? 'var(--success)' : 'var(--text-muted)'

  return (
    <div style={{ flexShrink: 0, position: 'relative' }}>
      {/* Activity bar — thin line above status bar */}
      <div style={{ height: 2, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${barWidth}%`,
          background: 'var(--accent)',
          transition: isTyping ? 'none' : 'width 0.8s ease',
          boxShadow: barWidth > 0 ? '0 0 8px var(--accent)' : 'none',
        }} />
      </div>

      {/* Main status bar */}
      <div style={{
        height: 'var(--statusbar-height)',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: 12,
        fontSize: 11,
        color: 'var(--text-secondary)',
        userSelect: 'none',
      }}>
        {/* Network status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <IconDot size={7} color={networkColor} />
          <span style={{ color: networkColor }}>{networkStatus}</span>
        </div>

        {connectedPeers > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconPeer size={12} />
            <span>{connectedPeers} peer{connectedPeers !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Active peer editing */}
        {activePeer && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--warning)' }}>
            <IconDot size={6} color="var(--warning)" />
            <span>{activePeer} editing…</span>
          </div>
        )}

        {/* Git changes */}
        {gitChanges > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <path d="M6 9v6M13.5 6H10a4 4 0 00-4 4v2"/>
            </svg>
            <span>{gitChanges} change{gitChanges !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Active file */}
        {activeFile && (
          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
            {activeFile.split(/[/\\]/).pop()}
          </span>
        )}

        {/* Typing indicator */}
        {isTyping && (
          <span style={{ color: 'var(--accent)', fontSize: 10 }}>editing…</span>
        )}

        <span style={{ color: 'var(--text-muted)' }}>EZZO Work Local</span>
      </div>
    </div>
  )
}
