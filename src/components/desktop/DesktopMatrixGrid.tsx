'use client'

import React, { memo, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PixelCheckbox } from '@/components/ui/PixelCheckbox'
import { AddHabitModal } from '@/components/ui/AddHabitModal'
import { EditHabitModal } from '@/components/ui/EditHabitModal'
import type { HabitRow, HabitLogRow } from '@/types/database'
import { getMonthDays, toISODateString, isToday, getTodayString } from '@/lib/date-utils'
import { getHabitConsistency } from '@/lib/consistency'
import { parseHabitCategory, getHabitTargetProgress } from '@/lib/habit-targets'
import { ICON_MAP } from '@/lib/icon-map'

// ---- Types --------------------------------------------------

interface DesktopMatrixGridProps {
  habits: HabitRow[]
  logs: HabitLogRow[]
  year: number
  month: number
  onToggle: (habitId: string, date: string, currentlyCompleted: boolean) => void
  isPending?: (habitId: string, date: string) => boolean
}

// ---- Sub-components (memoized for performance) --------------

interface CellProps {
  habitId: string
  date: string
  color: string
  completed: boolean
  isCurrentDay: boolean
  isFuture: boolean
  onToggle: (habitId: string, date: string, currentlyCompleted: boolean) => void
  pending: boolean
}

const MatrixCell = memo(function MatrixCell({
  habitId,
  date,
  color,
  completed,
  isCurrentDay,
  isFuture,
  onToggle,
  pending,
}: CellProps) {
  return (
    <td
      className={cn(
        'p-0.5 text-center transition-colors',
        isCurrentDay && 'bg-[#FDF6F0]/70',
      )}
    >
      <div className="flex items-center justify-center w-full h-full py-1">
        <PixelCheckbox
          checked={completed}
          onChange={() => !isFuture && onToggle(habitId, date, completed)}
          color={color}
          disabled={isFuture || pending}
          size="sm"
          aria-label={`${date} ${completed ? 'completado' : 'pendiente'}`}
        />
      </div>
    </td>
  )
})

interface HabitNameCellProps {
  habit: HabitRow
  consistency: number
  logs: HabitLogRow[]
}

