'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, CalendarDays } from 'lucide-react'
import { AestheticDonutGauge } from '@/components/ui/AestheticDonutGauge'
import { ICON_MAP } from '@/lib/icon-map'
import { toISODateString, isToday, getTodayString } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { parseHabitCategory } from '@/lib/habit-targets'
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
    <div className="w-full flex flex-col gap-3 font-sans">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="bg-[#F3E7DC] text-[#4A3B32] border border-[#E5D7CA] px-3.5 py-1 rounded-xl font-bold text-xs tracking-wide shadow-xs flex items-center gap-1.5">
            <CalendarDays size={13} className="text-[#C95D47]" />
            <span>PLAN DIARIO</span>
          </div>
          <span className="text-xs text-[#7A6A60] hidden sm:inline font-medium">
            Cumplimiento y tareas diarias de la semana
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-[#6B605B] font-semibold bg-[#FFFFFF] px-3 py-1 rounded-xl border border-[#EAE2D8]">
          <Calendar size={13} className="text-[#F28574]" />
          <span>7 Días de la Semana</span>
        </div>
      </div>

      {/* Grid of Daily Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5 items-start">
        {dailyStats.map((day) => (
          <div
            key={day.dateStr}
            className={cn(
              'bg-[#FFFFFF] border rounded-3xl overflow-hidden shadow-[0_6px_20px_rgba(78,64,53,0.05)] flex flex-col transition-all duration-200',
              day.isCurrent
                ? 'border-[#F28574] shadow-[0_8px_30px_rgba(242,133,116,0.16)] ring-2 ring-[#F28574]/20'
                : 'border-[#EAE2D8] hover:border-[#DFD5CA] hover:shadow-md',
              day.isFuture && 'opacity-60',
            )}
          >
            {/* Top Day Header Banner */}
            <div
              className={cn(
                'py-2.5 px-3 text-center border-b transition-colors',
                day.isCurrent
                  ? 'bg-gradient-to-b from-[#FDF3EB] to-[#F8E8DA] border-[#EED7C5]'
                  : 'bg-[#FAF7F2] border-[#EAE2D8]',
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span
                  className={cn(
                    'font-bold text-sm tracking-tight',
                    day.isCurrent ? 'text-[#C95D47]' : 'text-[#3D2E26]',
                  )}
                >
                  {day.dayName}
                </span>
                {day.isCurrent && (
                  <span className="inline-block w-2 h-2 rounded-full bg-[#F28574] ring-2 ring-[#F28574]/30 animate-pulse" />
                )}
              </div>
              <p
                className={cn(
                  'text-[10px] font-mono mt-0.5',
                  day.isCurrent ? 'text-[#9C6856] font-medium' : 'text-[#9E928C]',
                )}
              >
                {day.formattedDate}
              </p>
            </div>

            {/* Circular Gauge Centerpiece */}
            <div className="py-4 flex flex-col items-center justify-center bg-[#FFFDF9] border-b border-[#EAE2D8]">
              <AestheticDonutGauge
                percentage={day.percent}
                size={88}
                strokeWidth={9}
                color={day.percent === 100 ? '#F28574' : '#E89874'}
                trackColor="#F2ECE4"
                sublabel={`${day.completed}/${day.total}`}
              />
            </div>

            {/* Tasks Section Header Banner */}
            <div className="bg-[#FAF7F2] px-3.5 py-1.5 border-b border-[#EAE2D8] flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-[#7A6A60] uppercase">
                Tareas
              </span>
              <span className="font-mono text-[9px] text-[#9E928C] font-semibold">
                {day.completed}/{day.total}
              </span>
            </div>

            {/* Tasks Checklist */}
            <div className="p-2 space-y-1.5 min-h-[140px] max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#E5DCD3]">
              {habits.length === 0 ? (
                <p className="text-[11px] font-mono text-[#9E928C] text-center py-6">
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
                        'group flex items-center justify-between gap-2 p-1.5 rounded-xl border transition-all select-none',
                        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                        isChecked
                          ? 'bg-[#FDF2ED] border-[#F28574]/30 text-[#8C7A70]'
                          : 'bg-[#FAF7F2] border-[#EAE2D8] hover:bg-[#F5EFEB] hover:border-[#DFD5CA] text-[#3D2E26]',
                      )}
                    >
                      {/* Left: icon + name */}
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span
                          className="w-4 h-4 rounded-md flex items-center justify-center shrink-0 text-[10px]"
                          style={{
                            color: habit.color_hex,
                            backgroundColor: `${habit.color_hex}18`,
                          }}
                        >
                          <Icon size={10} />
                        </span>
                        <span
                          className={cn(
                            'text-[11px] truncate leading-tight transition-all font-medium',
                            isChecked && 'line-through text-[#9E928C] opacity-70',
                          )}
                        >
                          {habit.name}
                        </span>
                        {(() => {
                          const target = parseHabitCategory(habit.category).targetDays
                          return target ? (
                            <span
                              className="text-[9px] font-mono font-bold px-1 rounded-sm shrink-0"
                              style={{
                                backgroundColor: `${habit.color_hex}15`,
                                color: habit.color_hex,
                              }}
                            >
                              {target}d
                            </span>
                          ) : null
                        })()}
                      </div>

                      {/* Right: Checkbox with creamy feel */}
                      <button
                        type="button"
                        disabled={disabled}
                        tabIndex={-1}
                        className={cn(
                          'w-4 h-4 rounded-md border transition-all flex items-center justify-center shrink-0',
                          isChecked
                            ? 'bg-[#F28574] border-[#F28574] text-white font-black shadow-[0_2px_6px_rgba(242,133,116,0.35)]'
                            : 'border-[#DFD5CA] bg-[#FFFFFF] group-hover:border-[#F28574]',
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
