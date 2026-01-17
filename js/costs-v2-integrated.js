// ===============================================
// نظام تكاليف الألبان - النسخة 2 (المدمجة)
// نظام متكامل لحساب تكاليف الإنتاج والأرباح
// ===============================================
// يستخدم نفس قاعدة البيانات Firebase من التطبيق الرئيسي
// مع التكامل الكامل مع نظام المبيعات والإنتاج

(function() {
    'use strict';

    // ===== Config & Collections =====
    const COLL_ING = 'ingredients_v2';
    const COLL_RECIPES = 'recipes_v2';
    const COLL_BATCHES = 'batches_v2';
    const COLL_SALES = 'batch_sales_v2';
    const COLL_PRODUCTS = 'products';  // من stock-control-v2

    // ===== State =====
    let ingredientsMap = {};
    let packagingMap = {};  // التغليف من الاستوك
    let productsMap = {};   // المنتجات التامة من الاستوك
    let activeRecipeMap = {};
    let currentBatchId = null;
    let allProductsFromStock = [];  // جميع المنتجات من الاستوك
    // تجميع الإيرادات الحقيقية من مجموعة المبيعات العامة (sales) حسب المنتج
    let salesRevenueByProductId = {}; // { productId: sumRevenue }
    
    // ===== Listener Management =====
    let listenersActive = false;  // Track if listeners are running
    let unsubscribers = {
        ingredients: null,
        recipes: null,
        batches: null,
        salesRevenue: null,
        productsStock: null
    };

    function normalizeName(s){
        return String(s||'').trim().toLowerCase();
    }

    function findFinishedProductIdByName(name){
        const n = normalizeName(name);
        // مطابقة مباشرة على الاسم
        for(const pid in productsMap){
            const p = productsMap[pid];
            if(!p || !p.name) continue;
            const pn = normalizeName(p.name);
            if(pn === n) return pid;
        }
        // مطابقة تحتوي/يحتوي كحل احتياطي
        for(const pid in productsMap){
            const p = productsMap[pid];
            if(!p || !p.name) continue;
            const pn = normalizeName(p.name);
            if(pn.includes(n) || n.includes(pn)) return pid;
        }
        return null;
    }

    // ===== Helper Functions =====
    const safeText = (id, text) => {
        const el = document.getElementById(id);
        if(el) el.innerText = text;
    };

    const safeHtml = (id, html) => {
        const el = document.getElementById(id);
        if(el) el.innerHTML = html;
    };

    function getDb() {
        if (!window.db) {
            console.error('Firebase db not initialized');
            return null;
        }
        return window.db;
    }

    function getAuth() {
        if (!window.auth) {
            console.error('Firebase auth not initialized');
            return null;
        }
        return window.auth;
    }

    // ===== UI Control =====
    function navTo(viewId) {
        // إخفاء جميع الأقسام
        document.querySelectorAll('[data-cv2-view]').forEach(v => {
            v.classList.add('hidden');
        });

        // عرض القسم المطلوب
        const target = document.querySelector(`[data-cv2-view="${viewId}"]`);
        if(target) target.classList.remove('hidden');

        // تحديث الأزرار النشطة (مثل الصورة)
        document.querySelectorAll('[data-cv2-nav]').forEach(btn => {
            btn.classList.remove('active');
            if(btn.getAttribute('data-cv2-nav') === viewId) {
                btn.classList.add('active');
            }
        });

        // ===== FORCE RELOAD & RENDER PRICES =====
        if(viewId === 'prices') {
            console.log('🎯 Prices tab clicked - RELOADING stock data...');
            // إعادة تحميل البيانات من الاستوك لضمان أحدث البيانات
            loadProductsFromStock();
            // ثم رسم الجدول
            setTimeout(() => renderAllIngredients(), 100);
        }

        // ===== LOAD RECIPES =====
        if(viewId === 'recipes') {
            console.log('🎯 Recipes tab clicked - LOADING recipes...');
            loadRecipes();
        }

        // ===== LOAD BATCHES =====
        if(viewId === 'batches') {
            console.log('🎯 Batches tab clicked - LOADING batches...');
            loadBatches();
        }

        // تحديث Lucide Icons
        if(window.lucide) lucide.createIcons();
    }

    function openModal(id) {
        const el = document.getElementById(id);
        if(el) el.classList.remove('hidden');
    }

    function closeModal(id) {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    }

    // ===== Core Init =====
    async function init() {
        const db = getDb();
        const auth = getAuth();

        if (!db || !auth) {
            console.error('Firebase not ready');
            setTimeout(init, 500);
            return;
        }

        // تحميل البيانات من الاستوك أولاً (SYNCHRONOUS)
        loadProductsFromStock();

        // تشغيل مستمع الإيرادات الحقيقية من مجموعة المبيعات العامة
        initSalesRevenueListener();
        
        // تأخير صغير لضمان معالجة البيانات قبل الاستماع للـ ingredients
        setTimeout(() => {
            loadIngredients();
            loadRecipes();
            loadBatches();
            loadDashboard();
            
            // ✅ Populate batch profits product dropdown
            populateFinishedProductsDropdown();

            // إنشار الأيقونات
            if(window.lucide) lucide.createIcons();
        }, 100);
    }

    // ===== Load Products from Stock Control =====
    function loadProductsFromStock() {
        const db = getDb();
        if(!db) {
            console.warn('⚠️ Firebase not ready, skipping product load');
            return;
        }

        // محاولة 1: تحميل من appV2 (المصدر المباشر من stock-control-v2)
        if(window.appV2 && Array.isArray(window.appV2.products) && window.appV2.products.length > 0) {
            console.log('📦 Loading from appV2.products:', window.appV2.products.length);
            processProductsData(window.appV2.products);
            return;
        }

        // محاولة 2: تحميل من state.products
        if(window.state && Array.isArray(window.state.products) && window.state.products.length > 0) {
            console.log('📦 Loading from state.products:', window.state.products.length);
            processProductsData(window.state.products);
            return;
        }

        // محاولة 3: تحميل من cache
        try {
            const cached = JSON.parse(localStorage.getItem('cache_products') || '[]');
            if(cached.length > 0) {
                console.log('📦 Loading from cache_products:', cached.length);
                processProductsData(cached);
                return;
            }
        } catch(e) {
            console.warn('Cache read failed:', e);
        }

        // محاولة 4: الاستماع للـ Firestore listener (آخر خيار)
        console.log('📦 No products found locally, listening to Firebase...');
        const unsubscribe = db.collection(COLL_PRODUCTS).onSnapshot(snap => {
            const products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log('📦 Firebase products snapshot:', products.length);
            if(products.length > 0) {
                processProductsData(products);
            }
        });

        if(window.storeSubscription) {
            window.storeSubscription('cv2-products-stock', unsubscribe);
        }
    }

    // معالج البيانات الموحد
    function processProductsData(products) {
        allProductsFromStock = [];
        ingredientsMap = {};
        packagingMap = {};
        productsMap = {};

        products.forEach(d => {
            const product = { id: d.id || d._key?.path?.segments?.[1], ...d };
            
            // تصنيف حسب نوع المنتج
            if (d.category === 'raw_material' || d.type === 'raw' || d.category === 'خامات') {
                // خامات
                ingredientsMap[d.id || product.id] = {
                    name: d.name,
                    unit: d.unit || 'كجم',
                    cost: d.price || d.cost || d.avgCost || 0,
                    id: d.id,
                    category: 'raw_material',
                    type: 'خامة'
                };
            } else if (d.category === 'packaging' || d.type === 'packaging' || d.category === 'تغليف') {
                // تغليف
                packagingMap[d.id || product.id] = {
                    name: d.name,
                    unit: d.unit || 'عدد',
                    cost: d.price || d.cost || d.avgCost || 0,
                    id: d.id,
                    category: 'packaging',
                    type: 'تغليف'
                };
            } else {
                // ✅ كل ما تبقى = منتج تام (لا خامات، لا تغليف)
                // هذا يشمل: finished_goods, منتج تام, أو أي شيء آخر
                productsMap[d.id || product.id] = {
                    name: d.name,
                    unit: d.unit || 'كجم',
                    price: d.price || 0,
                    id: d.id,
                    category: d.category || 'finished_goods'
                };
            }

            allProductsFromStock.push(product);
        });

        console.log('✅ Products processed:', {
            raw_materials: Object.keys(ingredientsMap).length,
            packaging: Object.keys(packagingMap).length,
            finished_goods: Object.keys(productsMap).length,
            total: allProductsFromStock.length
        });

        // تحديث خريطة الخامات المتزامنة من الاستوك
        updateStockIngredientsMap(ingredientsMap, packagingMap);
    }


    // تحديث خريطة الخامات من الاستوك
    function updateStockIngredientsMap(rawMap, packMap) {
        stockIngredientsMapData = {};
        Object.assign(stockIngredientsMapData, rawMap);
        Object.assign(stockIngredientsMapData, packMap);
        console.log('📦 Updated stock ingredients map:', Object.keys(stockIngredientsMapData).length);
        renderAllIngredients();
    }

    // ===== Update Prices Page with Stock Data =====
    // ===== Update Prices Page with Stock Data =====

    // ===== Ingredients Management =====
    // تخزين منفصل للخامات المحلية والمتزامنة من الاستوك
    let localIngredientsMapData = {};  // خامات محلية من ingredients_v2
    let stockIngredientsMapData = {};  // خامات من stock control

    function loadIngredients() {
        const db = getDb();
        if(!db) return;

        // Clean up old listener if exists
        if(unsubscribers.ingredients) {
            try { unsubscribers.ingredients(); } catch(e){ }
        }

        const unsubscribe = db.collection(COLL_ING)
            .orderBy('updatedAt', 'desc')
            .onSnapshot(snap => {
                // تحديث الخامات المحلية
                localIngredientsMapData = {};
                snap.docs.forEach(doc => {
                    localIngredientsMapData[doc.id] = doc.data();
                });

                // إعادة رسم الجدول بدمج البيانات
                renderAllIngredients();
            });

        // Store unsubscriber for cleanup
        unsubscribers.ingredients = unsubscribe;
        
        // Also store in legacy system for compatibility
        if(window.storeSubscription) {
            window.storeSubscription('cv2-ingredients', unsubscribe);
        }
    }

    // دالة رسم جدول الخامات والتغليف
    function renderAllIngredients() {
        const tbody = document.getElementById('cv2-ingredients-tbody');
        if(!tbody) {
            console.warn('⚠️ cv2-ingredients-tbody not found in DOM');
            return;
        }
        
        tbody.innerHTML = '';

        // دمج كل من الخامات المحلية والمتزامنة من الاستوك
        let allIngredients = { ...stockIngredientsMapData, ...localIngredientsMapData };

        console.log('🎨 renderAllIngredients:', {
            stock: Object.keys(stockIngredientsMapData).length,
            local: Object.keys(localIngredientsMapData).length,
            total: Object.keys(allIngredients).length
        });

        if(Object.keys(allIngredients).length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="p-8 text-center text-slate-400">
                        <p class="font-bold text-lg">لا توجد خامات أو تغليف</p>
                        <p class="text-sm">أضف منتجات في Stock Control أو أضف خامات محلية</p>
                    </td>
                </tr>
            `;
            return;
        }

        // عرض جميع الخامات والتغليف
        Object.entries(allIngredients).forEach(([id, item]) => {
            const isFromStock = stockIngredientsMapData[id] ? true : false;
            
            const itemName = item.name || 'بدون اسم';
            const itemUnit = item.unit || 'كجم';
            const itemCost = item.cost || item.price || 0;
            
            // تحديد نوع الصنف: تغليف أو خامة
            let itemType = 'خامة';
            if(item.category === 'packaging' || item.type === 'packaging' || (item.type === 'تغليف')) {
                itemType = 'تغليف';
            }

            const costColor = itemType === 'تغليف' ? 'text-blue-600' : 'text-orange-600';
            const statusBadge = isFromStock ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600';
            const statusText = isFromStock ? 'متزامن من الاستوك' : 'محلي';

            const row = `
                <tr class="hover:bg-slate-50 transition border-b border-slate-50">
                    <td class="p-6 font-black text-slate-800 text-xl">${itemName}</td>
                    <td class="p-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">${itemUnit}</td>
                    <td class="p-6 font-black ${costColor} text-2xl">${parseFloat(itemCost).toFixed(2)} <span class="text-sm">ج.م</span></td>
                    <td class="p-6 text-[10px] font-bold text-slate-300 uppercase">${itemType}</td>
                    <td class="p-6 text-center">
                        <span class="${statusBadge} px-4 py-1 rounded-full font-bold text-xs">${statusText}</span>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        if(window.lucide) lucide.createIcons();
    }

    // ===== Real Market Revenue Listener (sales collection) =====
    // ⏳ Debounce timer for sales revenue updates
    let salesRevenueUpdateTimeout = null;
    
    function initSalesRevenueListener(){
        const db = getDb();
        if(!db) return;
        
        // Clean up old listener if exists
        if(unsubscribers.salesRevenue) {
            try { unsubscribers.salesRevenue(); } catch(e){ }
        }
        
        try {
            const unsubscribe = db.collection('sales').onSnapshot(snap => {
                const agg = {};
                snap.forEach(doc => {
                    const s = doc.data() || {};
                    const items = Array.isArray(s.items) ? s.items : [];
                    for(const it of items){
                        const pid = it.productId || it.id || null;
                        if(!pid) continue;
                        const qty = Number(it.qty != null ? it.qty : (it.quantity || 0));
                        const price = Number(it.price || 0);
                        const subtotal = (isFinite(qty) ? qty : 0) * (isFinite(price) ? price : 0);
                        agg[pid] = (agg[pid] || 0) + subtotal;
                    }
                });
                salesRevenueByProductId = agg;
                
                // ⏳ Debounce updates to prevent blocking during save
                if (salesRevenueUpdateTimeout) clearTimeout(salesRevenueUpdateTimeout);
                salesRevenueUpdateTimeout = setTimeout(() => {
                    // إعادة رسم التقارير إن كانت الصفحة مفتوحة
                    try { rerenderReportsFromRevenue(); } catch(_){ }
                    // تحديث تفاصيل التشغيلة إن كانت مفتوحة حالياً
                    try {
                        const isBatchDetailsVisible = !!document.querySelector('[data-cv2-view="batch-details"]:not(.hidden)');
                        if(isBatchDetailsVisible && currentBatchId){ viewBatchDetails(currentBatchId); }
                    } catch(_){ }
                }, 1000); // Wait 1 second before updating UI
            }, err => {
                // Silent on permission errors
            });
            
            // Store unsubscriber for cleanup
            unsubscribers.salesRevenue = unsubscribe;
        } catch(e){ /* ignore */ }
    }

    function rerenderReportsFromRevenue(){
        const db = getDb();
        const tbody = document.getElementById('cv2-reports-tbody');
        if(!db || !tbody) return;
        
        // Load all batches and filter in JS (supports both 'completed' and 'closed')
        db.collection(COLL_BATCHES)
            .get()
            .then(snap => {
                tbody.innerHTML = '';
                let tP = 0, tR = 0, tC = 0;
                snap.docs.forEach(doc => {
                    const b = doc.data();
                    
                    // ✅ Filter: only show completed/closed batches
                    if (b.status !== 'completed' && b.status !== 'closed') return;
                    
                    const finishedPid = findFinishedProductIdByName(b.recipeName);
                    const realRevenue = finishedPid ? (salesRevenueByProductId[finishedPid] || 0) : 0;
                    const productionCost = Number(b.totalCost || 0);
                    const profit = realRevenue - productionCost;
                    tP += profit; tR += realRevenue; tC += productionCost;
                    const row = `
                        <tr>
                            <td class="p-6 font-mono text-slate-400 text-xs">#${b.batchNumber}</td>
                            <td class="p-6 font-black text-xl text-slate-800">${b.recipeName}</td>
                            <td class="p-6 font-black text-slate-500">${(b.unitCost||0).toFixed(2)}</td>
                            <td class="p-6 font-black text-slate-400">${b.finalQty || 0}</td>
                            <td class="p-6 text-emerald-600 font-black text-lg">${realRevenue.toLocaleString()}</td>
                            <td class="p-6 text-red-500 font-black text-lg">${productionCost.toLocaleString()}</td>
                            <td class="p-6 font-black text-lg ${profit>=0?'text-emerald-700':'text-red-700'}">${profit.toFixed(0)}</td>
                            <td class="p-6 font-black bg-slate-50/50">${realRevenue>0?((profit/realRevenue)*100).toFixed(1):0}%</td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
                safeText('cv2-rpt-total-profit', tP.toLocaleString() + ' ج.م');
                safeText('cv2-rpt-total-revenue', tR.toLocaleString() + ' ج.م');
                safeText('cv2-rpt-total-cogs', tC.toLocaleString() + ' ج.م');
            })
            .catch(_ => {});
    }

    async function saveIngredient(e) {
        e.preventDefault();
        const db = getDb();
        if(!db) return;

        const name = document.getElementById('cv2-ing-name').value;
        const unit = document.getElementById('cv2-ing-unit').value;
        const cost = parseFloat(document.getElementById('cv2-ing-cost').value);

        await db.collection(COLL_ING).add({
            name,
            unit,
            cost,
            updatedAt: new Date().toISOString()
        });

        closeModal('cv2-modal-ingredient');
        e.target.reset();
    }

    // ===== Recipes Management =====
    function loadRecipes() {
        const db = getDb();
        if(!db) return;

        // Clean up old listener if exists
        if(unsubscribers.recipes) {
            try { unsubscribers.recipes(); } catch(e){ }
        }

        const unsubscribe = db.collection(COLL_RECIPES)
            .onSnapshot(snap => {
                console.log('📋 Recipes loaded:', snap.docs.length, 'recipes');
                
                const grid = document.getElementById('cv2-recipes-grid');
                if(!grid) return;

                grid.innerHTML = '';
                activeRecipeMap = {};

                snap.docs.forEach(doc => {
                    const r = doc.data();
                    activeRecipeMap[doc.id] = r;

                    const card = `
                        <div class="glass-card p-10 group hover:border-blue-300 transition-all cursor-pointer relative overflow-hidden" onclick="window.costsV2.navTo('batches')">
                            <div class="absolute top-0 right-0 w-3 h-full bg-blue-500"></div>
                            <div class="flex justify-between items-start mb-8">
                                <div>
                                    <h4 class="font-black text-slate-900 text-3xl mb-1">${r.name}</h4>
                                    <span class="text-[11px] font-black text-slate-400 mt-2 block tracking-widest uppercase">${r.unit}</span>
                                </div>
                                <div class="bg-slate-100 p-4 rounded-3xl text-slate-400 group-hover:text-blue-600 transition-all shadow-inner">
                                    <i data-lucide="flask-conical" class="w-8 h-8"></i>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-8 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                                <div class="text-right border-l border-slate-200 pr-2">
                                    <p class="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-2">التكلفة</p>
                                    <p class="font-black text-red-600 text-3xl">${r.estimatedCost.toFixed(2)}</p>
                                </div>
                                <div class="text-left pr-4">
                                    <p class="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-2">البيع</p>
                                    <p class="font-black text-emerald-600 text-3xl">${r.stdPrice.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    `;
                    grid.innerHTML += card;
                });

                if(window.lucide) lucide.createIcons();
            });

        // Store unsubscriber for cleanup
        unsubscribers.recipes = unsubscribe;
        
        if(window.storeSubscription) {
            window.storeSubscription('cv2-recipes', unsubscribe);
        }
    }

    function openRecipeModal() {
        const list = document.getElementById('cv2-recipe-ingredients-list');
        if(list) list.innerHTML = '';
        
        safeText('cv2-rec-final-cost', '0.00');
        
        document.getElementById('cv2-rec-manual-batch-num').value = '';
        
        openModal('cv2-modal-recipe');
        addIngredientRow();
    }

    async function saveRecipe(e) {
        e.preventDefault();
        const db = getDb();
        if(!db) {
            alert('قاعدة البيانات غير متاحة. تأكد من الاتصال بالإنترنت.');
            return;
        }

        try {
            // Check if user is authenticated
            const user = firebase.auth().currentUser;
            if (!user) {
                alert('يجب تسجيل الدخول أولاً');
                return;
            }

            const ingList = [];
            document.querySelectorAll('.cv2-ing-row').forEach(row => {
                const sel = row.querySelector('.cv2-ing-sel');
                if(sel && sel.value) {
                    ingList.push({
                        id: sel.value,
                        qty: parseFloat(row.querySelector('.cv2-ing-qty').value || 0)
                    });
                }
            });

            const estCost = parseFloat(document.getElementById('cv2-rec-final-cost').innerText || 0);
            const expectedYield = parseFloat(document.getElementById('cv2-rec-expected-yield').value || 0);
            const unitCost = expectedYield > 0 ? estCost / expectedYield : 0;
            const manualBatchNum = document.getElementById('cv2-rec-manual-batch-num').value;

            const data = {
                name: document.getElementById('cv2-rec-name').value,
                unit: document.getElementById('cv2-rec-unit').value,
                ingredients: ingList,
                overhead: parseFloat(document.getElementById('cv2-rec-overhead').value || 0),
                stdPrice: parseFloat(document.getElementById('cv2-rec-std-price').value || 0),
                estimatedCost: estCost,
                expectedYield: expectedYield,
                unitCost: unitCost,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: user.uid,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await db.collection(COLL_RECIPES).add(data);
            const finalBatchNum = manualBatchNum || (Math.floor(Math.random() * 9000) + 1000);

            await db.collection(COLL_BATCHES).add({
                batchNumber: parseInt(finalBatchNum),
                recipeId: docRef.id,
                recipeName: data.name,
                estTotalCost: estCost,
                expectedYield: expectedYield,
                unitCost: unitCost,
                status: 'active',
                createdBy: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            closeModal('cv2-modal-recipe');
            e.target.reset();
            
            console.log('✅ Recipe saved successfully! ID:', docRef.id);
            alert('تم حفظ الوصفة بنجاح');
            
            // الانتقال لصفحة التشغيلات لعرض التشغيلة الجديدة
            navTo('batches');
        } catch (error) {
            console.error('خطأ في حفظ الوصفة:', error);
            alert('فشل حفظ الوصفة: ' + error.message + '\n\nتأكد من صلاحيات Firebase الخاصة بك');
        }
    }

    // ===== Batches Management =====
    function loadBatches() {
        const db = getDb();
        if(!db) return;

        // Clean up old listener if exists
        if(unsubscribers.batches) {
            try { unsubscribers.batches(); } catch(e){ }
        }

        const unsubscribe = db.collection(COLL_BATCHES)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snap => {
                console.log('🏭 Batches loaded:', snap.docs.length, 'batches');
                
                const activeList = document.getElementById('cv2-active-batches-list');
                const completedList = document.getElementById('cv2-completed-batches-list');

                if(!activeList || !completedList) return;

                activeList.innerHTML = '';
                completedList.innerHTML = '';

                snap.docs.forEach(doc => {
                    const b = doc.data();
                    const el = document.createElement('div');
                    el.className = 'glass-card p-10 flex flex-col md:flex-row justify-between items-center gap-10 transition hover:border-blue-400 shadow-2xl border-none';

                    if(b.status === 'active') {
                        const createdDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || Date.now());
                        const dateStr = createdDate.toLocaleDateString('ar-EG');
                        const timeStr = createdDate.toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'});
                        
                        el.innerHTML = `
                            <div class="flex items-center gap-10 flex-1">
                                <div class="w-24 h-24 bg-blue-100 text-blue-700 rounded-[2.5rem] flex items-center justify-center font-black text-4xl shadow-inner border-4 border-blue-50">#${b.batchNumber}</div>
                                <div>
                                    <h4 class="font-black text-slate-900 text-3xl leading-tight mb-2">${b.recipeName}</h4>
                                    <p class="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">بدأت في: ${timeStr} — بتاريخ ${dateStr}</p>
                                </div>
                            </div>
                            <button onclick="window.costsV2.openCloseBatchModal('${doc.id}', ${b.estTotalCost})" class="w-full md:w-auto bg-red-600 text-white px-12 py-6 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-red-700 transition flex items-center gap-4 active:scale-95">
                                <i data-lucide="check-circle-2"></i> إنهاء الإنتاج
                            </button>
                        `;
                        activeList.appendChild(el);
                    } else {
                        el.classList.add('cursor-pointer', 'bg-slate-50/50', 'border-slate-100', 'p-8');
                        el.onclick = () => window.costsV2.viewBatchDetails(doc.id);
                        
                        el.innerHTML = `
                            <div class="flex items-center gap-10 flex-1">
                                <div class="w-16 h-16 bg-slate-200 text-slate-500 rounded-3xl flex items-center justify-center font-black text-xl shadow-inner">#${b.batchNumber}</div>
                                <div class="flex-1">
                                    <div class="flex justify-between items-center">
                                        <h4 class="font-black text-slate-700 text-2xl">${b.recipeName}</h4>
                                        <span class="text-[10px] bg-emerald-100 text-emerald-600 px-5 py-2 rounded-full font-black uppercase tracking-widest shadow-sm">مكتملة</span>
                                    </div>
                                    <div class="flex gap-12 mt-4 text-[13px] font-black text-slate-400 uppercase tracking-tight">
                                        <p>الإنتاج: <span class="text-slate-900">${b.finalQty || 0}</span></p>
                                        <p>التكلفة: <span class="text-slate-900">${(b.unitCost || 0).toFixed(2)}</span></p>
                                        <p>صافي الربح: <span class="${b.netProfit>=0?'text-emerald-600':'text-red-600'}">${(b.netProfit || 0).toFixed(0)} ج.م</span></p>
                                    </div>
                                </div>
                                <i data-lucide="chevron-left" class="w-8 h-8 text-slate-300"></i>
                            </div>
                        `;
                        completedList.appendChild(el);
                    }
                });

                if(window.lucide) lucide.createIcons();
            });

        // Store unsubscriber for cleanup
        unsubscribers.batches = unsubscribe;
        
        if(window.storeSubscription) {
            window.storeSubscription('cv2-batches', unsubscribe);
        }
    }

    function openCloseBatchModal(id, est) {
        document.getElementById('cv2-close-batch-id-hidden').value = id;
        document.getElementById('cv2-close-total-cost').value = est.toFixed(2);
        openModal('cv2-modal-close-batch');
    }

    async function closeBatchConfirm(e) {
        e.preventDefault();
        const db = getDb();
        if(!db) return;

        const id = document.getElementById('cv2-close-batch-id-hidden').value;
        const t = parseFloat(document.getElementById('cv2-close-total-cost').value);
        const q = parseFloat(document.getElementById('cv2-close-final-qty').value);

        await db.collection(COLL_BATCHES).doc(id).update({
            status: 'completed', // ✅ FIXED: changed from 'closed' to 'completed'
            totalCost: t,
            finalQty: q,
            unitCost: t / q,
            completedAt: new Date().toISOString(), // ✅ FIXED: changed from 'closedAt' to 'completedAt'
            closedAt: new Date().toISOString(), // Keep for backward compatibility
            soldQty: 0,
            totalRev: 0,
            netProfit: -t
        });

        closeModal('cv2-modal-close-batch');
        e.target.reset();
    }

    // ===== Dashboard =====
    function loadDashboard() {
        const db = getDb();
        if(!db) return;

        const list = document.getElementById('cv2-dashboard-activity-list');
        if(!list) return;

        db.collection(COLL_BATCHES)
            .orderBy('createdAt', 'desc')
            .limit(15)
            .onSnapshot(snap => {
                if(snap.empty) return;
                list.innerHTML = '';

                snap.docs.forEach(doc => {
                    const b = doc.data();
                    const isNew = b.status === 'active';
                    const html = `
                        <div class="p-10 flex items-center gap-10 hover:bg-slate-50 transition border-r-[12px] ${isNew?'border-blue-500':'border-emerald-500'}">
                            <div class="${isNew?'bg-blue-100 text-blue-600':'bg-emerald-100 text-emerald-600'} p-5 rounded-[2rem] shadow-inner">
                                <i data-lucide="${isNew?'play-circle':'check-circle'}" class="w-10 h-10"></i>
                            </div>
                            <div class="flex-1">
                                <p class="text-2xl font-black text-slate-900">${isNew?'بدء تشغيل':'تم اعتماد إنتاج'} منتج ${b.recipeName}</p>
                                <p class="text-xs font-black text-slate-400 mt-3 uppercase tracking-[0.3em]">${b.createdAt.substring(11,16)} — تشغيلة رقم #${b.batchNumber}</p>
                            </div>
                        </div>
                    `;
                    list.innerHTML += html;
                });

                if(window.lucide) lucide.createIcons();
            });
    }

    // ===== Reports =====
    function loadReports() {
        const db = getDb();
        if(!db) return;

        // Load all batches and filter in JS to support both 'completed' and 'closed' (backward compatibility)
        db.collection(COLL_BATCHES)
            .onSnapshot(snap => {
                const tbody = document.getElementById('cv2-reports-tbody');
                if(!tbody) return;
                tbody.innerHTML = '';

                let tP = 0, tR = 0, tC = 0;

                snap.docs.forEach(doc => {
                    const b = doc.data();
                    
                    // ✅ Filter: only show completed/closed batches
                    if (b.status !== 'completed' && b.status !== 'closed') return;
                    
                    // الإيراد الحقيقي: تجميع من مجموعة المبيعات العامة بناءً على اسم المنتج
                    const finishedPid = findFinishedProductIdByName(b.recipeName);
                    const realRevenue = finishedPid ? (salesRevenueByProductId[finishedPid] || 0) : 0;
                    // تكلفة الإنتاج الفعلية عند إغلاق التشغيلة
                    const productionCost = Number(b.totalCost || 0);
                    const profit = realRevenue - productionCost;
                    tP += profit;
                    tR += realRevenue;
                    tC += productionCost;

                    const row = `
                        <tr>
                            <td class="p-6 font-mono text-slate-400 text-xs">#${b.batchNumber}</td>
                            <td class="p-6 font-black text-xl text-slate-800">${b.recipeName}</td>
                            <td class="p-6 font-black text-slate-500">${(b.unitCost||0).toFixed(2)}</td>
                            <td class="p-6 font-black text-slate-400">${b.finalQty || 0}</td>
                            <td class="p-6 text-emerald-600 font-black text-lg">${realRevenue.toLocaleString()}</td>
                            <td class="p-6 text-red-500 font-black text-lg">${productionCost.toLocaleString()}</td>
                            <td class="p-6 font-black text-lg ${profit>=0?'text-emerald-700':'text-red-700'}">${profit.toFixed(0)}</td>
                            <td class="p-6 font-black bg-slate-50/50">${realRevenue>0?((profit/realRevenue)*100).toFixed(1):0}%</td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });

                safeText('cv2-rpt-total-profit', tP.toLocaleString() + ' ج.م');
                safeText('cv2-rpt-total-revenue', tR.toLocaleString() + ' ج.م');
                safeText('cv2-rpt-total-cogs', tC.toLocaleString() + ' ج.م');
            });
    }

    // ===== Batch Details =====
    function viewBatchDetails(id) {
        currentBatchId = id;
        navTo('batch-details');

        const db = getDb();
        if(!db) return;

        db.collection(COLL_BATCHES).doc(id).onSnapshot(doc => {
            const b = doc.data();
            if(!b) return;

            // حساب الإيراد الحقيقي والربح الصافي لهذه التشغيلة
            const finishedPid = findFinishedProductIdByName(b.recipeName);
            const realRevenue = finishedPid ? (salesRevenueByProductId[finishedPid] || 0) : 0;
            const productionCost = Number(b.totalCost || 0);
            const realProfit = realRevenue - productionCost;

            const cont = document.getElementById('cv2-batch-details-content');
            if(!cont) return;

            cont.innerHTML = `
                <div class="glass-card mb-12 shadow-2xl border-none">
                    <div class="bg-slate-950 text-white p-12 flex justify-between items-center flex-wrap gap-10">
                        <div>
                            <h2 class="text-5xl font-black mb-3">${b.recipeName}</h2>
                            <p class="text-blue-500 text-sm font-black uppercase tracking-[0.4em]">سجل التشغيل رقم #${b.batchNumber}</p>
                        </div>
                        <div class="text-left bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
                            <div class="text-[12px] text-slate-500 uppercase font-black mb-3 tracking-widest">تكلفة الوحدة الصافية</div>
                            <h3 class="text-5xl font-black text-blue-400">${b.unitCost.toFixed(2)} <span class="text-2xl ml-2 font-bold">ج.م</span></h3>
                        </div>
                    </div>
                    <div class="p-12 grid grid-cols-2 md:grid-cols-4 gap-12 bg-slate-50 border-b">
                        <div class="text-center">
                            <p class="text-[13px] text-slate-400 font-black mb-4 uppercase tracking-widest">الكمية (Yield)</p>
                            <p class="font-black text-slate-900 text-4xl">${b.finalQty}</p>
                        </div>
                        <div class="text-center border-r border-slate-200">
                            <p class="text-[13px] text-slate-400 font-black mb-4 uppercase tracking-widest">التكلفة</p>
                            <p class="font-black text-red-600 text-4xl">${b.totalCost.toLocaleString()}</p>
                        </div>
                        <div class="text-center border-r border-slate-200">
                            <p class="text-[13px] text-slate-400 font-black mb-4 uppercase tracking-widest">الإيراد (فعلي)</p>
                            <p class="font-black text-emerald-600 text-4xl">${realRevenue.toLocaleString()}</p>
                        </div>
                        <div class="text-center border-r border-slate-200">
                            <p class="text-[13px] text-slate-400 font-black mb-4 uppercase tracking-widest">الربح الصافي</p>
                            <p class="font-black ${realProfit>=0?'text-blue-600':'text-red-600'} text-4xl">${realProfit.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div class="glass-card p-12">
                    <div class="mb-10">
                        <h4 class="font-black text-slate-900 text-3xl flex items-center gap-5">
                            <i data-lucide="shopping-bag" class="text-blue-600 w-10 h-10"></i> سجل مبيعات المنتج (حسب المبيعات العامة)
                        </h4>
                        <p class="text-sm text-slate-500 mt-2">يتم حساب الإيراد تلقائياً من المبيعات المسجلة في صفحة المبيعات</p>
                    </div>
                    <div class="p-6 bg-emerald-50 rounded-xl border border-emerald-200">
                        <div class="text-center">
                            <div class="text-sm text-emerald-600 mb-2">إجمالي الإيراد من المبيعات</div>
                            <div class="text-4xl font-black text-emerald-700">${realRevenue.toLocaleString()} ج.م</div>
                        </div>
                    </div>
                </div>
            `;

            if(window.lucide) lucide.createIcons();
        });
    }

    // ===== Recipe Helpers =====
    function addIngredientRow() {
        const list = document.getElementById('cv2-recipe-ingredients-list');
        if(!list) return;

        const tr = document.createElement('tr');
        tr.className = 'cv2-ing-row';
        const rowId = 'ing-row-' + Date.now();
        
        tr.innerHTML = `
            <td class="p-3" style="width: 30%;">
                <select onchange="window.costsV2.updateIngredientOptions('${rowId}')" class="cv2-ing-type w-full p-4 border-2 border-slate-200 rounded-xl bg-white text-sm font-bold shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                    <option value="">-- اختر النوع --</option>
                    <option value="raw">🥛 خامات</option>
                    <option value="packaging">📦 تغليف</option>
                </select>
            </td>
            <td class="p-3" style="width: 35%;">
                <select id="ing-select-${rowId}" onchange="window.costsV2.calcRecipeTotal()" class="cv2-ing-sel w-full p-4 border-2 border-slate-200 rounded-xl bg-slate-50 text-sm font-bold shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" disabled>
                    <option value="">-- اختر الصنف --</option>
                </select>
            </td>
            <td class="p-3" style="width: 15%;">
                <input type="number" step="0.0001" oninput="window.costsV2.calcRecipeTotal()" class="cv2-ing-qty w-full p-4 border-2 border-slate-200 rounded-xl text-sm font-bold text-center shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="الكمية">
            </td>
            <td class="p-3" style="width: 15%;">
                <input type="text" class="cv2-ing-sub w-full p-4 bg-blue-50 border-2 border-blue-100 rounded-xl text-sm font-black text-center text-blue-700" readonly value="0.00 ج.م">
            </td>
            <td class="p-3 text-center" style="width: 5%;">
                <button type="button" onclick="this.closest('tr').remove();window.costsV2.calcRecipeTotal()" class="text-red-500 hover:bg-red-50 transition p-2 rounded-lg">
                    <i data-lucide="trash-2" class="w-5 h-5"></i>
                </button>
            </td>
        `;
        list.appendChild(tr);

        if(window.lucide) lucide.createIcons();
    }

    function updateIngredientOptions(rowId) {
        const row = document.querySelector(`#ing-select-${rowId}`)?.closest('tr');
        if(!row) return;
        
        const typeSelect = row.querySelector('.cv2-ing-type');
        const optionsSelect = document.getElementById(`ing-select-${rowId}`);
        
        if(!typeSelect || !optionsSelect) return;
        
        const type = typeSelect.value;
        optionsSelect.innerHTML = '<option value="">-- اختر الصنف --</option>';
        
        if(type === 'raw') {
            // عرض جميع الخامات من الاستوك
            const rawItems = Object.entries(ingredientsMap).filter(([id, item]) => 
                item.type === 'خامة' || item.category === 'raw_material'
            );
            
            if(rawItems.length === 0) {
                optionsSelect.innerHTML += `<option value="" disabled>لا توجد خامات متاحة</option>`;
            } else {
                rawItems.forEach(([id, item]) => {
                    optionsSelect.innerHTML += `<option value="${id}" data-cost="${item.cost}" data-unit="${item.unit}" data-type="raw">${item.name} (${item.unit}) - ${item.cost.toFixed(2)} ج.م</option>`;
                });
            }
            optionsSelect.disabled = false;
        } else if(type === 'packaging') {
            // عرض جميع التغليف من الاستوك
            const packItems = Object.entries(packagingMap).filter(([id, item]) => 
                item.type === 'تغليف' || item.category === 'packaging'
            );
            
            if(packItems.length === 0) {
                optionsSelect.innerHTML += `<option value="" disabled>لا يوجد تغليف متاح</option>`;
            } else {
                packItems.forEach(([id, item]) => {
                    optionsSelect.innerHTML += `<option value="${id}" data-cost="${item.cost}" data-unit="${item.unit}" data-type="packaging">${item.name} (${item.unit}) - ${item.cost.toFixed(2)} ج.م</option>`;
                });
            }
            optionsSelect.disabled = false;
        } else {
            optionsSelect.disabled = true;
        }
        
        calcRecipeTotal();
    }

    function calcRecipeTotal() {
        let total = 0;
        document.querySelectorAll('.cv2-ing-row').forEach(row => {
            const sel = row.querySelector('.cv2-ing-sel');
            const qtyInput = row.querySelector('.cv2-ing-qty');
            const subInput = row.querySelector('.cv2-ing-sub');
            
            if(sel && sel.value && qtyInput) {
                const selectedOption = sel.options[sel.selectedIndex];
                const itemCost = parseFloat(selectedOption.dataset.cost) || 0;
                const qty = parseFloat(qtyInput.value) || 0;
                const subtotal = itemCost * qty;
                
                if(subInput) {
                    subInput.value = subtotal.toFixed(2) + ' ج.م';
                }
                total += subtotal;
            }
        });
        
        const overhead = parseFloat(document.getElementById('cv2-rec-overhead')?.value || 0);
        total += overhead;
        safeText('cv2-rec-final-cost', total.toFixed(2));
        
        // 🎯 حساب تكلفة الوحدة الواحدة
        const expectedYield = parseFloat(document.getElementById('cv2-rec-expected-yield')?.value || 0);
        const unitCost = expectedYield > 0 ? total / expectedYield : 0;
        safeText('cv2-rec-unit-cost', unitCost.toFixed(2));
    }

    function editIngredient(id, name, cost) {
        document.getElementById('cv2-ing-name').value = name;
        document.getElementById('cv2-ing-unit').value = ingredientsMap[id].unit;
        document.getElementById('cv2-ing-cost').value = cost;
        openModal('cv2-modal-ingredient');
    }

    // ===== Product Suggestions =====
    function showProductSuggestions(query) {
        const suggestionsDiv = document.getElementById('cv2-product-suggestions');
        if (!suggestionsDiv) return;

        // If empty query, show ALL finished products (full dropdown behavior)
        let matches;
        if (query.length === 0) {
            // Show all finished products when field is empty/focused
            matches = Object.entries(productsMap)
                .map(([id, p]) => ({ id, ...p }))
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else {
            // 🔍 Search in finished products (case-insensitive, partial match)
            const queryLower = query.toLowerCase();
            matches = Object.entries(productsMap)
                .filter(([id, p]) => p.name && p.name.toLowerCase().includes(queryLower))
                .map(([id, p]) => ({ id, ...p }))
                .slice(0, 15);
        }

        if (matches.length === 0) {
            // Show "no results" message
            suggestionsDiv.innerHTML = '<div class="p-3 text-slate-500 text-sm text-center">لا توجد منتجات مطابقة</div>';
            suggestionsDiv.classList.remove('hidden');
            return;
        }

        let html = '';
        matches.forEach(product => {
            const displayName = product.name || 'بدون اسم';
            const displayUnit = product.unit || 'كجم';
            const displayPrice = product.price ? product.price.toFixed(2) : '0.00';
            html += `
                <div class="p-3 border-b cursor-pointer hover:bg-blue-50 transition flex justify-between items-center" 
                     onclick="window.costsV2.selectProduct('${displayName}', '${displayUnit}')">
                    <div class="flex-1">
                        <div class="font-bold text-slate-800">${displayName}</div>
                        <div class="text-xs text-slate-500">السعر: ${displayPrice} ج.م</div>
                    </div>
                    <div class="text-xs font-semibold text-slate-600 ml-4">${displayUnit}</div>
                </div>
            `;
        });

        suggestionsDiv.innerHTML = html;
        suggestionsDiv.classList.remove('hidden');
    }

    function selectProduct(name, unit) {
        document.getElementById('cv2-rec-name').value = name;
        document.getElementById('cv2-rec-unit').value = unit;
        document.getElementById('cv2-product-suggestions').classList.add('hidden');
    }

    // ===== Populate Batch Profits Product Dropdown =====
    function populateFinishedProductsDropdown() {
        const dropdown = document.getElementById('batch-profits-product');
        if (!dropdown) return;

        // Get all finished products from productsMap
        const finishedProducts = Object.entries(productsMap).map(([id, product]) => ({
            id: id,
            name: product.name,
            unit: product.unit || 'كجم'
        }));

        // Sort by name
        finishedProducts.sort((a, b) => a.name.localeCompare(b.name));

        // Clear existing options except the first one
        dropdown.innerHTML = '<option value="all">جميع المنتجات</option>';

        // Add products
        finishedProducts.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            option.dataset.unit = product.unit;
            dropdown.appendChild(option);
        });

        console.log('✅ Batch profits dropdown populated with', finishedProducts.length, 'finished products');
    }

    // ===== Cleanup: Disable all listeners when not needed =====
    function cleanupListeners() {
        console.log('🔴 Costs V2: Disabling all listeners (entering idle state)...');
        
        // Unsubscribe from all active listeners
        if(unsubscribers.ingredients) {
            try { unsubscribers.ingredients(); } catch(e){ }
            unsubscribers.ingredients = null;
        }
        if(unsubscribers.recipes) {
            try { unsubscribers.recipes(); } catch(e){ }
            unsubscribers.recipes = null;
        }
        if(unsubscribers.batches) {
            try { unsubscribers.batches(); } catch(e){ }
            unsubscribers.batches = null;
        }
        if(unsubscribers.salesRevenue) {
            try { unsubscribers.salesRevenue(); } catch(e){ }
            unsubscribers.salesRevenue = null;
        }
        if(unsubscribers.productsStock) {
            try { unsubscribers.productsStock(); } catch(e){ }
            unsubscribers.productsStock = null;
        }
        
        // Clear debounce timers
        if(window.salesRevenueUpdateTimeout) {
            clearTimeout(window.salesRevenueUpdateTimeout);
            window.salesRevenueUpdateTimeout = null;
        }
        if(window.batchProfitsReportTimeout) {
            clearTimeout(window.batchProfitsReportTimeout);
            window.batchProfitsReportTimeout = null;
        }
        
        listenersActive = false;
        console.log('✅ Costs V2: All listeners disabled (memory freed)');
    }

    // ===== Export Public API =====
    window.costsV2 = {
        init,
        navTo,
        openModal,
        closeModal,
        openRecipeModal,
        openCloseBatchModal,
        viewBatchDetails,
        addIngredientRow,
        updateIngredientOptions,
        calcRecipeTotal,
        editIngredient,
        saveIngredient,
        saveRecipe,
        closeBatchConfirm,
        loadReports,
        showProductSuggestions,
        selectProduct,
        populateFinishedProductsDropdown,
        cleanupListeners
    };

    // ===== Lazy-init: Only start after user authentication =====
    window.initCostsV2System = function() {
        console.log('🎯 Costs V2 System initialization started (after login)');
        init();
    };

    // Don't auto-init on page load - wait for user to authenticate
    console.log('⏳ Costs V2 System: Lazy initialization enabled. Will start after authentication.');
})();
