'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, X, Check, Archive, Trash2, AlertTriangle } from 'lucide-react'
import { ICON_MAP, ICON_KEYS } from '@/lib/icon-map'
import { useUpdateHabit, useArchiveHabit, useDeleteHabit } from '@/hooks/useHabits'
import type { HabitRow } from '@/types/database'
import { cn } from '@/lib/utils'

const PRESET_COLORS = [
  { hex: '#10B981', label: 'Menta Neon' },
  { hex: '#EC4899', label: 'Fucsia Cyber' },
  { hex: '#06B6D4', label: 'Cian Laser' },
  { hex: '#A78BFA', label: 'Violeta Retro' },
  { hex: '#F59E0B', label: 'Ámbar Pixel' },
  { hex: '#F43F5E', label: 'Rosa Neón' },
  { hex: '#38BDF8', label: 'Azul Eléctrico' },
  { hex: '#84CC16', label: 'Verde Lime' },
]

const CATEGORY_PRESETS = [
  'Bienestar',
  'Salud',
  'Enfoque',
  'Finanzas',
  'Creatividad',
  'Productividad',
]

interface EditHabitModalProps {
  habit: HabitRow
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

export function EditHabitModal({ habit, open, onOpenChange, trigger }: EditHabitModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange ?? (() => {}) : setInternalOpen

  // Form state pre-populated with existing habit
  const [name, setName] = useState(habit.name)
  const [category, setCategory] = useState(habit.category ?? '')
  const [colorHex, setColorHex] = useState(habit.color_hex)
  const [iconKey, setIconKey] = useState(habit.icon_key)
  const [errorMsg, setErrorMsg] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const updateHabit = useUpdateHabit()
  const archiveHabit = useArchiveHabit()
  const deleteHabit = useDeleteHabit()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('El nombre no puede estar vacío.')
      return
    }

