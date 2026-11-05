// One data layer for both apps.
//  - DEMO mode (config.firebase === null): everything lives in this browser's localStorage.
//  - LIVE mode: Firebase Auth + Firestore + Storage + Cloud Messaging.
// The apps only ever call the functions exported here, so they behave the same in both modes.
import { rid } from './ui.js';

const CFG = globalThis.GEWY_CONFIG || {};
const LOCAL = !CFG.firebase;
export const mode = LOCAL ? 'demo' : 'live';
// Phone push notifications need Firebase's paid plan; without a vapidKey they are switched off everywhere.
export const pushAvailable = LOCAL || !!CFG.vapidKey;

const V = '10.14.1';
const CDN = `https://www.gstatic.com/firebasejs/${V}/`;
let app, auth, db, AU, FS;
let _uid = null;
const adminCbs = new Set();

/* ------------------------------------------------------------------ init */
export async function init({ role } = {}) {
  // On the real website the shop must never fall back to the local demo mode (it would have no real data and no real login).
  if (LOCAL && !['localhost', '127.0.0.1', ''].includes(location.hostname)) throw new Error('config.js is missing the Firebase settings');
  if (LOCAL) {
    _uid = localStorage.getItem('gewy:uid');
    if (!_uid) {
      _uid = 'u_' + rid();
      localStorage.setItem('gewy:uid', _uid);
    }
    return _uid;
  }
  const [A, a, f] = await Promise.all([
    import(CDN + 'firebase-app.js'),
    import(CDN + 'firebase-auth.js'),
    import(CDN + 'firebase-firestore.js'),
  ]);
  AU = a; FS = f;
  // One Firebase "app" per role keeps the admin login and the customer login apart on the same website.
  app = A.initializeApp(CFG.firebase, role || 'default');
  if (CFG.appCheckKey) {
    // Bot protection (Firebase App Check). Failures here must never stop the shop from loading.
    try {
      const AC = await import(CDN + 'firebase-app-check.js');
      AC.initializeAppCheck(app, { provider: new AC.ReCaptchaV3Provider(CFG.appCheckKey), isTokenAutoRefreshEnabled: true });
    } catch (e) { console.warn('app check skipped', e.code || e); }
  }
  auth = AU.getAuth(app);
  db = FS.getFirestore(app);
  await auth.authStateReady();
  if (role === 'shop' && !auth.currentUser) await AU.signInAnonymously(auth);
  _uid = auth.currentUser ? auth.currentUser.uid : null;
  AU.onAuthStateChanged(auth, (u) => {
    _uid = u ? u.uid : null;
    adminCbs.forEach((f) => f(adminOf(u)));
  });
  return _uid;
}
const adminOf = (u) => (u && !u.isAnonymous ? { uid: u.uid, email: u.email } : null);
export const uid = () => _uid;

/* ------------------------------------------------------------ admin auth */
export function onAdmin(cb) {
  adminCbs.add(cb);
  if (LOCAL) cb(localStorage.getItem('gewy:admin') ? { uid: _uid, email: 'demo@gewybuilds' } : null);
  else cb(adminOf(auth.currentUser));
  return () => adminCbs.delete(cb);
}
export async function adminLogin(email, pw) {
  if (LOCAL) {
    localStorage.setItem('gewy:admin', '1');
    adminCbs.forEach((f) => f({ uid: _uid, email: 'demo@gewybuilds' }));
    return;
  }
  await AU.signInWithEmailAndPassword(auth, email, pw);
}
export async function adminLogout() {
  if (LOCAL) {
    localStorage.removeItem('gewy:admin');
    adminCbs.forEach((f) => f(null));
    return;
  }
  await AU.signOut(auth);
}

/* ------------------------------------------------------- local datastore */
const LS = {
  get: (c) => { try { return JSON.parse(localStorage.getItem('gewy:c:' + c) || '[]'); } catch { return []; } },
  set: (c, v) => localStorage.setItem('gewy:c:' + c, JSON.stringify(v)),
};
const listeners = new Map();
const bc = 'BroadcastChannel' in globalThis ? new BroadcastChannel('gewy') : null;
const fire = (c) => (listeners.get(c) || []).forEach((f) => f());
if (bc) bc.onmessage = (e) => fire(e.data);
const emit = (c) => { fire(c); bc && bc.postMessage(c); };
const match = (d, where) => where.every(([f, op, v]) => d[f] === v);

