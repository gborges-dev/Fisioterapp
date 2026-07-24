import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export type BreadcrumbItem = {
  label: string
  to?: string
}

type PageBreadcrumbsProps = {
  items: BreadcrumbItem[]
}

export function PageBreadcrumbs({ items }: PageBreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <span key={`${item.label}-${i}`} className="contents">
              {i > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {isLast || !item.to ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink to={item.to}>{item.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
