import { Box, Grid, Skeleton } from '@mui/material'

export function ListPageSkeleton({
  count = 6,
  cardHeight = 140,
}: {
  count?: number
  cardHeight?: number
}) {
  return (
    <Box sx={{ minHeight: 400 }}>
      <Grid container spacing={2}>
        {Array.from({ length: count }, (_, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Skeleton variant="rectangular" height={cardHeight} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
