'use client'

import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Pencil, Sparkles } from 'lucide-react'
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
    <div className="flex flex-col lg:flex-row items-stretch gap-4 w-full">
      {/* LEFT: Overall Donut Gauge Card */}
      <div className="w-full lg:w-[220px] shrink-0 bg-[#10121A] border border-[#1E2230] rounded-xl p-5 flex flex-col items-center justify-between shadow-lg relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center w-full mb-2">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1E2230] text-[#94A3B8] font-mono text-[10px] uppercase tracking-widest mb-1">
            <Sparkles size={10} className="text-[#10B981]" />
            <span>RESUMEN SEMANAL</span>
          </div>
          <p className="text-[11px] font-mono text-[#64748B]">{weekRangeLabel}</p>
        </div>

        {/* Big Donut */}
        <div className="my-2">
          <AestheticDonutGauge
            percentage={overallPercent}
            sublabel={`${totalCompleted} / ${totalPossible} completados`}
            size={135}
            strokeWidth={14}
            color="#10B981"
            trackColor="#161926"
          />
        </div>

        {/* Navigation buttons for week */}
        <div className="flex items-center justify-between w-full pt-2 border-t border-[#1E2230]/60 mt-1">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="p-1.5 rounded-md hover:bg-[#1E2230] text-[#94A3B8] hover:text-slate-100 transition-colors cursor-pointer"
            title="Semana anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
            className={cn(
              'px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-all cursor-pointer',
              weekOffset === 0
                ? 'bg-[#1E2230]/50 text-[#64748B] cursor-default'
                : 'bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25',
            )}
          >
            {weekOffset === 0 ? 'Esta Semana' : 'Ir a Hoy'}
          </button>

          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            disabled={weekOffset >= 0}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              weekOffset >= 0
                ? 'text-[#2E3450] cursor-not-allowed'
                : 'hover:bg-[#1E2230] text-[#94A3B8] hover:text-slate-100 cursor-pointer',
            )}
            title="Semana siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* RIGHT: Aesthetic Spreadsheet Habit Table */}
      <div className="flex-1 bg-[#10121A] border border-[#1E2230] rounded-xl overflow-hidden shadow-lg flex flex-col">
        {/* Spreadsheet Header Bar */}
        <div className="bg-[#08090C] px-4 py-2.5 border-b border-[#1E2230] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Black solid badge like in the photo */}
            <div className="bg-[#000000] border border-[#1E2230] px-3 py-1 rounded-md text-slate-100 font-mono font-bold text-xs tracking-wider uppercase shadow-sm">
              HABIT TRACKER
            </div>
            <span className="text-xs font-mono text-[#64748B] hidden sm:inline">
              Matriz Semanal de Disciplina
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#10B981] font-semibold bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
              {habits.length} {habits.length === 1 ? 'HÁBITO' : 'HÁBITOS'}
            </span>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#1E2230] bg-[#0C0E14] text-[11px] font-mono text-[#64748B]">
                {/* Column: Habit */}
                <th className="py-2.5 px-4 font-bold uppercase tracking-wider min-w-[200px]">
                  Hábito
                </th>

                {/* Columns: Mon - Sun */}
                {weekDays.map((day) => (
                  <th
                    key={day.dateStr}
                    className={cn(
                      'py-2 px-1 text-center w-[52px]',
                      day.isCurrent && 'bg-[#1E2230]/40 text-[#10B981] font-bold',
                    )}
                  >
                    <div className="flex flex-col items-center leading-none">
                      <span className="uppercase text-[10px] tracking-tight">{day.shortLabel}</span>
                      <span
                        className={cn(
                          'text-xs font-bold mt-1',
                          day.isCurrent ? 'text-[#10B981]' : 'text-slate-300',
                          day.isFuture && 'opacity-40',
                        )}
                      >
                        {day.dayNum}
                      </span>
                    </div>
                  </th>
                ))}

                {/* Column: Progress Bar */}
                <th className="py-2.5 px-4 font-bold uppercase tracking-wider min-w-[170px] text-right">
                  Progreso
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1E2230]/60 text-xs">
              {habits.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-mono">
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
                      className="group hover:bg-[#141724]/60 transition-colors duration-100"
                    >
                      {/* Habit Name + Icon */}
                      <td className="py-2 px-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: `${habit.color_hex}15`,
                                color: habit.color_hex,
                              }}
                            >
                              <Icon size={13} />
                            </span>
                            <span className="font-medium text-slate-200 truncate group-hover:text-slate-100">
                              {habit.name}
                            </span>
                          </div>

                          <EditHabitModal
                            habit={habit}
                            trigger={
                              <button
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#1E2230] text-[#64748B] hover:text-[#F1F5F9] transition-all shrink-0 cursor-pointer"
                                title="Editar hábito"
                              >
                                <Pencil size={11} />
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
                              'py-1 px-1 text-center align-middle',
                              day.isCurrent && 'bg-[#1E2230]/20',
                            )}
                          >
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() => !disabled && onToggle(habit.id, day.dateStr, isChecked)}
                                className={cn(
                                  'w-5 h-5 rounded border transition-all flex items-center justify-center cursor-pointer select-none',
                                  disabled && 'cursor-not-allowed opacity-30 border-[#1E2230]',
                                  isChecked
                                    ? 'bg-[#10B981] border-[#10B981] text-slate-950 font-black shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                    : 'border-[#2A3045] bg-[#0A0C12] hover:border-[#10B981]/60',
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
                      <td className="py-2 px-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {/* Solid horizontal progress bar */}
                          <div className="w-24 sm:w-28 h-2 bg-[#161926] rounded-full overflow-hidden border border-[#1E2230]">
                            <motion.div
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: habit.color_hex || '#10B981',
                                boxShadow: `0 0 8px ${habit.color_hex || '#10B981'}66`,
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${progress.percent}%` }}
                              transition={{ duration: 0.4, ease: 'easeOut' }}
                            />
                          </div>

                          {/* Percentage label */}
                          <span
                            className="font-mono font-bold text-xs w-10 text-right shrink-0"
                            style={{ color: progress.percent > 0 ? habit.color_hex : '#64748B' }}
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
              <tr className="bg-[#0C0E14]/70 hover:bg-[#0E111A] transition-colors">
                <td className="py-2.5 px-4">
                  <AddHabitModal
                    trigger={
                      <button className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#10B981] hover:text-[#34D399] transition-colors cursor-pointer">
                        <Plus size={14} className="stroke-[3]" />
                        <span>AGREGAR HÁBITO</span>
                      </button>
                    }
                  />
                </td>
                <td colSpan={8} className="py-2.5 px-4 text-right font-mono text-[11px] text-[#475569]">
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
