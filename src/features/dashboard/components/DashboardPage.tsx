import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Link as MuiLink,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { Link } from 'react-router-dom'

import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { useDashboardEvolutionOverview } from '../hooks/useDashboardEvolutionOverview'
import { useDashboardSummary } from '../hooks/useDashboardSummary'

export function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboardSummary()
  const {
    data: overview,
    isLoading: lo,
    isError: eo,
    error: errO,
  } = useDashboardEvolutionOverview()

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

      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Acompanhamento: ficha vs evolução
      </Typography>
      {overview ? (
        <StackChips
          withEvolution={overview.withEvolutionLast7Days}
          without={overview.withoutEvolution}
        />
      ) : null}
      {lo ? <CircularProgress size={28} sx={{ my: 2 }} /> : null}
      {eo ? (
        <Alert severity="error">{(errO as Error).message}</Alert>
      ) : null}
      {overview && overview.rows.length > 0 ? (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Paciente</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  Motivo da consulta
                </TableCell>
                <TableCell>1.ª evolução</TableCell>
                <TableCell>Última evolução</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {overview.rows.map((row) => (
                <TableRow key={row.patientId}>
                  <TableCell>{row.fullName}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, maxWidth: 240 }}>
                    <Typography variant="body2" noWrap title={row.consultationReason ?? ''}>
                      {row.consultationReason?.trim() || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.firstEvolutionDate ?? '—'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" component="span">
                      {row.lastEvolutionDate ?? '—'}
                    </Typography>
                    {row.lastEvolutionPreview ? (
                      <Typography variant="caption" color="text.secondary" display="block" noWrap>
                        {row.lastEvolutionPreview}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell align="right">
                    <MuiLink component={Link} to={`/patients/${row.patientId}/comparar`}>
                      Comparar
                    </MuiLink>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
      {overview && overview.rows.length === 0 ? (
        <Typography color="text.secondary">Sem pacientes registados.</Typography>
      ) : null}
    </Box>
  )
}

function StackChips({
  withEvolution,
  without,
}: {
  withEvolution: number
  without: number
}) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
      <Chip
        label={`Com evolução nos últimos 7 dias: ${withEvolution}`}
        variant="outlined"
        size="small"
      />
      <Chip
        label={`Sem evolução registada: ${without}`}
        variant="outlined"
        size="small"
      />
    </Box>
  )
}
