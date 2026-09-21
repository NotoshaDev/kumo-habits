'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getNotificationSettings,
  saveNotificationSettings,
  showKumoNotification,
  scheduleTestNotification,
  type NotificationSettings,
} from '@/lib/notifications'
import { getTodayString } from '@/lib/date-utils'
import type { HabitRow, HabitLogRow } from '@/types/database'

export function useNotificationReminder(habits?: HabitRow[], logs?: HabitLogRow[]) {
  const [isSupported, setIsSupported] = useState<boolean>(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings)
  const [isTesting, setIsTesting] = useState<boolean>(false)

  // Initialize browser support and permission
  useEffect(() => {
    setIsSupported(isNotificationSupported())
    setPermission(getNotificationPermission())
    setSettings(getNotificationSettings())
  }, [])

  // Update specific settings
  const updateSettings = useCallback((updates: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates }
      saveNotificationSettings(next)
      return next
    })
  }, [])

  // Request permission and turn on
  const enableNotifications = useCallback(async () => {
    const granted = await requestNotificationPermission()
    setPermission(granted)
    if (granted === 'granted') {
      updateSettings({ enabled: true })
      return true
    }
    return false
  }, [updateSettings])

  // Turn off
  const disableNotifications = useCallback(() => {
    updateSettings({ enabled: false })
  }, [updateSettings])

  // Trigger test notification
  const triggerTestNotification = useCallback(async (delaySeconds = 3) => {
    if (permission !== 'granted') {
      const granted = await requestNotificationPermission()
      setPermission(granted)
      if (granted !== 'granted') return false
    }

    setIsTesting(true)
    const success = await scheduleTestNotification(delaySeconds)
    setIsTesting(false)
    return success
  }, [permission])

  // Background reminder scheduler check
  useEffect(() => {
    if (!settings.enabled || permission !== 'granted' || !habits) return

    const checkReminder = () => {
      const today = getTodayString()
      if (settings.lastNotifiedDate === today) {
        return // Already notified today
      }

      const now = new Date()
      const [targetHour, targetMinute] = settings.time.split(':').map(Number)
      if (isNaN(targetHour) || isNaN(targetMinute)) return

      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      const targetMinutes = targetHour * 60 + targetMinute

      // If we have reached or passed the target reminder time today
      if (currentMinutes >= targetMinutes) {
        // Calculate pending habits today
        const completedIds = new Set(
          (logs ?? [])
            .filter((l) => l.date === today && l.completed)
            .map((l) => l.habit_id),
        )
        const pendingCount = habits.filter((h) => !completedIds.has(h.id)).length

        if (settings.smartOnlyPending) {
          if (pendingCount > 0) {
            showKumoNotification('☁️ Kumo Habits: ¡Recordatorio Diario!', {
              body: `Tienes ${pendingCount} hábito${pendingCount > 1 ? 's' : ''} pendiente${pendingCount > 1 ? 's' : ''} hoy. ¡Cierra tu día con calma y mantén tu racha! ☕✨`,
              tag: 'kumo-daily-reminder',
            })
          }
          // Mark as notified so we don't repeat today, even if completed
          updateSettings({ lastNotifiedDate: today })
        } else {
          // Always notify
          showKumoNotification('☁️ Kumo Habits: ¡Momento de tus hábitos!', {
            body: pendingCount > 0
              ? `Tienes ${pendingCount} hábitos pendientes hoy. ¡A por ellos! 🌱`
              : '¡Increíble! Ya completaste todos tus hábitos de hoy. ¡Descansa tranquilo! 🎉',
            tag: 'kumo-daily-reminder',
          })
          updateSettings({ lastNotifiedDate: today })
        }
      }
    }

    // Check immediately on mount/data change
    checkReminder()

    // And check every 60 seconds
    const interval = setInterval(checkReminder, 60 * 1000)
    return () => clearInterval(interval)
  }, [settings, permission, habits, logs, updateSettings])

  return {
    isSupported,
    permission,
    settings,
    isTesting,
    updateSettings,
    enableNotifications,
    disableNotifications,
    triggerTestNotification,
  }
}
