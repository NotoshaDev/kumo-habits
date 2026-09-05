'use client'

import React, { memo, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PixelCheckbox } from '@/components/ui/PixelCheckbox'
import { AddHabitModal } from '@/components/ui/AddHabitModal'
import type { HabitRow, HabitLogRow } from '@/types/database'
import { getMonthDays, toISODateString, isToday, getTodayString } from '@/lib/date-utils'
import { getHabitConsistency } from '@/lib/consistency'
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
        'p-0.5 text-center',
        isCurrentDay && 'bg-[#1E2230]/40',
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
}

const HabitNameCell = memo(function HabitNameCell({ habit, consistency }: HabitNameCellProps) {
  const Icon = ICON_MAP[habit.icon_key] ?? ICON_MAP['star']

  return (
    <td className="sticky left-0 z-20 bg-[#10121A] border-r border-[#1E2230] min-w-[180px] max-w-[220px] px-3 py-1.5">
      <div className="flex items-center gap-2">
        <span
          className="flex items-center justify-center w-7 h-7 rounded-md shrink-0"
          style={{ backgroundColor: `${habit.color_hex}20`, color: habit.color_hex }}
        >
          <Icon size={14} />
        </span>
        <div className="flex flex-col min-w-0">
          <span className="text-[#F1F5F9] text-xs font-medium truncate leading-tight">
            {habit.name}
          </span>
          <span className="font-mono text-[10px] leading-tight" style={{ color: habit.color_hex }}>
            {consistency}%
          </span>
        </div>
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
      className="overflow-x-auto overflow-y-visible scrollbar-thin scrollbar-thumb-[#1E2230] scrollbar-track-transparent"
    >
      <table
        className="border-collapse table-fixed"
        style={{ minWidth: `${180 + days.length * 42}px` }}
      >
        {/* THEAD — Sticky day headers */}
        <thead>
          <tr className="border-b border-[#1E2230]">
            {/* Sticky corner header */}
            <th className="sticky left-0 z-30 bg-[#10121A] border-r border-[#1E2230] px-3 py-2 min-w-[180px] max-w-[220px]">
              <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-widest">
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
                    'w-[42px] text-center pb-2 pt-1 font-mono text-[10px] font-medium relative',
                    todayFlag ? 'text-[#10B981]' : 'text-[#64748B]',
                    futureFLag && 'opacity-30',
                  )}
                >
                  {todayFlag && (
                    <motion.span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#10B981]"
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
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
                'border-b border-[#1E2230]/50 group',
                'hover:bg-[#10121A]/60 transition-colors duration-150',
              )}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rowIdx * 0.03, duration: 0.25 }}
            >
              {/* Sticky habit name cell */}
              <HabitNameCell
                habit={habit}
                consistency={consistencyMap[habit.id] ?? 0}
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
          <tr className="border-b border-[#1E2230]/30 hover:bg-[#10121A]/40 transition-colors">
            <td className="sticky left-0 z-20 bg-[#10121A] border-r border-[#1E2230] px-3 py-2">
              <AddHabitModal
                trigger={
                  <button className="flex items-center gap-2 text-xs font-mono text-[#10B981] hover:text-[#059669] font-semibold transition-colors">
                    <Plus size={14} className="stroke-[3]" />
                    <span>NUEVO HÁBITO</span>
                  </button>
                }
              />
            </td>
            <td colSpan={days.length} className="px-3 py-2 text-[11px] font-mono text-[#475569]">
              Agrega hábitos ilimitados para monitorear tu disciplina mensual
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

