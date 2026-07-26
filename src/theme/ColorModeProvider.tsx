import { useCallback, useEffect, useMemo, useState } from 'react'

import { ColorModeContext } from './colorModeContext'
import type { ColorMode } from './colorMode'

const STORAGE_KEY = 'fisioterapp-color-mode'

function readStoredMode(): ColorMode | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* ignore */
  }
  return null
}

function getInitialMode(): ColorMode {
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

function applyMode(mode: ColorMode) {
  const root = document.documentElement
  root.classList.toggle('dark', mode === 'dark')
  root.style.colorScheme = mode
}

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ColorMode>(() => {
    const m = getInitialMode()
    if (typeof document !== 'undefined') {
      applyMode(m)
    }
    return m
  })

  useEffect(() => {
    applyMode(mode)
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
