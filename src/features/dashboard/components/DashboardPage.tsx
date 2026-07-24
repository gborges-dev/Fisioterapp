import { Loader2, Sparkles } from 'lucide-react'

import { GlassPanel, PageHeader } from '@/components/AppShell'
import { ApiConfigAlert } from '@/components/ApiConfigAlert'
import { GlassAreaChart } from '@/components/charts/GlassAreaChart'
import { ListPageSkeleton } from '@/components/ListPageSkeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getChartColor } from '@/lib/chartColors'
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

  const chartPrimary = getChartColor(1)
  const chartSecondary = getChartColor(2)

  return (
    <div>
      <PageHeader breadcrumbs={[{ label: 'Painel' }]} title="Painel" />
      <ApiConfigAlert />
      {isLoading ? <ListPageSkeleton count={4} cardHeight={88} /> : null}
      {isError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      ) : null}
      {data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12">
          <GlassPanel className="sm:col-span-1 md:col-span-1 lg:col-span-3">
            <p className="text-sm text-muted-foreground">Pacientes</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{data.patientCount}</p>
          </GlassPanel>
          <GlassPanel className="sm:col-span-1 md:col-span-1 lg:col-span-3">
            <p className="text-sm text-muted-foreground">Evoluções (7 dias)</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {data.evolutionLast7Days}
            </p>
          </GlassPanel>
          <GlassPanel className="sm:col-span-1 md:col-span-1 lg:col-span-3">
            <p className="text-sm text-muted-foreground">
              Respostas a formulários (7 dias)
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {data.submissionsLast7Days}
            </p>
          </GlassPanel>
          <GlassPanel className="sm:col-span-1 md:col-span-1 lg:col-span-3">
            <p className="text-sm text-muted-foreground">Formulários</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {data.formTemplateCount}
            </p>
          </GlassPanel>

          <GlassPanel className="h-full lg:col-span-6">
            <h3 className="mb-4 text-base font-semibold">
              Evoluções por dia (últimos {dashboardChartDays} dias)
            </h3>
            {evoDaily.isLoading ? (
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            ) : evoDaily.isError ? (
              <Alert variant="destructive">
                <AlertDescription>{(evoDaily.error as Error).message}</AlertDescription>
              </Alert>
            ) : (
              <div className="w-full overflow-x-auto">
                <GlassAreaChart
                  labels={xEvo}
                  values={evoPoints.map((p) => p.count)}
                  color={chartPrimary}
                  valueLabel="Registos"
                />
              </div>
            )}
          </GlassPanel>

          <GlassPanel className="h-full lg:col-span-6">
            <h3 className="mb-4 text-base font-semibold">
              Respostas a formulários por dia (últimos {dashboardChartDays} dias)
            </h3>
            {subDaily.isLoading ? (
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            ) : subDaily.isError ? (
              <Alert variant="destructive">
                <AlertDescription>{(subDaily.error as Error).message}</AlertDescription>
              </Alert>
            ) : (
              <div className="w-full overflow-x-auto">
                <GlassAreaChart
                  labels={xSub}
                  values={subPoints.map((p) => p.count)}
                  color={chartSecondary}
                  valueLabel="Respostas"
                />
              </div>
            )}
          </GlassPanel>

          <GlassPanel className="lg:col-span-12">
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              <h3 className="text-base font-semibold">Insights automáticos</h3>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Sugestões com base nos números atuais do painel.
            </p>
            {insights.length === 0 ? (
              <p className="text-sm text-muted-foreground">A carregar…</p>
            ) : (
              <div className="space-y-3">
                {insights.map((line, i) => (
                  <div key={i} className="glass-subtle rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0 text-xs font-bold text-primary">
                        {i + 1}.
                      </span>
                      <p className="text-sm">{line}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        </div>
      ) : null}
    </div>
  )
}
