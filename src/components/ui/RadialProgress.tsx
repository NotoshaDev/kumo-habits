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
            background={{ fill: '#F0EAE1' }}
            dataKey="value"
            angleAxisId={0}
            fill={color}
            cornerRadius={6}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {label !== undefined ? (
          <span
            className="font-mono font-bold leading-none text-[#3D2E26]"
            style={{ fontSize: size * 0.2 }}
          >
            {label}
          </span>
        ) : (
          <span
            className="font-mono font-bold leading-none text-[#3D2E26]"
            style={{ fontSize: size * 0.2 }}
          >
            {clampedValue}%
          </span>
        )}
        {sublabel && (
          <span
            className="text-[#8C7A70] font-mono text-center leading-tight mt-0.5"
            style={{ fontSize: size * 0.1 }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}
