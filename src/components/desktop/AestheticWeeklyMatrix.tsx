'use client'

import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Pencil, LayoutGrid, TrendingUp } from 'lucide-react'
import { AestheticDonutGauge } from '@/components/ui/AestheticDonutGauge'
import { AddHabitModal } from '@/components/ui/AddHabitModal'
import { EditHabitModal } from '@/components/ui/EditHabitModal'
import { ICON_MAP } from '@/lib/icon-map'
import { toISODateString, isToday, getTodayString } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import type { HabitRow, HabitLogRow } from '@/types/database'

interface AestheticWeeklyMatrixProps {
  habits: HabitRow[]
  logs: HabitLogRow[]
  year: number
  month: number
  onToggle: (habitId: string, date: string, currentlyCompleted: boolean) => void
  isPending?: (habitId: string, date: string) => boolean
}

// Day name abbreviations in Spanish
const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const DAY_FULL_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export function AestheticWeeklyMatrix({
  habits,
  logs,
  year,
  month,
  onToggle,
  isPending = () => false,
}: AestheticWeeklyMatrixProps) {
  // Week navigation offset (0 = current week, -1 = last week, etc.)
  const [weekOffset, setWeekOffset] = useState(0)

  // Calculate Monday–Sunday dates for the active week offset
  const weekDays = useMemo(() => {
    const today = new Date()
    const currentDay = today.getDay() // 0 is Sun
    const mondayDiff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1) + weekOffset * 7
    const monday = new Date(today.getFullYear(), today.getMonth(), mondayDiff)

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
      const dateStr = toISODateString(d.getFullYear(), d.getMonth() + 1, d.getDate())
      return {
        date: d,
        dateStr,
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        yearNum: d.getFullYear(),
        shortLabel: DAY_LABELS[i],
        fullLabel: DAY_FULL_LABELS[i],
        isCurrent: isToday(dateStr),
        isFuture: dateStr > getTodayString(),
      }
    })
  }, [weekOffset])

  // Log map lookup: `${habitId}__${dateStr}` -> boolean
  const logMap = useMemo(() => {
    const map: Record<string, boolean> = {}
    logs.forEach((l) => {
      map[`${l.habit_id}__${l.date}`] = l.completed
    })
    return map
  }, [logs])

  // Calculate overall completion for this week
  const { totalPossible, totalCompleted, overallPercent } = useMemo(() => {
    if (habits.length === 0) {
      return { totalPossible: 0, totalCompleted: 0, overallPercent: 0 }
    }
    let possible = 0
    let completed = 0

    habits.forEach((habit) => {
      weekDays.forEach((day) => {
        if (!day.isFuture) {
          possible++
          if (logMap[`${habit.id}__${day.dateStr}`]) {
            completed++
          }
        }
      })
    })

    const percent = possible > 0 ? Math.round((completed / possible) * 100) : 0
    return { totalPossible: possible, totalCompleted: completed, overallPercent: percent }
  }, [habits, weekDays, logMap])

  // Calculate completion percentage per habit for this week
  const habitWeekProgress = useMemo(() => {
    const map: Record<string, { completed: number; total: number; percent: number }> = {}

    habits.forEach((habit) => {
      let c = 0
      let t = 0
      weekDays.forEach((day) => {
        if (!day.isFuture) {
          t++
          if (logMap[`${habit.id}__${day.dateStr}`]) c++
        }
      })
      const p = t > 0 ? Math.round((c / t) * 100) : 0
      map[habit.id] = { completed: c, total: t, percent: p }
    })

    return map
  }, [habits, weekDays, logMap])

  const weekRangeLabel = useMemo(() => {
    const first = weekDays[0]
    const last = weekDays[6]
    return `${first.dayNum}/${first.monthNum} — ${last.dayNum}/${last.monthNum}`
  }, [weekDays])

  return (
    <div className="flex flex-col lg:flex-row items-stretch gap-4 w-full font-sans">
      {/* LEFT: Overall Donut Gauge Card */}
      <div className="w-full lg:w-[220px] shrink-0 bg-[#FFFFFF] border border-[#EAE2D8] rounded-3xl p-5 flex flex-col items-center justify-between shadow-[0_8px_30px_rgba(78,64,53,0.06)] relative overflow-hidden">
        {/* Soft bakery pastel glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F28574]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#EFA93A]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center w-full mb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#EAE2D8] text-[#6B605B] font-mono text-[10px] font-bold uppercase tracking-wider mb-1">
            <TrendingUp size={11} className="text-[#F28574]" />
            <span>RESUMEN SEMANAL</span>
          </div>
          <p className="text-[11px] font-mono text-[#9E928C]">{weekRangeLabel}</p>
        </div>

        {/* Big Donut */}
        <div className="my-2">
          <AestheticDonutGauge
            percentage={overallPercent}
            sublabel={`${totalCompleted} / ${totalPossible} completados`}
            size={135}
            strokeWidth={14}
            color="#F28574"
            trackColor="#F2ECE4"
          />
        </div>

        {/* Navigation buttons for week */}
        <div className="flex items-center justify-between w-full pt-2.5 border-t border-[#EAE2D8] mt-1">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="p-1.5 rounded-xl hover:bg-[#FAF7F2] text-[#6B605B] hover:text-[#282321] transition-colors cursor-pointer"
            title="Semana anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
            className={cn(
              'px-3 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer',
              weekOffset === 0
                ? 'bg-[#FAF7F2] text-[#9E928C] cursor-default border border-[#EAE2D8]'
                : 'bg-[#FDF2ED] text-[#C95D47] border border-[#F2C4AF] hover:bg-[#FBE5DC]',
            )}
          >
            {weekOffset === 0 ? 'Esta Semana' : 'Ir a Hoy'}
          </button>

          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            disabled={weekOffset >= 0}
            className={cn(
              'p-1.5 rounded-xl transition-colors',
              weekOffset >= 0
                ? 'text-[#DFD5CA] cursor-not-allowed'
                : 'hover:bg-[#FAF7F2] text-[#6B605B] hover:text-[#282321] cursor-pointer',
            )}
            title="Semana siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* RIGHT: Aesthetic Spreadsheet Habit Table */}
      <div className="flex-1 bg-[#FFFFFF] border border-[#EAE2D8] rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(78,64,53,0.06)] flex flex-col">
        {/* Spreadsheet Header Bar */}
        <div className="bg-[#FAF7F2] px-5 py-3 border-b border-[#EAE2D8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#F3E7DC] text-[#4A3B32] border border-[#E5D7CA] px-3.5 py-1 rounded-xl font-bold text-xs tracking-wide shadow-xs flex items-center gap-1.5">
              <LayoutGrid size={13} className="text-[#C95D47]" />
              <span>MATRIZ SEMANAL</span>
            </div>
            <span className="text-xs text-[#7A6A60] hidden sm:inline font-medium">
              Seguimiento y progreso de hábitos
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#8C5E48] font-bold bg-[#FCEEE6] px-2.5 py-0.5 rounded-full border border-[#F2C4AF]">
              {habits.length} {habits.length === 1 ? 'HÁBITO' : 'HÁBITOS'}
            </span>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#EAE2D8] bg-[#FFFDF9] text-[11px] font-mono text-[#6B605B]">
                {/* Column: Habit */}
                <th className="py-3 px-5 font-bold uppercase tracking-wider min-w-[200px]">
                  Hábito
                </th>

                {/* Columns: Mon - Sun */}
                {weekDays.map((day) => (
                  <th
                    key={day.dateStr}
                    className={cn(
                      'py-2 px-1 text-center w-[54px] transition-colors',
                      day.isCurrent && 'bg-[#FDF2ED] text-[#C95D47] font-bold',
                    )}
                  >
                    <div className="flex flex-col items-center leading-none">
                      <span className="uppercase text-[10px] tracking-tight">{day.shortLabel}</span>
                      <span
                        className={cn(
                          'text-xs font-bold mt-1',
                          day.isCurrent ? 'text-[#C95D47]' : 'text-[#3D2E26]',
                          day.isFuture && 'opacity-40',
                        )}
                      >
                        {day.dayNum}
                      </span>
                    </div>
                  </th>
                ))}

                {/* Column: Progress Bar */}
                <th className="py-3 px-5 font-bold uppercase tracking-wider min-w-[170px] text-right">
                  Progreso
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EAE2D8] text-xs">
              {habits.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#9E928C] font-mono">
                    No tienes hábitos registrados. Agrega uno nuevo para empezar.
                  </td>
                </tr>
              ) : (
                habits.map((habit) => {
                  const Icon = ICON_MAP[habit.icon_key] ?? ICON_MAP['star']
                  const progress = habitWeekProgress[habit.id] ?? {
                    completed: 0,
                    total: 0,
                    percent: 0,
                  }

                  return (
                    <tr
                      key={habit.id}
                      className="group hover:bg-[#FAF7F2]/60 transition-colors duration-100"
                    >
                      {/* Habit Name + Icon */}
                      <td className="py-2.5 px-5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-[#EAE2D8]"
                              style={{
                                backgroundColor: `${habit.color_hex}18`,
                                color: habit.color_hex,
                              }}
                            >
                              <Icon size={14} />
                            </span>
                            <span className="font-semibold text-[#282321] truncate">
                              {habit.name}
                            </span>
                          </div>

                          <EditHabitModal
                            habit={habit}
                            trigger={
                              <button
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[#FAF7F2] text-[#9E928C] hover:text-[#282321] transition-all shrink-0 cursor-pointer"
                                title="Editar hábito"
                              >
                                <Pencil size={12} />
                              </button>
                            }
                          />
                        </div>
                      </td>

                      {/* Day Checkboxes */}
                      {weekDays.map((day) => {
                        const isChecked = logMap[`${habit.id}__${day.dateStr}`] ?? false
                        const disabled = day.isFuture || isPending(habit.id, day.dateStr)

                        return (
                          <td
                            key={day.dateStr}
                            className={cn(
                              'py-1 px-1 text-center align-middle transition-colors',
                              day.isCurrent && 'bg-[#FDF6F0]/60',
                            )}
                          >
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() => !disabled && onToggle(habit.id, day.dateStr, isChecked)}
                                className={cn(
                                  'w-5 h-5 rounded-lg border transition-all flex items-center justify-center cursor-pointer select-none active:scale-90',
                                  disabled && 'cursor-not-allowed opacity-30 border-[#EAE2D8]',
                                  isChecked
                                    ? 'bg-[#F28574] border-[#F28574] text-white font-black shadow-[0_2px_8px_rgba(242,133,116,0.35)]'
                                    : 'border-[#DFD5CA] bg-[#FAF7F2] hover:border-[#F28574]',
                                )}
                                aria-label={`${habit.name} el ${day.shortLabel} ${day.dayNum}`}
                              >
                                {isChecked && (
                                  <svg
                                    className="w-3.5 h-3.5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>
                        )
                      })}

                      {/* Progress Bar & Percentage Column */}
                      <td className="py-2.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {/* Creamy horizontal progress bar */}
                          <div className="w-24 sm:w-28 h-2.5 bg-[#F0EAE1] rounded-full overflow-hidden border border-[#EAE2D8]">
                            <motion.div
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: habit.color_hex || '#4EBA88',
                                boxShadow: `0 0 8px ${habit.color_hex || '#4EBA88'}44`,
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${progress.percent}%` }}
                              transition={{ duration: 0.4, ease: 'easeOut' }}
                            />
                          </div>

                          {/* Percentage label */}
                          <span
                            className="font-mono font-bold text-xs w-10 text-right shrink-0"
                            style={{ color: progress.percent > 0 ? habit.color_hex : '#9E928C' }}
                          >
                            {progress.percent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}

              {/* Bottom Add Habit Row */}
              <tr className="bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] transition-colors">
                <td className="py-3 px-5">
                  <AddHabitModal
                    trigger={
                      <button className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#4EBA88] hover:text-[#3D996E] transition-colors cursor-pointer">
                        <Plus size={14} className="stroke-[3]" />
                        <span>AGREGAR HÁBITO</span>
                      </button>
                    }
                  />
                </td>
                <td colSpan={8} className="py-3 px-5 text-right font-mono text-[11px] text-[#9E928C]">
                  {weekRangeLabel}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
