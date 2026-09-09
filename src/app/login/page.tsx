'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Zap, ShieldAlert, CheckCircle2, Terminal, Play, Wand2, KeyRound, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { retroAudio } from '@/lib/sound-effects'

export default function LoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'magic' | 'password'>('magic')
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-ref')

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    retroAudio.playCheck()
    setLoading(true)
    setMessage(null)

    if (isMock) {
      setTimeout(() => {
        setMessage({
          type: 'success',
          text: 'Modo Demo Activo: Redirigiendo al Centro de Comando...',
        })
        setLoading(false)
        setTimeout(() => router.push('/dashboard'), 1000)
      }, 600)
      return
    }

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback`

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    })

    setLoading(false)

    if (error) {
      retroAudio.playUncheck()
      setMessage({ type: 'error', text: error.message })
    } else {
      retroAudio.playAchievement()
      setMessage({
        type: 'success',
        text: '¡Enlace Mágico enviado! Revisa tu bandeja de entrada para ingresar.',
      })
    }
  }

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    retroAudio.playCheck()
    setLoading(true)
    setMessage(null)

    if (isMock) {
      setTimeout(() => {
        setMessage({
          type: 'success',
          text: 'Modo Demo Activo: Autenticado como jugador de pruebas.',
        })
        setLoading(false)
        setTimeout(() => router.push('/dashboard'), 1000)
      }, 600)
      return
    }

    const supabase = createClient()

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      setLoading(false)

      if (error) {
        retroAudio.playUncheck()
        setMessage({ type: 'error', text: error.message })
      } else {
        retroAudio.playAchievement()
        setMessage({
          type: 'success',
          text: '¡Cuenta creada! Si se requiere confirmación, revisa tu correo.',
        })
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      setLoading(false)

      if (error) {
        retroAudio.playUncheck()
        setMessage({ type: 'error', text: error.message })
      } else {
        retroAudio.playLevelUp()
        router.push('/dashboard')
      }
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    retroAudio.playCheck()
    if (isMock) {
      setMessage({
        type: 'success',
        text: `Modo Demo: Simulando inicio de sesión con ${provider.toUpperCase()}...`,
      })
      setTimeout(() => router.push('/dashboard'), 800)
      return
    }

    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const handleBypassDemo = () => {
    retroAudio.playCheck()
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#08090C] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-mono selection:bg-[#10B981] selection:text-black">
      {/* Retro Arcade Grid & Ambient Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E223015_1px,transparent_1px),linear-gradient(to_bottom,#1E223015_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#3B82F6]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-[#10121A]/90 border border-[#1E2230] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          {/* Logo lockup */}
          <div className="flex items-center justify-center gap-2.5 mb-3">
            {/* Pixel cloud icon — the "Kumo" (雲) */}
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981]/20 to-[#38BDF8]/10 border border-[#10B981]/40 shadow-[0_0_16px_rgba(16,185,129,0.25)]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6.5 19C4 19 2 17 2 14.5C2 12.3 3.6 10.5 5.7 10.1C5.3 9.4 5 8.5 5 7.5C5 4.5 7.5 2 10.5 2C13 2 15.1 3.6 15.8 5.9C16.2 5.6 16.8 5.5 17.5 5.5C19.4 5.5 21 7.1 21 9C21 9.3 20.9 9.6 20.8 9.9C22.1 10.5 23 11.8 23 13.5C23 15.9 21 18 18.5 18L6.5 19Z"
                  fill="url(#cloud-grad)"
                  opacity="0.9"
                />
                <defs>
                  <linearGradient id="cloud-grad" x1="2" y1="2" x2="23" y2="19" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#38BDF8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Wordmark */}
            <div className="text-left">
              <h1 className="text-xl sm:text-2xl font-extrabold leading-none tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#38BDF8]">Kumo</span>
                <span className="text-slate-100"> Habits</span>
              </h1>
              <p className="text-[9px] text-slate-500 font-mono tracking-[0.2em] leading-none mt-0.5 uppercase">
                by NotoshaDev
              </p>
            </div>
          </div>

          {/* System badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/8 border border-[#10B981]/20 text-[#10B981]/80 text-[10px] font-mono mb-2 tracking-widest">
            <Terminal className="w-2.5 h-2.5" />
            <span>ACCESO AL SISTEMA // v1.0</span>
          </div>

          <p className="text-[11px] text-slate-400 mt-1">
            Ingresa tus credenciales para sincronizar tu matriz de disciplina.
          </p>
        </div>

        {/* System Mode Notice */}
        {isMock && (
          <div className="mb-5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Modo Demo Local:</span> Supabase no está enlazado todavía. Puedes probar el acceso rápido o ingresar en modo invitado.
            </div>
          </div>
        )}

        {/* Feedback Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mb-5 p-3 rounded-lg border text-xs flex items-center gap-2.5 ${
              message.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </motion.div>
        )}

        {/* Login Method Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#08090C] rounded-lg border border-[#1E2230] mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              retroAudio.playCheck()
              setActiveTab('magic')
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'magic'
                ? 'bg-[#1E2230] text-[#10B981] shadow-sm font-bold shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Enlace Mágico</span>
          </button>
          <button
            type="button"
            onClick={() => {
              retroAudio.playCheck()
              setActiveTab('password')
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'password'
                ? 'bg-[#1E2230] text-[#38BDF8] shadow-sm font-bold shadow-[0_0_8px_rgba(56,189,248,0.15)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Contraseña</span>
          </button>
        </div>

        {/* Tab 1: Magic Link Form */}
        {activeTab === 'magic' && (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1.5 font-bold uppercase tracking-wider">
                CORREO ELECTRÓNICO
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cyberpunk@habitpixel.app"
                  className="w-full bg-[#08090C] border border-[#1E2230] focus:border-[#10B981] rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#34D399] hover:to-[#10B981] text-slate-950 font-extrabold py-3 px-4 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PROCESANDO...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>ENVIAR ENLACE MÁGICO</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 2: Password Form */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordAuth} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1.5 font-bold uppercase tracking-wider">
                CORREO ELECTRÓNICO
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cyberpunk@habitpixel.app"
                  className="w-full bg-[#08090C] border border-[#1E2230] focus:border-[#38BDF8] rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1.5 font-bold uppercase tracking-wider">
                CONTRASEÑA
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#08090C] border border-[#1E2230] focus:border-[#38BDF8] rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[#38BDF8] hover:underline cursor-pointer"
              >
                {isSignUp ? '¿Ya tienes cuenta? Iniciar Sesión' : '¿Nuevo jugador? Registrarse'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#38BDF8] to-[#0284C7] hover:from-[#7DD3FC] hover:to-[#38BDF8] text-slate-950 font-extrabold py-3 px-4 rounded-lg shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>VERIFICANDO...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{isSignUp ? 'CREAR CUENTA CYBER' : 'INICIAR SESIÓN'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#1E2230]" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-[#10121A] px-3 text-slate-400 font-semibold tracking-widest">
              O ACCEDE CON SOCIAL
            </span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => handleOAuthLogin('github')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#141724] border border-[#23283B] hover:border-slate-500 hover:bg-[#1A1F30] text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current text-slate-300" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>GitHub</span>
          </button>
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#141724] border border-[#23283B] hover:border-slate-500 hover:bg-[#1A1F30] text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
              />
            </svg>
            <span>Google</span>
          </button>
        </div>

        {/* Demo Mode Action */}
        <button
          type="button"
          onClick={handleBypassDemo}
          className="w-full py-2.5 px-4 rounded-lg bg-[#141724]/60 border border-[#23283B] hover:border-[#10B981]/50 hover:bg-[#10B981]/10 text-slate-300 hover:text-[#10B981] transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer group"
        >
          <Play className="w-3.5 h-3.5 fill-current group-hover:translate-x-0.5 transition-transform" />
          <span>CONTINUAR EN MODO DEMO (OFFLINE)</span>
        </button>
      </motion.div>
    </div>
  )
}
