import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { ThemedApp } from './ThemedApp'
import { ColorModeProvider } from './theme/ColorModeProvider'
import './index.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ColorModeProvider>
        <ThemedApp />
      </ColorModeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