/* ------------------------------------------------------------- data API */
// where: [[field,'==',value], ...] — equality only (no special indexes needed).
export function watch(col, cb, { where = [] } = {}) {
  if (LOCAL) {
    const run = () => cb(LS.get(col).filter((d) => match(d, where)));
    if (!listeners.has(col)) listeners.set(col, new Set());
    listeners.get(col).add(run);
    setTimeout(run, 0);
    return () => listeners.get(col).delete(run);
  }
  let q = FS.collection(db, col);
  if (where.length) q = FS.query(q, ...where.map(([f, op, v]) => FS.where(f, op, v)));
  return FS.onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => { console.warn('watch failed:', col, err.code || err); cb([], err); }
  );
}

export function watchDoc(col, id, cb) {
  if (LOCAL) {
    return watch(col, (rows) => cb(rows.find((r) => r.id === id) || null));
  }
  return FS.onSnapshot(
    FS.doc(db, col, id),
    (s) => cb(s.exists() ? { id: s.id, ...s.data() } : null),
    (err) => { console.warn('watchDoc failed:', col, err.code || err); cb(null, err); }
  );
}

// One-time read of a single document.
export async function getOne(col, id) {
  if (LOCAL) return LS.get(col).find((d) => d.id === id) || null;
  const s = await FS.getDoc(FS.doc(db, col, id));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

// One-time read (not live).
export async function getAll(col, { where = [] } = {}) {
  if (LOCAL) return LS.get(col).filter((d) => match(d, where));
  let q = FS.collection(db, col);
  if (where.length) q = FS.query(q, ...where.map(([f, op, v]) => FS.where(f, op, v)));
  const snap = await FS.getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function add(col, data) {
  if (LOCAL) {
    const id = rid();
    LS.set(col, [...LS.get(col), { ...data, id }]);
    emit(col);
    return id;
  }
  const r = await FS.addDoc(FS.collection(db, col), data);
  return r.id;
}

export async function set(col, id, data) {
  if (LOCAL) {
    const rows = LS.get(col);
    const i = rows.findIndex((r) => r.id === id);
    if (i >= 0) rows[i] = { ...rows[i], ...data, id };
    else rows.push({ ...data, id });
    LS.set(col, rows);
    emit(col);
    return id;
  }
  await FS.setDoc(FS.doc(db, col, id), data, { merge: true });
  return id;
}

export async function del(col, id) {
  if (LOCAL) {
    LS.set(col, LS.get(col).filter((r) => r.id !== id));
    emit(col);
    return;
  }
  await FS.deleteDoc(FS.doc(db, col, id));
}

/* -------------------------------------------------------------- images */
async function resize(file, max, q) {
  let bmp;
  try { bmp = await createImageBitmap(file); }
  catch {
    bmp = await new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = URL.createObjectURL(file);
    });
  }
  const w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;
  const k = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * k);
  c.height = Math.round(h * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return c;
}

// Photos are shrunk and saved inside the database record itself (no separate file storage needed).
// Returns a data URL you can put straight into an <img>.
export const MAX_PHOTOS = 3;
export async function uploadImage(file) {
  let out = '';
  for (const max of [800, 640, 480]) {
    const c = await resize(file, max);
    for (let q = 0.78; q >= 0.44; q -= 0.11) {
      out = c.toDataURL('image/jpeg', q);
      if (out.length <= 120000) return out;
    }
  }
  return out;
}

