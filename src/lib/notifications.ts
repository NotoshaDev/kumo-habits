// Kumo Habits — Web Notifications Engine
// Supports Local Notifications & PWA Web Push via Service Worker

export interface NotificationSettings {
  enabled: boolean
  time: string // "HH:mm", e.g. "20:30"
  smartOnlyPending: boolean // Only notify if habits remain incomplete
  lastNotifiedDate?: string // "YYYY-MM-DD"
}

const SETTINGS_KEY = 'kumo_notification_settings'

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  time: '20:30',
  smartOnlyPending: true,
}

/**
 * Checks if the browser supports notifications & service workers
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'Notification' in window && 'serviceWorker' in navigator
}

/**
 * Gets current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }
  return Notification.permission
}

/**
 * Requests notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied'
  }
  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch (error) {
    console.error('[Notifications] Permission request error:', error)
    return 'denied'
  }
}

/**
 * Retrieves saved notification settings from localStorage
 */
export function getNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS
  }
}

/**
 * Saves notification settings to localStorage
 */
export function saveNotificationSettings(settings: NotificationSettings): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (err) {
    console.error('[Notifications] Error saving settings:', err)
  }
}

/**
 * Dispatches a notification through the Service Worker registration
 * or standard Notification API as fallback
 */
export async function showKumoNotification(
  title: string,
  options?: NotificationOptions,
): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false
  }

  const notificationOptions: NotificationOptions = {
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'kumo-reminder',
    ...(options ?? {}),
  } as NotificationOptions

  try {
    // Try via active service worker registration (needed on mobile PWAs)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions)
        return true
      }
    }

    // Fallback to window Notification
    new Notification(title, notificationOptions)
    return true
  } catch (err) {
    console.warn('[Notifications] showNotification error, falling back:', err)
    try {
      new Notification(title, notificationOptions)
      return true
    } catch {
      return false
    }
  }
}

/**
 * Sends a delayed test notification so the user can minimize the app or lock screen
 */
export function scheduleTestNotification(delaySeconds = 3): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const success = await showKumoNotification('☁️ Kumo Habits: ¡Recordatorio de prueba!', {
        body: 'Así se verán tus recordatorios diarios en tu celular. ¡Tus hábitos están a salvo! ✨',
        tag: 'kumo-test-reminder',
      })
      resolve(success)
    }, delaySeconds * 1000)
  })
}
