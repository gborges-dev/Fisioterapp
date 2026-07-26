import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type GlassAreaChartProps = {
  labels: string[]
  values: number[]
  color: string
  height?: number
  valueLabel?: string
}

export function GlassAreaChart({
  labels,
  values,
  color,
  height = 280,
  valueLabel = 'Valor',
}: GlassAreaChartProps) {
  const data = labels.map((label, i) => ({
    label,
    value: values[i] ?? 0,
  }))

  return (
    <div className="min-w-[320px] w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical horizontal />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={{ stroke: 'var(--border)' }}
          />
          <YAxis
            width={40}
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
            formatter={(value) => [value, valueLabel]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.18}
            strokeWidth={2}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
