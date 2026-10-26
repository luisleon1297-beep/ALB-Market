const CACHE='albion-market-pwa-2.8.4';
const CORE=['./','./index.html','./styles.css','./mobile.css','./calculations.js','./browser-adapter.js','./app.js','./manifest.webmanifest','./assets/icon.png','./assets/icon.svg','./assets/market-hero.png','./vendor/leaflet/leaflet.css','./vendor/leaflet/leaflet.js','./data/offline-build-catalog.json'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request).then(hit=>hit||caches.match('./index.html'))));
});
