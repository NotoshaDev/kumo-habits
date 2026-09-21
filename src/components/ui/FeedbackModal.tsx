'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquareHeart, X, Send, CheckCircle2, Loader2, Star, Lightbulb, Bug, MessageCircle } from 'lucide-react'
import { retroAudio } from '@/lib/sound-effects'
import { cn } from '@/lib/utils'

interface FeedbackModalProps {
  trigger?: React.ReactNode
}

type FeedbackType = 'idea' | 'bug' | 'opinion'

export function FeedbackModal({ trigger }: FeedbackModalProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>('idea')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [rating, setRating] = useState(5)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      retroAudio.playCheck()
      setSubmitted(false)
      setErrorMsg('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) {
      setErrorMsg('Por favor escribe tu comentario o sugerencia.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message: message.trim(),
          userEmail: email.trim() || undefined,
          rating,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al enviar feedback')
      }

      retroAudio.playLevelUp()
      setSubmitted(true)
      setMessage('')
    } catch (err: any) {
      retroAudio.playUncheck()
      setErrorMsg(err.message || 'Ocurrió un error al enviar el mensaje.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#10121A]/95 hover:bg-[#161926] border border-[#1E2230] hover:border-[#10B981]/50 text-slate-200 text-xs font-mono font-semibold shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          >
            <MessageSquareHeart
              size={15}
              className="text-[#10B981] group-hover:rotate-12 transition-transform"
            />
            <span>Feedback</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          </button>
        )}
      </Dialog.Trigger>

      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[#10121A] border border-[#1E2230] rounded-2xl p-6 shadow-2xl font-mono text-slate-100 selection:bg-[#10B981] selection:text-black"
                initial={{ opacity: 0, scale: 0.94, y: '-48%' }}
                animate={{ opacity: 1, scale: 1, y: '-50%' }}
                exit={{ opacity: 0, scale: 0.94, y: '-48%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Dialog.Title className="text-base font-bold flex items-center gap-2 text-slate-100">
                      <MessageSquareHeart size={18} className="text-[#10B981]" />
                      <span>Sugerencias & Feedback</span>
                    </Dialog.Title>
                    <Dialog.Description className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Tu opinión me ayuda a mejorar Kumo Habits. Llega directo a mi Telegram.
                    </Dialog.Description>
                  </div>

                  <Dialog.Close asChild>
                    <button
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#1E2230] transition-colors cursor-pointer"
                      aria-label="Cerrar"
                    >
                      <X size={16} />
                    </button>
                  </Dialog.Close>
                </div>

                {submitted ? (
                  /* Success State */
                  <div className="py-8 text-center flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center mb-4 text-[#10B981]">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-100 mb-1">
                      ¡Mensaje enviado con éxito!
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs mb-6">
                      Muchísimas gracias por tu aporte. Lo revisaré de inmediato en Telegram.
                    </p>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="px-5 py-2 rounded-lg bg-[#1E2230] hover:bg-[#2E3450] text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                ) : (
                  /* Form State */
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Feedback Type Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Tipo de comentario
                      </label>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            retroAudio.playCheck()
                            setType('idea')
                          }}
                          className={cn(
                            'flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg border transition-all cursor-pointer',
                            type === 'idea'
                              ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.15)] font-bold'
                              : 'bg-[#08090C] border-[#1E2230] text-slate-400 hover:text-slate-200',
                          )}
                        >
                          <Lightbulb size={16} />
                          <span className="text-[10px]">Idea</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            retroAudio.playCheck()
                            setType('bug')
                          }}
                          className={cn(
                            'flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg border transition-all cursor-pointer',
                            type === 'bug'
                              ? 'bg-[#F43F5E]/15 border-[#F43F5E] text-[#F43F5E] shadow-[0_0_10px_rgba(244,63,94,0.15)] font-bold'
                              : 'bg-[#08090C] border-[#1E2230] text-slate-400 hover:text-slate-200',
                          )}
                        >
                          <Bug size={16} />
                          <span className="text-[10px]">Bug / Error</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            retroAudio.playCheck()
                            setType('opinion')
                          }}
                          className={cn(
                            'flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg border transition-all cursor-pointer',
                            type === 'opinion'
                              ? 'bg-[#38BDF8]/15 border-[#38BDF8] text-[#38BDF8] shadow-[0_0_10px_rgba(56,189,248,0.15)] font-bold'
                              : 'bg-[#08090C] border-[#1E2230] text-slate-400 hover:text-slate-200',
                          )}
                        >
                          <MessageCircle size={16} />
                          <span className="text-[10px]">Opinión</span>
                        </button>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                          ¿Qué tal la experiencia?
                        </label>
                        <span className="text-[11px] font-mono text-amber-400 font-bold">
                          {rating} / 5
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => {
                              retroAudio.playCheck()
                              setRating(star)
                            }}
                            className="p-1 rounded transition-transform hover:scale-110 cursor-pointer"
                          >
                            <Star
                              size={20}
                              className={cn(
                                'transition-colors',
                                star <= rating
                                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]'
                                  : 'text-slate-600',
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message Area */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Tu Mensaje
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Escribe aquí cualquier sugerencia, qué te gustaría ver, o qué podemos mejorar..."
                        className="w-full bg-[#08090C] border border-[#1E2230] focus:border-[#10B981] rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors resize-none leading-relaxed"
                      />
                    </div>

                    {/* Optional Contact Email */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Tu correo o nombre <span className="text-slate-500 lowercase">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ejemplo@correo.com o tu apodo"
                        className="w-full bg-[#08090C] border border-[#1E2230] focus:border-[#10B981] rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                      />
                    </div>

                    {errorMsg && (
                      <p className="text-xs text-rose-400 font-semibold">{errorMsg}</p>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#34D399] hover:to-[#10B981] text-slate-950 font-bold py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>ENVIANDO...</span>
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>ENVIAR SUGERENCIA</span>
                        </>
                      )}
                    </button>
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
