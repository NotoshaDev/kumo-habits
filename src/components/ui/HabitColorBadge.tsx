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
        'inline-flex items-center gap-1.5 font-mono rounded-sm',
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm',
        className,
      )}
      style={{
        backgroundColor: `${color}18`,
        border: `1px solid ${color}44`,
        color: color,
      }}
    >
      <span
        className="rounded-full shrink-0"
        style={{
          width: size === 'sm' ? 6 : 8,
          height: size === 'sm' ? 6 : 8,
          backgroundColor: color,
          boxShadow: `0 0 4px ${color}`,
        }}
      />
      {label && <span>{label}</span>}
    </span>
  )
}
