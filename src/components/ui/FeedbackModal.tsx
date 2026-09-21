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
            className="fixed bottom-5 right-4 sm:right-6 z-40 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-[#FFFFFF]/95 backdrop-blur-md hover:bg-[#FAF7F2] border border-[#EAE2D8] hover:border-[#F28574] text-[#3D2E26] text-[11px] sm:text-xs font-mono font-bold shadow-[0_4px_16px_rgba(78,64,53,0.12)] transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          >
            <MessageSquareHeart
              size={15}
              className="text-[#F28574] group-hover:rotate-12 transition-transform shrink-0"
            />
            <span>Feedback</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F28574] animate-pulse" />
          </button>
        )}
      </Dialog.Trigger>

      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-[#282321]/40 backdrop-blur-sm z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-md max-h-[85dvh] flex flex-col bg-[#FFFFFF] border border-[#EAE2D8] rounded-3xl p-5 sm:p-6 shadow-[0_16px_50px_rgba(78,64,53,0.18)] font-sans text-[#282321] focus:outline-none overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-start justify-between pb-3 mb-3 border-b border-[#EAE2D8] shrink-0">
                  <div className="pr-2">
                    <Dialog.Title className="text-sm sm:text-base font-bold flex items-center gap-2 text-[#282321]">
                      <MessageSquareHeart size={18} className="text-[#F28574] shrink-0" />
                      <span>Sugerencias & Feedback</span>
                    </Dialog.Title>
                    <Dialog.Description className="text-[11px] sm:text-xs text-[#6B605B] mt-0.5 leading-relaxed">
                      Tu opinión me ayuda a mejorar Kumo Habits. Llega directo a mi Telegram.
                    </Dialog.Description>
                  </div>

                  <Dialog.Close asChild>
                    <button
                      className="p-1.5 rounded-xl text-[#9E928C] hover:text-[#282321] hover:bg-[#FAF7F2] transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
                      aria-label="Cerrar"
                    >
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>

                {submitted ? (
                  /* Success State */
                  <div className="py-6 sm:py-8 text-center flex flex-col items-center overflow-y-auto">
                    <div className="w-14 h-14 rounded-2xl bg-[#FDF2ED] border border-[#F28574]/30 flex items-center justify-center mb-4 text-[#F28574]">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-sm font-bold text-[#282321] mb-1">
                      ¡Mensaje enviado con éxito!
                    </h3>
                    <p className="text-xs text-[#6B605B] max-w-xs mb-6">
                      Muchísimas gracias por tu aporte. Lo revisaré de inmediato en Telegram.
                    </p>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="px-5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F5EFEB] border border-[#EAE2D8] text-xs font-bold text-[#282321] transition-colors cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                ) : (
                  /* Form State */
                  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5 overflow-y-auto pr-1 pb-1 scrollbar-thin">
                    {/* Feedback Type Selector */}
                    <div>
                      <label className="block text-[10px] sm:text-[11px] font-bold text-[#6B605B] uppercase tracking-wider mb-1.5">
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
                            'flex flex-col items-center justify-center gap-1 p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer',
                            type === 'idea'
                              ? 'bg-[#EBF7F1] border-[#4EBA88] text-[#246348] font-bold shadow-sm'
                              : 'bg-[#FAF7F2] border-[#EAE2D8] text-[#6B605B] hover:text-[#282321]',
                          )}
                        >
                          <Lightbulb size={15} />
                          <span className="text-[10px]">Idea</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            retroAudio.playCheck()
                            setType('bug')
                          }}
                          className={cn(
                            'flex flex-col items-center justify-center gap-1 p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer',
                            type === 'bug'
                              ? 'bg-[#FDF0F2] border-[#F2728C] text-[#A62742] font-bold shadow-sm'
                              : 'bg-[#FAF7F2] border-[#EAE2D8] text-[#6B605B] hover:text-[#282321]',
                          )}
                        >
                          <Bug size={15} />
                          <span className="text-[10px]">Error</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            retroAudio.playCheck()
                            setType('opinion')
                          }}
                          className={cn(
                            'flex flex-col items-center justify-center gap-1 p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer',
                            type === 'opinion'
                              ? 'bg-[#F0F7FA] border-[#56B4D3] text-[#206D85] font-bold shadow-sm'
                              : 'bg-[#FAF7F2] border-[#EAE2D8] text-[#6B605B] hover:text-[#282321]',
                          )}
                        >
                          <MessageCircle size={15} />
                          <span className="text-[10px]">Opinión</span>
                        </button>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] sm:text-[11px] font-bold text-[#6B605B] uppercase tracking-wider">
                          ¿Qué tal la experiencia?
                        </label>
                        <span className="text-[11px] font-mono text-[#EFA93A] font-bold">
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
                            className="p-1 rounded transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                          >
                            <Star
                              size={20}
                              className={cn(
                                'transition-colors',
                                star <= rating
                                  ? 'fill-[#EFA93A] text-[#EFA93A]'
                                  : 'text-[#DFD5CA]',
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message Area */}
                    <div>
                      <label className="block text-[10px] sm:text-[11px] font-bold text-[#6B605B] uppercase tracking-wider mb-1">
                        Tu Mensaje
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Escribe aquí cualquier sugerencia, qué te gustaría ver, o qué podemos mejorar..."
                        className="w-full bg-[#FAF7F2] border border-[#EAE2D8] focus:border-[#F28574] focus:bg-[#FFFFFF] rounded-2xl p-3 text-sm sm:text-xs text-[#282321] placeholder-[#A59990] focus:outline-none transition-all resize-none leading-relaxed"
                      />
                    </div>

                    {/* Optional Contact Email */}
                    <div>
                      <label className="block text-[10px] sm:text-[11px] font-bold text-[#6B605B] uppercase tracking-wider mb-1">
                        Tu correo o apodo <span className="text-[#9E928C] lowercase font-normal">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ejemplo@correo.com o tu apodo"
                        className="w-full bg-[#FAF7F2] border border-[#EAE2D8] focus:border-[#F28574] focus:bg-[#FFFFFF] rounded-2xl px-3.5 py-2 text-sm sm:text-xs text-[#282321] placeholder-[#A59990] focus:outline-none transition-all"
                      />
                    </div>

                    {errorMsg && (
                      <p className="text-xs text-[#F2728C] font-semibold">{errorMsg}</p>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#F28574] to-[#E57865] hover:from-[#FA9585] hover:to-[#F28574] text-white font-bold py-3 sm:py-3.5 px-4 rounded-2xl shadow-[0_6px_20px_rgba(242,133,116,0.28)] hover:shadow-[0_8px_24px_rgba(242,133,116,0.38)] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 active:scale-[0.99]"
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
