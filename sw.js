/* Carena · arranque sin conexión. Guarda la carcasa de la app (nunca datos de clientes ni llamadas a Carena). */
const CACHE = 'carena-0.3.0-47019ad4f0', FUENTES = 'carena-fuentes-1';
const CARCASA = ['./', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CARCASA)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== FUENTES).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const alDia = (cache, req, clave) => fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) caches.open(cache).then(c => c.put(clave || req, r.clone())); return r; });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                                       // las llamadas a Carena (POST) no pasan por aquí
  const url = new URL(req.url);
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(FUENTES).then(c => c.match(req)).then(hit => { const red = alDia(FUENTES, req).catch(() => hit); return hit || red; }));
    return;
  }
  if (url.origin !== self.location.origin) return;
  const clave = req.mode === 'navigate' ? './' : req;
  // Lo guardado primero (abre al instante y sin red); por detrás se trae la versión nueva para la próxima vez
  e.respondWith(caches.open(CACHE).then(c => c.match(clave, { ignoreSearch: true })).then(hit => {
    const red = alDia(CACHE, req, clave).catch(() => hit || Response.error());
    return hit || red;
  }));
});
