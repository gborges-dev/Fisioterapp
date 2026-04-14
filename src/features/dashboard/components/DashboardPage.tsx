import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'
import { useTheme } from '@mui/material/styles'

import { PageBreadcrumbs } from '../../../components/PageBreadcrumbs'
import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import {
  dashboardChartDays,
  useDashboardEvolutionDaily,
  useDashboardSubmissionsDaily,
} from '../hooks/useDashboardDailySeries'
import { useDashboardSummary } from '../hooks/useDashboardSummary'
import { buildDashboardInsights } from '../utils/dashboardInsights'

function shortDate(ymd: string) {
  const parts = ymd.split('-')
  const m = parts[1]
  const d = parts[2]
  if (!d || !m) return ymd
  return `${d}/${m}`
}

export function DashboardPage() {
  const theme = useTheme()
  const { data, isLoading, isError, error } = useDashboardSummary()
  const evoDaily = useDashboardEvolutionDaily()
  const subDaily = useDashboardSubmissionsDaily()

  const evoPoints = evoDaily.data ?? []
  const subPoints = subDaily.data ?? []
  const xEvo = evoPoints.map((p) => shortDate(p.date))
  const xSub = subPoints.map((p) => shortDate(p.date))

  const insights =
    data && !evoDaily.isLoading && !subDaily.isLoading
      ? buildDashboardInsights(data, evoPoints, subPoints)
      : []

  const chartPrimary = theme.palette.primary.main

  return (
    <Box>
      <PageBreadcrumbs items={[{ label: 'Painel' }]} />
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

          <Grid size={{ xs: 12, lg: 6 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Evoluções por dia (últimos {dashboardChartDays} dias)
                </Typography>
                {evoDaily.isLoading ? (
                  <CircularProgress size={28} />
                ) : evoDaily.isError ? (
                  <Alert severity="error">
                    {(evoDaily.error as Error).message}
                  </Alert>
                ) : (
                  <LineChart
                    height={280}
                    margin={{ left: 40, right: 12, top: 8, bottom: 28 }}
                    xAxis={[
                      {
                        scaleType: 'point',
                        data: xEvo,
                        tickLabelStyle: { fontSize: 11 },
                      },
                    ]}
                    series={[
                      {
                        data: evoPoints.map((p) => p.count),
                        label: 'Registos',
                        color: chartPrimary,
                        area: true,
                        showMark: true,
                      },
                    ]}
                    grid={{ vertical: true, horizontal: true }}
                    hideLegend
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Respostas a formulários por dia (últimos {dashboardChartDays}{' '}
                  dias)
                </Typography>
                {subDaily.isLoading ? (
                  <CircularProgress size={28} />
                ) : subDaily.isError ? (
                  <Alert severity="error">
                    {(subDaily.error as Error).message}
                  </Alert>
                ) : (
                  <LineChart
                    height={280}
                    margin={{ left: 40, right: 12, top: 8, bottom: 28 }}
                    xAxis={[
                      {
                        scaleType: 'point',
                        data: xSub,
                        tickLabelStyle: { fontSize: 11 },
                      },
                    ]}
                    series={[
                      {
                        data: subPoints.map((p) => p.count),
                        label: 'Respostas',
                        color: theme.palette.secondary.main,
                        area: true,
                        showMark: true,
                      },
                    ]}
                    grid={{ vertical: true, horizontal: true }}
                    hideLegend
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AutoAwesomeOutlinedIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Insights automáticos
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Sugestões com base nos números atuais do painel.
                </Typography>
                {insights.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    A carregar…
                  </Typography>
                ) : (
                  <Stack spacing={1.25}>
                    {insights.map((line, i) => (
                      <Card key={i} variant="outlined" sx={{ borderRadius: 2, bgcolor: 'action.hover' }}>
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                            <Typography
                              component="span"
                              variant="caption"
                              color="primary"
                              fontWeight={700}
                              sx={{ mt: 0.15, flexShrink: 0 }}
                            >
                              {i + 1}.
                            </Typography>
                            <Typography variant="body2">{line}</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : null}
    </Box>
  )
}
