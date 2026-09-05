'use client'

import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts'

interface RadialProgressProps {
  /** 0–100 */
  value: number
  color?: string
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
}

export function RadialProgress({
  value,
  color = '#10B981',
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
}: RadialProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value))
  const data = [{ value: clampedValue }]

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius={`${80 - strokeWidth}%`}
          outerRadius="100%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          {/* Background track */}
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: '#1E2230' }}
            dataKey="value"
            angleAxisId={0}
            fill={color}
            cornerRadius={6}
            style={{
              filter: `drop-shadow(0 0 6px ${color}99)`,
            }}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {label !== undefined ? (
          <span
            className="font-mono font-bold leading-none"
            style={{ color, fontSize: size * 0.2, textShadow: `0 0 8px ${color}88` }}
          >
            {label}
          </span>
        ) : (
          <span
            className="font-mono font-bold leading-none"
            style={{ color, fontSize: size * 0.2, textShadow: `0 0 8px ${color}88` }}
          >
            {clampedValue}%
          </span>
        )}
        {sublabel && (
          <span
            className="text-[#94A3B8] font-mono text-center leading-tight mt-0.5"
            style={{ fontSize: size * 0.1 }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}
