// Stock Control V2 - Embedded in SPA
console.log('⏳ Stock Control V2 script loading...');

const appV2 = {
    db: null,
    auth: null,
    products: [],
    currentProdFilter: 'all',
    stockCategory: 'finished_goods',

    async init() {
        try {
            // Wait for parent app Firebase to be ready
            if (!window.db || !window.auth) {
                console.warn('⏳ Waiting for parent Firebase...');
                setTimeout(() => this.init(), 500);
                return;
            }
            
            this.db = window.db;
            this.auth = window.auth;
            
            console.log('✅ V2 using parent app Firebase instance');
            this.startListeners();
            this.loadLogs();
            
            // Set initial status
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
            const ref = firebase.firestore().collection('products');
            ref.onSnapshot((snapshot) => {
                this.products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                this.products.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                
                console.log('✅ V2 Products loaded:', this.products.length);
                
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
        const name = document.getElementById('newProdName-v2').value;
        const cat = document.getElementById('newProdCat-v2').value;
        const unit = document.getElementById('newProdUnit-v2').value;
        try {
            await firebase.firestore().collection('products').add({
                name, category: cat, unit, currentStock: 0, avgCost: 0, createdAt: new Date()
            });
            alert("تمت الإضافة");
            this.toggleModal('productModal-v2');
            e.target.reset();
        } catch (err) { alert("خطأ: " + err.message); }
    },

    filterProd(cat) {
        this.currentProdFilter = cat;
        document.querySelectorAll('.filter-chip-v2').forEach(btn => {
            const isActive = btn.getAttribute('onclick').includes(`'${cat}'`);
            btn.className = isActive
                ? "filter-chip-v2 active bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold shadow" 
                : "filter-chip-v2 bg-white border text-gray-600 px-3 py-1 rounded text-xs font-bold";
        });
        this.renderProducts();
    },

    renderProducts() {
        const tbody = document.getElementById('productsBody-v2');
        if (!tbody) return;
        tbody.innerHTML = '';
        const filter = this.currentProdFilter || 'all';
        const list = this.products.filter(p => filter === 'all' || p.category === filter);
        
        list.forEach(p => {
            const row = document.createElement('tr');
            row.className = "hover:bg-blue-50 border-b last:border-0";
            row.innerHTML = `
                <td class="p-3 font-bold text-gray-700">${p.name} <span class="block text-[10px] text-gray-400 font-normal">${this.getCatName(p.category)}</span></td>
                <td class="p-3 text-center dir-ltr font-mono text-gray-600 font-bold">${this.formatNum(p.currentStock)} ${p.unit}</td>
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
            const db = firebase.firestore();
            await db.runTransaction(async (t) => {
                const ref = db.collection('products').doc(pid);
                const s = await t.get(ref);
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
                t.update(ref, { currentStock: ns, avgCost: nc });
                t.set(db.collection('transactions').doc(), {
                    date: new Date(), type, productId: pid, prodName: p.name, qty, party, stockAfter: ns
                });
            });
            alert("تم الحفظ");
            e.target.reset();
            this.toggleTrans();
        } catch (err) { alert("خطأ: " + err); } 
        finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = "حفظ الحركة";
            }
        }
    },

    filterStock(cat) {
        this.stockCategory = cat;
        document.querySelectorAll('.st-filter-v2').forEach(btn => {
            const isActive = btn.getAttribute('onclick').includes(`'${cat}'`);
            btn.className = isActive
                ? "st-filter-v2 active text-[10px] px-2 py-1 rounded bg-blue-600 text-white" 
                : "st-filter-v2 text-[10px] px-2 py-1 rounded border bg-white text-gray-500";
        });
        this.renderStock();
    },

    renderStock() {
        const tbody = document.getElementById('stockBody-v2');
        if (!tbody) return;
        tbody.innerHTML = '';
        const cat = this.stockCategory || 'finished_goods';
        this.products.filter(p => p.category === cat).forEach(p => {
            const row = document.createElement('tr');
            row.className = "border-b hover:bg-gray-50";
            row.innerHTML = `
                <td class="p-2 text-[11px] font-bold text-gray-700">${p.name}</td>
                <td class="p-2 text-center text-[10px] text-gray-400 font-mono">${this.formatNum(p.currentStock)}</td>
                <td class="p-2 text-center"><input type="number" step="0.01" class="w-16 border rounded text-center p-1 text-xs outline-none focus:border-blue-500 st-inp-v2" data-pid="${p.id}" data-sys="${p.currentStock}"></td>
                <td class="p-2 text-center text-[10px] font-bold text-gray-300 diff-cell">-</td>
            `;
            const inp = row.querySelector('.st-inp-v2');
            if (inp) {
                inp.oninput = (e) => this.calcDiff(e.target);
            }
            tbody.appendChild(row);
        });
    },

    calcDiff(input) {
        const sys = parseFloat(input.dataset.sys);
        const actual = parseFloat(input.value);
        const cell = input.closest('tr').querySelector('.diff-cell');
        if (isNaN(actual)) { cell.innerText = '-'; return; }
        const diff = actual - sys;
        cell.innerText = diff > 0 ? `+${this.formatNum(diff)}` : this.formatNum(diff);
        cell.className = `diff-cell p-2 text-center text-[10px] font-bold ${diff < 0 ? 'text-red-600' : (diff > 0 ? 'text-green-600' : 'text-gray-400')}`;
    },

    async submitStock() {
        const inputs = document.querySelectorAll('.st-inp-v2');
        const db = firebase.firestore();
        const batch = db.batch();
        let count = 0;
        inputs.forEach(inp => {
            if (inp.value !== "") {
                const pid = inp.dataset.pid, actual = parseFloat(inp.value), sys = parseFloat(inp.dataset.sys);
                if (actual !== sys) {
                    const ref = db.collection('products').doc(pid);
                    batch.update(ref, { currentStock: actual });
                    batch.set(db.collection('transactions').doc(), {
                        date: new Date(), type: 'adjustment', productId: pid, prodName: 'تسوية جرد', qty: actual - sys, party: 'جرد دوري'
                    });
                    count++;
                }
            }
        });
        if (count > 0 && confirm(`اعتماد ${count} أصناف؟`)) {
            try {
                await batch.commit();
                alert("تم الترحيل");
                inputs.forEach(i => i.value = '');
                this.renderStock();
            } catch (e) { alert(e.message); }
        } else alert("لا توجد تغييرات");
    },

    loadLogs() {
        const tbody = document.getElementById('logsBody-v2');
        if (!tbody) return;
        
        try {
            firebase.firestore().collection('transactions')
                .orderBy('date', 'desc')
                .limit(50)
                .onSnapshot((snap) => {
                    tbody.innerHTML = '';
                    if (snap.empty) {
                        tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-gray-400 text-xs">لا توجد حركات</td></tr>';
                        return;
                    }
                    snap.forEach(doc => {
                        const d = doc.data();
                        const date = d.date ? new Date(d.date.seconds * 1000).toLocaleDateString('ar-EG') : '-';
                        const type = d.type === 'inbound' ? 'وارد' : (d.type === 'outbound' ? 'صادر' : 'تسوية');
                        const color = d.type === 'inbound' ? 'text-green-600' : (d.type === 'outbound' ? 'text-red-600' : 'text-gray-600');
                        const row = document.createElement('tr');
                        row.className = "hover:bg-gray-50 border-b";
                        row.innerHTML = `
                            <td class="p-3 text-gray-500 dir-ltr font-mono text-[10px]">${date}</td>
                            <td class="p-3 text-[10px] font-bold ${color}">${type}</td>
                            <td class="p-3 font-bold text-gray-700">${d.prodName || '-'}</td>
                            <td class="p-3 font-mono dir-ltr font-bold text-xs">${d.qty}</td>
                            <td class="p-3 text-xs text-gray-500">${d.party || '-'}</td>
                        `;
                        tbody.appendChild(row);
                    });
                }, err => console.log('V2 loadLogs error:', err));
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
    },
    
    toggleModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.toggle('hidden');
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
        
        const sup = document.getElementById('supplierSelect-v2');
        if (sup && sup.children.length === 0) {
            ["مزارع الوادي", "مورد الملح", "شركة التغليف"].forEach(s => {
                const opt = document.createElement('option');
                opt.textContent = s;
                sup.appendChild(opt);
            });
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

// Initialize when Firebase is ready
function initV2() {
    if (window.db && window.auth) {
        console.log('🚀 Initializing Stock Control V2...');
        appV2.init();
    } else {
        console.log('⏳ Firebase not ready yet, retrying...');
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
