import { ChevronDown, Loader2, Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState, GlassPanel, PageHeader } from '@/components/AppShell'
import { ApiConfigAlert } from '@/components/ApiConfigAlert'
import { GlassAreaChart } from '@/components/charts/GlassAreaChart'
import { GlassBarChart } from '@/components/charts/GlassBarChart'
import { FilterableSelect } from '@/components/FilterableSelect'
import { RichTextContent } from '@/components/RichTextContent'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSortState, useTableFilterSort } from '@/hooks/useTableFilterSort'
import { cn } from '@/lib/utils'
import { useColorMode } from '@/theme/useColorMode'
import { useDashboardEvolutionOverview } from '../../dashboard/hooks/useDashboardEvolutionOverview'
import type { PatientEvolutionOverviewItem } from '../../dashboard/services/dashboardApi'
import { useFinanceEntries } from '../../finance/hooks/useFinance'
import { useFormTemplates } from '../../form-builder/hooks/useFormTemplates'
import type { FormTemplateRow } from '../../form-builder/types'
import { usePatients } from '../../patients/hooks/usePatients'
import type { PatientRow } from '../../patients/services/patientsApi'
import {
  useClinicEvolutionDaily,
  useClinicSummary,
  useFormSubmissionsReport,
  usePatientEvolutionReport,
} from '../hooks/useReportQueries'
import {
  buildDailyCashFlow,
  formatEntryDate,
  formatMoney,
  summarizeCashFlow,
} from '../utils/cashFlowAggregates'
import { exportCashFlowCsv, exportCashFlowPdf } from '../utils/cashFlowExport'
import { formatSubmissionAnswersSummary } from '../utils/formatSubmissionAnswers'

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

