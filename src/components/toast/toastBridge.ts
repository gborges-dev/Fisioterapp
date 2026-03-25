type ToastHandlers = {
  showSuccess: (message: string) => void
  showError: (message: string | Error) => void
}

let handlers: ToastHandlers | null = null

export function registerToastHandlers(next: ToastHandlers | null) {
  handlers = next
}

/** Para mutações em hooks (fora de componentes com `useToast`). */
export function toastSuccess(message: string) {
  handlers?.showSuccess(message)
}

/** Para mutações em hooks (fora de componentes com `useToast`). */
export function toastError(message: string | Error) {
  handlers?.showError(message)
}