/* ----------------------------------------------------------- audience stats */
// One small record per customer device: when first/last seen, visit count, installed or not.
// Called by the shop app only. Failures are ignored on purpose (stats must never break the shop).
export async function touchDevice({ installed = false, visit = true, src = '', link = '', stage = 0, area = '' } = {}) {
  try {
    const id = _uid;
    if (!id) return;
    const ua = navigator.userAgent || '';
    const platform = /iPhone|iPad|iPod/i.test(ua) ? 'ios' : /Android/i.test(ua) ? 'android' : 'desktop';
    const lang = (navigator.language || '').slice(0, 2);
    const now = Date.now();
    let cur = null;
    if (LOCAL) cur = LS.get('devices').find((d) => d.id === id) || null;
    else { const snap = await FS.getDoc(FS.doc(db, 'devices', id)); cur = snap.exists() ? snap.data() : null; }
    if (!cur) {
      const doc = { firstSeen: now, lastSeen: now, visits: 1, installed: !!installed, platform, lang };
      if (src) doc.src = String(src).slice(0, 30);
      if (link) doc.link = String(link).slice(0, 30);
      if (stage) doc.stage = stage;
      if (area) doc.area = String(area).slice(0, 60);
      if (installed) doc.installedAt = now;
      await set('devices', id, doc);
      return;
    }
    const upd = { lastSeen: now, visits: (cur.visits || 0) + (visit ? 1 : 0), platform, lang };
    if (installed && !cur.installed) { upd.installed = true; upd.installedAt = now; }
    if (src && !cur.src) upd.src = String(src).slice(0, 30);
    if (link && !cur.link) upd.link = String(link).slice(0, 30);
    if (stage > (cur.stage || 0)) upd.stage = stage;
    if (area && area !== cur.area) upd.area = String(area).slice(0, 60);
    await set('devices', id, upd);
  } catch (e) { console.warn('stats skipped', e.code || e); }
}

/* ------------------------------------------------------------ push alerts */
// role: 'shop' (customers) or 'admin' (you). Returns {ok, reason?}.
export async function enablePush(role, { silent = false } = {}) {
  if (!('Notification' in globalThis)) return { ok: false, reason: 'unsupported' };
  if (silent && Notification.permission !== 'granted') return { ok: false, reason: 'not-granted' };
  const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, reason: 'denied' };
  localStorage.setItem('gewy:push:' + role, '1');
  if (LOCAL) return { ok: true };
  try {
    const M = await import(CDN + 'firebase-messaging.js');
    if (!(await M.isSupported())) return { ok: false, reason: 'unsupported' };
    if (!CFG.vapidKey) return { ok: false, reason: 'no-vapid' };
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;
    const messaging = M.getMessaging(app);
    const token = await M.getToken(messaging, { vapidKey: CFG.vapidKey, serviceWorkerRegistration: reg });
    if (!token) return { ok: false, reason: 'no-token' };
    await set('subscribers', token, { uid: _uid, role, at: Date.now(), ua: navigator.userAgent.slice(0, 90) });
    M.onMessage(messaging, (p) => {
      const n = p.notification || {};
      globalThis.dispatchEvent(new CustomEvent('gewy:push', { detail: { title: n.title, body: n.body } }));
    });
    return { ok: true };
  } catch (e) {
    console.warn('push setup failed', e);
    return { ok: false, reason: 'error' };
  }
}
export const pushEnabled = (role) => localStorage.getItem('gewy:push:' + role) === '1' && 'Notification' in globalThis && Notification.permission === 'granted';

// Demo mode only: show a real browser notification for "broadcasts" so you can see the flow.
export function localNotify(title, body) {
  try {
    if ('Notification' in globalThis && Notification.permission === 'granted') new Notification(title, { body });
  } catch { /* ignore */ }
}

// Funnel: how far this phone got (1 looked at a product, 2 added to cart, 3 opened checkout, 4 ordered or sent a request).
// Writes only when it moves forward, so it costs at most 4 small writes per phone.
let _stage = 0;
export async function bumpStage(n) {
  try {
    if (!_uid || n <= _stage) return;
    _stage = n;
    await set('devices', _uid, { stage: n });
  } catch (e) { console.warn('stage skipped', e.code || e); }
}

/* ------------------------------------------------- optional customer accounts */
// Everybody starts as a guest (a hidden anonymous login). Making an account upgrades that SAME login with an
// email + password, so anything the guest already ordered stays theirs. Logging in on another phone signs into the account.
const AUTH_ERR = {
  'auth/email-already-in-use': 'exists', 'auth/credential-already-in-use': 'exists', 'auth/invalid-email': 'email', 'auth/missing-email': 'email',
  'auth/weak-password': 'weak', 'auth/missing-password': 'weak', 'auth/invalid-credential': 'bad', 'auth/wrong-password': 'bad',
  'auth/user-not-found': 'bad', 'auth/invalid-login-credentials': 'bad', 'auth/too-many-requests': 'many', 'auth/network-request-failed': 'net',
};
const authFail = (e) => { const x = new Error((e && e.message) || 'auth'); x.key = AUTH_ERR[e && e.code] || (e && e.key) || 'err'; return x; };
const accts = () => { try { return JSON.parse(localStorage.getItem('gewy:accts') || '[]'); } catch { return []; } };

