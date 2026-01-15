// ===============================================
// Costs V2 System - نظام تكاليف الألبان v2
// مستقل تماماً عن النظام القديم
// ===============================================
// يستخدم Firebase db الموحد من window.db
// مع تطبيق window.storeSubscription لمنع نزيف البيانات

(function() {
    'use strict';

    // ===== Config =====
    const COLL_PRODUCTS = 'products';
    const COLL_RECIPES = `artifacts/${window.__app_id || 'dairy-app-1'}/public/data/recipes`;
    const COLL_BATCHES = `artifacts/${window.__app_id || 'dairy-app-1'}/public/data/batches`;
    const COLL_SALES = `artifacts/${window.__app_id || 'dairy-app-1'}/public/data/batch_sales`;

    // ===== State =====
    let ingredientsMap = {};
    let packagingMap = {};
    let currentBatchId = null;
    let allRecipes = {};
    let allBatches = {};

    // ===== Helpers =====
    function getDb() {
        if (!window.db) {
            console.error('Firebase db not initialized');
            return null;
        }
        return window.db;
    }

    function safe(id, val) {
        const el = document.getElementById(id);
        if(el) el.innerText = val;
    }

    function openModV2(id) {
        const el = document.getElementById(id);
        if(el) el.classList.remove('hidden');
    }

    function closeModV2(id) {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    }

    // ===== VIEW SWITCHING =====
    function switchCostsView(viewName) {
        // إخفاء كل الصفحات - استخدام .hidden class
        document.querySelectorAll('.v2-view-section').forEach(v => {
            v.classList.add('hidden');
        });

        // إظهار الصفحة المطلوبة بإزالة .hidden class
        const view = document.getElementById(`v2-view-${viewName}`);
        if(view) {
            view.classList.remove('hidden');
        }

        // تحديث أزرار التنقل
        document.querySelectorAll('.costsv2-nav-btn').forEach(btn => {
            btn.classList.remove('costsv2-nav-active');
            btn.classList.add('costsv2-nav-inactive');
        });

        const activeBtn = document.querySelector(`[data-view-name="${viewName}"]`);
        if(activeBtn) {
            activeBtn.classList.add('costsv2-nav-active');
            activeBtn.classList.remove('costsv2-nav-inactive');
        }

        // تحديث icons
        if(window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }

        // تحميل البيانات إذا لزم الأمر
        if(viewName === 'prices') loadPrices();
        if(viewName === 'recipes') loadRecipes();
        if(viewName === 'batches') loadBatches();
        if(viewName === 'reports') loadReports();
        if(viewName === 'dashboard') loadDashboard();
    }

    // ===== navTo (ALIAS FOR BACKWARD COMPATIBILITY) =====
    function navTo(viewName) {
        return switchCostsView(viewName);
    }

    // ===== 1. PRICE GRID VIEW =====
    function loadPrices() {
        const db = getDb();
        if(!db) return;

        console.log('📊 Loading prices from products collection...');

        const unsub = db.collection(COLL_PRODUCTS).onSnapshot(snap => {
            const tbody = document.getElementById('v2-prices-tbody');
            if(!tbody) return;

            tbody.innerHTML = '';
            ingredientsMap = {};
            packagingMap = {};

            let rawCount = 0, packCount = 0;

            snap.docs.forEach(doc => {
                const p = doc.data();
                if(!p.category) return;

                const cat = p.category.toLowerCase();
                const isRaw = cat.includes('خامة') || cat.includes('مادة خام');
                const isPack = cat.includes('تغليف') || cat.includes('packaging');

                if(!isRaw && !isPack) return;

                const mapKey = doc.id;
                const cost = p.avgCost || p.costPrice || 0;

                if(isRaw) {
                    ingredientsMap[mapKey] = {
                        id: doc.id,
                        name: p.name || 'بدون اسم',
                        unit: p.unit || 'كجم',
                        cost: cost,
                        type: 'خامة'
                    };
                    rawCount++;
                } else {
                    packagingMap[mapKey] = {
                        id: doc.id,
                        name: p.name || 'بدون اسم',
                        unit: p.unit || 'كجم',
                        cost: cost,
                        type: 'تغليف'
                    };
                    packCount++;
                }

                const data = isRaw ? ingredientsMap[mapKey] : packagingMap[mapKey];

                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-50 border-b transition';
                tr.innerHTML = `
                    <td class="p-3 font-bold text-slate-800">${data.name}</td>
                    <td class="p-3 text-xs font-bold text-slate-500">${data.unit}</td>
                    <td class="p-3 font-bold text-orange-600 text-base">${cost.toFixed(2)}</td>
                    <td class="p-3 text-xs text-slate-500">Stock Control</td>
                    <td class="p-3 text-center">
                        <span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-[10px] font-bold">🔄 تلقائي</span>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            if(rawCount === 0 && packCount === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="p-8 text-center text-slate-400">
                            <div class="text-3xl mb-2">📦</div>
                            <p class="font-bold">لا توجد خامات أو تغليف بعد</p>
                            <p class="text-xs">أضف منتجات في Stock Control بفئة "خامة" أو "تغليف"</p>
                        </td>
                    </tr>
                `;
            } else {
                console.log(`✅ تم تحميل ${rawCount} خامة و ${packCount} تغليف`);
            }
        });

        window.storeSubscription('v2-prices', unsub);
    }

    // ===== 2. RECIPES VIEW =====
    function loadRecipes() {
        const db = getDb();
        if(!db) return;

        const unsub = db.collection(COLL_RECIPES).onSnapshot(snap => {
            const grid = document.getElementById('v2-recipes-grid');
            if(!grid) return;

            grid.innerHTML = '';
            allRecipes = {};

            snap.docs.forEach(doc => {
                const r = doc.data();
                allRecipes[doc.id] = r;

                const card = document.createElement('div');
                card.className = 'bg-white rounded-xl shadow-md p-5 border border-slate-200 hover:shadow-lg transition';
                card.innerHTML = `
                    <div class="flex justify-between items-start mb-3">
                        <h4 class="font-bold text-slate-800 text-base">${r.name}</h4>
                        <span class="bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded font-bold">${r.unit}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-3 mb-3">
                        <div class="bg-red-50 p-2 rounded text-center">
                            <p class="text-[10px] text-red-600 font-bold">التكلفة</p>
                            <p class="font-bold text-red-700">${r.estimatedCost || 0}</p>
                        </div>
                        <div class="bg-emerald-50 p-2 rounded text-center">
                            <p class="text-[10px] text-emerald-600 font-bold">سعر البيع</p>
                            <p class="font-bold text-emerald-700">${r.stdPrice || 0}</p>
                        </div>
                    </div>
                    <button onclick="window.CostsV2.editRecipe('${doc.id}')" class="w-full bg-blue-600 text-white text-xs font-bold py-2 rounded hover:bg-blue-700">تعديل</button>
                `;
                grid.appendChild(card);
            });

            if(snap.empty) {
                grid.innerHTML = `
                    <div class="col-span-full text-center py-12 text-slate-400">
                        <div class="text-2xl mb-2">🍶</div>
                        <p class="font-bold">لا توجد وصفات بعد</p>
                        <p class="text-xs mb-3">أنشئ وصفة جديدة للبدء</p>
                        <button onclick="window.CostsV2.openAddRecipeModal()" class="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm">إضافة وصفة</button>
                    </div>
                `;
            }
        });

        window.storeSubscription('v2-recipes', unsub);
    }

    function openAddRecipeModal() {
        closeModV2('v2-modal-recipe');
        setTimeout(() => {
            document.getElementById('v2-recipe-name').value = '';
            document.getElementById('v2-recipe-unit').value = '';
            document.getElementById('v2-recipe-overhead').value = '0';
            document.getElementById('v2-recipe-price').value = '0';
            document.getElementById('v2-recipe-ingredients').innerHTML = '';
            openModV2('v2-modal-recipe');
            addIngredientRow();
        }, 100);
    }

    function addIngredientRow() {
        const list = document.getElementById('v2-recipe-ingredients');
        if(!list) return;

        let opts = '<option value="">-- اختر خامة --</option>';
        for(let id in ingredientsMap) {
            opts += `<option value="${id}" data-cost="${ingredientsMap[id].cost}">${ingredientsMap[id].name}</option>`;
        }

        const row = document.createElement('tr');
        row.className = 'v2-ing-row border-b hover:bg-slate-50';
        row.innerHTML = `
            <td class="p-2">
                <select onchange="window.CostsV2.calcRecipeCost()" class="v2-ing-sel w-full p-2 border rounded text-sm bg-white font-bold">
                    ${opts}
                </select>
            </td>
            <td class="p-2">
                <input type="number" step="0.01" min="0" onfocus="this.select()" oninput="window.CostsV2.calcRecipeCost()" class="v2-ing-qty w-full p-2 border rounded text-sm text-center font-bold" placeholder="0">
            </td>
            <td class="p-2 text-center">
                <button type="button" onclick="this.closest('tr').remove(); window.CostsV2.calcRecipeCost()" class="text-red-500 hover:text-red-700 font-bold">✕</button>
            </td>
        `;
        list.appendChild(row);
    }

    function calcRecipeCost() {
        let total = 0;
        document.querySelectorAll('.v2-ing-row').forEach(row => {
            const sel = row.querySelector('.v2-ing-sel');
            const qty = parseFloat(row.querySelector('.v2-ing-qty').value || 0);
            if(sel && sel.value) {
                const cost = parseFloat(sel.options[sel.selectedIndex]?.dataset?.cost || 0);
                total += (cost * qty);
            }
        });

        total += parseFloat(document.getElementById('v2-recipe-overhead')?.value || 0);
        const el = document.getElementById('v2-recipe-final-cost');
        if(el) el.innerText = total.toFixed(2);
    }

    function saveRecipe(e) {
        e.preventDefault();
        const db = getDb();
        if(!db) return;

        const ingList = [];
        document.querySelectorAll('.v2-ing-row').forEach(row => {
            const sel = row.querySelector('.v2-ing-sel');
            if(sel && sel.value) {
                ingList.push({
                    id: sel.value,
                    qty: parseFloat(row.querySelector('.v2-ing-qty').value || 0)
                });
            }
        });

        const data = {
            name: document.getElementById('v2-recipe-name').value,
            unit: document.getElementById('v2-recipe-unit').value,
            ingredients: ingList,
            overhead: parseFloat(document.getElementById('v2-recipe-overhead').value || 0),
            stdPrice: parseFloat(document.getElementById('v2-recipe-price').value || 0),
            estimatedCost: parseFloat(document.getElementById('v2-recipe-final-cost').innerText || 0),
            createdAt: new Date().toISOString()
        };

        db.collection(COLL_RECIPES).add(data)
            .then(() => {
                closeModV2('v2-modal-recipe');
                console.log('✅ تم حفظ الوصفة');
                loadRecipes();
            })
            .catch(err => {
                console.error('Error saving recipe:', err);
                alert('خطأ في الحفظ');
            });
    }

    function editRecipe(recipeId) {
        const recipe = allRecipes[recipeId];
        if(!recipe) return;

        console.log('تحرير وصفة:', recipe);
        // يمكن إضافة modal للتحرير لاحقاً
    }

    // ===== 3. BATCHES VIEW =====
    function loadBatches() {
        const db = getDb();
        if(!db) return;

        const unsub = db.collection(COLL_BATCHES).orderBy('createdAt', 'desc').onSnapshot(snap => {
            const active = document.getElementById('v2-active-batches');
            const completed = document.getElementById('v2-completed-batches');
            if(!active || !completed) return;

            active.innerHTML = '';
            completed.innerHTML = '';
            allBatches = {};

            snap.docs.forEach(doc => {
                const b = doc.data();
                allBatches[doc.id] = b;

                const card = document.createElement('div');
                card.className = 'bg-white rounded-xl shadow-md p-4 border border-slate-200 flex justify-between items-center mb-3';

                if(b.status === 'active') {
                    card.innerHTML = `
                        <div class="flex-1">
                            <p class="font-bold text-slate-800">تشغيلة #${b.batchNumber}</p>
                            <p class="text-sm text-slate-600">${b.recipeName}</p>
                            <p class="text-xs text-slate-500">تكلفة متوقعة: ${b.estimatedCost}</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="window.CostsV2.openCloseBatchModal('${doc.id}')" class="bg-red-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-red-700">إنهاء</button>
                        </div>
                    `;
                    active.appendChild(card);
                } else {
                    card.innerHTML = `
                        <div class="flex-1">
                            <p class="font-bold text-slate-800">تشغيلة #${b.batchNumber}</p>
                            <p class="text-sm text-slate-600">${b.recipeName}</p>
                            <p class="text-xs text-green-600">الربح: ${(b.netProfit || 0).toLocaleString()} ج.م</p>
                        </div>
                        <span class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">✓ مكتملة</span>
                    `;
                    completed.appendChild(card);
                }
            });

            if(active.innerHTML === '') {
                active.innerHTML = '<p class="text-center text-slate-400 py-4">لا توجد تشغيلات جارية</p>';
            }
            if(completed.innerHTML === '') {
                completed.innerHTML = '<p class="text-center text-slate-400 py-4">لا توجد تشغيلات منتهية</p>';
            }
        });

        window.storeSubscription('v2-batches', unsub);
    }

    function openCloseBatchModal(batchId) {
        document.getElementById('v2-close-batch-id').value = batchId;
        const batch = allBatches[batchId];
        if(batch) {
            document.getElementById('v2-close-est-cost').value = batch.estimatedCost || 0;
        }
        openModV2('v2-modal-close-batch');
    }

    function closeBatch(e) {
        e.preventDefault();
        const db = getDb();
        if(!db) return;

        const batchId = document.getElementById('v2-close-batch-id').value;
        const totalCost = parseFloat(document.getElementById('v2-close-est-cost').value);
        const finalQty = parseFloat(document.getElementById('v2-close-final-qty').value);

        if(!finalQty || finalQty <= 0) {
            alert('أدخل كمية صحيحة');
            return;
        }

        const unitCost = totalCost / finalQty;

        db.collection(COLL_BATCHES).doc(batchId).update({
            status: 'closed',
            finalQty: finalQty,
            totalCost: totalCost,
            unitCost: unitCost,
            closedAt: new Date().toISOString(),
            soldQty: 0,
            totalRevenue: 0,
            netProfit: -totalCost
        })
            .then(() => {
                closeModV2('v2-modal-close-batch');
                console.log('✅ تم إغلاق التشغيلة');
                loadBatches();
            })
            .catch(err => {
                console.error('Error closing batch:', err);
                alert('خطأ في الحفظ');
            });
    }

    // ===== 4. REPORTS VIEW =====
    function loadReports() {
        const db = getDb();
        if(!db) return;

        const unsub = db.collection(COLL_BATCHES).where('status', '==', 'closed').onSnapshot(snap => {
            const tbody = document.getElementById('v2-reports-tbody');
            if(!tbody) return;

            tbody.innerHTML = '';
            let totalProfit = 0, totalRevenue = 0, totalCost = 0;

            snap.docs.forEach(doc => {
                const b = doc.data();
                const cogs = (b.soldQty || 0) * b.unitCost;
                const profit = b.netProfit || 0;
                const margin = b.totalRevenue > 0 ? ((profit / b.totalRevenue) * 100).toFixed(1) : 0;

                totalProfit += profit;
                totalRevenue += (b.totalRevenue || 0);
                totalCost += cogs;

                const tr = document.createElement('tr');
                tr.className = 'border-b hover:bg-slate-50';
                tr.innerHTML = `
                    <td class="p-3 font-mono text-slate-500">#${b.batchNumber}</td>
                    <td class="p-3 font-bold text-slate-800">${b.recipeName}</td>
                    <td class="p-3 text-orange-600 font-bold">${b.unitCost.toFixed(2)}</td>
                    <td class="p-3 text-center text-slate-700 font-bold">${b.soldQty || 0} / ${b.finalQty}</td>
                    <td class="p-3 text-emerald-600 font-bold">${(b.totalRevenue || 0).toLocaleString()}</td>
                    <td class="p-3 text-red-600 font-bold">${cogs.toLocaleString()}</td>
                    <td class="p-3 font-bold ${profit >= 0 ? 'text-emerald-700' : 'text-red-700'}">${profit.toFixed(0)}</td>
                    <td class="p-3 text-sm font-bold">${margin}%</td>
                `;
                tbody.appendChild(tr);
            });

            safe('v2-report-total-profit', totalProfit.toLocaleString() + ' ج.م');
            safe('v2-report-total-revenue', totalRevenue.toLocaleString() + ' ج.م');
            safe('v2-report-total-cogs', totalCost.toLocaleString() + ' ج.م');
        });

        window.storeSubscription('v2-reports', unsub);
    }

    // ===== 5. DASHBOARD VIEW =====
    function loadDashboard() {
        const db = getDb();
        if(!db) return;

        // عرض ملخص سريع من التشغيلات
        const unsub = db.collection(COLL_BATCHES)
            .where('status', '==', 'active')
            .onSnapshot(snap => {
                const list = document.getElementById('costsv2-dashboard-activity-list');
                if(!list) return;

                if(snap.empty) {
                    list.innerHTML = `
                        <div class="flex flex-col items-center justify-center p-12 text-slate-400">
                            <i data-lucide="inbox" class="w-12 h-12 mb-2"></i>
                            <p class="font-bold">لا توجد تشغيلات جارية</p>
                            <p class="text-xs">ابدأ تشغيلة جديدة من صفحة التشغيلات</p>
                        </div>
                    `;
                } else {
                    list.innerHTML = '';
                    snap.docs.forEach(doc => {
                        const b = doc.data();
                        const item = document.createElement('div');
                        item.className = 'p-4 hover:bg-slate-50 transition flex justify-between items-center';
                        item.innerHTML = `
                            <div>
                                <p class="font-bold text-slate-800">تشغيلة #${b.batchNumber}</p>
                                <p class="text-xs text-slate-500">${b.recipeName}</p>
                            </div>
                            <span class="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-bold">جارية</span>
                        `;
                        list.appendChild(item);
                    });
                }

                if(window.lucide && typeof window.lucide.createIcons === 'function') {
                    window.lucide.createIcons();
                }
            });

        window.storeSubscription('v2-dashboard', unsub);
    }

    // ===== SEED DATA =====
    function seedSampleData() {
        const db = getDb();
        if(!db) {
            alert('Firebase لم يتم تهيئة بعد');
            return;
        }

        const sampleProducts = [
            {
                name: 'حليب بقري (الألف)',
                category: 'خامة',
                unit: 'لتر',
                costPrice: 5.50,
                avgCost: 5.50,
                currentStock: 500,
                supplier: 'الموردون المحليون'
            },
            {
                name: 'حليب كاموميل',
                category: 'خامة',
                unit: 'لتر',
                costPrice: 7.00,
                avgCost: 7.00,
                currentStock: 300,
                supplier: 'المزرعة الشامية'
            },
            {
                name: 'بودرة حليب',
                category: 'خامة',
                unit: 'كجم',
                costPrice: 80.00,
                avgCost: 80.00,
                currentStock: 50,
                supplier: 'الواردات'
            },
            {
                name: 'سكر',
                category: 'خامة',
                unit: 'كجم',
                costPrice: 12.00,
                avgCost: 12.00,
                currentStock: 100,
                supplier: 'مصر للسكر'
            },
            {
                name: 'نكهة فانيليا',
                category: 'خامة',
                unit: 'لتر',
                costPrice: 40.00,
                avgCost: 40.00,
                currentStock: 20,
                supplier: 'المواد الكيميائية'
            },
            {
                name: 'زجاجات بلاستيك 500ml',
                category: 'تغليف',
                unit: 'عبوة',
                costPrice: 0.80,
                avgCost: 0.80,
                currentStock: 5000,
                supplier: 'مصنع البلاستيك'
            },
            {
                name: 'أغطية معدنية',
                category: 'تغليف',
                unit: 'عبوة',
                costPrice: 0.50,
                avgCost: 0.50,
                currentStock: 5000,
                supplier: 'المعادن والتغليف'
            },
            {
                name: 'ورق ملصقات',
                category: 'تغليف',
                unit: 'رول',
                costPrice: 15.00,
                avgCost: 15.00,
                currentStock: 100,
                supplier: 'الطباعة والتغليف'
            }
        ];

        let addedCount = 0;
        sampleProducts.forEach(product => {
            db.collection(COLL_PRODUCTS).add(product)
                .then(() => {
                    addedCount++;
                    if(addedCount === sampleProducts.length) {
                        alert(`✅ تم تحميل ${addedCount} منتج تجريبي بنجاح!`);
                        console.log('✅ Sample data loaded successfully');
                        loadPrices();
                    }
                })
                .catch(err => {
                    console.error('Error adding product:', err);
                });
        });
    }

    // ===== INIT =====
    function init() {
        console.log('🏭 Initializing Costs V2 System...');

        // ربط الأحداث
        const recipeForm = document.getElementById('v2-recipe-form');
        if(recipeForm) recipeForm.addEventListener('submit', saveRecipe);

        const closeBatchForm = document.getElementById('v2-close-batch-form');
        if(closeBatchForm) closeBatchForm.addEventListener('submit', closeBatch);

        // تحميل البيانات الأولية
        loadDashboard();

        // تحديث icons
        if(window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }

        console.log('✅ Costs V2 System initialized');
    }

    // ===== EXPORTS =====
    window.CostsV2 = {
        init: init,
        navTo: navTo,
        switchCostsView: switchCostsView,
        openAddRecipeModal: openAddRecipeModal,
        addIngredientRow: addIngredientRow,
        calcRecipeCost: calcRecipeCost,
        editRecipe: editRecipe,
        openCloseBatchModal: openCloseBatchModal,
        closeModV2: closeModV2,
        closeBatch: closeBatch,
        seedSampleData: seedSampleData,
        openModV2: openModV2
    };

    console.log('✅ Costs V2 module loaded');
})();
