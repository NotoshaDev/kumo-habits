import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Eye, Cloud } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Privacidad — Kumo Habits',
  description: 'Política de privacidad y protección de datos de Kumo Habits.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#3D2E26] py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-[#8C7A70] hover:text-[#C95D47] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Volver a Kumo Habits</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F28574]/20 to-[#EFA93A]/20 border border-[#F2C4AF] flex items-center justify-center">
              <Cloud className="w-5 h-5 text-[#C95D47]" />
            </div>
            <div>
              <h1 className="font-mono text-xl sm:text-2xl font-bold text-[#3D2E26]">
                Política de Privacidad
              </h1>
              <p className="text-xs text-[#8C7A70] mt-0.5 font-mono">
                Última actualización: Septiembre 2026
              </p>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-[#FFFFFF] border border-[#EAE2D8] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 text-sm leading-relaxed text-[#5A4D45]">
          <section className="space-y-2">
            <h2 className="font-mono text-sm font-bold text-[#3D2E26] flex items-center gap-2">
              <Shield size={16} className="text-[#F28574]" />
              <span>1. Información que recopilamos</span>
            </h2>
            <p>
              En <strong>Kumo Habits</strong> valoramos profundamente tu privacidad. Solo recopilamos la información estrictamente necesaria para brindarte el servicio de seguimiento de hábitos:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Información de cuenta básica:</strong> Cuando inicias sesión con Google, recibimos tu nombre y dirección de correo electrónico para identificar tu cuenta.</li>
              <li><strong>Datos de uso de la app:</strong> Los hábitos, fechas de cumplimiento, rachas, nivel y metas mensuales que tú mismo registras en la plataforma.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-mono text-sm font-bold text-[#3D2E26] flex items-center gap-2">
              <Lock size={16} className="text-[#4EBA88]" />
              <span>2. Uso de la información</span>
            </h2>
            <p>
              Utilizamos tus datos únicamente para:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Permitirte iniciar sesión de forma segura y sincronizar tus hábitos entre tus dispositivos (computadora y teléfono móvil).</li>
              <li>Calcular tus estadísticas de progreso, rachas y niveles de gamificación.</li>
              <li>Enviarte recordatorios si tú mismo decides activarlos voluntariamente.</li>
            </ul>
            <p className="text-xs font-semibold text-[#3D2E26] mt-2">
              Nunca vendemos ni compartimos tus datos personales con terceros ni los utilizamos para fines publicitarios.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-mono text-sm font-bold text-[#3D2E26] flex items-center gap-2">
              <Eye size={16} className="text-[#EFA93A]" />
              <span>3. Seguridad y Almacenamiento</span>
            </h2>
            <p className="text-xs">
              Tus datos se almacenan de manera segura y cifrada utilizando la infraestructura de Supabase y estándares de autenticación modernos (OAuth 2.0).
            </p>
          </section>

          <section className="space-y-2 border-t border-[#EAE2D8] pt-4">
            <h2 className="font-mono text-sm font-bold text-[#3D2E26]">
              4. Contacto y Eliminación de Datos
            </h2>
            <p className="text-xs">
              Si deseas consultar, modificar o eliminar tu cuenta y todos tus datos registrados en Kumo Habits, puedes escribirnos a{' '}
              <a href="mailto:gussvillarroel@gmail.com" className="text-[#C95D47] underline font-mono">
                gussvillarroel@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
