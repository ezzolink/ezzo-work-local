import React, { useState, useEffect, useRef } from 'react'
import { marked } from 'marked'
import { useAppStore } from '../store/appStore'

interface ChatMsg {
  id: string
  author: string
  text: string
  ts: number
}

export default function ChatPanel() {
  const { remoteSocket, isHost } = useAppStore()
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const localName = localStorage.getItem('ezzo-peer-name') || (isHost ? 'Host' : 'Me')

  const addMsg = (data: { author: string; text: string }) =>
    setMsgs((prev) => [...prev, { id: Math.random().toString(36).slice(2), author: data.author, text: data.text, ts: Date.now() }])

  // Peer: listen on socket
  useEffect(() => {
    if (!remoteSocket) return
    remoteSocket.on('chat', addMsg)
    return () => { remoteSocket.off('chat', addMsg) }
  }, [remoteSocket])

  // Host: listen on IPC
  useEffect(() => {
    if (!isHost) return
    window.api.onChat?.(addMsg)
  }, [isHost])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const send = () => {
    const text = input.trim()
    if (!text) return
    const msg = { author: localName, text }
    addMsg(msg)
    if (isHost) {
      window.api.hostChatSend?.(msg)
    } else if (remoteSocket) {
      remoteSocket.emit('chat', msg)
    }
    setInput('')
  }

  if (!isHost && !remoteSocket) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12, padding: 16, textAlign: 'center' }}>
        Connect to a peer to start chatting
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        {msgs.map((m) => {
          const isLocal = m.author === localName
          return (
            <div key={m.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: isLocal ? 'var(--accent)' : 'var(--success)' }}>
                  {isLocal ? 'You' : m.author}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div
                style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}
                dangerouslySetInnerHTML={{ __html: marked.parse(m.text, { async: false }) as string }}
              />
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '6px 8px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message…" style={{ flex: 1, fontSize: 12 }} />
        <button className="btn btn-primary" style={{ fontSize: 11, padding: '4px 10px' }} onClick={send}>Send</button>
      </div>
    </div>
  )
}
