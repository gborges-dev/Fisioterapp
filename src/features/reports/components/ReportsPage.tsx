import SearchIcon from '@mui/icons-material/Search'
import {
  Alert,
  Autocomplete,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  InputAdornment,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { LineChart } from '@mui/x-charts/LineChart'
import { useTheme } from '@mui/material/styles'
import { useCallback, useMemo, useState } from 'react'

import { PageBreadcrumbs } from '../../../components/PageBreadcrumbs'
import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { useSortState, useTableFilterSort } from '../../../hooks/useTableFilterSort'
import { useDashboardEvolutionOverview } from '../../dashboard/hooks/useDashboardEvolutionOverview'
import type { PatientEvolutionOverviewItem } from '../../dashboard/services/dashboardApi'
import { usePatients } from '../../patients/hooks/usePatients'
import type { PatientRow } from '../../patients/services/patientsApi'
import {
  useClinicEvolutionDaily,
  useClinicSummary,
  useFormSubmissionsReport,
  usePatientEvolutionReport,
} from '../hooks/useReportQueries'
import { formatSubmissionAnswersSummary } from '../utils/formatSubmissionAnswers'
import { useFormTemplates } from '../../form-builder/hooks/useFormTemplates'
import type { FormTemplateRow } from '../../form-builder/types'

function defaultDateRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return {
    from: from.toLocaleDateString('sv-SE'),
    to: to.toLocaleDateString('sv-SE'),
  }
}

function shortDate(ymd: string) {
  const [, m, d] = ymd.split('-')
  return d && m ? `${d}/${m}` : ymd
}

type OverviewSortKey = keyof PatientEvolutionOverviewItem

function compareOverview(
  a: PatientEvolutionOverviewItem,
  b: PatientEvolutionOverviewItem,
  key: OverviewSortKey,
): number {
  const va = a[key]
  const vb = b[key]
  if (typeof va === 'number' && typeof vb === 'number') return va - vb
  const sa = va == null ? '' : String(va)
  const sb = vb == null ? '' : String(vb)
  return sa.localeCompare(sb, 'pt')
}

