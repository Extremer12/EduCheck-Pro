self.addEventListener("install", event => {
  console.log("Service Worker instalado");
  event.waitUntil(
    caches.open("horita-cache").then(cache => {
      return cache.addAll([
        "/",
        "/index.html",
        "/manifest.json",
        "/icon-192.png",
        "/icon-512.png",
        "/src/assets/css/styles.css",
        "/src/assets/js/app.js"
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(resp => {
      return resp || fetch(event.request);
    })
  );
});
