/**
 * Homestead — service worker
 *
 * Makes the site installable as a home-screen app. It deliberately does
 * NOT cache pages or API calls, so people always see the latest listings
 * and the newest version of the app right after you redeploy.
 */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

// A fetch handler is required for the "Add to Home Screen" prompt.
// It just passes every request straight through to the network.
self.addEventListener('fetch', () => {})
