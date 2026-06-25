import { useEffect, useState } from 'react'

export interface UpdateInfo {
  hasUpdate: boolean
  current: string
  latest: string
  notes: string
  url: string
  assets: { name: string; browser_download_url: string; size: number }[]
}

export function useUpdate() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null)
  const [checking, setChecking] = useState(false)

  const check = async () => {
    setChecking(true)
    try {
      const info = await window.api.checkUpdate?.()
      if (info) setUpdate(info)
    } catch { /* offline */ }
    setChecking(false)
  }

  // Auto-check on mount (once)
  useEffect(() => { check() }, []) // eslint-disable-line

  return { update, checking, check }
}
