import { memo, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

export const ListCard = memo(function ListCard({
  children,
  actions,
  className,
}: {
  children: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'glass lift flex h-full flex-col rounded-2xl transition-colors',
        className,
      )}
    >
      <div className="flex flex-1 flex-col p-5 pt-4">{children}</div>
      {actions ? (
        <div className="flex flex-wrap justify-end gap-1 px-5 pb-4 pt-0">
          {actions}
        </div>
      ) : null}
    </div>
  )
})