export function ReportsPage() {
  const theme = useTheme()
  const [tab, setTab] = useState(0)
  const range = useMemo(() => defaultDateRange(), [])
  const [patient, setPatient] = useState<PatientRow | null>(null)
  const [evoFrom, setEvoFrom] = useState(range.from)
  const [evoTo, setEvoTo] = useState(range.to)
  const [clinicFrom, setClinicFrom] = useState(range.from)
  const [clinicTo, setClinicTo] = useState(range.to)

  const [formTemplate, setFormTemplate] = useState<FormTemplateRow | null>(null)
  const [formReportPatient, setFormReportPatient] = useState<PatientRow | null>(
    null,
  )
  const [formFrom, setFormFrom] = useState('')
  const [formTo, setFormTo] = useState('')

  const { data: patients, isLoading: loadingPatients } = usePatients()
  const { data: formTemplates, isLoading: loadingFormTemplates } =
    useFormTemplates()
  const evoReport = usePatientEvolutionReport(
    patient?.id ?? null,
    evoFrom,
    evoTo,
  )

  const overview = useDashboardEvolutionOverview()
  const [overviewFilter, setOverviewFilter] = useState('')
  const { orderBy, order, handleRequestSort } =
    useSortState<OverviewSortKey>('fullName')

  const getOverviewHaystack = useCallback((row: PatientEvolutionOverviewItem) => {
    return [
      row.fullName,
      row.consultationReason ?? '',
      row.firstEvolutionDate ?? '',
      row.lastEvolutionDate ?? '',
      row.lastEvolutionPreview ?? '',
      String(row.evolutionCount),
    ].join(' ')
  }, [])

  const overviewCompare = useCallback(
    (a: PatientEvolutionOverviewItem, b: PatientEvolutionOverviewItem, k: string) =>
      compareOverview(a, b, k as OverviewSortKey),
    [],
  )

  const overviewRows = useTableFilterSort({
    rows: overview.data?.rows,
    filterText: overviewFilter,
    getFilterHaystack: getOverviewHaystack,
    orderBy,
    order,
    compare: overviewCompare,
  })

  const clinicSummary = useClinicSummary(clinicFrom, clinicTo)
  const clinicDaily = useClinicEvolutionDaily(clinicFrom, clinicTo)

  const formSubmissionsReport = useFormSubmissionsReport(
    formTemplate?.id ?? null,
    formReportPatient?.id ?? null,
    formFrom,
    formTo,
  )

  const formPeriodPartial =
    Boolean(formFrom.trim()) !== Boolean(formTo.trim())
  const formPeriodInvalid =
    Boolean(formFrom.trim()) &&
    Boolean(formTo.trim()) &&
    formFrom > formTo

  const evoByDay = useMemo(() => {
    const rows = evoReport.data ?? []
    const map = new Map<string, number>()
    for (const e of rows) {
      const d = e.entry_date as string
      map.set(d, (map.get(d) ?? 0) + 1)
    }
    const points: { date: string; count: number }[] = []
    const cur = new Date(`${evoFrom}T12:00:00`)
    const end = new Date(`${evoTo}T12:00:00`)
    if (cur > end) return points
    while (cur <= end) {
      const ymd = cur.toLocaleDateString('sv-SE')
      points.push({ date: ymd, count: map.get(ymd) ?? 0 })
      cur.setDate(cur.getDate() + 1)
    }
    return points
  }, [evoReport.data, evoFrom, evoTo])

  return (
    <Box>
      <PageBreadcrumbs
        items={[
          { label: 'Painel', to: '/' },
          { label: 'Relatórios' },
        ]}
      />
      <Typography variant="h4" component="h2" gutterBottom>
        Relatórios
      </Typography>
      <SupabaseConfigAlert />

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab label="Evolução por paciente" />
        <Tab label="Todos os pacientes" />
        <Tab label="Resumo da clínica" />
        <Tab label="Formulários respondidos" />
      </Tabs>

      {tab === 0 ? (
        <Box>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={patients ?? []}
                loading={loadingPatients}
                value={patient}
                onChange={(_, v) => setPatient(v)}
                getOptionLabel={(p) => p.full_name}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Paciente"
                    placeholder="Selecionar…"
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="De"
                type="date"
                value={evoFrom}
                onChange={(e) => setEvoFrom(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Até"
                type="date"
                value={evoTo}
                onChange={(e) => setEvoTo(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            </Grid>
          </Grid>

          {!patient ? (
            <Typography color="text.secondary">
              Escolha um paciente para ver o relatório de evolução.
            </Typography>
          ) : evoReport.isLoading ? (
            <CircularProgress />
          ) : evoReport.isError ? (
            <Alert severity="error">
              {(evoReport.error as Error).message}
            </Alert>
          ) : (
            <>
              {evoByDay.some((p) => p.count > 0) ? (
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Registos por dia
                    </Typography>
                    <LineChart
                      height={240}
                      margin={{ left: 36, right: 8, top: 8, bottom: 24 }}
                      xAxis={[
                        {
                          scaleType: 'point',
                          data: evoByDay.map((p) => shortDate(p.date)),
                          tickLabelStyle: { fontSize: 10 },
                        },
                      ]}
                      series={[
                        {
                          data: evoByDay.map((p) => p.count),
                          label: 'Registos',
                          color: theme.palette.primary.main,
                          area: true,
                          showMark: true,
                        },
                      ]}
                      grid={{ vertical: true, horizontal: true }}
                      hideLegend
                    />
                  </CardContent>
                </Card>
              ) : null}

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Data</TableCell>
                      <TableCell>Conteúdo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(evoReport.data ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2}>
                          <Typography color="text.secondary">
                            Sem registos de evolução neste período.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      (evoReport.data ?? []).map((row) => (
                        <TableRow key={row.id}>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {row.entry_date as string}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {(row.content as string) || '—'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      ) : null}

      {tab === 1 ? (
        <Box>
          <TextField
            placeholder="Pesquisar…"
            value={overviewFilter}
            onChange={(e) => setOverviewFilter(e.target.value)}
            size="small"
            fullWidth
            sx={{ mb: 2, maxWidth: 480 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          {overview.isLoading ? <CircularProgress /> : null}
          {overview.isError ? (
            <Alert severity="error">
              {(overview.error as Error).message}
            </Alert>
          ) : null}
          {overview.data ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sortDirection={orderBy === 'fullName' ? order : false}>
                      <TableSortLabel
                        active={orderBy === 'fullName'}
                        direction={orderBy === 'fullName' ? order : 'asc'}
                        onClick={() => handleRequestSort('fullName')}
                      >
                        Paciente
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sortDirection={orderBy === 'consultationReason' ? order : false}
                      sx={{ display: { xs: 'none', md: 'table-cell' } }}
                    >
                      <TableSortLabel
                        active={orderBy === 'consultationReason'}
                        direction={orderBy === 'consultationReason' ? order : 'asc'}
                        onClick={() => handleRequestSort('consultationReason')}
                      >
                        Motivo consulta
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sortDirection={orderBy === 'firstEvolutionDate' ? order : false}>
                      <TableSortLabel
                        active={orderBy === 'firstEvolutionDate'}
                        direction={orderBy === 'firstEvolutionDate' ? order : 'asc'}
                        onClick={() => handleRequestSort('firstEvolutionDate')}
                      >
                        1.ª evolução
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sortDirection={orderBy === 'lastEvolutionDate' ? order : false}>
                      <TableSortLabel
                        active={orderBy === 'lastEvolutionDate'}
                        direction={orderBy === 'lastEvolutionDate' ? order : 'asc'}
                        onClick={() => handleRequestSort('lastEvolutionDate')}
                      >
                        Última evolução
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      align="right"
                      sortDirection={orderBy === 'evolutionCount' ? order : false}
                    >
                      <TableSortLabel
                        active={orderBy === 'evolutionCount'}
                        direction={orderBy === 'evolutionCount' ? order : 'asc'}
                        onClick={() => handleRequestSort('evolutionCount')}
                      >
                        N.º evoluções
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {overviewRows.map((row) => (
                    <TableRow key={row.patientId}>
                      <TableCell>{row.fullName}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, maxWidth: 200 }}>
                        <Typography variant="body2" noWrap title={row.consultationReason ?? ''}>
                          {row.consultationReason?.trim() || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.firstEvolutionDate ?? '—'}</TableCell>
                      <TableCell>{row.lastEvolutionDate ?? '—'}</TableCell>
                      <TableCell align="right">{row.evolutionCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </Box>
      ) : null}

      {tab === 2 ? (
        <Box>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                label="De"
                type="date"
                value={clinicFrom}
                onChange={(e) => setClinicFrom(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                label="Até"
                type="date"
                value={clinicTo}
                onChange={(e) => setClinicTo(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            </Grid>
          </Grid>

          {clinicSummary.isLoading || clinicDaily.isLoading ? (
            <CircularProgress />
          ) : null}
          {clinicSummary.isError ? (
            <Alert severity="error">
              {(clinicSummary.error as Error).message}
            </Alert>
          ) : null}
          {clinicSummary.data ? (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary" variant="body2">
                        Novos pacientes
                      </Typography>
                      <Typography variant="h5">
                        {clinicSummary.data.newPatients}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary" variant="body2">
                        Registos de evolução
                      </Typography>
                      <Typography variant="h5">
                        {clinicSummary.data.evolutionEntries}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary" variant="body2">
                        Respostas a formulários
                      </Typography>
                      <Typography variant="h5">
                        {clinicSummary.data.formSubmissions}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Período: {clinicSummary.data.fromYmd} a {clinicSummary.data.toYmd}.
                Os totais refletem a atividade registada na base de dados neste
                intervalo.
              </Typography>
            </>
          ) : null}

          {clinicDaily.data && clinicDaily.data.length > 0 ? (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Evoluções por dia no período
                </Typography>
                <BarChart
                  height={280}
                  margin={{ left: 40, right: 12, top: 8, bottom: 48 }}
                  xAxis={[
                    {
                      scaleType: 'band',
                      data: clinicDaily.data.map((p) => shortDate(p.date)),
                      tickLabelStyle: { fontSize: 9, angle: -45, textAnchor: 'end' },
                    },
                  ]}
                  series={[
                    {
                      data: clinicDaily.data.map((p) => p.count),
                      label: 'Evoluções',
                      color: theme.palette.primary.main,
                    },
                  ]}
                  grid={{ horizontal: true }}
                  hideLegend
                />
              </CardContent>
            </Card>
          ) : null}
        </Box>
      ) : null}

      {tab === 3 ? (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Escolha o formulário (obrigatório). O paciente e o período são
            opcionais: sem período são listadas todas as respostas desse modelo;
            com paciente, apenas respostas enviadas por links associados a esse
            paciente.
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={formTemplates ?? []}
                loading={loadingFormTemplates}
                value={formTemplate}
                onChange={(_, v) => setFormTemplate(v)}
                getOptionLabel={(t) => t.title}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Formulário"
                    placeholder="Selecionar modelo…"
                    required
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={patients ?? []}
                loading={loadingPatients}
                value={formReportPatient}
                onChange={(_, v) => setFormReportPatient(v)}
                getOptionLabel={(p) => p.full_name}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Paciente (opcional)"
                    placeholder="Qualquer paciente / link geral"
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Período — de (opcional)"
                type="date"
                value={formFrom}
                onChange={(e) => setFormFrom(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Período — até (opcional)"
                type="date"
                value={formTo}
                onChange={(e) => setFormTo(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            </Grid>
          </Grid>

          {formPeriodPartial ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Preencha as duas datas do período ou deixe as duas em branco.
            </Alert>
          ) : null}
          {formPeriodInvalid ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              A data inicial não pode ser posterior à data final.
            </Alert>
          ) : null}

          {!formTemplate ? (
            <Typography color="text.secondary">
              Selecione um formulário para carregar as respostas.
            </Typography>
          ) : formSubmissionsReport.isLoading ? (
            <CircularProgress />
          ) : formSubmissionsReport.isError ? (
            <Alert severity="error">
              {(formSubmissionsReport.error as Error).message}
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Data e hora</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      Paciente
                    </TableCell>
                    <TableCell>Respostas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(formSubmissionsReport.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography color="text.secondary">
                          Nenhuma resposta encontrada com estes critérios.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (formSubmissionsReport.data ?? []).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {new Date(row.created_at).toLocaleString('pt-PT', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          {row.patientName ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                            {formatSubmissionAnswersSummary(
                              formTemplate.schema,
                              row.answers,
                            )}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      ) : null}
    </Box>
  )
}
