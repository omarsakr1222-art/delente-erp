// Safety: تعريف بديل وآمن لـ scheduleRender مبكّراً لتجنّب ReferenceError
// هذا التعريف بسيط ويستخدم requestIdleCallback أو setTimeout للتأجيل
try {
    if (!window.scheduleRender) {
        window.__scheduleQueue = window.__scheduleQueue || new Map();
        window.scheduleRender = function(key, fn) {
            if (!key || typeof fn !== 'function') return;
            try {
                if (window.__scheduleQueue.has(key)) return; // تجنّب التشغيل المتكرر لنفس المفتاح
                window.__scheduleQueue.set(key, true);
                const runner = () => { try { fn(); } catch(e){} finally { try { window.__scheduleQueue.delete(key); } catch(_){} } };
                if (typeof window.requestIdleCallback === 'function') {
                    requestIdleCallback(runner, { timeout: 250 });
                } else {
                    setTimeout(runner, 50);
                }
            } catch(e) { try { fn(); } catch(_){} }
        };
    }
} catch(e) { /* ignore */ }
// جلب بيانات العملاء من فايربيس وتخزينها في window.state.customers
async function fetchCustomersFromFirebase() {
    if (!window.db) {
        console.warn('فايربيس غير مهيأ بعد');
        return;
    }
    try {
        // التأكد من وجود مستخدم موثّق
        if (!window.auth || !window.auth.currentUser) {
            console.warn('يجب تسجيل الدخول لجلب بيانات العملاء من فايربيس');
            return;
        }
        const { collection, getDocs } = window.db.constructor;
        // واجهة compat: db.collection("customers").get()
        let customers = [];
        let snapshot;
        if (typeof window.db.collection === 'function') {
            snapshot = await window.db.collection("customers").get();
            snapshot.forEach(doc => {
                customers.push(doc.data());
            });
        } else if (typeof collection === 'function' && typeof getDocs === 'function') {
            // modular
            const colRef = collection(window.db, "customers");
            snapshot = await getDocs(colRef);
            snapshot.forEach(doc => {
                customers.push(doc.data());
            });
        } else {
            console.warn('واجهة فايربيس غير مدعومة');
            return;
        }
        window.state = window.state || {};
        window.state.customers = customers;
        console.log('تم جلب العملاء من فايربيس:', customers);
    } catch (err) {
        if (err && err.code === 'permission-denied') {
            alert('ليس لديك صلاحية لقراءة بيانات العملاء من فايربيس. تأكد من تسجيل الدخول كـ admin.');
        } else {
            console.error('خطأ أثناء جلب العملاء من فايربيس:', err);
        }
    }
}
// نسخة احتياطية من بيانات العملاء (تُستخدم إذا لم تتوفر بيانات من فايربيس)
window.state = window.state || {};
if (!window.state.customers || !Array.isArray(window.state.customers) || window.state.customers.length === 0) {
    window.state.customers = [
        {"phone":"01000000001","requiresTaxFiling":false,"updatedAt":{"seconds":1763834339,"nanoseconds":743000000},"repName":"مصطفى","name":"عميل قطاعي 1","priceListId":"retail","address":"","assignedRepId":"rep_2_initial","taxNumber":"","balance":0,"createdAt":{"seconds":1763834339,"nanoseconds":743000000},"_id":"CUST001","id":"CUST001"},
        {"priceListId":"wholesale","balance":0,"name":"عميل جملة 1","requiresTaxFiling":true,"createdAt":{"seconds":1763834339,"nanoseconds":743000000},"updatedAt":{"seconds":1763834339,"nanoseconds":743000000},"taxNumber":"","phone":"01000000002","_id":"CUST002","id":"CUST002"},
        {"priceListId":"retail","balance":0,"phone":"01000000003","name":"عميل قطاعي 2","createdAt":{"seconds":1763834339,"nanoseconds":743000000},"taxNumber":"","updatedAt":{"seconds":1763834339,"nanoseconds":743000000},"requiresTaxFiling":false,"_id":"CUST003","id":"CUST003"},
        {"assignedRepId":"rep_5_initial","createdAt":{"seconds":1763315063,"nanoseconds":714000000},"address":"","phone":"","priceListId":"chains_price_list_2025","repName":"رمضان","updatedAt":{"seconds":1763497994,"nanoseconds":965000000},"balance":0,"name":"اكسبشن ماركت النقابات","requiresTaxFiling":true,"taxNumber":"472857258","_id":"cust_initial_0","id":"cust_initial_0"},
        {"address":"","balance":0,"priceListId":"chains_price_list_2025","phone":"","requiresTaxFiling":true,"createdAt":{"seconds":1763315063,"nanoseconds":714000000},"taxNumber":"472857258","repName":"","updatedAt":{"seconds":1763315063,"nanoseconds":714000000},"name":"اكسبشن ماركت ز","_id":"cust_initial_1","id":"cust_initial_1"},
        {"requiresTaxFiling":true,"phone":"","updatedAt":{"seconds":1763425438,"nanoseconds":492000000},"repName":"","name":"ماركت الضحى","priceListId":"retail_price_list_2025","address":"","assignedRepId":"","balance":0,"taxNumber":"252314735","createdAt":{"seconds":1763315063,"nanoseconds":714000000},"_id":"cust_initial_10","id":"cust_initial_10"}
        // ... يمكنك إضافة باقي العملاء هنا إذا أردت كل القائمة
    ];
}
// جلب الدور من الحالة المشتركة أو Firestore (مثال)
window.state.userRole = (window.state.shared && window.state.shared.public_app_state && window.state.shared.public_app_state.userRoles && window.auth && window.auth.currentUser && window.state.shared.public_app_state.userRoles[window.auth.currentUser.email]) || 'user';
if (window.state.userRole === 'admin') {
    setTimeout(function(){
        alert('أنت المشرف (admin) ولديك صلاحية التحكم الكامل في التطبيق');
    }, 1200);
}
// جلب العملاء عند تحميل الصفحة
window.addEventListener('load', function() {
    // ...existing code...
    fetchCustomersFromFirebase();
});
// إظهار صفحة الـ Dashboard كافتراضي عند التحميل
window.addEventListener('load', function() {
    var pages = document.getElementsByClassName('page');
    for (var i = 0; i < pages.length; i++) {
        pages[i].classList.remove('active');
    }
    var dashboard = document.getElementById('page-dashboard');
    if (dashboard) {
        dashboard.classList.add('active');
        dashboard.style.display = 'block';
    }
    var appContainer = document.getElementById('app-container');
    if (appContainer) {
        appContainer.classList.remove('hidden');
        appContainer.style.display = 'flex';
    }
    // إذا لم توجد بيانات، أضف رسالة توضيحية
    if (!window.state || !window.state.sales || window.state.sales.length === 0) {
        var dashboardMsg = document.createElement('div');
        dashboardMsg.className = 'text-center text-gray-500 p-6';
        dashboardMsg.innerHTML = 'لا توجد بيانات مبيعات لعرضها حالياً.';
        if (dashboard) dashboard.appendChild(dashboardMsg);
    }
    var navItems = document.getElementsByClassName('bottom-nav-item');
    for (var j = 0; j < navItems.length; j++) {
        navItems[j].classList.remove('active');
        if (navItems[j].getAttribute('data-page') === 'dashboard') {
            navItems[j].classList.add('active');
        }
    }
    // تفعيل أيقونات Lucide
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
    // Render in batches to avoid blocking the main thread and freezing UI on large lists.
    // We'll compute `BATCH_SIZE` dynamically based on list length to balance latency vs throughput.
    let BATCH_SIZE = 6;
    // token to allow cancelling in-flight renders when data updates
    window.__salesRenderToken = (window.__salesRenderToken || 0) + 1;
    const __thisRenderToken = window.__salesRenderToken;
    let renderIndex = 0;

    // Robustly resolve the sales list and filtered sales source.
    const salesList = (function(){
        if (typeof window.salesList !== 'undefined') return window.salesList;
        const byId = document.getElementById('sales-list') || document.getElementById('salesList') || document.getElementById('sales-list-container');
        if (byId) return byId;
        const byClass = document.querySelector('.sales-list') || document.querySelector('.sales-list-container');
        if (byClass) return byClass;
        // fallback to a safe container so appendChild won't throw
        const fallback = document.createElement('div');
        document.body.appendChild(fallback);
        return fallback;
    })();

    // local copy of filtered sales: prefer explicit global `filteredSales`, then `window.state.sales`, then empty array
    const filteredSales = (function(){
        try {
            if (typeof window.filteredSales !== 'undefined' && Array.isArray(window.filteredSales)) return window.filteredSales;
            if (window.state && Array.isArray(window.state.sales)) return window.state.sales;
        } catch(e){}
        return [];
    })();

    // Dynamic batch size: small lists render faster per-batch, large lists use larger batches but capped.
    try {
        const n = Array.isArray(filteredSales) ? filteredSales.length : (Array.isArray(window.state && window.state.sales) ? window.state.sales.length : 0);
        if (n <= 50) BATCH_SIZE = 8;
        else if (n <= 200) BATCH_SIZE = 12;
        else BATCH_SIZE = 20;
    } catch(e){ BATCH_SIZE = 6; }

    // Safe fallback for review state markers used in templates
    const reviewState = (function(){
        try {
            if (typeof window.reviewState !== 'undefined' && window.reviewState && typeof window.reviewState === 'object') return window.reviewState;
            if (typeof window.__reviewState !== 'undefined' && window.__reviewState && typeof window.__reviewState === 'object') return window.__reviewState;
        } catch(e){}
        return {};
    })();

    function createSaleElement(sale, idx) {
        const customer = findCustomer(sale.customerId);
        const isReturn = sale.total < 0;
        const badgeText = isReturn ? 'مرتجع' : 'فاتورة';
        const badgeColor = isReturn ? 'bg-red-600 text-white' : 'bg-blue-600 text-white';
        const saleBgColor = isReturn ? 'bg-red-50 border-red-200' : `${(idx % 2 === 0) ? 'bg-white' : 'bg-gray-50'} border-gray-200`;
        const totalAmountClass = isReturn ? 'text-red-700' : 'text-blue-700';

        const itemsList = (sale.items || []).map(item => {
            const product = findProduct(item.productId);
            const itemName = product ? product.name : 'منتج محذوف';
            const itemTotal = item.quantity * (item.price || 0) * (1 - (item.discountPercent || 0) / 100);
            const itemCode = product ? product.id : 'N/A';
            const itemTotalColorClass = isReturn ? 'text-red-700' : 'text-pink-700';
            return `<tr class="text-xs border-b border-gray-100 last:border-b-0"><td class="text-right px-3 py-2 font-semibold sale-item-name-cell">${itemName}</td><td class="text-center px-3 py-2 sale-item-code-cell">${itemCode}</td><td class="text-center px-3 py-2 sale-item-qty-cell font-bold ${item.quantity < 0 ? 'text-red-600' : 'text-gray-800'}">${item.quantity}</td><td class="text-center px-3 py-2 sale-item-price-cell">${formatCurrency(item.price)}</td><td class="text-center px-3 py-2 font-bold sale-item-total-cell ${itemTotalColorClass}">${formatCurrency(itemTotal)}</td></tr>`;
        }).join('');

        const customerRequiresFiling = customer?.requiresTaxFiling;
        const customerTaxNumber = customer ? (customer.taxNumber || 'لا يوجد') : 'لا يوجد';
        const taxNumberHtml = `<div class="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md text-center w-full">\n                           <p class="text-xs text-gray-700 font-semibold">الرقم الضريبي:</p>\n                           <p class="text-sm font-bold text-gray-900">${customerTaxNumber}</p>\n                           <a href="https://invoicing.eta.gov.eg/" target="_blank" class="text-xs text-blue-600 hover:underline">المنظومة الإلكترونية</a>\n\n                       </div>`;

        const el = document.createElement('div');
        el.className = `${saleBgColor} p-4 rounded-xl border shadow-md mb-6 transition duration-300 hover:shadow-lg`;
        el.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-4 gap-4">\n                    <div class="col-span-3">\n                        <p class="font-bold text-lg text-gray-800">\n                            ${customer ? customer.name : 'عميل محذوف'} \n                            <span class="text-xs font-semibold px-2 py-1 rounded-full ${badgeColor} mr-2">${badgeText}</span>\n                            ${customerRequiresFiling ? `<i data-lucide="file-text" class="w-4 h-4 inline text-orange-500 mr-2" title="يتطلب رفع ضريبي"></i>` : ''}\n                        </p>\n                        <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">` +
            // حذف التكرار: تعريف badgeColor موجود بالفعل في الأعلى
                    `<span class="invoice-review-span" data-id="${sale.id}" title="اضغط للتلوين">` +
                        `<i data-lucide="hash" class="w-3 h-3 inline ml-1"></i> رقم الفاتورة: ` +
                        `<span class="invoice-cell text-red-600 font-bold ${reviewState[sale.id] || ''}">${sale.invoiceNumber || 'N/A'}</span>` +
                    `</span>` +
                    `<span><i data-lucide="user" class="w-3 h-3 inline ml-1"></i> المندوب: <span class="text-blue-600 font-semibold">${sale.repName || 'غير محدد'}</span></span>` +
                    `</div>\n                        <div class="overflow-x-auto mt-4 max-h-48 overflow-y-auto border border-gray-200 rounded-lg shadow-inner">\n                            <table class="sale-items-table min-w-full">\n                                <thead>\n                                    <tr class="text-xs">\n                                        <th class="w-2/6 px-3 py-2 text-right">الصنف</th>\n                                        <th class="w-1/6 px-3 py-2 text-center">الكود</th>\n                                        <th class="w-1/6 text-center px-3 py-2">الكمية</th>\n                                        <th class="w-1/6 text-center px-3 py-2">السعر</th>\n                                        <th class="w-1/6 text-center px-3 py-2">الإجمالي</th>\n                                    </tr>\n                                </thead>\n                                <tbody>${itemsList}</tbody>\n                            </table>\n                        </div>\n                        <div class="flex gap-4 mt-3 pt-3 border-t">\n                            <button data-id="${sale.id}" class="edit-sale-btn text-sm flex items-center gap-1 text-blue-600 hover:text-blue-800"><i data-lucide="edit" class="w-4 h-4"></i> تعديل</button>\n                            <button data-id="${sale.id}" class="delete-sale-btn text-sm flex items-center gap-1 text-red-600 hover:text-red-800"><i data-lucide="trash-2" class="w-4 h-4"></i> حذف</button>\n                        </div>\n                    </div>\n                    <div class="col-span-1 border-r pr-4 flex flex-col justify-start items-center text-center pt-2">\n                        <h4 class="text-sm font-semibold text-gray-600 mb-1">الإجمالي النهائي</h4>\n                        <p class="font-bold text-2xl ${totalAmountClass}">${formatCurrency(sale.total)}</p>\n                        <div class="flex flex-col gap-1 items-center mt-3">\n                            ${getTaxStatusBadge(sale)}\n                            ${getStatusBadge(sale.status)}\n                        </div>\n                        ${taxNumberHtml} <!-- NEW: Inserted variable here -->\n                        ${sale.discount > 0 ? `<div class="mt-2 text-xs text-red-600">خصم: ${sale.discount}%</div>` : ''}\n                    </div>\n                </div>`;
        // Insert action buttons (print/share/bt)
        try {
            const sideCol = el.querySelector('.col-span-1.border-r.pr-4.flex.flex-col.justify-start.items-center.text-center.pt-2');
            if (sideCol) {
                // مجموعة أزرار الطباعة والصورة والبلوتوث
                const btnGroup = document.createElement('div');
                btnGroup.className = 'flex flex-row gap-2 mb-2 justify-center';
                
                // زر الطباعة العادية (WiFi)
                const printBtnEl = document.createElement('button');
                printBtnEl.setAttribute('data-id', sale.id);
                printBtnEl.className = 'print-sale-btn bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1';
                printBtnEl.innerHTML = '<i data-lucide="printer" class="w-4 h-4"></i> طباعة';
                printBtnEl.addEventListener('click', async function(ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    // Show preview then print
                    let confirmed = false;
                    await new Promise(resolve => {
                        if (typeof showPrintPreviewModal === 'function') {
                            showPrintPreviewModal(sale, () => {
                                confirmed = true;
                                resolve();
                            });
                        } else {
                            confirmed = true;
                            resolve();
                        }
                    });
                    if (confirmed && typeof window.printSaleById === 'function') {
                        // Call print without showing preview again (already shown)
                        try {
                            const html = typeof buildReceiptHtml58mm === 'function' ? buildReceiptHtml58mm(sale) : '';
                            const w = window.open('', '', 'width=420,height=640');
                            if (!w) { alert('يرجى السماح بالنوافذ المنبثقة للطباعة'); return; }
                            w.document.open();
                            w.document.write(html);
                            w.document.close();
                            const doPrint = () => { try { w.focus(); w.print(); } catch(_){} };
                            const closeAndReturn = () => { try { w.close(); window.focus(); } catch(_){} };
                            if ('onafterprint' in w) { w.onafterprint = closeAndReturn; } else { setTimeout(closeAndReturn, 1200); }
                            if ('onload' in w) { w.onload = () => setTimeout(doPrint, 100); } else { setTimeout(doPrint, 300); }
                        } catch(e){ console.warn('Print failed', e); }
                    }
                });
                sideCol.appendChild(printBtnEl);
                
                // زر البلوتوث
                const btBtnEl = document.createElement('button');
                btBtnEl.setAttribute('data-id', sale.id);
                btBtnEl.className = 'bt-print-sale-btn bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1';
                btBtnEl.innerHTML = '<i data-lucide="bluetooth" class="w-4 h-4"></i> بلوتوث';
                btBtnEl.addEventListener('click', function(ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (typeof performBluetoothPrint === 'function') {
                        performBluetoothPrint(sale);
                    } else {
                        alert('دالة الطباعة عبر البلوتوث غير متوفرة');
                    }
                });
                sideCol.appendChild(btBtnEl);
                
                if (typeof updateIcons === 'function') { updateIcons(); }
                
                // زر الصورة (Share)
                const shareBtnEl = document.createElement('button');
                shareBtnEl.setAttribute('data-id', sale.id);
                shareBtnEl.className = 'share-sale-image-btn bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1';
                shareBtnEl.innerHTML = '<i data-lucide="share-2" class="w-4 h-4"></i> صورة';
                shareBtnEl.addEventListener('click', async function(ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (typeof window.shareSaleReceiptImage === 'function') {
                        await window.shareSaleReceiptImage(sale.id);
                    } else {
                        alert('دالة المشاركة غير متوفرة');
                    }
                });
                sideCol.appendChild(shareBtnEl);
                
                // أضف المجموعة للعمود الجانبي
                sideCol.insertBefore(btnGroup, sideCol.firstChild);
                // تحديث الأيقونات بعد إضافة الأزرار
                if (typeof updateIcons === 'function') { updateIcons(); }
            }
        } catch(e){ console.warn('insert buttons failed', e); }

        // review pending UI
        try {
            const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
            if (sale && String(sale.reviewStatus||'').toLowerCase() === 'pending') {
                try { el.classList.add('ring-2','ring-yellow-300'); } catch(_){ }
                const statusArea = el.querySelector('.flex.flex-col.gap-1.items-center.mt-3');
                if (statusArea) {
                    const pendingTag = document.createElement('span');
                    pendingTag.className = 'text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5';
                    pendingTag.innerHTML = '<i data-lucide="clock" class="w-3 h-3 inline ml-1"></i> قيد المراجعة';
                    statusArea.appendChild(pendingTag);
                }
                if (role === 'admin') {
                    const actions = el.querySelector('.flex.gap-4.mt-3.pt-3.border-t');
                    if (actions) {
                        const approve = document.createElement('button');
                        approve.setAttribute('data-id', sale.id);
                        approve.className = 'review-sale-btn text-sm flex items-center gap-1 text-green-700 hover:text-green-900';
                        approve.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i> اعتماد';
                        actions.appendChild(approve);
                    }
                }
            }
        } catch(e){ }

        return el;
    }

    function renderBatch(){
        // cancel if a new render started
        if (window.__salesRenderToken !== __thisRenderToken) return;
        const frag = document.createDocumentFragment();
        for (let k=0; k<BATCH_SIZE && renderIndex<filteredSales.length; k++, renderIndex++){
            const saleEl = createSaleElement(filteredSales[renderIndex], renderIndex);
            frag.appendChild(saleEl);
        }
        try { salesList.appendChild(frag); } catch(e){ console.warn('append to salesList failed', e); }
        // إضافة البانر بعد كل عملية رسم للفواتير ليبقى دائماً
        // ...existing code...
        // Schedule next batch
        if (renderIndex < filteredSales.length) {
            if (window.requestIdleCallback) requestIdleCallback(renderBatch, { timeout: 200 }); else setTimeout(renderBatch, 50);
        } else {
            try { if (typeof window.scheduleRender === 'function') window.scheduleRender('updateIcons', function(){ try{ updateIcons(); }catch(_){} }); else updateIcons(); } catch(_){ }
        }
    }

    // Kick off batched rendering. Clear container first to avoid duplicates.
    try { salesList.innerHTML = ''; } catch(e){}
    renderBatch();
});

// Simple test print for Bluetooth debugging - tries multiple UUID combinations
async function performSimpleBluetoothTest() {
    const processingMsg = document.createElement('div');
    processingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:30px;borderRadius:10px;zIndex:50001;boxShadow:0 4px 6px rgba(0,0,0,0.2);textAlign:center;';
    processingMsg.innerHTML = `<div style="font-size:18px;font-weight:bold;margin-bottom:15px;">جاري البحث عن البرينتر...</div><div style="font-size:14px;color:#666;">اختبار بسيط</div>`;
    document.body.appendChild(processingMsg);
    
    // Try multiple common Xprinter UUIDs
    const uuidCombos = [
        { service: '000018f0-0000-1000-8000-00805f9b34fb', char: '00002af1-0000-1000-8000-00805f9b34fb', name: 'BLE' },
        { service: '0000ff00-0000-1000-8000-00805f9b34fb', char: '0000ff01-0000-1000-8000-00805f9b34fb', name: 'FF00' },
        { service: '49535343-fe7d-4ae5-8fa9-9fafd205e455', char: '49535343-8841-43f4-a8d4-ecbe34729bb3', name: 'HM-10' }
    ];
    
    try {
        // Request device without UUID filter first (accept any printer)
        processingMsg.innerHTML = `<div style="font-size:18px;font-weight:bold;margin-bottom:15px;">اختر البرينتر من القائمة</div>`;
        
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: uuidCombos.map(u => u.service)
        });
        
        processingMsg.innerHTML = `<div style="font-size:18px;font-weight:bold;color:blue;">جاري الاتصال بـ ${device.name || 'البرينتر'}...</div>`;
        const server = await device.gatt.connect();
        
        let characteristic = null;
        let usedCombo = null;
        
        // Try each UUID combination
        for (const combo of uuidCombos) {
            try {
                processingMsg.innerHTML = `<div style="font-size:14px;color:#666;">جرب ${combo.name}...</div>`;
                const service = await server.getPrimaryService(combo.service);
                characteristic = await service.getCharacteristic(combo.char);
                usedCombo = combo;
                console.log('✓ Connected using:', combo.name);
                break;
            } catch (e) {
                console.log('✗ Failed:', combo.name, e.message);
                continue;
            }
        }
        
        if (!characteristic) {
            throw new Error('لم يُعثر على خدمة البرينتر. جرب برينتر آخر أو تأكد من توافق الجهاز');
        }
        
        processingMsg.innerHTML = `<div style="font-size:18px;font-weight:bold;color:green;">✓ متصل (${usedCombo.name})!<br>جاري الإرسال...</div>`;
        
        // Very simple ESC/POS - just ASCII text (no Arabic to avoid encoding issues)
        const escpos = [
            0x1B, 0x40, // Initialize
            0x1B, 0x61, 0x01, // Center align
            0x48, 0x65, 0x6C, 0x6C, 0x6F, // "Hello"
            0x0A, 0x0A,
            0x54, 0x65, 0x73, 0x74, // "Test"
            0x0A, 0x0A, 0x0A, 0x0A, 0x0A, 0x0A, // 6 line feeds
            0x1D, 0x56, 0x00 // Full cut
        ];
        
        const data = new Uint8Array(escpos);
        
        // Send in small chunks
        for (let i = 0; i < data.length; i += 20) {
            const chunk = data.slice(i, i + 20);
            await characteristic.writeValue(chunk);
            await new Promise(r => setTimeout(r, 100));
        }
        
        processingMsg.innerHTML = `<div style="font-size:18px;font-weight:bold;color:green;">✓ تم الإرسال بنجاح!<br><small>UUID: ${usedCombo.name}</small></div><div style="font-size:14px;color:#666;margin-top:10px;">تحقق من البرينتر - يجب طباعة "Hello Test"</div>`;
        setTimeout(() => {
            document.body.removeChild(processingMsg);
            try { device.gatt.disconnect(); } catch(_){}
        }, 5000);
        
    } catch (err) {
        console.error('BT Test Error:', err);
        processingMsg.innerHTML = `<div style="font-size:16px;font-weight:bold;color:red;">خطأ:</div><div style="font-size:12px;color:#666;margin:10px 0;">${err.message}</div><button onclick="this.parentElement.remove()" style="background:#3b82f6;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;">إغلاق</button>`;
    }
}

// Preview modal for Bluetooth print with paper size options
function showBluetoothPrintPreview(sale, callback) {
    // Just use the same print preview as WiFi
    showPrintPreviewModal(sale, callback);
}

// ESC/POS Bluetooth image printing for 80mm thermal printer (576px width)
async function performBluetoothPrint(sale) {
    // Show preview first using the same modal as WiFi printing
    let confirmed = false;
    await new Promise(resolve => {
        showPrintPreviewModal(sale, () => {
            confirmed = true;
            resolve();
        });
    });
    
    if (!confirmed) {
        console.log('User cancelled Bluetooth print');
        return;
    }
    
    // Show processing message
    const processingMsg = document.createElement('div');
    processingMsg.style.position = 'fixed';
    processingMsg.style.top = '50%';
    processingMsg.style.left = '50%';
    processingMsg.style.transform = 'translate(-50%, -50%)';
    processingMsg.style.background = '#fff';
    processingMsg.style.padding = '30px';
    processingMsg.style.borderRadius = '10px';
    processingMsg.style.zIndex = '50001';
    processingMsg.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
    processingMsg.style.textAlign = 'center';
    processingMsg.innerHTML = `
        <div style="font-size:18px;font-weight:bold;margin-bottom:15px;">جاري الاتصال بالبرينتر...</div>
        <div style="font-size:14px;color:#666;margin-bottom:15px;">يرجى التأكد من تشغيل البرينتر والبلوتوث</div>
        <div style="animation:spin 1s linear infinite;font-size:24px;" id="spinner">⏳</div>
    `;
    
    const backdrop = document.createElement('div');
    backdrop.style.position = 'fixed';
    backdrop.style.inset = '0';
    backdrop.style.background = 'rgba(0,0,0,0.3)';
    backdrop.style.zIndex = '50000';
    
    document.body.appendChild(backdrop);
    document.body.appendChild(processingMsg);
    
    // Add spinner animation
    const style = document.createElement('style');
    style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(style);
    
    try {
        // 1. Device Discovery & Connection
        const SERVICE_UUIDS = [
            '000018f0-0000-1000-8000-00805f9b34fb',
            '49535343-fe7d-4ae5-8fa9-9fafd205e455',
            '0000af30-0000-1000-8000-00805f9b34fb'
        ];
        const CHAR_UUIDS = [
            '00002af1-0000-1000-8000-00805f9b34fb',
            '0000ffe1-0000-1000-8000-00805f9b34fb',
            '0000af31-0000-1000-8000-00805f9b34fb',
            '49535343-8841-43f4-a8d4-ecbe34729bb3'
        ];

        let device, server, service, characteristic;

        try {
            device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: SERVICE_UUIDS
            });
            server = await device.gatt.connect();
        } catch (e) {
            throw new Error('تعذر الاتصال بجهاز البلوتوث: ' + e.message);
        }

        // 2. Characteristic Search Loop
        let found = false;
        for (const su of SERVICE_UUIDS) {
            try {
                service = await server.getPrimaryService(su);
                for (const cu of CHAR_UUIDS) {
                    try {
                        characteristic = await service.getCharacteristic(cu);
                        found = true;
                        break;
                    } catch (_) {}
                }
                if (found) break;
            } catch (_) {}
        }
        
        if (!found || !characteristic) {
            throw new Error('لم يتم العثور على خاصية الكتابة للطابعة.');
        }

        // 3. Update message to indicate printing
        processingMsg.innerHTML = `
            <div style="font-size:18px;font-weight:bold;margin-bottom:15px;">جاري إرسال الفاتورة للطابعة...</div>
            <div style="font-size:14px;color:#666;">يرجى الانتظار</div>
        `;

        // Build the same 80mm HTML used for WiFi printing and render as image
        // Create a hidden container and inject the receipt HTML
        const temp = document.createElement('div');
        temp.style.position = 'fixed';
        temp.style.left = '-10000px';
        temp.style.top = '0';
        temp.style.width = '600px';
        temp.style.background = '#ffffff';
        temp.style.padding = '0';
        temp.style.margin = '0';
        try { temp.innerHTML = (typeof buildReceiptHtml58mm === 'function') ? buildReceiptHtml58mm(sale) : ''; } catch(_){}
        const root = temp.querySelector('.r') || temp;
        // Ensure 576px width for 80mm printers (printable area ~72mm, device 576px)
        root.style.width = '576px';
        root.style.maxWidth = '576px';
        root.style.fontFamily = 'Cairo, Arial, sans-serif'; // تأكيد استخدام فونت Cairo
        document.body.appendChild(temp);

        // Use html2canvas to render the receipt as an image
        // Scale 1.5 for better Arabic text clarity on thermal printer
        let canvas;
        try {
            // Wait for fonts to load before rendering
            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }
            canvas = await html2canvas(root, { 
                scale: 1.5, // زيادة الدقة للنص العربي
                backgroundColor: '#ffffff', 
                width: 576, 
                useCORS: true,
                allowTaint: false,
                logging: false,
                imageTimeout: 0,
                removeContainer: true
            });
        } catch (e) {
            try { temp.remove(); } catch(_){}
            throw new Error('فشل تحويل الإيصال إلى صورة: ' + e.message);
        }
        try { temp.remove(); } catch(_){}

        // Convert canvas to monochrome bitmap ESC/POS
        function canvasToEscPos(canvas) {
            const width = canvas.width;
            const height = canvas.height;
            const imgData = canvas.getContext('2d').getImageData(0, 0, width, height).data;
            const bytesPerLine = Math.ceil(width / 8);
            let escpos = [];
            escpos.push(0x1B, 0x40); // Initialize printer
            
            // GS v 0 - رسم الصورة (أفضل للطابعات الصينية)
            escpos.push(0x1D, 0x76, 0x30, 0x00, bytesPerLine & 0xFF, (bytesPerLine >> 8) & 0xFF, height & 0xFF, (height >> 8) & 0xFF);
            
            // تحويل الصورة إلى bitmap مع عتبة أفضل للنص العربي (threshold 200)
            for (let y = 0; y < height; y++) {
                for (let xByte = 0; xByte < bytesPerLine; xByte++) {
                    let byte = 0;
                    for (let bit = 0; bit < 8; bit++) {
                        const x = xByte * 8 + bit;
                        if (x < width) {
                            const idx = (y * width + x) * 4;
                            const r = imgData[idx], g = imgData[idx + 1], b = imgData[idx + 2];
                            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                            // عتبة 200 بدلاً من 180 لوضوح أفضل للنص العربي
                            if (luminance < 200) byte |= (1 << (7 - bit));
                        }
                    }
                    escpos.push(byte);
                }
            }
            // ESC/POS commands for XP-P323B: Extra line feeds + Full cut
            escpos.push(0x0A, 0x0A, 0x0A, 0x0A, 0x0A, 0x0A); // 6 line feeds to advance paper
            escpos.push(0x1D, 0x56, 0x00); // Full cut (GS V 0)
            return new Uint8Array(escpos);
        }

        const escposData = canvasToEscPos(canvas);

        // 4. Stability Fixes (Chunking and Delay) - optimized for XP-P323B
        async function sendChunks(data, chunkSize = 512, delayMs = 50) {
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                try {
                    await characteristic.writeValue(chunk);
                } catch (writeErr) {
                    console.warn('Write chunk failed:', writeErr);
                    throw writeErr; // propagate error to retry or abort
                }
                await new Promise(res => setTimeout(res, delayMs));
            }
        }

        try {
            await sendChunks(escposData);
            
            // Close connection after sending
            try { 
                if (characteristic) characteristic.service.device.gatt.disconnect();
                if (server) server.disconnect(); 
            } catch (_) {}
            
            processingMsg.innerHTML = `
                <div style="font-size:18px;font-weight:bold;margin-bottom:15px;color:#059669;">✅ تم إرسال الفاتورة بنجاح</div>
                <div style="font-size:14px;color:#666;">تحقق من البرينتر لخروج الورقة</div>
            `;
            setTimeout(() => {
                backdrop.remove();
                processingMsg.remove();
            }, 3000);
        } catch (e) {
            throw new Error('فشل إرسال البيانات للطابعة: ' + e.message);
        }

        try { server.disconnect(); } catch (_) {}
    } catch (e) {
        console.error('Bluetooth print error:', e);
        processingMsg.innerHTML = `
            <div style="font-size:18px;font-weight:bold;margin-bottom:15px;color:#dc2626;">❌ خطأ في الطباعة</div>
            <div style="font-size:14px;color:#666;margin-bottom:15px;">${e.message}</div>
            <button id="close-error-msg" style="background:#3b82f6;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;">إغلاق</button>
        `;
        document.getElementById('close-error-msg').onclick = () => {
            backdrop.remove();
            processingMsg.remove();
        };
    }
}

// Expose function to global scope
window.performBluetoothPrint = performBluetoothPrint;
window.performSimpleBluetoothTest = performSimpleBluetoothTest;

// دالة لحفظ الهدف الشهري في Firestore
async function saveSalesTargetToCloud(newTarget) {
    if (!window.db || !window.auth || !window.auth.currentUser) {
        alert('يجب تسجيل الدخول لحفظ الهدف في السحابة');
        return;
    }
    try {
        await window.db.collection('settings').doc('salesTarget').set({ value: newTarget, updatedBy: window.auth.currentUser.email, updatedAt: new Date() });
        // بعد الحفظ: جلب الهدف الجديد وتحديث الصفحة الرئيسية
        await window.fetchSalesTargetFromCloud();
        // تحديث عرض الهدف في الصفحة الرئيسية
        if (typeof updateDashboardTarget === 'function') {
            updateDashboardTarget();
        } else {
            // تحديث العنصر مباشرة إذا لم توجد دالة مخصصة
            const targetDisplay = document.getElementById('target-amount-display');
            if (targetDisplay && window.state && window.state.settings) {
                targetDisplay.textContent = window.state.settings.salesTarget + ' ج.م';
            }
        }
        alert('تم حفظ الهدف الشهري في السحابة بنجاح وسيظهر في الصفحة الرئيسية.');
    } catch (e) {
        alert('فشل حفظ الهدف في السحابة: ' + e.message);
    }
}
window.saveSalesTargetToCloud = saveSalesTargetToCloud;

// دالة لجلب الهدف الشهري من Firestore عند تحميل الصفحة
async function fetchSalesTargetFromCloud() {
    if (!window.db) return;
    try {
        const doc = await window.db.collection('settings').doc('salesTarget').get();
        if (doc.exists) {
            window.state = window.state || {};
            window.state.settings = window.state.settings || {};
            window.state.settings.salesTarget = doc.data().value;
            // تحديث الهدف في الصفحة الرئيسية دائماً بعد الجلب
            const targetDisplay = document.getElementById('target-amount-display');
            if (targetDisplay && window.state && window.state.settings) {
                targetDisplay.textContent = window.state.settings.salesTarget + ' ج.م';
            }
        }
    } catch (e) {
        console.warn('فشل جلب الهدف الشهري من السحابة:', e);
    }
}
window.fetchSalesTargetFromCloud = fetchSalesTargetFromCloud;

// جلب الهدف الشهري عند تحميل الصفحة الرئيسية
window.addEventListener('load', function() {
    fetchSalesTargetFromCloud();
});
