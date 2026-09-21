import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, FileText, Cloud } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Términos de Servicio — Kumo Habits',
  description: 'Términos y condiciones de uso de Kumo Habits.',
}

export default function TermsPage() {
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
                Términos de Servicio
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
              <FileText size={16} className="text-[#F28574]" />
              <span>1. Aceptación de los Términos</span>
            </h2>
            <p className="text-xs">
              Al utilizar <strong>Kumo Habits</strong>, aceptas estos Términos de Servicio. Kumo Habits es una aplicación diseñada para ayudarte a crear y mantener hábitos saludables de forma visual y motivadora.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-mono text-sm font-bold text-[#3D2E26]">
              2. Uso del Servicio
            </h2>
            <p className="text-xs">
              Te comprometes a utilizar el servicio de manera responsable y para tu seguimiento personal de actividades. Eres responsable de mantener la seguridad de tu cuenta de Google asociada.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-mono text-sm font-bold text-[#3D2E26]">
              3. Modificaciones y Contacto
            </h2>
            <p className="text-xs">
              Nos reservamos el derecho de actualizar la aplicación para mejorar su funcionamiento y rendimiento. Ante cualquier duda o comentario, puedes escribir a{' '}
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