const HabitNameCell = memo(function HabitNameCell({ habit, consistency, logs }: HabitNameCellProps) {
  const Icon = ICON_MAP[habit.icon_key] ?? ICON_MAP['star']
  const targetInfo = parseHabitCategory(habit.category)
  const targetProg = targetInfo.targetDays
    ? getHabitTargetProgress(logs, habit.id, targetInfo.targetDays)
    : null

  return (
    <td className="sticky left-0 z-20 bg-[#FFFFFF] border-r border-[#EAE2D8] min-w-[180px] max-w-[220px] px-3 py-2 group/cell shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span
            className="flex items-center justify-center w-7 h-7 rounded-xl shrink-0 border border-[#EAE2D8]"
            style={{ backgroundColor: `${habit.color_hex}18`, color: habit.color_hex }}
          >
            <Icon size={14} />
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-[#3D2E26] text-xs font-semibold truncate leading-tight">
              {habit.name}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[10px] font-bold leading-tight" style={{ color: habit.color_hex }}>
                {consistency}%
              </span>
              {targetProg && (
                <span
                  className="font-mono text-[9px] font-bold px-1 rounded-sm leading-tight"
                  style={{
                    backgroundColor: targetProg.isCompleted ? '#FFF8E6' : `${habit.color_hex}15`,
                    color: targetProg.isCompleted ? '#EFA93A' : habit.color_hex,
                  }}
                  title={targetProg.isCompleted ? '¡Reto Completado!' : `Reto: ${targetProg.completedDays}/${targetProg.targetDays} días`}
                >
                  {targetProg.isCompleted ? '🏆 Reto' : `🎯 ${targetProg.completedDays}/${targetProg.targetDays}d`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <EditHabitModal
          habit={habit}
          trigger={
            <button
              className="opacity-0 group-hover/cell:opacity-100 p-1.5 rounded-lg hover:bg-[#FAF7F2] text-[#9E928C] hover:text-[#3D2E26] transition-all shrink-0 cursor-pointer"
              title="Editar hábito"
            >
              <Pencil size={12} />
            </button>
          }
        />
      </div>
    </td>
  )
})

// ---- Main Component -----------------------------------------

export function DesktopMatrixGrid({
  habits,
  logs,
  year,
  month,
  onToggle,
  isPending = () => false,
}: DesktopMatrixGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const today = getTodayString()
  const days = useMemo(() => getMonthDays(year, month), [year, month])

  // Build log lookup map: `${habitId}__${date}` → boolean
  const logMap = useMemo(() => {
    const map: Record<string, boolean> = {}
    logs.forEach((l) => {
      map[`${l.habit_id}__${l.date}`] = l.completed
    })
    return map
  }, [logs])

  // Pre-compute consistency per habit
  const consistencyMap = useMemo(() => {
    const m: Record<string, number> = {}
    habits.forEach((h) => {
      m[h.id] = getHabitConsistency(logs, h.id, year, month)
    })
    return m
  }, [habits, logs, year, month])

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#64748B]">
        <p className="font-mono text-sm">No hay hábitos activos.</p>
        <p className="font-mono text-xs mt-1 opacity-60">Crea tu primer hábito para comenzar.</p>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto overflow-y-visible scrollbar-thin scrollbar-thumb-[#E5DCD3] scrollbar-track-transparent p-1"
    >
      <table
        className="border-collapse table-fixed bg-[#FFFFFF] rounded-2xl overflow-hidden border border-[#EAE2D8] shadow-[0_6px_20px_rgba(78,64,53,0.04)]"
        style={{ minWidth: `${180 + days.length * 42}px` }}
      >
        {/* THEAD — Sticky day headers */}
        <thead>
          <tr className="border-b border-[#EAE2D8] bg-[#FFFDF9]">
            {/* Sticky corner header */}
            <th className="sticky left-0 z-30 bg-[#FAF7F2] border-r border-[#EAE2D8] px-3.5 py-2.5 min-w-[180px] max-w-[220px]">
              <span className="text-[10px] font-mono text-[#7A6A60] uppercase tracking-wider font-bold">
                Hábito / Día
              </span>
            </th>

            {/* Day columns */}
            {days.map((day) => {
              const dateStr = toISODateString(year, month, day)
              const todayFlag = isToday(dateStr)
              const futureFLag = dateStr > today

              return (
                <th
                  key={day}
                  className={cn(
                    'w-[42px] text-center pb-2 pt-1.5 font-mono text-[11px] font-semibold relative transition-colors',
                    todayFlag ? 'bg-[#FDF2ED] text-[#C95D47] font-bold' : 'text-[#7A6A60]',
                    futureFLag && 'opacity-40',
                  )}
                >
                  {todayFlag && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#F28574]" />
                  )}
                  {day}
                </th>
              )
            })}
          </tr>
        </thead>

        {/* TBODY — Habit rows */}
        <tbody>
          {habits.map((habit, rowIdx) => (
            <motion.tr
              key={habit.id}
              className={cn(
                'border-b border-[#EAE2D8] group',
                'hover:bg-[#FAF7F2]/60 transition-colors duration-150',
              )}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rowIdx * 0.03, duration: 0.25 }}
            >
              {/* Sticky habit name cell */}
              <HabitNameCell
                habit={habit}
                consistency={consistencyMap[habit.id] ?? 0}
                logs={logs}
              />

              {/* Day cells */}
              {days.map((day) => {
                const dateStr = toISODateString(year, month, day)
                const completed = logMap[`${habit.id}__${dateStr}`] ?? false
                const isFuture = dateStr > today
                const isCurrentDay = isToday(dateStr)

                return (
                  <MatrixCell
                    key={dateStr}
                    habitId={habit.id}
                    date={dateStr}
                    color={habit.color_hex}
                    completed={completed}
                    isCurrentDay={isCurrentDay}
                    isFuture={isFuture}
                    onToggle={onToggle}
                    pending={isPending(habit.id, dateStr)}
                  />
                )
              })}
            </motion.tr>
          ))}

          {/* Add Habit Action Row */}
          <tr className="border-b border-[#EAE2D8] hover:bg-[#FAF7F2]/50 transition-colors">
            <td className="sticky left-0 z-20 bg-[#FAF7F2] border-r border-[#EAE2D8] px-3.5 py-2.5">
              <AddHabitModal
                trigger={
                  <button className="flex items-center gap-2 text-xs font-mono text-[#C95D47] hover:text-[#B34732] font-bold transition-colors cursor-pointer">
                    <Plus size={14} className="stroke-[3]" />
                    <span>NUEVO HÁBITO</span>
                  </button>
                }
              />
            </td>
            <td colSpan={days.length} className="px-4 py-2.5 text-[11px] font-mono text-[#9E928C]">
              Monitorea la consistencia de tus hábitos en el mes
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

