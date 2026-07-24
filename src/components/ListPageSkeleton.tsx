import { Skeleton } from '@/components/ui/skeleton'

export function ListPageSkeleton({
  count = 6,
  cardHeight = 140,
}: {
  count?: number
  cardHeight?: number
}) {
  return (
    <div className="min-h-[400px]">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <Skeleton key={i} style={{ height: cardHeight }} className="rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
