'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from 'recharts'
import type { WeekBreakdown } from '@/types/domain'

interface WeeklyBreakdownChartProps {
  data: WeekBreakdown[]
  color?: string
}

const WEEK_LABELS = ['S1', 'S2', 'S3', 'S4', 'S5']

export function WeeklyBreakdownChart({
  data,
  color = '#10B981',
}: WeeklyBreakdownChartProps) {
  const chartData = data.map((w) => ({
    name: WEEK_LABELS[w.weekIndex - 1] ?? `S${w.weekIndex}`,
    value: w.percent,
    completed: w.daysCompleted,
    total: w.daysInMonth,
  }))

  return (
    <ResponsiveContainer width="100%" height={80}>
      <BarChart data={chartData} barSize={20} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <XAxis
          dataKey="name"
          tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          cursor={{ fill: '#1E2230' }}
          contentStyle={{
            backgroundColor: '#10121A',
            border: `1px solid ${color}44`,
            borderRadius: 6,
            fontFamily: 'monospace',
            fontSize: 11,
            color: '#F1F5F9',
          }}
          formatter={(value, _name, props) => [
            `${value ?? 0}% (${props.payload.completed}/${props.payload.total} días)`,
            '',
          ]}
          labelStyle={{ color: '#94A3B8' }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={`week-${index}`}
              fill={color}
              fillOpacity={entry.value > 0 ? 0.2 + (entry.value / 100) * 0.8 : 0.15}
              style={{ filter: entry.value > 70 ? `drop-shadow(0 0 4px ${color}88)` : undefined }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