    setErrorMsg('')
    try {
      await updateHabit.mutateAsync({
        id: habit.id,
        name: name.trim(),
        category: (category ?? '').trim() || 'General',
        color_hex: colorHex,
        icon_key: iconKey,
      })
      setIsOpen(false)
    } catch (err) {
      console.error('Error updating habit:', err)
      setErrorMsg('Error al guardar cambios.')
    }
  }

  const handleArchive = async () => {
    try {
      await archiveHabit.mutateAsync(habit.id)
      setIsOpen(false)
    } catch (err) {
      console.error('Error archiving habit:', err)
      setErrorMsg('Error al archivar el hábito.')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteHabit.mutateAsync(habit.id)
      setIsOpen(false)
    } catch (err) {
      console.error('Error deleting habit:', err)
      setErrorMsg('Error al eliminar el hábito.')
    }
  }

  const PreviewIcon = ICON_MAP[iconKey] || ICON_MAP.star

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}

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
                className="fixed inset-0 bg-[#08090C]/80 backdrop-blur-md z-50"
              />
            </Dialog.Overlay>

            {/* Modal Content */}
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto bg-[#10121A] border border-[#1E2230] rounded-2xl p-6 shadow-2xl shadow-cyan-950/20 z-50 focus:outline-none"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#1E2230] pb-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors"
                      style={{
                        backgroundColor: `${colorHex}15`,
                        borderColor: `${colorHex}40`,
                      }}
                    >
                      <Pencil size={16} style={{ color: colorHex }} />
                    </div>
                    <div>
                      <Dialog.Title className="font-mono text-base font-bold text-[#F1F5F9] tracking-wide">
                        EDITAR HÁBITO
                      </Dialog.Title>
                      <Dialog.Description className="text-xs text-[#64748B]">
                        Modifica los parámetros de este objetivo
                      </Dialog.Description>
                    </div>
                  </div>

                  <Dialog.Close asChild>
                    <button
                      className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#1E2230] transition-colors"
                      aria-label="Cerrar"
                    >
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>

                {/* Confirm Delete State */}
                {showConfirmDelete ? (
                  <div className="space-y-4 py-2">
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
                      <AlertTriangle size={20} className="text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-mono text-xs font-bold text-rose-300">
                          ¿Eliminar permanentemente "{habit.name}"?
                        </h4>
                        <p className="text-xs text-rose-200/70 mt-1 leading-relaxed">
                          Esta acción eliminará el hábito y todo su historial de registros. Si prefieres conservar las estadísticas pasadas, considera archivar el hábito.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowConfirmDelete(false)}
                        className="px-4 py-2 rounded-xl text-xs font-mono text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#1E2230] transition-colors"
                      >
                        CANCELAR
                      </button>

                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleteHabit.isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-mono text-xs font-bold transition-all"
                      >
                        <Trash2 size={14} />
                        <span>ELIMINAR DEFINITIVAMENTE</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Form */
                  <form onSubmit={handleUpdate} className="space-y-5">
                    {/* Error Banner */}
                    {errorMsg && (
                      <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
                        {errorMsg}
                      </div>
                    )}

                    {/* Habit Name Input */}
                    <div>
                      <label className="block font-mono text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                        Nombre del hábito *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nombre..."
                        className="w-full px-4 py-2.5 bg-[#08090C] border border-[#1E2230] rounded-xl text-[#F1F5F9] placeholder-[#475569] text-sm focus:outline-none focus:border-[#06B6D4] transition-colors font-medium"
                        required
                      />
                    </div>

                    {/* Category Selector */}
                    <div>
                      <label className="block font-mono text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                        Categoría
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {CATEGORY_PRESETS.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={cn(
                              'px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 border',
                              category === cat
                                ? 'bg-[#1E2230] text-[#F1F5F9] border-[#3B82F6]'
                                : 'bg-[#08090C] text-[#64748B] border-[#1E2230] hover:text-[#94A3B8]',
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#08090C] border border-[#1E2230] rounded-lg text-[#F1F5F9] placeholder-[#475569] text-xs focus:outline-none focus:border-[#3B82F6] transition-colors"
                      />
                    </div>

                    {/* Color Swatches */}
                    <div>
                      <label className="block font-mono text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                        Color neón
                      </label>
                      <div className="grid grid-cols-8 gap-2">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setColorHex(c.hex)}
                            className={cn(
                              'w-full aspect-square rounded-xl flex items-center justify-center transition-transform duration-150 border',
                              colorHex === c.hex
                                ? 'scale-110 border-white shadow-lg'
                                : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100',
                            )}
                            style={{
                              backgroundColor: c.hex,
                              boxShadow: colorHex === c.hex ? `0 0 12px ${c.hex}` : 'none',
                            }}
                            title={c.label}
                          >
                            {colorHex === c.hex && <Check size={14} className="text-black font-bold" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Icon Grid */}
                    <div>
                      <label className="block font-mono text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                        Icono arcade
                      </label>
                      <div className="grid grid-cols-7 gap-2 max-h-36 overflow-y-auto p-1 bg-[#08090C] border border-[#1E2230] rounded-xl">
                        {ICON_KEYS.map((key) => {
                          const IconComponent = ICON_MAP[key]
                          const isSelected = iconKey === key
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setIconKey(key)}
                              className={cn(
                                'p-2 rounded-lg flex items-center justify-center transition-all duration-150 border',
                                isSelected
                                  ? 'border-cyan-500/50 bg-[#06B6D4]/15 text-[#06B6D4]'
                                  : 'border-transparent text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#1E2230]/50',
                              )}
                            >
                              <IconComponent size={18} />
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Preview Card */}
                    <div className="p-3.5 rounded-xl bg-[#08090C] border border-[#1E2230] flex items-center justify-between">
                      <span className="font-mono text-[11px] text-[#64748B] uppercase tracking-wider">
                        VISTA PREVIA
                      </span>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center border"
                          style={{
                            backgroundColor: `${colorHex}15`,
                            borderColor: `${colorHex}40`,
                          }}
                        >
                          <PreviewIcon size={14} style={{ color: colorHex }} />
                        </div>
                        <span className="font-mono text-xs font-bold text-[#F1F5F9]">
                          {name.trim() || 'Nombre del Hábito'}
                        </span>
                        <span
                          className="font-mono text-[10px] px-2 py-0.5 rounded border"
                          style={{
                            backgroundColor: `${colorHex}10`,
                            color: colorHex,
                            borderColor: `${colorHex}30`,
                          }}
                        >
                          {category || 'General'}
                        </span>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#1E2230]">
                      {/* Archive & Delete secondary buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleArchive}
                          disabled={archiveHabit.isPending}
                          className="p-2 rounded-lg text-[#64748B] hover:text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-colors"
                          title="Archivar Hábito"
                        >
                          <Archive size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowConfirmDelete(true)}
                          className="p-2 rounded-lg text-[#64748B] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Eliminar Hábito"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Dialog.Close asChild>
                          <button
                            type="button"
                            className="px-3.5 py-2 rounded-xl text-xs font-mono text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#1E2230] transition-colors"
                          >
                            CANCELAR
                          </button>
                        </Dialog.Close>

                        <button
                          type="submit"
                          disabled={updateHabit.isPending}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] text-black font-mono text-xs font-bold tracking-wider transition-all shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
                        >
                          {updateHabit.isPending ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
