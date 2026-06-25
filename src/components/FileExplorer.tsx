import React, { useState, useCallback, useRef } from 'react'
import type { FileNode } from '../types'
import {
  IconFolder, IconFolderOpen, IconFile, IconFileCode, IconFileText,
  IconMarkdown, IconImage, IconJson, IconLock,
  IconNewFile, IconNewFolder, IconRename, IconCopy, IconDelete, IconDownload, IconRefresh,
  IconChevronRight, IconChevronDown,
} from './Icons'

interface ContextMenu { x: number; y: number; node: FileNode }
interface Props {
  rootPath: string | null
  tree: FileNode | null
  onFileOpen: (node: FileNode) => void
  onRefresh: () => void
  remoteFiles?: FileNode | null | 'loading'
  onRemoteCopy?: (node: FileNode) => void
  onFileOpenSplit?: (node: FileNode) => void
}

function fileIconComponent(node: FileNode) {
  if (node.type === 'directory') return null // handled separately with state
  const ext = node.name.split('.').pop()?.toLowerCase() ?? ''
  const props = { size: 13 }
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'sh', 'bat'].includes(ext)) return <IconFileCode {...props} />
  if (ext === 'md') return <IconMarkdown {...props} />
  if (['json', 'yaml', 'yml', 'toml'].includes(ext)) return <IconJson {...props} />
  if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(ext)) return <IconImage {...props} />
  if (['txt', 'log'].includes(ext)) return <IconFileText {...props} />
  if (ext === 'env' || node.name.startsWith('.env')) return <IconLock {...props} />
  return <IconFile {...props} />
}

