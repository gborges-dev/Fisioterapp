import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material'

import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { useDashboardSummary } from '../hooks/useDashboardSummary'

export function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboardSummary()

  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom>
        Painel
      </Typography>
      <SupabaseConfigAlert />
      {isLoading ? (
        <CircularProgress aria-label="A carregar métricas" />
      ) : null}
      {isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(error as Error).message}
        </Alert>
      ) : null}
      {data ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary">Pacientes</Typography>
                <Typography variant="h5">{data.patientCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary">
                  Evoluções (7 dias)
                </Typography>
                <Typography variant="h5">{data.evolutionLast7Days}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary">
                  Respostas a formulários (7 dias)
                </Typography>
                <Typography variant="h5">
                  {data.submissionsLast7Days}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary">Formulários</Typography>
                <Typography variant="h5">{data.formTemplateCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : null}
    </Box>
  )
}
