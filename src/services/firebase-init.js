// Firebase Initialization and Reviewer Guards
// Extracted from index.html to reduce file size

// Firebase configuration
if (!window.firebaseConfig) {
  window.firebaseConfig = {
    apiKey: "AIzaSyDLmZPE9teCYf2rMXd1AwT5yq4xlRSHcSk",
    authDomain: "delente-business.firebaseapp.com",
    projectId: "delente-business",
    storageBucket: "delente-business.appspot.com",
    messagingSenderId: "646706509650",
    appId: "1:646706509650:web:1eaa4b94d2990b6be9ac8b"
  };
}

window.ALLOW_ANON = true;

// Helper functions for role checking
function isReviewer() {
  try {
    return typeof getUserRole === 'function' && getUserRole() === 'reviewer';
  } catch(e) {
    return false;
  }
}

function isReadOnly() {
  try {
    if (typeof getUserRole !== 'function') return false;
    const r = getUserRole();
    return r === 'reviewer' || r === 'manager';
  } catch(e) {
    return false;
  }
}

function notifyReadOnly(message) {
  const msg = message || 'هذا الحساب في وضع المراجعة (قراءة فقط).';
  try {
    customDialog({ title: 'وضع المراجعة', message: msg });
  } catch(e) {
    try {
      alert(msg);
    } catch(_) {}
  }
}

// Install read-only guards for reviewers
function installReviewerReadOnlyGuards() {
  if (!window.db || window.__REVIEWER_GUARDS_INSTALLED) return;
  window.__REVIEWER_GUARDS_INSTALLED = true;

  try {
    const origCollection = db.collection.bind(db);
    const origDoc = db.doc.bind(db);
    const origBatch = db.batch ? db.batch.bind(db) : null;
    const origRunTx = db.runTransaction ? db.runTransaction.bind(db) : null;

    function wrapDocRef(ref) {
      if (!ref || ref.__wrappedReviewer) return ref;
      const w = Object.create(ref);
      ['set', 'update', 'delete'].forEach(fn => {
        if (typeof ref[fn] === 'function') {
          w[fn] = function() {
            if (isReadOnly()) {
              notifyReadOnly();
              return Promise.reject(new Error('read-only'));
            }
            return ref[fn].apply(ref, arguments);
          };
        }
      });
      w.__wrappedReviewer = true;
      return w;
    }

    function wrapCollectionRef(col) {
      if (!col || col.__wrappedReviewer) return col;
      const w = Object.create(col);
      if (typeof col.add === 'function') {
        w.add = function() {
          if (isReadOnly()) {
            notifyReadOnly();
            return Promise.reject(new Error('read-only'));
          }
          return col.add.apply(col, arguments);
        };
      }
      if (typeof col.doc === 'function') {
        w.doc = function() {
          const d = col.doc.apply(col, arguments);
          return wrapDocRef(d);
        };
      }
      w.__wrappedReviewer = true;
      return w;
    }

    db.collection = function(path) {
      const col = origCollection(path);
      return wrapCollectionRef(col);
    };

    db.doc = function(path) {
      const d = origDoc(path);
      return wrapDocRef(d);
    };

    if (origBatch) {
      db.batch = function() {
        const b = origBatch();
        const wrapper = {
          set() {
            if (isReadOnly()) {
              notifyReadOnly();
              return wrapper;
            }
            b.set.apply(b, arguments);
            return wrapper;
          },
          update() {
            if (isReadOnly()) {
              notifyReadOnly();
              return wrapper;
            }
            b.update.apply(b, arguments);
            return wrapper;
          },
          delete() {
            if (isReadOnly()) {
              notifyReadOnly();
              return wrapper;
            }
            b.delete.apply(b, arguments);
            return wrapper;
          },
          commit() {
            if (isReadOnly()) {
              notifyReadOnly();
              return Promise.reject(new Error('read-only'));
            }
            return b.commit();
          }
        };
        return wrapper;
      };
    }

    if (origRunTx) {
      db.runTransaction = function(updateFn) {
        if (isReadOnly()) {
          notifyReadOnly();
          return Promise.reject(new Error('read-only'));
        }
        return origRunTx(updateFn);
      };
    }
  } catch(e) {
    console.warn('Reviewer guards setup failed', e);
  }
}

