'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, CheckSquare, Sparkles } from 'lucide-react'
import { AestheticDonutGauge } from '@/components/ui/AestheticDonutGauge'
import { ICON_MAP } from '@/lib/icon-map'
import { toISODateString, isToday, getTodayString } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import type { HabitRow, HabitLogRow } from '@/types/database'

interface AestheticDailyColumnsProps {
  habits: HabitRow[]
  logs: HabitLogRow[]
  year: number
  month: number
  onToggle: (habitId: string, date: string, currentlyCompleted: boolean) => void
  isPending?: (habitId: string, date: string) => boolean
}

const DAY_FULL_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export function AestheticDailyColumns({
  habits,
  logs,
  year,
  month,
  onToggle,
  isPending = () => false,
}: AestheticDailyColumnsProps) {
  // Current week Monday - Sunday
  const currentWeekDays = useMemo(() => {
    const today = new Date()
    const currentDay = today.getDay() // 0 is Sunday
    const mondayDiff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1)
    const monday = new Date(today.getFullYear(), today.getMonth(), mondayDiff)

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
      const dateStr = toISODateString(d.getFullYear(), d.getMonth() + 1, d.getDate())
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const yyyy = d.getFullYear()

      return {
        date: d,
        dateStr,
        formattedDate: `${dd}.${mm}.${yyyy}`,
        dayName: DAY_FULL_NAMES[i],
        isCurrent: isToday(dateStr),
        isFuture: dateStr > getTodayString(),
      }
    })
  }, [])

  // Log map lookup: `${habitId}__${dateStr}` -> boolean
  const logMap = useMemo(() => {
    const map: Record<string, boolean> = {}
    logs.forEach((l) => {
      map[`${l.habit_id}__${l.date}`] = l.completed
    })
    return map
  }, [logs])

  // Daily statistics per day of current week
  const dailyStats = useMemo(() => {
    return currentWeekDays.map((day) => {
      const total = habits.length
      let completed = 0

      habits.forEach((habit) => {
        if (logMap[`${habit.id}__${day.dateStr}`]) {
          completed++
        }
      })

      const percent = total > 0 ? Math.round((completed / total) * 100) : 0
      return {
        ...day,
        total,
        completed,
        percent,
      }
    })
  }, [currentWeekDays, habits, logMap])

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="bg-[#000000] border border-[#1E2230] px-3 py-1 rounded-md text-slate-100 font-mono font-bold text-xs tracking-wider uppercase shadow-sm">
            DAILY PLANNER // TASKS
          </div>
          <span className="text-xs font-mono text-[#64748B] hidden sm:inline">
            Desglose y cumplimiento diario de la semana
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-[#94A3B8]">
          <Calendar size={13} className="text-[#10B981]" />
          <span>7 Días de la Semana</span>
        </div>
      </div>

      {/* Grid of Daily Cards (Horizontal scroll or responsive grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5 items-start">
        {dailyStats.map((day, idx) => (
          <div
            key={day.dateStr}
            className={cn(
              'bg-[#10121A] border rounded-xl overflow-hidden shadow-lg flex flex-col transition-all duration-200',
              day.isCurrent
                ? 'border-[#10B981]/50 shadow-[0_0_20px_rgba(16,185,129,0.12)] ring-1 ring-[#10B981]/30'
                : 'border-[#1E2230] hover:border-[#2E3450]',
              day.isFuture && 'opacity-60',
            )}
          >
            {/* Top Day Header Banner (Black solid block like photo) */}
            <div
              className={cn(
                'py-2.5 px-3 text-center border-b transition-colors',
                day.isCurrent
                  ? 'bg-[#000000] border-[#10B981]/40'
                  : 'bg-[#08090C] border-[#1E2230]',
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span
                  className={cn(
                    'font-mono font-bold text-sm tracking-tight',
                    day.isCurrent ? 'text-[#10B981]' : 'text-slate-100',
                  )}
                >
                  {day.dayName}
                </span>
                {day.isCurrent && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                )}
              </div>
              <p className="text-[10px] font-mono text-[#64748B] mt-0.5">{day.formattedDate}</p>
            </div>

            {/* Circular Gauge Centerpiece */}
            <div className="py-4 flex flex-col items-center justify-center bg-[#0C0E14]/40 border-b border-[#1E2230]/60">
              <AestheticDonutGauge
                percentage={day.percent}
                size={88}
                strokeWidth={9}
                color={day.percent === 100 ? '#10B981' : '#38BDF8'}
                trackColor="#161926"
                sublabel={`${day.completed}/${day.total}`}
              />
            </div>

            {/* Tasks Section Header Banner */}
            <div className="bg-[#08090C] px-3 py-1.5 border-b border-[#1E2230] flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold tracking-wider text-slate-300 uppercase">
                TASKS
              </span>
              <span className="font-mono text-[9px] text-[#64748B]">
                {day.completed}/{day.total}
              </span>
            </div>

            {/* Tasks Checklist */}
            <div className="p-2 space-y-1.5 min-h-[140px] max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#1E2230]">
              {habits.length === 0 ? (
                <p className="text-[11px] font-mono text-slate-500 text-center py-6">
                  Sin hábitos
                </p>
              ) : (
                habits.map((habit) => {
                  const Icon = ICON_MAP[habit.icon_key] ?? ICON_MAP['star']
                  const isChecked = logMap[`${habit.id}__${day.dateStr}`] ?? false
                  const disabled = day.isFuture || isPending(habit.id, day.dateStr)

                  return (
                    <div
                      key={habit.id}
                      onClick={() => !disabled && onToggle(habit.id, day.dateStr, isChecked)}
                      className={cn(
                        'group flex items-center justify-between gap-2 p-1.5 rounded-lg border transition-all select-none',
                        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                        isChecked
                          ? 'bg-[#10B981]/8 border-[#10B981]/25 text-slate-400'
                          : 'bg-[#141724]/40 border-[#1E2230]/60 hover:bg-[#141724] hover:border-[#2E3450] text-slate-200',
                      )}
                    >
                      {/* Left: icon + name */}
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span
                          className="w-4 h-4 rounded flex items-center justify-center shrink-0 text-[10px]"
                          style={{
                            color: habit.color_hex,
                            backgroundColor: `${habit.color_hex}15`,
                          }}
                        >
                          <Icon size={10} />
                        </span>
                        <span
                          className={cn(
                            'text-[11px] font-mono truncate leading-tight transition-all',
                            isChecked && 'line-through text-slate-400 opacity-60',
                          )}
                        >
                          {habit.name}
                        </span>
                      </div>

                      {/* Right: Checkbox like in reference image */}
                      <button
                        type="button"
                        disabled={disabled}
                        tabIndex={-1}
                        className={cn(
                          'w-4 h-4 rounded-[3px] border transition-all flex items-center justify-center shrink-0',
                          isChecked
                            ? 'bg-[#10B981] border-[#10B981] text-slate-950 font-black'
                            : 'border-[#2A3045] bg-[#08090C] group-hover:border-[#10B981]/60',
                        )}
                        aria-label={`${habit.name} - ${day.dayName}`}
                      >
                        {isChecked && (
                          <svg
                            className="w-3 h-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
