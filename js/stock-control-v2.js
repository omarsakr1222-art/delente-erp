// Stock Control V2 - Firebase Compat API Version
// ✅ AUTH GUARD: Prevent execution before login
if (!window.AuthSystem?.getCurrentUser?.()) {
    console.log('⚠️ Stock Control V2: Waiting for user login...');
    window.__stockV2Ready = false;
} else {
    window.__stockV2Ready = true;
}

console.log('⏳ Stock Control V2 script loading...');

const appV2 = {
    db: null,
    auth: null,
    products: [],
    currentProdFilter: 'all',
    stockCategory: 'finished_goods',
    selectedDate: null,

    async init() {
        try {
            // Expect Firebase to be ready before calling
            if (!window.db) return;

            this.db = window.db;
            this.auth = window.auth;

            console.log('✅ V2 using parent app Firebase instance');
            this.startListeners();
            this.loadLogs();

            const badge = document.getElementById('connectionStatus-v2');
            if (badge) {
                badge.className = "badge online w-fit mt-1 text-[10px]";
                badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-green-600"></span> متصل';
            }
        } catch (err) {
            console.error('V2 Init Error:', err);
        }
    },

    startListeners() {
        try {
            // Use Compat API
            this.db.collection('products').onSnapshot((snapshot) => {
                this.products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                this.products.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                
                console.log('✅ V2 Products loaded:', this.products.length);
                const categories = [...new Set(this.products.map(p => p.category))];
                console.log('📦 Categories found:', categories);
                
                // Log sample products to debug
                console.log('📝 Sample products:', this.products.slice(0, 3).map(p => ({
                    name: p.name,
                    category: p.category,
                    hasCategory: 'category' in p,
                    allFields: Object.keys(p)
                })));
                
                // Log category breakdown
                categories.forEach(cat => {
                    const count = this.products.filter(p => p.category === cat).length;
                    console.log(`  - ${cat}: ${count} products`);
                });
                
                // Count products without category
                const noCat = this.products.filter(p => !p.category).length;
                if (noCat > 0) {
                    console.warn(`⚠️ ${noCat} products have no category field!`);
                }
                
                const empty = document.getElementById('emptyState-v2');
                const table = document.getElementById('tableContainer-v2');
                
                if (this.products.length === 0) {
                    if (empty) empty.classList.remove('hidden');
                    if (table) table.classList.add('hidden');
                } else {
                    if (empty) empty.classList.add('hidden');
                    if (table) table.classList.remove('hidden');
                    this.renderProducts();
                    this.updateDropdowns();
                }
            }, err => {
                console.error('V2 startListeners error:', err);
            });
        } catch (err) {
            console.error('V2 startListeners exception:', err);
        }
    },

    async addProduct(e) {
        e.preventDefault();
        const name = document.getElementById('newProdName-v2')?.value;
        const cat = document.getElementById('newProdCat-v2')?.value;
        const unit = document.getElementById('newProdUnit-v2')?.value;
        
        if (!name || !cat || !unit) {
            alert("الرجاء ملء جميع الحقول");
            return;
        }
        
        try {
            await this.db.collection('products').add({
                name, category: cat, unit, currentStock: 0, avgCost: 0, createdAt: new Date()
            });
            alert("تمت الإضافة");
            this.toggleModal('productModal-v2');
            e.target.reset();
        } catch (err) { 
            console.error('Add product error:', err);
            alert("خطأ: " + err.message); 
        }
    },

    filterProd(cat) {
        this.currentProdFilter = cat;
        console.log(`🔍 Filter clicked: ${cat}, Products count before: ${this.products.length}`);
        
        // Only toggle active state - keep all classes intact
        const buttons = document.querySelectorAll('.filter-chip-v2');
        buttons.forEach(btn => {
            const txt = btn.textContent.trim();
            let key = 'all';
            if (/^خامات/.test(txt)) key = 'raw_material';
            else if (/^تغليف/.test(txt)) key = 'packaging';
            else if (/^تام/.test(txt)) key = 'finished_goods';

            if (key === cat) {
                btn.classList.add('active');
                console.log(`✅ Activated button: ${txt}`);
            } else {
                btn.classList.remove('active');
            }
        });
        
        this.renderProducts();
    },

    renderProducts() {
        const tbody = document.getElementById('productsBody-v2');
        if (!tbody) return;
        tbody.innerHTML = '';
        const filter = this.currentProdFilter || 'all';
        
        console.log(`📦 Current filter: "${filter}"`);
        console.log(`📦 Total products in memory: ${this.products.length}`);
        
        // Filter products based on currentProdFilter
        let list = this.products;
        if (filter !== 'all') {
            list = this.products.filter(p => {
                const matches = p.category === filter;
                if (p.id === 'sample' || p.name?.includes('Test')) {
                    console.log(`  - Product "${p.name}": category="${p.category}", filter="${filter}", matches=${matches}`);
                }
                return matches;
            });
        }
        
        console.log(`✅ Filtered to ${list.length} products for category "${filter}"`);
        
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="p-6 text-center text-gray-400 text-xs">لا توجد منتجات في هذه الفئة</td></tr>';
            return;
        }
        
        list.forEach(p => {
            const row = document.createElement('tr');
            row.className = "hover:bg-blue-50 border-b last:border-0";
            const catName = p.category ? this.getCatName(p.category) : '<span class="text-red-400">غير مصنف</span>';
            row.innerHTML = `
                <td class="p-3 font-bold text-gray-700">${p.name} <span class="block text-[10px] text-gray-400 font-normal">${catName}</span></td>
                <td class="p-3 text-center dir-ltr font-mono text-gray-600 font-bold">${this.formatNum(p.currentStock)} ${p.unit || ''}</td>
                <td class="p-3 text-center text-blue-600 font-mono text-xs bg-yellow-50/50">${this.formatNum(p.avgCost)}</td>
            `;
            tbody.appendChild(row);
        });
    },

    async saveTrans(e) {
        e.preventDefault();
        const btn = document.getElementById('transBtn-v2');
        if (btn) {
            btn.disabled = true;
            btn.innerText = "جاري الحفظ...";
        }
        
        const type = document.querySelector('input[name="mtype-v2"]:checked')?.value;
        const pid = document.getElementById('prodSelect-v2')?.value;
        const qty = parseFloat(document.getElementById('qty-v2')?.value || 0);
        const price = parseFloat(document.getElementById('price-v2')?.value || 0);

        if (!type || !pid || !qty) {
            alert("الرجاء ملء جميع الحقول");
            if (btn) {
                btn.disabled = false;
                btn.innerText = "حفظ الحركة";
            }
            return;
        }

        try {
            // استخدام batch بدلاً من transaction لتجنب الـ retry التلقائي الذي يسبب 429
            const batch = this.db.batch();
            const ref = this.db.collection('products').doc(pid);
            
            // قراءة المنتج أولاً (خارج batch)
            const s = await ref.get();
            if (!s.exists) throw "Product not found";
            const p = s.data();
            let ns = p.currentStock || 0, nc = p.avgCost || 0, party = "";

            if (type === 'inbound') {
                const ov = ns * nc, nv = qty * price;
                ns += qty;
                if (ns > 0) nc = (ov + nv) / ns;
                party = document.getElementById('supplierSelect-v2')?.value || "";
            } else {
                if (ns < qty) throw "الرصيد لا يكفي";
                ns -= qty;
                party = document.getElementById('destSelect-v2')?.value || "";
            }
            
            // تحديث المنتج
            batch.update(ref, { currentStock: ns, avgCost: nc });
            
            // إضافة المعاملة
            const transRef = this.db.collection('transactions').doc();
            batch.set(transRef, {
                date: new Date(), type, productId: pid, prodName: p.name, qty, party, stockAfter: ns
            });
            
            // تنفيذ batch
            await batch.commit();
            
            alert("تم الحفظ");
            e.target.reset();
            this.toggleTrans();
        } catch (err) { 
            console.error('saveTrans error:', err);
            if (err.code === 'resource-exhausted') {
                alert("تم تجاوز حد الطلبات. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.");
            } else {
                alert("خطأ: " + err.message || err); 
            }
        } 
        finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = "حفظ الحركة";
            }
        }
    },

    filterStock(cat) {
        this.stockCategory = cat;
        console.log(`📦 Stock filter changed to: "${cat}"`);
        
        // Update button states
        const buttons = document.querySelectorAll('.st-filter-v2');
        buttons.forEach(btn => {
            const txt = btn.textContent.trim();
            let key = 'finished_goods';
            if (/^خام/.test(txt)) key = 'raw_material';
            else if (/^تغليف/.test(txt)) key = 'packaging';
            
            if (key === cat) {
                btn.classList.add('active');
                console.log(`✅ Stocktake filter activated: ${txt}`);
            } else {
                btn.classList.remove('active');
            }
        });
        this.renderStock();
    },

    renderStock() {
        const tbody = document.getElementById('stockBody-v2');
        if (!tbody) return;
        tbody.innerHTML = '';
        const cat = this.stockCategory || 'finished_goods';
        
        console.log(`📦 Rendering stocktake for category: "${cat}"`);
        
        // Filter by category
        const filtered = this.products.filter(p => p.category === cat);
        
        console.log(`📦 Stocktake filter "${cat}": found ${filtered.length} products (from ${this.products.length} total)`);
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-gray-400 text-xs">لا توجد منتجات في هذه الفئة<br><small class="text-red-400">يرجى تصنيف المنتجات أولاً</small></td></tr>';
            return;
        }
        
        // load any saved draft values for stocktake
        const draftKey = `stocktake-draft:${this.selectedDate ? this.selectedDate.toISOString().slice(0,10) : 'current'}`;
        const drafts = (() => { try { return JSON.parse(localStorage.getItem(draftKey) || '{}'); } catch(e){return {}} })();

        filtered.forEach(p => {
            const row = document.createElement('tr');
            row.className = "border-b hover:bg-gray-50";
            row.innerHTML = `
                <td class="p-2 text-[11px] font-bold text-gray-700">${p.name}</td>
                <td class="p-2 text-center text-[10px] text-gray-400 font-mono">${this.formatNum(p.currentStock)}</td>
                <td class="p-2 text-center"><input type="number" step="0.01" class="w-16 border rounded text-center p-1 text-xs outline-none focus:border-blue-500 st-inp-v2" data-pid="${p.id}" data-sys="${p.currentStock}" value="${drafts[p.id] || ''}"></td>
                <td class="p-2 text-center text-[10px] font-bold text-gray-300 diff-cell">-</td>
            `;
            const inp = row.querySelector('.st-inp-v2');
            if (inp) {
                inp.oninput = (e) => this.calcDiff(e.target);
                if (inp.value && inp.value !== '') this.calcDiff(inp);
            }
            tbody.appendChild(row);
        });
    },

    calcDiff(input) {
        const sys = parseFloat(input.dataset.sys);
        const actual = parseFloat(input.value);
        const cell = input.closest('tr')?.querySelector('.diff-cell');
        if (!cell || isNaN(actual)) { 
            if (cell) cell.innerText = '-'; 
            return; 
        }
        const diff = actual - sys;
        cell.innerText = diff > 0 ? `+${this.formatNum(diff)}` : this.formatNum(diff);
        cell.className = `diff-cell p-2 text-center text-[10px] font-bold ${diff < 0 ? 'text-red-600' : (diff > 0 ? 'text-green-600' : 'text-gray-400')}`;
        // persist draft for this stocktake so values survive navigation
        try {
            const draftKey = `stocktake-draft:${this.selectedDate ? this.selectedDate.toISOString().slice(0,10) : 'current'}`;
            const d = JSON.parse(localStorage.getItem(draftKey) || '{}');
            if (input.value && input.value !== '') d[input.dataset.pid] = input.value;
            else delete d[input.dataset.pid];
            localStorage.setItem(draftKey, JSON.stringify(d));
        } catch (e) { console.warn('Could not save stocktake draft', e); }
    },

    async submitStock() {
        const inputs = document.querySelectorAll('.st-inp-v2');
        const batch = this.db.batch();
        let submitted = 0; // track submitted items (even with no diff)
        let totalDiff = 0; // track total differences
        
        inputs.forEach(inp => {
            if (inp.value !== "") {
                const pid = inp.dataset.pid, actual = parseFloat(inp.value), sys = parseFloat(inp.dataset.sys);
                submitted++;
                const diff = actual - sys;
                totalDiff += Math.abs(diff);
                
                // Always update, even if no difference
                const ref = this.db.collection('products').doc(pid);
                batch.update(ref, { currentStock: actual });
                batch.set(this.db.collection('transactions').doc(), {
                    date: new Date(), type: 'adjustment', productId: pid, prodName: 'تسوية جرد', qty: diff, party: 'جرد دوري', stockAfter: actual
                });
            }
        });
        
        if (submitted > 0) {
            // بناء رسالة تأكيد قوية
            let confirmMsg = `⚠️ تحذير مهم!\n\n`;
            confirmMsg += `سيتم اعتماد وترحيل تسويات الجرد التالية:\n`;
            confirmMsg += `• عدد الأصناف: ${submitted}\n`;
            
            if (totalDiff > 0) {
                confirmMsg += `• إجمالي الفروقات: ${Math.round(totalDiff * 100) / 100} وحدة\n`;
            } else {
                confirmMsg += `• بدون فروقات (كل الأصناف مطابقة)\n`;
            }
            
            confirmMsg += `\n⚠️ تنبيه:\n`;
            confirmMsg += `- هذا الإجراء لا يمكن التراجع عنه بسهولة\n`;
            confirmMsg += `- ستُسجل كل التعديلات في السجل الدائم\n`;
            confirmMsg += `- تأكد من صحة جميع الأرصدة قبل المتابعة\n\n`;
            confirmMsg += `هل أنت متأكد فعلاً من المتابعة؟`;
            
            if (confirm(confirmMsg)) {
                // تأكيد ثانوي إضافي
                const secondConfirm = confirm(`⚠️ تأكيد نهائي!\n\nسيتم إغلاق عملية الجرد والترحيل.\nهل تريد المتابعة بدون تردد؟`);
                
                if (!secondConfirm) {
                    alert('✅ تم إلغاء عملية الترحيل. البيانات محفوظة.');
                    return;
                }
                
                try {
                    await batch.commit();
                    alert(`✅ تم الترحيل والاعتماد بنجاح!\n\n✓ تم تحديث ${submitted} صنف\n✓ تم تسجيل العملية في السجل الدائم\n✓ لا يمكن التراجع عن هذه العملية`);
                    inputs.forEach(i => i.value = '');
                    // clear draft for this stocktake
                    try { localStorage.removeItem(`stocktake-draft:${this.selectedDate ? this.selectedDate.toISOString().slice(0,10) : 'current'}`); } catch(e){}
                    this.renderStock();
                } catch (e) { 
                    console.error('submitStock error:', e);
                    alert('❌ خطأ في الترحيل: ' + e.message); 
                }
            }
        } else {
            alert("يرجى إدخال رصيد فعلي لصنف واحد على الأقل");
        }
    },

    loadLogs() {
        const tbody = document.getElementById('logsBody-v2');
        if (!tbody) return;
        
        // تحديد إذا كان المستخدم مسؤولاً
        const isAdmin = window.isAdmin || (window.currentUserRole === 'admin');
        console.log(`📋 Loading logs - Admin: ${isAdmin}, Current user: ${window.auth?.currentUser?.email}`);
        
        try {
            this.db.collection('transactions')
                .orderBy('date', 'desc')
                .limit(50)
                .onSnapshot((snap) => {
                    tbody.innerHTML = '';
                    if (snap.empty) {
                        tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-gray-400 text-xs">لا توجد حركات</td></tr>';
                        return;
                    }
                    snap.forEach(doc => {
                        const d = doc.data();
                        const dateObj = d.date?.toDate?.() || new Date(d.date);
                        const date = dateObj.toLocaleDateString('ar-EG');
                        const type = d.type === 'inbound' ? 'وارد' : (d.type === 'outbound' ? 'صادر' : (d.type === 'adjustment' ? 'تسوية' : 'إلغاء'));
                        const color = d.type === 'inbound' ? 'text-green-600' : (d.type === 'outbound' ? 'text-red-600' : 'text-gray-600');
                        
                        // Build actions
                        const canCancel = d.type !== 'cancellation' && d.type !== 'adjustment' && 
                                        (new Date() - dateObj) < (24 * 60 * 60 * 1000); // أقل من 24 ساعة
                        
                        let actionBtns = [];
                        
                        // Cancel button for recent transactions
                        if (canCancel) {
                            actionBtns.push(`<button onclick="appV2.cancelTransaction('${doc.id}')" class="text-red-500 hover:text-red-700 text-xs px-1" title="إلغاء"><i class="fas fa-times-circle"></i></button>`);
                        }
                        
                        // Edit and Delete buttons - Admin only
                        if (isAdmin) {
                            actionBtns.push(`<button onclick="appV2.editTransaction('${doc.id}')" class="text-blue-600 hover:text-blue-800 text-xs px-1" title="تعديل"><i class="fas fa-edit"></i></button>`);
                            actionBtns.push(`<button onclick="appV2.deleteTransaction('${doc.id}')" class="text-red-600 hover:text-red-800 text-xs px-1 font-bold" title="حذف"><i class="fas fa-trash-alt"></i></button>`);
                        } else {
                            // View-only button for non-admin users (no edit/delete)
                            actionBtns.push(`<span class="text-gray-400 text-xs px-1" title="عرض فقط"><i class="fas fa-eye"></i></span>`);
                        }
                        
                        const actions = actionBtns.length > 0 ? actionBtns.join('') : '-';
                        
                        const row = document.createElement('tr');
                        row.className = "hover:bg-gray-50 border-b";
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
        } catch (err) {
            console.error('V2 loadLogs exception:', err);
        }
    },

    nav(id) {
        document.querySelectorAll('.section-view-v2').forEach(el => el.classList.remove('active'));
        const view = document.getElementById('view-' + id + '-v2');
        if (view) view.classList.add('active');
        
        document.querySelectorAll('.nav-item-v2').forEach(el => el.classList.remove('active'));
        const nav = document.getElementById('nav-' + id + '-v2');
        if (nav) nav.classList.add('active');
        
        if (id === 'stocktake') this.renderStock();
        if (id === 'movements') this.updateDropdowns();
    },
    
    toggleModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.toggle('hidden');
            // Load category list when opening category modal
            if (id === 'categoryModal-v2' && !modal.classList.contains('hidden')) {
                this.loadCategoryList();
            }
        }
    },
    
    loadCategoryList() {
        const container = document.getElementById('categoryList-v2');
        if (!container) return;
        container.innerHTML = '';
        
        // Get products without category
        const uncategorized = this.products.filter(p => !p.category || p.category === '');
        
        if (uncategorized.length === 0) {
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
                    <option value="finished_goods">منتج تام</option>
                </select>
            `;
            container.appendChild(row);
        });
    },
    
    async saveBulkCategories() {
        const selects = document.querySelectorAll('.category-select');
        const batch = this.db.batch();
        let count = 0;
        
        selects.forEach(select => {
            if (select.value) {
                const pid = select.dataset.pid;
                const ref = this.db.collection('products').doc(pid);
                batch.update(ref, { category: select.value });
                count++;
            }
        });
        
        if (count === 0) {
            alert('لم يتم اختيار أي فئة');
            return;
        }
        
        if (confirm(`هل تريد حفظ تصنيف ${count} منتج؟`)) {
            try {
                await batch.commit();
                alert('✅ تم حفظ التصنيفات');
                this.toggleModal('categoryModal-v2');
            } catch (err) {
                console.error('saveBulkCategories error:', err);
                alert('خطأ: ' + err.message);
            }
        }
    },
    
    async importFromOldSystem(section) {
        let sectionName = '';
        if (section === 'raw_material') sectionName = 'الخامات';
        if (section === 'packaging') sectionName = 'التغليف';
        if (section === 'finished_goods') sectionName = 'المنتج التام';
        if (!sectionName) {
            alert('يرجى اختيار قسم صحيح');
            return;
        }
        if (!confirm(`⚠️ هل تريد استيراد بيانات ${sectionName} فقط من النظام القديم؟\nسيتم إضافة المنتجات المفقودة فقط.`)) {
            return;
        }
        try {
            let grid = {};
            if (section === 'raw_material') grid = JSON.parse(localStorage.getItem('raw_materials_grid') || '{}');
            if (section === 'packaging') grid = JSON.parse(localStorage.getItem('packaging_grid') || '{}');
            if (section === 'finished_goods') grid = JSON.parse(localStorage.getItem('finished_goods_grid') || '{}');

            console.log(`📦 Found in old system (${sectionName}):`, Object.keys(grid).length);

            const batch = this.db.batch();
            let added = 0, updated = 0;

            for (const [name, data] of Object.entries(grid)) {
                if (!name || name === 'undefined') continue;
                const existing = this.products.find(p => p.name === name);
                if (existing) {
                    if (!existing.category) {
                        const ref = this.db.collection('products').doc(existing.id);
                        batch.update(ref, { category: section });
                        updated++;
                    }
                } else {
                    const ref = this.db.collection('products').doc();
                    batch.set(ref, {
                        name,
                        category: section,
                        unit: data.unit || (section === 'packaging' ? 'قطعة' : 'كجم'),
                        currentStock: data.stock || 0,
                        avgCost: data.price || 0,
                        createdAt: new Date()
                    });
                    added++;
                }
            }

            if (added + updated === 0) {
                alert('✅ جميع البيانات محدثة بالفعل');
                return;
            }

            if (confirm(`سيتم:\n- إضافة ${added} منتج جديد\n- تحديث ${updated} تصنيف\n\nمتابعة؟`)) {
                await batch.commit();
                alert(`✅ تم الاستيراد بنجاح!\nأضيف: ${added}\nتحدث: ${updated}`);
                this.toggleModal('categoryModal-v2');
            }
        } catch (err) {
            console.error('Import error:', err);
            alert('خطأ: ' + err.message);
        }
    },
    
    toggleTrans() {
        const t = document.querySelector('input[name="mtype-v2"]:checked')?.value || 'inbound';
        const inbound = document.getElementById('inboundFields-v2');
        const outbound = document.getElementById('outboundFields-v2');
        const price = document.getElementById('priceDiv-v2');
        
        if (inbound) inbound.style.display = t === 'inbound' ? 'block' : 'none';
        if (outbound) outbound.style.display = t === 'outbound' ? 'block' : 'none';
        if (price) price.style.visibility = t === 'inbound' ? 'visible' : 'hidden';
        
        const b = document.getElementById('transBadge-v2');
        if (b) {
            b.innerText = t === 'inbound' ? 'وارد' : 'صادر';
            b.className = t === 'inbound' ? 'bg-green-500 text-[10px] px-2 py-0.5 rounded font-bold text-white' : 'bg-red-500 text-[10px] px-2 py-0.5 rounded font-bold text-white';
        }
    },
    
    updateDropdowns() {
        const sel = document.getElementById('prodSelect-v2');
        if (sel) {
            sel.innerHTML = '<option value="">اختر...</option>';
            this.products.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.name;
                sel.appendChild(opt);
            });
        }
        
        // Support both <select> and <input list="..."> for supplier
        const sup = document.getElementById('supplierSelect-v2');
        const supplierNames = ["مزارع الوادي", "مورد الملح", "شركة التغليف"];
        if (sup) {
            if (sup.tagName === 'SELECT') {
                if (sup.children.length === 1) {
                    supplierNames.forEach(s => {
                        const opt = document.createElement('option');
                        opt.textContent = s;
                        sup.appendChild(opt);
                    });
                }
            } else if (sup.tagName === 'INPUT') {
                // populate datalist
                let dl = document.getElementById('suppliers-datalist');
                if (!dl) {
                    dl = document.createElement('datalist');
                    dl.id = 'suppliers-datalist';
                    sup.insertAdjacentElement('afterend', dl);
                }
                dl.innerHTML = '';
                supplierNames.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s;
                    dl.appendChild(opt);
                });
            }
        }
    },
    
    updateHint() {
        const p = this.products.find(x => x.id === document.getElementById('prodSelect-v2')?.value);
        const hint = document.getElementById('stockHint-v2');
        if (hint) {
            hint.innerText = p ? `رصيد: ${p.currentStock} ${p.unit}` : '';
        }
    },
    getCatName(c) { 
        return c === 'raw_material' ? 'خامات' : (c === 'packaging' ? 'تغليف' : 'منتج تام'); 
    },
    formatNum(n) { 
        return parseFloat((n || 0).toFixed(2)); 
    }
};

// إضافة دالة للعودة إلى تاريخ معين
appV2.filterByDate = async function(dateStr) {
    if (!dateStr) {
        console.log('🔄 Clearing date filter - showing current stock');
        this.selectedDate = null;
        this.renderProducts();
        return;
    }
    
    try {
        this.selectedDate = new Date(dateStr + 'T23:59:59');
        console.log(`📅 Filtering by date: ${this.selectedDate.toLocaleDateString('ar-EG')}`);
        
        // إعادة حساب الأرصدة حتى التاريخ المحدد
        await this.calculateHistoricalStock();
        this.renderProducts();
        
        alert(`✅ تم عرض الأرصدة في تاريخ ${this.selectedDate.toLocaleDateString('ar-EG')}`);
    } catch (err) {
        console.error('filterByDate error:', err);
        alert('خطأ في فلترة التاريخ: ' + err.message);
        this.selectedDate = null;
        this.renderProducts();
    }
};

// حساب الأرصدة التاريخية حتى تاريخ معين
appV2.calculateHistoricalStock = async function() {
    if (!this.selectedDate) return;
    
    console.log(`📅 Calculating historical stock up to: ${this.selectedDate.toLocaleDateString('ar-EG')}`);
    
    try {
        const transactions = await this.db.collection('transactions')
            .where('date', '<=', this.selectedDate)
            .orderBy('date')
            .get();
        
        console.log(`📦 Found ${transactions.size} transactions up to selected date`);
        
        // إعادة تعيين الأرصدة التاريخية
        this.products.forEach(p => p.historicalStock = 0);
        
        transactions.forEach(doc => {
            const t = doc.data();
            const prod = this.products.find(p => p.id === t.productId);
            if (prod) {
                if (t.type === 'inbound') {
                    prod.historicalStock = (prod.historicalStock || 0) + t.qty;
                } else if (t.type === 'outbound' || t.type === 'adjustment') {
                    prod.historicalStock = (prod.historicalStock || 0) - t.qty;
                }
            }
        });
        
        console.log(`✅ Historical stock calculated for ${this.products.length} products`);
    } catch (err) {
        console.error('calculateHistoricalStock error:', err);
        alert('خطأ في حساب الأرصدة التاريخية: ' + err.message);
    }
};

// تعديل دالة renderProducts لتدعم التاريخ والفلترة معاً
appV2.renderProducts = function() {
    const tbody = document.getElementById('productsBody-v2');
    if (!tbody) return;
    tbody.innerHTML = '';
    const filter = this.currentProdFilter || 'all';
    
    console.log(`📦 Rendering products - Filter: "${filter}", Date filter: ${this.selectedDate ? this.selectedDate.toLocaleDateString('ar-EG') : 'None'}`);
    
    let list = this.products;
    
    // تطبيق الفلترة بالفئة
    if (filter !== 'all') {
        list = list.filter(p => p.category === filter);
    }
    
    console.log(`✅ Filtered to ${list.length} products`);
    
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="p-6 text-center text-gray-400 text-xs">لا توجد منتجات في هذه الفئة</td></tr>';
        return;
    }
    
    // load any saved draft values for stocktake
    const draftKey = `stocktake-draft:${this.selectedDate ? this.selectedDate.toISOString().slice(0,10) : 'current'}`;
    const drafts = (() => { try { return JSON.parse(localStorage.getItem(draftKey) || '{}'); } catch(e){return {}} })();

    list.forEach(p => {
        // استخدم الرصيد التاريخي إن كان هناك تصفية بالتاريخ، وإلا استخدم الرصيد الحالي
        const stock = this.selectedDate ? (p.historicalStock || 0) : (p.currentStock || 0);
        const row = document.createElement('tr');
        row.className = "hover:bg-blue-50 border-b last:border-0";
        const catName = p.category ? this.getCatName(p.category) : '<span class="text-red-400">غير مصنف</span>';
        row.innerHTML = `
            <td class="p-3 font-bold text-gray-700">${p.name} <span class="block text-[10px] text-gray-400 font-normal">${catName}</span></td>
            <td class="p-3 text-center dir-ltr font-mono text-gray-600 font-bold">${this.formatNum(stock)} ${p.unit || ''}</td>
            <td class="p-3 text-center text-blue-600 font-mono text-xs bg-yellow-50/50">${this.formatNum(p.avgCost)}</td>
        `;
        tbody.appendChild(row);
    });
};

// إضافة تأكيد في saveTrans
appV2.saveTrans = async function(e) {
    e.preventDefault();
    
    const type = document.querySelector('input[name="mtype-v2"]:checked')?.value;
    const pid = document.getElementById('prodSelect-v2')?.value;
    const qty = parseFloat(document.getElementById('qty-v2')?.value);
    const price = parseFloat(document.getElementById('price-v2')?.value || 0);
    
    if (!pid || !qty || qty <= 0) {
        alert("يرجى ملء جميع البيانات");
        return;
    }
    
    // تأكيد الحفظ
    if (!confirm("هل أنت متأكد من حفظ هذه الحركة؟")) {
        return;
    }
    
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) {
        btn.disabled = true;
        btn.innerText = "جاري الحفظ...";
    }
    
    try {
        // استخدام batch بدلاً من transaction لتجنب الـ retry التلقائي الذي يسبب 429
        const batch = this.db.batch();
        const ref = this.db.collection('products').doc(pid);
        
        // قراءة المنتج أولاً (خارج batch)
        const s = await ref.get();
        if (!s.exists) throw "Product not found";
        const p = s.data();
        let ns = p.currentStock || 0, nc = p.avgCost || 0, party = "";

        if (type === 'inbound') {
            const ov = ns * nc, nv = qty * price;
            ns += qty;
            if (ns > 0) nc = (ov + nv) / ns;
            party = document.getElementById('supplierSelect-v2')?.value || "";
        } else {
            if (ns < qty) throw "الرصيد لا يكفي";
            ns -= qty;
            party = document.getElementById('destSelect-v2')?.value || "";
        }
        
        // تحديث المنتج
        batch.update(ref, { currentStock: ns, avgCost: nc });
        
        // إضافة المعاملة
        const transRef = this.db.collection('transactions').doc();
        batch.set(transRef, {
            date: new Date(), type, productId: pid, prodName: p.name, qty, party, stockAfter: ns
        });
        
        // تنفيذ batch
        await batch.commit();
        
        alert("تم الحفظ بنجاح ✅");
        e.target.reset();
        this.toggleTrans();
    } catch (err) { 
        console.error('saveTrans error:', err);
        if (err.code === 'resource-exhausted') {
            alert("تم تجاوز حد الطلبات. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.");
        } else {
            alert("خطأ: " + err.message || err); 
        }
    } 
    finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = "حفظ الحركة";
        }
    }
};

// إضافة دالة لإلغاء ترحيل
appV2.cancelTransaction = async function(transId) {
    if (!confirm("هل أنت متأكد من إلغاء هذه المعاملة؟ سيتم تعديل الرصيد العكسي.")) {
        return;
    }
    
    try {
        const transDoc = await this.db.collection('transactions').doc(transId).get();
        if (!transDoc.exists) throw "المعاملة غير موجودة";
        
        const trans = transDoc.data();
        const prodRef = this.db.collection('products').doc(trans.productId);
        const prodDoc = await prodRef.get();
        if (!prodDoc.exists) throw "المنتج غير موجود";
        
        const prod = prodDoc.data();
        let newStock = prod.currentStock;
        
        // عكس المعاملة
        if (trans.type === 'inbound') {
            newStock -= trans.qty;
        } else if (trans.type === 'outbound') {
            newStock += trans.qty;
        }
        
        // تحديث الرصيد وإضافة معاملة إلغاء
        const batch = this.db.batch();
        batch.update(prodRef, { currentStock: newStock });
        batch.set(this.db.collection('transactions').doc(), {
            date: new Date(),
            type: 'cancellation',
            productId: trans.productId,
            prodName: trans.prodName,
            qty: trans.qty,
            party: 'إلغاء معاملة',
            stockAfter: newStock,
            originalTransId: transId
        });
        batch.delete(this.db.collection('transactions').doc(transId));
        
        await batch.commit();
        alert("تم إلغاء المعاملة بنجاح ✅");
        
        // إعادة تحميل البيانات
        this.startListeners();
        
    } catch (err) {
        console.error('cancelTransaction error:', err);
        alert("خطأ في إلغاء المعاملة: " + err.message);
    }
};

// تعديل / حذف معاملة: يسمح بتعديل الكمية أو الجهة، ثم إعادة حساب رصيد المنتج
appV2.editTransaction = async function(transId) {
    try {
        // تحديد إذا كان المستخدم مسؤولاً
        const userRole = (typeof getUserRole === 'function') ? getUserRole() : 'user';
        const isAdmin = userRole === 'admin' || window.isAdmin;
        
        if (!isAdmin) {
            alert('⚠️ لا توجد صلاحيات لتعديل المعاملات.\nفقط المسؤولون يستطيعون تعديل المعاملات.');
            return;
        }
        
        const doc = await this.db.collection('transactions').doc(transId).get();
        if (!doc.exists) { alert('المعاملة غير موجودة'); return; }
        const d = doc.data();
        const newQtyStr = prompt('الكمية الجديدة:', d.qty);
        if (newQtyStr === null) return; // cancelled
        const newQty = parseFloat(newQtyStr);
        if (isNaN(newQty)) { alert('قيمة غير صحيحة للكمية'); return; }
        const newParty = prompt('الجهة / المورد:', d.party || '') || '';

        await this.db.collection('transactions').doc(transId).update({ qty: newQty, party: newParty });
        // إعادة حساب مخزون المنتج
        if (d.productId) await this.recalcProductStock(d.productId);
        alert('✅ تم تعديل المعاملة');
        this.loadLogs(); // تحديث السجلات
    } catch (err) {
        console.error('editTransaction error:', err);
        alert('خطأ في تعديل المعاملة: ' + (err.message || err));
    }
};

appV2.deleteTransaction = async function(transId) {
    try {
        // تحديد إذا كان المستخدم مسؤولاً
        const userRole = (typeof getUserRole === 'function') ? getUserRole() : 'user';
        const isAdmin = userRole === 'admin' || window.isAdmin;
        
        if (!isAdmin) {
            alert('⚠️ لا توجد صلاحيات لحذف المعاملات.\nفقط المسؤولون يستطيعون حذف المعاملات.');
            return;
        }
        
        if (!confirm('هل تريد حذف هذه المعاملة نهائياً؟')) return;
        const doc = await this.db.collection('transactions').doc(transId).get();
        if (!doc.exists) { alert('المعاملة غير موجودة'); return; }
        const d = doc.data();
        await this.db.collection('transactions').doc(transId).delete();
        if (d.productId) await this.recalcProductStock(d.productId);
        alert('✅ تم حذف المعاملة');
        this.loadLogs(); // تحديث السجلات
    } catch (err) {
        console.error('deleteTransaction error:', err);
        alert('خطأ في حذف المعاملة: ' + (err.message || err));
    }
};

// Recalculate product currentStock from transactions
appV2.recalcProductStock = async function(productId) {
    try {
        const snaps = await this.db.collection('transactions').where('productId','==',productId).orderBy('date').get();
        let stock = 0;
        snaps.forEach(s => {
            const t = s.data();
            if (t.type === 'inbound') stock += t.qty;
            else if (t.type === 'outbound' || t.type === 'adjustment') stock -= t.qty;
        });
        await this.db.collection('products').doc(productId).update({ currentStock: stock });
    } catch (err) {
        console.error('recalcProductStock error:', err);
    }
};

// تعديل دالة submitStocktake لتأكيد أقوى جداً
appV2.submitStocktake = async function() {
    const inputs = document.querySelectorAll('.st-inp-v2');
    const batch = this.db.batch();
    let count = 0;
    let totalDiff = 0;
    
    inputs.forEach(inp => {
        if (inp.value !== "") {
            const pid = inp.dataset.pid, actual = parseFloat(inp.value), sys = parseFloat(inp.dataset.sys);
            const diff = actual - sys;
            if (diff !== 0) {
                const ref = this.db.collection('products').doc(pid);
                batch.update(ref, { currentStock: actual });
                batch.set(this.db.collection('transactions').doc(), {
                    date: new Date(), type: 'adjustment', productId: pid, prodName: 'تسوية جرد', qty: diff, party: 'جرد دوري', stockAfter: actual
                });
                count++;
                totalDiff += Math.abs(diff);
            }
        }
    });
    
    if (count === 0) {
        alert("لا توجد تغييرات للترحيل (جميع الأصناف مطابقة)");
        return;
    }
    
    // تأكيد قوي جداً للترحيل
    let confirmMsg = `⚠️ تحذير مهم جداً!\n\n`;
    confirmMsg += `سيتم إغلاق عملية الجرد والترحيل:\n`;
    confirmMsg += `• عدد الأصناف المتأثرة: ${count}\n`;
    confirmMsg += `• إجمالي الفروقات: ${Math.round(totalDiff * 100) / 100} وحدة\n\n`;
    confirmMsg += `⚠️ تنبيهات مهمة:\n`;
    confirmMsg += `- لا يمكن التراجع عن هذا الإجراء\n`;
    confirmMsg += `- سيتم تسجيل كل التعديلات في السجل الدائم\n`;
    confirmMsg += `- تحقق من جميع الأصناس المتأثرة قبل المتابعة\n\n`;
    confirmMsg += `هل أنت متأكد تماماً من المتابعة؟`;
    
    const confirmed = confirm(confirmMsg);
    
    if (!confirmed) {
        alert('✅ تم إلغاء عملية الترحيل. البيانات محفوظة.');
        return;
    }
    
    // تأكيد ثانوي نهائي
    const finalConfirm = confirm(`⚠️ تأكيد نهائي!\n\nسيتم إغلاق الجرد والترحيل نهائياً.\nلا يمكن التراجع عن هذا القرار.\n\nهل تريد المتابعة بدون تردد؟`);
    
    if (!finalConfirm) {
        alert('✅ تم إلغاء عملية الترحيل. البيانات محفوظة.');
        return;
    }
    
    try {
        await batch.commit();
        alert(`✅ تم الترحيل والاعتماد بنجاح!\n\n✓ تم تحديث ${count} صنف\n✓ إجمالي الفروقات: ${Math.round(totalDiff * 100) / 100}\n✓ تم تسجيل العملية في السجل الدائم\n✓ لا يمكن التراجع عن هذه العملية`);
        inputs.forEach(i => i.value = '');
        document.querySelectorAll('.diff-cell').forEach(d => d.textContent = '-');
        // clear draft for this stocktake
        try { localStorage.removeItem(`stocktake-draft:${this.selectedDate ? this.selectedDate.toISOString().slice(0,10) : 'current'}`); } catch(e){}
        this.renderStock();
    } catch (err) {
        console.error('submitStocktake error:', err);
        alert("❌ خطأ في الترحيل: " + err.message);
    }
};

// Make appV2 globally available immediately
window.appV2 = appV2;

// Initialize when Firebase is ready
let __initV2Attempts = 0;
const __MAX_INIT_V2_ATTEMPTS = 60; // up to ~60s waiting for auth/db
function initV2() {
    // Require authenticated user before initializing
    const isLoggedIn = !!(window.AuthSystem && typeof window.AuthSystem.getCurrentUser === 'function' && window.AuthSystem.getCurrentUser());
    if (!isLoggedIn) {
        if (__initV2Attempts < __MAX_INIT_V2_ATTEMPTS) {
            __initV2Attempts++;
            return setTimeout(initV2, 1000);
        }
        console.warn('⚠️ Stock Control V2: init skipped (no authenticated user).');
        return;
    }

    if (window.db) {
        console.log('🚀 Initializing Stock Control V2...');
        appV2.init();
    } else if (__initV2Attempts < __MAX_INIT_V2_ATTEMPTS) {
        __initV2Attempts++;
        setTimeout(initV2, 1000);
    }
}

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initV2, 1000));
} else {
    setTimeout(initV2, 1000);
}

console.log('✅ Stock Control V2 script loaded');
