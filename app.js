/* claude-status — realtime presence between two people, no build step. */

const OTHER = ME === "anton" ? "amir" : "anton";
const NAMES = { anton: "Антон", amir: "Амир" };

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();

const presenceCol = db.collection("presence");
const sessionsCol = db.collection("sessions");

const els = {
  conn: document.getElementById("conn"),
  history: document.getElementById("history"),
  tile: { anton: document.getElementById("tile-anton"), amir: document.getElementById("tile-amir") },
  line: { anton: document.getElementById("line-anton"), amir: document.getElementById("line-amir") },
  btn: document.getElementById(`btn-${ME}`),
};

let state = { anton: null, amir: null };
let tickHandle = null;

// ---------- realtime listeners ----------

presenceCol.onSnapshot(
  (snap) => {
    els.conn.textContent = "online";
    els.conn.classList.add("live");
    snap.docChanges().forEach((change) => {
      const id = change.doc.id;
      if (id === "anton" || id === "amir") state[id] = change.doc.data();
    });
    render();
  },
  (err) => {
    console.error("presence listener error", err);
    els.conn.textContent = "offline";
    els.conn.classList.remove("live");
  }
);

sessionsCol
  .orderBy("start", "desc")
  .limit(15)
  .onSnapshot((snap) => {
    els.history.innerHTML = "";
    snap.forEach((doc) => {
      const d = doc.data();
      if (!d.start || !d.end) return;
      const mins = Math.max(1, Math.round((d.end.toMillis() - d.start.toMillis()) / 60000));
      const dt = d.start.toDate();
      const dateStr = dt.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
      const timeStr = dt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      const row = document.createElement("div");
      row.className = "log-entry";
      row.innerHTML = `<span><b>${NAMES[d.user] || d.user}</b> · ${dateStr} ${timeStr}</span><span>${mins} мин</span>`;
      els.history.appendChild(row);
    });
  });

// ---------- rendering ----------

function render() {
  ["anton", "amir"].forEach((who) => {
    const data = state[who];
    const tile = els.tile[who];
    const line = els.line[who];
    const active = !!(data && data.active);
    tile.classList.toggle("active", active);
    tile.classList.toggle(`who-${who}`, true);

    if (active && data.since) {
      line.dataset.since = data.since.toMillis();
    } else {
      delete line.dataset.since;
      line.textContent = "простаивает";
    }
  });

  if (els.btn) {
    const mine = state[ME];
    const active = !!(mine && mine.active);
    els.btn.textContent = active ? "Я закончил" : "Я сел за Claude";
    els.btn.classList.toggle("stop", active);
  }

  if (!tickHandle) tickHandle = setInterval(tick, 1000);
  tick();
}

function tick() {
  ["anton", "amir"].forEach((who) => {
    const line = els.line[who];
    const since = line.dataset.since;
    if (!since) return;
    const secs = Math.floor((Date.now() - Number(since)) / 1000);
    const h = String(Math.floor(secs / 3600)).padStart(2, "0");
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    line.textContent = `в Claude · ${h}:${m}:${s}`;
  });
}

// ---------- toggle action ----------

if (els.btn) {
  els.btn.addEventListener("click", async () => {
    els.btn.disabled = true;
    try {
      const mine = state[ME] || {};
      const turningOn = !mine.active;

      if (turningOn) {
        await presenceCol.doc(ME).set(
          { active: true, since: firebase.firestore.FieldValue.serverTimestamp(), name: NAMES[ME] },
          { merge: true }
        );
        notifyOther(`${NAMES[ME]} сел за Claude`, "Кто-то занял лимиты 👀");
      } else {
        const startedAt = mine.since ? mine.since.toDate() : new Date();
        await sessionsCol.add({
          user: ME,
          start: firebase.firestore.Timestamp.fromDate(startedAt),
          end: firebase.firestore.FieldValue.serverTimestamp(),
        });
        await presenceCol.doc(ME).set({ active: false }, { merge: true });
      }
    } catch (e) {
      console.error(e);
      alert("Не получилось обновить статус. Проверь конфиг и правила Firestore.");
    } finally {
      els.btn.disabled = false;
    }
  });
}

// ---------- push notifications ----------

async function notifyOther(title, body) {
  const otherToken = state[OTHER] && state[OTHER].fcmToken;
  if (!otherToken || !APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("ВСТАВЬ_СЮДА")) return;
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // избегаем preflight OPTIONS для Apps Script
      body: JSON.stringify({ token: otherToken, title, body, secret: SHARED_SECRET }),
    });
  } catch (e) {
    console.warn("push relay failed", e);
  }
}

async function setupMessaging() {
  if (!("Notification" in window) || !firebase.messaging.isSupported()) return;
  try {
    const reg = await navigator.serviceWorker.register("sw.js");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const messaging = firebase.messaging();
    const token = await messaging.getToken({ vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
    if (token) {
      await presenceCol.doc(ME).set({ fcmToken: token, name: NAMES[ME] }, { merge: true });
    }

    messaging.onMessage((payload) => {
      const { title, body } = payload.notification || payload.data || {};
      if (title) new Notification(title, { body, icon: "icons/icon-180.png" });
    });
  } catch (e) {
    console.warn("messaging setup failed (нормально в http:// или в браузере без пуш-разрешений)", e);
  }
}

setupMessaging();