function TreeNode({ node, depth, onFileOpen, onContext, onDragStart, onDrop, onFileOpenSplit }: {
  node: FileNode; depth: number
  onFileOpen: (n: FileNode) => void
  onContext: (e: React.MouseEvent, n: FileNode) => void
  onDragStart: (n: FileNode) => void
  onDrop: (target: FileNode) => void
  onFileOpenSplit?: (n: FileNode) => void
}) {
  const [expanded, setExpanded] = useState(depth === 0)

  return (
    <div>
      <div
        draggable
        onDragStart={e => { e.stopPropagation(); onDragStart(node) }}
        onDragOver={e => { if (node.type === 'directory') e.preventDefault() }}
        onDrop={e => { e.preventDefault(); e.stopPropagation(); onDrop(node) }}
        onContextMenu={e => { e.preventDefault(); onContext(e, node) }}
        onClick={e => {
          if (node.type === 'directory') { setExpanded(v => !v); return }
          if (e.altKey && onFileOpenSplit) { onFileOpenSplit(node); return }
          onFileOpen(node)
        }}
        style={{
          paddingLeft: depth * 12 + 6, paddingRight: 6,
          height: 26, display: 'flex', alignItems: 'center', gap: 4,
          cursor: 'pointer', borderRadius: 3,
          color: node.remote ? 'var(--warning)' : 'var(--text-primary)',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >
        {/* Chevron for dirs */}
        <span style={{ width: 14, display: 'flex', alignItems: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
          {node.type === 'directory'
            ? (expanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />)
            : null}
        </span>

        {/* File/folder icon */}
        <span style={{ display: 'flex', alignItems: 'center', color: node.remote ? 'var(--warning)' : 'var(--accent)', flexShrink: 0 }}>
          {node.type === 'directory'
            ? (expanded ? <IconFolderOpen size={14} /> : <IconFolder size={14} />)
            : fileIconComponent(node)}
        </span>

        <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {node.name}
        </span>
        {node.remote && <span style={{ fontSize: 9, color: 'var(--warning)', flexShrink: 0, opacity: 0.8 }}>remote</span>}
      </div>

      {node.type === 'directory' && expanded && node.children?.map(child => (
        <TreeNode key={child.path} node={child} depth={depth + 1}
          onFileOpen={onFileOpen} onContext={onContext}
          onDragStart={onDragStart} onDrop={onDrop} onFileOpenSplit={onFileOpenSplit} />
      ))}
    </div>
  )
}

export default function FileExplorer({ rootPath, tree, onFileOpen, onRefresh, remoteFiles, onRemoteCopy, onFileOpenSplit }: Props) {
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const [renaming, setRenaming] = useState<FileNode | null>(null)
  const [newName, setNewName] = useState('')
  const dragRef = useRef<FileNode | null>(null)

  const closeCtx = useCallback(() => setContextMenu(null), [])

  const handleDrop = useCallback(async (target: FileNode) => {
    const src = dragRef.current
    if (!src || target.type !== 'directory' || src.path === target.path) return
    await window.api.move(src.path, target.path + '/' + src.name)
    onRefresh()
    dragRef.current = null
  }, [onRefresh])

  const createNew = useCallback(async (type: 'file' | 'folder', basePath?: string) => {
    const base = basePath ?? rootPath
    if (!base) return
    const label = type === 'file' ? 'File name:' : 'Folder name:'
    const name = prompt(label)
    if (!name) return
    if (type === 'file') await window.api.createFile(base + '/' + name)
    else await window.api.createFolder(base + '/' + name)
    onRefresh()
  }, [rootPath, onRefresh])

  const execCtx = useCallback(async (action: string) => {
    const node = contextMenu?.node
    if (!node) return
    closeCtx()
    const base = node.type === 'directory' ? node.path : node.path.split(/[/\\]/).slice(0, -1).join('/')
    if (action === 'new-file') {
      await createNew('file', base)
    } else if (action === 'new-folder') {
      await createNew('folder', base)
    } else if (action === 'rename') {
      setRenaming(node); setNewName(node.name)
    } else if (action === 'copy') {
      await window.api.copy(node.path, base + '/copy_' + node.name); onRefresh()
    } else if (action === 'delete') {
      if (confirm(`Delete "${node.name}"?`)) { await window.api.delete(node.path); onRefresh() }
    } else if (action === 'remote-copy' && onRemoteCopy) {
      onRemoteCopy(node)
    }
  }, [contextMenu, closeCtx, onRefresh, onRemoteCopy, createNew])

  const doRename = async () => {
    if (!renaming || !newName) return
    const dir = renaming.path.split(/[/\\]/).slice(0, -1).join('/')
    await window.api.rename(renaming.path, dir + '/' + newName)
    setRenaming(null); onRefresh()
  }

  const [dropActive, setDropActive] = useState(false)

  const handleExternalDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDropActive(false)
    if (!rootPath) return
    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      const src = (file as any).path as string
      if (!src) continue
      const dest = rootPath + '/' + file.name
      await window.api.copyExternal(src, dest)
    }
    onRefresh()
  }, [rootPath, onRefresh])

  return (
    <div
      style={{ flex: 1, overflow: 'auto', position: 'relative', display: 'flex', flexDirection: 'column', outline: dropActive ? '2px dashed var(--accent)' : 'none' }}
      onClick={closeCtx}
      onDragOver={e => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDropActive(true) } }}
      onDragLeave={() => setDropActive(false)}
      onDrop={handleExternalDrop}
    >

      {/* Header */}
      <div style={{
        padding: '0 8px', height: 32, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Explorer
        </span>
        <div style={{ display: 'flex', gap: 2 }}>
          <button title="New File" onClick={() => createNew('file')}
            style={{ padding: '2px 4px', color: 'var(--text-secondary)', display: 'flex' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}>
            <IconNewFile size={14} />
          </button>
          <button title="New Folder" onClick={() => createNew('folder')}
            style={{ padding: '2px 4px', color: 'var(--text-secondary)', display: 'flex' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}>
            <IconNewFolder size={14} />
          </button>
          <button title="Refresh" onClick={onRefresh}
            style={{ padding: '2px 4px', color: 'var(--text-secondary)', display: 'flex' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}>
            <IconRefresh size={14} />
          </button>
        </div>
      </div>

      {/* Local tree */}
      <div style={{ flex: 1, overflow: 'auto', paddingTop: 2 }}>
        {tree ? (
          <TreeNode node={tree} depth={0} onFileOpen={onFileOpen}
            onContext={(e, n) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, node: n }) }}
            onDragStart={n => { dragRef.current = n }}
            onDrop={handleDrop} onFileOpenSplit={onFileOpenSplit} />
        ) : (
          <div style={{ padding: '24px 16px', color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', lineHeight: 1.8 }}>
            <IconFolder size={32} color="var(--text-muted)" style={{ margin: '0 auto 8px', display: 'block' }} />
            No folder open<br />
            <span style={{ fontSize: 11 }}>Use Open Folder above</span>
          </div>
        )}

        {/* Remote tree */}
        {remoteFiles === 'loading' && (
          <div style={{ marginTop: 8, borderTop: '1px solid var(--border)' }}>
            <div style={{ padding: '6px 8px', fontSize: 10, color: 'var(--warning)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Remote Files
            </div>
            <div style={{ padding: '16px 8px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12 }}>
              <svg style={{ animation: 'spin 1s linear infinite' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              A carregar repositório…
            </div>
          </div>
        )}
        {remoteFiles && remoteFiles !== 'loading' && (
          <div style={{ marginTop: 8, borderTop: '1px solid var(--border)' }}>
            <div style={{ padding: '6px 8px', fontSize: 10, color: 'var(--warning)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Remote Files
            </div>
            <TreeNode node={remoteFiles as FileNode} depth={0} onFileOpen={onFileOpen}
              onContext={(e, n) => setContextMenu({ x: e.clientX, y: e.clientY, node: n })}
              onDragStart={n => { dragRef.current = n }}
              onDrop={handleDrop} />
          </div>
        )}
      </div>

      {/* Rename modal */}
      {renaming && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }} onClick={() => setRenaming(null)}>
          <div style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 8, border: '1px solid var(--border)', minWidth: 300 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: 12, fontWeight: 600 }}>Rename</div>
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') doRename(); if (e.key === 'Escape') setRenaming(null) }}
              style={{ width: '100%', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setRenaming(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={doRename}>Rename</button>
            </div>
          </div>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}>
          <div className="context-menu-item" onClick={() => execCtx('new-file')}>
            <IconNewFile size={13} /><span>New File</span>
          </div>
          <div className="context-menu-item" onClick={() => execCtx('new-folder')}>
            <IconNewFolder size={13} /><span>New Folder</span>
          </div>
          <div className="context-menu-separator" />
          <div className="context-menu-item" onClick={() => execCtx('rename')}>
            <IconRename size={13} /><span>Rename</span>
          </div>
          <div className="context-menu-item" onClick={() => execCtx('copy')}>
            <IconCopy size={13} /><span>Copy</span>
          </div>
          {contextMenu.node.remote && onRemoteCopy && (
            <div className="context-menu-item" onClick={() => execCtx('remote-copy')}>
              <IconDownload size={13} /><span>Copy to Local</span>
            </div>
          )}
          {onFileOpenSplit && contextMenu.node.type === 'file' && (
            <div className="context-menu-item" onClick={() => { closeCtx(); onFileOpenSplit(contextMenu.node) }}>
              <IconFileCode size={13} /><span>Open in Split</span>
            </div>
          )}
          <div className="context-menu-separator" />
          <div className="context-menu-item danger" onClick={() => execCtx('delete')}>
            <IconDelete size={13} /><span>Delete</span>
          </div>
        </div>
      )}
    </div>
  )
}
