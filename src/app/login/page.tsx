'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, ShieldAlert, CheckCircle2, KeyRound, UserPlus, Loader2, Info, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { retroAudio } from '@/lib/sound-effects'

export default function LoginPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Redirect to dashboard immediately if already authenticated
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        router.replace('/dashboard')
      } else {
        setCheckingAuth(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        router.replace('/dashboard')
      }
    })

    // Handle bfcache (when user presses back button in mobile browser)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user) {
            router.replace('/dashboard')
          }
        })
      }
    }
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [router])

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    retroAudio.playCheck()
    setLoading(true)
    setMessage(null)

    const supabase = createClient()

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
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
        retroAudio.playLevelUp()
        setMessage({
          type: 'success',
          text: '¡Cuenta creada con éxito!',
        })
        if (data?.session) {
          router.replace('/dashboard')
        }
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
        router.replace('/dashboard')
      }
    }
  }

  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleAuth = async () => {
    retroAudio.playCheck()
    setGoogleLoading(true)
    setMessage(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      retroAudio.playUncheck()
      setMessage({ type: 'error', text: error.message })
      setGoogleLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#282321] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F28574]/20 to-[#EFA93A]/20 border border-[#EAE2D8] flex items-center justify-center shadow-xs">
            <Loader2 className="w-5 h-5 animate-spin text-[#F28574]" />
          </div>
          <span className="text-xs font-mono text-[#8C7A70] tracking-wider uppercase">Cargando Kumo Habits...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#282321] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-[#4EBA88]/25 selection:text-[#282321]">
      {/* Soft Cake & Bakery Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#98D8AA]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#F7A8B8]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-72 h-72 bg-[#FFEAA7]/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#FFFFFF] border border-[#EAE2D8] rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(78,64,53,0.08)] relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          {/* Logo lockup */}
          <div className="flex items-center justify-center gap-2.5 mb-3">
            {/* Cute cloud icon with bakery gradient */}
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-[#4EBA88]/15 via-[#F2728C]/15 to-[#FFEAA7]/20 border border-[#EAE2D8] shadow-[0_4px_12px_rgba(78,64,53,0.06)]">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6.5 19C4 19 2 17 2 14.5C2 12.3 3.6 10.5 5.7 10.1C5.3 9.4 5 8.5 5 7.5C5 4.5 7.5 2 10.5 2C13 2 15.1 3.6 15.8 5.9C16.2 5.6 16.8 5.5 17.5 5.5C19.4 5.5 21 7.1 21 9C21 9.3 20.9 9.6 20.8 9.9C22.1 10.5 23 11.8 23 13.5C23 15.9 21 18 18.5 18L6.5 19Z"
                  fill="url(#cloud-cake-grad)"
                />
                <defs>
                  <linearGradient id="cloud-cake-grad" x1="2" y1="2" x2="23" y2="19" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4EBA88" />
                    <stop offset="100%" stopColor="#F2728C" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Wordmark */}
            <div className="text-left">
              <h1 className="text-2xl font-extrabold leading-none tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4EBA88] via-[#F2728C] to-[#EFA93A]">
                  Kumo
                </span>
                <span className="text-[#282321]"> Habits</span>
              </h1>
              <p className="text-[10px] text-[#9E928C] font-mono tracking-[0.2em] leading-none mt-0.5 uppercase font-semibold">
                by NotoshaDev
              </p>
            </div>
          </div>

          <p className="text-xs text-[#6B605B] mt-2 font-sans leading-relaxed max-w-sm mx-auto">
            Esto es una prueba piloto, cualquier sugerencia o mejora me ayudaria mucho!
          </p>
        </div>

        {/* Feedback Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mb-5 p-3 rounded-2xl border text-xs flex items-center gap-2.5 ${
              message.type === 'success'
                ? 'bg-[#EBF7F1] border-[#4EBA88]/40 text-[#246348]'
                : 'bg-[#FDF0F2] border-[#F2728C]/40 text-[#A62742]'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#4EBA88] shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-[#F2728C] shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </motion.div>
        )}

        {/* Mode Selector Toggle */}
        <div className="grid grid-cols-2 p-1 bg-[#F5EFEB] rounded-2xl border border-[#EAE2D8] mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              retroAudio.playCheck()
              setIsSignUp(false)
              setMessage(null)
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              !isSignUp
                ? 'bg-[#FFFFFF] text-[#282321] shadow-sm font-bold border border-[#EAE2D8]'
                : 'text-[#6B605B] hover:text-[#282321]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-[#4EBA88]" />
            <span>Iniciar Sesión</span>
          </button>
          <button
            type="button"
            onClick={() => {
              retroAudio.playCheck()
              setIsSignUp(true)
              setMessage(null)
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              isSignUp
                ? 'bg-[#FFFFFF] text-[#282321] shadow-sm font-bold border border-[#EAE2D8]'
                : 'text-[#6B605B] hover:text-[#282321]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-[#F2728C]" />
            <span>Crear Cuenta</span>
          </button>
        </div>

        {/* Google 1-Click Auth Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={googleLoading || loading}
          className="w-full mb-5 flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-[#EAE2D8] bg-[#FFFFFF] hover:bg-[#FAF7F2] hover:border-[#DFD5CA] text-[#282321] font-bold text-xs shadow-xs hover:shadow-sm transition-all duration-150 active:scale-98 cursor-pointer disabled:opacity-60"
        >
          {googleLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#F28574]" />
              <span>CONECTANDO CON GOOGLE...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
              </svg>
              <span>CONTINUAR CON GOOGLE</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#EAE2D8]" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-[#FFFFFF] px-3 text-[#9E928C] font-semibold tracking-widest font-mono">
              O CON TU CORREO
            </span>
          </div>
        </div>

        {/* Main Password Form */}
        <form onSubmit={handlePasswordAuth} className="space-y-4">
          <div>
            <label className="block text-xs text-[#6B605B] mb-1.5 font-bold uppercase tracking-wider">
              CORREO ELECTRÓNICO
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#9E928C] absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-[#FAF7F2] border border-[#EAE2D8] focus:border-[#4EBA88] focus:bg-[#FFFFFF] rounded-2xl pl-10 pr-3 py-2.5 text-xs text-[#282321] placeholder-[#A59990] focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#6B605B] mb-1.5 font-bold uppercase tracking-wider">
              CONTRASEÑA
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9E928C] absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#FAF7F2] border border-[#EAE2D8] focus:border-[#4EBA88] focus:bg-[#FFFFFF] rounded-2xl pl-10 pr-3 py-2.5 text-xs text-[#282321] placeholder-[#A59990] focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-gradient-to-r from-[#4EBA88] to-[#3D996E] hover:from-[#5BC996] hover:to-[#4EBA88] text-white font-bold py-3.5 px-4 rounded-2xl shadow-[0_6px_20px_rgba(78,186,136,0.28)] hover:shadow-[0_8px_24px_rgba(78,186,136,0.38)] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isSignUp ? 'CREANDO CUENTA...' : 'VERIFICANDO...'}</span>
              </>
            ) : (
              <>
                {isSignUp ? <UserPlus className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
                <span>{isSignUp ? 'CREAR CUENTA' : 'INICIAR SESIÓN'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-[#EAE2D8] flex items-center justify-between text-[10px] text-[#9E928C]">
          <span className="font-mono">Kumo Habits v1.0</span>
          <div className="flex items-center gap-3">
            <a href="/privacy" className="hover:text-[#3D2E26] underline transition-colors">Privacidad</a>
            <a href="/terms" className="hover:text-[#3D2E26] underline transition-colors">Términos</a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
