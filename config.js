// ==========================================================
// НАСТРОЙКИ. Заполни всё ниже своими значениями.
// ==========================================================

// 1) Конфиг Firebase-проекта (Project settings → General → Your apps → Web app)
const FIREBASE_CONFIG = {
  apiKey: "ВСТАВЬ_СЮДА",
  authDomain: "ВСТАВЬ_СЮДА.firebaseapp.com",
  projectId: "ВСТАВЬ_СЮДА",
  storageBucket: "ВСТАВЬ_СЮДА.appspot.com",
  messagingSenderId: "ВСТАВЬ_СЮДА",
  appId: "ВСТАВЬ_СЮДА"
};

// 2) VAPID-ключ для Web Push (Project settings → Cloud Messaging → Web configuration → Generate key pair)
const VAPID_KEY = "ВСТАВЬ_СЮДА";

// 3) URL твоего развёрнутого Google Apps Script (Deploy → New deployment → Web app)
//    Именно он рассылает пуши через FCM HTTP v1, минуя Cloud Functions/Blaze.
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/ВСТАВЬ_СЮДА/exec";

// 4) Тот же секрет, что записан в Script Properties Apps Script (SHARED_SECRET).
//    Нужен, чтобы посторонний с URL веб-приложения не мог слать вам пуши.
const SHARED_SECRET = "ВСТАВЬ_СЮДА";

// 5) Кто есть кто в этом приложении. "me" — за кем из двух закреплено это устройство.
//    На телефоне Антона поставь "anton", на телефоне Амира — "amir".
const ME = "anton"; // "anton" | "amir"