function useChartColors() {
  const { mode } = useColorMode()
  return useMemo(() => {
    const root = document.documentElement
    const get = (name: string) =>
      getComputedStyle(root).getPropertyValue(name).trim()
    void mode
    return {
      primary: get('--chart-1') || 'oklch(0.58 0.11 190)',
      success: get('--chart-2') || 'oklch(0.65 0.14 160)',
      error: get('--chart-5') || 'oklch(0.65 0.18 25)',
    }
  }, [mode])
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
  const chartColors = useChartColors()
  const [tab, setTab] = useState('0')
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

  const [cashFrom, setCashFrom] = useState(range.from)
  const [cashTo, setCashTo] = useState(range.to)
  const [cashPatient, setCashPatient] = useState<PatientRow | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const { data: patients, isLoading: loadingPatients } = usePatients()
  const { data: formTemplates, isLoading: loadingFormTemplates } =
    useFormTemplates()
  const evoReport = usePatientEvolutionReport(
    patient?.id ?? null,
    evoFrom,
    evoTo,
  )
  const cashFlowReport = useFinanceEntries({
    from: cashFrom,
    to: cashTo,
    patientId: cashPatient?.id ?? null,
    type: null,
  })
  const cashFlowRows = useMemo(
    () => cashFlowReport.data ?? [],
    [cashFlowReport.data],
  )
  const cashFlowTotals = useMemo(
    () => summarizeCashFlow(cashFlowRows),
    [cashFlowRows],
  )
  const cashFlowDaily = useMemo(
    () => buildDailyCashFlow(cashFlowRows),
    [cashFlowRows],
  )
  const cashExportMeta = useMemo(
    () => ({
      fromYmd: cashFrom,
      toYmd: cashTo,
      patientLabel: cashPatient?.full_name ?? 'Todos os pacientes',
    }),
    [cashFrom, cashTo, cashPatient],
  )
  const cashPeriodInvalid =
    Boolean(cashFrom) && Boolean(cashTo) && cashFrom > cashTo

  const overview = useDashboardEvolutionOverview()
  const [overviewFilter, setOverviewFilter] = useState('')
  const { orderBy, order, handleRequestSort } =
    useSortState<OverviewSortKey>('fullName')

  const patientOptions = useMemo(
    () => (patients ?? []).map((p) => ({ value: p, label: p.full_name })),
    [patients],
  )
  const formTemplateOptions = useMemo(
    () => (formTemplates ?? []).map((t) => ({ value: t, label: t.title })),
    [formTemplates],
  )

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
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Painel', to: '/' },
          { label: 'Relatórios' },
        ]}
        title="Relatórios"
      />
      <ApiConfigAlert />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="0">Evolução por paciente</TabsTrigger>
          <TabsTrigger value="1">Todos os pacientes</TabsTrigger>
          <TabsTrigger value="2">Resumo da clínica</TabsTrigger>
          <TabsTrigger value="3">Formulários respondidos</TabsTrigger>
          <TabsTrigger value="4">Fluxo de caixa</TabsTrigger>
        </TabsList>

        <TabsContent value="0" className="mt-0">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-6">
              <FilterableSelect
                label="Paciente"
                placeholder="Selecionar…"
                emptyLabel="Selecionar…"
                allowClear={false}
                loading={loadingPatients}
                options={patientOptions}
                value={patient}
                onChange={setPatient}
                getOptionKey={(p) => p.id}
              />
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <Label htmlFor="evo-from">De</Label>
              <Input
                id="evo-from"
                type="date"
                value={evoFrom}
                onChange={(e) => setEvoFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <Label htmlFor="evo-to">Até</Label>
              <Input
                id="evo-to"
                type="date"
                value={evoTo}
                onChange={(e) => setEvoTo(e.target.value)}
              />
            </div>
          </div>

          {!patient ? (
            <EmptyState title="Escolha um paciente para ver o relatório de evolução." />
          ) : evoReport.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : evoReport.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{(evoReport.error as Error).message}</AlertDescription>
            </Alert>
          ) : (
            <>
              {evoByDay.some((p) => p.count > 0) ? (
                <GlassPanel className="mb-4">
                  <p className="mb-3 font-semibold">Registos por dia</p>
                  <GlassAreaChart
                    height={240}
                    labels={evoByDay.map((p) => shortDate(p.date))}
                    values={evoByDay.map((p) => p.count)}
                    color={chartColors.primary}
                    valueLabel="Registos"
                  />
                </GlassPanel>
              ) : null}

              {(evoReport.data ?? []).length === 0 ? (
                <EmptyState title="Sem registos de evolução neste período." />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {(evoReport.data ?? []).map((row) => (
                    <GlassPanel key={row.id} className="h-full">
                      <p className="mb-2 text-xs text-muted-foreground">
                        {row.entry_date as string}
                      </p>
                      <RichTextContent
                        content={(row.content as string) || ''}
                        variant="body2"
                      />
                    </GlassPanel>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="1" className="mt-0">
          <div className="relative mb-4 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar…"
              value={overviewFilter}
              onChange={(e) => setOverviewFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          {overview.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : null}
          {overview.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{(overview.error as Error).message}</AlertDescription>
            </Alert>
          ) : null}
          {overview.data ? (
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="w-full text-sm text-muted-foreground sm:w-auto">
                  Ordenar por
                </span>
                {(
                  [
                    { key: 'fullName' as const, label: 'Paciente' },
                    { key: 'consultationReason' as const, label: 'Motivo' },
                    { key: 'firstEvolutionDate' as const, label: '1.ª evolução' },
                    { key: 'lastEvolutionDate' as const, label: 'Última' },
                    { key: 'evolutionCount' as const, label: 'N.º' },
                  ] as const
                ).map(({ key, label }) => (
                  <Badge
                    key={key}
                    variant={orderBy === key ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleRequestSort(key)}
                  >
                    {label}
                    {orderBy === key ? (order === 'asc' ? ' ↑' : ' ↓') : ''}
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {overviewRows.map((row) => (
                  <GlassPanel
                    key={row.patientId}
                    className="lift h-full transition-colors hover:border-primary/35"
                  >
                    <Link
                      to={`/patients/${row.patientId}`}
                      className="font-semibold text-foreground no-underline hover:text-primary"
                    >
                      {row.fullName}
                    </Link>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Motivo: {row.consultationReason?.trim() || '—'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline">
                        1.ª: {row.firstEvolutionDate ?? '—'}
                      </Badge>
                      <Badge variant="outline">
                        Última: {row.lastEvolutionDate ?? '—'}
                      </Badge>
                      <Badge variant="outline">
                        {row.evolutionCount} evoluções
                      </Badge>
                    </div>
                  </GlassPanel>
                ))}
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="2" className="mt-0">
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-12">
            <div className="space-y-1.5 md:col-span-4">
              <Label htmlFor="clinic-from">De</Label>
              <Input
                id="clinic-from"
                type="date"
                value={clinicFrom}
                onChange={(e) => setClinicFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 md:col-span-4">
              <Label htmlFor="clinic-to">Até</Label>
              <Input
                id="clinic-to"
                type="date"
                value={clinicTo}
                onChange={(e) => setClinicTo(e.target.value)}
              />
            </div>
          </div>

          {clinicSummary.isLoading || clinicDaily.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : null}
          {clinicSummary.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{(clinicSummary.error as Error).message}</AlertDescription>
            </Alert>
          ) : null}
          {clinicSummary.data ? (
            <>
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { label: 'Novos pacientes', value: clinicSummary.data.newPatients },
                  { label: 'Registos de evolução', value: clinicSummary.data.evolutionEntries },
                  { label: 'Respostas a formulários', value: clinicSummary.data.formSubmissions },
                ].map((stat) => (
                  <GlassPanel key={stat.label} className="py-4">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="display mt-1 text-2xl font-semibold">{stat.value}</p>
                  </GlassPanel>
                ))}
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Período: {clinicSummary.data.fromYmd} a {clinicSummary.data.toYmd}.
                Os totais refletem a atividade registada na base de dados neste
                intervalo.
              </p>
            </>
          ) : null}

          {clinicDaily.data && clinicDaily.data.length > 0 ? (
            <GlassPanel>
              <p className="mb-3 font-semibold">Evoluções por dia no período</p>
              <GlassBarChart
                labels={clinicDaily.data.map((p) => shortDate(p.date))}
                series={[
                  {
                    key: 'evolutions',
                    label: 'Evoluções',
                    values: clinicDaily.data.map((p) => p.count),
                    color: chartColors.primary,
                  },
                ]}
                angledLabels
              />
            </GlassPanel>
          ) : null}
        </TabsContent>

        <TabsContent value="3" className="mt-0">
          <p className="mb-4 text-sm text-muted-foreground">
            Escolha o formulário (obrigatório). O paciente e o período são
            opcionais: sem período são listadas todas as respostas desse modelo;
            com paciente, apenas respostas enviadas por links associados a esse
            paciente.
          </p>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-6">
              <FilterableSelect
                label="Formulário"
                placeholder="Selecionar modelo…"
                allowClear={false}
                required
                loading={loadingFormTemplates}
                options={formTemplateOptions}
                value={formTemplate}
                onChange={setFormTemplate}
                getOptionKey={(t) => t.id}
              />
            </div>
            <div className="md:col-span-6">
              <FilterableSelect
                label="Paciente (opcional)"
                placeholder="Qualquer paciente / link geral"
                emptyLabel="Qualquer paciente / link geral"
                loading={loadingPatients}
                options={patientOptions}
                value={formReportPatient}
                onChange={setFormReportPatient}
                getOptionKey={(p) => p.id}
              />
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <Label htmlFor="form-from">Período — de (opcional)</Label>
              <Input
                id="form-from"
                type="date"
                value={formFrom}
                onChange={(e) => setFormFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <Label htmlFor="form-to">Período — até (opcional)</Label>
              <Input
                id="form-to"
                type="date"
                value={formTo}
                onChange={(e) => setFormTo(e.target.value)}
              />
            </div>
          </div>

          {formPeriodPartial ? (
            <Alert variant="warning" className="mb-4">
              <AlertDescription>
                Preencha as duas datas do período ou deixe as duas em branco.
              </AlertDescription>
            </Alert>
          ) : null}
          {formPeriodInvalid ? (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                A data inicial não pode ser posterior à data final.
              </AlertDescription>
            </Alert>
          ) : null}

          {!formTemplate ? (
            <EmptyState title="Selecione um formulário para carregar as respostas." />
          ) : formSubmissionsReport.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : formSubmissionsReport.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {(formSubmissionsReport.error as Error).message}
              </AlertDescription>
            </Alert>
          ) : (formSubmissionsReport.data ?? []).length === 0 ? (
            <EmptyState title="Nenhuma resposta encontrada com estes critérios." />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(formSubmissionsReport.data ?? []).map((row) => (
                <GlassPanel key={row.id} className="h-full">
                  <p className="text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleString('pt-PT', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {row.patientName ?? 'Sem paciente associado'}
                  </p>
                  <p className="mt-2 break-words text-sm">
                    {formatSubmissionAnswersSummary(formTemplate.schema, row.answers)}
                  </p>
                </GlassPanel>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="4" className="mt-0">
          <div className="mb-4 grid grid-cols-1 items-end gap-4 sm:grid-cols-2 md:grid-cols-12">
            <div className="space-y-1.5 md:col-span-3">
              <Label htmlFor="cash-from">De</Label>
              <Input
                id="cash-from"
                type="date"
                value={cashFrom}
                onChange={(e) => setCashFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <Label htmlFor="cash-to">Até</Label>
              <Input
                id="cash-to"
                type="date"
                value={cashTo}
                onChange={(e) => setCashTo(e.target.value)}
              />
            </div>
            <div className="md:col-span-4">
              <FilterableSelect
                label="Paciente (opcional)"
                placeholder="Todos os pacientes"
                emptyLabel="Todos os pacientes"
                loading={loadingPatients}
                options={patientOptions}
                value={cashPatient}
                onChange={setCashPatient}
                getOptionKey={(p) => p.id}
              />
            </div>
            <div className="relative md:col-span-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={cashFlowRows.length === 0 || cashPeriodInvalid}
                onClick={() => setExportOpen((v) => !v)}
              >
                Exportar
                <ChevronDown className="h-4 w-4" />
              </Button>
              {exportOpen ? (
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[8rem] rounded-xl border glass-strong p-1 shadow-md">
                  <button
                    type="button"
                    className="flex w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      exportCashFlowPdf(cashFlowRows, cashExportMeta)
                      setExportOpen(false)
                    }}
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    className="flex w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      exportCashFlowCsv(cashFlowRows, cashExportMeta)
                      setExportOpen(false)
                    }}
                  >
                    CSV
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {cashPeriodInvalid ? (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                A data inicial não pode ser posterior à data final.
              </AlertDescription>
            </Alert>
          ) : null}

          {cashFlowReport.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : null}
          {cashFlowReport.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{(cashFlowReport.error as Error).message}</AlertDescription>
            </Alert>
          ) : null}

          {!cashFlowReport.isLoading &&
          !cashFlowReport.isError &&
          !cashPeriodInvalid ? (
            <>
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <GlassPanel className="py-4">
                  <p className="text-sm text-muted-foreground">Total de entradas</p>
                  <p className="display mt-1 text-2xl font-semibold text-chart-2">
                    {formatMoney(cashFlowTotals.entradas)}
                  </p>
                </GlassPanel>
                <GlassPanel className="py-4">
                  <p className="text-sm text-muted-foreground">Total de saídas</p>
                  <p className="display mt-1 text-2xl font-semibold text-destructive">
                    {formatMoney(cashFlowTotals.saidas)}
                  </p>
                </GlassPanel>
                <GlassPanel className="py-4">
                  <p className="text-sm text-muted-foreground">Saldo líquido</p>
                  <p className="display mt-1 text-2xl font-semibold">
                    {formatMoney(cashFlowTotals.saldo)}
                  </p>
                </GlassPanel>
              </div>

              {cashFlowDaily.length > 0 ? (
                <GlassPanel className="mb-4">
                  <p className="mb-3 font-semibold">Movimento por dia no período</p>
                  <GlassBarChart
                    labels={cashFlowDaily.map((p) => shortDate(p.date))}
                    series={[
                      {
                        key: 'entradas',
                        label: 'Entradas',
                        values: cashFlowDaily.map((p) => p.entradas),
                        color: chartColors.success,
                      },
                      {
                        key: 'saidas',
                        label: 'Saídas',
                        values: cashFlowDaily.map((p) => p.saidas),
                        color: chartColors.error,
                      },
                    ]}
                    angledLabels
                    showLegend
                  />
                </GlassPanel>
              ) : null}

              {cashFlowRows.length === 0 ? (
                <EmptyState title="Sem lançamentos financeiros neste período." />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {cashFlowRows.map((row) => (
                    <GlassPanel key={row.id} className="h-full">
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          row.type === 'entrada' ? 'text-chart-2' : 'text-destructive',
                        )}
                      >
                        {row.type === 'entrada' ? 'Entrada' : 'Saída'}
                      </p>
                      <p className="display text-xl font-semibold">
                        {formatMoney(row.amount)}
                      </p>
                      <p className="mt-1 text-sm">{row.description.trim() || '—'}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {formatEntryDate(row.entry_date)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {row.patients?.full_name?.trim() || 'Sem paciente'}
                      </p>
                    </GlassPanel>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
