'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { Archive, X, RotateCcw, Trash2, AlertTriangle, Sparkles, Loader2 } from 'lucide-react'
import { useArchivedHabits, useUnarchiveHabit, useDeleteHabit } from '@/hooks/useHabits'
import { parseHabitCategory } from '@/lib/habit-targets'
import { ICON_MAP } from '@/lib/icon-map'
import { retroAudio } from '@/lib/sound-effects'
import type { HabitRow } from '@/types/database'

interface ArchivedHabitsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ArchivedHabitsModal({ isOpen, onOpenChange }: ArchivedHabitsModalProps) {
  const { data: archivedHabits = [], isLoading } = useArchivedHabits()
  const unarchiveHabit = useUnarchiveHabit()
  const deleteHabit = useDeleteHabit()

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  const handleRestore = async (habit: HabitRow) => {
    try {
      retroAudio.playLevelUp()
      await unarchiveHabit.mutateAsync(habit.id)
      setFeedbackMsg(`"${habit.name}" fue restaurado a tu rutina activa.`)
      setTimeout(() => setFeedbackMsg(null), 3000)
    } catch {
      retroAudio.playUncheck()
    }
  }

  const handleDeletePermanent = async (habitId: string) => {
    try {
      retroAudio.playUncheck()
      await deleteHabit.mutateAsync(habitId)
      setConfirmDeleteId(null)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-[#28201A]/45 backdrop-blur-sm z-[9998]"
              />
            </Dialog.Overlay>

            {/* Content Modal */}
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg max-h-[85vh] overflow-y-auto bg-[#FFFFFF] border border-[#EAE2D8] rounded-3xl p-6 shadow-[0_16px_48px_rgba(78,64,53,0.12)] z-[9999] font-sans focus:outline-none"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#EAE2D8] pb-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#FFF8E6] border border-[#FFE08A] text-[#B87A00] shadow-xs">
                      <Archive size={16} />
                    </div>
                    <div>
                      <Dialog.Title className="font-mono text-sm font-bold text-[#3D2E26] tracking-wide">
                        HÁBITOS ARCHIVADOS
                      </Dialog.Title>
                      <Dialog.Description className="text-xs text-[#8C7A70]">
                        Hábitos en pausa con su historial conservado
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

                {/* Toast Feedback */}
                {feedbackMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-2xl bg-[#EBF7F1] border border-[#4EBA88]/30 text-[#246348] text-xs font-mono font-medium flex items-center gap-2"
                  >
                    <Sparkles size={14} className="text-[#4EBA88]" />
                    <span>{feedbackMsg}</span>
                  </motion.div>
                )}

                {/* List / Content */}
                {isLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#8C7A70]">
                    <Loader2 size={24} className="animate-spin text-[#EFA93A]" />
                    <span className="text-xs font-mono">Cargando archivados...</span>
                  </div>
                ) : archivedHabits.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FAF7F2] border border-[#EAE2D8] flex items-center justify-center text-[#9E928C] mb-3">
                      <Archive size={24} />
                    </div>
                    <h3 className="font-mono text-sm font-bold text-[#3D2E26] mb-1">
                      No tienes hábitos archivados
                    </h3>
                    <p className="text-xs text-[#8C7A70] max-w-xs mx-auto leading-relaxed">
                      Cuando desees pausar un hábito temporalmente sin perder tus estadísticas y rachas pasadas, archívalo desde el botón de editar.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[11px] text-[#8C7A70] font-mono font-semibold uppercase tracking-wider">
                      {archivedHabits.length} {archivedHabits.length === 1 ? 'HÁBITO EN PAUSA' : 'HÁBITOS EN PAUSA'}
                    </p>

                    {archivedHabits.map((habit) => {
                      const Icon = ICON_MAP[habit.icon_key] ?? ICON_MAP['star']
                      const targetInfo = parseHabitCategory(habit.category)
                      const isDeletingThis = confirmDeleteId === habit.id

                      return (
                        <div
                          key={habit.id}
                          className="p-3.5 rounded-2xl border border-[#EAE2D8] bg-[#FFFDF9] hover:border-[#DFD5CA] transition-all"
                        >
                          {isDeletingThis ? (
                            <div className="space-y-3">
                              <div className="flex items-start gap-2.5 text-[#C93B58] text-xs">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <p className="leading-snug">
                                  ¿Seguro que deseas eliminar definitivamente <strong>"{habit.name}"</strong>? Se borrarán todos sus registros.
                                </p>
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-[#8C7A70] hover:bg-[#FAF7F2]"
                                >
                                  CANCELAR
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePermanent(habit.id)}
                                  disabled={deleteHabit.isPending}
                                  className="px-3 py-1.5 rounded-xl bg-[#C93B58] hover:bg-[#A82B44] text-white font-mono text-xs font-bold transition-all shadow-xs"
                                >
                                  ELIMINAR
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-3">
                              {/* Left: Icon & Info */}
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <span
                                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-[#EAE2D8]"
                                  style={{
                                    backgroundColor: `${habit.color_hex}18`,
                                    color: habit.color_hex,
                                  }}
                                >
                                  <Icon size={16} />
                                </span>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-semibold text-[#3D2E26] truncate">
                                    {habit.name}
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span
                                      className="px-2 py-0.5 font-mono text-[9px] font-bold rounded-md"
                                      style={{
                                        backgroundColor: `${habit.color_hex}15`,
                                        color: habit.color_hex,
                                      }}
                                    >
                                      {targetInfo.cleanCategory}
                                    </span>
                                    {targetInfo.targetDays && (
                                      <span className="font-mono text-[9px] font-bold text-[#8C7A70]">
                                        Reto: {targetInfo.targetDays}d
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right: Actions */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleRestore(habit)}
                                  disabled={unarchiveHabit.isPending}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EBF7F1] border border-[#EAE2D8] hover:border-[#4EBA88]/40 text-[#3D2E26] hover:text-[#246348] font-mono text-[11px] font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                                  title="Restaurar a la rutina diaria"
                                >
                                  <RotateCcw size={13} className="text-[#4EBA88]" />
                                  <span>RESTAURAR</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(habit.id)}
                                  className="p-1.5 rounded-xl text-[#8C7A70] hover:text-[#C93B58] hover:bg-[#FFF0F3] transition-colors cursor-pointer"
                                  title="Eliminar permanentemente"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
