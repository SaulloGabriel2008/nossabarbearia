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

messaging.onBackgroundMessage(payload => {
  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/icon-192.png"
    }
  );
});
