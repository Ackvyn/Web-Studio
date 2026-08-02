/* Ackvyn CRM — service worker for Web Push (background notifications).
 * Served from the operator origin (e.g. webstudio.ackvyn.org/crm/sw.js).
 */
/* eslint-disable no-restricted-globals */

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      let data = {
        title: 'Ackvyn CRM',
        body: 'New activity',
        tag: 'ackvyn-crm',
        url: '/crm/',
      }
      try {
        if (event.data) {
          const parsed = event.data.json()
          data = { ...data, ...parsed }
        }
      } catch {
        try {
          const text = event.data && event.data.text()
          if (text) data.body = text
        } catch {
          /* ignore */
        }
      }

      // If CRM is already visible, in-app alerts handle it — skip duplicate banner.
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      const crmVisible = windows.some(
        (c) =>
          c.visibilityState === 'visible' &&
          (c.url.includes('/crm') || c.url.includes('crm')),
      )
      if (crmVisible) return

      await self.registration.showNotification(data.title || 'Ackvyn CRM', {
        body: data.body || '',
        tag: data.tag || 'ackvyn-crm',
        renotify: true,
        data: { url: data.url || '/crm/' },
      })
    })(),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/crm/'
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      for (const client of windows) {
        if (client.url.includes('/crm') && 'focus' in client) {
          await client.focus()
          return
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(target)
      }
    })(),
  )
})
