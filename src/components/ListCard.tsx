import {
  Card,
  CardActions,
  CardContent,
  type CardProps,
} from '@mui/material'
import { memo, type ReactNode } from 'react'

export const ListCard = memo(function ListCard({
  children,
  actions,
  contentSx,
  ...cardProps
}: {
  children: ReactNode
  actions?: ReactNode
  contentSx?: CardProps['sx']
} & Omit<CardProps, 'children'>) {
  return (
    <Card
      variant="outlined"
      {...cardProps}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        transition: (t) =>
          t.transitions.create(['box-shadow', 'border-color'], {
            duration: t.transitions.duration.shorter,
          }),
        '&:hover': {
          borderColor: 'primary.light',
          boxShadow: (t) => t.shadows[2],
        },
        ...cardProps.sx,
      }}
    >
      <CardContent sx={{ flexGrow: 1, pt: 2, ...contentSx }}>{children}</CardContent>
      {actions ? (
        <CardActions
          sx={{
            justifyContent: 'flex-end',
            px: 2,
            pb: 2,
            pt: 0,
            flexWrap: 'wrap',
            gap: 0.5,
          }}
        >
          {actions}
        </CardActions>
      ) : null}
    </Card>
  )
})
