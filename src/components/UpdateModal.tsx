import React from 'react'
import type { UpdateInfo } from '../hooks/useUpdate'

interface Props {
  info: UpdateInfo
  onClose: () => void
}

function formatNotes(notes: string): React.ReactNode {
  return notes.split('\n').map((line, i) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      return <div key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginTop: 10, marginBottom: 4 }}>{trimmed.replace(/^#+ /, '')}</div>
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
        <span style={{ color: 'var(--accent)', flexShrink: 0 }}>•</span>
        <span>{trimmed.slice(2)}</span>
      </div>
    }
    if (trimmed === '') return <div key={i} style={{ height: 4 }} />
    return <div key={i} style={{ marginBottom: 2 }}>{trimmed}</div>
  })
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function UpdateModal({ info, onClose }: Props) {
  // Tentar encontrar o asset .exe para Windows
  const exeAsset = info.assets?.find(a => a.name.endsWith('.exe'))

  const handleInstall = () => {
    const target = exeAsset?.browser_download_url ?? info.url
    window.api.openUpdateUrl?.(target)
    onClose()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, width: 460, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <img src="/assets/ezzo-work-local-azul.png" alt="EZZO Work Local" style={{ height: 40, objectFit: 'contain' }} draggable={false} />

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              Actualização Disponível
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                v{info.current}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                v{info.latest.replace(/^v/, '')}
              </span>
            </div>
          </div>

          {/* Meta: tamanho do instalador */}
          {exeAsset && (
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
              <span>📦 {exeAsset.name}</span>
              {(exeAsset as any).size > 0 && <span>{formatBytes((exeAsset as any).size)}</span>}
            </div>
          )}
        </div>

        {/* Release notes */}
        {info.notes ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              O que há de novo
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
              {formatNotes(info.notes.slice(0, 1200))}
              {info.notes.length > 1200 && <span style={{ color: 'var(--text-muted)' }}>…</span>}
            </div>
          </div>
        ) : (
          <div style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: 12 }}>
            Nenhuma nota de versão disponível.
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
          <a href={info.url} onClick={e => { e.preventDefault(); window.api.openUpdateUrl?.(info.url) }}
            style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 'auto', cursor: 'pointer', textDecoration: 'underline' }}>
            Ver no GitHub
          </a>
          <button className="btn" style={{ fontSize: 12 }} onClick={onClose}>
            Mais tarde
          </button>
          <button className="btn btn-primary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }} onClick={handleInstall}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Instalar Actualização
          </button>
        </div>
      </div>
    </div>
  )
}
