import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

import { AppRoutes } from './app/AppRoutes.tsx'
import { ToastProvider } from './components/toast'
import { AuthProvider } from './features/auth/AuthContext'
import { TooltipProvider } from './components/ui/tooltip'

export function ThemedApp() {
  return (
    <TooltipProvider delayDuration={300}>
      <ToastProvider>
        <Toaster
          position="bottom-center"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: 'glass-strong border-border',
            },
          }}
        />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </TooltipProvider>
  )
}
