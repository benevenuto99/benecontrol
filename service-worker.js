self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("benecontrol").then((cache) => {
      return cache.addAll([
        "./",
        "./index.html",
        "./styles.css",
        "./app.js"
      ]);
    })
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});