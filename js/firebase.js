// Firebase auth (Google sign-in) + Firestore sync of holdings/history.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./config.js";
import { S, DEFAULT_HOLDINGS } from "./state.js";

export const FB_READY = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

let auth, db, user = null, unsub = null;
let applyingRemote = false;          // guards against echoing remote updates back
let renderCb = () => {};             // set by main.js to avoid a circular import
let saveTimer = null;

export function setRender(fn) { renderCb = fn; }

function setSync(text, cls) {
  const e = document.getElementById("sync");
  e.textContent = text;
  e.className = "sync " + (cls || "");
}

function applyDoc(d) {
  applyingRemote = true;
  if (Array.isArray(d.holdings)) S.holdings = d.holdings;
  if (Array.isArray(d.history))  S.history  = d.history;
  applyingRemote = false;
  renderCb();
}

// Debounced write to Firestore. Called from render() after any change.
export function cloudSave() {
  if (!user || applyingRemote) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await setDoc(doc(db, "trackers", user.uid),
        { holdings: S.holdings, history: S.history, updated: Date.now() }, { merge: true });
      setSync("✓ synced", "ok");
    } catch (e) { setSync("sync error", "err"); }
  }, 600);
}

async function bindUser(u) {
  user = u;
  const btn = document.getElementById("authBtn");
  if (u) {
    btn.innerHTML = '<img class="avatar" src="' + (u.photoURL || "") + '" alt=""> Sign out';
    setSync("connecting…");
    const ref = doc(db, "trackers", u.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      applyDoc(snap.data());
    } else {
      await setDoc(ref, { holdings: S.holdings, history: S.history, updated: Date.now() });
    }
    setSync("✓ synced", "ok");
    if (unsub) unsub();
    unsub = onSnapshot(ref, s => {
      if (!s.exists() || s.metadata.hasPendingWrites) return;
      applyDoc(s.data());
    });
  } else {
    btn.textContent = "Sign in";
    setSync("");
    if (unsub) { unsub(); unsub = null; }
    // Clear the signed-in user's data so it isn't shown after sign-out.
    applyingRemote = true;               // stop cloudSave echoing during reset
    S.holdings = DEFAULT_HOLDINGS.map(h => ({ ...h }));
    S.history = [];
    applyingRemote = false;
    localStorage.removeItem("bt_holdings");
    localStorage.removeItem("bt_history");
    renderCb();
  }
}

export function initFirebase() {
  if (!FB_READY) {
    document.getElementById("cfgBanner").style.display = "block";
    document.getElementById("authBtn").onclick = () =>
      alert("Add your Firebase config to js/config.js first.");
    return;
  }
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  document.getElementById("authBtn").onclick = async () => {
    if (user) { await signOut(auth); }
    else {
      try { await signInWithPopup(auth, new GoogleAuthProvider()); }
      catch (e) { setSync("sign-in failed", "err"); }
    }
  };
  onAuthStateChanged(auth, bindUser);
}
