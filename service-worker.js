importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAi2g57qd4J3ONEjGvTEct69jsdV9F59lg",
  authDomain: "nossa-barbearia.firebaseapp.com",
  projectId: "nossa-barbearia",
  storageBucket: "nossa-barbearia.firebasestorage.app",
  messagingSenderId: "545785512912",
  appId: "1:545785512912:web:a917526f553c21945e6fd5",
});

const messaging = firebase.messaging();

// PUSH EM BACKGROUND
messaging.onBackgroundMessage(payload => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/icon-192.png"
  });
});

// CACHE (OFFLINE)
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("barber-cache-v1").then(cache =>
      cache.addAll([
        "/admin.html",
        "/manifest.json"
      ])
    )
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