function applyReviewerModeUI() {
  const badge = document.getElementById('reviewer-badge');
  if (badge) badge.classList.toggle('hidden', !isReadOnly());
}

// Auto-restore sales from cloud if localStorage is empty
window.autoRestoreSalesIfEmpty = async function() {
  try {
    if (!window.auth || !auth.currentUser) return;
    const raw = localStorage.getItem('cache_sales');
    if (raw && raw.length > 2) return;
    if (window.state && Array.isArray(state.sales) && state.sales.length > 0) return;

    const email = (auth.currentUser.email || '').toLowerCase();
    if (!email) return;
    if (!window.db) {
      console.warn('autoRestoreSalesIfEmpty: Firestore not ready');
      return;
    }

    try {
      const allSnap = await db.collection('sales').limit(1000).get();
      const allCount = allSnap.size;
      console.log(`📊 autoRestoreSalesIfEmpty: Total sales in cloud: ${allCount}`);

      const snap = await db.collection('sales').where('repEmail', '==', email).get();
      const arr = [];
      snap.forEach(doc => {
        const s = doc.data() || {};
        s._id = doc.id;
        if (!s.id) s.id = doc.id;
        arr.push(s);
      });

      if (arr.length < 50 && allCount > arr.length) {
        console.log(`⚠️ Only ${arr.length} sales for user, loading all ${allCount} sales from cloud`);
        allSnap.forEach(doc => {
          const s = doc.data() || {};
          s._id = doc.id;
          if (!s.id) s.id = doc.id;
          if (!arr.find(x => x.id === s.id)) arr.push(s);
        });
      }

      if (arr.length > 0) {
        try {
          localStorage.setItem('cache_sales', JSON.stringify(arr));
        } catch(e) {}
        try {
          localStorage.setItem('reps_local_ts', new Date().toISOString());
        } catch(e) {}
        window.state = window.state || {};
        state.sales = arr.slice(0, 500);
        try {
          if (typeof renderAllSales === 'function') renderAllSales('', '', 'all');
        } catch(e) {}
        try {
          if (typeof renderDashboard === 'function') renderDashboard();
        } catch(e) {}
        console.log('✅ autoRestoreSalesIfEmpty: restored', arr.length, 'sales for', email);
      } else {
        console.log('autoRestoreSalesIfEmpty: no sales found for', email);
      }
    } catch(e) {
      console.warn('autoRestoreSalesIfEmpty: query failed', e);
    }
  } catch(e) {
    console.warn('autoRestoreSalesIfEmpty failed', e);
  }
};

// Sync all local sales to cloud
window.syncAllSalesToCloud = async function() {
  try {
    if (!window.auth || !auth.currentUser) return;
    if (!window.db) {
      console.warn('syncAllSalesToCloud: DB not ready');
      return;
    }

    const raw = localStorage.getItem('cache_sales');
    if (!raw || raw.length <= 2) {
      console.log('📦 syncAllSalesToCloud: no sales in localStorage to sync');
      return;
    }

    try {
      const localSales = JSON.parse(raw);
      if (!Array.isArray(localSales) || localSales.length === 0) return;

      console.log(`📦 syncAllSalesToCloud: syncing ${localSales.length} sales to cloud...`);

      const cloudSnap = await db.collection('sales').limit(1000).get();
      const cloudIds = new Set();
      cloudSnap.forEach(doc => {
        cloudIds.add(doc.id);
        const data = doc.data();
        if (data.id) cloudIds.add(String(data.id));
      });

      let uploaded = 0;
      let batch = db.batch();
      let count = 0;

      for (const sale of localSales) {
        const id = String(sale.id || sale._id || '');
        if (!id || cloudIds.has(id)) continue;

        try {
          const ref = db.collection('sales').doc(id);
          batch.set(ref, { ...sale, synced: true, syncedAt: new Date().toISOString() }, { merge: true });
          uploaded++;
          count++;
          if (count >= 450) {
            await batch.commit();
            batch = db.batch();
            count = 0;
          }
        } catch(e) {
          console.warn(`Failed to sync sale ${id}:`, e);
        }
      }

      if (count > 0) await batch.commit();
      console.log(`✅ syncAllSalesToCloud: uploaded ${uploaded} new sales to cloud`);
    } catch(e) {
      console.error('syncAllSalesToCloud: parse failed', e);
    }
  } catch(e) {
    console.warn('syncAllSalesToCloud failed', e);
  }
};

