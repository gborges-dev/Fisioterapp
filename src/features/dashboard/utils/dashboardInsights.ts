import type { DailyCountPoint, DashboardSummary } from '../services/dashboardApi'

function sumLast(points: DailyCountPoint[], n: number) {
  const slice = points.slice(-n)
  return slice.reduce((s, p) => s + p.count, 0)
}

/** Textos automáticos com base nos números do painel (sem API externa). */
export function buildDashboardInsights(
  summary: DashboardSummary,
  evolutionDaily: DailyCountPoint[],
  submissionsDaily: DailyCountPoint[],
): string[] {
  const lines: string[] = []

  if (summary.patientCount === 0) {
    lines.push('Ainda não há pacientes registados — comece por criar a primeira ficha.')
  } else {
    lines.push(
      `Tem ${summary.patientCount} paciente(s) registado(s) na área clínica.`,
    )
  }

  if (summary.evolutionLast7Days === 0 && summary.patientCount > 0) {
    lines.push(
      'Não há entradas de evolução nos últimos 7 dias — considere registar o acompanhamento.',
    )
  } else if (summary.evolutionLast7Days > 0) {
    lines.push(
      `Foram registadas ${summary.evolutionLast7Days} evolução(ões) na última semana.`,
    )
  }

  if (summary.submissionsLast7Days === 0 && summary.formTemplateCount > 0) {
    lines.push(
      'Não houve respostas a formulários nos últimos 7 dias — pode partilhar novamente os links com os pacientes.',
    )
  } else if (summary.submissionsLast7Days > 0) {
    lines.push(
      `${summary.submissionsLast7Days} resposta(s) a formulários na última semana.`,
    )
  }

  if (evolutionDaily.length >= 14) {
    const last7 = sumLast(evolutionDaily, 7)
    const prev7 = sumLast(evolutionDaily.slice(0, -7), 7)
    if (prev7 > 0 && last7 < prev7 * 0.5) {
      lines.push(
        'A atividade de evolução desceu face à semana anterior — vale rever a agenda de registos.',
      )
    } else if (last7 > prev7 * 1.5 && last7 >= 3) {
      lines.push(
        'A atividade de evolução aumentou face à semana anterior — bom ritmo de acompanhamento.',
      )
    }
  }

  if (submissionsDaily.length >= 14) {
    const last7s = sumLast(submissionsDaily, 7)
    const prev7s = sumLast(submissionsDaily.slice(0, -7), 7)
    if (last7s === 0 && prev7s > 2 && summary.formTemplateCount > 0) {
      lines.push(
        'As respostas a formulários pararam completamente na última semana face à anterior.',
      )
    }
  }

  let streakNoEvo = 0
  for (let i = evolutionDaily.length - 1; i >= 0; i--) {
    if (evolutionDaily[i]!.count === 0) streakNoEvo += 1
    else break
  }
  if (streakNoEvo >= 3 && summary.patientCount > 0) {
    lines.push(
      `Há ${streakNoEvo} dia(s) seguidos sem novas evoluções registadas.`,
    )
  }

  if (lines.length > 5) return lines.slice(0, 5)
  return lines
}
