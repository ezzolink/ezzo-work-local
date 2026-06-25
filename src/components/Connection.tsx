import React, { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import { useAppStore } from '../store/appStore'
import { IconHost, IconConnect, IconDisconnect, IconPeer, IconDot } from './Icons'
import type { Peer } from '../types'

type Mode = 'idle' | 'host' | 'client'
type Status = 'disconnected' | 'connecting' | 'connected' | 'sharing'

const STATUS_COLOR: Record<Status, string> = {
  disconnected: 'var(--text-muted)',
  connecting: 'var(--warning)',
  connected: 'var(--success)',
  sharing: 'var(--accent)',
}
const STATUS_LABEL: Record<Status, string> = {
  disconnected: 'Offline', connecting: 'Connecting…',
  connected: 'Connected', sharing: 'Sharing',
}

export default function Connection() {
  const {
    localFolder, setRemoteSocket, setIsHost, addPeer, removePeer,
    connectedPeers, isHost, peerPermissions, setPeerPermission,
  } = useAppStore()
  const [mode, setMode] = useState<Mode>('idle')
  const [status, setStatus] = useState<Status>('disconnected')
  const [localIP, setLocalIP] = useState('')
  const [targetIP, setTargetIP] = useState(() => localStorage.getItem('ezzo-last-ip') ?? '')
  const [recentIPs, setRecentIPs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('ezzo-recent-ips') ?? '[]') } catch { return [] }
  })

  useEffect(() => {
    window.api.getLocalIP().then((ip: string) => setLocalIP(ip))
    window.api.onPeerConnected((id: string) => addPeer({ id, ip: 'unknown', name: `Peer ${id.slice(0, 6)}` }))
    window.api.onPeerDisconnected((id: string) => removePeer(id))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startHost = async () => {
    if (!localFolder) { alert('Open a folder first'); return }
    await window.api.startServer(localFolder)
    setMode('host'); setIsHost(true); setStatus('sharing')
  }

  const stopHost = async () => {
    await window.api.stopServer()
    setMode('idle'); setIsHost(false); setStatus('disconnected')
  }

  const connectClient = (ip?: string) => {
    const host = ip ?? targetIP
    if (!host) return
    // save to recent
    const updated = [host, ...recentIPs.filter(x => x !== host)].slice(0, 5)
    setRecentIPs(updated)
    localStorage.setItem('ezzo-last-ip', host)
    localStorage.setItem('ezzo-recent-ips', JSON.stringify(updated))

    setStatus('connecting')
    const socket = io(`http://${host}:7700`, { timeout: 5000 })
    socket.on('connect', () => { setStatus('connected'); setRemoteSocket(socket) })
    socket.on('disconnect', () => { setStatus('disconnected'); setRemoteSocket(null) })
    socket.on('connect_error', () => { setStatus('disconnected'); alert(`Cannot connect to ${host}:7700`) })
    socket.on('file-change', (data: { event: string; path: string }) => {
      window.dispatchEvent(new CustomEvent('remote-file-change', { detail: data }))
    })
  }

  const disconnectClient = () => {
    useAppStore.getState().remoteSocket?.disconnect()
    setRemoteSocket(null); setStatus('disconnected'); setMode('idle')
  }

  const handlePermChange = (peer: Peer, perm: 'read-only' | 'read-write') => {
    setPeerPermission(peer.id, perm)
    window.api.setPeerPermission?.(peer.id, perm)
  }

  return (
    <div style={{ padding: 10, borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>

      {/* Status row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <IconDot size={7} color={STATUS_COLOR[status]} />
        <span style={{ fontSize: 11, color: STATUS_COLOR[status] }}>{STATUS_LABEL[status]}</span>
        {connectedPeers.length > 0 && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconPeer size={12} />{connectedPeers.length}
          </span>
        )}
      </div>

      {mode === 'idle' && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-primary" style={{ flex: 1, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }} onClick={startHost}>
            <IconHost size={13} />Host
          </button>
          <button className="btn" style={{ flex: 1, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }} onClick={() => setMode('client')}>
            <IconConnect size={13} />Client
          </button>
        </div>
      )}

      {mode === 'host' && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
            IP: <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{localIP}</span>
            <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>:7700</span>
          </div>
          {connectedPeers.map((p: Peer) => {
            const perm = peerPermissions[p.id] ?? 'read-write'
            return (
              <div key={p.id} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: 'var(--success)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <IconDot size={6} color="var(--success)" />{p.name}
                </div>
                <div style={{ display: 'flex', gap: 4, paddingLeft: 11 }}>
                  {(['read-only', 'read-write'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handlePermChange(p, opt)}
                      className={perm === opt ? 'btn btn-primary' : 'btn'}
                      style={{ fontSize: 10, padding: '2px 7px' }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          <button className="btn btn-danger" style={{ width: '100%', marginTop: 6, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }} onClick={stopHost}>
            <IconDisconnect size={13} />Stop Sharing
          </button>
        </div>
      )}

      {mode === 'client' && status === 'disconnected' && (
        <div>
          {/* Quick connect from recent IPs */}
          {recentIPs.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              {recentIPs.map(ip => (
                <button key={ip} className="btn" onClick={() => connectClient(ip)}
                  style={{ width: '100%', textAlign: 'left', fontSize: 11, marginBottom: 3, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{ip}</span>
                  <span style={{ fontSize: 10, color: 'var(--accent)' }}>connect</span>
                </button>
              ))}
              <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
            </div>
          )}
          <input placeholder="New IP address" value={targetIP}
            onChange={e => setTargetIP(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && connectClient()}
            style={{ width: '100%', marginBottom: 6 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-primary" style={{ flex: 1, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }} onClick={() => connectClient()}>
              <IconConnect size={13} />Connect
            </button>
            <button className="btn" style={{ flex: 1, fontSize: 11 }} onClick={() => setMode('idle')}>Back</button>
          </div>
        </div>
      )}

      {mode === 'client' && status === 'connected' && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--success)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <IconDot size={6} color="var(--success)" />Connected to {targetIP}
          </div>
          <button className="btn btn-danger" style={{ width: '100%', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }} onClick={disconnectClient}>
            <IconDisconnect size={13} />Disconnect
          </button>
        </div>
      )}

      {isHost && !localFolder && (
        <div style={{ fontSize: 10, color: 'var(--error)', marginTop: 4 }}>Open a folder to share</div>
      )}
    </div>
  )
}
