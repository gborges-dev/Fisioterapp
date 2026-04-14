import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { useMemo } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { AppRoutes } from './app/AppRoutes.tsx'
import { ToastProvider } from './components/toast'
import { createAppTheme } from './theme/appTheme'
import { useColorMode } from './theme/useColorMode'

export function ThemedApp() {
  const { mode } = useColorMode()
  const theme = useMemo(() => createAppTheme(mode), [mode])
  return (
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <CssBaseline enableColorScheme />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  )
}
