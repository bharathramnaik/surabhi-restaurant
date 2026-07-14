const CACHE_NAME = "surabhi-v1";
const urlsToCache = ["/", "/icon/icon-192.png", "/icon/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)).then(() => self.skipWaiting())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  let url;
  try { url = new URL(event.request.url); } catch { return; }
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/auth")) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("/")));
    return;
  }
  event.respondWith(
    fetch(event.request).then((response) => {
      if (!response.ok) return response;
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      return response;
    }).catch(() => caches.match(event.request))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.map((name) => name !== CACHE_NAME ? caches.delete(name) : null))).then(() => self.clients.claim())
  );
});
