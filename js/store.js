/* Хранилище дневника: IndexedDB в браузере пользователя (фото и аудио — как Blob). Если IndexedDB недоступна — память вкладки. */
(function (PV) {
  const DB = 'poslevkusie', STORE = 'days', VER = 1;
  let dbp = null, mem = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res) => {
      try {
        const rq = indexedDB.open(DB, VER);
        rq.onupgradeneeded = () => { const db = rq.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' }); if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta'); };
        rq.onsuccess = () => res(rq.result); rq.onerror = () => { mem = new Map(); res(null); };
      } catch (e) { mem = new Map(); res(null); }
    });
    return dbp;
  }
  const tx = async (store, mode, fn) => {
    const db = await open(); if (!db) return fn(null);
    return new Promise((res, rej) => { const t = db.transaction(store, mode), s = t.objectStore(store); const r = fn(s); t.oncomplete = () => res(r && 'result' in r ? r.result : undefined); t.onerror = () => rej(t.error); });
  };
  PV.store = {
    get persistent() { return !mem; },
    async all() { await open(); if (mem) return [...mem.values()]; return tx(STORE, 'readonly', s => s.getAll()); },
    async get(id) { await open(); if (mem) return mem.get(id); return tx(STORE, 'readonly', s => s.get(id)); },
    async put(day) { await open(); if (mem) { mem.set(day.id, day); return; } return tx(STORE, 'readwrite', s => s.put(day)); },
    async del(id) { await open(); if (mem) { mem.delete(id); return; } return tx(STORE, 'readwrite', s => s.delete(id)); },
    async meta(key, val) {
      await open();
      if (mem) { mem.__meta = mem.__meta || {}; if (val === undefined) return mem.__meta[key]; mem.__meta[key] = val; return; }
      return val === undefined ? tx('meta', 'readonly', s => s.get(key)) : tx('meta', 'readwrite', s => s.put(val, key));
    }
  };
})(window.PV);
