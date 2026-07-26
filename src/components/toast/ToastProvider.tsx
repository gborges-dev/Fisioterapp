import { useLayoutEffect, useMemo, type ReactNode } from 'react'
import { toast } from 'sonner'

import { getFriendlyErrorMessage } from '@/lib/apiError'

import { ToastContext } from './toastContext'
import { registerToastHandlers } from './toastBridge'

function normalizeError(message: string | Error): string {
  if (typeof message === 'string') {
    return getFriendlyErrorMessage(new Error(message))
  }
  return getFriendlyErrorMessage(message)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const showSuccess = useMemo(
    () => (message: string) => {
      toast.success(message)
    },
    [],
  )

  const showError = useMemo(
    () => (message: string | Error) => {
      toast.error(normalizeError(message))
    },
    [],
  )

  const value = useMemo(
    () => ({ showSuccess, showError }),
    [showSuccess, showError],
  )

  useLayoutEffect(() => {
    registerToastHandlers({ showSuccess, showError })
    return () => registerToastHandlers(null)
  }, [showSuccess, showError])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}