// Initialize Firebase
function initFirebase() {
  try {
    if (!window.firebase) {
      console.warn('Firebase SDK not loaded');
      return false;
    }

    if (window.__FIREBASE_INIT_DONE) return true;

    var cfg = window.firebaseConfig || window.FIREBASE_CONFIG || null;
    if (!cfg) {
      console.warn('No firebaseConfig found on window.firebaseConfig or window.FIREBASE_CONFIG — provide it before loading this file');
      return false;
    }

    firebase.initializeApp(cfg);

    try {
      window.auth = firebase.auth();
      window.db = firebase.firestore();
      window.storage = firebase.storage();
      
      // Check if user is admin
      window.auth.onAuthStateChanged(user => {
        if (user && user.email) {
          window.isAdmin = user.email.includes('admin') || user.email === 'admin@delente.com';
          console.log(`👤 User: ${user.email}, isAdmin: ${window.isAdmin}`);
        } else {
          window.isAdmin = false;
        }
      });
    } catch (e) {
      console.warn('Firebase services not available after init', e);
    }

    window.__FIREBASE_INIT_DONE = true;
    window.CLOUD_ONLY = true;
    console.log('Firebase initialized (compat) — CLOUD_ONLY enabled');

    try {
      window.__DISABLE_AUTO_SEED_GLOBAL = true;
      window.__DISABLE_AUTO_SEED_COST_LISTS = true;
    } catch(_) {}

    try {
      installReviewerReadOnlyGuards();
    } catch(e) {
      console.warn('installReviewerReadOnlyGuards failed', e);
    }

    try {
      auth.onAuthStateChanged(async function(u) {
        if (u) {
          window.currentUser = u;
          try {
            await u.getIdToken(true);
            console.log('✅ Auth Token Refreshed - Write Access Granted');
          } catch(e) {
            console.warn('Token refresh failed:', e);
          }

          const unified = {
            id: u.uid,
            email: (u.email || '').toLowerCase(),
            name: (u.displayName || (u.email ? u.email.split('@')[0] : 'مستخدم')),
            firebase: true,
            data: {}
          };
          AuthSystem.setCurrentUser(unified);

          try {
            window.__rolesMap = window.__rolesMap || {};
            db.collection('roles').doc(u.uid).onSnapshot(snap => {
              if (snap.exists) {
                window.__rolesMap[u.uid] = snap.data().role || 'user';
                document.dispatchEvent(new Event('role-ready'));
              }
            }, err => console.warn('role doc snapshot error', err));
          } catch(e) {
            console.warn('setup role listener failed', e);
          }

          try { UIController.showApp(); } catch(e) { console.error('showApp error:', e); }
          try { initializeAppForUser(); } catch(e) { console.error('initializeAppForUser error:', e); }
          try { setupRealtimeListeners(); } catch(e) { console.error('setupRealtimeListeners error:', e); }
          try { if (typeof autoRestoreSalesIfEmpty === 'function') autoRestoreSalesIfEmpty(); } catch(e) { console.error('autoRestoreSalesIfEmpty error:', e); }

          setTimeout(() => {
            try { if (typeof syncAllSalesToCloud === 'function') syncAllSalesToCloud(); } catch(e) { console.error('syncAllSalesToCloud error:', e); }
          }, 2000);

          setTimeout(() => {
            try { if (typeof initRealtimeSync === 'function') initRealtimeSync(); } catch(e) { console.error('initRealtimeSync error:', e); }
          }, 500);

          setTimeout(() => {
            try { if (typeof initRealtimeRecovery === 'function') initRealtimeRecovery(); } catch(e) { console.error('initRealtimeRecovery error:', e); }
          }, 800);

          try { setPresenceOnline(); } catch(e) { console.error('setPresenceOnline error:', e); }

          setTimeout(() => {
            try {
              if (!window.__DISABLE_AUTO_SEED_GLOBAL && typeof seedDefaultsIfEmpty === 'function') {
                seedDefaultsIfEmpty();
              } else {
                console.log('⏭️ Auto-seeding disabled by flag; skipping seedDefaultsIfEmpty');
              }
            } catch(e) { console.error('seedDefaultsIfEmpty error:', e); }
          }, 1000);

          setTimeout(() => {
            try { if (typeof initLegacyCollectionsIfEmpty === 'function') initLegacyCollectionsIfEmpty(); } catch(e) { console.error('initLegacyCollectionsIfEmpty error:', e); }
          }, 1200);

          setTimeout(() => {
            try { if (typeof scheduleEnsureCoreData === 'function') scheduleEnsureCoreData(); } catch(e) { console.error('scheduleEnsureCoreData error:', e); }
          }, 1500);

          setTimeout(() => {
            try { if (typeof maybeAutoClosePreviousMonth === 'function') maybeAutoClosePreviousMonth(); } catch(e) { console.error('maybeAutoClosePreviousMonth error:', e); }
            try { if (typeof ensureDefaultActivePeriod === 'function') ensureDefaultActivePeriod(); } catch(e) { console.error('ensureDefaultActivePeriod error:', e); }
          }, 1800);

          setTimeout(() => {
            try {
              if (localStorage.getItem('gps_sharing_enabled') === '1') {
                if (typeof startLocationSharing === 'function') startLocationSharing();
              }
              if (typeof window.__gpsHeaderSync === 'function') window.__gpsHeaderSync();
            } catch(e) { console.error('GPS sharing error:', e); }
          }, 2000);

          setTimeout(() => {
            try { if (typeof autoFixChocolateVatOnce === 'function') autoFixChocolateVatOnce(); } catch(e) { console.error('autoFixChocolateVatOnce error:', e); }
          }, 2500);

          try { applyReviewerModeUI(); } catch(e) { console.error('applyReviewerModeUI error:', e); }
          try { applyRoleNavRestrictions(); } catch(e) { console.error('applyRoleNavRestrictions error:', e); }

          let tries = 0;
          const tmr = setInterval(() => {
            tries++;
            try { applyRoleNavRestrictions(); } catch(e) { console.error('roleNavRestrictions retry error:', e); }
            if (tries > 10) clearInterval(tmr);
          }, 1000);

        } else {
          try { AuthSystem.logout(); } catch(e) {}
          try { UIController.showLoginPage(); } catch(e) {}
          try { setPresenceOffline(); } catch(e) {}
        }

        try { UIController.updateCurrentUserDisplay(); } catch(e) {}
      });
    } catch(e) {
      console.warn('onAuthStateChanged setup failed', e);
    }

    return true;
  } catch (e) {
    console.warn('initFirebase error', e);
    return false;
  }
}

// Export to global scope
window.isReviewer = isReviewer;
window.isReadOnly = isReadOnly;
window.notifyReadOnly = notifyReadOnly;
window.installReviewerReadOnlyGuards = installReviewerReadOnlyGuards;
window.applyReviewerModeUI = applyReviewerModeUI;
window.initFirebase = initFirebase;

// Auto-initialize Firebase
try {
  initFirebase();
} catch(e) {
  console.error('Firebase auto-init failed', e);
}