export function account() {
  if (LOCAL) { const e = localStorage.getItem('gewy:acct'); return e ? { email: e, verified: localStorage.getItem('gewy:acctv') === '1', uid: _uid } : null; }
  const u = auth && auth.currentUser;
  return u && !u.isAnonymous && u.email ? { email: u.email, verified: !!u.emailVerified, uid: u.uid } : null;
}

export async function signUp(email, pw) {
  email = String(email || '').trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw authFail({ code: 'auth/invalid-email' });
  if (String(pw || '').length < 6) throw authFail({ code: 'auth/weak-password' });
  const now = Date.now();
  if (LOCAL) {
    if (accts().some((a) => a.email.toLowerCase() === email.toLowerCase())) throw authFail({ code: 'auth/email-already-in-use' });
    localStorage.setItem('gewy:accts', JSON.stringify([...accts(), { email, pw, uid: _uid }]));
    localStorage.setItem('gewy:acct', email);
    await set('accounts', _uid, { createdAt: now, lastSeen: now });
    return;
  }
  try {
    const u = auth.currentUser;
    if (u && u.isAnonymous) await AU.linkWithCredential(u, AU.EmailAuthProvider.credential(email, pw));
    else await AU.createUserWithEmailAndPassword(auth, email, pw);
    await auth.currentUser.getIdToken(true); // the new token now carries the email, which the database rules look at
    _uid = auth.currentUser.uid;
  } catch (e) { throw authFail(e); }
  try { await AU.sendEmailVerification(auth.currentUser); } catch (e) { console.warn('verification mail skipped', e.code || e); }
  await set('accounts', _uid, { createdAt: now, lastSeen: now });
}

export async function signIn(email, pw) {
  email = String(email || '').trim();
  if (LOCAL) {
    const a = accts().find((x) => x.email.toLowerCase() === email.toLowerCase() && x.pw === pw);
    if (!a) throw authFail({ code: 'auth/invalid-credential' });
    localStorage.setItem('gewy:uid', a.uid);
    localStorage.setItem('gewy:acct', a.email);
    return;
  }
  try { await AU.signInWithEmailAndPassword(auth, email, pw); } catch (e) { throw authFail(e); }
}

export async function signOutAccount() {
  if (LOCAL) { localStorage.removeItem('gewy:acct'); localStorage.setItem('gewy:uid', 'u_' + rid()); return; }
  await AU.signOut(auth); // the page reloads after this and starts a fresh guest login
}

export async function resetPassword(email) {
  email = String(email || '').trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw authFail({ code: 'auth/invalid-email' });
  if (LOCAL) return;
  try { await AU.sendPasswordResetEmail(auth, email); } catch (e) { throw authFail(e); }
}

export async function resendVerification() {
  if (LOCAL) { localStorage.setItem('gewy:acctv', '1'); return; }
  try { await AU.sendEmailVerification(auth.currentUser); } catch (e) { throw authFail(e); }
}

// Logged-in customers only: shows "active in the last 5 minutes" in the admin Audience page. Cheap: one small write per call.
let _beat = 0;
export async function heartbeat({ area = '', force = false } = {}) {
  try {
    if (!account() || !_uid) return;
    const now = Date.now();
    if (!force && now - _beat < 4.5 * 60 * 1000) return;
    _beat = now;
    await set('accounts', _uid, { lastSeen: now, ...(area ? { area: String(area).slice(0, 60) } : {}) });
  } catch (e) { console.warn('heartbeat skipped', e.code || e); }
}

// Admin app: is the signed-in user really the shop owner? (A customer account must not get into the admin screens.)
export async function isOwner() {
  if (LOCAL) return true;
  try { await FS.getDocs(FS.query(FS.collection(db, 'broadcasts'), FS.limit(1))); return true; }
  catch (e) { return !(e && e.code === 'permission-denied'); }
}
export async function adminEmailVerified() { return LOCAL ? true : !!(auth.currentUser && auth.currentUser.emailVerified); }
export async function adminSendVerification() { if (!LOCAL) await AU.sendEmailVerification(auth.currentUser); }
