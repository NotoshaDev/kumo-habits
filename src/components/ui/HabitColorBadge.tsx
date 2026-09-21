'use client'

import { cn } from '@/lib/utils'

interface HabitColorBadgeProps {
  color: string
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

export function HabitColorBadge({
  color,
  label,
  size = 'sm',
  className,
}: HabitColorBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono rounded-md font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className,
      )}
      style={{
        backgroundColor: `${color}15`,
        border: `1px solid ${color}35`,
        color: color,
      }}
    >
      <span
        className="rounded-full shrink-0"
        style={{
          width: size === 'sm' ? 5 : 7,
          height: size === 'sm' ? 5 : 7,
          backgroundColor: color,
        }}
      />
      {label && <span>{label}</span>}
    </span>
  )
}
