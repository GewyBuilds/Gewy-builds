// Tiny saved-copy store (IndexedDB). Used so the shop can show products without asking the database every time.
// Every call is wrapped: if the browser blocks storage, the shop simply works without a saved copy.
const DB = 'gewy-cache';
const open = () => new Promise((res, rej) => {
  const r = indexedDB.open(DB, 1);
  r.onupgradeneeded = () => r.result.createObjectStore('kv');
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
export async function cacheGet(key) {
  try {
    const db = await open();
    return await new Promise((res) => { const q = db.transaction('kv').objectStore('kv').get(key); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); });
  } catch { return null; }
}
export async function cacheSet(key, value) {
  try {
    const db = await open();
    await new Promise((res) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(value, key); tx.oncomplete = () => res(); tx.onerror = () => res(); });
  } catch { /* ignore */ }
}
