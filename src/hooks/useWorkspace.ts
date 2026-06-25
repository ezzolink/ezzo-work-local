import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'

const KEY = 'ezzo-workspace'

interface WorkspaceData {
  folder: string | null
  openedFiles: string[]
  activeFile: string | null
  terminalHeight: number
  activePanel: string
}

export function useSaveWorkspace(terminalHeight: number, activePanel: string) {
  const { localFolder, openedFiles, activeFile } = useAppStore()

  const save = () => {
    const data: WorkspaceData = {
      folder: localFolder,
      openedFiles: openedFiles.map(f => f.path),
      activeFile,
      terminalHeight,
      activePanel,
    }
    try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* ignore */ }
  }

  useEffect(() => {
    window.addEventListener('beforeunload', save)
    return () => { save(); window.removeEventListener('beforeunload', save) }
  })
}

export function loadWorkspace(): WorkspaceData | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as WorkspaceData) : null
  } catch {
    return null
  }
}
