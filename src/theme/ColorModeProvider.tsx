import type { PaletteMode } from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { ColorModeContext } from './colorModeContext'

const STORAGE_KEY = 'fisioterapp-color-mode'

function readStoredMode(): PaletteMode | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* ignore */
  }
  return null
}

function getInitialMode(): PaletteMode {
  const stored = readStoredMode()
  if (stored) return stored
  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function'
  ) {
    try {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
    } catch {
      /* ignore */
    }
  }
  return 'light'
}

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(() => {
    const m = getInitialMode()
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = m
      document.documentElement.style.colorScheme = m
    }
    return m
  })

  useEffect(() => {
    document.documentElement.dataset.theme = mode
    document.documentElement.style.colorScheme = mode
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      /* ignore */
    }
  }, [mode])

  const toggleColorMode = useCallback(() => {
    setMode((m) => (m === 'light' ? 'dark' : 'light'))
  }, [])

  const value = useMemo(
    () => ({ mode, toggleColorMode }),
    [mode, toggleColorMode],
  )

  return (
    <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>
  )
}
