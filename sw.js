const CACHE = "claude-status-v1";
const ASSETS = ["./", "index.html", "app.js", "config.js", "manifest.json"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).catch(() => cached))
  );
});

// ---- Firebase Cloud Messaging (фоновые пуши) ----
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");
importScripts("config.js"); // даёт доступ к FIREBASE_CONFIG внутри service worker

firebase.initializeApp(FIREBASE_CONFIG);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || payload.data || {};
  self.registration.showNotification(title || "claude-status", {
    body: body || "",
    icon: "icons/icon-180.png",
    badge: "icons/icon-180.png",
  });
});
