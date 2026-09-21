'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, X, Check, Archive, Trash2, AlertTriangle, Target, Infinity as InfinityIcon, ArrowUp, ArrowDown } from 'lucide-react'
import { ICON_MAP, ICON_KEYS } from '@/lib/icon-map'
import { useUpdateHabit, useArchiveHabit, useDeleteHabit, useReorderHabit, useHabits } from '@/hooks/useHabits'
import { parseHabitCategory, formatHabitCategory } from '@/lib/habit-targets'
import { retroAudio } from '@/lib/sound-effects'
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

  const parsedInitial = parseHabitCategory(habit.category)

  // Form state pre-populated with existing habit
  const [name, setName] = useState(habit.name)
  const [category, setCategory] = useState(parsedInitial.cleanCategory)
  const [isChallenge, setIsChallenge] = useState(parsedInitial.isChallenge)
  const [targetDays, setTargetDays] = useState<number>(parsedInitial.targetDays ?? 21)
  const [colorHex, setColorHex] = useState(habit.color_hex)
  const [iconKey, setIconKey] = useState(habit.icon_key)
  const [errorMsg, setErrorMsg] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showConfirmArchive, setShowConfirmArchive] = useState(false)

  // Sync state if habit prop changes or modal opens
  useEffect(() => {
    const p = parseHabitCategory(habit.category)
    setName(habit.name)
    setCategory(p.cleanCategory)
    setIsChallenge(p.isChallenge)
    setTargetDays(p.targetDays ?? 21)
    setColorHex(habit.color_hex)
    setIconKey(habit.icon_key)
    setShowConfirmDelete(false)
    setShowConfirmArchive(false)
  }, [habit, isOpen])

  const updateHabit = useUpdateHabit()
  const archiveHabit = useArchiveHabit()
  const deleteHabit = useDeleteHabit()
  const reorderHabit = useReorderHabit()
  const { data: allActiveHabits = [] } = useHabits()

  const currentHabitIndex = allActiveHabits.findIndex((h) => h.id === habit.id)

  const handleMoveUp = async () => {
    if (currentHabitIndex <= 0) return
    retroAudio.playCheck()
    try {
      await reorderHabit.mutateAsync({ habitId: habit.id, direction: 'up' })
    } catch {}
  }

  const handleMoveDown = async () => {
    if (currentHabitIndex < 0 || currentHabitIndex >= allActiveHabits.length - 1) return
    retroAudio.playCheck()
    try {
      await reorderHabit.mutateAsync({ habitId: habit.id, direction: 'down' })
    } catch {}
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('El nombre no puede estar vacío.')
      return
    }

    const finalCategory = isChallenge
      ? formatHabitCategory(category.trim() || 'General', targetDays)
      : (category.trim() || 'General')

    setErrorMsg('')
    try {
      await updateHabit.mutateAsync({
        id: habit.id,
        name: name.trim(),
        category: finalCategory,
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
                className="fixed inset-0 bg-[#28201A]/45 backdrop-blur-sm z-[9998]"
              />
            </Dialog.Overlay>

            {/* Modal Content */}
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto bg-[#FFFFFF] border border-[#EAE2D8] rounded-3xl p-6 shadow-[0_20px_60px_rgba(78,64,53,0.18)] z-[9999] focus:outline-none text-[#3D2E26] font-sans"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#EAE2D8] pb-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors shadow-xs"
                      style={{
                        backgroundColor: `${colorHex}15`,
                        borderColor: `${colorHex}40`,
                      }}
                    >
                      <Pencil size={16} style={{ color: colorHex }} />
                    </div>
                    <div>
                      <Dialog.Title className="font-mono text-base font-bold text-[#3D2E26] tracking-wide">
                        EDITAR HÁBITO
                      </Dialog.Title>
                      <Dialog.Description className="text-xs text-[#8C7A70]">
                        Modifica los parámetros de este objetivo
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

                {/* Confirm Delete State */}
                {showConfirmDelete ? (
                  <div className="space-y-4 py-2">
                    <div className="p-4 rounded-2xl bg-[#FFF0F3] border border-[#FFCCD5] flex items-start gap-3">
                      <AlertTriangle size={20} className="text-[#C93B58] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-mono text-xs font-bold text-[#C93B58]">
                          ¿Eliminar permanentemente "{habit.name}"?
                        </h4>
                        <p className="text-xs text-[#8C7A70] mt-1 leading-relaxed">
                          Esta acción eliminará el hábito y todo su historial de registros. Si prefieres conservar las estadísticas pasadas, considera archivar el hábito.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowConfirmDelete(false)}
                        className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-[#8C7A70] hover:text-[#3D2E26] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                      >
                        CANCELAR
                      </button>

                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleteHabit.isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C93B58] hover:bg-[#A82B44] text-white font-mono text-xs font-bold transition-all shadow-sm cursor-pointer"
                      >
                        <Trash2 size={14} />
                        <span>ELIMINAR DEFINITIVAMENTE</span>
                      </button>
                    </div>
                  </div>
                ) : showConfirmArchive ? (
                  <div className="space-y-4 py-2">
                    <div className="p-4 rounded-2xl bg-[#FFF8E6] border border-[#FFE08A] flex items-start gap-3">
                      <Archive size={20} className="text-[#B87A00] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-mono text-xs font-bold text-[#B87A00]">
                          ¿Archivar "{habit.name}"?
                        </h4>
                        <p className="text-xs text-[#8C7A70] mt-1 leading-relaxed">
                          Se ocultará de tu rutina activa diaria, pero <strong>todo tu historial, rachas y estadísticas pasadas se mantendrán intactos</strong>. Podrás restaurarlo en cualquier momento desde "Hábitos Archivados".
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowConfirmArchive(false)}
                        className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-[#8C7A70] hover:text-[#3D2E26] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                      >
                        CANCELAR
                      </button>

                      <button
                        type="button"
                        onClick={handleArchive}
                        disabled={archiveHabit.isPending}
                        className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-[#EFA93A] hover:bg-[#D99528] text-white font-mono text-xs font-bold transition-all shadow-sm cursor-pointer"
                      >
                        <Archive size={14} />
                        <span>{archiveHabit.isPending ? 'ARCHIVANDO...' : 'SÍ, ARCHIVAR HÁBITO'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Form */
                  <form onSubmit={handleUpdate} className="space-y-5">
                    {/* Error Banner */}
                    {errorMsg && (
                      <div className="px-3.5 py-2.5 rounded-xl bg-[#FFF0F3] border border-[#FFCCD5] text-[#C93B58] text-xs font-mono font-medium">
                        {errorMsg}
                      </div>
                    )}

                    {/* Habit Name Input */}
                    <div>
                      <label className="block font-mono text-xs font-semibold text-[#7A6A60] uppercase tracking-wider mb-2">
                        Nombre del hábito *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nombre..."
                        className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#EAE2D8] rounded-xl text-[#3D2E26] placeholder-[#A59990] text-sm focus:outline-none focus:border-[#F28574] focus:bg-[#FFFFFF] transition-all font-medium"
                        required
                      />
                    </div>

                    {/* Category Selector */}
                    <div>
                      <label className="block font-mono text-xs font-semibold text-[#7A6A60] uppercase tracking-wider mb-2">
                        Categoría
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {CATEGORY_PRESETS.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={cn(
                              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 border cursor-pointer',
                              category === cat
                                ? 'bg-[#FDF2ED] text-[#C95D47] border-[#F2C4AF] shadow-xs'
                                : 'bg-[#FAF7F2] text-[#7A6A60] border-[#EAE2D8] hover:bg-[#F5EFEB]',
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
                        className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#EAE2D8] rounded-xl text-[#3D2E26] placeholder-[#A59990] text-xs focus:outline-none focus:border-[#F28574] focus:bg-[#FFFFFF] transition-all"
                      />
                    </div>

                    {/* Habit Type: Infinite Routine vs Target Days Challenge */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block font-mono text-xs font-semibold text-[#7A6A60] uppercase tracking-wider">
                          Modalidad
                        </label>
                        <span className="text-[9px] font-mono font-bold text-[#C95D47] bg-[#FDF2ED] px-2 py-0.5 rounded-md border border-[#F2C4AF]">
                          {isChallenge ? 'RETO CON META' : 'RUTINA INFINITA'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => setIsChallenge(false)}
                          className={cn(
                            'p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer flex flex-col gap-0.5',
                            !isChallenge
                              ? 'bg-[#FDF2ED] border-[#F2C4AF] text-[#C95D47] shadow-xs ring-1 ring-[#F2C4AF]'
                              : 'bg-[#FAF7F2] border-[#EAE2D8] text-[#7A6A60] hover:bg-[#F2ECE4]',
                          )}
                        >
                          <span className="font-bold flex items-center gap-1.5">
                            <InfinityIcon size={14} className="text-[#F28574]" />
                            <span>Continuo</span>
                          </span>
                          <span className="text-[10px] text-[#8C7A70] leading-tight">Sin fecha límite, para siempre</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsChallenge(true)}
                          className={cn(
                            'p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer flex flex-col gap-0.5',
                            isChallenge
                              ? 'bg-[#FDF2ED] border-[#F2C4AF] text-[#C95D47] shadow-xs ring-1 ring-[#F2C4AF]'
                              : 'bg-[#FAF7F2] border-[#EAE2D8] text-[#7A6A60] hover:bg-[#F2ECE4]',
                          )}
                        >
                          <span className="font-bold flex items-center gap-1.5">
                            <Target size={14} className="text-[#F28574]" />
                            <span>Reto de Días</span>
                          </span>
                          <span className="text-[10px] text-[#8C7A70] leading-tight">Meta fija de días con trofeo</span>
                        </button>
                      </div>

                      {isChallenge && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-2xl bg-[#FFFDF9] border border-[#F2C4AF] space-y-2.5"
                        >
                          <span className="text-[11px] font-mono text-[#7A6A60] block font-semibold">
                            Meta de días para completar:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {[7, 14, 21, 30, 60, 90].map((days) => (
                              <button
                                key={days}
                                type="button"
                                onClick={() => setTargetDays(days)}
                                className={cn(
                                  'px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer',
                                  targetDays === days
                                    ? 'bg-[#F28574] text-white border-[#E07261] shadow-xs'
                                    : 'bg-[#FFFFFF] text-[#3D2E26] border-[#EAE2D8] hover:bg-[#FAF7F2]',
                                )}
                              >
                                {days} días
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs text-[#8C7A70]">O número personalizado:</span>
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={targetDays || ''}
                              onChange={(e) => setTargetDays(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-20 px-2.5 py-1 bg-[#FFFFFF] border border-[#EAE2D8] rounded-lg text-xs font-mono font-bold text-[#3D2E26] text-center focus:outline-none focus:border-[#F28574]"
                            />
                            <span className="text-xs font-mono text-[#8C7A70]">días</span>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Color Swatches */}
                    <div>
                      <label className="block font-mono text-xs font-semibold text-[#7A6A60] uppercase tracking-wider mb-2">
                        Color
                      </label>
                      <div className="grid grid-cols-8 gap-2">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setColorHex(c.hex)}
                            className={cn(
                              'w-full aspect-square rounded-xl flex items-center justify-center transition-transform duration-150 border cursor-pointer',
                              colorHex === c.hex
                                ? 'scale-110 border-[#3D2E26] shadow-md ring-2 ring-[#3D2E26]/20'
                                : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100',
                            )}
                            style={{
                              backgroundColor: c.hex,
                            }}
                            title={c.label}
                          >
                            {colorHex === c.hex && <Check size={14} className="text-white stroke-[3]" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Icon Grid */}
                    <div>
                      <label className="block font-mono text-xs font-semibold text-[#7A6A60] uppercase tracking-wider mb-2">
                        Icono
                      </label>
                      <div className="grid grid-cols-7 gap-2 max-h-36 overflow-y-auto p-2 bg-[#FAF7F2] border border-[#EAE2D8] rounded-2xl scrollbar-thin scrollbar-thumb-[#E5DCD3]">
                        {ICON_KEYS.map((key) => {
                          const IconComponent = ICON_MAP[key]
                          const isSelected = iconKey === key
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setIconKey(key)}
                              className={cn(
                                'p-2 rounded-xl flex items-center justify-center transition-all duration-150 border cursor-pointer',
                                isSelected
                                  ? 'border-[#F28574] bg-[#FFFFFF] text-[#C95D47] shadow-xs'
                                  : 'border-transparent text-[#8C7A70] hover:text-[#3D2E26] hover:bg-[#FFFFFF]',
                              )}
                            >
                              <IconComponent size={18} />
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Position in Routine (Reorder) */}
                    {allActiveHabits.length > 1 && (
                      <div>
                        <label className="block font-mono text-xs font-semibold text-[#7A6A60] uppercase tracking-wider mb-2">
                          Posición en tu rutina
                        </label>
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2] border border-[#EAE2D8]">
                          <span className="font-mono text-xs text-[#3D2E26] font-semibold">
                            Lugar #{currentHabitIndex >= 0 ? currentHabitIndex + 1 : 1} de {allActiveHabits.length}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={currentHabitIndex <= 0 || reorderHabit.isPending}
                              onClick={handleMoveUp}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#EAE2D8] hover:border-[#F28574] text-[#3D2E26] font-mono text-[11px] font-bold shadow-xs transition-all disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                              title="Subir de posición"
                            >
                              <ArrowUp size={13} className="text-[#F28574]" />
                              <span>Subir</span>
                            </button>

                            <button
                              type="button"
                              disabled={currentHabitIndex < 0 || currentHabitIndex >= allActiveHabits.length - 1 || reorderHabit.isPending}
                              onClick={handleMoveDown}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#EAE2D8] hover:border-[#F28574] text-[#3D2E26] font-mono text-[11px] font-bold shadow-xs transition-all disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                              title="Bajar de posición"
                            >
                              <ArrowDown size={13} className="text-[#F28574]" />
                              <span>Bajar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Preview Card */}
                    <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EAE2D8] flex items-center justify-between">
                      <span className="font-mono text-[11px] text-[#8C7A70] uppercase tracking-wider font-semibold">
                        VISTA PREVIA
                      </span>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center border shadow-xs"
                          style={{
                            backgroundColor: `${colorHex}15`,
                            borderColor: `${colorHex}40`,
                          }}
                        >
                          <PreviewIcon size={14} style={{ color: colorHex }} />
                        </div>
                        <span className="font-mono text-xs font-bold text-[#3D2E26]">
                          {name.trim() || 'Nombre del Hábito'}
                        </span>
                        <span
                          className="font-mono text-[10px] px-2 py-0.5 rounded-md border font-semibold"
                          style={{
                            backgroundColor: `${colorHex}15`,
                            color: colorHex,
                            borderColor: `${colorHex}30`,
                          }}
                        >
                          {category || 'General'}
                        </span>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#EAE2D8]">
                      {/* Archive & Delete secondary buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowConfirmArchive(true)}
                          className="p-2 rounded-xl text-[#8C7A70] hover:text-[#B87A00] hover:bg-[#FFF8E6] transition-colors cursor-pointer"
                          title="Archivar Hábito"
                        >
                          <Archive size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowConfirmDelete(true)}
                          className="p-2 rounded-xl text-[#8C7A70] hover:text-[#C93B58] hover:bg-[#FFF0F3] transition-colors cursor-pointer"
                          title="Eliminar Hábito"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Dialog.Close asChild>
                          <button
                            type="button"
                            className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-[#8C7A70] hover:text-[#3D2E26] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                          >
                            CANCELAR
                          </button>
                        </Dialog.Close>

                        <button
                          type="submit"
                          disabled={updateHabit.isPending}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F28574] to-[#E57865] hover:from-[#FA9585] hover:to-[#F28574] text-white font-mono text-xs font-bold tracking-wider transition-all shadow-[0_4px_14px_rgba(242,133,116,0.25)] active:scale-95 disabled:opacity-50 cursor-pointer"
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
