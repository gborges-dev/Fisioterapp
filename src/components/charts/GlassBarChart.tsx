import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type BarSeries = {
  key: string
  label: string
  values: number[]
  color: string
}

type GlassBarChartProps = {
  labels: string[]
  series: BarSeries[]
  height?: number
  angledLabels?: boolean
  showLegend?: boolean
}

export function GlassBarChart({
  labels,
  series,
  height = 280,
  angledLabels = false,
  showLegend = false,
}: GlassBarChartProps) {
  const data = labels.map((label, i) => {
    const row: Record<string, string | number> = { label }
    for (const s of series) {
      row[s.key] = s.values[i] ?? 0
    }
    return row
  })

  return (
    <div className="min-w-[320px] w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: angledLabels ? 24 : 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{
              fontSize: angledLabels ? 9 : 11,
              fill: 'var(--muted-foreground)',
              ...(angledLabels ? { angle: -45, textAnchor: 'end' as const } : {}),
            }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={{ stroke: 'var(--border)' }}
            interval={0}
            height={angledLabels ? 56 : 30}
          />
          <YAxis
            width={48}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={{ stroke: 'var(--border)' }}
          />
          <Tooltip
            contentStyle={{
              background: 'color-mix(in oklab, var(--card) 75%, transparent)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              backdropFilter: 'blur(12px)',
            }}
            labelStyle={{ color: 'var(--foreground)' }}
            itemStyle={{ color: 'var(--foreground)' }}
          />
          {showLegend ? (
            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
          ) : null}
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color}
              radius={[6, 6, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
