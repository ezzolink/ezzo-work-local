import { create } from 'zustand'
import type { Socket } from 'socket.io-client'
import type { FileNode, OpenedFile, Peer } from '../types'

interface ChatMsg { id: string; author: string; text: string; ts: number }

interface AppState {
  // Files
  openedFiles: OpenedFile[]
  activeFile: string | null
  localFolder: string | null

  // Split
  splitFiles: OpenedFile[]
  splitActive: string | null
  splitEnabled: boolean

  // Network
  remoteSocket: Socket | null
  isHost: boolean
  connectedPeers: Peer[]
  peerPermissions: Record<string, 'read-only' | 'read-write'>
  remoteRootPath: string | null

  // Chat
  chatMsgs: ChatMsg[]

  // Actions
  setLocalFolder: (path: string | null) => void
  openFile: (file: OpenedFile) => void
  closeFile: (path: string) => void
  setActiveFile: (path: string) => void
  updateFileContent: (path: string, content: string) => void
  markFileSaved: (path: string) => void
  setRemoteSocket: (socket: Socket | null) => void
  setIsHost: (value: boolean) => void
  addPeer: (peer: Peer) => void
  removePeer: (id: string) => void
  setPeerPermission: (id: string, perm: 'read-only' | 'read-write') => void
  setRemoteRootPath: (path: string | null) => void
  addChatMsg: (msg: ChatMsg) => void

  // Split actions
  openFileSplit: (file: OpenedFile) => void
  closeFileSplit: (path: string) => void
  setSplitActive: (path: string) => void
  setSplitEnabled: (v: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  openedFiles: [],
  activeFile: null,
  localFolder: null,
  splitFiles: [],
  splitActive: null,
  splitEnabled: false,
  remoteSocket: null,
  isHost: false,
  connectedPeers: [],
  peerPermissions: {},
  remoteRootPath: null,
  chatMsgs: [],

  setLocalFolder: (path) => set({ localFolder: path }),

  openFile: (file) =>
    set((s) => {
      const exists = s.openedFiles.find((f) => f.path === file.path)
      if (exists) return { activeFile: file.path }
      return { openedFiles: [...s.openedFiles, file], activeFile: file.path }
    }),

  closeFile: (path) =>
    set((s) => {
      const remaining = s.openedFiles.filter((f) => f.path !== path)
      const activeFile =
        s.activeFile === path ? (remaining[remaining.length - 1]?.path ?? null) : s.activeFile
      return { openedFiles: remaining, activeFile }
    }),

  setActiveFile: (path) => set({ activeFile: path }),

  updateFileContent: (path, content) =>
    set((s) => ({
      openedFiles: s.openedFiles.map((f) =>
        f.path === path ? { ...f, content, modified: true } : f,
      ),
      splitFiles: s.splitFiles.map((f) =>
        f.path === path ? { ...f, content, modified: true } : f,
      ),
    })),

  markFileSaved: (path) =>
    set((s) => ({
      openedFiles: s.openedFiles.map((f) => (f.path === path ? { ...f, modified: false } : f)),
      splitFiles: s.splitFiles.map((f) => (f.path === path ? { ...f, modified: false } : f)),
    })),

  setRemoteSocket: (socket) => set({ remoteSocket: socket }),
  setIsHost: (value) => set({ isHost: value }),
  addPeer: (peer) => set((s) => ({ connectedPeers: [...s.connectedPeers, peer] })),
  removePeer: (id) =>
    set((s) => ({ connectedPeers: s.connectedPeers.filter((p) => p.id !== id) })),
  setPeerPermission: (id, perm) =>
    set((s) => ({ peerPermissions: { ...s.peerPermissions, [id]: perm } })),
  setRemoteRootPath: (path) => set({ remoteRootPath: path }),
  addChatMsg: (msg) => set((s) => ({ chatMsgs: [...s.chatMsgs, msg] })),

  openFileSplit: (file) =>
    set((s) => {
      const exists = s.splitFiles.find((f) => f.path === file.path)
      if (exists) return { splitActive: file.path, splitEnabled: true }
      return { splitFiles: [...s.splitFiles, file], splitActive: file.path, splitEnabled: true }
    }),

  closeFileSplit: (path) =>
    set((s) => {
      const remaining = s.splitFiles.filter((f) => f.path !== path)
      const splitActive =
        s.splitActive === path ? (remaining[remaining.length - 1]?.path ?? null) : s.splitActive
      return { splitFiles: remaining, splitActive, splitEnabled: remaining.length > 0 }
    }),

  setSplitActive: (path) => set({ splitActive: path }),

  setSplitEnabled: (v) => set({ splitEnabled: v }),
}))
