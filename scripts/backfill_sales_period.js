// Backfill 'period' field on sales documents using client-side batch writes
// Usage: open the app, then in browser console run: window.backfillSalesPeriods('2026-01', 500)
// Requires write permissions; run as admin.

(function(){
  window.backfillSalesPeriods = async function(targetPeriod, limit=500){
    try {
      if (!window.db) throw new Error('Firestore غير جاهز');
      if (!window.auth || !auth.currentUser) throw new Error('لم يتم تسجيل الدخول');
      const role = (typeof getUserRole==='function') ? getUserRole() : 'user';
      if (role !== 'admin') { alert('هذه العملية للمشرف فقط'); return; }
      console.log('🔧 Backfilling sales.period for recent docs...');
      const snap = await db.collection('sales').orderBy('date','desc').limit(limit).get();
      if (snap.empty) { console.log('لا توجد فواتير'); return; }
      let batch = db.batch(); let count = 0; const BATCH_LIMIT = 450;
      snap.forEach(doc => {
        const d = doc.data() || {};
        let period = d.period;
        if (!period) {
          try {
            const dt = d.date?.toDate?.() || new Date(d.date);
            const y = dt.getFullYear();
            const m = String(dt.getMonth()+1).padStart(2,'0');
            period = `${y}-${m}`;
          } catch(e){ /* keep undefined */ }
        }
        if (period) {
          batch.set(doc.ref, { period }, { merge:true });
          count++;
          if (count >= BATCH_LIMIT) { batch.commit(); batch = db.batch(); count = 0; }
        }
      });
      if (count>0) await batch.commit();
      alert('✅ Backfill completed: updated recent sales with period field');
    } catch(e) {
      console.error('Backfill failed:', e);
      alert('❌ Backfill failed: ' + e.message);
    }
  };
})();
