import { Loader2, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { GlassPanel, PageHeader } from '@/components/AppShell'
import { ApiConfigAlert } from '@/components/ApiConfigAlert'
import { GlassBarChart } from '@/components/charts/GlassBarChart'
import { ListPageSkeleton } from '@/components/ListPageSkeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getChartColor } from '@/lib/chartColors'
import { previewPlainText } from '@/lib/richText'
import {
  dashboardChartDays,
  useDashboardEvolutionDaily,
  useDashboardSubmissionsDaily,
} from '../hooks/useDashboardDailySeries'
import { useDashboardEvolutionOverview } from '../hooks/useDashboardEvolutionOverview'
import { useDashboardSummary } from '../hooks/useDashboardSummary'
import { buildDashboardInsights } from '../utils/dashboardInsights'

function shortDate(ymd: string) {
  const parts = ymd.split('-')
  const m = parts[1]
  const d = parts[2]
  if (!d || !m) return ymd
  return `${d}/${m}`
}

function todayLabel() {
  const text = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function relativeDay(ymd: string) {
  const day = new Date(`${ymd.slice(0, 10)}T12:00:00`)
  const now = new Date()
  now.setHours(12, 0, 0, 0)
  const diff = Math.round((now.getTime() - day.getTime()) / 86_400_000)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Ontem'
  return day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string
  value: number
  hint: string
}) {
  return (
    <GlassPanel className="px-[22px] py-5 sm:p-[22px]">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="display mt-1.5 text-[44px] font-semibold leading-[48px] tabular-nums">
        {value}
      </p>
      <p className="text-[13px] text-muted-foreground">{hint}</p>
    </GlassPanel>
  )
}

function ChartCard({
  title,
  caption,
  loading,
  error,
  children,
}: {
  title: string
  caption: string
  loading: boolean
  error: Error | null
  children: React.ReactNode
}) {
  return (
    <GlassPanel>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="display text-2xl font-semibold leading-[30px]">{title}</h2>
        <span className="text-[13px] text-muted-foreground">{caption}</span>
      </div>
      {loading ? (
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : (
        <div className="w-full overflow-x-auto">{children}</div>
      )}
    </GlassPanel>
  )
}

export function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboardSummary()
  const evoDaily = useDashboardEvolutionDaily()
  const subDaily = useDashboardSubmissionsDaily()
  const overview = useDashboardEvolutionOverview()

  const evoPoints = evoDaily.data ?? []
  const subPoints = subDaily.data ?? []
  const xEvo = evoPoints.map((p) => shortDate(p.date))
  const xSub = subPoints.map((p) => shortDate(p.date))

  const insights =
    data && !evoDaily.isLoading && !subDaily.isLoading
      ? buildDashboardInsights(data, evoPoints, subPoints)
      : []

  const recent = useMemo(
    () =>
      (overview.data?.rows ?? [])
        .filter((row) => row.lastEvolutionDate)
        .sort((a, b) =>
          (b.lastEvolutionDate ?? '').localeCompare(a.lastEvolutionDate ?? ''),
        )
        .slice(0, 4),
    [overview.data],
  )

  const chartPrimary = getChartColor(1)

  return (
    <div>
      <div className="mb-1 text-sm text-muted-foreground">{todayLabel()}</div>
      <PageHeader
        title="Painel"
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/patients/new">Novo paciente</Link>
            </Button>
            <Button asChild>
              <Link to="/patients">
                <Plus />
                Nova evolução
              </Link>
            </Button>
          </>
        }
      />
      <ApiConfigAlert />
      {isLoading ? <ListPageSkeleton count={4} cardHeight={120} /> : null}
      {isError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      ) : null}
      {data ? (
        <div className="space-y-6">
          <section
            aria-label="Resumo"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <StatTile label="Pacientes" value={data.patientCount} hint="cadastrados" />
            <StatTile
              label="Evoluções"
              value={data.evolutionLast7Days}
              hint="nos últimos 7 dias"
            />
            <StatTile
              label="Respostas de formulários"
              value={data.submissionsLast7Days}
              hint="nos últimos 7 dias"
            />
            <StatTile
              label="Formulários"
              value={data.formTemplateCount}
              hint="modelos publicados"
            />
          </section>

          <div className="flex flex-wrap items-start gap-5">
            <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
              <ChartCard
                title="Evoluções por dia"
                caption={`Últimos ${dashboardChartDays} dias · registros por dia`}
                loading={evoDaily.isLoading}
                error={evoDaily.isError ? (evoDaily.error as Error) : null}
              >
                <GlassBarChart
                  labels={xEvo}
                  height={240}
                  series={[
                    {
                      key: 'count',
                      label: 'Registros',
                      values: evoPoints.map((p) => p.count),
                      color: chartPrimary,
                    },
                  ]}
                />
              </ChartCard>
              <ChartCard
                title="Respostas de formulários por dia"
                caption={`Últimos ${dashboardChartDays} dias · respostas por dia`}
                loading={subDaily.isLoading}
                error={subDaily.isError ? (subDaily.error as Error) : null}
              >
                <GlassBarChart
                  labels={xSub}
                  height={200}
                  series={[
                    {
                      key: 'count',
                      label: 'Respostas',
                      values: subPoints.map((p) => p.count),
                      color: chartPrimary,
                    },
                  ]}
                />
              </ChartCard>
            </div>

            <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-5">
              <GlassPanel>
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="display text-2xl font-semibold leading-[30px]">
                    Últimas evoluções
                  </h2>
                  <Link
                    to="/reports"
                    className="text-sm font-semibold text-primary no-underline hover:underline"
                  >
                    Ver todas
                  </Link>
                </div>
                {overview.isLoading ? (
                  <Loader2 className="mt-4 h-6 w-6 animate-spin text-muted-foreground" />
                ) : recent.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Nenhuma evolução registrada ainda.
                  </p>
                ) : (
                  <ul className="mt-1">
                    {recent.map((row) => (
                      <li
                        key={row.patientId}
                        className="border-b border-border py-3.5 last:border-b-0 last:pb-0"
                      >
                        <div className="flex justify-between gap-3">
                          <Link
                            to={`/patients/${row.patientId}?tab=evolucao`}
                            className="font-semibold text-foreground no-underline hover:text-primary"
                          >
                            {row.fullName}
                          </Link>
                          <span className="shrink-0 text-[13px] text-muted-foreground">
                            {relativeDay(row.lastEvolutionDate!)}
                          </span>
                        </div>
                        {row.lastEvolutionPreview ? (
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {previewPlainText(row.lastEvolutionPreview, 90)}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </GlassPanel>

              <section className="rounded-2xl bg-accent p-6 text-accent-foreground">
                <h2 className="display text-2xl font-semibold leading-[30px]">
                  Resumo da semana
                </h2>
                <p className="mb-3.5 mt-1 text-sm opacity-80">
                  Observações geradas a partir dos números do painel.
                </p>
                {insights.length === 0 ? (
                  <p className="text-sm">Carregando…</p>
                ) : (
                  <ol className="flex flex-col gap-3">
                    {insights.map((line, i) => (
                      <li key={i} className="flex gap-3 text-foreground">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {i + 1}
                        </span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
