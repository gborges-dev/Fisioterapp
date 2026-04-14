import type { PaletteMode } from '@mui/material'
import { createContext } from 'react'

export type ColorModeContextValue = {
  mode: PaletteMode
  toggleColorMode: () => void
}

export const ColorModeContext = createContext<ColorModeContextValue | null>(null)
