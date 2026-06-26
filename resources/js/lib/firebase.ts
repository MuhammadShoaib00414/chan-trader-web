import { requestJson } from '@/lib/http'
import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined

let app: FirebaseApp | null = null
let messaging: Messaging | null = null
let registered = false

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId && vapidKey)
}

/**
 * Register this browser for FCM web push and wire up foreground messages.
 * Safe to call on every page load — it only runs once and no-ops when the
 * Firebase web config / VAPID key are not present in the environment.
 */
export async function registerFcm(): Promise<void> {
  if (registered) return
  if (!isFirebaseConfigured()) return
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) return

  registered = true

  try {
    app = app ?? initializeApp(firebaseConfig as Record<string, string>)
    messaging = messaging ?? getMessaging(app)

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

    // getToken() → PushManager.subscribe() needs an ACTIVE service worker. On the
    // first-ever load the SW is still installing/activating, which threw
    // "no active Service Worker" and left the token unregistered until a reload.
    // Wait for activation so registration succeeds on the first visit.
    await waitForActiveWorker(swRegistration)

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    })

    if (token) {
      await requestJson('POST', '/api/admin/fcm-token', { fcm_token: token })
    }

    // Foreground messages: the SW only fires when the page is backgrounded, so
    // show our own notification here and let the bell refresh its unread count.
    onMessage(messaging, (payload) => {
      const data = (payload.data ?? {}) as Record<string, string>
      const title = payload.notification?.title ?? data.title ?? 'New notification'
      const body = payload.notification?.body ?? data.message ?? ''
      const link = data.link ?? '/'

      window.dispatchEvent(new CustomEvent('fcm-message', { detail: { title, body, link } }))

      if (Notification.permission === 'granted') {
        const n = new Notification(title, { body, icon: '/favicon.ico' })
        n.onclick = () => {
          window.focus()
          window.location.href = link
        }
      }
    })
  } catch (e) {
    // Never let push registration break the dashboard.
    console.warn('FCM registration skipped:', e)
    registered = false
  }
}

/** Resolve once the registration has an active (running) service worker. */
async function waitForActiveWorker(reg: ServiceWorkerRegistration): Promise<void> {
  if (reg.active) return
  const incoming = reg.installing ?? reg.waiting
  if (incoming) {
    await new Promise<void>((resolve) => {
      const onChange = () => {
        if (incoming.state === 'activated') {
          incoming.removeEventListener('statechange', onChange)
          resolve()
        }
      }
      incoming.addEventListener('statechange', onChange)
    })
    return
  }
  // Fallback: navigator.serviceWorker.ready resolves when an active worker exists.
  await navigator.serviceWorker.ready
}
