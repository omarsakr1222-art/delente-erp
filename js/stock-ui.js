// Stock UI Module - extracted rendering and UI helpers
(function(){
  const app = () => window.appV2;

  function finishedList(products, filter){
    if (filter === 'finished_goods'){
      const FG = ['finished_goods', 'مالتى', 'البان'];
      return products.filter(p => FG.includes(p.category));
    }
    return products.filter(p => p.category === filter);
  }

  const StockUI = {
    renderProducts(){
      const a = app();
      const tbody = document.getElementById('productsBody-v2');
      if (!tbody || !a) return;
      tbody.innerHTML = '';
      const filter = a.currentProdFilter || 'all';

      console.log(`📦 Rendering products - Filter: "${filter}"`);
      let list = a.products || [];
      if (filter !== 'all'){
        list = finishedList(list, filter);
      }
      console.log(`✅ Filtered to ${list.length} products`);
      if (list.length === 0){
        tbody.innerHTML = '<tr><td colspan="3" class="p-6 text-center text-gray-400 text-xs">لا توجد منتجات في هذه الفئة</td></tr>';
        return;
      }
      list.forEach(p => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-blue-50 border-b last:border-0';
        const catName = p.category ? (typeof a.getCatName === 'function' ? a.getCatName(p.category) : (p.category || '')) : '<span class="text-red-400">غير مصنف</span>';
        const stock = a.selectedDate ? (p.historicalStock || 0) : (p.currentStock || 0);
        row.innerHTML = `
          <td class="p-3 font-bold text-gray-700">${p.name} <span class="block text-[10px] text-gray-400 font-normal">${catName}</span></td>
          <td class="p-3 text-center dir-ltr font-mono text-gray-600 font-bold">${(a.formatNum ? a.formatNum(stock) : stock)} ${p.unit || ''}</td>
          <td class="p-3 text-center text-blue-600 font-mono text-xs bg-yellow-50/50">${(a.formatNum ? a.formatNum(p.avgCost) : p.avgCost || 0)}</td>
        `;
        tbody.appendChild(row);
      });
    },

    async renderStock(){
      const a = app();
      const tbody = document.getElementById('stockBody-v2');
      if (!tbody || !a) return;
      tbody.innerHTML = '';
      const cat = a.stockCategory || 'finished_goods';
      console.log(`📦 Rendering stocktake for category: "${cat}"`);
      const filtered = cat === 'all' ? (a.products || []) : finishedList(a.products || [], cat);
      console.log(`📦 Stocktake filter "${cat}": found ${filtered.length} products (from ${a.products.length || 0} total)`);
      if (filtered.length === 0){
        tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-gray-400 text-xs">لا توجد منتجات في هذه الفئة<br><small class="text-red-400">يرجى تصنيف المنتجات أولاً</small></td></tr>';
        return;
      }
      
      // محاولة تحميل آخر جرد معتمد من localStorage
      const dateKey = a.selectedDate ? a.selectedDate.toISOString().slice(0,10) : 'current';
      let submittedData = {};
      
      console.log(`🔍 تحميل جرد لـ ${dateKey}`);
      
      // أولاً تحميل من localStorage (مسودات)
      const draftKey = `stocktake-draft:${dateKey}`;
      let drafts = {};
      try { drafts = JSON.parse(localStorage.getItem(draftKey) || '{}'); } catch(_){ drafts = {}; }
      
      console.log(`📄 مسودة localStorage (${Object.keys(drafts).length} منتج):`, drafts);

      // ثانياً محاولة تحميل من localStorage الجرد المعتمد إذا لم توجد مسودة
      if (Object.keys(drafts).length === 0) {
        const submittedKey = `stocktake-submitted:${dateKey}`;
        try {
          const submittedStr = localStorage.getItem(submittedKey);
          if (submittedStr) {
            const submittedObj = JSON.parse(submittedStr);
            submittedData = submittedObj.data || {};
            console.log(`✅ تم تحميل آخر جرد معتمد لـ ${dateKey} (${Object.keys(submittedData).length} منتج):`, submittedData);
          } else {
            console.log(`⚠️ لا يوجد جرد معتمد سابق لـ ${dateKey}`);
          }
        } catch (err) {
          console.log(`❌ خطأ في تحميل الجرد المعتمد لـ ${dateKey}:`, err);
        }
      } else {
        console.log(`💾 استخدام المسودة المحلية بدلاً من الجرد المعتمد`);
      }
      
      filtered.forEach(p => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        // استخدام المسودة أولاً، وإذا لم توجد، استخدم آخر جرد معتمد
        const savedValue = drafts[p.id] !== undefined ? drafts[p.id] : (submittedData[p.id] || '');
        row.innerHTML = `
          <td class="p-2 text-[11px] font-bold text-gray-700">${p.name}</td>
          <td class="p-2 text-center text-[10px] text-gray-400 font-mono">${(a.formatNum ? a.formatNum(p.currentStock) : p.currentStock || 0)}</td>
          <td class="p-2 text-center"><input type="number" step="0.01" class="w-16 border rounded text-center p-1 text-xs outline-none focus:border-blue-500 st-inp-v2" data-pid="${p.id}" data-sys="${p.currentStock}" value="${savedValue}"></td>
          <td class="p-2 text-center text-[10px] font-bold text-gray-300 diff-cell">-</td>
        `;
        const inp = row.querySelector('.st-inp-v2');
        if (inp){
          inp.oninput = (e) => StockUI.calcDiff(e.target);
          if (inp.value && inp.value !== '') StockUI.calcDiff(inp);
        }
        tbody.appendChild(row);
      });
    },

    calcDiff(input){
      const a = app();
      const sys = parseFloat(input.dataset.sys);
      const actual = parseFloat(input.value);
      const cell = input.closest('tr')?.querySelector('.diff-cell');
      if (!cell || isNaN(actual)) { if (cell) cell.innerText = '-'; return; }
      const diff = actual - sys;
      const fmt = a && a.formatNum ? a.formatNum.bind(a) : (x)=>x;
      cell.innerText = diff > 0 ? `+${fmt(diff)}` : fmt(diff);
      cell.className = `diff-cell p-2 text-center text-[10px] font-bold ${diff < 0 ? 'text-red-600' : (diff > 0 ? 'text-green-600' : 'text-gray-400')}`;
      try {
        const draftKey = `stocktake-draft:${a.selectedDate ? a.selectedDate.toISOString().slice(0,10) : 'current'}`;
        const d = JSON.parse(localStorage.getItem(draftKey) || '{}');
        if (input.value && input.value !== '') d[input.dataset.pid] = input.value; else delete d[input.dataset.pid];
        localStorage.setItem(draftKey, JSON.stringify(d));
      } catch(_){}
    },

    nav(id){
      document.querySelectorAll('.section-view-v2').forEach(el => el.classList.remove('active'));
      const view = document.getElementById('view-' + id + '-v2');
      if (view) view.classList.add('active');
      document.querySelectorAll('.nav-item-v2').forEach(el => el.classList.remove('active'));
      const nav = document.getElementById('nav-' + id + '-v2');
      if (nav) nav.classList.add('active');
      if (id === 'stocktake') StockUI.renderStock();
      if (id === 'movements') StockUI.updateDropdowns();
    },

    toggleModal(id){
      const modal = document.getElementById(id);
      if (modal){
        modal.classList.toggle('hidden');
        if (id === 'categoryModal-v2' && !modal.classList.contains('hidden')){
          StockUI.loadCategoryList();
        }
      }
    },

    loadCategoryList(){
      const a = app();
      const container = document.getElementById('categoryList-v2');
      if (!container || !a) return;
      container.innerHTML = '';
      const uncategorized = (a.products || []).filter(p => !p.category || p.category === '');
      if (uncategorized.length === 0){
        container.innerHTML = '<div class="text-center text-gray-400 py-6 text-sm">✅ جميع المنتجات مصنفة</div>';
        return;
      }
      uncategorized.forEach(p => {
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-2 border rounded hover:bg-gray-50';
        row.innerHTML = `
          <span class="text-sm font-bold text-gray-700">${p.name}</span>
          <select class="border rounded px-2 py-1 text-xs category-select" data-pid="${p.id}">
            <option value="">اختر الفئة</option>
            <option value="raw_material">خامات</option>
            <option value="packaging">تغليف</option>
            <option value="مالتى">مالتى</option>
            <option value="البان">البان</option>
          </select>
        `;
        container.appendChild(row);
      });
    },

    async saveBulkCategories(){
      const a = app();
      const selects = document.querySelectorAll('.category-select');
      if (!a || !a.db) return;
      const batch = a.db.batch();
      let count = 0;
      selects.forEach(select => {
        if (select.value){
          const pid = select.dataset.pid;
          const ref = a.db.collection('products').doc(pid);
          batch.update(ref, { category: select.value });
          count++;
        }
      });
      if (count === 0){ alert('لم يتم اختيار أي فئة'); return; }
      if (confirm(`هل تريد حفظ تصنيف ${count} منتج؟`)){
        try { await batch.commit(); alert('✅ تم حفظ التصنيفات'); StockUI.toggleModal('categoryModal-v2'); }
        catch(err){ console.error('saveBulkCategories error:', err); alert('خطأ: ' + err.message); }
      }
    },

    loadLogs(){
      const a = app();
      const tbody = document.getElementById('logsBody-v2');
      if (!tbody || !a || !a.db) return;
      const isAdmin = window.isAdmin || (window.currentUserRole === 'admin');
      console.log(`📋 Loading logs - Admin: ${isAdmin}, Current user: ${window.auth?.currentUser?.email}`);
      try {
        a.db.collection('transactions').orderBy('date','desc').limit(50).onSnapshot((snap)=>{
          tbody.innerHTML = '';
          if (snap.empty){ tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-gray-400 text-xs">لا توجد حركات</td></tr>'; return; }
          snap.forEach(doc => {
            const d = doc.data();
            const dateObj = d.date?.toDate?.() || new Date(d.date);
            const date = dateObj.toLocaleDateString('ar-EG');
            const type = d.type === 'inbound' ? 'وارد' : (d.type === 'outbound' ? 'صادر' : (d.type === 'adjustment' ? 'تسوية' : 'إلغاء'));
            const color = d.type === 'inbound' ? 'text-green-600' : (d.type === 'outbound' ? 'text-red-600' : 'text-gray-600');
            const canCancel = d.type !== 'cancellation' && d.type !== 'adjustment' && (new Date() - dateObj) < (24 * 60 * 60 * 1000);
            let actionBtns = [];
            if (canCancel) actionBtns.push(`<button onclick="appV2.cancelTransaction('${doc.id}')" class="text-red-500 hover:text-red-700 text-xs px-1" title="إلغاء"><i class="fas fa-times-circle"></i></button>`);
            if (isAdmin){
              actionBtns.push(`<button onclick="appV2.editTransaction('${doc.id}')" class="text-blue-600 hover:text-blue-800 text-xs px-1" title="تعديل"><i class="fas fa-edit"></i></button>`);
              actionBtns.push(`<button onclick="appV2.deleteTransaction('${doc.id}')" class="text-red-600 hover:text-red-800 text-xs px-1 font-bold" title="حذف"><i class="fas fa-trash-alt"></i></button>`);
            } else {
              actionBtns.push(`<span class="text-gray-400 text-xs px-1" title="عرض فقط"><i class="fas fa-eye"></i></span>`);
            }
            const actions = actionBtns.length > 0 ? actionBtns.join('') : '-';
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 border-b';
            row.innerHTML = `
              <td class="p-3 text-gray-500 dir-ltr font-mono text-[10px]">${date}</td>
              <td class="p-3 text-[10px] font-bold ${color}">${type}</td>
              <td class="p-3 font-bold text-gray-700">${d.prodName || '-'}</td>
              <td class="p-3 font-mono dir-ltr font-bold text-xs">${d.qty}</td>
              <td class="p-3 text-xs text-gray-500">${d.party || '-'}</td>
              <td class="p-3 text-center flex gap-0.5 justify-center">${actions}</td>
            `;
            tbody.appendChild(row);
          });
        }, err => console.error('V2 loadLogs error:', err));
      } catch (err){ console.error('V2 loadLogs exception:', err); }
    },

    updateDropdowns(){
      const a = app();
      const sel = document.getElementById('prodSelect-v2');
      if (sel){
        sel.innerHTML = '<option value="">اختر...</option>';
        (a.products || []).forEach(p => {
          const opt = document.createElement('option'); opt.value = p.id; opt.textContent = p.name; sel.appendChild(opt);
        });
      }
      const sup = document.getElementById('supplierSelect-v2');
      const supplierNames = ['مزارع الوادي','مورد الملح','شركة التغليف'];
      if (sup){
        if (sup.tagName === 'SELECT'){
          if (sup.children.length === 1){ supplierNames.forEach(s => { const opt = document.createElement('option'); opt.textContent = s; sup.appendChild(opt); }); }
        } else if (sup.tagName === 'INPUT'){
          let dl = document.getElementById('suppliers-datalist');
          if (!dl){ dl = document.createElement('datalist'); dl.id = 'suppliers-datalist'; sup.insertAdjacentElement('afterend', dl); }
          dl.innerHTML = ''; supplierNames.forEach(s => { const opt = document.createElement('option'); opt.value = s; dl.appendChild(opt); });
        }
      }
    },

    updateHint(){
      const a = app();
      const p = (a.products || []).find(x => x.id === document.getElementById('prodSelect-v2')?.value);
      const hint = document.getElementById('stockHint-v2');
      if (hint){ hint.innerText = p ? `رصيد: ${p.currentStock} ${p.unit}` : ''; }
    }
  };

  window.StockUI = StockUI;

  // Override appV2 methods to use StockUI (backward-compatible)
  if (window.appV2){
    window.appV2.renderProducts = () => StockUI.renderProducts();
    window.appV2.renderStock = () => StockUI.renderStock();
    window.appV2.updateDropdowns = () => StockUI.updateDropdowns();
    window.appV2.updateHint = () => StockUI.updateHint();
    window.appV2.nav = (id) => StockUI.nav(id);
    window.appV2.toggleModal = (id) => StockUI.toggleModal(id);
    window.appV2.loadCategoryList = () => StockUI.loadCategoryList();
    window.appV2.saveBulkCategories = () => StockUI.saveBulkCategories();
    window.appV2.loadLogs = () => StockUI.loadLogs();
    window.appV2.calcDiff = (input) => StockUI.calcDiff(input);
  }
})();
