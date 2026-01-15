// Realtime Firestore Listeners and GPS Sharing
// Extracted from index.html to reduce file size

// Setup all realtime Firestore listeners for syncing data (backup)
function setupRealtimeListenersSyncBackup() {
  // ⚠️ منع التشغيل المتكرر - استخدام نفس الـ flag كـ inline-scripts.js
  if (window.__listenersAttached) {
    console.log('⏭️ Listeners already attached (from realtime-sync) - skipping');
    return;
  }
  window.__listenersAttached = true;
  
  if (!window.db || !window.state) {
    console.warn('Firestore غير جاهز بعد');
    return;
  }
  window.state = window.state || {};

  // Sales listeners
  try {
    const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
    const current = AuthSystem.getCurrentUser();

    const applySnap = function(snap) {
      const arr = [];
      snap.forEach(doc => {
        const d = doc.data() || {};
        d._id = doc.id;
        if (!d.id) d.id = doc.id;
        arr.push(d);
      });
      arr.sort((a, b) => {
        const ta = new Date(a.date || a.createdAt || 0).getTime();
        const tb = new Date(b.date || b.createdAt || 0).getTime();
        return tb - ta;
      });
      state.sales = arr.slice(0, 500);
      try {
        localStorage.setItem('cache_sales', JSON.stringify(state.sales));
      } catch(e) {}
      try {
        const textFilter = document.getElementById('search-sales-text')?.value || '';
        const dateFilter = document.getElementById('search-sales-date')?.value || '';
        const taxStatusFilter = document.getElementById('tax-status-filter')?.value || 'all';
        if (typeof renderAllSales === 'function') renderAllSales(textFilter, dateFilter, taxStatusFilter);
        else if (typeof renderSalesList === 'function') renderSalesList();
        if (typeof renderDashboard === 'function') renderDashboard();
      } catch(e) {}
    };

    const onErr = function(err) {
      console.warn('sales snapshot error', err);
      if (err && err.code === 'permission-denied') {
        try {
          handlePermissionDenied('sales');
        } catch(e) {}
      }
      try {
        const raw = localStorage.getItem('cache_sales');
        const cached = raw ? JSON.parse(raw) : [];
        if ((!state.sales || state.sales.length === 0) && Array.isArray(cached) && cached.length) {
          state.sales = cached;
          const textFilter = document.getElementById('search-sales-text')?.value || '';
          const dateFilter = document.getElementById('search-sales-date')?.value || '';
          const taxStatusFilter = document.getElementById('tax-status-filter')?.value || 'all';
          if (typeof renderAllSales === 'function') renderAllSales(textFilter, dateFilter, taxStatusFilter);
          if (typeof renderDashboard === 'function') renderDashboard();
        }
      } catch(e) {}
    };

    if (role === 'admin' || role === 'reviewer' || role === 'manager') {
      // SERVER-SIDE FILTERING: Only load current month's sales
      const now = new Date();
      const currentPeriod = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
      console.log(`📅 Admin sales query: period == ${currentPeriod}`);
      const unsub = db.collection('sales')
        .where('period', '==', currentPeriod)
        .orderBy('date', 'desc')
        .limit(500)
        .onSnapshot(applySnap, onErr);
      if (typeof window.storeSubscription === 'function') window.storeSubscription('sales_admin_sync', unsub);
    } else if ((role === 'rep' || role === 'user') && current && current.id) {
      const uid = String(current.id);
      const email = (current.email || '').toLowerCase();
      const byId = new Map();
      let salesErrCount = 0;

      const mergeAndRender = () => {
        const arr = Array.from(byId.values());
        arr.sort((a, b) => {
          const ta = new Date(a.date || a.createdAt || 0).getTime();
          const tb = new Date(b.date || b.createdAt || 0).getTime();
          return tb - ta;
        });
        state.sales = arr.slice(0, 500);
        try {
          localStorage.setItem('cache_sales', JSON.stringify(state.sales));
        } catch(e) {}
        try {
          if (typeof renderAllSales === 'function') renderAllSales('', '', 'all');
        } catch(e) {}
        try {
          if (typeof renderDashboard === 'function') renderDashboard();
        } catch(e) {}
      };

      db.collection('users').doc(uid).collection('invoices').onSnapshot(snap => {
        try {
          snap.docChanges().forEach(change => {
            if (change.type === 'removed') {
              try {
                byId.delete(change.doc.id);
              } catch(_) {}
              return;
            }
            const d = change.doc.data() || {};
            d._id = change.doc.id;
            if (!d.id) d.id = change.doc.id;
            byId.set(change.doc.id, d);
          });
        } catch(e) {
          snap.forEach(doc => {
            const d = doc.data() || {};
            d._id = doc.id;
            if (!d.id) d.id = doc.id;
            byId.set(doc.id, d);
          });
        }
        mergeAndRender();
      }, onErr);

      db.collection('sales').where('createdBy', '==', uid).onSnapshot(snap => {
        try {
          snap.docChanges().forEach(change => {
            if (change.type === 'removed') {
              try {
                byId.delete(change.doc.id);
              } catch(_) {}
              return;
            }
            const d = change.doc.data() || {};
            d._id = change.doc.id;
            if (!d.id) d.id = change.doc.id;
            byId.set(change.doc.id, d);
          });
        } catch(e) {
          snap.forEach(doc => {
            const d = doc.data() || {};
            d._id = doc.id;
            if (!d.id) d.id = doc.id;
            byId.set(doc.id, d);
          });
        }
        mergeAndRender();
      }, onErr);

      db.collection('sales').where('repId', '==', uid).onSnapshot(snap => {
        try {
          snap.docChanges().forEach(change => {
            if (change.type === 'removed') {
              try {
                byId.delete(change.doc.id);
              } catch(_) {}
              return;
            }
            const d = change.doc.data() || {};
            d._id = change.doc.id;
            if (!d.id) d.id = change.doc.id;
            byId.set(change.doc.id, d);
          });
        } catch(e) {
          snap.forEach(doc => {
            const d = doc.data() || {};
            d._id = doc.id;
            if (!d.id) d.id = doc.id;
            byId.set(doc.id, d);
          });
        }
        mergeAndRender();
      }, onErr);

      try {
        const currentRepDoc = (state.reps || []).find(r => (r.email || '').toLowerCase() === email) || (state.reps || []).find(r => (r.name || '') === (current && current.name));
        const repDocId = currentRepDoc && currentRepDoc.id ? String(currentRepDoc.id) : null;
        if (repDocId && repDocId !== uid) {
          db.collection('sales').where('repId', '==', repDocId).onSnapshot(snap => {
            try {
              snap.docChanges().forEach(change => {
                if (change.type === 'removed') {
                  try {
                    byId.delete(change.doc.id);
                  } catch(_) {}
                  return;
                }
                const d = change.doc.data() || {};
                d._id = change.doc.id;
                if (!d.id) d.id = change.doc.id;
                byId.set(change.doc.id, d);
              });
            } catch(e) {
              snap.forEach(doc => {
                const d = doc.data() || {};
                d._id = doc.id;
                if (!d.id) d.id = doc.id;
                byId.set(doc.id, d);
              });
            }
            mergeAndRender();
          }, onErr);
          db.collection('sales').where('repId', '==', repDocId).onSnapshot(() => {}, err => console.warn('sales repDocId query error', err));
        }
      } catch(e) {
        console.warn('setupRealtimeListeners: repDocId mapping failed', e);
      }

      db.collection('sales').where('createdByEmail', '==', email).onSnapshot(snap => {
        try {
          snap.docChanges().forEach(change => {
            if (change.type === 'removed') {
              try {
                byId.delete(change.doc.id);
              } catch(_) {}
              return;
            }
            const d = change.doc.data() || {};
            d._id = change.doc.id;
            if (!d.id) d.id = change.doc.id;
            byId.set(change.doc.id, d);
          });
        } catch(e) {
          snap.forEach(doc => {
            const d = doc.data() || {};
            d._id = doc.id;
            if (!d.id) d.id = doc.id;
            byId.set(doc.id, d);
          });
        }
        mergeAndRender();
      }, onErr);

      let repNameAttempts = 0;
      const setupRepNameListener = () => {
        try {
          repNameAttempts++;
          
          // 🔥 CRITICAL: إذا state.reps فارغة، احفظ الدالة لإعادة المحاولة لاحقاً
          if (!state.reps || state.reps.length === 0) {
            if (repNameAttempts === 1) {
              console.log('⏳ Reps not loaded yet - will retry when reps are available');
              window.__repListenerPending = setupRepNameListener;
              return;
            }
          }
          
          const currentRepDoc = (state.reps || []).find(r => (r.email || '').toLowerCase() === email);
          const repName = currentRepDoc ? currentRepDoc.name : null;
          if (repName) {
            console.log('✅ Rep listener: watching sales where repName==', repName);
            db.collection('sales').where('repName', '==', repName).onSnapshot(snap => {
              console.log('📊 Rep sales snapshot received:', snap.size, 'invoices for', repName);
              try {
                snap.docChanges().forEach(change => {
                  if (change.type === 'removed') {
                    try {
                      byId.delete(change.doc.id);
                    } catch(_) {}
                    return;
                  }
                  const d = change.doc.data() || {};
                  d._id = change.doc.id;
                  if (!d.id) d.id = change.doc.id;
                  console.log(' - Invoice:', d.invoiceNumber, 'repName:', d.repName, 'total:', d.total);
                  byId.set(change.doc.id, d);
                });
              } catch(e) {
                snap.forEach(doc => {
                  const d = doc.data() || {};
                  d._id = doc.id;
                  if (!d.id) d.id = doc.id;
                  byId.set(doc.id, d);
                });
              }
              mergeAndRender();
            }, err => console.warn('sales repName query error', err));
          } else {
            if (repNameAttempts < 4) {
              console.warn('⚠️ Could not find rep name for email:', email, '- retrying in 2 seconds (attempt', repNameAttempts, ')');
              setTimeout(setupRepNameListener, 2000);
            } else {
              console.warn('⚠️ Rep name not found after retries for email:', email);
            }
          }
        } catch(e) {
          console.warn('setupRealtimeListeners: repName listener failed', e);
          if (repNameAttempts < 4) setTimeout(setupRepNameListener, 2000);
        }
      };
      setupRepNameListener();

      const salesErrorHandler = err => {
        salesErrCount++;
        console.warn('sales legacy query error', err);
        if (salesErrCount >= 3) {
          tryBroadSalesFallback();
        }
      };
      db.collection('sales').where('createdBy', '==', uid).onSnapshot(() => {}, salesErrorHandler);
      db.collection('sales').where('repId', '==', uid).onSnapshot(() => {}, salesErrorHandler);
      db.collection('sales').where('createdByEmail', '==', email).onSnapshot(() => {}, salesErrorHandler);

      try {
        const currentRepDoc = (state.reps || []).find(r => (r.email || '').toLowerCase() === email) || (state.reps || []).find(r => (r.name || '') === (current && current.name));
        const repDocId = currentRepDoc && currentRepDoc.id ? String(currentRepDoc.id) : null;
        if (repDocId && repDocId !== uid) {
          db.collection('sales').where('repId', '==', repDocId).onSnapshot(() => {}, salesErrorHandler);
        }
      } catch(e) {}

      db.collection('users').doc(uid).collection('invoices').onSnapshot(() => {}, err => console.warn('user-invoices subcollection error', err));

      function tryBroadSalesFallback() {
        db.collection('sales').limit(500).onSnapshot(snap => {
          snap.forEach(doc => {
            const d = doc.data() || {};
            d._id = doc.id;
            if (!d.id) d.id = doc.id;
            byId.set(doc.id, d);
          });
          mergeAndRender();
        }, err => console.warn('broad sales fallback failed', err));
      }

      setTimeout(() => {
        if ((!state.sales || state.sales.length === 0)) {
          try {
            const raw = localStorage.getItem('cache_sales');
            const cached = raw ? JSON.parse(raw) : [];
            if (Array.isArray(cached) && cached.length) {
              state.sales = cached;
              if (typeof renderDashboard === 'function') renderDashboard();
            }
          } catch(e) {}
        }
      }, 2000);
    } else {
      db.collection('sales').onSnapshot(applySnap, onErr);
    }
  } catch(e) {
    console.warn('sales listener init failed', e);
  }

  // Customers listeners
  try {
    const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
    const current = AuthSystem.getCurrentUser();

    if (role === 'admin') {
      db.collection('customers').onSnapshot(function(snap) {
        if (snap.metadata && snap.metadata.hasPendingWrites) {
          try {
            let maxTs = null;
            snap.forEach(doc => {
              const d = doc.data() || {};
              const u = d && d.updatedAt ? (d.updatedAt.toDate ? d.updatedAt.toDate().toISOString() : (new Date(d.updatedAt).toISOString())) : null;
              if (u) maxTs = (!maxTs || new Date(u) > new Date(maxTs)) ? u : maxTs;
            });
            const localTs = localStorage.getItem('customers_local_ts') || null;
            if (maxTs && localTs) {
              if (new Date(maxTs) <= new Date(localTs)) {
                console.log('🔄 customers listener: ignoring pending write (local) — cloud not newer', { maxTs, localTs });
                return;
              }
              console.log('🔄 customers listener: pendingWrites but cloud newer — applying overlay', { maxTs, localTs });
            } else {
              console.log('🔄 customers listener: ignoring pending write (local) — missing timestamps', { maxTs, localTs });
              return;
            }
          } catch(_) {
            console.log('🔄 customers listener: timestamp compare failed');
            return;
          }
        }
        const arr = [];
        snap.forEach(doc => {
          const d = doc.data();
          d._id = doc.id;
          if (!d.id) d.id = doc.id;
          arr.push(d);
        });
        state.customers = arr;
        try {
          localStorage.setItem('cache_customers', JSON.stringify(arr));
          localStorage.setItem('customers_local_ts', new Date().toISOString());
        } catch(e) {}
        try {
          if (typeof renderCustomerList === 'function') renderCustomerList();
        } catch(e) {}
        try {
          if (typeof updateAllCustomerDropdowns === 'function') updateAllCustomerDropdowns();
        } catch(e) {}
        try {
          attemptDeleteSpecificCustomersOnce();
        } catch(e) {}
      }, err => {
        console.warn('customers snapshot error', err);
        if (err && err.code === 'permission-denied') {
          try {
            handlePermissionDenied('customers');
          } catch(e) {}
        }
        try {
          const raw = localStorage.getItem('cache_customers');
          const cached = raw ? JSON.parse(raw) : [];
          if ((!state.customers || state.customers.length === 0) && Array.isArray(cached) && cached.length) {
            state.customers = cached;
            if (typeof renderCustomerList === 'function') renderCustomerList();
            if (typeof updateAllCustomerDropdowns === 'function') updateAllCustomerDropdowns();
          }
        } catch(e) {}
      });
    } else if ((role === 'rep' || role === 'user') && current && current.id) {
      const uid = String(current.id);
      const byId = new Map();
      let custErrCount = 0;

      const applyAndRender = () => {
        const arr = Array.from(byId.values());
        state.customers = arr;
        try {
          localStorage.setItem('cache_customers', JSON.stringify(arr));
        } catch(e) {}
        try {
          if (typeof renderCustomerList === 'function') renderCustomerList();
        } catch(e) {}
        try {
          if (typeof updateAllCustomerDropdowns === 'function') updateAllCustomerDropdowns();
        } catch(e) {}
      };

      const shouldApplySnapshot = (snap, localKey) => {
        try {
          if (!snap.metadata || !snap.metadata.hasPendingWrites) return true;
          let maxTs = null;
          snap.forEach(doc => {
            const d = doc.data() || {};
            const u = d && d.updatedAt ? (d.updatedAt.toDate ? d.updatedAt.toDate().toISOString() : (new Date(d.updatedAt).toISOString())) : null;
            if (u) maxTs = (!maxTs || new Date(u) > new Date(maxTs)) ? u : maxTs;
          });
          const localTs = localStorage.getItem(localKey) || null;
          if (!maxTs || !localTs) return false;
          return new Date(maxTs) > new Date(localTs);
        } catch(e) {
          console.log('listener: timestamp compare failed', e);
          return false;
        }
      };

      db.collection('customers').where('assignedRepId', '==', uid).onSnapshot(function(snap) {
        if (!shouldApplySnapshot(snap, 'customers_local_ts')) {
          console.log('🔄 customers(rep) listener: skipping (local newer or missing ts)');
          return;
        }
        snap.forEach(doc => {
          const d = doc.data();
          d._id = doc.id;
          if (!d.id) d.id = doc.id;
          byId.set(doc.id, d);
        });
        applyAndRender();
      }, err => {
        console.warn('customers snapshot (rep-owned) error', err);
        if (err && err.code === 'permission-denied') {
          try {
            handlePermissionDenied('customers');
          } catch(e) {}
        }
        try {
          const raw = localStorage.getItem('cache_customers');
          const cached = raw ? JSON.parse(raw) : [];
          if ((!state.customers || state.customers.length === 0) && Array.isArray(cached) && cached.length) {
            state.customers = cached;
            if (typeof renderCustomerList === 'function') renderCustomerList();
            if (typeof updateAllCustomerDropdowns === 'function') updateAllCustomerDropdowns();
          }
        } catch(e) {}
        custErrCount++;
        if (custErrCount >= 3) tryBroadCustomersFallback();
      });

      db.collection('customers').where('repId', '==', uid).onSnapshot(function(snap) {
        if (!shouldApplySnapshot(snap, 'customers_local_ts')) {
          console.log('🔄 customers(legacy) listener: skipping (local newer or missing ts)');
          return;
        }
        snap.forEach(doc => {
          const d = doc.data();
          d._id = doc.id;
          if (!d.id) d.id = doc.id;
          byId.set(doc.id, d);
        });
        applyAndRender();
      }, err => {
        console.warn('customers snapshot (legacy repId) error', err);
        custErrCount++;
        if (custErrCount >= 3) tryBroadCustomersFallback();
      });

      db.collection('customers').where('ownerId', '==', uid).onSnapshot(function(snap) {
        if (!shouldApplySnapshot(snap, 'customers_local_ts')) {
          console.log('🔄 customers(owner) listener: skipping (local newer or missing ts)');
          return;
        }
        snap.forEach(doc => {
          const d = doc.data();
          d._id = doc.id;
          if (!d.id) d.id = doc.id;
          byId.set(doc.id, d);
        });
        applyAndRender();
      }, err => {
        console.warn('customers snapshot (legacy ownerId) error', err);
        custErrCount++;
        if (custErrCount >= 3) tryBroadCustomersFallback();
      });

      function tryBroadCustomersFallback() {
        db.collection('customers').limit(500).onSnapshot(snap => {
          snap.forEach(doc => {
            const d = doc.data();
            d._id = doc.id;
            if (!d.id) d.id = doc.id;
            byId.set(doc.id, d);
          });
          applyAndRender();
        }, err => console.warn('broad customers fallback failed', err));
      }
    } else {
      db.collection('customers').onSnapshot(function(snap) {
        const arr = [];
        snap.forEach(doc => {
          const d = doc.data();
          d._id = doc.id;
          if (!d.id) d.id = doc.id;
          arr.push(d);
        });
        state.customers = arr;
        try {
          localStorage.setItem('cache_customers', JSON.stringify(arr));
        } catch(e) {}
        try {
          if (typeof renderCustomerList === 'function') renderCustomerList();
        } catch(e) {}
        try {
          if (typeof updateAllCustomerDropdowns === 'function') updateAllCustomerDropdowns();
        } catch(e) {}
      }, err => {
        console.warn('customers snapshot (other role) error', err);
        if (err && err.code === 'permission-denied') {
          try {
            handlePermissionDenied('customers');
          } catch(e) {}
        }
        try {
          const raw = localStorage.getItem('cache_customers');
          const cached = raw ? JSON.parse(raw) : [];
          if ((!state.customers || state.customers.length === 0) && Array.isArray(cached) && cached.length) {
            state.customers = cached;
            if (typeof renderCustomerList === 'function') renderCustomerList();
            if (typeof updateAllCustomerDropdowns === 'function') updateAllCustomerDropdowns();
          }
        } catch(e) {}
      });
    }
  } catch(e) {
    console.warn('customers listener init failed', e);
  }

  // Products listener
  try {
    db.collection('products').onSnapshot(function(snap) {
      if (snap.metadata && snap.metadata.hasPendingWrites) {
        try {
          let maxTs = null;
          snap.forEach(doc => {
            const d = doc.data() || {};
            const u = d && d.updatedAt ? (d.updatedAt.toDate ? d.updatedAt.toDate().toISOString() : (new Date(d.updatedAt).toISOString())) : null;
            if (u) maxTs = (!maxTs || new Date(u) > new Date(maxTs)) ? u : maxTs;
          });
          const localTs = localStorage.getItem('products_local_ts') || null;
          if (maxTs && localTs) {
            if (new Date(maxTs) <= new Date(localTs)) {
              console.log('🔄 products listener: ignoring pending write (local) — cloud not newer', { maxTs, localTs });
              return;
            }
            console.log('🔄 products listener: pendingWrites but cloud newer — applying overlay', { maxTs, localTs });
          } else {
            console.log('🔄 products listener: missing timestamps; ignoring pending write', { maxTs, localTs });
            return;
          }
        } catch(_) {
          console.log('🔄 products listener: ts compare failed; ignoring');
          return;
        }
      }
      const arr = [];
      snap.forEach(doc => {
        const d = doc.data() || {};
        d._id = doc.id;
        if (!d.id) d.id = doc.id;
        arr.push(d);
      });
      state.products = arr;
      try {
        localStorage.setItem('cache_products', JSON.stringify(arr));
        localStorage.setItem('products_local_ts', new Date().toISOString());
      } catch(e) {}
      try {
        if (typeof renderProductList === 'function') renderProductList('');
      } catch(e) {}
    }, err => {
      console.warn('products snapshot error', err);
      if (err && err.code === 'permission-denied') {
        try {
          handlePermissionDenied('products');
        } catch(e) {}
      }
      try {
        const raw = localStorage.getItem('cache_products');
        const cached = raw ? JSON.parse(raw) : [];
        if ((!state.products || state.products.length === 0) && Array.isArray(cached) && cached.length) {
          state.products = cached;
          if (typeof renderProductList === 'function') renderProductList('');
        }
      } catch(e) {}
    });
  } catch(e) {
    console.warn('products listener init failed', e);
  }

  // Price lists listener
  try {
    db.collection('priceLists').onSnapshot(function(snap) {
      if (snap.metadata && snap.metadata.hasPendingWrites) {
        try {
          let maxTs = null;
          snap.forEach(doc => {
            const d = doc.data() || {};
            const u = d && d.updatedAt ? (d.updatedAt.toDate ? d.updatedAt.toDate().toISOString() : (new Date(d.updatedAt).toISOString())) : null;
            if (u) maxTs = (!maxTs || new Date(u) > new Date(maxTs)) ? u : maxTs;
          });
          const localTs = localStorage.getItem('priceLists_local_ts') || null;
          if (maxTs && localTs) {
            if (new Date(maxTs) <= new Date(localTs)) {
              console.log('🔄 priceLists listener: ignoring pending write (local) — cloud not newer', { maxTs, localTs });
              return;
            }
            console.log('🔄 priceLists listener: pendingWrites but cloud newer — applying overlay', { maxTs, localTs });
          } else {
            console.log('🔄 priceLists listener: missing timestamps; ignoring pending write', { maxTs, localTs });
            return;
          }
        } catch(_) {
          console.log('🔄 priceLists listener: ts compare failed; ignoring');
          return;
        }
      }
      const arr = [];
      snap.forEach(doc => {
        const d = doc.data() || {};
        const pl = { id: doc.id, name: d.name || d.title || doc.id, productPrices: {} };
        if (d.productPrices && typeof d.productPrices === 'object') {
          pl.productPrices = d.productPrices;
        } else if (d.prices && typeof d.prices === 'object') {
          pl.productPrices = d.prices;
        } else if (d.map && typeof d.map === 'object') {
          pl.productPrices = d.map;
        } else {
          const pp = {};
          Object.keys(d).forEach(k => {
            if (/^\d+$/.test(k) && typeof d[k] === 'number') pp[k] = d[k];
          });
          pl.productPrices = pp;
        }
        arr.push(pl);
      });
      if (arr.length > 0) {
        state.priceLists = arr;
        try {
          localStorage.setItem('cache_priceLists', JSON.stringify(arr));
          localStorage.setItem('priceLists_local_ts', new Date().toISOString());
        } catch(e) {}
        try {
          if (typeof renderSettings === 'function') renderSettings(document.getElementById('search-products')?.value || '');
        } catch(e) {}
        try {
          updateAllPriceListDropdowns();
        } catch(e) {}
        try {
          if (typeof renderPriceListsPage === 'function') renderPriceListsPage();
        } catch(e) {}
        try {
          if (typeof renderCustomerList === 'function') renderCustomerList(document.getElementById('search-customers')?.value || '');
        } catch(e) {}
      }
    }, err => {
      console.warn('priceLists snapshot error', err);
      if (err && err.code === 'permission-denied') {
        try {
          handlePermissionDenied('priceLists');
        } catch(e) {}
      }
      if (err && err.code === 'permission-denied') {
        if ((!state.priceLists || !state.priceLists.length) && Array.isArray(window.EMBEDDED_PRICE_LISTS_BACKUP_2025)) {
          state.priceLists = window.EMBEDDED_PRICE_LISTS_BACKUP_2025.map(pl => ({ id: pl.id, name: pl.name, productPrices: pl.productPrices || {} }));
          console.log('⚠️ استخدمت النسخة المدمجة للقوائم بسبب رفض الصلاحيات');
          try {
            updateAllPriceListDropdowns();
          } catch(e) {}
          try {
            if (typeof renderPriceListsPage === 'function') renderPriceListsPage();
          } catch(e) {}
          try {
            if (typeof renderCustomerList === 'function') renderCustomerList(document.getElementById('search-customers')?.value || '');
          } catch(e) {}
        }
      }
      try {
        const raw = localStorage.getItem('cache_priceLists');
        const cached = raw ? JSON.parse(raw) : [];
        if ((!state.priceLists || state.priceLists.length === 0) && Array.isArray(cached) && cached.length) {
          state.priceLists = cached;
          try {
            updateAllPriceListDropdowns();
          } catch(e) {}
          try {
            if (typeof renderPriceListsPage === 'function') renderPriceListsPage();
          } catch(e) {}
          try {
            if (typeof renderCustomerList === 'function') renderCustomerList(document.getElementById('search-customers')?.value || '');
          } catch(e) {}
        }
      } catch(e) {}
    });
  } catch(e) {
    console.warn('priceLists listener init failed', e);
  }

  // Reps listener
  try {
    db.collection('reps').onSnapshot(function(snap) {
      if (snap.metadata && snap.metadata.hasPendingWrites) {
        try {
          let maxTs = null;
          snap.forEach(doc => {
            const d = doc.data() || {};
            const u = d && d.updatedAt ? (d.updatedAt.toDate ? d.updatedAt.toDate().toISOString() : (new Date(d.updatedAt).toISOString())) : null;
            if (u) maxTs = (!maxTs || new Date(u) > new Date(maxTs)) ? u : maxTs;
          });
          const localTs = localStorage.getItem('reps_local_ts') || null;
          if (maxTs && localTs) {
            if (new Date(maxTs) <= new Date(localTs)) {
              console.log('🔄 reps listener: ignoring pending write (local) — cloud not newer', { maxTs, localTs });
              return;
            }
            console.log('🔄 reps listener: pendingWrites but cloud newer — applying overlay', { maxTs, localTs });
          } else {
            console.log('🔄 reps listener: missing timestamps; ignoring pending write', { maxTs, localTs });
            return;
          }
        } catch(_) {
          console.log('🔄 reps listener: ts compare failed; ignoring');
          return;
        }
      }
      const arr = [];
      snap.forEach(doc => {
        const d = doc.data();
        d.id = doc.id;
        arr.push(d);
      });
      state.reps = arr;
      console.log(`✅ reps loaded: ${arr.length} items`);
      try {
        localStorage.setItem('reps_local_ts', new Date().toISOString());
      } catch(e) {}
      
      // 🔥 CRITICAL: إعادة تفعيل setupRepNameListener بعد تحميل المناديب
      if (typeof window.__repListenerPending === 'function') {
        console.log('🔄 Reps loaded - retrying rep name listener setup');
        window.__repListenerPending();
        delete window.__repListenerPending;
      }
      
      try {
        if (typeof renderReps === 'function') renderReps();
      } catch(e) {}
      try {
        const simpleIds = ['sale-rep', 'customer-rep', 'new-dispatch-rep', 'spreadsheet-rep', 'debt-rep-filter', 'dashboard-rep-filter'];
        simpleIds.forEach(id => {
          const el = document.getElementById(id);
          if (el && typeof populateRepDropdown === 'function') populateRepDropdown(el);
        });
        const reportIds = ['daily-report-rep', 'range-report-rep', 'monthly-report-rep', 'recon-report-rep'];
        reportIds.forEach(id => {
          const el = document.getElementById(id);
          if (el && typeof populateRepDropdownReports === 'function') populateRepDropdownReports(el);
        });
      } catch(e) {}
    }, err => console.warn('reps snapshot error', err));
  } catch(e) {
    console.warn('reps listener init failed', e);
  }

  // User doc listener for chains
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      db.collection('users').doc(currentUser.uid).onSnapshot(function(snap) {
        if (!snap.exists) return;
        const data = snap.data() || {};
        const appState = data.appState || {};
        if (Array.isArray(appState.chains)) {
          state.chains = appState.chains;
          try {
            localStorage.setItem('customerChains', JSON.stringify(appState.chains));
          } catch(e) {}
          try {
            if (typeof renderChainsDisplay === 'function') renderChainsDisplay();
          } catch(e) {}
          console.log('📦 Loaded chains from cloud:', appState.chains.length);
        }
      }, err => console.warn('user doc snapshot error', err));
    }
  } catch(e) {
    console.warn('user doc listener init failed', e);
  }

  // Users listener (admin only)
  try {
    const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
    if (role === 'admin') {
      db.collection('users').onSnapshot(function(snap) {
        const usersArr = [];
        snap.forEach(doc => {
          const d = doc.data();
          d._id = doc.id;
          if (!d.uid) d.uid = doc.id;
          if (d.email) {
            try {
              d.email = String(d.email).toLowerCase();
            } catch(_) {}
          }
          usersArr.push(d);
        });
        state.users = usersArr;
        try {
          UIController.updateCurrentUserDisplay();
          if (typeof renderUsersTable === 'function') renderUsersTable();
        } catch(e) {}
      }, err => console.warn('users snapshot error', err));
    }
  } catch(e) {
    console.warn('users listener init failed', e);
  }

  // Presence listener (admin only)
  try {
    const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
    if (role === 'admin') {
      db.collection('presence').onSnapshot(function(snap) {
        const arr = [];
        snap.forEach(doc => {
          const d = doc.data();
          d._id = doc.id;
          arr.push(d);
        });
        state.presence = arr;
        try {
          if (Array.isArray(state.users) && state.users.length) {
            const byId = new Map(arr.map(p => [String(p.uid || p._id || ''), p]));
            state.users = state.users.map(u => {
              const p = byId.get(String(u._id || u.uid || ''));
              const merged = Object.assign({}, u);
              if (p) {
                if ((!merged.email || merged.email === '') && p.email) merged.email = String(p.email).toLowerCase();
                merged.online = (p.online !== false);
                try {
                  if ((!u.email || u.email === '') && p.email && db) {
                    db.collection('users').doc(String(u._id)).set({ email: String(p.email).toLowerCase() }, { merge: true }).catch(() => {});
                  }
                } catch(_e) {}
              } else {
                merged.online = (typeof u.online !== 'undefined') ? !!u.online : false;
              }
              return merged;
            });
          }
        } catch(_) {}
        try {
          renderRepLocations();
        } catch(e) {}
        try {
          renderRepMap();
        } catch(e) {}
        try {
          if (typeof renderUsersTable === 'function') renderUsersTable();
        } catch(e) {}
      }, err => console.warn('presence snapshot error', err));
    }
  } catch(e) {
    console.warn('presence listener init failed', e);
  }

  // Dispatch notes listener
  try {
    db.collection('dispatchNotes').onSnapshot(function(snap) {
      const arr = [];
      snap.forEach(doc => {
        const d = doc.data() || {};
        d._id = doc.id;
        if (!d.id) d.id = doc.id;
        arr.push(d);
      });
      arr.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      state.dispatchNotes = arr;
      try {
        localStorage.setItem('cache_dispatchNotes', JSON.stringify(arr));
      } catch(e) {}
      try {
        if (typeof renderDispatchPage === 'function') renderDispatchPage();
      } catch(e) {}
    }, err => {
      console.warn('dispatchNotes snapshot error', err);
      if (err && err.code === 'permission-denied') {
        try {
          const raw = localStorage.getItem('cache_dispatchNotes');
          const cached = raw ? JSON.parse(raw) : [];
          if ((!state.dispatchNotes || state.dispatchNotes.length === 0) && cached.length) {
            state.dispatchNotes = cached;
            if (typeof renderDispatchPage === 'function') renderDispatchPage();
          }
        } catch(e) {}
      }
    });
  } catch(e) {
    console.warn('dispatchNotes listener init failed', e);
  }

  // Daily collections listener
  try {
    db.collection('daily_collections').onSnapshot(function(snap) {
      const arr = [];
      snap.forEach(doc => {
        const d = doc.data() || {};
        d.id = doc.id;
        arr.push(d);
      });
      state.dailyCollections = arr;
      try {
        localStorage.setItem('cache_daily_collections', JSON.stringify(arr));
      } catch(e) {}
    }, err => {
      console.warn('daily_collections snapshot error', err);
      try {
        const raw = localStorage.getItem('cache_daily_collections');
        const cached = raw ? JSON.parse(raw) : [];
        if ((!state.dailyCollections || state.dailyCollections.length === 0) && cached.length) {
          state.dailyCollections = cached;
        }
      } catch(e) {}
    });
  } catch(e) {
    console.warn('daily_collections listener init failed', e);
  }

  // Promotions listener
  try {
    db.collection('promotions').onSnapshot(function(snap) {
      const arr = [];
      snap.forEach(doc => {
        const d = doc.data() || {};
        d.id = doc.id;
        arr.push(d);
      });
      state.promotions = arr;
      try {
        localStorage.setItem('cache_promotions', JSON.stringify(arr));
      } catch(e) {}
      try {
        if (typeof renderPromotions === 'function') renderPromotions();
      } catch(e) {}
      try {
        if (typeof updateAllSalePrices === 'function') updateAllSalePrices();
      } catch(e) {}
    }, err => {
      console.warn('promotions snapshot error', err);
      if (err && err.code === 'permission-denied') {
        try {
          handlePermissionDenied('promotions');
        } catch(e) {}
      }
      try {
        const raw = localStorage.getItem('cache_promotions');
        if (raw) state.promotions = JSON.parse(raw);
      } catch(e) {}
    });
  } catch(e) {
    console.warn('promotions listener init failed', e);
  }

  // Opening balances listener
  try {
    db.collection('openingBalances').onSnapshot(function(snap) {
      const arr = [];
      snap.forEach(doc => {
        const d = doc.data() || {};
        d.id = doc.id;
        arr.push(d);
      });
      state.openingBalances = arr;
      try {
        localStorage.setItem('cache_openingBalances', JSON.stringify(arr));
      } catch(e) {}
    }, err => {
      console.warn('openingBalances snapshot error', err);
      try {
        const raw = localStorage.getItem('cache_openingBalances');
        if (raw) state.openingBalances = JSON.parse(raw);
      } catch(e) {}
    });
  } catch(e) {
    console.warn('openingBalances listener init failed', e);
  }

  // Global settings listener
  try {
    db.collection('settings').doc('global-settings').onSnapshot(function(snap) {
      if (snap.exists) {
        const settings = snap.data() || {};
        state.settings = state.settings || {};
        if (settings.salesTarget !== undefined) {
          state.settings.salesTarget = settings.salesTarget;
          try {
            const input = document.getElementById('sales-target-input');
            if (input) {
              input.value = settings.salesTarget;
            }
          } catch(e) {}
          try {
            if (typeof renderDashboard === 'function') renderDashboard();
          } catch(e) {}
        }
        console.log('تم تحديث الإعدادات من السحابة:', settings);
      }
    }, err => {
      console.warn('settings snapshot error', err);
    });
  } catch(e) {
    console.warn('settings listener init failed', e);
  }
}

