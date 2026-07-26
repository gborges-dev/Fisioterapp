import { createContext } from 'react'

import type { ColorMode } from './colorMode'

export type ColorModeContextValue = {
  mode: ColorMode
  toggleColorMode: () => void
}

export const ColorModeContext = createContext<ColorModeContextValue | null>(null)
