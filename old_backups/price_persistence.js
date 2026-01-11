// price_persistence.js
// Purpose: lightweight, isolated persistence logic for the "#unified-price-grid" inputs.
// Behavior:
// - Waits for DOMContentLoaded
// - Uses existing `window.db` Firestore instance if present; otherwise tries to initialize Firestore
// - On load: reads documents from collection `material_costs` (one doc per material id) and populates inputs
// - On input/change/blur: saves price to Firestore using setDoc(..., { merge: true })
// - Provides console.log debug output

(function(){
  'use strict';

  // Configuration
  const COLLECTION = 'material_costs';
  const DEBOUNCE_MS = 600; // debounce for input events (typing)

  // Internal state
  let dbInstance = null; // Firestore instance
  let firestoreFns = null; // imports: { doc, getDoc, setDoc }
  const debounceMap = new Map();

  // Utility: sleep
  const delay = ms => new Promise(res => setTimeout(res, ms));

  // Ensure we have a Firestore `db` instance and modular functions
  async function ensureDb(){
    if(dbInstance && firestoreFns) return { db: dbInstance, fns: firestoreFns };

    // If an initialized db exists on the window (from firebase-init.js), use it
    if(window.db){
      dbInstance = window.db;
      try {
        // Try to access modular functions from global imports if available
        // Some setups expose getDoc/setDoc on window; if not, we'll import just the functions
        const mod = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js');
        firestoreFns = { doc: mod.doc, getDoc: mod.getDoc, setDoc: mod.setDoc };
      } catch(e){
        // If we can't import, at least allow using provided `db` and fall back to window methods if present
        firestoreFns = firestoreFns || {};
      }
      console.log('price_persistence: using existing window.db');
      return { db: dbInstance, fns: firestoreFns };
    }

    // No existing db: attempt to initialize using window.__FIREBASE_CONFIG if provided
    const cfg = window.__FIREBASE_CONFIG || null;
    if(!cfg){
      console.warn('price_persistence: no firebase config found (window.__FIREBASE_CONFIG) and no window.db. Persistence disabled.');
      throw new Error('no-firebase-config');
    }

    try{
      const appMod = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js');
      const fsMod = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js');
      const app = appMod.initializeApp(cfg);
      dbInstance = fsMod.getFirestore(app);
      firestoreFns = { doc: fsMod.doc, getDoc: fsMod.getDoc, setDoc: fsMod.setDoc };
      // Expose to window for other code that expects window.db
      try{ window.db = dbInstance; }catch(_){ }
      // price_persistence.js
      // Purpose: lightweight, isolated persistence logic for the "#unified-price-grid" inputs.
      // Behavior:
      // - Waits for DOMContentLoaded
      // - Uses existing `window.db` Firestore instance if present; otherwise tries to initialize Firestore
      // - On load: reads documents from collection `material_costs` (one doc per material id) and populates inputs
      // - On input/change/blur: saves price to Firestore using setDoc(..., { merge: true })
      // - Provides console.log debug output

      (function(){
        'use strict';

        // Configuration
        const COLLECTION = 'material_costs';
        const DEBOUNCE_MS = 600; // debounce for input events (typing)
        const FIREBASE_BASE = 'https://www.gstatic.com/firebasejs/10.13.0/';

        // Internal state
        let dbInstance = null; // Firestore instance
        let firestoreFns = null; // imports: { doc, getDoc, setDoc }
        const debounceMap = new Map();

        // Utility: sleep
        const delay = ms => new Promise(res => setTimeout(res, ms));

        // Ensure we have a Firestore `db` instance and modular functions
        async function ensureDb(){
          if(dbInstance && firestoreFns) return { db: dbInstance, fns: firestoreFns };

          // If an initialized db exists on the window (from firebase-init.js), use it
          if(window.db){
            dbInstance = window.db;
            try {
              // Import the same major version firestore helpers so functions operate on the passed db
              const mod = await import(FIREBASE_BASE + 'firebase-firestore.js');
              firestoreFns = { doc: mod.doc, getDoc: mod.getDoc, setDoc: mod.setDoc };
            } catch(e){
              // If import fails, still allow local-only behavior
              firestoreFns = firestoreFns || {};
            }
            console.log('price_persistence: using existing window.db');
            return { db: dbInstance, fns: firestoreFns };
          }

          // No existing db: attempt to initialize using window.__FIREBASE_CONFIG if provided
          const cfg = window.__FIREBASE_CONFIG || null;
          if(!cfg){
            console.warn('price_persistence: no firebase config found (window.__FIREBASE_CONFIG) and no window.db. Persistence disabled.');
            throw new Error('no-firebase-config');
          }

          try{
            const appMod = await import(FIREBASE_BASE + 'firebase-app.js');
            const fsMod = await import(FIREBASE_BASE + 'firebase-firestore.js');
            const app = appMod.initializeApp(cfg);
            dbInstance = fsMod.getFirestore(app);
            firestoreFns = { doc: fsMod.doc, getDoc: fsMod.getDoc, setDoc: fsMod.setDoc };
            // Expose to window for other code that expects window.db
            try{ window.db = dbInstance; }catch(_){ }
            console.log('price_persistence: initialized firebase app and firestore');
            return { db: dbInstance, fns: firestoreFns };
          }catch(err){
            console.error('price_persistence: failed to initialize Firestore', err);
            throw err;
          }
        }

        // Read a single material doc and return object or null
        async function readMaterialDoc(id){
          try{
            const { db, fns } = await ensureDb();
            if(!fns.doc || !fns.getDoc) throw new Error('firestore-fns-missing');
            const ref = fns.doc(db, COLLECTION, String(id));
            // price_persistence.js
            // Lightweight, isolated persistence logic for the "#unified-price-grid" inputs.

            (function(){
              'use strict';

              const COLLECTION = 'material_costs';
              const DEBOUNCE_MS = 600;
              const FIREBASE_BASE = 'https://www.gstatic.com/firebasejs/10.13.0/';

              let dbInstance = null;
              let firestoreFns = null; // { doc, getDoc, setDoc }
              const debounceMap = new Map();

              async function ensureDb(){
                if(dbInstance && firestoreFns) return { db: dbInstance, fns: firestoreFns };

                if(window.db){
                  dbInstance = window.db;
                  try{
                    const mod = await import(FIREBASE_BASE + 'firebase-firestore.js');
                    firestoreFns = { doc: mod.doc, getDoc: mod.getDoc, setDoc: mod.setDoc };
                  }catch(e){ firestoreFns = firestoreFns || {}; }
                  console.log('price_persistence: using existing window.db');
                  return { db: dbInstance, fns: firestoreFns };
                }

                const cfg = window.__FIREBASE_CONFIG || null;
                if(!cfg){
                  console.warn('price_persistence: no firebase config found (window.__FIREBASE_CONFIG) and no window.db. Persistence disabled.');
                  throw new Error('no-firebase-config');
                }

                try{
                  const appMod = await import(FIREBASE_BASE + 'firebase-app.js');
                  const fsMod = await import(FIREBASE_BASE + 'firebase-firestore.js');
                  const app = appMod.initializeApp(cfg);
                  dbInstance = fsMod.getFirestore(app);
                  firestoreFns = { doc: fsMod.doc, getDoc: fsMod.getDoc, setDoc: fsMod.setDoc };
                  try{ window.db = dbInstance; }catch(_){ }
                  console.log('price_persistence: initialized firebase app and firestore');
                  return { db: dbInstance, fns: firestoreFns };
                }catch(err){ console.error('price_persistence: failed to initialize Firestore', err); throw err; }
              }

              async function readMaterialDoc(id){
                try{
                  const { db, fns } = await ensureDb();
                  if(!fns.doc || !fns.getDoc) throw new Error('firestore-fns-missing');
                  const ref = fns.doc(db, COLLECTION, String(id));
                  const snap = await fns.getDoc(ref);
                  if(snap && (typeof snap.exists === 'function' ? snap.exists() : snap.exists)) return snap.data ? snap.data() : null;
                  return null;
                }catch(err){ console.warn('price_persistence: readMaterialDoc error', id, err); return null; }
              }

              async function saveMaterialPrice(id, price){
                if(id == null) return; const num = Number(price); if(Number.isNaN(num)){ console.warn('price_persistence: invalid price', id, price); return; }
                try{
                  // price_persistence.js
                  // Lightweight, isolated persistence logic for the "#unified-price-grid" inputs.
                  // - Uses existing `window.db` Firestore instance if present (preferred).
                  // - Otherwise will attempt to initialize Firebase using `window.__FIREBASE_CONFIG`.
                  // - On init: populates inputs from `material_costs/{id}` docs.
                  // - On input/change/blur: saves price to Firestore using setDoc(..., { merge: true }).

                  (function(){
                    'use strict';

                    const COLLECTION = 'material_costs';
                    const DEBOUNCE_MS = 600;
                    const FIREBASE_BASE = 'https://www.gstatic.com/firebasejs/10.13.0/';

                    let dbInstance = null;
                    let firestoreFns = null; // { doc, getDoc, setDoc }
                    const debounceMap = new Map();

                    async function ensureDb(){
                      if(dbInstance && firestoreFns) return { db: dbInstance, fns: firestoreFns };

                      // Prefer existing initialized instance from firebase-init.js
                      if(window.db){
                        dbInstance = window.db;
                        try{
                          const mod = await import(FIREBASE_BASE + 'firebase-firestore.js');
                          firestoreFns = { doc: mod.doc, getDoc: mod.getDoc, setDoc: mod.setDoc };
                        }catch(e){ firestoreFns = firestoreFns || {}; }
                        console.log('price_persistence: using existing window.db');
                        return { db: dbInstance, fns: firestoreFns };
                      }

                      const cfg = window.__FIREBASE_CONFIG || null;
                      if(!cfg){
                        console.warn('price_persistence: no firebase config found (window.__FIREBASE_CONFIG) and no window.db. Persistence disabled.');
                        throw new Error('no-firebase-config');
                      }

                      try{
                        const appMod = await import(FIREBASE_BASE + 'firebase-app.js');
                        const fsMod = await import(FIREBASE_BASE + 'firebase-firestore.js');
                        const app = appMod.initializeApp(cfg);
                        dbInstance = fsMod.getFirestore(app);
                        firestoreFns = { doc: fsMod.doc, getDoc: fsMod.getDoc, setDoc: fsMod.setDoc };
                        try{ window.db = dbInstance; }catch(_){ }
                        console.log('price_persistence: initialized firebase app and firestore');
                        return { db: dbInstance, fns: firestoreFns };
                      }catch(err){
                        console.error('price_persistence: failed to initialize Firestore', err);
                        throw err;
                      }
                    }

                    async function readMaterialDoc(id){
                      try{
                        const { db, fns } = await ensureDb();
                        if(!fns.doc || !fns.getDoc) throw new Error('firestore-fns-missing');
                        const ref = fns.doc(db, COLLECTION, String(id));
                        const snap = await fns.getDoc(ref);
                        if(snap && (typeof snap.exists === 'function' ? snap.exists() : snap.exists)){
                          return typeof snap.data === 'function' ? snap.data() : snap.data;
                        }
                        return null;
                      }catch(err){
                        console.warn('price_persistence: readMaterialDoc error', id, err);
                        return null;
                      }
                    }

                    async function saveMaterialPrice(id, price){
                      if(id == null) return;
                      const num = Number(price);
                      if(Number.isNaN(num)){
                        console.warn('price_persistence: attempting to save invalid price for', id, price);
                        return;
                      }
                      try{
                        const { db, fns } = await ensureDb();
                        if(!fns.doc || !fns.setDoc) throw new Error('firestore-fns-missing');
                        const ref = fns.doc(db, COLLECTION, String(id));
                        const payload = { price: num, lastPriceDate: new Date().toISOString() };
                        await fns.setDoc(ref, payload, { merge: true });
                        console.log('price_persistence: saved', id, num);
                      }catch(err){
                        console.error('price_persistence: save failed for', id, err);
                        // don't rethrow; keep app usable
                      }
                    }

                    async function populateAllFromFirestore(){
                      const grid = document.getElementById('unified-price-grid'); if(!grid) return;
                      const tbody = grid.querySelector('tbody'); if(!tbody) return;
                      const inputs = Array.from(tbody.querySelectorAll('.unified-new-price'));
                      if(inputs.length === 0) return;

                      const concurrency = 8;
                      for(let i=0;i<inputs.length;i+=concurrency){
                        const batch = inputs.slice(i, i+concurrency);
                        const promises = batch.map(async inp => {
                          const id = inp.dataset && inp.dataset.id; if(!id) return null;
                          const data = await readMaterialDoc(id);
                          if(data && data.price !== undefined && data.price !== null){
                            try{ inp.value = Number(data.price).toFixed(2); }catch(_){ inp.value = data.price; }
                            const cur = tbody.querySelector(`.unified-current-price[data-id="${CSS.escape(id)}"]`);
                            if(cur) cur.textContent = Number(data.price).toFixed(2);
                          }
                          return id;
                        });
                        await Promise.all(promises);
                      }
                      console.log('price_persistence: populated inputs from Firestore');
                    }

                    function attachInputHandlers(inp){
                      if(!inp) return;
                      const id = inp.dataset && inp.dataset.id; if(!id) return;

                      function onInput(){
                        if(debounceMap.has(id)) clearTimeout(debounceMap.get(id));
                        const t = setTimeout(async ()=>{
                          debounceMap.delete(id);
                          await saveMaterialPrice(id, inp.value);
                        }, DEBOUNCE_MS);
                        debounceMap.set(id, t);
                      }

                      async function onImmediate(){
                        if(debounceMap.has(id)){ clearTimeout(debounceMap.get(id)); debounceMap.delete(id); }
                        await saveMaterialPrice(id, inp.value);
                      }

                      if(inp._pricePersistenceAttached) return; inp._pricePersistenceAttached = true;

                      inp.addEventListener('input', onInput);
                      inp.addEventListener('change', onImmediate);
                      inp.addEventListener('blur', onImmediate);
                      inp.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); onImmediate(); inp.blur(); } });
                    }

                    function attachHandlersToAll(){
                      const grid = document.getElementById('unified-price-grid'); if(!grid) return;
                      const tbody = grid.querySelector('tbody'); if(!tbody) return;
                      const inputs = Array.from(tbody.querySelectorAll('.unified-new-price'));
                      inputs.forEach(attachInputHandlers);
                    }

                    function observeGrid(){
                      const grid = document.getElementById('unified-price-grid'); if(!grid) return;
                      const tbody = grid.querySelector('tbody'); if(!tbody) return;
                      const mo = new MutationObserver(()=>{
                        setTimeout(()=>{
                          attachHandlersToAll();
                          populateAllFromFirestore().catch(()=>{});
                        }, 80);
                      });
                      mo.observe(tbody, { childList: true, subtree: true });
                    }

                    async function init(){
                      try{ await ensureDb(); }catch(_){ console.warn('price_persistence: Firestore unavailable; aborting initialization.'); return; }
                      attachHandlersToAll();
                      populateAllFromFirestore().catch(()=>{});
                      observeGrid();
                      console.log('price_persistence: initialized');
                    }

                    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

                    try{ window.pricePersistence = { saveMaterialPrice, populateAllFromFirestore, attachHandlersToAll }; }catch(_){ }

                  })();
