import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { Breadcrumbs, Link, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

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
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" sx={{ opacity: 0.6 }} />}
      aria-label="Navegação estrutural"
      sx={{ mb: 2 }}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        if (isLast || !item.to) {
          return (
            <Typography
              key={`${item.label}-${i}`}
              color="text.primary"
              variant="body2"
              fontWeight={isLast ? 600 : 400}
            >
              {item.label}
            </Typography>
          )
        }
        return (
          <Link
            key={item.to}
            component={RouterLink}
            to={item.to}
            underline="hover"
            color="inherit"
            variant="body2"
          >
            {item.label}
          </Link>
        )
      })}
    </Breadcrumbs>
  )
}
