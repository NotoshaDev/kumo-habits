import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { type, message, userEmail, rating } = await request.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'El mensaje no puede estar vacío.' },
        { status: 400 }
      )
    }

    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!token || !chatId) {
      console.error('Telegram credentials missing in environment variables.')
      return NextResponse.json(
        { error: 'Servicio de notificaciones no configurado.' },
        { status: 500 }
      )
    }

    const typeLabels: Record<string, string> = {
      idea: 'Sugerencia / Idea',
      bug: 'Reporte de Error',
      opinion: 'Opinión General',
    }
    const typeLabel = typeLabels[type] || 'Comentario'

    const stars = rating && rating > 0
      ? `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)`
      : 'Sin calificación'

    // Escape special markdown characters for Telegram Legacy Markdown or clean text
    const cleanMessage = message.trim().replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')
    const cleanEmail = (userEmail || 'Usuario anónimo').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')

    const now = new Date().toLocaleString('es-ES', {
      timeZone: 'America/Santiago', // Chile / Andean time zone or local
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const text = `*Kumo Habits — Nuevo Feedback*
━━━━━━━━━━━━━━━━━━━━
*Tipo:* ${typeLabel}
*Usuario:* ${cleanEmail}
*Valoración:* ${stars}

*Mensaje:*
${cleanMessage}
━━━━━━━━━━━━━━━━━━━━
*Fecha:* ${now}`

    const telegramRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'MarkdownV2',
      }),
    })

    const telegramData = await telegramRes.json()

    if (!telegramRes.ok || !telegramData.ok) {
      console.error('Telegram API error:', telegramData)
      // Fallback without Markdown if markdown escaping failed
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `[Kumo Habits] Nuevo Feedback:\n\nTipo: ${typeLabel}\nUsuario: ${userEmail || 'Anónimo'}\nValoración: ${stars}\n\nMensaje:\n${message.trim()}`,
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error handling feedback:', error)
    return NextResponse.json(
      { error: 'No se pudo enviar el feedback.' },
      { status: 500 }
    )
  }
}
