/* Jay OS service worker (2026-11-03) — NETWORK FIRST, cache is only an offline fallback.
   Pages are encrypted at rest (staticrypt): a cached copy is noise without the passphrase, the key stays in localStorage.
   Only same-origin GETs are handled; HEAD (freshness check) and cross-origin (Google Fonts, cloud bridges) pass through. */
const CACHE = 'jos-cache-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  const cacheable = /\.(html|webmanifest|png|svg|ico)$/.test(u.pathname) || u.pathname.endsWith('/');
  e.respondWith(fetch(r).then(res => {
    if (res.ok && cacheable) { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)).catch(() => {}); }
    return res;
  }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || (r.mode === 'navigate'
    ? new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#0b0d0f;color:#e8e8e8;font-family:system-ui;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:24px"><div><h1 style="color:#fff">Нет связи с Jay OS</h1><p style="color:#9a9a9a">Страница ещё не сохранена для офлайна. Включи интернет и обнови.</p><button onclick="location.reload()" style="font:600 15px system-ui;background:#07e7b7;color:#131313;border:0;border-radius:12px;padding:12px 22px">↻ Обновить</button></div>',
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    : undefined))));
});
