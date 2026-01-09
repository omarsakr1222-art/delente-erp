// Staff & Mandoob management helpers
(function(){
  const getDb = () => window.db;
  const serverTsSafe = () => (typeof window.serverTs === 'function' ? window.serverTs() : new Date());

  // ==== CRUD: reps (mandoob) ====
  window.addRepDoc = async function(id, data){
    const db = getDb();
    if (!db) throw new Error('Firestore not ready');
    const ref = id ? db.collection('reps').doc(String(id)) : db.collection('reps').doc();
    const obj = {
      id: id || ref.id,
      name: data.name || '',
      email: data.email || '',
      serial: data.serial || '',
      target: Number(data.target||0),
      nextInvoiceNumber: data.nextInvoiceNumber || null,
      createdAt: serverTsSafe(),
      updatedAt: serverTsSafe()
    };
    await ref.set(obj, { merge:false });
    return ref;
  };

  window.updateRepDoc = async function(id, partial){
    const db = getDb();
    if (!db) throw new Error('Firestore not ready');
    return db.collection('reps').doc(String(id)).set({ ...partial, updatedAt: serverTsSafe() }, { merge:true });
  };

  window.deleteRepDoc = async function(id){
    const db = getDb();
    if (!db) throw new Error('Firestore not ready');
    return db.collection('reps').doc(String(id)).delete();
  };

  // ==== Helpers ====
  window.findRep = window.findRep || function(name){
    try { return (window.state?.reps||[]).find(r => r.name === name || r.id === name) || null; } catch(e){ return null; }
  };

  window.populateRepDropdown = function(selectEl, selectedRepName = ''){
    if (!selectEl) return;
    const reps = (window.state?.reps)||[];
    // If reps not loaded yet, show a loading placeholder and return
    if (!Array.isArray(reps) || reps.length === 0) {
      selectEl.innerHTML = '<option value="">جاري تحميل المناديب...</option>';
      // Retry shortly in case realtime listener updates state.reps after initial render
      try { setTimeout(function(){ try { window.populateRepDropdown(selectEl, selectedRepName); } catch(e){} }, 1200); } catch(e){}
      return;
    }
    let repNames = reps.map(r => r.name).filter(Boolean);
    const prev = selectedRepName || selectEl.value;
    if (selectEl.id === 'spreadsheet-rep') {
      const role = typeof window.getUserRole === 'function' ? window.getUserRole() : 'rep';
      const currentEmail = (window.auth && window.auth.currentUser && window.auth.currentUser.email) ? window.auth.currentUser.email.toLowerCase() : null;
      if (role === 'rep' && currentEmail) {
        const currentRep = reps.find(r => (r.email||'').toLowerCase() === currentEmail);
        // If current rep found, restrict to that rep; otherwise, fallback to all reps
        repNames = currentRep ? [currentRep.name] : repNames;
      }
    }
    let html = '<option value="">-- جميع المناديب --</option>';
    html += repNames.map(name => `<option value="${name}" ${name === prev ? 'selected' : ''}>${name}</option>`).join('');
    selectEl.innerHTML = html;
    if (prev && repNames.includes(prev)) selectEl.value = prev;
  };

  window.populateRepDropdownReports = function(selectEl, selectedRepName = ''){
    if (!selectEl) return;
    const repNames = (window.state?.reps||[]).map(r => r.name).filter(Boolean);
    selectEl.innerHTML = '<option value="all">-- كل المناديب --</option>' + repNames.map(name => `<option value="${name}" ${name === selectedRepName ? 'selected' : ''}>${name}</option>`).join('');
  };

  // ==== UI: render & modal ====
  function renderReps(){
    const repsList = document.getElementById('reps-list');
    if (!repsList) return;
    const reps = window.state?.reps || [];
    repsList.innerHTML = '';
    if (reps.length === 0) {
        repsList.innerHTML = '<p class="text-gray-500 text-center mt-8">لا يوجد مناديب. اضغط على زر "إضافة مندوب" للبدء.</p>';
        return;
    }
    reps.forEach(rep => {
        const el = document.createElement('div');
        el.className = 'bg-white p-4 rounded-lg border shadow-sm';
        el.innerHTML = `<div class="flex justify-between items-start">
            <div>
                <p class="font-bold text-lg">${rep.name}</p>
                <p class="text-sm text-gray-500 mt-1">السيريال: ${rep.serial || 'لا يوجد'}</p>
                <p class="text-sm text-blue-600 font-semibold mt-1">التارجت: ${(window.formatCurrency ? window.formatCurrency(rep.target) : rep.target || 0)}</p>
                <div class="text-sm text-red-600 font-semibold mt-1">
                    رقم الفاتورة القادمة: 
                    <input type="number" class="rep-invoice-input" value="${rep.nextInvoiceNumber || 1}" data-rep-id="${rep.id}" style="width:80px; padding:4px; border: 1px solid #d1d5db; border-radius: 4px; margin-right: 6px;">
                    <button class="rep-invoice-save-btn" data-rep-id="${rep.id}" style="padding: 4px 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">حفظ</button>
                </div>
                <p class="text-sm text-gray-700 mt-1">البريد الإلكتروني: <span class="font-mono text-xs">${rep.email || '-'}</span></p>
            </div>
            <div class="flex">
                <button data-id="${rep.id}" class="edit-rep-btn p-2 text-gray-500 hover:text-blue-600"><i data-lucide="edit" class="w-5 h-5"></i></button>
                <button data-id="${rep.id}" class="delete-rep-btn p-2 text-gray-500 hover:text-red-600"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            </div>
        </div>`;
        repsList.appendChild(el);
    });

    document.querySelectorAll('.rep-invoice-save-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const db = getDb();
            if (!db) { alert('قاعدة البيانات غير جاهزة'); return; }
            const repId = btn.dataset.repId;
            const input = document.querySelector(`.rep-invoice-input[data-rep-id="${repId}"]`);
            if (!input) return;
            const newValue = parseInt(input.value);
            if (isNaN(newValue) || newValue < 1) {
                alert('يرجى إدخال رقم صحيح أكبر من 0');
                return;
            }
            const rep = (window.state?.reps||[]).find(r => r.id === repId);
            if (!rep) return;
            rep.nextInvoiceNumber = newValue;
            try {
                await db.collection('reps').doc(repId).set({ nextInvoiceNumber: newValue }, { merge: true });
                btn.textContent = '✓';
                setTimeout(() => { btn.textContent = 'حفظ'; }, 1500);
            } catch(err) {
                alert('فشل حفظ رقم الفاتورة: ' + err.message);
            }
        });
    });

    if (typeof window.updateIcons === 'function') window.updateIcons();
  }
  window.renderReps = renderReps;

  function openRepModal(id = null){
    const repForm = document.getElementById('rep-form');
    const repModal = document.getElementById('rep-modal');
    if (!repForm || !repModal) return;
    repForm.reset();
    const idInput = document.getElementById('rep-id');
    if (idInput) idInput.value = '';

    const reps = window.state?.reps || [];
    if (id){
      const rep = reps.find(r => r.id === id);
      if (rep){
        document.getElementById('rep-modal-title').textContent = 'تعديل بيانات المندوب';
        document.getElementById('rep-id').value = rep.id;
        document.getElementById('rep-name').value = rep.name;
        document.getElementById('rep-email').value = rep.email || '';
        document.getElementById('rep-serial').value = rep.serial || '';
        document.getElementById('rep-target').value = rep.target || 0;
        document.getElementById('rep-next-invoice').value = rep.nextInvoiceNumber || '';
      }
    } else {
      document.getElementById('rep-modal-title').textContent = 'إضافة مندوب جديد';
    }
    if (typeof window.openModal === 'function') window.openModal(repModal);
  }
  window.openRepModal = openRepModal;

  // ==== Event wiring ====
  document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('add-rep-btn');
    const cancelBtn = document.getElementById('cancel-rep-btn');
    const repModal = document.getElementById('rep-modal');
    const repForm = document.getElementById('rep-form');
    const repsList = document.getElementById('reps-list');

    if (addBtn) addBtn.addEventListener('click', () => openRepModal());
    if (cancelBtn && repModal) cancelBtn.addEventListener('click', () => { if (typeof window.closeModal === 'function') window.closeModal(repModal); });

    if (repForm) {
      repForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('rep-id').value;
        const name = document.getElementById('rep-name').value.trim();
        const email = document.getElementById('rep-email').value.trim();
        const serial = document.getElementById('rep-serial').value.trim();
        const target = parseFloat(document.getElementById('rep-target').value) || 0;
        const nextInvoiceNumber = parseInt(document.getElementById('rep-next-invoice').value) || null;

        if (!name) { await window.customDialog?.({ title: 'بيانات ناقصة', message: 'الرجاء إدخال اسم المندوب.' }); return; }
        if (!email) { await window.customDialog?.({ title: 'بيانات ناقصة', message: 'الرجاء إدخال البريد الإلكتروني للمندوب.' }); return; }
        const isDuplicate = (window.state?.reps||[]).some(r => r.name === name && r.id !== id);
        if (isDuplicate) { await window.customDialog?.({ title: 'اسم مكرر', message: 'يوجد مندوب آخر بنفس الاسم. الرجاء استخدام اسم مختلف.' }); return; }

        try {
          if (id) {
            await window.updateRepDoc(id, { name, email, serial, target, nextInvoiceNumber });
          } else {
            await window.addRepDoc(undefined, { name, email, serial, target, nextInvoiceNumber });
          }
          if (typeof window.closeModal === 'function' && repModal) window.closeModal(repModal);
          await window.customDialog?.({ message: 'تم حفظ بيانات المندوب في السحابة.', title: 'نجاح' });
        } catch(err) {
          console.warn('saveRep cloud failed', err);
          await window.customDialog?.({ title: 'خطأ', message: 'تعذر حفظ بيانات المندوب. تحقق من الاتصال والصلاحيات.' });
        }
      });
    }

    if (repsList) {
      repsList.addEventListener('click', async (e) => {
        const editBtn = e.target.closest?.('.edit-rep-btn');
        const deleteBtn = e.target.closest?.('.delete-rep-btn');

        if (editBtn) {
          const repId = editBtn.dataset.id;
          openRepModal(repId);
        }

        if (deleteBtn) {
          const repId = deleteBtn.dataset.id;
          const rep = (window.state?.reps||[]).find(r => r.id === repId);
          if (!rep) return;

          const repHasSales = (window.state?.sales||[]).some(s => s.repName === rep.name);
          if (repHasSales) {
            await window.customDialog?.({ title: 'لا يمكن الحذف', message: `لا يمكن حذف المندوب "${rep.name}" لأن لديه فواتير مسجلة. يمكنك تعديل بياناته بدلاً من ذلك.` });
            return;
          }

          const confirmed = await window.customDialog?.({ title: 'تأكيد الحذف', message: `هل أنت متأكد أنك تريد حذف المندوب "${rep.name}"؟`, isConfirm: true, confirmText: 'نعم، احذف', confirmClass: 'bg-red-600 hover:bg-red-700' });
          if (confirmed) {
            try {
              await window.deleteRepDoc(repId);
              await window.customDialog?.({ message: 'تم حذف المندوب نهائياً.' });
            } catch(err) {
              console.warn('deleteRep failed', err);
              await window.customDialog?.({ title: 'خطأ', message: 'تعذر حذف المندوب من السحابة.' });
            }
          }
        }
      });
    }
  });

  // ===== GPS Tracking (Presence Location) =====
  (function(){
    const LS_GPS = 'gps_sharing_enabled';
    window.__gpsWatchId = null;
    window.__repsMap = null;
    window.__repMarkers = {};

    window.__gpsHeaderSync = function(){
      try {
        const btn = document.getElementById('gps-toggle-btn');
        if (!btn) return;
        btn.classList.remove('bg-gray-200','hover:bg-gray-300','text-gray-800');
        const enabled = localStorage.getItem(LS_GPS) === '1';
        btn.textContent = enabled ? 'GPS ON' : 'GPS OFF';
        btn.classList.toggle('bg-green-500', enabled);
        btn.classList.toggle('hover:bg-green-600', enabled);
        btn.classList.toggle('text-white', enabled);
        btn.classList.toggle('bg-red-500', !enabled);
        btn.classList.toggle('hover:bg-red-600', !enabled);
        btn.classList.toggle('text-white', !enabled);
      } catch(e){}
    };

    window.startLocationSharing = function(){
      try {
        const statusEl = document.getElementById('gps-share-status');
        if (!navigator.geolocation) { if (statusEl) statusEl.textContent = 'المتصفح لا يدعم الموقع'; return; }
        if (!window.auth || !window.auth.currentUser) { if (statusEl) statusEl.textContent = 'لم يتم تسجيل الدخول'; return; }
        if (window.__gpsWatchId != null) return;
        const opts = { enableHighAccuracy: true, maximumAge: 15000, timeout: 15000 };
        window.__gpsWatchId = navigator.geolocation.watchPosition(async function(pos){
          try {
            const { latitude:lat, longitude:lng, accuracy } = pos.coords || {};
            const uid = window.auth.currentUser.uid;
            const db = getDb();
            if (db) {
              await db.collection('presence').doc(uid).set({
                uid,
                email: (window.auth.currentUser.email||'').toLowerCase(),
                online: true,
                location: { lat, lng, accuracy },
                locationUpdatedAt: serverTsSafe(),
                sharing: true
              }, { merge:true });
            }
            const s = `آخر تحديث: ${new Date().toLocaleTimeString('ar-EG')}`;
            if (statusEl) statusEl.textContent = s;
          } catch(e){ /* ignore */ }
        }, function(err){ if (statusEl) statusEl.textContent = 'تعذر تحديد الموقع'; console.warn('GPS error', err); }, opts);
        try { localStorage.setItem(LS_GPS, '1'); } catch(e){}
        try { window.__gpsHeaderSync(); } catch(e){}
      } catch(e){ console.warn('startLocationSharing failed', e); }
    };

    window.stopLocationSharing = function(){
      try {
        const statusEl = document.getElementById('gps-share-status');
        if (window.__gpsWatchId != null) { try { navigator.geolocation.clearWatch(window.__gpsWatchId); } catch(e){} window.__gpsWatchId = null; }
        try { localStorage.removeItem(LS_GPS); } catch(e){}
        if (statusEl) statusEl.textContent = 'متوقف';
        const db = getDb();
        if (window.auth && window.auth.currentUser && db) {
          const uid = window.auth.currentUser.uid;
          db.collection('presence').doc(uid).set({ sharing:false }, { merge:true }).catch(()=>{});
        }
        try { window.__gpsHeaderSync(); } catch(e){}
      } catch(e){ console.warn('stopLocationSharing failed', e); }
    };

    window.setupGpsSharingControls = function(){
      try {
        const toggle = document.getElementById('gps-share-toggle');
        const statusEl = document.getElementById('gps-share-status');
        const adminBox = document.getElementById('admin-gps-list');
        if (!toggle) return;
        const role = (typeof window.getUserRole === 'function') ? window.getUserRole() : 'user';
        if (adminBox) adminBox.classList.toggle('hidden', role !== 'admin');
        const enabled = localStorage.getItem(LS_GPS) === '1';
        toggle.checked = enabled;
        if (enabled) { statusEl && (statusEl.textContent = 'جارٍ المشاركة...'); startLocationSharing(); }
        toggle.addEventListener('change', function(){
          if (toggle.checked) { statusEl && (statusEl.textContent = 'جارٍ المشاركة...'); startLocationSharing(); }
          else { stopLocationSharing(); }
        });
        try { window.renderRepLocations(); } catch(e){}
        try { window.renderRepMap(); } catch(e){}
        try {
          const hdrBtn = document.getElementById('gps-toggle-btn');
          if (hdrBtn) {
            window.__gpsHeaderSync();
            hdrBtn.addEventListener('click', function(){
              const isOn = localStorage.getItem(LS_GPS) === '1';
              if (isOn) {
                stopLocationSharing();
              } else {
                statusEl && (statusEl.textContent = 'جارٍ المشاركة...');
                startLocationSharing();
              }
              try { window.__gpsHeaderSync(); } catch(e){}
            });
          }
        } catch(e){}
      } catch(e){ console.warn('setupGpsSharingControls failed', e); }
    };

    window.renderRepLocations = function(){
      try {
        const listEl = document.getElementById('rep-locations-list');
        const adminBox = document.getElementById('admin-gps-list');
        if (!listEl || !adminBox || adminBox.classList.contains('hidden')) return;
        const rows = (window.state?.presence||[])
          .map(p => {
            try {
              if (!p || !p.location) return null;
              const latRaw = p.location.lat;
              const lngRaw = p.location.lng;
              const lat = Number(latRaw);
              const lng = Number(lngRaw);
              if (!isFinite(lat) || !isFinite(lng)) return null;
              const name = (window.state?.users||[]).find(u=>u.uid===p.uid)?.name || (window.state?.reps||[]).find(r=>r.email && p.email && r.email.toLowerCase()===p.email.toLowerCase())?.name || p.email || p.uid;
              const acc = p.location.accuracy;
              const when = p.locationUpdatedAt && p.locationUpdatedAt.toDate ? p.locationUpdatedAt.toDate() : (p.locationUpdatedAt || null);
              const timeStr = when ? new Date(when).toLocaleString('ar-EG') : '';
              const link = `https://www.google.com/maps?q=${lat},${lng}`;
              return `<div class="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span class="font-semibold">${(name||'مندوب')}</span>
                  <span class="text-gray-600">(${lat.toFixed(5)}, ${lng.toFixed(5)}${acc?` • ±${Math.round(acc)}م`:''})</span>
                  <a class="text-blue-600 underline ml-auto" target="_blank" href="${link}">فتح الخريطة</a>
                  <span class="text-xs text-gray-500">${timeStr}</span>
              </div>`;
            } catch(e){ return null; }
          }).filter(Boolean).join('');
        listEl.innerHTML = rows || '<div class="text-sm text-gray-500">لا توجد مواقع مُبلّغ عنها حالياً.</div>';
      } catch(e){ /* ignore */ }
    };

    window.openRepsMap = function(){
      try {
        const modal = document.getElementById('reps-map-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        setTimeout(()=>{
          if (!window.__repsMap) {
            window.__repsMap = L.map('reps-map', { zoomControl: true });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '&copy; OpenStreetMap'
            }).addTo(window.__repsMap);
          }
          window.renderRepMap();
        }, 50);
      } catch(e){ console.warn('openRepsMap failed', e); }
    };

    window.closeRepsMap = function(){
      try {
        const modal = document.getElementById('reps-map-modal');
        if (!modal) return;
        modal.style.display = 'none';
        modal.classList.add('hidden');
      } catch(e){}
    };

    window.renderRepMap = function(){
      try {
        if (!window.__repsMap) return;
        const presence = (window.state?.presence||[]).map(p => {
          if (!p || !p.location) return null;
          const lat = Number(p.location.lat);
          const lng = Number(p.location.lng);
          if (!isFinite(lat) || !isFinite(lng)) return null;
          p._lat = lat; p._lng = lng; return p;
        }).filter(p => p && p.sharing !== false);
        const bounds = [];
        try { console.debug('renderRepMap presence:', presence.map(x=>({uid: x.uid||x._id||x.email, email: x.email, lat: x._lat, lng: x._lng, sharing: x.sharing}))); } catch(e){}
        const currentUids = new Set(presence.map(p => String(p.uid||p._id||p.email||'')));
        Object.keys(window.__repMarkers).forEach(key => {
          if (!currentUids.has(key)) {
            try { window.__repsMap.removeLayer(window.__repMarkers[key]); } catch(e){}
            delete window.__repMarkers[key];
          }
        });
        presence.forEach(p => {
          const key = String(p.uid || p._id || p.email || '');
          const lat = p._lat, lng = p._lng;
          const name = (window.state?.users||[]).find(u=>u.uid===p.uid)?.name || (window.state?.reps||[]).find(r=>r.email && p.email && r.email.toLowerCase()===p.email.toLowerCase())?.name || p.email || 'مندوب';
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
          try { window.__repsMap.fitBounds(bounds, { padding: [30,30] }); } catch(e){}
        }
      } catch(e){ console.warn('renderRepMap failed', e); }
    };

    document.addEventListener('DOMContentLoaded', () => {
      try {
        const openBtn = document.getElementById('open-map-btn');
        const closeBtn = document.getElementById('close-map-btn');
        if (openBtn) openBtn.addEventListener('click', window.openRepsMap);
        if (closeBtn) closeBtn.addEventListener('click', window.closeRepsMap);
        const hdrBtn = document.getElementById('gps-toggle-btn');
        if (hdrBtn) {
          try { window.__gpsHeaderSync(); } catch(e){}
          hdrBtn.addEventListener('click', function(){
            try {
              const isOn = localStorage.getItem('gps_sharing_enabled') === '1';
              if (isOn) stopLocationSharing(); else startLocationSharing();
            } catch(e){}
          });
        }
      } catch(e){}
    });
  })();
})();