// GPS Location Sharing Module
(function() {
  const LS_GPS = 'gps_sharing_enabled';
  window.__gpsWatchId = null;
  window.__repsMap = null;
  window.__repMarkers = {};

  window.__gpsHeaderSync = function() {
    try {
      const btn = document.getElementById('gps-toggle-btn');
      if (!btn) return;
      btn.classList.remove('bg-gray-200', 'hover:bg-gray-300', 'text-gray-800');
      const enabled = localStorage.getItem(LS_GPS) === '1';
      btn.textContent = enabled ? 'GPS ON' : 'GPS OFF';
      btn.classList.toggle('bg-green-500', enabled);
      btn.classList.toggle('hover:bg-green-600', enabled);
      btn.classList.toggle('text-white', enabled);
      btn.classList.toggle('bg-red-500', !enabled);
      btn.classList.toggle('hover:bg-red-600', !enabled);
      btn.classList.toggle('text-white', !enabled);
    } catch(e) {}
  };

  window.startLocationSharing = function() {
    try {
      const statusEl = document.getElementById('gps-share-status');
      if (!navigator.geolocation) {
        if (statusEl) statusEl.textContent = 'المتصفح لا يدعم الموقع';
        return;
      }
      if (!auth || !auth.currentUser) {
        if (statusEl) statusEl.textContent = 'لم يتم تسجيل الدخول';
        return;
      }
      if (window.__gpsWatchId != null) return;
      const opts = { enableHighAccuracy: true, maximumAge: 15000, timeout: 15000 };
      window.__gpsWatchId = navigator.geolocation.watchPosition(async function(pos) {
        try {
          const { latitude: lat, longitude: lng, accuracy } = pos.coords || {};
          const uid = auth.currentUser.uid;
          await db.collection('presence').doc(uid).set({
            uid,
            email: (auth.currentUser.email || '').toLowerCase(),
            online: true,
            location: { lat, lng, accuracy },
            locationUpdatedAt: serverTs(),
            sharing: true
          }, { merge: true });
          const s = `آخر تحديث: ${new Date().toLocaleTimeString('ar-EG')}`;
          if (statusEl) statusEl.textContent = s;
        } catch(e) {}
      }, function(err) {
        if (statusEl) statusEl.textContent = 'تعذر تحديد الموقع';
        console.warn('GPS error', err);
      }, opts);
      try {
        localStorage.setItem(LS_GPS, '1');
      } catch(e) {}
      try {
        window.__gpsHeaderSync();
      } catch(e) {}
    } catch(e) {
      console.warn('startLocationSharing failed', e);
    }
  };

  window.stopLocationSharing = function() {
    try {
      const statusEl = document.getElementById('gps-share-status');
      if (window.__gpsWatchId != null) {
        try {
          navigator.geolocation.clearWatch(window.__gpsWatchId);
        } catch(e) {}
        window.__gpsWatchId = null;
      }
      try {
        localStorage.removeItem(LS_GPS);
      } catch(e) {}
      if (statusEl) statusEl.textContent = 'متوقف';
      if (auth && auth.currentUser && db) {
        const uid = auth.currentUser.uid;
        db.collection('presence').doc(uid).set({ sharing: false }, { merge: true }).catch(() => {});
      }
      try {
        window.__gpsHeaderSync();
      } catch(e) {}
    } catch(e) {
      console.warn('stopLocationSharing failed', e);
    }
  };

  window.setupGpsSharingControls = function() {
    try {
      const toggle = document.getElementById('gps-share-toggle');
      const statusEl = document.getElementById('gps-share-status');
      const adminBox = document.getElementById('admin-gps-list');
      if (!toggle) return;
      const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
      if (adminBox) adminBox.classList.toggle('hidden', role !== 'admin');
      const enabled = localStorage.getItem(LS_GPS) === '1';
      toggle.checked = enabled;
      if (enabled) {
        statusEl && (statusEl.textContent = 'جارٍ المشاركة...');
        startLocationSharing();
      }
      toggle.addEventListener('change', function() {
        if (toggle.checked) {
          statusEl && (statusEl.textContent = 'جارٍ المشاركة...');
          startLocationSharing();
        } else {
          stopLocationSharing();
        }
      });
      try {
        window.renderRepLocations();
      } catch(e) {}
      try {
        window.renderRepMap();
      } catch(e) {}
      try {
        const hdrBtn = document.getElementById('gps-toggle-btn');
        if (hdrBtn) {
          window.__gpsHeaderSync();
          hdrBtn.addEventListener('click', function() {
            const isOn = localStorage.getItem(LS_GPS) === '1';
            if (isOn) {
              stopLocationSharing();
            } else {
              statusEl && (statusEl.textContent = 'جارٍ المشاركة...');
              startLocationSharing();
            }
            try {
              window.__gpsHeaderSync();
            } catch(e) {}
          });
        }
      } catch(e) {}
    } catch(e) {
      console.warn('setupGpsSharingControls failed', e);
    }
  };

  window.renderRepLocations = function() {
    try {
      const listEl = document.getElementById('rep-locations-list');
      const adminBox = document.getElementById('admin-gps-list');
      if (!listEl || !adminBox || adminBox.classList.contains('hidden')) return;
      const rows = (state.presence || [])
        .map(p => {
          try {
            if (!p || !p.location) return null;
            const latRaw = p.location.lat;
            const lngRaw = p.location.lng;
            const lat = Number(latRaw);
            const lng = Number(lngRaw);
            if (!isFinite(lat) || !isFinite(lng)) return null;
            const name = (state.users || []).find(u => u.uid === p.uid)?.name || (state.reps || []).find(r => r.email && p.email && r.email.toLowerCase() === p.email.toLowerCase())?.name || p.email || p.uid;
            const acc = p.location.accuracy;
            const when = p.locationUpdatedAt && p.locationUpdatedAt.toDate ? p.locationUpdatedAt.toDate() : (p.locationUpdatedAt || null);
            const timeStr = when ? new Date(when).toLocaleString('ar-EG') : '';
            const link = `https://www.google.com/maps?q=${lat},${lng}`;
            return `<div class="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span class="font-semibold">${(name || 'مندوب')}</span>
              <span class="text-gray-600">(${lat.toFixed(5)}, ${lng.toFixed(5)}${acc ? ` • ±${Math.round(acc)}م` : ''})</span>
              <a class="text-blue-600 underline ml-auto" target="_blank" href="${link}">فتح الخريطة</a>
              <span class="text-xs text-gray-500">${timeStr}</span>
            </div>`;
          } catch(e) {
            return null;
          }
        }).filter(Boolean).join('');
      listEl.innerHTML = rows || '<div class="text-gray-400">لا توجد مواقع مشتركة</div>';
    } catch(e) {
      console.warn('renderRepLocations failed', e);
    }
  };

  window.openRepsMap = function() {
    try {
      const modal = document.getElementById('reps-map-modal');
      if (!modal) return;
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      setTimeout(() => {
        if (!window.__repsMap) {
          window.__repsMap = L.map('reps-map', { zoomControl: true });
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
          }).addTo(window.__repsMap);
        }
        renderRepMap();
      }, 50);
    } catch(e) {
      console.warn('openRepsMap failed', e);
    }
  };

  window.closeRepsMap = function() {
    try {
      const modal = document.getElementById('reps-map-modal');
      if (!modal) return;
      modal.style.display = 'none';
      modal.classList.add('hidden');
    } catch(e) {}
  };

  window.renderRepMap = function() {
    try {
      if (!window.__repsMap) return;
      const presence = (state.presence || []).map(p => {
        if (!p || !p.location) return null;
        const lat = Number(p.location.lat);
        const lng = Number(p.location.lng);
        if (!isFinite(lat) || !isFinite(lng)) return null;
        p._lat = lat;
        p._lng = lng;
        return p;
      }).filter(p => p && p.sharing !== false);
      const bounds = [];
      try {
        console.debug('renderRepMap presence:', presence.map(x => ({ uid: x.uid || x._id || x.email, email: x.email, lat: x._lat, lng: x._lng, sharing: x.sharing })));
      } catch(e) {}
      const currentUids = new Set(presence.map(p => String(p.uid || p._id || p.email || '')));
      Object.keys(window.__repMarkers).forEach(key => {
        if (!currentUids.has(key)) {
          try {
            window.__repsMap.removeLayer(window.__repMarkers[key]);
          } catch(e) {}
          delete window.__repMarkers[key];
        }
      });
      presence.forEach(p => {
        const key = String(p.uid || p._id || p.email || '');
        const lat = p._lat,
          lng = p._lng;
        const name = (state.users || []).find(u => u.uid === p.uid)?.name || (state.reps || []).find(r => r.email && p.email && r.email.toLowerCase() === p.email.toLowerCase())?.name || p.email || 'مندوب';
        const when = p.locationUpdatedAt && p.locationUpdatedAt.toDate ? p.locationUpdatedAt.toDate() : (p.locationUpdatedAt || null);
        const timeStr = when ? new Date(when).toLocaleString('ar-EG') : '';
        const popupHtml = `<div style="min-width:160px"><div style="font-weight:700">${name}</div><div style="font-size:12px;color:#555">${lat.toFixed(5)}, ${lng.toFixed(5)}</div><div style="font-size:11px;color:#777">${timeStr}</div><a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" style="color:#2563eb;text-decoration:underline">فتح الخريطة</a></div>`;
        if (!window.__repMarkers[key]) {
          window.__repMarkers[key] = L.marker([lat, lng]).addTo(window.__repsMap).bindPopup(popupHtml);
        } else {
          window.__repMarkers[key].setLatLng([lat, lng]);
          window.__repMarkers[key].setPopupContent(popupHtml);
        }
        bounds.push([lat, lng]);
      });
      if (bounds.length) {
        try {
          window.__repsMap.fitBounds(bounds, { padding: [30, 30] });
        } catch(e) {}
      }
    } catch(e) {
      console.warn('renderRepMap failed', e);
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    try {
      const openBtn = document.getElementById('open-map-btn');
      const closeBtn = document.getElementById('close-map-btn');
      if (openBtn) openBtn.addEventListener('click', openRepsMap);
      if (closeBtn) closeBtn.addEventListener('click', closeRepsMap);
      const hdrBtn = document.getElementById('gps-toggle-btn');
      if (hdrBtn) {
        try {
          window.__gpsHeaderSync();
        } catch(e) {}
        hdrBtn.addEventListener('click', function() {
          try {
            const isOn = localStorage.getItem('gps_sharing_enabled') === '1';
            if (isOn) stopLocationSharing();
            else startLocationSharing();
          } catch(e) {}
        });
      }
    } catch(e) {}
  });
})();

// Export to global scope
window.setupRealtimeListeners = setupRealtimeListeners;
