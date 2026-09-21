'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpDown, ArrowUp, ArrowDown, X, Check } from 'lucide-react'
import { useHabits, useReorderHabit } from '@/hooks/useHabits'
import { ICON_MAP } from '@/lib/icon-map'
import { retroAudio } from '@/lib/sound-effects'
import { parseHabitCategory } from '@/lib/habit-targets'
import { cn } from '@/lib/utils'

interface ReorderHabitsModalProps {
  trigger?: React.ReactNode
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ReorderHabitsModal({ trigger, isOpen: controlledOpen, onOpenChange }: ReorderHabitsModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen
  const setIsOpen = isControlled ? onOpenChange ?? (() => {}) : setInternalOpen

  const { data: habits = [] } = useHabits()
  const reorderHabit = useReorderHabit()

  const handleMove = async (habitId: string, direction: 'up' | 'down') => {
    retroAudio.playCheck()
    try {
      await reorderHabit.mutateAsync({ habitId, direction })
    } catch {}
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}

      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-[#28201A]/45 backdrop-blur-sm z-[9998]"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md max-h-[85vh] flex flex-col bg-[#FFFFFF] border border-[#EAE2D8] rounded-3xl p-6 shadow-[0_16px_48px_rgba(78,64,53,0.12)] z-[9999] font-sans focus:outline-none"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#EAE2D8] pb-4 mb-4 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#FAF7F2] border border-[#EAE2D8] text-[#C95D47] shadow-xs">
                      <ArrowUpDown size={16} />
                    </div>
                    <div>
                      <Dialog.Title className="font-mono text-sm font-bold text-[#3D2E26] tracking-wide">
                        ORGANIZAR RUTINA
                      </Dialog.Title>
                      <Dialog.Description className="text-xs text-[#8C7A70]">
                        Define el orden visual de tus hábitos
                      </Dialog.Description>
                    </div>
                  </div>

                  <Dialog.Close asChild>
                    <button
                      className="p-1.5 rounded-xl text-[#9E928C] hover:text-[#3D2E26] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                      aria-label="Cerrar"
                    >
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>

                {/* Habit List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-[#E5DCD3]">
                  {habits.length === 0 ? (
                    <p className="text-xs font-mono text-[#8C7A70] text-center py-8">
                      No hay hábitos para ordenar.
                    </p>
                  ) : (
                    habits.map((habit, idx) => {
                      const Icon = ICON_MAP[habit.icon_key] ?? ICON_MAP.star
                      const targetInfo = parseHabitCategory(habit.category)
                      const isFirst = idx === 0
                      const isLast = idx === habits.length - 1

                      return (
                        <motion.div
                          key={habit.id}
                          layout
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                          className="flex items-center justify-between gap-2.5 p-3 rounded-2xl bg-[#FFFDF9] border border-[#EAE2D8] hover:border-[#DFD5CA] shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="font-mono text-[11px] font-bold text-[#8C7A70] w-4 text-center">
                              {idx + 1}
                            </span>
                            <span
                              className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border border-[#EAE2D8]"
                              style={{
                                backgroundColor: `${habit.color_hex}18`,
                                color: habit.color_hex,
                              }}
                            >
                              <Icon size={14} />
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold text-[#3D2E26] truncate">
                                {habit.name}
                              </span>
                              <span className="text-[10px] text-[#8C7A70] font-mono">
                                {targetInfo.cleanCategory}
                              </span>
                            </div>
                          </div>

                          {/* Up / Down Action buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={isFirst || reorderHabit.isPending}
                              onClick={() => handleMove(habit.id, 'up')}
                              className={cn(
                                'p-1.5 rounded-xl border transition-all cursor-pointer',
                                isFirst
                                  ? 'opacity-30 border-transparent text-[#DFD5CA] cursor-not-allowed'
                                  : 'bg-[#FAF7F2] border-[#EAE2D8] hover:border-[#F28574] text-[#3D2E26] hover:text-[#C95D47] active:scale-90',
                              )}
                              title="Mover arriba"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              disabled={isLast || reorderHabit.isPending}
                              onClick={() => handleMove(habit.id, 'down')}
                              className={cn(
                                'p-1.5 rounded-xl border transition-all cursor-pointer',
                                isLast
                                  ? 'opacity-30 border-transparent text-[#DFD5CA] cursor-not-allowed'
                                  : 'bg-[#FAF7F2] border-[#EAE2D8] hover:border-[#F28574] text-[#3D2E26] hover:text-[#C95D47] active:scale-90',
                              )}
                              title="Mover abajo"
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="pt-4 mt-2 border-t border-[#EAE2D8] flex items-center justify-end shrink-0">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F28574] to-[#E57865] hover:from-[#FA9585] hover:to-[#F28574] text-white font-mono text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Check size={14} />
                      <span>LISTO</span>
                    </button>
                  </Dialog.Close>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
